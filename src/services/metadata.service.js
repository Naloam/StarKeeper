import { 
  getUserGists, 
  createMetadataGist, 
  updateMetadataGist, 
  getMetadataGist 
} from './github.service';
import { addToSyncQueue } from '../components/common/OfflineIndicator';

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
    // 如果离线，从本地缓存加载
    if (!navigator.onLine) {
      console.log('⚠️ 离线状态，从本地缓存加载');
      const cachedMetadata = localStorage.getItem('metadata-cache');
      if (cachedMetadata) {
        return JSON.parse(cachedMetadata);
      }
    }

    const metadata = await getMetadataGist(accessToken, gistId);
    
    // 更新本地缓存
    localStorage.setItem('metadata-cache', JSON.stringify(metadata));
    
    return metadata;
  } catch (error) {
    console.error('加载元数据失败:', error);
    
    // 尝试从本地缓存加载
    const cachedMetadata = localStorage.getItem('metadata-cache');
    if (cachedMetadata) {
      console.log('📦 从本地缓存恢复元数据');
      return JSON.parse(cachedMetadata);
    }
    
    // 如果加载失败且没有缓存，返回空的元数据结构
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
    // 如果离线，将操作加入同步队列
    if (!navigator.onLine) {
      console.log('⚠️ 离线状态，保存到本地缓存');
      localStorage.setItem('metadata-cache', JSON.stringify(metadata));
      addToSyncQueue('save-metadata', { gistId, metadata });
      return;
    }

    const updatedMetadata = {
      ...metadata,
      updatedAt: new Date().toISOString(),
    };

    await updateMetadataGist(accessToken, gistId, updatedMetadata);
    console.log('元数据已保存到 Gist:', gistId);
    
    // 同时更新本地缓存
    localStorage.setItem('metadata-cache', JSON.stringify(updatedMetadata));
  } catch (error) {
    console.error('保存元数据失败:', error);
    // 保存失败时，保存到本地缓存
    localStorage.setItem('metadata-cache', JSON.stringify(metadata));
    addToSyncQueue('save-metadata', { gistId, metadata });
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
    console.log('🔧 updateRepoMetadata 调用:', { gistId, repoId, repoMetadata });
    
    // 加载现有元数据
    const metadata = await loadMetadataFromGist(accessToken, gistId);
    console.log('📥 加载的元数据:', metadata);

    // 更新特定仓库的元数据
    metadata.repositories = metadata.repositories || {};
    metadata.repositories[repoId] = {
      ...metadata.repositories[repoId],
      ...repoMetadata,
      updatedAt: new Date().toISOString(),
    };
    
    console.log('📝 更新后的 repositories[' + repoId + ']:', metadata.repositories[repoId]);

    // 保存回 Gist
    await saveMetadataToGist(accessToken, gistId, metadata);
    console.log('✅ updateRepoMetadata 完成');
  } catch (error) {
    console.error('❌ 更新仓库元数据失败:', error);
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

/**
 * 更新分享配置
 * @param {string} accessToken
 * @param {string} gistId
 * @param {Object} shareConfig - { isPublic, shareTitle, shareDescription }
 * @param {Array} stars - 要分享的仓库列表（可选，如果提供则保存）
 * @returns {Promise<string>} shareId (Gist ID)
 */
export async function updateShareConfig(accessToken, gistId, shareConfig, stars = null) {
  try {
    console.log('📤 更新分享配置:', shareConfig);
    
    // 加载现有元数据
    const metadata = await loadMetadataFromGist(accessToken, gistId);
    
    // 使用 Gist ID 作为 shareId（这样可以通过 shareId 直接获取 Gist）
    const shareId = gistId;
    
    console.log('🔑 ShareId (Gist ID):', shareId);
    
    // 更新分享配置
    const updatedMetadata = {
      ...metadata,
      shareConfig: {
        isPublic: shareConfig.isPublic,
        shareId: shareId,
        shareTitle: shareConfig.shareTitle || 'My Stars Collection',
        shareDescription: shareConfig.shareDescription || '',
        updatedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    };
    
    // 如果提供了 stars 数据，保存到 sharedStars 字段
    if (stars && shareConfig.isPublic) {
      console.log('💾 保存', stars.length, '个仓库到分享列表');
      updatedMetadata.sharedStars = stars.map(star => ({
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
    
    // 保存到 Gist
    await saveMetadataToGist(accessToken, gistId, updatedMetadata);
    
    console.log('✅ 分享配置已更新，ShareId:', shareId);
    
    return shareId;
  } catch (error) {
    console.error('更新分享配置失败:', error);
    throw error;
  }
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
