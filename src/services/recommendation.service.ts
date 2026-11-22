import type { Collection, RepoMetadata, StarredRepo } from "../types";
import type {
  Feedback,
  InterestProfile,
  ProjectContext,
  PublicRepo,
  DiscoveryMode,
} from "../types/discovery";

const DAY = 86_400_000;
export const DEFAULT_PROFILE: InterestProfile = {
  enabled: true,
  infer: true,
  topics: [],
  blockedTopics: [],
  blockedLanguages: [],
  blockedKeywords: [],
};

const normalized = (text: string) => text.normalize("NFKC").toLowerCase().trim();
const repoText = (repo: StarredRepo) =>
  normalized([repo.fullName, repo.description, repo.language, ...(repo.topics ?? [])].join(" "));
function tokens(value: string) {
  return normalized(value).match(/[\p{L}\p{N}]+/gu) ?? [];
}
function contains(text: string, term: string) {
  const needle = tokens(term).join(" ");
  if (!needle) return false;
  if (/[\u3400-\u9fff]/.test(needle)) return text.includes(needle);
  return ` ${tokens(text).join(" ")} `.includes(` ${needle} `);
}

export function inferInterests(
  stars: StarredRepo[],
  metadata: Record<string, RepoMetadata>,
  collections: Collection[],
) {
  const topics = new Map<string, number>();
  const local = new Map<string, number>();
  const languages = new Map<string, number>();
  const publicIds = new Set(
    stars.filter((repo) => repo.isPrivate === false).map((repo) => repo.id),
  );
  const add = (map: Map<string, number>, key: string, count: number) => {
    const value = normalized(key);
    if (value) map.set(value, (map.get(value) ?? 0) + count);
  };
  for (const repo of stars) {
    if (!publicIds.has(repo.id)) continue;
    repo.topics?.forEach((topic) => add(topics, topic, 1));
    metadata[repo.id]?.tags?.forEach((tag) => add(local, tag, 2));
    if (repo.language) add(languages, repo.language, 1);
  }
  for (const collection of collections) {
    if (collection.repoIds.some((id) => publicIds.has(id))) add(local, collection.name, 2);
  }
  const top = (map: Map<string, number>, size: number) =>
    Array.from(map)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, size)
      .map(([name]) => name);
  return { topics: top(topics, 10), local: top(local, 10), languages: top(languages, 5) };
}
export type InferredInterests = ReturnType<typeof inferInterests>;

export function candidateHints(
  profile: InterestProfile,
  inferred: InferredInterests,
  project?: ProjectContext,
) {
  const blocked = new Set(profile.blockedTopics.map(normalized));
  const declared = [...profile.topics]
    .sort((a, b) => b.weight - a.weight)
    .map((interest) => interest.name);
  const priority = [
    ...(project?.repo.topics.slice(0, 1) ?? []),
    ...declared,
    ...(profile.infer ? inferred.topics : []),
  ];
  return [...new Set(priority.map(normalized))].filter((topic) => !blocked.has(topic));
}

export function projectSignals(candidate: PublicRepo, project: ProjectContext) {
  const projectText = repoText(project.repo);
  const candidateText = repoText(candidate);
  const topics = candidate.topics.filter((topic) =>
    project.repo.topics.some((item) => normalized(item) === normalized(topic)),
  );
  const keywords = project.keywords.filter((keyword) => contains(candidateText, keyword));
  // Explicit project keywords are weighted above incidental description terms.
  const ignore = new Set([
    "with",
    "from",
    "that",
    "your",
    "this",
    "project",
    "based",
    "using",
    "tool",
    "github",
    "open",
    "source",
  ]);
  const overlaps = [...new Set(tokens(projectText))]
    .filter((term) => term.length >= 4 && !ignore.has(term) && contains(candidateText, term))
    .slice(0, 3);
  const goalTerms = [...new Set(tokens(project.goal))]
    .filter((term) => term.length >= 4 && !ignore.has(term) && contains(candidateText, term))
    .slice(0, 2);
  const sameLanguage =
    !!candidate.language &&
    normalized(candidate.language) === normalized(project.repo.language ?? "");
  const score = Math.min(
    1,
    topics.length * 0.35 +
      keywords.length * 0.3 +
      overlaps.length * 0.06 +
      goalTerms.length * 0.12 +
      (sameLanguage ? 0.12 : 0),
  );
  return { score, topics, keywords, overlaps, goalTerms, sameLanguage };
}

export function rankCandidates(
  candidates: PublicRepo[],
  mode: DiscoveryMode,
  profile: InterestProfile,
  inferred: InferredInterests,
  feedback: Record<number, Feedback>,
  project?: ProjectContext,
  now = Date.now(),
) {
  const blockedTopics = new Set(profile.blockedTopics.map(normalized));
  const blockedLanguages = new Set(profile.blockedLanguages.map(normalized));
  const declared = new Map(
    profile.topics.map((interest) => [normalized(interest.name), interest.weight]),
  );
  const personal = mode === "personal" && profile.enabled;
  const feedbackSignals = personal
    ? Object.values(feedback)
        .filter((value) => value.kind === "interested" || value.kind === "used")
        .reduce((set, value) => {
          value.signals?.forEach((topic) => set.add(normalized(topic)));
          return set;
        }, new Set<string>())
    : new Set<string>();

  const ranked = candidates
    .flatMap((repo) => {
      const preference = feedback[repo.id];
      const text = repoText(repo);
      const language = normalized(repo.language ?? "");
      if (
        repo.id === project?.repo.id ||
        preference?.kind === "not-interested" ||
        (preference?.kind === "hidden" && (preference.until ?? 0) > now) ||
        blockedLanguages.has(language) ||
        repo.topics.some((topic) => blockedTopics.has(normalized(topic))) ||
        profile.blockedKeywords.some((keyword) => contains(text, keyword))
      )
        return [];

      const reasons: string[] = [];
      const related = project ? projectSignals(repo, project) : undefined;
      if (related?.topics.length)
        reasons.push(`与所选项目共享话题 ${related.topics.slice(0, 3).join("、")}`);
      if (related?.keywords.length)
        reasons.push(`匹配项目关键词 ${related.keywords.slice(0, 3).join("、")}`);
      if (related?.goalTerms.length) reasons.push(`命中目标词 ${related.goalTerms.join("、")}`);
      if (preference?.kind === "interested") reasons.push("你标记了感兴趣");
      if (preference?.kind === "used") reasons.push("你标记了已使用");
      if (related?.sameLanguage) reasons.push(`所选项目也使用 ${repo.language}`);

      let affinity = 0;
      if (personal) {
        const explicit = Array.from(declared).filter(([topic]) => contains(text, topic));
        const inferredMatches = profile.infer
          ? [...new Set([...inferred.topics, ...inferred.local])].filter((term) =>
              contains(text, term),
            )
          : [];
        const matchingFeedback = repo.topics.filter((topic) =>
          feedbackSignals.has(normalized(topic)),
        );
        const preferredLanguage = profile.infer && inferred.languages.includes(language);
        const feedbackBoost =
          preference?.kind === "interested" ? 0.4 : preference?.kind === "used" ? 0.16 : 0;
        affinity = Math.min(
          1,
          feedbackBoost +
            explicit.reduce((sum, [, weight]) => sum + weight * 0.15, 0) +
            inferredMatches.length * 0.13 +
            matchingFeedback.length * 0.11 +
            (preferredLanguage ? 0.12 : 0),
        );
        if (explicit.length)
          reasons.push(
            `命中关注话题 ${explicit
              .slice(0, 3)
              .map(([name]) => name)
              .join("、")}`,
          );
        if (inferredMatches.length)
          reasons.push(
            `与你收藏的项目、标签或收藏夹相关 ${inferredMatches.slice(0, 3).join("、")}`,
          );
        if (matchingFeedback.length)
          reasons.push(`与正向反馈的项目共享话题 ${matchingFeedback.slice(0, 3).join("、")}`);
        if (preferredLanguage) reasons.push(`你常收藏 ${repo.language} 项目`);
      }

      const pushed = Date.parse(repo.pushedAt);
      const freshnessDate = mode === "rising" ? Date.parse(repo.createdAt) : pushed;
      const age = Number.isFinite(freshnessDate) ? Math.max(0, (now - freshnessDate) / DAY) : 365;
      const freshness = 1 / (1 + age / 15);
      const quality =
        Math.min(1, Math.log10(1 + Math.max(0, repo.stargazersCount)) / 4) * 0.8 +
        (repo.licenseId && repo.licenseId !== "NOASSERTION" ? 0.2 : 0);
      if (!reasons.length)
        reasons.push(
          Number.isFinite(freshnessDate)
            ? `${mode === "rising" ? "创建" : "最近 Push"}于 ${new Date(freshnessDate).toISOString().slice(0, 10)}`
            : "符合当前 GitHub 搜索筛选",
        );
      if (related?.overlaps.length && reasons.length < 3)
        reasons.push(`仓库描述共享词 ${related.overlaps.join("、")}`);
      const baseWeights =
        mode === "active" ? { quality: 15, freshness: 25 } : { quality: 20, freshness: 15 };
      const weight =
        baseWeights.quality + baseWeights.freshness + (personal ? 35 : 0) + (project ? 30 : 0);
      const score = Math.round(
        (100 *
          (affinity * (personal ? 35 : 0) +
            (related?.score ?? 0) * (project ? 30 : 0) +
            quality * baseWeights.quality +
            freshness * baseWeights.freshness)) /
          weight,
      );
      return [{ repo, score, reasons: reasons.slice(0, 3), preference: preference?.kind }];
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.repo.stargazersCount - a.repo.stargazersCount ||
        a.repo.id - b.repo.id,
    );

  // Keep top results varied without discarding similar results deeper in the list.
  if (mode !== "personal") return ranked;
  const diversity = new Map<string, number>();
  const head: typeof ranked = [];
  const tail: typeof ranked = [];
  for (const item of ranked) {
    const group = item.repo.topics[0] ?? item.repo.language ?? "";
    const count = diversity.get(group) ?? 0;
    if (head.length >= 12 || count >= 3) tail.push(item);
    else {
      head.push(item);
      diversity.set(group, count + 1);
    }
  }
  return [...head, ...tail];
}
