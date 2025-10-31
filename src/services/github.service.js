import { Octokit } from '@octokit/rest';
import { GITHUB_CONFIG } from '../config';

/**
 * GitHub API 服务封装
 */

/**
 * 创建 Octokit 实例
 * @param {string} accessToken - GitHub access token
 * @returns {Octokit}
 */
export function createOctokitClient(accessToken) {
  return new Octokit({
    auth: accessToken,
    baseUrl: GITHUB_CONFIG.api.baseUrl,
    userAgent: 'StarKeeper v1.0',
  });
}

/**
 * 获取当前用户信息
 * @param {string} accessToken
 * @returns {Promise<Object>}
 */
export async function getCurrentUser(accessToken) {
  try {
    const octokit = createOctokitClient(accessToken);
    const { data } = await octokit.users.getAuthenticated();
    
    return {
      id: data.id,
      login: data.login,
      name: data.name,
      avatarUrl: data.avatar_url,
      email: data.email,
      bio: data.bio,
      publicRepos: data.public_repos,
      followers: data.followers,
      following: data.following,
    };
  } catch (error) {
    console.error('获取用户信息失败:', error);
    throw error;
  }
}

/**
 * 获取用户的 starred repositories
 * @param {string} accessToken
 * @param {Object} options - { page, perPage, sort }
 * @returns {Promise<Array>}
 */
export async function getStarredRepos(accessToken, options = {}) {
  try {
    const {
      page = 1,
      perPage = 30,
      sort = 'created',  // created | updated
      direction = 'desc',
    } = options;

    const octokit = createOctokitClient(accessToken);
    const { data } = await octokit.activity.listReposStarredByAuthenticatedUser({
      per_page: perPage,
      page: page,
      sort: sort,
      direction: direction,
    });

    return data.map(repo => ({
      id: repo.id,
      nodeId: repo.node_id,
      name: repo.name,
      fullName: repo.full_name,
      owner: {
        login: repo.owner.login,
        avatarUrl: repo.owner.avatar_url,
      },
      description: repo.description,
      htmlUrl: repo.html_url,
      homepage: repo.homepage,
      language: repo.language,
      stargazersCount: repo.stargazers_count,
      forksCount: repo.forks_count,
      openIssuesCount: repo.open_issues_count,
      watchers: repo.watchers,
      topics: repo.topics || [],
      license: repo.license?.name,
      visibility: repo.visibility,
      defaultBranch: repo.default_branch,
      createdAt: repo.created_at,
      updatedAt: repo.updated_at,
      pushedAt: repo.pushed_at,
      archived: repo.archived,
      disabled: repo.disabled,
    }));
  } catch (error) {
    console.error('获取 starred repos 失败:', error);
    throw error;
  }
}

/**
 * 获取所有 starred repositories（处理分页）
 * @param {string} accessToken
 * @param {Function} onProgress - 进度回调
 * @returns {Promise<Array>}
 */
export async function getAllStarredRepos(accessToken, onProgress) {
  try {
    const octokit = createOctokitClient(accessToken);
    let allRepos = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const { data } = await octokit.activity.listReposStarredByAuthenticatedUser({
        per_page: perPage,
        page: page,
      });

      if (data.length === 0) break;

      const formatted = data.map(repo => ({
        id: repo.id,
        nodeId: repo.node_id,
        name: repo.name,
        fullName: repo.full_name,
        owner: {
          login: repo.owner.login,
          avatarUrl: repo.owner.avatar_url,
        },
        description: repo.description,
        htmlUrl: repo.html_url,
        homepage: repo.homepage,
        language: repo.language,
        stargazersCount: repo.stargazers_count,
        forksCount: repo.forks_count,
        openIssuesCount: repo.open_issues_count,
        topics: repo.topics || [],
        license: repo.license?.name,
        createdAt: repo.created_at,
        updatedAt: repo.updated_at,
        pushedAt: repo.pushed_at,
        archived: repo.archived,
      }));

      allRepos = [...allRepos, ...formatted];

      // 调用进度回调
      if (onProgress) {
        onProgress({
          current: allRepos.length,
          hasMore: data.length === perPage,
        });
      }

      // 如果返回的数据少于 perPage，说明已经是最后一页
      if (data.length < perPage) break;

      page++;

      // 避免速率限制
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return allRepos;
  } catch (error) {
    console.error('获取所有 starred repos 失败:', error);
    throw error;
  }
}

/**
 * 获取仓库的 README 内容
 * @param {string} accessToken
 * @param {string} owner
 * @param {string} repo
 * @returns {Promise<string>}
 */
export async function getRepoReadme(accessToken, owner, repo) {
  try {
    const octokit = createOctokitClient(accessToken);
    const { data } = await octokit.repos.getReadme({
      owner,
      repo,
    });

    // 解码 base64 内容
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    return content;
  } catch (error) {
    // README 不存在时返回空字符串
    if (error.status === 404) {
      return '';
    }
    console.error('获取 README 失败:', error);
    throw error;
  }
}

/**
 * Star 一个仓库
 * @param {string} accessToken
 * @param {string} owner
 * @param {string} repo
 * @returns {Promise<void>}
 */
export async function starRepo(accessToken, owner, repo) {
  try {
    const octokit = createOctokitClient(accessToken);
    await octokit.activity.starRepoForAuthenticatedUser({
      owner,
      repo,
    });
  } catch (error) {
    console.error('Star 仓库失败:', error);
    throw error;
  }
}

/**
 * Unstar 一个仓库
 * @param {string} accessToken
 * @param {string} owner
 * @param {string} repo
 * @returns {Promise<void>}
 */
export async function unstarRepo(accessToken, owner, repo) {
  try {
    const octokit = createOctokitClient(accessToken);
    await octokit.activity.unstarRepoForAuthenticatedUser({
      owner,
      repo,
    });
  } catch (error) {
    console.error('Unstar 仓库失败:', error);
    throw error;
  }
}

/**
 * 检查仓库是否已 star
 * @param {string} accessToken
 * @param {string} owner
 * @param {string} repo
 * @returns {Promise<boolean>}
 */
export async function checkRepoStarred(accessToken, owner, repo) {
  try {
    const octokit = createOctokitClient(accessToken);
    await octokit.activity.checkRepoIsStarredByAuthenticatedUser({
      owner,
      repo,
    });
    return true;
  } catch (error) {
    if (error.status === 404) {
      return false;
    }
    throw error;
  }
}

/**
 * 获取用户的 Gists 列表
 * @param {string} accessToken
 * @returns {Promise<Array>}
 */
export async function getUserGists(accessToken) {
  try {
    const octokit = createOctokitClient(accessToken);
    const { data } = await octokit.gists.list({
      per_page: 100,
    });
    return data;
  } catch (error) {
    console.error('获取 Gists 失败:', error);
    throw error;
  }
}

/**
 * 创建 Gist（用于存储元数据）
 * @param {string} accessToken
 * @param {Object} metadata - 元数据对象
 * @returns {Promise<Object>}
 */
export async function createMetadataGist(accessToken, metadata) {
  try {
    const octokit = createOctokitClient(accessToken);
    const { data } = await octokit.gists.create({
      description: 'StarKeeper metadata (managed by app)',
      public: false,
      files: {
        'starkeeper-metadata.json': {
          content: JSON.stringify(metadata, null, 2),
        },
      },
    });
    return data;
  } catch (error) {
    console.error('创建 Gist 失败:', error);
    throw error;
  }
}

/**
 * 更新 Gist 内容
 * @param {string} accessToken
 * @param {string} gistId
 * @param {Object} metadata
 * @returns {Promise<Object>}
 */
export async function updateMetadataGist(accessToken, gistId, metadata) {
  try {
    const octokit = createOctokitClient(accessToken);
    const { data } = await octokit.gists.update({
      gist_id: gistId,
      files: {
        'starkeeper-metadata.json': {
          content: JSON.stringify(metadata, null, 2),
        },
      },
    });
    return data;
  } catch (error) {
    console.error('更新 Gist 失败:', error);
    throw error;
  }
}

/**
 * 获取 Gist 内容
 * @param {string} accessToken
 * @param {string} gistId
 * @returns {Promise<Object>}
 */
export async function getMetadataGist(accessToken, gistId) {
  try {
    const octokit = createOctokitClient(accessToken);
    const { data } = await octokit.gists.get({
      gist_id: gistId,
    });
    
    const content = data.files['starkeeper-metadata.json']?.content;
    if (!content) {
      throw new Error('Metadata file not found in gist');
    }
    
    return JSON.parse(content);
  } catch (error) {
    console.error('获取 Gist 失败:', error);
    throw error;
  }
}

/**
 * 获取公开的 Gist
 * @param {string} gistId - Gist ID
 * @param {string} [accessToken] - 可选的 access token，提供后可避免速率限制
 * @returns {Promise<Object>}
 */
export async function getPublicGist(gistId, accessToken = null) {
  try {
    // 如果提供了 token，使用认证请求（速率限制更高）
    // 否则使用匿名请求（每小时 60 次限制）
    const octokit = accessToken ? createOctokitClient(accessToken) : new Octokit();
    
    console.log('🔑 请求 Gist:', gistId, accessToken ? '(已认证)' : '(匿名)');
    
    const { data } = await octokit.gists.get({
      gist_id: gistId,
    });
    
    return data;
  } catch (error) {
    console.error('获取公开 Gist 失败:', error);
    throw error;
  }
}

export default {
  createOctokitClient,
  getCurrentUser,
  getStarredRepos,
  getAllStarredRepos,
  getRepoReadme,
  starRepo,
  unstarRepo,
  checkRepoStarred,
  getUserGists,
  createMetadataGist,
  updateMetadataGist,
  getMetadataGist,
  getPublicGist,
};
