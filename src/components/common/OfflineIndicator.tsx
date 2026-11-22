import { useCallback, useEffect, useState } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store";
import { METADATA_QUEUE_EVENT, pendingMetadataCount } from "../../services/metadata.service";
import { updateSessionMetadata } from "../../services/session-metadata.service";

export default function OfflineIndicator() {
  const { gistId, accessToken } = useAuthStore();
  const [online, setOnline] = useState(navigator.onLine);
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const retry = useCallback(
    async (notify = false) => {
      if (!accessToken || !gistId || !navigator.onLine || !pendingMetadataCount(gistId)) return;
      setSyncing(true);
      try {
        const result = await updateSessionMetadata([]);
        if (notify && result.pending) toast.error("同步暂未完成，修改仍保存在本机");
      } catch {
        if (notify) toast.error("无法同步，修改仍保存在本机");
      } finally {
        setSyncing(false);
      }
    },
    [accessToken, gistId],
  );

  useEffect(() => {
    const refresh = () => {
      setOnline(navigator.onLine);
      setPending(pendingMetadataCount(gistId));
    };
    const connect = () => {
      refresh();
      void retry();
    };
    refresh();
    const timer = setInterval(() => void retry(), 60_000);
    window.addEventListener("online", connect);
    window.addEventListener("offline", refresh);
    window.addEventListener(METADATA_QUEUE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    void retry();
    return () => {
      clearInterval(timer);
      window.removeEventListener("online", connect);
      window.removeEventListener("offline", refresh);
      window.removeEventListener(METADATA_QUEUE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [gistId, retry]);

  if (online && !pending) return null;
  return (
    <aside
      role="status"
      className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-lg border border-border bg-surface-card px-4 py-2 text-sm text-text-primary shadow-md"
    >
      {!online && (
        <>
          <WifiOff size={16} aria-hidden="true" />
          离线模式
        </>
      )}
      {!!pending && <span>{pending} 项待同步</span>}
      {online && !!pending && (
        <button
          type="button"
          onClick={() => void retry(true)}
          disabled={syncing}
          aria-label="立即同步"
          className="rounded p-1 hover:bg-surface-darker"
        >
          <RefreshCw size={16} className={syncing ? "animate-spin" : ""} aria-hidden="true" />
        </button>
      )}
    </aside>
  );
}
