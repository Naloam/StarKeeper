import { createOctokitClient } from "./github.service";
import { readCache, writeCache } from "./browser-cache.service";
import type { DiscoveryFilters, PublicRepo } from "../types/discovery";

const PAGE_SIZE = 24;
export const MAX_SEARCH_PAGES = 3;
export const MAX_SEARCH_QUERIES = 3;
const CACHE_TTL = 8 * 60 * 60_000;
type SearchParams = { query: string; sort?: "stars" | "updated" };
type Page = {
  repos: PublicRepo[];
  fetchedAt: number;
  etag?: string;
  hasMore: boolean;
  incomplete: boolean;
};
type RepoPayload = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  private: boolean;
  owner: { login: string; avatar_url: string } | null;
  description: string | null;
  language: string | null;
  topics?: string[] | null;
  license?: { name: string; spdx_id: string | null } | null;
  stargazers_count: number;
  forks_count: number;
  created_at: string | null;
  updated_at: string | null;
  pushed_at: string | null;
  archived: boolean;
  fork: boolean;
  disabled: boolean;
  visibility?: string;
  default_branch?: string;
};

export function toPublicRepo(data: RepoPayload): PublicRepo | null {
  if (data.private || (data.visibility && data.visibility !== "public") || !data.owner) return null;
  return {
    id: data.id,
    name: data.name,
    fullName: data.full_name,
    htmlUrl: `https://github.com/${data.full_name}`,
    owner: { login: data.owner.login, avatarUrl: data.owner.avatar_url },
    description: data.description,
    language: data.language,
    topics: data.topics ?? [],
    license: data.license?.name,
    licenseId: data.license?.spdx_id ?? null,
    fork: data.fork,
    archived: data.archived ?? false,
    disabled: data.disabled ?? false,
    isPrivate: false,
    visibility: "public",
    defaultBranch: data.default_branch ?? null,
    stargazersCount: data.stargazers_count,
    forksCount: data.forks_count,
    createdAt: data.created_at ?? "",
    updatedAt: data.updated_at ?? "",
    pushedAt: data.pushed_at ?? "",
  };
}

const topicSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 50);
const searchWords = (value: string) =>
  value
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N} .+#-]/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6)
    .map((word) => `"${word.slice(0, 32)}"`)
    .join(" ");

export function buildQueries(
  filters: DiscoveryFilters,
  hints: string[],
  now = Date.now(),
): SearchParams[] {
  const date = new Date(now - filters.days * 86_400_000).toISOString().slice(0, 10);
  const keywords = searchWords(filters.keyword);
  const language = filters.language
    .replace(/[^\p{L}\p{N} +#.-]/gu, "")
    .trim()
    .slice(0, 34);
  const topic = topicSlug(filters.topic);
  const base = [
    "is:public",
    "archived:false",
    "fork:false",
    language && `language:"${language}"`,
    keywords,
  ].filter(Boolean);
  if (filters.mode === "rising") {
    return [
      {
        query: [...base, `created:>=${date}`, "stars:>=5", topic && `topic:${topic}`]
          .filter(Boolean)
          .join(" "),
        sort: "stars",
      },
    ];
  }
  const active = [...base, `pushed:>=${date}`, "stars:>=3"];
  if (filters.mode === "active" || filters.mode === "topics") {
    return [
      {
        query: [...active, topic && `topic:${topic}`].filter(Boolean).join(" "),
        sort: filters.mode === "active" ? "updated" : undefined,
      },
    ];
  }
  const topics = Array.from(
    new Set((topic ? [topic] : hints.map(topicSlug)).filter(Boolean)),
  ).slice(0, MAX_SEARCH_QUERIES);
  return (topics.length ? topics : [""]).map((item) => ({
    query: [...active, item && `topic:${item}`].filter(Boolean).join(" "),
  }));
}

export type DiscoveryIssue = "offline" | "auth" | "limited" | "access" | "network";
export class DiscoveryError extends Error {
  constructor(
    public readonly code: DiscoveryIssue,
    public readonly retryAt?: number,
  ) {
    const messages: Record<DiscoveryIssue, string> = {
      offline: "当前离线，联网后可获取新的 GitHub 结果。",
      auth: "GitHub 授权已失效，请重新登录。",
      limited: "GitHub 搜索已限流，请稍后重试。",
      access: "GitHub 拒绝了搜索请求，请检查权限或筛选条件。",
      network: "暂时无法连接 GitHub，请稍后重试。",
    };
    super(messages[code]);
  }
}

function toDiscoveryError(error: unknown) {
  if (!navigator.onLine) return new DiscoveryError("offline");
  const value = error as {
    status?: number;
    message?: string;
    response?: { headers?: Record<string, string> };
  };
  const headers = value?.response?.headers ?? {};
  const seconds = Number(headers["retry-after"]);
  const reset = Number(headers["x-ratelimit-reset"]);
  const limited =
    value?.status === 429 ||
    (value?.status === 403 &&
      (headers["x-ratelimit-remaining"] === "0" ||
        !!headers["retry-after"] ||
        /rate limit|abuse/i.test(value.message ?? "")));
  if (limited) {
    const retryAt = Number.isFinite(seconds)
      ? Date.now() + seconds * 1000
      : headers["x-ratelimit-remaining"] === "0" && Number.isFinite(reset)
        ? reset * 1000
        : Date.now() + 60_000;
    return new DiscoveryError("limited", retryAt);
  }
  if (value?.status === 401) return new DiscoveryError("auth");
  if (value?.status === 403 || value?.status === 422) return new DiscoveryError("access");
  return new DiscoveryError("network");
}

function delay(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason);
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

const budgets = new Map<string, number>();

async function getPage(
  client: ReturnType<typeof createOctokitClient>,
  scope: string,
  spec: SearchParams,
  page: number,
  refresh: boolean,
  signal: AbortSignal,
): Promise<{ data: Page; stale: boolean; warning?: DiscoveryError }> {
  const key = `discover-v1:${scope}:${spec.sort ?? ""}:${spec.query}:${page}`;
  const cached = await readCache<Page>(key);
  if (cached && !refresh && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return { data: cached, stale: !navigator.onLine };
  }
  const limitedUntil = budgets.get(scope) ?? 0;
  if (Date.now() < limitedUntil) {
    const warning = new DiscoveryError("limited", limitedUntil);
    if (cached) return { data: cached, stale: true, warning };
    throw warning;
  }

  let failure = new DiscoveryError("network");
  for (let attempt = 0; attempt < 3; attempt++) {
    if (signal.aborted) throw signal.reason;
    if (!navigator.onLine) {
      failure = new DiscoveryError("offline");
      break;
    }
    try {
      const response = await client.search.repos({
        q: spec.query,
        sort: spec.sort,
        order: spec.sort ? "desc" : undefined,
        per_page: PAGE_SIZE,
        page,
        headers: cached?.etag ? { "if-none-match": cached.etag } : undefined,
        request: { signal },
      });
      const repos = response.data.items.flatMap((item) => {
        const repo = toPublicRepo(item);
        return repo && !repo.archived && !repo.disabled && !repo.fork ? [repo] : [];
      });
      const data = {
        repos,
        fetchedAt: Date.now(),
        etag: response.headers.etag,
        hasMore: response.headers.link?.includes('rel="next"') ?? false,
        incomplete: response.data.incomplete_results,
      };
      await writeCache(key, data).catch(() => undefined);
      return { data, stale: false };
    } catch (error) {
      if (signal.aborted) throw signal.reason;
      if ((error as { status?: number }).status === 304 && cached) {
        const data = { ...cached, fetchedAt: Date.now() };
        await writeCache(key, data).catch(() => undefined);
        return { data, stale: false };
      }
      failure = toDiscoveryError(error);
      const wait = failure.retryAt ? failure.retryAt - Date.now() : 300 * 2 ** attempt;
      if (failure.retryAt) budgets.set(scope, failure.retryAt);
      if (
        attempt === 2 ||
        wait > 2000 ||
        (failure.code !== "network" && failure.code !== "limited")
      )
        break;
      await delay(Math.max(wait, 250), signal);
    }
  }
  if (cached && failure.code !== "auth") return { data: cached, stale: true, warning: failure };
  throw failure;
}

export async function discoverRepos({
  token,
  scope,
  queries,
  page,
  refresh,
  signal,
}: {
  token: string;
  scope: string;
  queries: SearchParams[];
  page: number;
  refresh: boolean;
  signal: AbortSignal;
}) {
  if (!Number.isInteger(page) || page < 1 || page > MAX_SEARCH_PAGES)
    throw new Error("搜索页超出预算");
  const client = createOctokitClient(token);
  const results = [];
  const issues: DiscoveryError[] = [];
  // Serial requests keep the search budget predictable and respect shared retry windows.
  for (const query of queries.slice(0, MAX_SEARCH_QUERIES)) {
    try {
      const result = await getPage(client, scope, query, page, refresh, signal);
      results.push(result);
      if (result.warning) issues.push(result.warning);
    } catch (error) {
      if (signal.aborted || !(error instanceof DiscoveryError) || error.code === "auth")
        throw error;
      issues.push(error);
    }
  }
  if (!results.length) throw issues[0] ?? new DiscoveryError("network");
  return {
    repos: dedupeCandidates(results.flatMap((result) => result.data.repos)),
    stale: results.some((result) => result.stale),
    incomplete: issues.length > 0 || results.some((result) => result.data.incomplete),
    hasMore: page < MAX_SEARCH_PAGES && results.some((result) => result.data.hasMore),
    fetchedAt: Math.min(...results.map((result) => result.data.fetchedAt)),
    warning: issues[0],
  };
}

export function dedupeCandidates(repos: PublicRepo[]) {
  return Array.from(new Map(repos.map((repo) => [repo.id, repo])).values());
}
