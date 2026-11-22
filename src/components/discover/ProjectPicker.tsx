import { useEffect, useRef, useState, type FormEvent } from "react";
import { getPublicProject, listMyProjects } from "../../services/project-match.service";
import type { ProjectContext, PublicRepo } from "../../types/discovery";

export default function ProjectPicker({
  token,
  login,
  project,
  onChange,
}: {
  token: string;
  login: string;
  project?: ProjectContext;
  onChange: (value?: ProjectContext) => void;
}) {
  const [projects, setProjects] = useState<PublicRepo[]>([]);
  const [url, setUrl] = useState("");
  const [page, setPage] = useState(0);
  const [more, setMore] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | undefined>(undefined);
  useEffect(() => () => controller.current?.abort(), []);

  async function perform<T>(
    action: (signal: AbortSignal) => Promise<T>,
    handle: (value: T) => void,
  ) {
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    setBusy(true);
    setError("");
    try {
      const value = await action(request.signal);
      if (!request.signal.aborted) handle(value);
    } catch {
      if (!request.signal.aborted)
        setError("无法读取公开仓库，请检查地址、GitHub 权限或网络后重试。");
    } finally {
      if (!request.signal.aborted) setBusy(false);
    }
  }

  const nextPage = () =>
    void perform(
      (signal) => listMyProjects(token, login, page + 1, signal),
      (result) => {
        setProjects((items) => [...items, ...result.repos]);
        setPage(page + 1);
        setMore(result.hasMore);
      },
    );
  const select = (repo: PublicRepo) => onChange({ repo, goal: "", keywords: [] });
  const add = (event: FormEvent) => {
    event.preventDefault();
    if (url.trim()) void perform((signal) => getPublicProject(url, signal), select);
  };

  return (
    <div className="space-y-3 text-sm">
      <p className="text-text-secondary">
        选一个公开仓库，后续发现和详情会优先给出与它相关的证据。
      </p>
      <div className="flex flex-wrap items-end gap-2">
        {projects.length > 0 && (
          <label className="min-w-[180px] flex-1">
            我的公开仓库
            <select
              className="input mt-1"
              value={projects.some((item) => item.id === project?.repo.id) ? project?.repo.id : ""}
              onChange={(event) => {
                const selected = projects.find((item) => item.id === Number(event.target.value));
                if (selected) select(selected);
              }}
            >
              <option value="" disabled>
                选择仓库
              </option>
              {projects.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.fullName}
                </option>
              ))}
            </select>
          </label>
        )}
        {more && (
          <button className="btn-secondary" type="button" onClick={nextPage} disabled={busy}>
            {page ? "下一页仓库" : "读取我的公开仓库"}
          </button>
        )}
        {!more && !projects.length && <span>当前账号没有可选的自有公开仓库。</span>}
      </div>
      <form className="flex flex-wrap items-end gap-2" onSubmit={add}>
        <label className="min-w-[200px] flex-1">
          或输入公开 GitHub 仓库
          <input
            className="input mt-1"
            placeholder="owner/repo"
            maxLength={220}
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
        </label>
        <button className="btn-secondary" type="submit" disabled={busy || !url.trim()}>
          使用此仓库
        </button>
      </form>
      {busy && <p role="status">正在读取仓库…</p>}
      {error && (
        <p role="alert" className="text-error">
          {error}
        </p>
      )}
      {project && (
        <div className="space-y-2 rounded-lg border border-border p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <a
              className="font-semibold text-info-text underline"
              href={project.repo.htmlUrl}
              target="_blank"
              rel="noreferrer"
            >
              {project.repo.fullName}
            </a>
            <button className="btn-ghost" type="button" onClick={() => onChange(undefined)}>
              清除选择
            </button>
          </div>
          <label className="block">
            项目目标
            <textarea
              className="input mt-1"
              maxLength={500}
              value={project.goal}
              rows={2}
              onChange={(event) => onChange({ ...project, goal: event.target.value })}
            />
          </label>
          <label className="block">
            项目关键词（用逗号分隔）
            <input
              className="input mt-1"
              maxLength={350}
              defaultValue={project.keywords.join(", ")}
              key={project.repo.id}
              onBlur={(event) =>
                onChange({
                  ...project,
                  keywords: event.target.value
                    .split(/[,，]/)
                    .map((item) => item.trim())
                    .filter(Boolean)
                    .slice(0, 12),
                })
              }
            />
          </label>
        </div>
      )}
    </div>
  );
}
