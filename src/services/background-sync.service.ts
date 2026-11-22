import { useAuthStore, useStarsStore } from "../store";
import { loadSessionStars } from "./session-stars.service";
import { loadMetadataFromGist } from "./metadata.service";
import { applySessionMetadata } from "./session-metadata.service";
import toast from "../utils/toast";

const SYNC_INTERVAL_MS = 30 * 60 * 1000;
let timer: ReturnType<typeof setInterval> | undefined;

export async function performBackgroundSync() {
  const { accessToken, gistId, user } = useAuthStore.getState();
  if (!accessToken || !user || !navigator.onLine) return;
  const previousIds = new Set(
    useStarsStore.getState().stars.map((repo: { id: number }) => repo.id),
  );
  const stars = await loadSessionStars(accessToken, user.id, undefined, true);
  if (useAuthStore.getState().accessToken !== accessToken) return;
  if (gistId) {
    const snapshot = await loadMetadataFromGist(accessToken, gistId, user?.id);
    applySessionMetadata(accessToken, gistId, snapshot);
  }
  const added = stars.filter((repo) => !previousIds.has(repo.id)).length;
  if (previousIds.size && added >= 5) toast.success(`发现 ${added} 个新 Star`);
}

export function startBackgroundSync() {
  if (!timer)
    timer = setInterval(
      () => void performBackgroundSync().catch(() => undefined),
      SYNC_INTERVAL_MS,
    );
}

export function stopBackgroundSync() {
  if (timer) clearInterval(timer);
  timer = undefined;
}
