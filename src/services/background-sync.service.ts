import { useAuthStore } from "../store";
import { getAllStarredRepos } from "./github.service";

import toast from "../utils/toast";

import { findOrCreateMetadataGist, loadMetadataFromGist } from "./metadata.service";

import { convertGistToStoreFormat } from "./metadata.service";
import { useStarsStore } from "../store";

/**
 * 后台同步服务 — 定期检查 stars 变化和元数据更新
 */

const SYNC_INTERVAL_MS = 30 * 60 * 1000; // 30 分钟
const STORAGE_KEY = "starkeeper-last-sync";

const NEW_STARS_THRESHOLD = 5; // 超过 5 个新 star 才提示

let syncTimer = null;

/**
 * 获取上次同步时间
 */
export function getLastSyncTime() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? new Date(stored) : null;
}

/**
 * 设置上次同步时间
 */
export function setLastSyncTime(date) {
  localStorage.setItem(STORAGE_KEY, date.toISOString());
}

/**
 * 检查新增的 stars 并返回差异数据
 */
export async function detectChanges(accessToken) {
  try {
    const currentStars = useStarsStore.getState().stars;
    const currentIds = new Set(currentStars.map((s) => s.id));

    const latestStars = await getAllStarredRepos(accessToken);
    const latestIds = new Set(latestStars.map((s) => s.id));

    const newStars = latestStars.filter((s) => !currentIds.has(s.id));
    const removedStars = currentStars.filter((s) => !latestIds.has(s.id));

    return {
      hasChanges: newStars.length > 0 || removedStars.length > 0,
      newStars,
      removedStars,
      totalNew: latestStars.length,
      totalOld: currentStars.length,
    };
  } catch (error) {
    console.error("检测变更失败:", error);
    return { hasChanges: false, newStars: [], removedStars: [], totalNew: 0, totalOld: 0 };
  }
}

/**
 * 执行后台同步
 */
export async function performBackgroundSync() {
  const { accessToken, gistId, setGistId } = useAuthStore.getState();

  if (!accessToken) return;

  try {
    const changes = await detectChanges(accessToken);

    if (changes.hasChanges) {
      const { setStars, setMetadata } = useStarsStore.getState();

      // 获取最新的完整列表
      const latestStars = await getAllStarredRepos(accessToken);
      setStars(latestStars);

      // 刷新元数据
      if (gistId) {
        const gistMeta = await loadMetadataFromGist(accessToken, gistId);
        const storeMeta = convertGistToStoreFormat(gistMeta);
        setMetadata(storeMeta);
      } else {
        const id = await findOrCreateMetadataGist(accessToken);
        setGistId(id);
      }

      if (changes.newStars.length >= NEW_STARS_THRESHOLD) {
        toast.success(`发现 ${changes.newStars.length} 个新 Star！`);
      }
    }

    setLastSyncTime(new Date());
    console.log("后台同步完成:", changes.hasChanges ? "有变更" : "无变更");
  } catch (error) {
    console.error("后台同步失败:", error);
  }
}

/**
 * 启动定时同步
 */
export function startBackgroundSync() {
  if (syncTimer) return;

  // 磰检查是否需要同步（距上次超过间隔时间）
  const lastSync = getLastSyncTime();
  if (lastSync) {
    const elapsed = Date.now() - lastSync.getTime();
    if (elapsed < SYNC_INTERVAL_MS) {
      // 计算延迟
      const delay = SYNC_INTERVAL_MS - elapsed;
      syncTimer = setTimeout(() => {
        performBackgroundSync();
        // 之后每 30 分钟执行一次
        syncTimer = setInterval(performBackgroundSync, SYNC_INTERVAL_MS);
      }, delay);
      return;
    }
  }

  // 首次同步
  performBackgroundSync();
  syncTimer = setInterval(performBackgroundSync, SYNC_INTERVAL_MS);
}

/**
 * 停止定时同步
 */
export function stopBackgroundSync() {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
}
