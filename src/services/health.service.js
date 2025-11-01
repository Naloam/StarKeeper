/**
 * 健康度分析服务
 * 
 * 健康度评分算法:
 * - 总分 0-100
 * - 活跃度 (40分): commits + releases + 更新时间
 * - 社区健康 (30分): issue响应 + PR合并率 + contributors
 * - 维护状态 (30分): 未archived + 有CI + README更新
 */

import { getRepoReleases, getRepoActivity, getRepoCIStatus } from './github.service';

/**
 * 计算项目健康度评分
 * @param {string} accessToken
 * @param {Object} repo - 仓库基本信息
 * @returns {Promise<Object>} - { score, activity, community, maintenance, details, level }
 */
export async function calculateHealthScore(accessToken, repo) {
  try {
    console.log(`🏥 开始分析健康度: ${repo.fullName}`);

    // 并行获取所需数据
    const [releasesData, activityData, ciData] = await Promise.all([
      getRepoReleases(accessToken, repo.owner.login, repo.name),
      getRepoActivity(accessToken, repo.owner.login, repo.name),
      getRepoCIStatus(accessToken, repo.owner.login, repo.name),
    ]);

    // 计算活跃度分数 (40分)
    const activityScore = calculateActivityScore({
      commitsLast30Days: activityData.commitsLast30Days,
      latestRelease: releasesData.latestRelease,
      pushedAt: repo.pushedAt,
    });

    // 计算社区健康分数 (30分)
    const communityScore = calculateCommunityScore({
      openIssues: activityData.openIssues,
      openPRs: activityData.openPRs,
      contributors: activityData.contributors,
      stargazersCount: repo.stargazersCount,
    });

    // 计算维护状态分数 (30分)
    const maintenanceScore = calculateMaintenanceScore({
      archived: repo.archived,
      hasCI: ciData.hasCI,
      updatedAt: repo.updatedAt,
    });

    // 综合评分
    const totalScore = Math.round(activityScore + communityScore + maintenanceScore);

    // 判断健康等级
    const level = getHealthLevel(totalScore);

    // 计算距今天数
    const daysSinceUpdate = Math.floor(
      (Date.now() - new Date(repo.pushedAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    const result = {
      score: totalScore,
      activity: Math.round(activityScore),
      community: Math.round(communityScore),
      maintenance: Math.round(maintenanceScore),
      level,
      details: {
        commitsLast30Days: activityData.commitsLast30Days,
        daysSinceLastUpdate: daysSinceUpdate,
        latestRelease: releasesData.latestRelease,
        openIssues: activityData.openIssues,
        openPRs: activityData.openPRs,
        contributors: activityData.contributors,
        hasCI: ciData.hasCI,
        archived: repo.archived,
      },
      calculatedAt: new Date().toISOString(),
      cacheExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7天后过期
    };

    console.log(`✅ 健康度分析完成: ${repo.fullName} - ${totalScore}分 (${level})`);
    return result;
  } catch (error) {
    console.error(`❌ 健康度分析失败: ${repo.fullName}`, error);
    // 返回默认的低分
    return {
      score: 0,
      activity: 0,
      community: 0,
      maintenance: 0,
      level: 'critical',
      details: {},
      error: error.message,
      calculatedAt: new Date().toISOString(),
      cacheExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }
}

/**
 * 计算活跃度分数 (40分)
 * @param {Object} data
 * @returns {number}
 */
function calculateActivityScore(data) {
  let score = 0;

  // 1. 最近30天 commits (15分)
  const { commitsLast30Days } = data;
  if (commitsLast30Days >= 50) score += 15;
  else if (commitsLast30Days >= 20) score += 12;
  else if (commitsLast30Days >= 10) score += 9;
  else if (commitsLast30Days >= 5) score += 6;
  else if (commitsLast30Days >= 1) score += 3;

  // 2. Release 频率 (15分)
  const { latestRelease } = data;
  if (latestRelease) {
    const daysSinceRelease = Math.floor(
      (Date.now() - new Date(latestRelease.publishedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceRelease <= 30) score += 15;
    else if (daysSinceRelease <= 90) score += 12;
    else if (daysSinceRelease <= 180) score += 9;
    else if (daysSinceRelease <= 365) score += 6;
    else score += 3;
  }

  // 3. 最后更新时间 (10分)
  const daysSinceUpdate = Math.floor(
    (Date.now() - new Date(data.pushedAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceUpdate <= 7) score += 10;
  else if (daysSinceUpdate <= 30) score += 8;
  else if (daysSinceUpdate <= 90) score += 6;
  else if (daysSinceUpdate <= 180) score += 4;
  else if (daysSinceUpdate <= 365) score += 2;

  return score;
}

/**
 * 计算社区健康分数 (30分)
 * @param {Object} data
 * @returns {number}
 */
function calculateCommunityScore(data) {
  let score = 0;
  const { openIssues, openPRs, contributors, stargazersCount } = data;

  // 1. Issue 活跃度 (10分)
  // 适度的 open issues 说明项目活跃，太多说明维护不佳
  if (openIssues > 0 && openIssues <= 50) score += 10;
  else if (openIssues <= 100) score += 8;
  else if (openIssues <= 200) score += 6;
  else if (openIssues <= 500) score += 4;
  else if (openIssues > 500) score += 2;

  // 2. PR 活跃度 (10分)
  if (openPRs > 0 && openPRs <= 20) score += 10;
  else if (openPRs <= 50) score += 8;
  else if (openPRs <= 100) score += 6;
  else if (openPRs > 100) score += 4;

  // 3. Contributors 数量 (10分)
  if (contributors >= 100) score += 10;
  else if (contributors >= 50) score += 9;
  else if (contributors >= 20) score += 8;
  else if (contributors >= 10) score += 7;
  else if (contributors >= 5) score += 6;
  else if (contributors >= 2) score += 4;
  else if (contributors >= 1) score += 2;

  return score;
}

/**
 * 计算维护状态分数 (30分)
 * @param {Object} data
 * @returns {number}
 */
function calculateMaintenanceScore(data) {
  let score = 0;
  const { archived, hasCI, updatedAt } = data;

  // 1. 未被 archived (15分)
  if (!archived) {
    score += 15;
  }

  // 2. 有活跃的 CI/CD (10分)
  if (hasCI) {
    score += 10;
  }

  // 3. README/代码最近更新 (5分)
  const daysSinceUpdate = Math.floor(
    (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceUpdate <= 30) score += 5;
  else if (daysSinceUpdate <= 90) score += 4;
  else if (daysSinceUpdate <= 180) score += 3;
  else if (daysSinceUpdate <= 365) score += 2;

  return score;
}

/**
 * 根据分数判断健康等级
 * @param {number} score
 * @returns {string} - excellent | good | fair | poor | critical
 */
function getHealthLevel(score) {
  if (score >= 80) return 'excellent'; // 优秀
  if (score >= 60) return 'good';      // 良好
  if (score >= 40) return 'fair';      // 一般
  if (score >= 20) return 'poor';      // 较差
  return 'critical';                   // 危险
}

/**
 * 检测废弃项目
 * @param {Object} repo - 仓库信息
 * @param {Object} healthScore - 健康度评分
 * @returns {boolean}
 */
export function detectStaleRepo(repo, healthScore) {
  // 条件: 健康度 < 30 且最后更新 > 365天
  if (healthScore.score < 30) {
    const daysSinceUpdate = Math.floor(
      (Date.now() - new Date(repo.pushedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceUpdate > 365;
  }
  return false;
}

/**
 * 分析仓库活跃度趋势
 * @param {Object} repo
 * @param {Object} healthScore
 * @returns {Object} - { trend, recommendation }
 */
export function analyzeActivity(repo, healthScore) {
  const { score, details } = healthScore;
  let trend = 'stable';
  let recommendation = '';

  // 判断趋势
  if (details.archived) {
    trend = 'archived';
    recommendation = '该项目已被归档，不再维护。建议寻找替代方案。';
  } else if (score >= 80) {
    trend = 'thriving';
    recommendation = '项目非常活跃，社区健康，可以放心使用。';
  } else if (score >= 60) {
    trend = 'healthy';
    recommendation = '项目维护良好，建议继续关注。';
  } else if (score >= 40) {
    trend = 'declining';
    recommendation = '项目活跃度下降，建议评估是否继续使用。';
  } else if (score >= 20) {
    trend = 'stale';
    recommendation = '项目更新缓慢，建议寻找更活跃的替代方案。';
  } else {
    trend = 'abandoned';
    recommendation = '项目疑似废弃，强烈建议迁移到其他方案。';
  }

  // 额外建议
  const suggestions = [];
  if (details.daysSinceLastUpdate > 180) {
    suggestions.push('超过6个月未更新');
  }
  if (!details.hasCI) {
    suggestions.push('缺少自动化测试');
  }
  if (details.openIssues > 200) {
    suggestions.push('积压的 Issues 较多');
  }

  return {
    trend,
    recommendation,
    suggestions,
  };
}

/**
 * 批量计算健康度（带进度回调）
 * @param {string} accessToken
 * @param {Array} repos - 仓库列表
 * @param {Function} onProgress - 进度回调
 * @returns {Promise<Map>} - Map<repoId, healthScore>
 */
export async function batchCalculateHealthScore(accessToken, repos, onProgress) {
  const results = new Map();
  const total = repos.length;

  for (let i = 0; i < repos.length; i++) {
    const repo = repos[i];
    try {
      const healthScore = await calculateHealthScore(accessToken, repo);
      results.set(repo.id, healthScore);

      if (onProgress) {
        onProgress({
          current: i + 1,
          total,
          repoName: repo.fullName,
          score: healthScore.score,
        });
      }

      // 避免速率限制，每个请求间隔 500ms
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`批量分析失败: ${repo.fullName}`, error);
      // 继续处理下一个
      if (onProgress) {
        onProgress({
          current: i + 1,
          total,
          repoName: repo.fullName,
          error: error.message,
        });
      }
    }
  }

  return results;
}

export default {
  calculateHealthScore,
  detectStaleRepo,
  analyzeActivity,
  batchCalculateHealthScore,
};
