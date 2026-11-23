import { createOctokitClient } from "./github.service";
import { toPublicRepo } from "./discovery.service";
import { projectSignals } from "./recommendation.service";
import { readCache, writeCache } from "./browser-cache.service";
import { generateProjectAdvice } from "./dashscope.service";
import type { ProjectContext, PublicRepo } from "../types/discovery";

const TTL = 8 * 60 * 60_000;
type Source = { label: string; url: string };
type Evidence = {
  repo: PublicRepo;
  sources: Source[];
  readme: string;
  dependencies: string[];
  fetchedAt: number;
};

export function parseGitHubRepo(value: string) {
  const input = value.trim();
  const parsed = /^https?:\/\//i.test(input)
    ? new URL(input)
    : new URL(`https://${/^github\.com\//i.test(input) ? input : "github.com/" + input}`);
  if (parsed.origin !== "https://github.com" || parsed.username || parsed.password) {
    throw new Error("请输入 GitHub 公开仓库地址");
  }
  const parts = parsed.pathname
    .replace(/\/$/, "")
    .replace(/\.git$/, "")
    .split("/")
    .slice(1);
  if (
    parts.length !== 2 ||
    !/^[\w-]{1,39}$/.test(parts[0]) ||
    !/^[\w.-]{1,100}$/.test(parts[1]) ||
    [".", ".."].includes(parts[1])
  )
    throw new Error("仓库地址应为 github.com/owner/repo");
  return { owner: parts[0], repo: parts[1] };
}

function decode(content: string) {
  return new TextDecoder().decode(
    Uint8Array.from(atob(content.replace(/\s/g, "")), (char) => char.charCodeAt(0)),
  );
}

export async function getPublicProject(value: string, signal?: AbortSignal) {
  const locator = parseGitHubRepo(value);
  // Unauthenticated project reads cannot access private content, including after a redirect.
  const { data } = await createOctokitClient().repos.get({ ...locator, request: { signal } });
  const repo = toPublicRepo(data);
  if (!repo) throw new Error("只支持公开 GitHub 仓库");
  return repo;
}

export async function listMyProjects(token: string, login: string, page = 1, signal?: AbortSignal) {
  const { data, headers } = await createOctokitClient(token).repos.listForAuthenticatedUser({
    type: "public",
    sort: "pushed",
    direction: "desc",
    per_page: 30,
    page,
    request: { signal },
  });
  return {
    repos: data.flatMap((item) => {
      const repo = toPublicRepo(item);
      return repo?.owner.login.toLowerCase() === login.toLowerCase() && !repo.disabled
        ? [repo]
        : [];
    }),
    hasMore: page < 10 && (headers.link?.includes('rel="next"') ?? false),
  };
}

const manifests: Record<string, string> = {
  TypeScript: "package.json",
  JavaScript: "package.json",
  Vue: "package.json",
  Python: "pyproject.toml",
  Rust: "Cargo.toml",
  Go: "go.mod",
  Java: "pom.xml",
};

export function parseDependencies(text: string, path: string) {
  if (path === "package.json") {
    try {
      const manifest = JSON.parse(text);
      return [
        ...new Set([
          ...Object.keys(manifest.dependencies ?? {}),
          ...Object.keys(manifest.peerDependencies ?? {}),
        ]),
      ].slice(0, 12);
    } catch {
      return [];
    }
  }
  if (path === "go.mod")
    return [...text.matchAll(/(?:^require\s+|^\s+)([\w./-]+)\s+v[\d.]/gm)]
      .map((match) => match[1])
      .slice(0, 12);
  if (path === "pom.xml")
    return [
      ...text.matchAll(
        /<dependency>\s*<groupId>[^<]+<\/groupId>\s*<artifactId>([^<]+)<\/artifactId>/g,
      ),
    ]
      .map((match) => match[1])
      .slice(0, 12);
  const section = text.match(/^\[dependencies\]\s*\n([^\[]+)/m)?.[1];
  if (section)
    return [...section.matchAll(/^([\w-]+)\s*=/gm)].map((match) => match[1]).slice(0, 12);
  const list = text.match(/^dependencies\s*=\s*\[([^\]]+)\]/m)?.[1] ?? "";
  return [...list.matchAll(/["']([\w.-]+)/g)].map((match) => match[1]).slice(0, 12);
}

function safeSource(value: string | null | undefined) {
  try {
    const url = new URL(value ?? "");
    return url.origin === "https://github.com" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function optionalGithubError(error: unknown) {
  const status = (error as { status?: number }).status;
  if (status !== 404 && status !== 409) throw error;
  return undefined;
}

async function getEvidence(
  repo: PublicRepo,
  signal?: AbortSignal,
  recheck = false,
): Promise<Evidence> {
  const key = `project-evidence-v1:${repo.id}:${repo.pushedAt}`;
  let cached = await readCache<Evidence>(key);
  if (!recheck && cached && Date.now() - cached.fetchedAt < TTL) return cached;

  const current = await getPublicProject(repo.fullName, signal);
  if (current.id !== repo.id) throw new Error("仓库标识已变化，请重新选择");
  const client = createOctokitClient();
  const locator = { owner: current.owner.login, repo: current.name, request: { signal } };
  const path = manifests[current.language ?? ""];
  const [readme, manifest, license] = await Promise.all([
    client.repos
      .getReadme(locator)
      .then((response) => response.data)
      .catch(optionalGithubError),
    path
      ? client.repos
          .getContent({ ...locator, path })
          .then((response) => response.data)
          .catch(optionalGithubError)
      : undefined,
    current.licenseId
      ? client.licenses
          .getForRepo(locator)
          .then((response) => response.data)
          .catch(optionalGithubError)
      : undefined,
  ]);
  const sources: Source[] = [{ label: current.fullName, url: current.htmlUrl }];
  const source = (label: string, value?: string | null) => {
    const url = safeSource(value);
    if (url) sources.push({ label, url });
  };
  source("README", readme?.html_url);
  source("许可证", license?.html_url);
  let dependencies: string[] = [];
  if (
    manifest &&
    !Array.isArray(manifest) &&
    manifest.type === "file" &&
    manifest.encoding === "base64" &&
    manifest.size < 96_000
  ) {
    source(path, manifest.html_url);
    dependencies = parseDependencies(decode(manifest.content), path);
  }
  cached = {
    repo: current,
    sources,
    dependencies,
    fetchedAt: Date.now(),
    readme:
      readme?.encoding === "base64" && readme.size < 96_000
        ? decode(readme.content).slice(0, 3500)
        : "",
  };
  await writeCache(key, cached).catch(() => undefined);
  return cached;
}

function readmeIntro(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length >= 30 && !/^[#<!|*`\[\]-]/.test(line) && !/^https?:/i.test(line))
    ?.slice(0, 220);
}

export async function buildProjectMatch(
  candidate: PublicRepo,
  project?: ProjectContext,
  signal?: AbortSignal,
) {
  const [details, target] = await Promise.all([
    getEvidence(candidate, signal),
    project && getEvidence(project.repo, signal),
  ]);
  const context = project && target ? { ...project, repo: target.repo } : undefined;
  const match = context ? projectSignals(details.repo, context) : undefined;
  const sameDependencies = details.dependencies.filter((value) =>
    target?.dependencies.includes(value),
  );
  const distinctLicenses =
    !!details.repo.licenseId &&
    !!target?.repo.licenseId &&
    details.repo.licenseId !== target.repo.licenseId;
  const relation = !context
    ? "选择自己的项目后可比对目标、话题和依赖"
    : sameDependencies.length || match?.keywords.length
      ? "可作为集成或模块替换候选，需检查 API 与依赖版本"
      : match?.topics.length
        ? "适合比较同类项目的设计与功能覆盖"
        : "现有证据表明它更适合作为学习参考";
  const readme = details.sources.find((item) => item.label === "README");
  const next = sameDependencies.length
    ? `用最小示例验证双方的 ${sameDependencies[0]} 版本和 API 是否兼容。`
    : readme
      ? `先阅读 ${details.repo.fullName} 的 README，挑一个与项目目标相关的示例做独立验证。`
      : "先检查仓库首页是否提供安装说明、示例和部署要求。";
  const risks = [
    !details.repo.licenseId || details.repo.licenseId === "NOASSERTION"
      ? "GitHub 未识别明确许可证，复用前应确认授权。"
      : distinctLicenses
        ? "两个项目的许可证标识不同，复用或分发前需检查条款。"
        : "将代码或依赖引入项目之前，请核对许可证条款。",
    details.repo.archived ? "候选仓库已经归档。" : "核对近期维护记录、依赖版本和部署成本。",
    target?.repo.language && details.repo.language !== target.repo.language
      ? "主要语言不同，确认集成接口或独立部署方式。"
      : "",
  ].filter(Boolean);
  const evidence = [
    ...(match?.topics.length ? [`共同话题 ${match.topics.join("、")}`] : []),
    ...(match?.keywords.length ? [`匹配项目关键词 ${match.keywords.join("、")}`] : []),
    ...(match?.goalTerms.length ? [`匹配项目目标词 ${match.goalTerms.join("、")}`] : []),
    ...(sameDependencies.length ? [`共同依赖 ${sameDependencies.join("、")}`] : []),
  ];
  return {
    details,
    target,
    relation,
    next,
    risks,
    evidence,
    readmeIntro: readmeIntro(details.readme),
    sources: [
      ...details.sources,
      ...(target?.sources.map((item) => ({ ...item, label: `我的项目 · ${item.label}` })) ?? []),
    ],
  };
}
export type ProjectReport = Awaited<ReturnType<typeof buildProjectMatch>>;

export async function analyzeProjectMatch(report: ProjectReport, signal?: AbortSignal) {
  const evidence = await Promise.all(
    [report.details.repo, ...(report.target ? [report.target.repo] : [])].map((repo) =>
      getEvidence(repo, signal, true),
    ),
  );
  const payload = evidence.map(({ repo, readme, dependencies }) => ({
    repo: repo.fullName,
    description: repo.description,
    language: repo.language,
    topics: repo.topics,
    license: repo.licenseId,
    readme: readme.slice(0, 2200),
    dependencies,
  }));
  const key = `project-ai-deepseek-chat-v1:${JSON.stringify(payload)}`;
  const cache = await readCache<{ text: string; at: number }>(key);
  if (cache && Date.now() - cache.at < TTL) return cache.text;
  const text = await generateProjectAdvice(payload, signal);
  await writeCache(key, { text, at: Date.now() }).catch(() => undefined);
  return text;
}
