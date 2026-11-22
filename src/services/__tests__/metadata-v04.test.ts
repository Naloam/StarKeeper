// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GistMetadata, StarredRepo } from "../../types";

const mock = vi.hoisted(() => {
  const files: Record<string, { content: string }> = {};
  return {
    files,
    cache: new Map<string, unknown>(),
    storage: new Map<string, string>(),
    list: vi.fn(),
    create: vi.fn(),
    fetch: vi.fn(),
    write: vi.fn(),
  };
});
vi.mock("../gist.service", () => ({
  METADATA_FILE: "starkeeper-metadata.json",
  SHARE_FILE: "starkeeper-share-v1.json",
  listOwnedGists: mock.list,
  createGist: mock.create,
  fetchGist: mock.fetch,
  writeGistFiles: mock.write,
  statusOf: (error: { status?: number }) => error.status,
  readGistJson: (file: { content: string }) => JSON.parse(file.content),
}));
vi.mock("../browser-cache.service", () => ({
  readCache: async (key: string) => mock.cache.get(key),
  writeCache: async (key: string, value: unknown) => {
    mock.cache.set(key, value);
  },
}));

import {
  applyMetadataChanges,
  convertGistToStoreFormat,
  DuplicateMetadataGists,
  findLegacyAliases,
  findOrCreateMetadataGist,
  LegacySharingGist,
  loadMetadataFromGist,
  mutateMetadata,
  pendingMetadataCount,
  rotateLegacyMetadata,
} from "../metadata.service";
import { buildShareSnapshot, getShareSnapshot } from "../share.service";

const filename = "starkeeper-metadata.json";
const oldShare = {
  isPublic: true,
  shareId: "legacy-elsewhere",
  shareTitle: "old",
  shareDescription: "",
  updatedAt: "",
};
const original: GistMetadata = {
  version: "1.0",
  updatedAt: "",
  repositories: {
    "old/project": { aiSummary: "legacy", notes: "original note", embedding: [1, 2] },
    "42": { tags: ["cv"] },
  },
  collections: [
    { id: "a", name: "Camera", description: "", repoIds: [], createdAt: "", updatedAt: "" },
  ],
  shareConfig: oldShare,
  sharedStars: [],
};
const remote = () => ({ files: { ...mock.files }, owner: { id: 1 }, public: false });

beforeEach(() => {
  vi.resetAllMocks();
  mock.storage.clear();
  mock.cache.clear();
  for (const key of Object.keys(mock.files)) delete mock.files[key];
  mock.files[filename] = { content: JSON.stringify(original) };
  mock.fetch.mockImplementation(async () => remote());
  mock.write.mockImplementation(async (_token, _id, changes) => Object.assign(mock.files, changes));
  vi.stubGlobal("navigator", { onLine: true });
  vi.stubGlobal("window", new EventTarget());
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => mock.storage.get(key) ?? null,
    setItem: (key: string, value: string) => mock.storage.set(key, value),
    removeItem: (key: string) => mock.storage.delete(key),
  });
});

describe("Gist metadata", () => {
  it("uses the verified persisted ID, otherwise treats old descriptions equally and refuses ambiguity", async () => {
    const candidates = [
      "StarKeeper metadata (managed by app)",
      "StarKeeper metadata (auto-managed by app)",
    ].map((description, index) => ({
      description,
      id: String(index),
      owner: { id: 1 },
      files: { [filename]: {} },
    }));
    mock.list.mockResolvedValue(candidates);
    await expect(findOrCreateMetadataGist("token", 1)).rejects.toBeInstanceOf(
      DuplicateMetadataGists,
    );
    await expect(findOrCreateMetadataGist("token", 1, "base")).resolves.toBe("base");
    await expect(findOrCreateMetadataGist("token", 1)).resolves.toBe("base");
    expect(mock.create).not.toHaveBeenCalled();
  });

  it("merges fields, collections, historical sharing fields and simultaneous writes to independent journal files", async () => {
    mock.write.mockImplementationOnce(async (_token, _id, changes) => {
      mock.files["starkeeper-edits-v04-second-device.json"] = {
        content: JSON.stringify([
          {
            id: "remote",
            at: "2020-01-01T00:00:00Z",
            change: { kind: "collection-add", id: "a", repoId: 42, at: "2020-01-01" },
          },
        ]),
      };
      Object.assign(mock.files, changes);
    });
    const results = await Promise.all([
      mutateMetadata(
        "token",
        "base",
        [{ kind: "repos", changes: { "42": { notes: "new note" } } }],
        1,
      ),
      mutateMetadata(
        "token",
        "base",
        [{ kind: "repos", changes: { "42": { aiSummary: "new summary" } } }],
        1,
      ),
    ]);
    const result = results[1].metadata;
    expect(result.repositories[42]).toMatchObject({
      tags: ["cv"],
      notes: "new note",
      aiSummary: "new summary",
    });
    expect(result.collections?.[0].repoIds).toEqual([42]);
    expect(result.shareConfig).toEqual(oldShare);
    expect(result.sharedStars).toEqual([]);
    expect(JSON.parse(mock.files[filename].content)).toEqual(original);
  });

  it("replays local offline patches against fresh remote state without overwriting independent edits", async () => {
    await loadMetadataFromGist("token", "base", 1);
    vi.stubGlobal("navigator", { onLine: false });
    const change = await mutateMetadata(
      "token",
      "base",
      [{ kind: "repos", changes: { "42": { notes: "offline" } } }],
      1,
    );
    expect(change.pending).toBe(true);
    expect(change.metadata.repositories[42].notes).toBe("offline");
    expect(pendingMetadataCount("base")).toBe(1);
    vi.stubGlobal("navigator", { onLine: true });
    mock.files["starkeeper-edits-v04-second-device.json"] = {
      content: JSON.stringify([
        {
          id: "remote",
          at: "2020-01-01T00:00:00Z",
          change: { kind: "repos", changes: { "42": { tags: ["from another device"] } } },
        },
      ]),
    };
    const replay = await mutateMetadata("token", "base", [], 1);
    expect(replay.metadata.repositories[42]).toMatchObject({
      tags: ["from another device"],
      notes: "offline",
    });
    expect(pendingMetadataCount("base")).toBe(0);
  });

  it("retains a legacy payload and persists numeric aliases across rename, transfer, edit and reload", async () => {
    const initial = convertGistToStoreFormat(original, [{ id: 42, fullName: "OLD/PROJECT" }]);
    expect(initial[42].aiSummary).toBe("legacy");
    const aliases = findLegacyAliases(original, [{ id: 42, fullName: "old/project" }]);
    const migrated = await mutateMetadata("token", "base", [{ kind: "repo-aliases", aliases }], 1);
    expect(migrated.metadata.repositories["old/project"].embedding).toEqual([1, 2]);
    expect(mock.files["starkeeper-backup-before-v04.json"]).toBeDefined();
    await mutateMetadata(
      "token",
      "base",
      [{ kind: "repos", changes: { "42": { aiSummary: "edited" } } }],
      1,
    );
    const reloaded = await loadMetadataFromGist("new-token", "base", 1);
    expect(
      convertGistToStoreFormat(reloaded, [{ id: 42, fullName: "other/renamed" }])[42].aiSummary,
    ).toBe("edited");
  });

  it("blocks further edits to a previously shared metadata address and copies only after explicit rotation", async () => {
    mock.files[filename] = {
      content: JSON.stringify({ ...original, shareConfig: { ...oldShare, shareId: "base" } }),
    };
    await expect(
      mutateMetadata(
        "token",
        "base",
        [{ kind: "repos", changes: { "42": { notes: "kept locally" } } }],
        1,
      ),
    ).rejects.toBeInstanceOf(LegacySharingGist);
    expect(mock.write).not.toHaveBeenCalled();
    mock.create.mockResolvedValue("new-secret-id");
    const newId = await rotateLegacyMetadata("token", "base", 1);
    expect(newId).toBe("new-secret-id");
    expect(mock.create.mock.calls[0][3]).toMatchObject({
      repositories: { "42": { notes: "kept locally" } },
      legacyShareConfig: { shareId: "base" },
      legacySharingRetired: true,
    });
    expect(JSON.stringify(mock.write.mock.calls[0])).not.toContain(newId);
  });

  it("only clears archive fields when restoring", () => {
    const restored = applyMetadataChanges(original, [
      {
        id: "restore",
        at: "2020-01-01",
        change: { kind: "repos", changes: { "42": { archived: null } } },
      },
    ]);
    expect(restored.repositories[42].tags).toEqual(["cv"]);
    expect(restored.collections).toEqual(original.collections);
  });

  it("leaves an unreadable or unowned Gist untouched", async () => {
    mock.fetch.mockResolvedValueOnce({ ...remote(), owner: { id: 2 } });
    await expect(loadMetadataFromGist("token", "base", 1)).rejects.toThrow();
    mock.files[filename] = { content: "{}" };
    await expect(
      mutateMetadata("token", "base", [{ kind: "repos", changes: { "42": { notes: "x" } } }], 1),
    ).rejects.toThrow();
    expect(mock.write).not.toHaveBeenCalled();
  });

  it("ignores legacy share URLs without fetching a Gist and allowlists only public fields", async () => {
    await expect(getShareSnapshot("abcde")).rejects.toThrow("旧版");
    expect(mock.fetch).not.toHaveBeenCalled();
    const repo = {
      id: 1,
      fullName: "owner/repo",
      owner: { login: "owner", avatarUrl: "" },
      isPrivate: false,
      visibility: "public",
      token: "secret",
      notes: "private note",
      embedding: [1],
      metadata: original,
    } as unknown as StarredRepo;
    const result = buildShareSnapshot(oldShare, [
      repo,
      { ...repo, id: 2, isPrivate: true },
      { ...repo, id: 3, visibility: "internal" },
    ]);
    expect(result.stars.map((item) => item.id)).toEqual([1]);
    expect(JSON.stringify(result)).not.toMatch(/private note|token|embedding|metadata/);
  });
});
