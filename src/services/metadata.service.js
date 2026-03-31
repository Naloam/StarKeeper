import {
  getUserGists,
  createMetadataGist,
  updateMetadataGist,
  getMetadataGist,
} from "./github.service";
import { addToSyncQueue } from "../components/common/OfflineIndicator";

/**
 * 元数据管理服务
 * 负责将标签、笔记等数据保存到用户的 GitHub Gist
 */

// ============================================================
// Gist 写入队列 — 防止并发写入导致数据覆盖
// ============================================================
let writeQueue = Promise.resolve();

/**
 * 将任务排入串行写入队列，确保同一时刻只有一个 Gist 写入在进行
 * @param {Function} fn - 返回 Promise 的异步函数
 * @returns {Promise} fn 的返回值
 */
function enqueueWrite(fn) {
  const prev = writeQueue;
  let resolve;
  const wait = new Promise((r) => {
    resolve = r;
  });
  writeQueue = wait;
  return prev.then(() => fn()).finally(resolve);
}

const METADATA_GIST_FILENAME = "starkeeper-metadata.json";
const METADATA_GIST_DESCRIPTION = "StarKeeper metadata (auto-managed by app)";

/**
 * 查找或创建 StarKeeper 的元数据 Gist
 * @param {string} accessToken
 * @returns {Promise<string>} Gist ID
 */
export async function findOrCreateMetadataGist(accessToken) {
  try {
    const gists = await getUserGists(accessToken);
    const metadataGist = gists.find(
      (gist) =>
        gist.description === METADATA_GIST_DESCRIPTION && gist.files[METADATA_GIST_FILENAME],
    );

    if (metadataGist) {
      return metadataGist.id;
    }

    const newGist = await createMetadataGist(accessToken, {
      version: "1.0",
      repositories: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return newGist.id;
  } catch (error) {
    console.error("查找或创建元数据 Gist 失败:", error);
    throw error;
  }
}

/**
 * 从 Gist 加载元数据
 * @param {string} accessToken
 * @param {string} gistId
 * @returns {Promise<Object>} 元数据对象
 */
export async function loadMetadataFromGist(accessToken, gistId) {
  try {
    if (!navigator.onLine) {
      console.log("⚠️ 离线状态，从本地缓存加载");
      const cachedMetadata = localStorage.getItem("metadata-cache");
      if (cachedMetadata) {
        return JSON.parse(cachedMetadata);
      }
    }

    const metadata = await getMetadataGist(accessToken, gistId);
    localStorage.setItem("metadata-cache", JSON.stringify(metadata));
    return metadata;
  } catch (error) {
    console.error("加载元数据失败:", error);

    const cachedMetadata = localStorage.getItem("metadata-cache");
    if (cachedMetadata) {
      console.log("📦 从本地缓存恢复元数据");
      return JSON.parse(cachedMetadata);
    }

    return {
      version: "1.0",
      repositories: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

/**
 * 内部写入 Gist 的实现（不含队列，由 enqueueWrite 包裹调用）
 */
async function doSaveToGist(accessToken, gistId, metadata) {
  if (!navigator.onLine) {
    console.log("⚠️ 离线状态，保存到本地缓存");
    localStorage.setItem("metadata-cache", JSON.stringify(metadata));
    try {
      addToSyncQueue("save-metadata", { gistId, metadata });
    } catch (e) {
      console.error("添加同步队列失败:", e);
    }
    return;
  }

  const updatedMetadata = {
    ...metadata,
    updatedAt: new Date().toISOString(),
  };

  await updateMetadataGist(accessToken, gistId, updatedMetadata);
  console.log("元数据已保存到 Gist:", gistId);
  localStorage.setItem("metadata-cache", JSON.stringify(updatedMetadata));
}

/**
 * 保存元数据到 Gist（通过写入队列串行化）
 * @param {string} accessToken
 * @param {string} gistId
 * @param {Object} metadata - 完整的元数据对象
 * @returns {Promise<void>}
 */
export async function saveMetadataToGist(accessToken, gistId, metadata) {
  return enqueueWrite(async () => {
    try {
      await doSaveToGist(accessToken, gistId, metadata);
    } catch (error) {
      console.error("保存元数据失败:", error);
      localStorage.setItem("metadata-cache", JSON.stringify(metadata));
      try {
        addToSyncQueue("save-metadata", { gistId, metadata });
      } catch (e) {
        console.error("添加同步队列失败:", e);
      }
      throw error;
    }
  });
}

/**
 * 更新单个仓库的元数据（通过写入队列串行化，先加载最新再写入）
 * @param {string} accessToken
 * @param {string} gistId
 * @param {number} repoId
 * @param {Object} repoMetadata - { tags, notes, color }
 * @returns {Promise<void>}
 */
export async function updateRepoMetadata(accessToken, gistId, repoId, repoMetadata) {
  return enqueueWrite(async () => {
    // 在队列内部加载最新元数据，避免竞态覆盖
    const metadata = await loadMetadataFromGist(accessToken, gistId);
    metadata.repositories = metadata.repositories || {};
    metadata.repositories[repoId] = {
      ...metadata.repositories[repoId],
      ...repoMetadata,
      updatedAt: new Date().toISOString(),
    };

    await doSaveToGist(accessToken, gistId, metadata);
  });
}

/**
 * 批量更新多个仓库的元数据（原子操作，一次加载一次写入）
 * @param {string} accessToken
 * @param {string} gistId
 * @param {Object} reposMetadata - { repoId: { tags, notes, color }, ... }
 * @returns {Promise<void>}
 */
export async function batchUpdateMetadata(accessToken, gistId, reposMetadata) {
  return enqueueWrite(async () => {
    const metadata = await loadMetadataFromGist(accessToken, gistId);
    metadata.repositories = metadata.repositories || {};

    Object.entries(reposMetadata).forEach(([repoId, repoMeta]) => {
      metadata.repositories[repoId] = {
        ...metadata.repositories[repoId],
        ...repoMeta,
        updatedAt: new Date().toISOString(),
      };
    });

    await doSaveToGist(accessToken, gistId, metadata);
  });
}

/**
 * 删除仓库的元数据
 * @param {string} accessToken
 * @param {string} gistId
 * @param {number} repoId
 * @returns {Promise<void>}
 */
export async function deleteRepoMetadata(accessToken, gistId, repoId) {
  return enqueueWrite(async () => {
    const metadata = await loadMetadataFromGist(accessToken, gistId);

    if (metadata.repositories && metadata.repositories[repoId]) {
      delete metadata.repositories[repoId];
      await doSaveToGist(accessToken, gistId, metadata);
    }
  });
}

/**
 * 将 Zustand store 的 metadata 格式转换为 Gist 格式
 * @param {Object} storeMetadata - { repoId: { tags, notes, color }, ... }
 * @returns {Object}
 */
export function convertStoreToGistFormat(storeMetadata) {
  const repositories = {};

  Object.entries(storeMetadata).forEach(([repoId, meta]) => {
    repositories[repoId] = {
      tags: meta.tags || [],
      notes: meta.notes || "",
      color: meta.color || "#3B82F6",
      ...(meta.healthScore ? { healthScore: meta.healthScore } : {}),
      ...(meta.aiSummary ? { aiSummary: meta.aiSummary } : {}),
      ...(meta.embedding ? { embedding: meta.embedding } : {}),
      ...(meta.embeddingUpdatedAt ? { embeddingUpdatedAt: meta.embeddingUpdatedAt } : {}),
      ...(meta.archived ? { archived: meta.archived } : {}),
      updatedAt: new Date().toISOString(),
    };
  });

  return {
    version: "1.0",
    repositories,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * 将 Gist 格式转换为 Zustand store 的 metadata 格式
 * @param {Object} gistMetadata
 * @returns {Object}
 */
export function convertGistToStoreFormat(gistMetadata) {
  return gistMetadata.repositories || {};
}

/**
 * 更新分享配置
 * @param {string} accessToken
 * @param {string} gistId
 * @param {Object} shareConfig - { isPublic, shareTitle, shareDescription }
 * @param {Array} stars - 要分享的仓库列表（可选，如果提供则保存）
 * @returns {Promise<string>} shareId (Gist ID)
 */
export async function updateShareConfig(accessToken, gistId, shareConfig, stars = null) {
  return enqueueWrite(async () => {
    const metadata = await loadMetadataFromGist(accessToken, gistId);
    const shareId = gistId;

    const updatedMetadata = {
      ...metadata,
      shareConfig: {
        isPublic: shareConfig.isPublic,
        shareId: shareId,
        shareTitle: shareConfig.shareTitle || "My Stars Collection",
        shareDescription: shareConfig.shareDescription || "",
        updatedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    };

    if (stars && shareConfig.isPublic) {
      updatedMetadata.sharedStars = stars.map((star) => ({
        id: star.id,
        name: star.name,
        fullName: star.fullName,
        owner: {
          login: star.owner.login,
          avatarUrl: star.owner.avatarUrl,
        },
        description: star.description,
        language: star.language,
        stargazersCount: star.stargazersCount,
        forksCount: star.forksCount,
        htmlUrl: star.htmlUrl,
        createdAt: star.createdAt,
        updatedAt: star.updatedAt,
      }));
    }

    await doSaveToGist(accessToken, gistId, updatedMetadata);
    return shareId;
  });
}

export default {
  findOrCreateMetadataGist,
  loadMetadataFromGist,
  saveMetadataToGist,
  updateRepoMetadata,
  batchUpdateMetadata,
  deleteRepoMetadata,
  convertStoreToGistFormat,
  convertGistToStoreFormat,
  updateShareConfig,
};
