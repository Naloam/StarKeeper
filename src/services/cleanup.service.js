/**
 * 智能清理分析服务
 * 提供废弃项目检测、相似项目分析、低交互项目识别等功能
 */

/**
 * 检测废弃项目
 * @param {Array} stars - Star 项目列表
 * @param {Object} metadata - 项目元数据（包含健康度信息）
 * @returns {Array} 废弃项目列表
 */
export function detectAbandonedRepos(stars, metadata) {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  return stars
    .filter(star => {
      const meta = metadata[star.id] || {};
      const healthScore = meta.healthScore;
      const lastUpdate = new Date(star.updatedAt);
      
      // 规则：健康度 < 30 且 1年以上未更新
      const isLowHealth = healthScore && healthScore.score < 30;
      const isOutdated = lastUpdate < oneYearAgo;
      const isArchived = star.archived;

      return (isLowHealth && isOutdated) || isArchived;
    })
    .map(star => {
      const meta = metadata[star.id] || {};
      const lastUpdate = new Date(star.updatedAt);
      const daysSinceUpdate = Math.floor((Date.now() - lastUpdate) / (1000 * 60 * 60 * 24));
      
      return {
        ...star,
        reason: star.archived 
          ? '项目已被归档，不再维护'
          : `健康度低 (${meta.healthScore?.score || 0}分)，${daysSinceUpdate}天未更新`,
        severity: star.archived ? 'high' : (daysSinceUpdate > 730 ? 'high' : 'medium'),
        recommendation: star.archived 
          ? '建议取消 Star，寻找活跃的替代项目'
          : '建议评估是否仍需关注此项目',
        daysSinceUpdate
      };
    })
    .sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate);
}

/**
 * 计算两个字符串的相似度（基于编辑距离）
 * @param {string} str1
 * @param {string} str2
 * @returns {number} 相似度 (0-100)
 */
function calculateStringSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  if (s1 === s2) return 100;
  
  // 计算 Levenshtein 距离
  const matrix = [];
  const n = s1.length;
  const m = s2.length;

  for (let i = 0; i <= n; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= m; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (s1.charAt(i - 1) === s2.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  const distance = matrix[n][m];
  const maxLength = Math.max(n, m);
  return Math.round((1 - distance / maxLength) * 100);
}

/**
 * 提取关键词（简化版）
 * @param {string} text
 * @returns {Set} 关键词集合
 */
function extractKeywords(text) {
  if (!text) return new Set();
  
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were']);
  
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
  );
}

/**
 * 计算两个项目的相似度
 * @param {Object} repo1
 * @param {Object} repo2
 * @returns {Object} 相似度评分和详情
 */
function calculateRepoSimilarity(repo1, repo2) {
  let totalScore = 0;
  let maxScore = 0;
  const details = {};

  // 1. 名称相似度 (30%)
  const nameSimilarity = calculateStringSimilarity(repo1.name, repo2.name);
  details.nameSimilarity = nameSimilarity;
  totalScore += nameSimilarity * 0.3;
  maxScore += 100 * 0.3;

  // 2. 语言匹配 (20%)
  if (repo1.language && repo2.language) {
    const languageMatch = repo1.language === repo2.language ? 100 : 0;
    details.languageMatch = languageMatch;
    totalScore += languageMatch * 0.2;
    maxScore += 100 * 0.2;
  }

  // 3. 描述相似度 (25%)
  if (repo1.description && repo2.description) {
    const descKeywords1 = extractKeywords(repo1.description);
    const descKeywords2 = extractKeywords(repo2.description);
    
    const intersection = new Set([...descKeywords1].filter(x => descKeywords2.has(x)));
    const union = new Set([...descKeywords1, ...descKeywords2]);
    
    const descSimilarity = union.size > 0 ? (intersection.size / union.size) * 100 : 0;
    details.descriptionSimilarity = Math.round(descSimilarity);
    totalScore += descSimilarity * 0.25;
    maxScore += 100 * 0.25;
  }

  // 4. Topics 重合度 (25%)
  if (repo1.topics && repo2.topics && repo1.topics.length > 0 && repo2.topics.length > 0) {
    const topics1 = new Set(repo1.topics);
    const topics2 = new Set(repo2.topics);
    
    const intersection = new Set([...topics1].filter(x => topics2.has(x)));
    const union = new Set([...topics1, ...topics2]);
    
    const topicsSimilarity = union.size > 0 ? (intersection.size / union.size) * 100 : 0;
    details.topicsSimilarity = Math.round(topicsSimilarity);
    totalScore += topicsSimilarity * 0.25;
    maxScore += 100 * 0.25;
  }

  const finalScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  return {
    score: finalScore,
    details
  };
}

/**
 * 检测相似/重复项目
 * @param {Array} stars - Star 项目列表
 * @param {Object} metadata - 项目元数据
 * @param {number} threshold - 相似度阈值 (默认 60)
 * @returns {Array} 相似项目组列表
 */
export function detectSimilarRepos(stars, metadata, threshold = 60) {
  const similarGroups = [];
  const processed = new Set();

  for (let i = 0; i < stars.length; i++) {
    if (processed.has(stars[i].id)) continue;

    const repo1 = stars[i];
    const similarRepos = [repo1];

    for (let j = i + 1; j < stars.length; j++) {
      if (processed.has(stars[j].id)) continue;

      const repo2 = stars[j];
      const similarity = calculateRepoSimilarity(repo1, repo2);

      if (similarity.score >= threshold) {
        similarRepos.push({
          ...repo2,
          similarityScore: similarity.score,
          similarityDetails: similarity.details
        });
        processed.add(repo2.id);
      }
    }

    if (similarRepos.length > 1) {
      // 标记主仓库（推荐保留的）
      processed.add(repo1.id);
      
      // 按健康度和 stars 数排序，推荐最优项目
      const reposWithScore = similarRepos.map(repo => {
        const meta = metadata[repo.id] || {};
        const healthScore = meta.healthScore?.score || 0;
        const stars = repo.stargazersCount || 0;
        
        return {
          ...repo,
          recommendScore: healthScore * 0.7 + Math.min(stars / 100, 30) // 健康度70% + stars 30%
        };
      });

      reposWithScore.sort((a, b) => b.recommendScore - a.recommendScore);

      similarGroups.push({
        id: `group-${i}`,
        repos: reposWithScore,
        recommended: reposWithScore[0], // 推荐保留的项目
        reason: `发现 ${reposWithScore.length} 个功能相似的项目`,
        avgSimilarity: Math.round(
          reposWithScore.slice(1).reduce((sum, r) => sum + (r.similarityScore || 0), 0) / 
          (reposWithScore.length - 1)
        )
      });
    }
  }

  return similarGroups.sort((a, b) => b.repos.length - a.repos.length);
}

/**
 * 检测低交互项目（用户可能不需要的）
 * @param {Array} stars - Star 项目列表
 * @param {Object} metadata - 项目元数据
 * @returns {Array} 低交互项目列表
 */
export function detectLowEngagementRepos(stars, metadata) {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  return stars
    .filter(star => {
      const meta = metadata[star.id] || {};
      const starredAt = new Date(star.starredAt || star.updatedAt);
      
      // 规则：6个月前 star + 无标签 + 无AI摘要 + 无笔记
      const isOldStar = starredAt < sixMonthsAgo;
      const hasNoTags = !meta.tags || meta.tags.length === 0;
      const hasNoSummary = !meta.aiSummary;
      const hasNoNotes = !meta.notes;
      
      return isOldStar && hasNoTags && hasNoSummary && hasNoNotes;
    })
    .map(star => {
      const starredAt = new Date(star.starredAt || star.updatedAt);
      const daysSinceStarred = Math.floor((Date.now() - starredAt) / (1000 * 60 * 60 * 24));
      
      return {
        ...star,
        reason: `${daysSinceStarred}天前收藏，从未整理或查看`,
        severity: 'low',
        recommendation: '建议添加标签分类，或考虑取消 Star',
        daysSinceStarred
      };
    })
    .sort((a, b) => b.daysSinceStarred - a.daysSinceStarred);
}

/**
 * 综合分析并生成清理建议
 * @param {Array} stars - Star 项目列表
 * @param {Object} metadata - 项目元数据
 * @returns {Object} 清理分析报告
 */
export function generateCleanupSuggestions(stars, metadata) {
  const abandoned = detectAbandonedRepos(stars, metadata);
  const similar = detectSimilarRepos(stars, metadata);
  const lowEngagement = detectLowEngagementRepos(stars, metadata);

  // 计算可清理的总数
  const potentialCleanupCount = 
    abandoned.length + 
    similar.reduce((sum, group) => sum + group.repos.length - 1, 0) + // 每组保留1个
    Math.floor(lowEngagement.length * 0.5); // 假设50%真的不需要

  return {
    summary: {
      totalStars: stars.length,
      abandonedCount: abandoned.length,
      similarGroupsCount: similar.length,
      similarReposCount: similar.reduce((sum, group) => sum + group.repos.length, 0),
      lowEngagementCount: lowEngagement.length,
      potentialCleanupCount,
      cleanupPercentage: Math.round((potentialCleanupCount / stars.length) * 100)
    },
    categories: {
      abandoned,
      similar,
      lowEngagement
    },
    recommendations: [
      {
        type: 'abandoned',
        priority: 'high',
        title: `清理 ${abandoned.length} 个废弃项目`,
        description: '这些项目长期未更新或已被归档，建议取消 Star'
      },
      {
        type: 'similar',
        priority: 'medium',
        title: `整理 ${similar.length} 组相似项目`,
        description: '发现功能重复的项目，建议保留最优选择'
      },
      {
        type: 'lowEngagement',
        priority: 'low',
        title: `审查 ${lowEngagement.length} 个低交互项目`,
        description: '这些项目收藏已久但从未整理，建议重新评估价值'
      }
    ].filter(rec => rec.title.match(/\d+/)[0] !== '0') // 过滤掉数量为0的建议
  };
}

/**
 * 归档项目（软删除，30天内可恢复）
 * @param {Array} repoIds - 要归档的仓库ID列表
 * @param {Object} metadata - 当前元数据
 * @returns {Object} 更新后的元数据
 */
export function archiveRepos(repoIds, metadata) {
  const now = Date.now();
  const updatedMetadata = { ...metadata };

  repoIds.forEach(repoId => {
    if (!updatedMetadata[repoId]) {
      updatedMetadata[repoId] = {};
    }
    
    updatedMetadata[repoId].archived = {
      archivedAt: now,
      expiresAt: now + (30 * 24 * 60 * 60 * 1000), // 30天后过期
      canRestore: true
    };
  });

  return updatedMetadata;
}

/**
 * 恢复归档的项目
 * @param {Array} repoIds - 要恢复的仓库ID列表
 * @param {Object} metadata - 当前元数据
 * @returns {Object} 更新后的元数据
 */
export function restoreArchivedRepos(repoIds, metadata) {
  const updatedMetadata = { ...metadata };

  repoIds.forEach(repoId => {
    if (updatedMetadata[repoId]?.archived) {
      delete updatedMetadata[repoId].archived;
    }
  });

  return updatedMetadata;
}

/**
 * 获取归档的项目列表
 * @param {Array} stars - Star 项目列表
 * @param {Object} metadata - 项目元数据
 * @returns {Array} 归档项目列表（包含剩余天数）
 */
export function getArchivedRepos(stars, metadata) {
  const now = Date.now();
  
  return stars
    .filter(star => metadata[star.id]?.archived)
    .map(star => {
      const archived = metadata[star.id].archived;
      const daysRemaining = Math.ceil((archived.expiresAt - now) / (1000 * 60 * 60 * 24));
      
      return {
        ...star,
        archivedAt: archived.archivedAt,
        expiresAt: archived.expiresAt,
        daysRemaining: Math.max(0, daysRemaining),
        canRestore: archived.canRestore && daysRemaining > 0
      };
    })
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
}
