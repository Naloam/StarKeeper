import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Bookmark, Compass, ExternalLink, RefreshCw, Star } from "lucide-react";
import toast from "react-hot-toast";
import MainLayout from "../components/layout/MainLayout";
import InterestPanel from "../components/discover/InterestPanel";
import ProjectPicker from "../components/discover/ProjectPicker";
import MatchReport from "../components/discover/MatchReport";
import { useAuthStore, useStarsStore } from "../store";
import { buildQueries, dedupeCandidates, discoverRepos } from "../services/discovery.service";
import {
  candidateHints,
  DEFAULT_PROFILE,
  inferInterests,
  rankCandidates,
} from "../services/recommendation.service";
import { loadSessionStars } from "../services/session-stars.service";
import { starRepo } from "../services/github.service";
import type { Collection, RepoMetadata, StarredRepo } from "../types";
import type {
  DiscoveryFilters,
  DiscoveryMode,
  Feedback,
  FeedbackKind,
  InterestProfile,
  ProjectContext,
  PublicRepo,
} from "../types/discovery";

const modes: { id: DiscoveryMode; label: string; description: string }[] = [
  { id: "rising", label: "新项目", description: "按创建窗口筛选，热度参考当前累计 Star 数。" },
  { id: "active", label: "近期活跃", description: "按最近 Push 时间筛选近期有更新的项目。" },
  {
    id: "topics",
    label: "话题发现",
    description: "按 GitHub Topic 找项目，例如 llm 或 computer-vision。",
  },
  {
    id: "personal",
    label: "个性化",
    description: "根据收藏、关注话题、反馈及所选项目匹配公开仓库。",
  },
];

const defaultFilters: DiscoveryFilters = {
  mode: "personal",
  days: 30,
  language: "",
  topic: "",
  keyword: "",
};
type UserDiscovery = {
  profile: InterestProfile;
  feedback: Record<number, Feedback>;
  project?: ProjectContext;
  saved: PublicRepo[];
};
const defaultState: UserDiscovery = { profile: DEFAULT_PROFILE, feedback: {}, saved: [] };

function readSettings(key: string): UserDiscovery {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? "null");
    return value && typeof value === "object" ? { ...defaultState, ...value } : defaultState;
  } catch {
    return defaultState;
  }
}

type SearchResult = Awaited<ReturnType<typeof discoverRepos>>;
const topics = ["ai-agent", "llm", "computer-vision", "3d-gaussian-splatting", "developer-tools"];

export default function DiscoverPage() {
  const { user, accessToken } = useAuthStore();
  if (!accessToken || !user) return null;
  return <Discover key={user.id} token={accessToken} login={user.login} userId={user.id} />;
}

function Discover({ token, login, userId }: { token: string; login: string; userId: number }) {
  const storageKey = `starkeeper-discover-v1:${userId}`;
  const [settings, setSettings] = useState(() => readSettings(storageKey));
  const { profile, feedback, project, saved } = settings;
  const stars: StarredRepo[] = useStarsStore((state) => state.stars);
  const metadata: Record<string, RepoMetadata> = useStarsStore((state) => state.metadata);
  const collections: Collection[] = useStarsStore((state) => state.collections);
  const addStar = useStarsStore((state) => state.addStar);
  const [ready, setReady] = useState(false);
  const [starsError, setStarsError] = useState(false);
  const [form, setForm] = useState(defaultFilters);
  const [filters, setFilters] = useState(defaultFilters);
  const [search, setSearch] = useState<SearchResult>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [savedOnly, setSavedOnly] = useState(false);
  const [panel, setPanel] = useState<"interest" | "project">();
  const [details, setDetails] = useState<PublicRepo>();
  const [starring, setStarring] = useState<number>();
  const [page, setPage] = useState(1);
  const aborter = useRef<AbortController | undefined>(undefined);

  useEffect(() => {
    let active = true;
    const hydrate = () => {
      setOnline(navigator.onLine);
      setStarsError(false);
      void loadSessionStars(token, userId)
        .catch(() => {
          if (active) setStarsError(true);
        })
        .finally(() => {
          if (active) setReady(true);
        });
    };
    const offline = () => setOnline(false);
    hydrate();
    window.addEventListener("online", hydrate);
    window.addEventListener("offline", offline);
    return () => {
      active = false;
      window.removeEventListener("online", hydrate);
      window.removeEventListener("offline", offline);
    };
  }, [token, userId]);

  function updateSettings(patch: Partial<UserDiscovery>) {
    const next = { ...settings, ...patch };
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setSettings(next);
    } catch {
      toast.error("浏览器存储空间不足或不可用");
    }
  }

  const inferred = useMemo(
    () => inferInterests(stars, metadata, collections),
    [stars, metadata, collections],
  );
  const requestFilters =
    !profile.enabled && filters.mode === "personal"
      ? { ...filters, mode: "active" as const }
      : filters;
  const queriesKey = JSON.stringify(
    buildQueries(requestFilters, candidateHints(profile, inferred, project)),
  );
  const runSearch = useCallback(
    async (nextPage: number, refresh = false) => {
      aborter.current?.abort();
      const controller = new AbortController();
      aborter.current = controller;
      setLoading(true);
      setError("");
      if (nextPage === 1 && !refresh) setSearch(undefined);
      try {
        const result = await discoverRepos({
          token,
          scope: String(userId),
          queries: JSON.parse(queriesKey),
          page: nextPage,
          refresh,
          signal: controller.signal,
        });
        if (!controller.signal.aborted) {
          setSearch((previous) =>
            nextPage > 1 && previous
              ? {
                  ...result,
                  repos: dedupeCandidates([...previous.repos, ...result.repos]),
                  stale: result.stale || previous.stale,
                  incomplete: result.incomplete || previous.incomplete,
                  fetchedAt: Math.min(previous.fetchedAt, result.fetchedAt),
                }
              : result,
          );
          setPage(nextPage);
        }
      } catch (failure) {
        if (!controller.signal.aborted)
          setError(failure instanceof Error ? failure.message : "无法读取 GitHub 搜索结果");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [queriesKey, token, userId],
  );

  useEffect(() => {
    if (!ready || savedOnly) return;
    void runSearch(1);
    return () => {
      aborter.current?.abort();
    };
  }, [runSearch, ready, savedOnly]);

  const ranked = useMemo(
    () =>
      rankCandidates(
        search?.repos ?? [],
        requestFilters.mode,
        profile,
        inferred,
        feedback,
        project,
      ),
    [search, requestFilters.mode, profile, inferred, feedback, project],
  );
  const items = savedOnly
    ? saved.map((repo) => ({
        repo,
        score: null,
        reasons: [],
        preference: feedback[repo.id]?.kind,
      }))
    : ranked;
  const savedIds = new Set(saved.map((repo) => repo.id));
  const starIds = useMemo(() => new Set(stars.map((repo) => repo.id)), [stars]);

  async function addGitHubStar(repo: PublicRepo) {
    if (!online || starring || starIds.has(repo.id)) return;
    setStarring(repo.id);
    try {
      await starRepo(token, repo.owner.login, repo.name);
      if (useAuthStore.getState().accessToken === token)
        addStar({ ...repo, starredAt: new Date().toISOString() });
      toast.success("已添加 GitHub Star");
    } catch {
      toast.error("无法添加 GitHub Star，请确认账号权限和连接");
    } finally {
      setStarring(undefined);
    }
  }

  function setFeedback(repo: PublicRepo, kind: FeedbackKind | "") {
    const next = { ...feedback };
    if (!kind) delete next[repo.id];
    else
      next[repo.id] = {
        kind,
        signals: repo.topics.slice(0, 5),
        ...(kind === "hidden" ? { until: Date.now() + 7 * 86_400_000 } : {}),
      };
    updateSettings({ feedback: next });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    setSavedOnly(false);
    setFilters(form);
    if (JSON.stringify(form) === JSON.stringify(filters) && !savedOnly) void runSearch(1);
  }

  return (
    <MainLayout sidebarProps={{ showStarFilters: false }}>
      <div className="mx-auto max-w-[1320px] space-y-5">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-text-primary sm:text-3xl">
              <Compass size={27} aria-hidden="true" /> Discover
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              发现开源项目，判断它们能怎样帮到你正在做的项目。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-secondary"
              aria-expanded={panel === "interest"}
              onClick={() => setPanel(panel === "interest" ? undefined : "interest")}
            >
              兴趣画像
            </button>
            <button
              type="button"
              className="btn-secondary"
              aria-expanded={panel === "project"}
              onClick={() => setPanel(panel === "project" ? undefined : "project")}
            >
              我的项目{project && ` · ${project.repo.name}`}
            </button>
          </div>
        </header>

        {panel && (
          <section className="card space-y-3">
            <h2 className="text-lg font-semibold">
              {panel === "interest" ? "兴趣画像" : "我的项目"}
            </h2>
            {panel === "interest" ? (
              <InterestPanel
                profile={profile}
                inferred={inferred}
                onSave={(value) => {
                  updateSettings({ profile: value });
                  setPanel(undefined);
                }}
                onResetFeedback={() => {
                  updateSettings({ feedback: {} });
                  toast.success("推荐反馈已重置");
                }}
              />
            ) : (
              <ProjectPicker
                token={token}
                login={login}
                project={project}
                onChange={(value) => updateSettings({ project: value })}
              />
            )}
          </section>
        )}

        <section className="card space-y-4">
          <div className="flex flex-wrap gap-2" aria-label="发现模式">
            {modes.map((mode) => (
              <button
                type="button"
                key={mode.id}
                aria-pressed={!savedOnly && filters.mode === mode.id}
                className={!savedOnly && filters.mode === mode.id ? "btn-primary" : "btn-secondary"}
                onClick={() => {
                  const next = { ...form, mode: mode.id };
                  setForm(next);
                  setFilters(next);
                  setSavedOnly(false);
                }}
              >
                {mode.label}
              </button>
            ))}
            <button
              type="button"
              aria-pressed={savedOnly}
              className={savedOnly ? "btn-primary" : "btn-secondary"}
              onClick={() => {
                setSavedOnly(!savedOnly);
                setLoading(false);
              }}
            >
              <Bookmark size={16} aria-hidden="true" />
              本地收藏 ({saved.length})
            </button>
          </div>
          {savedOnly ? (
            <p className="text-sm text-text-secondary">
              收藏保存在当前浏览器，支持未 Star 的项目。
            </p>
          ) : (
            <>
              <p className="text-sm text-text-secondary">
                {modes.find((mode) => mode.id === requestFilters.mode)?.description}
                {!profile.enabled && filters.mode === "personal" && " 个性化已关闭。"}
              </p>
              <form
                onSubmit={submit}
                className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr_auto]"
              >
                <label className="text-sm">
                  仓库关键词
                  <input
                    type="search"
                    className="input mt-1"
                    value={form.keyword}
                    maxLength={100}
                    onChange={(event) => setForm({ ...form, keyword: event.target.value })}
                  />
                </label>
                <label className="text-sm">
                  语言
                  <input
                    className="input mt-1"
                    maxLength={34}
                    placeholder="例如 TypeScript"
                    value={form.language}
                    onChange={(event) => setForm({ ...form, language: event.target.value })}
                  />
                </label>
                <label className="text-sm">
                  GitHub Topic
                  <input
                    className="input mt-1"
                    list="discover-topics"
                    maxLength={50}
                    value={form.topic}
                    onChange={(event) => setForm({ ...form, topic: event.target.value })}
                  />
                </label>
                <datalist id="discover-topics">
                  {[...new Set([...topics, ...profile.topics.map((item) => item.name)])].map(
                    (topic) => (
                      <option key={topic} value={topic} />
                    ),
                  )}
                </datalist>
                <label className="text-sm">
                  时间窗口
                  <select
                    className="input mt-1"
                    value={form.days}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        days: Number(event.target.value) as DiscoveryFilters["days"],
                      })
                    }
                  >
                    <option value={7}>近 7 天</option>
                    <option value={30}>近 30 天</option>
                    <option value={90}>近 90 天</option>
                  </select>
                </label>
                <button className="btn-primary" type="submit">
                  搜索项目
                </button>
              </form>
            </>
          )}
        </section>

        {!savedOnly && (
          <div className="flex min-h-10 flex-wrap items-center justify-between gap-2 text-sm text-text-secondary">
            <div role="status">
              {!ready || loading ? "正在查询 GitHub…" : `${ranked.length} 个项目`}
              {!online && " · 离线"}
              {search?.stale && " · 使用缓存结果"}
              {search?.incomplete && " · 结果不完整"}
              {search && ` · 缓存/查询时间 ${new Date(search.fetchedAt).toLocaleString()}`}
            </div>
            <button
              type="button"
              className="btn-secondary"
              disabled={loading || !online}
              onClick={() => void runSearch(1, true)}
            >
              <RefreshCw size={15} aria-hidden="true" />
              刷新结果
            </button>
          </div>
        )}
        {!savedOnly && (!!error || search?.warning || starsError) && (
          <p
            role="alert"
            className="rounded-lg border border-border bg-surface-card p-3 text-sm text-text-secondary"
          >
            {error ||
              search?.warning?.message ||
              "暂时无法获取 Stars，部分个性化信号和 Star 状态可能缺失。"}
          </p>
        )}
        {(savedOnly || (ready && !loading && search)) && !items.length && (
          <p className="card text-text-secondary" role="status">
            {savedOnly
              ? "还没有收藏的项目。"
              : "没有符合条件的项目。试试扩大时间范围或减少筛选条件。"}
          </p>
        )}

        <ul className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {items.map(({ repo, score, reasons, preference }) => (
            <li
              key={repo.id}
              className="flex h-full min-w-0 flex-col gap-3 rounded-xl border border-border bg-surface-card p-4 shadow-sm sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <a
                  href={repo.htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-w-0 items-center gap-1.5 break-all font-semibold text-info-text hover:underline"
                >
                  {repo.fullName}
                  <ExternalLink className="shrink-0" size={14} aria-hidden="true" />
                </a>
                {score !== null && (
                  <span
                    title="综合兴趣、项目关联度、热度和新鲜度"
                    className="rounded bg-info-light px-2 py-1 text-xs text-info-text"
                  >
                    综合分 {score}/100
                  </span>
                )}
              </div>
              {repo.description && (
                <p className="text-sm text-text-secondary">{repo.description}</p>
              )}
              <div className="flex flex-wrap gap-2 text-xs text-text-secondary">
                <span className="inline-flex items-center gap-1">
                  <Star size={13} aria-hidden="true" />
                  {repo.stargazersCount.toLocaleString()}
                </span>
                {repo.language && <span>{repo.language}</span>}
                <span>创建 {repo.createdAt.slice(0, 10) || "未知"}</span>
                <span>最近 Push {repo.pushedAt.slice(0, 10) || "未知"}</span>
              </div>
              {!!repo.topics.length && (
                <div className="flex flex-wrap gap-1.5">
                  {repo.topics.slice(0, 6).map((topic) => (
                    <span
                      className="rounded-full border border-border px-2 py-0.5 text-xs"
                      key={topic}
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              )}
              {!!reasons.length && (
                <p className="text-sm text-text-primary">{reasons.join(" · ")}</p>
              )}
              <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-border pt-3">
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={!online || !!starring || starIds.has(repo.id)}
                  onClick={() => void addGitHubStar(repo)}
                >
                  {starIds.has(repo.id) ? "已 Star" : starring === repo.id ? "处理中…" : "Star"}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  aria-pressed={savedIds.has(repo.id)}
                  onClick={() =>
                    updateSettings({
                      saved: savedIds.has(repo.id)
                        ? saved.filter((item) => item.id !== repo.id)
                        : [...saved, repo],
                    })
                  }
                >
                  {savedIds.has(repo.id) ? "取消收藏" : "收藏到本机"}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setDetails(repo)}>
                  项目匹配
                </button>
                <select
                  aria-label={`${repo.fullName} 的推荐反馈`}
                  className="max-w-full rounded border border-border bg-surface px-2 py-1.5 text-sm"
                  value={preference ?? ""}
                  onChange={(event) => setFeedback(repo, event.target.value as FeedbackKind | "")}
                >
                  <option value="">推荐反馈</option>
                  <option value="interested">感兴趣</option>
                  <option value="not-interested">不感兴趣</option>
                  <option value="used">已使用</option>
                  <option value="hidden">隐藏 7 天</option>
                </select>
              </div>
            </li>
          ))}
        </ul>
        {!savedOnly && search?.hasMore && (
          <button
            className="btn-secondary"
            type="button"
            disabled={loading}
            onClick={() => void runSearch(page + 1)}
          >
            加载更多项目
          </button>
        )}
      </div>
      {details && (
        <MatchReport candidate={details} project={project} onClose={() => setDetails(undefined)} />
      )}
    </MainLayout>
  );
}
