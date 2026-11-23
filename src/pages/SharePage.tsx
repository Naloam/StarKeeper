import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Star, ExternalLink } from "lucide-react";
import { getShareSnapshot } from "../services/share.service";

function githubUrl(value: string) {
  try {
    const url = new URL(value);
    return url.origin === "https://github.com" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export default function SharePage() {
  const { shareId } = useParams();
  const [snapshot, setSnapshot] = useState<Awaited<ReturnType<typeof getShareSnapshot>>>();
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;
    setSnapshot(undefined);
    setError("");
    void getShareSnapshot(shareId ?? "").then(
      (value) => {
        if (active) setSnapshot(value);
      },
      (failure) => {
        if (active) setError(failure instanceof Error ? failure.message : "无法读取分享");
      },
    );
    return () => {
      active = false;
    };
  }, [shareId]);

  const stars =
    snapshot?.stars.filter((repo) =>
      `${repo.fullName} ${repo.description ?? ""}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
    ) ?? [];
  return (
    <main className="min-h-screen bg-surface px-4 py-10 text-text-primary">
      <div className="mx-auto max-w-4xl space-y-5">
        <Link to="/" className="text-info-text underline">
          StarKeeper 首页
        </Link>
        {error ? (
          <p role="alert">{error}</p>
        ) : !snapshot ? (
          <p role="status">正在读取分享…</p>
        ) : (
          <>
            <h1 className="text-3xl font-bold">{snapshot.title}</h1>
            {snapshot.description && <p className="text-text-secondary">{snapshot.description}</p>}
            <label className="block text-sm">
              搜索分享仓库
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="mt-1 block w-full rounded-md border border-border bg-surface-card px-3 py-2"
              />
            </label>
            {!stars.length && <p role="status">没有符合条件的仓库</p>}
            <ul className="grid gap-3 md:grid-cols-2">
              {stars.map((repo) => (
                <li key={repo.id} className="rounded-lg border border-border bg-surface-card p-4">
                  <a
                    href={githubUrl(repo.htmlUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 font-semibold text-info-text"
                  >
                    {repo.fullName}
                    <ExternalLink size={14} aria-hidden="true" />
                  </a>
                  {repo.description && (
                    <p className="my-2 text-sm text-text-secondary">{repo.description}</p>
                  )}
                  <span className="inline-flex items-center gap-2 text-sm">
                    <Star size={14} aria-hidden="true" />
                    {repo.stargazersCount.toLocaleString()} {repo.language}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}
