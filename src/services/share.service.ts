import type { ShareConfig, SharedStar, StarredRepo } from "../types";
import {
  createGist,
  fetchGist,
  METADATA_FILE,
  SHARE_FILE,
  statusOf,
  writeGistFiles,
} from "./gist.service";
import {
  hasLegacySharingRisk,
  LegacySharingGist,
  loadMetadataFromGist,
  mutateMetadata,
} from "./metadata.service";

const SHARE_LINK = /^v1-([a-z0-9-]{1,39})~([a-f0-9]{5,64})$/i;
const DESCRIPTION = "StarKeeper shared repository snapshot";
type ShareInput = Pick<ShareConfig, "isPublic" | "shareTitle" | "shareDescription">;

interface ShareSnapshot {
  version: 1;
  active: boolean;
  title: string;
  description: string;
  stars: SharedStar[];
}

export function buildShareSnapshot(config: ShareInput, repos: StarredRepo[]): ShareSnapshot {
  return {
    version: 1,
    active: config.isPublic,
    title: config.shareTitle.trim().slice(0, 120) || "My Stars Collection",
    description: config.shareDescription.trim().slice(0, 500),
    stars: config.isPublic
      ? repos
          .filter((repo) => repo.isPrivate === false && repo.visibility === "public")
          .map((repo) => ({
            id: repo.id,
            name: repo.name,
            fullName: repo.fullName,
            owner: { login: repo.owner.login, avatarUrl: repo.owner.avatarUrl },
            description: repo.description,
            language: repo.language,
            stargazersCount: repo.stargazersCount,
            forksCount: repo.forksCount,
            htmlUrl: repo.htmlUrl,
            createdAt: repo.createdAt,
            updatedAt: repo.updatedAt,
          }))
      : [],
  };
}

export function isShareLink(id: string) {
  return SHARE_LINK.test(id);
}

export async function getShareSnapshot(shareId: string): Promise<ShareSnapshot> {
  const match = SHARE_LINK.exec(shareId);
  if (!match) throw new Error("旧版分享链接已停用。请联系分享者生成新链接。");
  const [, owner, gistId] = match;
  // Fetch only the public share file. Even a forged link cannot fetch a metadata JSON.
  const response = await fetch(
    `https://gist.githubusercontent.com/${owner}/${gistId}/raw/${SHARE_FILE}`,
    {
      cache: "no-store",
      credentials: "omit",
      redirect: "error",
    },
  );
  if (!response.ok) throw new Error("分享未开启或已撤销");
  const value = (await response.json()) as ShareSnapshot;
  if (value?.version !== 1 || value.active !== true || !Array.isArray(value.stars)) {
    throw new Error("分享未开启或已撤销");
  }
  return value;
}

export async function updateShareSnapshot(
  token: string,
  id: string,
  owner: { id: number; login: string },
  input: ShareInput,
  stars: StarredRepo[],
) {
  if (!navigator.onLine) throw new Error("联网后可发布或撤销分享");
  const metadata = await loadMetadataFromGist(token, id, owner.id);
  if (hasLegacySharingRisk(metadata, id)) throw new LegacySharingGist();
  const { shareConfig } = metadata;
  const snapshot = buildShareSnapshot(input, stars);
  let snapshotId = SHARE_LINK.exec(shareConfig?.shareId ?? "")?.[2] ?? "";
  if (snapshotId) {
    try {
      const gist = await fetchGist(token, snapshotId);
      if (gist.owner?.id !== owner.id || gist.files?.[METADATA_FILE] || !gist.files?.[SHARE_FILE]) {
        throw new Error("分享快照无法验证");
      }
      await writeGistFiles(token, snapshotId, {
        [SHARE_FILE]: { content: JSON.stringify(snapshot) },
      });
    } catch (error) {
      if (statusOf(error) !== 404) throw error;
      snapshotId = "";
    }
  }
  if (!snapshotId && snapshot.active) {
    snapshotId = await createGist(token, DESCRIPTION, SHARE_FILE, snapshot);
  }
  const config: ShareConfig = {
    isPublic: snapshot.active,
    shareId: snapshotId ? `v1-${owner.login}~${snapshotId}` : "",
    shareTitle: snapshot.title,
    shareDescription: snapshot.description,
    updatedAt: new Date().toISOString(),
  };
  const result = await mutateMetadata(token, id, [{ kind: "share", config }], owner.id);
  return { ...result, config };
}
