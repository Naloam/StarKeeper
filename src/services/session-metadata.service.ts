import { useAuthStore, useStarsStore } from "../store";
import type { GistMetadata, StarredRepo } from "../types";
import { convertGistToStoreFormat, mutateMetadata, type MetadataChange } from "./metadata.service";

export function applySessionMetadata(
  token: string,
  id: string,
  metadata: GistMetadata,
  repos?: StarredRepo[],
) {
  const auth = useAuthStore.getState();
  if (auth.accessToken !== token || auth.gistId !== id) return;
  const store = useStarsStore.getState();
  store.setMetadata(convertGistToStoreFormat(metadata, repos ?? store.stars));
  store.setCollections(metadata.collections ?? []);
  store.setShareConfig(metadata.shareConfig ?? null);
}

export async function updateSessionMetadata(changes: MetadataChange[]) {
  const { accessToken, gistId, user } = useAuthStore.getState();
  if (!accessToken || !gistId) throw new Error("请先连接 StarKeeper 元数据 Gist");
  const result = await mutateMetadata(accessToken, gistId, changes, user?.id);
  applySessionMetadata(accessToken, gistId, result.metadata);
  return result;
}
