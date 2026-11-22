import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import useModalA11y from "../../hooks/useModalA11y";
import { useSettingsStore } from "../../store/settings";
import {
  analyzeProjectMatch,
  buildProjectMatch,
  type ProjectReport,
} from "../../services/project-match.service";
import type { ProjectContext, PublicRepo } from "../../types/discovery";

export default function MatchReport({
  candidate,
  project,
  onClose,
}: {
  candidate: PublicRepo;
  project?: ProjectContext;
  onClose: () => void;
}) {
  const [report, setReport] = useState<ProjectReport>();
  const [error, setError] = useState("");
  const [aiError, setAiError] = useState("");
  const [ai, setAi] = useState("");
  const [working, setWorking] = useState(false);
  const aiRequest = useRef<AbortController | undefined>(undefined);
  const key = useSettingsStore((state) => state.deepseekApiKey);
  const modalRef = useModalA11y<HTMLElement>(true, onClose);

  useEffect(() => {
    const abort = new AbortController();
    void buildProjectMatch(candidate, project, abort.signal).then(
      (result) => {
        if (!abort.signal.aborted) setReport(result);
      },
      () => {
        if (!abort.signal.aborted)
          setError("无法读取公开项目资料。请检查仓库可见性、连接或 GitHub API 用量。");
      },
    );
    return () => {
      abort.abort();
      aiRequest.current?.abort();
    };
  }, [candidate, project]);

  const runAnalysis = async () => {
    if (
      !report ||
      working ||
      !key ||
      !window.confirm(
        "复核仓库公开状态后，最多发起 1 次模型请求，发送公开 README 摘录和仓库信息。继续？",
      )
    )
      return;
    const abort = new AbortController();
    aiRequest.current = abort;
    setWorking(true);
    setAiError("");
    try {
      const text = await analyzeProjectMatch(report, abort.signal);
      if (!abort.signal.aborted) setAi(text);
    } catch {
      if (!abort.signal.aborted)
        setAiError("无法完成模型分析，请检查仓库可见性、API Key 或服务用量。");
    } finally {
      if (!abort.signal.aborted) setWorking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <section
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="match-title"
        className="max-h-[88vh] w-full max-w-2xl overflow-auto rounded-xl bg-surface-card p-5 text-text-primary shadow-xl md:p-7"
      >
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-text-secondary">Project Match</p>
            <h2 id="match-title" className="break-all text-xl font-semibold">
              {candidate.fullName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-2 hover:bg-surface-darker"
            aria-label="关闭项目报告"
          >
            <X size={19} />
          </button>
        </header>
        {error ? (
          <p role="alert">{error}</p>
        ) : !report ? (
          <p role="status">正在读取项目与来源…</p>
        ) : (
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-semibold">项目事实</h3>
              <p className="text-text-secondary">
                {report.details.repo.description || "仓库未填写简介。"}
              </p>
              {report.readmeIntro && (
                <blockquote className="my-2 border-l-2 border-border pl-3 text-text-secondary">
                  {report.readmeIntro}
                  <cite className="ml-1 text-xs">README</cite>
                </blockquote>
              )}
              <p className="text-text-secondary">
                {[
                  report.details.repo.language,
                  report.details.repo.licenseId,
                  ...report.details.dependencies,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {!!report.evidence.length && (
                <ul className="mt-1 list-inside list-disc">
                  {report.evidence.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
            <section>
              <h3 className="font-semibold">关系推断</h3>
              <p className="text-text-secondary">{report.relation}</p>
            </section>
            <section>
              <h3 className="font-semibold">建议操作</h3>
              <p className="text-text-secondary">{report.next}</p>
            </section>
            <section>
              <h3 className="font-semibold">待验证事项</h3>
              <ul className="list-inside list-disc text-text-secondary">
                {report.risks.map((risk) => (
                  <li key={risk}>{risk}</li>
                ))}
              </ul>
            </section>
            <section>
              <h3 className="font-semibold">来源</h3>
              <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                {report.sources.map((source) => (
                  <li key={source.label + source.url}>
                    <a
                      className="text-info-text underline"
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {source.label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
            {key ? (
              <div className="space-y-2 border-t border-border pt-3">
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={working}
                  onClick={runAnalysis}
                >
                  {working ? "分析中…" : "用 AI 深入分析"}
                </button>
                {working && (
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => {
                      aiRequest.current?.abort();
                      setWorking(false);
                    }}
                  >
                    取消
                  </button>
                )}
                {aiError && (
                  <p role="alert" className="text-error">
                    {aiError}
                  </p>
                )}
                {ai && (
                  <div className="space-y-1">
                    <h3 className="font-semibold">模型推断 · 待核实</h3>
                    <p className="whitespace-pre-wrap text-text-secondary">{ai}</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
