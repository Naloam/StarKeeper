import type { Collection, GistMetadata, RepoMetadata, ShareConfig } from "../types";
import { readCache, writeCache } from "./browser-cache.service";
import {
  createGist,
  fetchGist,
  listOwnedGists,
  METADATA_FILE,
  readGistJson,
  statusOf,
  writeGistFiles,
} from "./gist.service";

const DESCRIPTION = "StarKeeper metadata (managed by app)";
const RETIRED_FILE = "starkeeper-retired-v04.json";
const BACKUP_FILE = "starkeeper-backup-before-v04.json";
const JOURNAL_PREFIX = "starkeeper-edits-v04-";
const CACHE_KEY = "metadata-v04:";
export const METADATA_QUEUE_EVENT = "starkeeper-metadata-queue";

type RepoPatch = { [K in keyof RepoMetadata]?: RepoMetadata[K] | null };
export type MetadataChange =
  | { kind: "repos"; changes: Record<string, RepoPatch> }
  | { kind: "collection-create"; collection: Collection }
  | { kind: "collection-delete"; id: string }
  | { kind: "collection-add"; id: string; repoId: number; at: string }
  | { kind: "share"; config: ShareConfig }
  | { kind: "repo-aliases"; aliases: { id: number; fullName: string; key: string }[] };

type QueuedChange = { id: string; change: MetadataChange; at: string };
const locks = new Map<string, Promise<unknown>>();
const lastQueuedAt = new Map<string, number>();

function serialized<T>(key: string, task: () => Promise<T>): Promise<T> {
  if (navigator.locks) return navigator.locks.request(`starkeeper:${key}`, task);
  const previous = locks.get(key) ?? Promise.resolve();
  const operation = previous.catch(() => undefined).then(task);
  locks.set(key, operation);
  const cleanup = () => {
    if (locks.get(key) === operation) locks.delete(key);
  };
  operation.then(cleanup, cleanup);
  return operation;
}

export class DuplicateMetadataGists extends Error {
  constructor(public readonly candidates: { id: string; updatedAt?: string }[]) {
    super("找到多个 StarKeeper Gist。请确认要使用的原数据，应用不会自动合并或删除。");
  }
}

export class LegacySharingGist extends Error {
  constructor() {
    super("旧分享可能已暴露当前 Gist 地址。请迁移到新的元数据 Gist，再继续同步。");
  }
}

class RetiredMetadataGist extends Error {}

function needsRotation(metadata: GistMetadata, id: string) {
  return (
    !metadata.legacySharingRetired &&
    (metadata.shareConfig?.shareId === id || !!metadata.sharedStars?.length)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function repoKey(key: string) {
  return /^([1-9]\d*|[\w.-]+\/[\w.-]+)$/.test(key);
}

export function normalizeMetadata(value: unknown): GistMetadata {
  if (!isRecord(value)) throw new Error("元数据格式无效，已停止写入");
  if (isRecord(value.repositories) && typeof value.version === "string")
    return value as unknown as GistMetadata;

  // A legacy writer sometimes saved a bare repository map.
  const entries = Object.entries(value);
  if (entries.length && entries.every(([id, entry]) => repoKey(id) && isRecord(entry))) {
    return { version: "1.0", repositories: value as Record<string, RepoMetadata>, updatedAt: "" };
  }
  throw new Error("无法识别元数据。请从 Gist 修订历史恢复后重试");
}

async function readRemote(token: string, id: string, ownerId?: number) {
  const gist = await fetchGist(token, id);
  if (gist.public || (ownerId !== undefined && gist.owner?.id !== ownerId)) {
    throw new Error("请使用当前账号拥有的未列出 StarKeeper 元数据 Gist");
  }
  if (gist.files?.[RETIRED_FILE]) throw new RetiredMetadataGist("此元数据 Gist 已退役");
  const raw = await readGistJson(gist.files?.[METADATA_FILE]);
  const base = normalizeMetadata(raw);
  const entries = Object.entries(gist.files ?? {}).filter(([name]) =>
    name.startsWith(JOURNAL_PREFIX),
  );
  const journals = Object.fromEntries(
    await Promise.all(
      entries.map(async ([name, file]) => {
        const value = await readGistJson(file);
        if (!Array.isArray(value)) throw new Error("无法读取元数据编辑日志");
        return [name, value as QueuedChange[]] as const;
      }),
    ),
  );
  const metadata = replayJournals(base, Object.values(journals).flat());
  return { gist, raw, base, metadata, journals };
}

export async function findOrCreateMetadataGist(
  token: string,
  ownerId: number,
  preferred?: string | null,
) {
  return serialized(`metadata-discovery:${ownerId}`, async () => {
    const key = `starkeeper-gist:${ownerId}`;
    const selected = preferred || localStorage.getItem(key);
    if (selected && !navigator.onLine) return selected;
    if (selected) {
      try {
        await readRemote(token, selected, ownerId);
        localStorage.setItem(key, selected);
        return selected;
      } catch (error) {
        if (statusOf(error) !== 404 && !(error instanceof RetiredMetadataGist)) throw error;
      }
    }

    const candidates = (await listOwnedGists(token))
      .filter(
        (gist) =>
          gist.owner?.id === ownerId &&
          !!gist.files?.[METADATA_FILE] &&
          !gist.files?.[RETIRED_FILE],
      )
      .map((gist) => ({ id: gist.id, updatedAt: gist.updated_at }));
    if (candidates.length > 1) throw new DuplicateMetadataGists(candidates);
    if (candidates.length === 1) {
      const id = candidates[0].id;
      await readRemote(token, id, ownerId);
      localStorage.setItem(key, id);
      return id;
    }
    const now = new Date().toISOString();
    const id = await createGist(token, DESCRIPTION, METADATA_FILE, {
      version: "1.0",
      repositories: {},
      createdAt: now,
      updatedAt: now,
    });
    localStorage.setItem(key, id);
    return id;
  });
}

function queueKey(id: string) {
  return `starkeeper-metadata-queue:${id}`;
}

function readQueue(id: string): QueuedChange[] {
  const value: unknown = JSON.parse(localStorage.getItem(queueKey(id)) ?? "[]");
  if (!Array.isArray(value)) throw new Error("本地待同步日志格式异常");
  return value as QueuedChange[];
}

function writeQueue(id: string, queue: QueuedChange[]) {
  if (queue.length) localStorage.setItem(queueKey(id), JSON.stringify(queue));
  else localStorage.removeItem(queueKey(id));
  window.dispatchEvent(new Event(METADATA_QUEUE_EVENT));
}

export function pendingMetadataCount(id: string | null) {
  try {
    return id ? readQueue(id).length : 0;
  } catch {
    return 0;
  }
}

function replayJournals(base: GistMetadata, changes: QueuedChange[]) {
  const ordered = Array.from(new Map(changes.map((change) => [change.id, change])).values()).sort(
    (a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id),
  );
  return applyMetadataChanges(base, ordered);
}

export function applyMetadataChanges(
  snapshot: GistMetadata,
  changes: QueuedChange[],
): GistMetadata {
  let metadata = { ...snapshot, repositories: { ...snapshot.repositories } };
  for (const { change, at } of changes) {
    switch (change.kind) {
      case "repos": {
        const repositories = metadata.repositories;
        for (const [id, patch] of Object.entries(change.changes)) {
          if (!/^[1-9]\d*$/.test(id)) throw new Error("仓库元数据需要 GitHub 数字 ID");
          const entry = { ...repositories[id], updatedAt: at };
          for (const [field, value] of Object.entries(patch)) {
            if (value === null) delete entry[field as keyof RepoMetadata];
            else Object.assign(entry, { [field]: value });
          }
          repositories[id] = entry;
        }
        metadata = { ...metadata, repositories, updatedAt: at };
        break;
      }
      case "repo-aliases": {
        const repositories = metadata.repositories;
        for (const { id, fullName, key } of change.aliases) {
          const legacy = repositories[key];
          const existing = repositories[id];
          if (!legacy || existing?.repoFullName) continue;
          const { embedding, embeddingUpdatedAt, ...fields } = legacy;
          repositories[id] = {
            ...fields,
            ...existing,
            repoFullName: fullName,
            legacyRepoKey: key,
            updatedAt: at,
          };
        }
        metadata = { ...metadata, repositories, updatedAt: at };
        break;
      }
      case "collection-create":
        if (!metadata.collections?.some((item) => item.id === change.collection.id)) {
          metadata = {
            ...metadata,
            collections: [...(metadata.collections ?? []), change.collection],
            updatedAt: at,
          };
        }
        break;
      case "collection-delete":
        metadata = {
          ...metadata,
          collections: (metadata.collections ?? []).filter((item) => item.id !== change.id),
          updatedAt: at,
        };
        break;
      case "collection-add":
        metadata = {
          ...metadata,
          collections: (metadata.collections ?? []).map((item) =>
            item.id === change.id && !item.repoIds.includes(change.repoId)
              ? { ...item, repoIds: [...item.repoIds, change.repoId], updatedAt: change.at }
              : item,
          ),
          updatedAt: at,
        };
        break;
      case "share":
        metadata = { ...metadata, shareConfig: change.config, updatedAt: at };
        break;
    }
  }
  return metadata;
}

async function cacheRemote(id: string, metadata: GistMetadata) {
  await writeCache(CACHE_KEY + id, metadata).catch(() => undefined);
}

function isNetworkError(error: unknown) {
  return !navigator.onLine || error instanceof TypeError || statusOf(error) === 0;
}

export async function loadMetadataFromGist(token: string, id: string, ownerId?: number) {
  return serialized(id, async () => {
    let metadata: GistMetadata | undefined;
    try {
      if (navigator.onLine) {
        metadata = (await readRemote(token, id, ownerId)).metadata;
        await cacheRemote(id, metadata);
      }
    } catch (error) {
      if (!isNetworkError(error)) throw error;
    }
    metadata ??= await readCache<GistMetadata>(CACHE_KEY + id);
    if (!metadata) throw new Error("没有可用的元数据缓存，请联网后重试");
    return applyMetadataChanges(metadata, readQueue(id));
  });
}

let tabJournal: string | undefined;

function journalName() {
  // Web Locks serialize same-browser writers. Other browsers use independent tab journals.
  const key = "starkeeper-edit-device";
  if (!navigator.locks) return JOURNAL_PREFIX + (tabJournal ??= crypto.randomUUID()) + ".json";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return JOURNAL_PREFIX + id + ".json";
}

async function commitChanges(token: string, id: string, queue: QueuedChange[], ownerId?: number) {
  const latest = await readRemote(token, id, ownerId);
  if (needsRotation(latest.base, id)) throw new LegacySharingGist();
  const acknowledged = new Set(
    Object.values(latest.journals)
      .flat()
      .map((entry) => entry.id),
  );
  const pending = queue.filter((entry) => !acknowledged.has(entry.id));
  if (!pending.length) {
    await cacheRemote(id, latest.metadata);
    return latest.metadata;
  }
  const name = journalName();
  const entries = [...(latest.journals[name] ?? []), ...pending];
  const files: Record<string, { content: string }> = {
    [name]: { content: JSON.stringify(entries) },
  };
  if (
    !latest.gist.files?.[BACKUP_FILE] &&
    (latest.raw !== latest.base || queue.some((entry) => entry.change.kind === "repo-aliases"))
  ) {
    files[BACKUP_FILE] = { content: JSON.stringify(latest.raw) };
  }
  await writeGistFiles(token, id, files);
  const verified = await readRemote(token, id, ownerId);
  const committed = new Set((verified.journals[name] ?? []).map((entry) => entry.id));
  if (pending.some((entry) => !committed.has(entry.id))) {
    throw Object.assign(new Error("GitHub 尚未确认编辑日志"), { status: 503 });
  }
  await cacheRemote(id, verified.metadata);
  return verified.metadata;
}

export async function mutateMetadata(
  token: string,
  id: string,
  changes: MetadataChange[],
  ownerId?: number,
): Promise<{ metadata: GistMetadata; pending: boolean }> {
  if (!id || !token) throw new Error("请先连接 StarKeeper 元数据 Gist");
  return serialized(id, async () => {
    const previous = readQueue(id);
    const at = Math.max(
      Date.now(),
      (lastQueuedAt.get(id) ?? 0) + 1,
      Date.parse(previous[previous.length - 1]?.at ?? "") + 1 || 0,
    );
    if (changes.length) lastQueuedAt.set(id, at + changes.length - 1);
    const queue = [
      ...previous,
      ...changes.map((change, index) => ({
        id: crypto.randomUUID(),
        change,
        at: new Date(at + index).toISOString(),
      })),
    ];
    if (!queue.length)
      return { metadata: (await readRemote(token, id, ownerId)).metadata, pending: false };
    if (navigator.onLine) {
      writeQueue(id, queue);
      try {
        const metadata = await commitChanges(token, id, queue, ownerId);
        writeQueue(id, []);
        return { metadata, pending: false };
      } catch (error) {
        if (!isNetworkError(error) && ![429, 500, 502, 503, 504].includes(statusOf(error) ?? 0))
          throw error;
      }
    }
    const cached = await readCache<GistMetadata>(CACHE_KEY + id);
    if (!cached) throw new Error("没有可用的元数据缓存，请联网后重试");
    writeQueue(id, queue);
    return { metadata: applyMetadataChanges(cached, queue), pending: true };
  });
}

export function hasLegacySharingRisk(metadata: GistMetadata, id: string) {
  return needsRotation(metadata, id);
}

export async function rotateLegacyMetadata(token: string, id: string, ownerId: number) {
  return serialized(id, async () => {
    const original = await readRemote(token, id, ownerId);
    if (!needsRotation(original.base, id)) throw new Error("此 Gist 不需要迁移");
    const snapshot = applyMetadataChanges(original.metadata, readQueue(id));
    const { shareConfig: legacyShareConfig, ...data } = snapshot;
    const now = new Date().toISOString();
    const newId = await createGist(token, DESCRIPTION, METADATA_FILE, {
      ...data,
      legacyShareConfig,
      legacySharingRetired: true,
      updatedAt: now,
    });
    // Never record the new secret Gist ID in a previously shared file.
    await writeGistFiles(token, id, {
      [RETIRED_FILE]: { content: JSON.stringify({ retiredAt: now }) },
    });
    localStorage.setItem(`starkeeper-gist:${ownerId}`, newId);
    return newId;
  });
}

export function convertGistToStoreFormat(
  snapshot: GistMetadata,
  repos: { id: number; fullName: string }[] = [],
) {
  const repositories = Object.fromEntries(
    Object.entries(snapshot.repositories).filter(([key]) => !key.includes("/")),
  );
  const aliases = new Map(
    Object.keys(snapshot.repositories)
      .filter((key) => key.includes("/"))
      .map((key) => [key.toLowerCase(), key]),
  );
  for (const repo of repos) {
    const key = aliases.get(repo.fullName.toLowerCase());
    const numeric = repositories[repo.id];
    if (key && !numeric?.repoFullName)
      repositories[repo.id] = { ...snapshot.repositories[key], ...numeric };
    else if (numeric?.legacyRepoKey && !numeric.embedding) {
      const alias = snapshot.repositories[numeric.legacyRepoKey];
      if (alias?.embedding)
        repositories[repo.id] = {
          ...numeric,
          embedding: alias.embedding,
          embeddingUpdatedAt: alias.embeddingUpdatedAt,
        };
    }
  }
  return repositories;
}

// Keep old keys intact. Redirected names can be supplied by a validated GitHub lookup.
export function findLegacyAliases(
  snapshot: GistMetadata,
  repos: { id: number; fullName: string }[],
) {
  const byName = new Map(repos.map((repo) => [repo.fullName.toLowerCase(), repo]));
  return Object.keys(snapshot.repositories).flatMap((key) => {
    const repo = byName.get(key.toLowerCase());
    return repo && !snapshot.repositories[repo.id]?.repoFullName ? [{ ...repo, key }] : [];
  });
}
