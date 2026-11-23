// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DiscoveryFilters, PublicRepo } from "../../types/discovery";

const mock = vi.hoisted(() => ({
  search: vi.fn(),
  get: vi.fn(),
  contents: vi.fn(),
  readme: vi.fn(),
  license: vi.fn(),
  advice: vi.fn(),
  clients: vi.fn(),
  cache: new Map<string, unknown>(),
}));
vi.mock("../github.service", () => ({
  createOctokitClient: (token?: string) => {
    mock.clients(token);
    return {
      search: { repos: mock.search },
      repos: { get: mock.get, getContent: mock.contents, getReadme: mock.readme },
      licenses: { getForRepo: mock.license },
    };
  },
}));
vi.mock("../dashscope.service", () => ({
  generateProjectAdvice: mock.advice,
  batchGenerateEmbeddings: vi.fn(),
  EMBEDDING_MODEL: "test-v2",
}));
vi.mock("../browser-cache.service", () => ({
  readCache: async (key: string) => mock.cache.get(key),
  writeCache: async (key: string, value: unknown) => {
    mock.cache.set(key, value);
  },
}));

import { buildQueries, discoverRepos, toPublicRepo } from "../discovery.service";
import { DEFAULT_PROFILE, inferInterests, rankCandidates } from "../recommendation.service";
import {
  analyzeProjectMatch,
  buildProjectMatch,
  getPublicProject,
  parseDependencies,
  parseGitHubRepo,
} from "../project-match.service";
import {
  embeddingHash,
  embeddingTimestamp,
  isCurrentVector,
  loadEmbeddingIndex,
} from "../embedding-index.service";

const now = Date.parse("2026-11-22T12:00:00Z");
const filter: DiscoveryFilters = {
  mode: "personal",
  days: 30,
  keyword: "",
  topic: "",
  language: "",
};
function payload(id: number, topics: string[], isPrivate = false) {
  return {
    id,
    name: `repo-${id}`,
    full_name: `example/repo-${id}`,
    html_url: "",
    private: isPrivate,
    owner: { login: "example", avatar_url: "" },
    description: "Computer vision model tooling",
    language: "Python",
    topics,
    license: { name: "MIT License", spdx_id: "MIT" },
    stargazers_count: 50,
    forks_count: 5,
    created_at: "2026-10-31T00:00:00Z",
    updated_at: "2026-11-20T00:00:00Z",
    pushed_at: "2026-11-20T00:00:00Z",
    archived: false,
    fork: false,
    disabled: false,
    visibility: isPrivate ? "private" : "public",
  };
}
const repo = (id: number, topics: string[] = ["computer-vision"]): PublicRepo =>
  toPublicRepo(payload(id, topics))!;
const queries = buildQueries(filter, ["computer-vision"], now);
const signal = () => new AbortController().signal;
const search = (overrides: Partial<Parameters<typeof discoverRepos>[0]> = {}) =>
  discoverRepos({
    queries,
    token: "mock only",
    scope: "test",
    page: 1,
    refresh: false,
    signal: signal(),
    ...overrides,
  });

beforeEach(() => {
  vi.resetAllMocks();
  mock.cache.clear();
  vi.stubGlobal("navigator", { onLine: true });
  mock.search.mockResolvedValue({
    data: {
      items: [payload(1, ["computer-vision"]), payload(1, []), payload(2, [], true)],
      incomplete_results: false,
    },
    headers: {
      etag: '"abc"',
      link: '<https://api.github.com/search/repositories?page=2>; rel="next"',
    },
  });
  mock.get.mockImplementation(async ({ repo: name }) => ({
    data: payload(Number(name.split("-")[1]), ["computer-vision"]),
  }));
  mock.contents.mockResolvedValue({
    data: {
      type: "file",
      size: 32,
      html_url: "https://github.com/example/repo-1/blob/main/pyproject.toml",
      encoding: "base64",
      content: btoa('[project]\ndependencies=["numpy>=1.0"]'),
    },
  });
  mock.readme.mockResolvedValue({
    data: {
      encoding: "base64",
      content: btoa("Public README"),
      size: 13,
      html_url: "https://github.com/example/repo-1/blob/main/README.md",
    },
  });
  mock.license.mockResolvedValue({
    data: { html_url: "https://github.com/example/repo-1/blob/main/LICENSE" },
  });
});

describe("Discover and Project Match", () => {
  it("constructs public-only search with dynamic intervals, bounded hints and safe qualifiers", () => {
    expect(
      buildQueries({ ...filter, mode: "rising", days: 7, keyword: "is:private" }, [], now)[0].query,
    ).toContain("created:>=2026-11-15");
    expect(buildQueries(filter, ["cv", "llm", "mesh", "research"], now)).toHaveLength(3);
    expect(buildQueries(filter, ["cv"], now)[0].query).toContain("pushed:>=2026-10-23");
    expect(buildQueries({ ...filter, mode: "topics", topic: "CV" }, [], now)[0].query).toContain(
      "topic:cv",
    );
  });

  it("deduplicates by numeric ID, rejects private records and exposes bounded pagination", async () => {
    const result = await search();
    expect(result.repos.map((item) => item.id)).toEqual([1]);
    expect(result.hasMore).toBe(true);
    expect((await search({ page: 3 })).hasMore).toBe(false);
    await expect(search({ page: 4 })).rejects.toThrow();
  });

  it("revalidates ETag on refresh, uses offline cache and separates expired authorization", async () => {
    await search();
    mock.search.mockRejectedValueOnce({ status: 304 });
    expect((await search({ refresh: true })).repos).toHaveLength(1);
    expect(mock.search.mock.calls[1][0].headers["if-none-match"]).toBe('"abc"');
    vi.stubGlobal("navigator", { onLine: false });
    expect((await search()).stale).toBe(true);
    vi.stubGlobal("navigator", { onLine: true });
    mock.search.mockRejectedValueOnce({ status: 401 });
    await expect(search({ refresh: true })).rejects.toMatchObject({ code: "auth" });
  });

  it("surfaces rate limiting and avoids hammering GitHub during retry-after", async () => {
    mock.search.mockRejectedValue({ status: 429, response: { headers: { "retry-after": "60" } } });
    await expect(search({ scope: "limited" })).rejects.toMatchObject({ code: "limited" });
    await expect(search({ scope: "limited" })).rejects.toMatchObject({ code: "limited" });
    expect(mock.search).toHaveBeenCalledTimes(1);
  });

  it("explains matching rules and learns from feedback with zero model requests and 1200 Stars", () => {
    const stars = Array.from({ length: 1200 }, (_, index) => repo(index + 100));
    const inferred = inferInterests(stars, { 100: { tags: ["camera"] } }, []);
    const profile = { ...DEFAULT_PROFILE, topics: [{ name: "computer-vision", weight: 3 }] };
    const candidates = [repo(1), repo(2, ["agent-framework"]), repo(3, ["vector-search"])];
    expect(
      rankCandidates(candidates, "personal", profile, inferred, {}, undefined, now)[0].repo.id,
    ).toBe(1);
    const changed = rankCandidates(
      candidates,
      "personal",
      profile,
      inferred,
      {
        1: { kind: "not-interested" },
        2: { kind: "hidden", until: now + 60_000 },
        3: { kind: "interested" },
      },
      undefined,
      now,
    );
    expect(changed.map((item) => item.repo.id)).toEqual([3]);
    expect(changed[0].reasons).toContain("你标记了感兴趣");
    expect(mock.advice).not.toHaveBeenCalled();
  });

  it("reads public evidence using no token, includes sources, then blocks AI if a repo becomes private", async () => {
    expect(parseGitHubRepo("github.com/example/repo-1")).toEqual({
      owner: "example",
      repo: "repo-1",
    });
    expect(() => parseGitHubRepo("https://github.com.evil.test/example/repo")).toThrow();
    expect(parseDependencies('{"dependencies":{"react":"*"}}', "package.json")).toEqual(["react"]);
    const report = await buildProjectMatch(repo(1), {
      repo: repo(2),
      goal: "Vision",
      keywords: ["model"],
    });
    expect(report.evidence).toContain("共同依赖 numpy");
    expect(report.sources.map((item) => item.label)).toContain("README");
    expect(mock.clients.mock.calls.every(([token]) => token === undefined)).toBe(true);
    expect(mock.advice).not.toHaveBeenCalled();
    mock.get.mockResolvedValueOnce({ data: payload(1, [], true) });
    await expect(getPublicProject("example/repo-1")).rejects.toThrow("公开");
    mock.get.mockResolvedValueOnce({ data: payload(1, [], true) });
    await expect(analyzeProjectMatch(report)).rejects.toThrow("公开");
    expect(mock.advice).not.toHaveBeenCalled();
  });

  it("hashes the indexed content, rejects old model vectors and preserves legacy timestamps", async () => {
    const a = await embeddingHash("A");
    expect(await embeddingHash("A")).toBe(a);
    const b = await embeddingHash("B");
    expect(a).not.toBe(b);
    expect(isCurrentVector({ hash: a, model: "test-v1", updatedAt: 1, vector: [1] }, a)).toBe(
      false,
    );
    expect(embeddingTimestamp("2026-11-22T12:00:00Z")).toBe(now);
    expect(embeddingTimestamp(now)).toBe(now);
    const index = await loadEmbeddingIndex(
      "u",
      [repo(1)],
      { 1: { embedding: [1], embeddingUpdatedAt: now } },
      false,
    );
    expect(index.pending).toHaveLength(1);
    expect(mock.cache.get("embedding:u:legacy:1")).toEqual({ vector: [1], updatedAt: now });
  });
});
