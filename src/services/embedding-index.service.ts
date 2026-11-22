import type { RepoMetadata, StarredRepo } from "../types";
import { generateSearchText } from "./semantic-search.service";
import { batchGenerateEmbeddings, EMBEDDING_MODEL } from "./dashscope.service";
import { readCache, writeCache } from "./browser-cache.service";

type Vector = { hash: string; model: string; vector: number[]; updatedAt: number };
type Entry = { key: string; id: number; text: string; hash: string };
export const EMBEDDING_BATCH_SIZE = 10;

export async function embeddingHash(text: string) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function isCurrentVector(entry: Vector | undefined, hash: string) {
  return (
    !!entry && entry.model === EMBEDDING_MODEL && entry.hash === hash && entry.vector.length > 0
  );
}

export function embeddingTimestamp(value: string | number | undefined) {
  const time = typeof value === "number" ? value : Date.parse(value ?? "");
  return Number.isFinite(time) ? time : 0;
}

export async function loadEmbeddingIndex(
  scope: string,
  repos: StarredRepo[],
  metadata: Record<string, RepoMetadata>,
  includeNotes: boolean,
) {
  const vectors: Record<number, number[]> = {};
  const pending: Entry[] = [];
  const publicRepos = repos.filter(
    (repo) => repo.isPrivate === false && repo.visibility === "public",
  );
  for (let offset = 0; offset < publicRepos.length; offset += 100) {
    await Promise.all(
      publicRepos.slice(offset, offset + 100).map(async (repo) => {
        const meta = metadata[repo.id] ?? {};
        const text = generateSearchText(repo, includeNotes ? meta : {}).slice(0, 2000);
        const hash = await embeddingHash(text);
        const key = `embedding:${scope}:${includeNotes ? "personal" : "public"}:${repo.id}`;
        const entry = await readCache<Vector>(key);
        if (isCurrentVector(entry, hash)) vectors[repo.id] = entry!.vector;
        else pending.push({ key, id: repo.id, text, hash });

        // Preserve legacy vectors separately. Their model and content hash cannot be verified.
        if (Array.isArray(meta.embedding)) {
          const legacyKey = `embedding:${scope}:legacy:${repo.id}`;
          if (!(await readCache(legacyKey))) {
            await writeCache(legacyKey, {
              vector: meta.embedding,
              updatedAt: embeddingTimestamp(meta.embeddingUpdatedAt),
            }).catch(() => undefined);
          }
        }
      }),
    );
  }
  pending.sort((a, b) => a.id - b.id);
  return { vectors, pending };
}

export async function indexEmbeddingBatch(entries: Entry[], vectors: Record<number, number[]>) {
  const embeddings = await batchGenerateEmbeddings(entries.map((entry) => entry.text));
  if (embeddings.length !== entries.length || embeddings.some((vector) => !vector?.length)) {
    throw new Error("向量服务返回了不完整结果");
  }
  const updatedAt = Date.now();
  await Promise.all(
    entries.map(async (entry, index) => {
      const vector = embeddings[index];
      await writeCache(entry.key, { hash: entry.hash, model: EMBEDDING_MODEL, vector, updatedAt });
      vectors[entry.id] = vector;
    }),
  );
}
