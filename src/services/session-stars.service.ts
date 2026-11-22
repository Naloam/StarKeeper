import { useAuthStore, useStarsStore } from "../store";
import type { StarredRepo } from "../types";
import { readCache, writeCache } from "./browser-cache.service";
import { getAllStarredRepos } from "./github.service";

type Progress = (progress: { current: number; hasMore: boolean }) => void;
const inflight = new Map<number, Promise<StarredRepo[]>>();

export async function loadSessionStars(
  token: string,
  id: number,
  progress?: Progress,
  refresh = false,
) {
  const current: StarredRepo[] = useStarsStore.getState().stars;
  if (!refresh && current.length) return current;
  const pending = inflight.get(id);
  if (pending) return pending;
  const load = async () => {
    const key = `stars-v04:${id}`;
    const cached = await readCache<StarredRepo[]>(key);
    if (
      cached &&
      (!current.length || !navigator.onLine) &&
      useAuthStore.getState().accessToken === token
    ) {
      useStarsStore.getState().setStars(cached);
    }
    if (!navigator.onLine && cached) return cached;
    const stars = await getAllStarredRepos(token, progress);
    if (useAuthStore.getState().accessToken === token) {
      useStarsStore.getState().setStars(stars);
      await writeCache(
        key,
        stars.filter((repo) => repo.isPrivate === false && repo.visibility === "public"),
      ).catch(() => undefined);
    }
    return stars;
  };
  const operation = load();
  inflight.set(id, operation);
  try {
    return await operation;
  } finally {
    if (inflight.get(id) === operation) inflight.delete(id);
  }
}
