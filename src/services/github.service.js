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

    // 解码 base64 内容（浏览器兼容）
    // 移除换行符，然后使用 atob 解码
    const base64Content = data.content.replace(/\n/g, '');
    const content = decodeURIComponent(escape(atob(base64Content)));
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

/**
 * 获取仓库的 Releases 信息
 * @param {string} accessToken
 * @param {string} owner
 * @param {string} repo
 * @returns {Promise<Object>} - { latestRelease, releaseCount }
 */
export async function getRepoReleases(accessToken, owner, repo) {
  try {
    const octokit = createOctokitClient(accessToken);
    
    // 获取最新的 release
    const { data: releases } = await octokit.repos.listReleases({
      owner,
      repo,
      per_page: 10,
    });

    if (releases.length === 0) {
      return {
        latestRelease: null,
        releaseCount: 0,
      };
    }

    return {
      latestRelease: {
        name: releases[0].name,
        tagName: releases[0].tag_name,
        publishedAt: releases[0].published_at,
        htmlUrl: releases[0].html_url,
      },
      releaseCount: releases.length,
    };
  } catch (error) {
    // 如果没有 releases 权限或仓库没有 releases，返回 null
    if (error.status === 404 || error.status === 403) {
      return {
        latestRelease: null,
        releaseCount: 0,
      };
    }
    console.error('获取 Releases 失败:', error);
    throw error;
  }
}

/**
 * 获取仓库的活跃度数据
 * @param {string} accessToken
 * @param {string} owner
 * @param {string} repo
 * @returns {Promise<Object>} - { commitsLast30Days, openIssues, openPRs, contributors }
 */
export async function getRepoActivity(accessToken, owner, repo) {
  try {
    const octokit = createOctokitClient(accessToken);
    
    // 计算 30 天前的日期
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const since = thirtyDaysAgo.toISOString();

    // 并行获取多个数据
    const [commitsResponse, issuesResponse, pullsResponse, contributorsResponse] = await Promise.allSettled([
      // 获取最近 30 天的 commits
      octokit.repos.listCommits({
        owner,
        repo,
        since,
        per_page: 100,
      }),
      // 获取 open issues（不包括 PRs）
      octokit.issues.listForRepo({
        owner,
        repo,
        state: 'open',
        per_page: 1, // 只需要 count
      }),
      // 获取 open PRs
      octokit.pulls.list({
        owner,
        repo,
        state: 'open',
        per_page: 1,
      }),
      // 获取贡献者数量
      octokit.repos.listContributors({
        owner,
        repo,
        per_page: 100,
      }),
    ]);

    // 处理结果
    const commitsLast30Days = commitsResponse.status === 'fulfilled' 
      ? commitsResponse.value.data.length 
      : 0;

    const openIssues = issuesResponse.status === 'fulfilled'
      ? parseInt(issuesResponse.value.headers['link']?.match(/page=(\d+)>; rel="last"/)?.[1] || '1') * 100 || issuesResponse.value.data.length
      : 0;

    const openPRs = pullsResponse.status === 'fulfilled'
      ? parseInt(pullsResponse.value.headers['link']?.match(/page=(\d+)>; rel="last"/)?.[1] || '1') * 100 || pullsResponse.value.data.length
      : 0;

    const contributors = contributorsResponse.status === 'fulfilled'
      ? contributorsResponse.value.data.length
      : 0;

    return {
      commitsLast30Days,
      openIssues,
      openPRs,
      contributors,
    };
  } catch (error) {
    console.error('获取仓库活跃度失败:', error);
    // 返回默认值而不是抛出错误
    return {
      commitsLast30Days: 0,
      openIssues: 0,
      openPRs: 0,
      contributors: 0,
    };
  }
}

/**
 * 获取仓库的 CI/CD 状态（GitHub Actions）
 * @param {string} accessToken
 * @param {string} owner
 * @param {string} repo
 * @returns {Promise<Object>} - { hasCI, latestWorkflowRun }
 */
export async function getRepoCIStatus(accessToken, owner, repo) {
  try {
    const octokit = createOctokitClient(accessToken);
    
    // 获取最新的 workflow runs
    const { data: { workflow_runs } } = await octokit.actions.listWorkflowRunsForRepo({
      owner,
      repo,
      per_page: 1,
    });

    if (workflow_runs.length === 0) {
      return {
        hasCI: false,
        latestWorkflowRun: null,
      };
    }

    const latestRun = workflow_runs[0];
    return {
      hasCI: true,
      latestWorkflowRun: {
        status: latestRun.status, // completed, in_progress, queued
        conclusion: latestRun.conclusion, // success, failure, cancelled, etc.
        createdAt: latestRun.created_at,
        htmlUrl: latestRun.html_url,
      },
    };
  } catch (error) {
    // 如果没有 Actions 权限或仓库没有 Actions，返回 false
    if (error.status === 404 || error.status === 403) {
      return {
        hasCI: false,
        latestWorkflowRun: null,
      };
    }
    console.error('获取 CI 状态失败:', error);
    return {
      hasCI: false,
      latestWorkflowRun: null,
    };
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
  // 健康度分析相关
  getRepoReleases,
  getRepoActivity,
  getRepoCIStatus,
};
