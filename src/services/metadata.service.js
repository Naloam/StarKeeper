import { 
  getUserGists, 
  createMetadataGist, 
  updateMetadataGist, 
  getMetadataGist 
} from './github.service';

/**
 * 元数据管理服务
 * 负责将标签、笔记等数据保存到用户的 GitHub Gist
 */

const METADATA_GIST_FILENAME = 'starkeeper-metadata.json';
const METADATA_GIST_DESCRIPTION = 'StarKeeper metadata (auto-managed by app)';

/**
 * 查找或创建 StarKeeper 的元数据 Gist
 * @param {string} accessToken
 * @returns {Promise<string>} Gist ID
 */
export async function findOrCreateMetadataGist(accessToken) {
  try {
    // 查找现有的元数据 Gist
    const gists = await getUserGists(accessToken);
    const metadataGist = gists.find(
      gist => gist.description === METADATA_GIST_DESCRIPTION &&
              gist.files[METADATA_GIST_FILENAME]
    );

    if (metadataGist) {
      return metadataGist.id;
    }

    // 如果不存在，创建新的
    const newGist = await createMetadataGist(accessToken, {
      version: '1.0',
      repositories: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return newGist.id;
  } catch (error) {
    console.error('查找或创建元数据 Gist 失败:', error);
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
    const metadata = await getMetadataGist(accessToken, gistId);
    return metadata;
  } catch (error) {
    console.error('加载元数据失败:', error);
    // 如果加载失败，返回空的元数据结构
    return {
      version: '1.0',
      repositories: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

/**
 * 保存元数据到 Gist
 * @param {string} accessToken
 * @param {string} gistId
 * @param {Object} metadata - 完整的元数据对象
 * @returns {Promise<void>}
 */
export async function saveMetadataToGist(accessToken, gistId, metadata) {
  try {
    const updatedMetadata = {
      ...metadata,
      updatedAt: new Date().toISOString(),
    };

    await updateMetadataGist(accessToken, gistId, updatedMetadata);
    console.log('元数据已保存到 Gist:', gistId);
  } catch (error) {
    console.error('保存元数据失败:', error);
    throw error;
  }
}

/**
 * 更新单个仓库的元数据
 * @param {string} accessToken
 * @param {string} gistId
 * @param {number} repoId
 * @param {Object} repoMetadata - { tags, notes, color }
 * @returns {Promise<void>}
 */
export async function updateRepoMetadata(accessToken, gistId, repoId, repoMetadata) {
  try {
    // 加载现有元数据
    const metadata = await loadMetadataFromGist(accessToken, gistId);

    // 更新特定仓库的元数据
    metadata.repositories = metadata.repositories || {};
    metadata.repositories[repoId] = {
      ...metadata.repositories[repoId],
      ...repoMetadata,
      updatedAt: new Date().toISOString(),
    };

    // 保存回 Gist
    await saveMetadataToGist(accessToken, gistId, metadata);
  } catch (error) {
    console.error('更新仓库元数据失败:', error);
    throw error;
  }
}

/**
 * 批量更新多个仓库的元数据
 * @param {string} accessToken
 * @param {string} gistId
 * @param {Object} reposMetadata - { repoId: { tags, notes, color }, ... }
 * @returns {Promise<void>}
 */
export async function batchUpdateMetadata(accessToken, gistId, reposMetadata) {
  try {
    const metadata = await loadMetadataFromGist(accessToken, gistId);
    
    metadata.repositories = metadata.repositories || {};
    
    Object.entries(reposMetadata).forEach(([repoId, repoMeta]) => {
      metadata.repositories[repoId] = {
        ...metadata.repositories[repoId],
        ...repoMeta,
        updatedAt: new Date().toISOString(),
      };
    });

    await saveMetadataToGist(accessToken, gistId, metadata);
  } catch (error) {
    console.error('批量更新元数据失败:', error);
    throw error;
  }
}

/**
 * 删除仓库的元数据
 * @param {string} accessToken
 * @param {string} gistId
 * @param {number} repoId
 * @returns {Promise<void>}
 */
export async function deleteRepoMetadata(accessToken, gistId, repoId) {
  try {
    const metadata = await loadMetadataFromGist(accessToken, gistId);
    
    if (metadata.repositories && metadata.repositories[repoId]) {
      delete metadata.repositories[repoId];
      await saveMetadataToGist(accessToken, gistId, metadata);
    }
  } catch (error) {
    console.error('删除仓库元数据失败:', error);
    throw error;
  }
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
      notes: meta.notes || '',
      color: meta.color || '#3B82F6',
      updatedAt: new Date().toISOString(),
    };
  });

  return {
    version: '1.0',
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

export default {
  findOrCreateMetadataGist,
  loadMetadataFromGist,
  saveMetadataToGist,
  updateRepoMetadata,
  batchUpdateMetadata,
  deleteRepoMetadata,
  convertStoreToGistFormat,
  convertGistToStoreFormat,
};
