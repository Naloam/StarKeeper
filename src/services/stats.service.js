/**
 * 统计分析服务
 * 提供项目数据的统计和趋势分析
 */

/**
 * 计算基础统计数据
 * @param {Array} stars - 项目列表
 * @param {Object} metadata - 元数据
 * @returns {Object} 统计数据
 */
export function calculateBasicStats(stars, metadata) {
  const totalStars = stars.length;
  
  // 统计标签数
  const allTags = new Set();
  Object.values(metadata).forEach(meta => {
    if (meta.tags && Array.isArray(meta.tags)) {
      meta.tags.forEach(tag => allTags.add(tag));
    }
  });
  const totalTags = allTags.size;
  
  // 统计有笔记的项目数
  const withNotes = Object.values(metadata).filter(meta => 
    meta.notes && typeof meta.notes === 'string' && meta.notes.trim().length > 0
  ).length;
  
  // 统计有 AI 摘要的项目数
  const withAISummary = Object.values(metadata).filter(meta => {
    if (!meta.aiSummary) return false;
    // 支持字符串格式
    if (typeof meta.aiSummary === 'string') {
      return meta.aiSummary.trim().length > 0;
    }
    // 支持对象格式
    if (typeof meta.aiSummary === 'object') {
      return meta.aiSummary.summary && meta.aiSummary.summary.trim().length > 0;
    }
    return false;
  }).length;
  
  return {
    totalStars,
    totalTags,
    withNotes,
    withAISummary,
    notesPercentage: totalStars > 0 ? Math.round((withNotes / totalStars) * 100) : 0,
    aiSummaryPercentage: totalStars > 0 ? Math.round((withAISummary / totalStars) * 100) : 0,
  };
}

/**
 * 计算健康度统计
 * @param {Array} stars - 项目列表
 * @param {Object} metadata - 元数据
 * @returns {Object} 健康度统计
 */
export function calculateHealthStats(stars, metadata) {
  const healthDistribution = {
    excellent: 0,  // 80-100
    good: 0,       // 60-79
    fair: 0,       // 40-59
    poor: 0,       // 20-39
    critical: 0,   // 0-19
    unknown: 0,    // 未分析
  };
  
  let totalScore = 0;
  let analyzedCount = 0;
  
  stars.forEach(star => {
    const repoMeta = metadata[star.id];
    if (repoMeta?.healthScore) {
      const { score, level } = repoMeta.healthScore;
      healthDistribution[level] = (healthDistribution[level] || 0) + 1;
      totalScore += score;
      analyzedCount++;
    } else {
      healthDistribution.unknown++;
    }
  });
  
  const averageScore = analyzedCount > 0 ? Math.round(totalScore / analyzedCount) : 0;
  const analyzedPercentage = stars.length > 0 ? Math.round((analyzedCount / stars.length) * 100) : 0;
  
  return {
    distribution: healthDistribution,
    averageScore,
    analyzedCount,
    analyzedPercentage,
  };
}

/**
 * 计算语言分布
 * @param {Array} stars - 项目列表
 * @returns {Array} 语言统计数组
 */
export function calculateLanguageStats(stars) {
  const languageMap = {};
  
  stars.forEach(star => {
    if (star.language) {
      languageMap[star.language] = (languageMap[star.language] || 0) + 1;
    } else {
      languageMap['Unknown'] = (languageMap['Unknown'] || 0) + 1;
    }
  });
  
  // 转换为数组并排序
  const languageStats = Object.entries(languageMap)
    .map(([language, count]) => ({
      language,
      count,
      percentage: stars.length > 0 ? Math.round((count / stars.length) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
  
  return languageStats;
}

/**
 * 计算标签统计
 * @param {Object} metadata - 元数据
 * @returns {Array} 标签统计数组
 */
export function calculateTagStats(metadata) {
  const tagMap = {};
  
  Object.values(metadata).forEach(meta => {
    if (meta.tags && Array.isArray(meta.tags)) {
      meta.tags.forEach(tag => {
        tagMap[tag] = (tagMap[tag] || 0) + 1;
      });
    }
  });
  
  // 转换为数组并排序
  const tagStats = Object.entries(tagMap)
    .map(([tag, count]) => ({
      tag,
      count,
    }))
    .sort((a, b) => b.count - a.count);
  
  return tagStats;
}

/**
 * 计算 Stars 增长趋势（按月）
 * @param {Array} stars - 项目列表
 * @returns {Array} 月度统计数组
 */
export function calculateStarsGrowthTrend(stars) {
  const monthlyMap = {};
  
  stars.forEach(star => {
    if (star.starredAt) {
      const date = new Date(star.starredAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + 1;
    }
  });
  
  // 转换为数组并排序
  const monthlyStats = Object.entries(monthlyMap)
    .map(([month, count]) => ({
      month,
      count,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
  
  // 计算累计值
  let cumulative = 0;
  monthlyStats.forEach(stat => {
    cumulative += stat.count;
    stat.cumulative = cumulative;
  });
  
  return monthlyStats;
}

/**
 * 计算最近活跃的项目
 * @param {Array} stars - 项目列表
 * @param {number} limit - 返回数量限制
 * @returns {Array} 最近活跃项目列表
 */
export function getRecentlyActiveRepos(stars, limit = 10) {
  return stars
    .filter(star => star.pushedAt)
    .sort((a, b) => new Date(b.pushedAt) - new Date(a.pushedAt))
    .slice(0, limit)
    .map(star => ({
      id: star.id,
      fullName: star.fullName,
      name: star.name,
      owner: star.owner.login,
      pushedAt: star.pushedAt,
      language: star.language,
      stargazersCount: star.stargazersCount,
      htmlUrl: star.htmlUrl,
    }));
}

/**
 * 计算最热门的项目（按 stars 数）
 * @param {Array} stars - 项目列表
 * @param {number} limit - 返回数量限制
 * @returns {Array} 最热门项目列表
 */
export function getTopStarredRepos(stars, limit = 10) {
  return stars
    .sort((a, b) => b.stargazersCount - a.stargazersCount)
    .slice(0, limit)
    .map(star => ({
      id: star.id,
      fullName: star.fullName,
      name: star.name,
      owner: star.owner.login,
      stargazersCount: star.stargazersCount,
      language: star.language,
      htmlUrl: star.htmlUrl,
    }));
}

/**
 * 计算项目活跃度热力图数据（按星期几和小时）
 * @param {Array} stars - 项目列表
 * @returns {Array} 热力图数据
 */
export function calculateActivityHeatmap(stars) {
  // 初始化 7x24 的矩阵（星期 x 小时）
  const heatmap = Array(7).fill(0).map(() => Array(24).fill(0));
  
  stars.forEach(star => {
    if (star.pushedAt) {
      const date = new Date(star.pushedAt);
      const dayOfWeek = date.getDay(); // 0-6 (周日-周六)
      const hour = date.getHours();    // 0-23
      heatmap[dayOfWeek][hour]++;
    }
  });
  
  return heatmap;
}

/**
 * 生成完整的统计报告
 * @param {Array} stars - 项目列表
 * @param {Object} metadata - 元数据
 * @returns {Object} 完整统计报告
 */
export function generateStatsReport(stars, metadata) {
  return {
    basic: calculateBasicStats(stars, metadata),
    health: calculateHealthStats(stars, metadata),
    languages: calculateLanguageStats(stars),
    tags: calculateTagStats(metadata),
    growth: calculateStarsGrowthTrend(stars),
    recentlyActive: getRecentlyActiveRepos(stars, 10),
    topStarred: getTopStarredRepos(stars, 10),
    activityHeatmap: calculateActivityHeatmap(stars),
    generatedAt: new Date().toISOString(),
  };
}

/**
 * 获取健康度分布的图表数据
 * @param {Object} healthStats - 健康度统计
 * @returns {Array} 图表数据
 */
export function getHealthChartData(healthStats) {
  const { distribution } = healthStats;
  
  return [
    { level: '优秀', count: distribution.excellent, color: '#10b981' },
    { level: '良好', count: distribution.good, color: '#3b82f6' },
    { level: '一般', count: distribution.fair, color: '#eab308' },
    { level: '较差', count: distribution.poor, color: '#f97316' },
    { level: '危险', count: distribution.critical, color: '#ef4444' },
    { level: '未分析', count: distribution.unknown, color: '#6b7280' },
  ].filter(item => item.count > 0);
}

/**
 * 获取语言分布的图表数据（Top 10）
 * @param {Array} languageStats - 语言统计
 * @returns {Array} 图表数据
 */
export function getLanguageChartData(languageStats) {
  return languageStats
    .slice(0, 10)
    .map((item, index) => ({
      ...item,
      color: getLanguageColor(item.language, index),
    }));
}

/**
 * 获取语言对应的颜色
 * @param {string} language - 语言名称
 * @param {number} index - 索引（用于默认颜色）
 * @returns {string} 颜色值
 */
function getLanguageColor(language, index) {
  const colorMap = {
    JavaScript: '#f7df1e',
    TypeScript: '#3178c6',
    Python: '#3776ab',
    Java: '#007396',
    Go: '#00add8',
    Rust: '#ce422b',
    C: '#a8b9cc',
    'C++': '#f34b7d',
    'C#': '#239120',
    PHP: '#777bb4',
    Ruby: '#cc342d',
    Swift: '#fa7343',
    Kotlin: '#7f52ff',
    Dart: '#0175c2',
    Vue: '#42b883',
    HTML: '#e34c26',
    CSS: '#1572b6',
    Shell: '#89e051',
  };
  
  const defaultColors = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
    '#10b981', '#06b6d4', '#6366f1', '#84cc16',
  ];
  
  return colorMap[language] || defaultColors[index % defaultColors.length];
}

export default {
  calculateBasicStats,
  calculateHealthStats,
  calculateLanguageStats,
  calculateTagStats,
  calculateStarsGrowthTrend,
  getRecentlyActiveRepos,
  getTopStarredRepos,
  calculateActivityHeatmap,
  generateStatsReport,
  getHealthChartData,
  getLanguageChartData,
};
