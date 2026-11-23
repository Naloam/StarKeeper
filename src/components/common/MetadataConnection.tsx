import { useState } from "react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store";
import useMetadataSession from "../../hooks/useMetadataSession";
import {
  DuplicateMetadataGists,
  LegacySharingGist,
  rotateLegacyMetadata,
} from "../../services/metadata.service";

export default function MetadataConnection() {
  const { error, retry } = useMetadataSession();
  const [moving, setMoving] = useState(false);
  const { accessToken, setGistId, gistId, user } = useAuthStore();
  if (!accessToken || !error) return null;

  const rotate = async () => {
    if (
      !gistId ||
      !user ||
      !window.confirm(
        "把数据复制到新的未列出 Gist，并将旧 Gist 标记为退役？旧 Gist 和修订历史会保留。",
      )
    )
      return;
    setMoving(true);
    try {
      setGistId(await rotateLegacyMetadata(accessToken, gistId, user.id));
      toast.success("元数据已迁移");
    } catch {
      toast.error("迁移未完成，请检查网络并在 GitHub Gists 核对候选文件");
    } finally {
      setMoving(false);
    }
  };

  return (
    <aside
      role="alert"
      className="fixed bottom-4 left-4 z-40 max-h-[50vh] max-w-sm space-y-2 overflow-auto rounded-lg border border-border bg-surface-card p-4 text-sm text-text-primary shadow-md"
    >
      <p>
        {error instanceof DuplicateMetadataGists || error instanceof LegacySharingGist
          ? error.message
          : "无法连接元数据 Gist。标签、笔记和收藏夹更新需要有效连接或本地缓存。"}
      </p>
      {error instanceof DuplicateMetadataGists &&
        error.candidates.map((item) => (
          <div key={item.id} className="flex flex-wrap items-center justify-between gap-2">
            <a
              className="text-info-text underline"
              href={`https://gist.github.com/${item.id}`}
              target="_blank"
              rel="noreferrer"
            >
              {item.updatedAt?.slice(0, 10)} · {item.id.slice(0, 8)}…
            </a>
            <button type="button" className="btn-secondary" onClick={() => setGistId(item.id)}>
              使用此 Gist
            </button>
          </div>
        ))}
      {error instanceof LegacySharingGist && (
        <button
          type="button"
          className="btn-primary"
          disabled={moving}
          onClick={() => void rotate()}
        >
          迁移旧分享 Gist
        </button>
      )}
      <button type="button" className="btn-secondary" onClick={retry}>
        重试连接
      </button>
    </aside>
  );
}
