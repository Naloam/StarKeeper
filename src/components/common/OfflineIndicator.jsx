import { useState, useEffect, useCallback, useRef } from "react";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

const SYNC_QUEUE_KEY = "offline-sync-queue";
const MAX_QUEUE_SIZE = 200;
const MAX_RETRY_COUNT = 5;
const BASE_RETRY_DELAY_MS = 2000;

/**
 * 生成操作的去重键：同类型 + 同目标视为重复
 */
function getDedupeKey(operation) {
  const { type, data } = operation;
  if (type === "save-metadata") return `save-metadata:${data.gistId}`;
  if (type === "update-metadata") return `update-metadata:${data.gistId}:${data.repoId}`;
  if (type === "star-repo" || type === "unstar-repo") return `${type}:${data.owner}/${data.repo}`;
  return `${type}:${Date.now()}`; // 不去重
}

/**
 * 离线状态指示器组件
 * 显示网络连接状态和同步待处理操作
 */
export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncTimerRef = useRef(null);

  const checkPendingSync = useCallback(() => {
    try {
      const syncQueue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || "[]");
      setPendingSync(syncQueue.length);
    } catch (error) {
      console.error("检查同步队列失败:", error);
    }
  }, []);

  // 执行单个操作（懒加载服务模块）
  const executeOperation = useCallback(async (operation) => {
    const { type, data } = operation;

    const authStore = JSON.parse(localStorage.getItem("starkeeper-auth") || "{}");
    const accessToken = authStore.state?.accessToken;

    if (!accessToken) {
      throw new Error("未找到访问令牌");
    }

    // 按需加载服务模块
    const [githubModule, metadataModule] = await Promise.all([
      import("../../services/github.service"),
      import("../../services/metadata.service"),
    ]);

    switch (type) {
      case "save-metadata":
        await githubModule.updateMetadataGist(accessToken, data.gistId, data.metadata);
        break;
      case "update-metadata":
        await metadataModule.updateRepoMetadata(
          accessToken,
          data.gistId,
          data.repoId,
          data.metadata,
        );
        break;
      case "star-repo":
        await githubModule.starRepo(accessToken, data.owner, data.repo);
        break;
      case "unstar-repo":
        await githubModule.unstarRepo(accessToken, data.owner, data.repo);
        break;
      default:
        console.warn("未知的操作类型:", type);
    }
  }, []);

  const syncPendingOperations = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;

    try {
      setIsSyncing(true);
      const syncQueue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || "[]");

      if (syncQueue.length === 0) {
        setPendingSync(0);
        return;
      }

      const loadingToast = toast.loading(`正在同步 ${syncQueue.length} 个操作...`);
      const failedOperations = [];
      let successCount = 0;

      for (const operation of syncQueue) {
        try {
          await executeOperation(operation);
          successCount++;
        } catch (error) {
          console.error("同步操作失败:", operation.type, error);
          // 指数退避：超过最大重试次数则丢弃
          const retryCount = (operation.retryCount || 0) + 1;
          if (retryCount <= MAX_RETRY_COUNT) {
            failedOperations.push({ ...operation, retryCount });
          } else {
            console.warn("操作已达到最大重试次数，丢弃:", operation.type);
          }
        }
      }

      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(failedOperations));
      setPendingSync(failedOperations.length);
      toast.dismiss(loadingToast);

      if (failedOperations.length === 0) {
        toast.success(`${successCount} 个操作已全部同步`);
      } else {
        toast.error(`${successCount} 成功，${failedOperations.length} 个将在稍后重试`);
      }
    } catch (error) {
      console.error("同步失败:", error);
      toast.error("同步失败: " + error.message);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, executeOperation]);

  // 调度延迟同步（带退避）
  const scheduleRetry = useCallback(
    (delayMs) => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      syncTimerRef.current = setTimeout(() => {
        syncPendingOperations();
      }, delayMs);
    },
    [syncPendingOperations],
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("网络已连接");
      syncPendingOperations();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error("网络已断开，将在离线模式下工作");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    checkPendingSync();

    // 应用启动时若在线且有待同步，延迟同步
    if (navigator.onLine) {
      const syncQueue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || "[]");
      if (syncQueue.length > 0) {
        // 根据最大 retryCount 计算退避延迟
        const maxRetry = Math.max(0, ...syncQueue.map((op) => op.retryCount || 0));
        const delay = BASE_RETRY_DELAY_MS * Math.pow(2, maxRetry - 1);
        scheduleRetry(Math.min(delay, 30000));
      }
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [checkPendingSync, syncPendingOperations, scheduleRetry]);

  if (isOnline && pendingSync === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg text-sm font-medium
          transition-all duration-300
          ${isOnline ? "bg-green-500 text-white" : "bg-yellow-500 text-gray-900"}
        `}
      >
        {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4 animate-pulse" />}
        <span>{isOnline ? "在线" : "离线模式"}</span>

        {pendingSync > 0 && (
          <>
            <span className="mx-1">•</span>
            <span>{pendingSync} 个待同步</span>
            {isOnline && (
              <button
                onClick={syncPendingOperations}
                disabled={isSyncing}
                className="ml-2 p-1 hover:bg-white/20 rounded transition-colors disabled:opacity-50"
                aria-label="立即同步"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * 添加操作到同步队列（带去重和大小限制）
 */
export function addToSyncQueue(type, data) {
  try {
    const syncQueue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || "[]");

    const newOp = {
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    // 去重：同类同目标的旧操作替换为新操作
    const dedupeKey = getDedupeKey(newOp);
    const filtered = syncQueue.filter((op) => getDedupeKey(op) !== dedupeKey);
    filtered.push(newOp);

    // 队列大小限制：保留最新的操作
    const trimmed = filtered.length > MAX_QUEUE_SIZE ? filtered.slice(-MAX_QUEUE_SIZE) : filtered;

    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(trimmed));
    console.log("操作已加入同步队列:", type);
  } catch (error) {
    console.error("添加到同步队列失败:", error);
  }
}

/**
 * 清除同步队列
 */
export function clearSyncQueue() {
  try {
    localStorage.removeItem(SYNC_QUEUE_KEY);
    return true;
  } catch (error) {
    console.error("清除同步队列失败:", error);
    return false;
  }
}
