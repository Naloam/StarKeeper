/**
 * 项目相似度分析服务
 * 提供基于多维度的项目相似度计算和聚类功能
 */

/**
 * 计算两个字符串的莱文斯坦距离（编辑距离）
 * @param {string} str1 
 * @param {string} str2 
 * @returns {number} 编辑距离
 */
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // 删除
        matrix[i][j - 1] + 1,      // 插入
        matrix[i - 1][j - 1] + cost // 替换
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * 计算两个字符串的相似度（0-1）
 * @param {string} str1 
 * @param {string} str2 
 * @returns {number} 相似度 0-1
 */
export function calculateStringSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  if (s1 === s2) return 1;
  
  const maxLen = Math.max(s1.length, s2.length);
  const distance = levenshteinDistance(s1, s2);
  
  return 1 - (distance / maxLen);
}

/**
 * 提取文本关键词
 * @param {string} text 
 * @returns {Set<string>} 关键词集合
 */
function extractKeywords(text) {
  if (!text) return new Set();
  
  // 停用词列表
  const stopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
    'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
    'to', 'was', 'will', 'with', 'this', 'which', 'can', 'have', 'or'
  ]);
  
  const words = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
  
  return new Set(words);
}

/**
 * 计算两个关键词集合的 Jaccard 相似度
 * @param {Set} set1 
 * @param {Set} set2 
 * @returns {number} 0-1
 */
function jaccardSimilarity(set1, set2) {
  if (set1.size === 0 && set2.size === 0) return 1;
  if (set1.size === 0 || set2.size === 0) return 0;
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

/**
 * 计算两个项目的综合相似度
 * @param {Object} repo1 - 项目1
 * @param {Object} repo2 - 项目2
 * @returns {Object} { score: number, details: Object }
 */
export function calculateRepoSimilarity(repo1, repo2) {
  // 1. 名称相似度 (权重: 40%)
  const nameSimilarity = calculateStringSimilarity(repo1.name, repo2.name);
  
  // 2. 描述关键词相似度 (权重: 30%)
  const keywords1 = extractKeywords(repo1.description || '');
  const keywords2 = extractKeywords(repo2.description || '');
  const descriptionSimilarity = jaccardSimilarity(keywords1, keywords2);
  
  // 3. 语言匹配 (权重: 20%)
  const languageSimilarity = repo1.language === repo2.language ? 1 : 0;
  
  // 4. Topics 标签重合度 (权重: 10%)
  const topics1 = new Set(repo1.topics || []);
  const topics2 = new Set(repo2.topics || []);
  const topicsSimilarity = jaccardSimilarity(topics1, topics2);
  
  // 加权计算总相似度
  const totalScore = (
    nameSimilarity * 0.4 +
    descriptionSimilarity * 0.3 +
    languageSimilarity * 0.2 +
    topicsSimilarity * 0.1
  );
  
  return {
    score: totalScore,
    details: {
      name: nameSimilarity,
      description: descriptionSimilarity,
      language: languageSimilarity,
      topics: topicsSimilarity
    }
  };
}

/**
 * 检测项目中的相似/重复项目
 * @param {Array} repos - 项目列表
 * @param {number} threshold - 相似度阈值 (0-1)，默认 0.6
 * @returns {Array} 相似项目组列表
 */
export function detectSimilarRepos(repos, threshold = 0.6) {
  const similarGroups = [];
  const processed = new Set();
  
  for (let i = 0; i < repos.length; i++) {
    if (processed.has(repos[i].id)) continue;
    
    const group = [repos[i]];
    const similarities = [];
    
    for (let j = i + 1; j < repos.length; j++) {
      if (processed.has(repos[j].id)) continue;
      
      const similarity = calculateRepoSimilarity(repos[i], repos[j]);
      
      if (similarity.score >= threshold) {
        group.push(repos[j]);
        similarities.push({
          repo1: repos[i].id,
          repo2: repos[j].id,
          ...similarity
        });
        processed.add(repos[j].id);
      }
    }
    
    if (group.length > 1) {
      processed.add(repos[i].id);
      similarGroups.push({
        repos: group,
        similarities,
        averageSimilarity: similarities.reduce((sum, s) => sum + s.score, 0) / similarities.length,
        recommendation: recommendBestRepo(group)
      });
    }
  }
  
  return similarGroups.sort((a, b) => b.averageSimilarity - a.averageSimilarity);
}

/**
 * 从一组相似项目中推荐最佳选择
 * @param {Array} repos - 相似项目列表
 * @returns {Object} 推荐信息
 */
function recommendBestRepo(repos) {
  // 评分标准：
  // - Stars 数量 (40%)
  // - Fork 数量 (20%)
  // - 最后更新时间 (20%)
  // - 健康度 (20%)
  
  const scored = repos.map(repo => {
    const daysSinceUpdate = (Date.now() - new Date(repo.updatedAt)) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 1 - (daysSinceUpdate / 365)); // 1年内满分
    
    const starsScore = Math.min(repo.stargazersCount / 10000, 1); // 10k stars 满分
    const forksScore = Math.min(repo.forksCount / 1000, 1); // 1k forks 满分
    
    const totalScore = (
      starsScore * 0.4 +
      forksScore * 0.2 +
      recencyScore * 0.2 +
      0.2 // 健康度预留，如果有 healthScore 则替换
    );
    
    return {
      repo,
      score: totalScore,
      reasons: []
    };
  });
  
  // 找出得分最高的
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  
  // 生成推荐理由
  const reasons = [];
  if (best.repo.stargazersCount === Math.max(...repos.map(r => r.stargazersCount))) {
    reasons.push(`⭐ Star 数最多 (${best.repo.stargazersCount.toLocaleString()})`);
  }
  if (best.repo.forksCount === Math.max(...repos.map(r => r.forksCount))) {
    reasons.push(`🔀 Fork 数最多 (${best.repo.forksCount.toLocaleString()})`);
  }
  
  const latestUpdate = Math.max(...repos.map(r => new Date(r.updatedAt)));
  if (new Date(best.repo.updatedAt).getTime() === latestUpdate) {
    reasons.push('🕒 最近更新');
  }
  
  best.reasons = reasons;
  
  return {
    repoId: best.repo.id,
    repoName: best.repo.fullName,
    score: best.score,
    reasons
  };
}

/**
 * 按语言聚类项目
 * @param {Array} repos 
 * @returns {Object} { language: repos[] }
 */
export function clusterByLanguage(repos) {
  const clusters = {};
  
  repos.forEach(repo => {
    const lang = repo.language || 'Other';
    if (!clusters[lang]) {
      clusters[lang] = [];
    }
    clusters[lang].push(repo);
  });
  
  // 按每个语言的项目数量排序
  return Object.fromEntries(
    Object.entries(clusters).sort((a, b) => b[1].length - a[1].length)
  );
}

/**
 * 按 topics 聚类项目
 * @param {Array} repos 
 * @returns {Object} { topic: repos[] }
 */
export function clusterByTopics(repos) {
  const topicMap = {};
  
  repos.forEach(repo => {
    (repo.topics || []).forEach(topic => {
      if (!topicMap[topic]) {
        topicMap[topic] = [];
      }
      topicMap[topic].push(repo);
    });
  });
  
  // 只保留至少有 2 个项目的 topic
  const filtered = Object.fromEntries(
    Object.entries(topicMap).filter(([, repos]) => repos.length >= 2)
  );
  
  return Object.fromEntries(
    Object.entries(filtered).sort((a, b) => b[1].length - a[1].length)
  );
}

/**
 * 生成去重建议报告
 * @param {Array} repos 
 * @param {number} threshold 
 * @returns {Object} 去重报告
 */
export function generateDeduplicationReport(repos, threshold = 0.6) {
  const similarGroups = detectSimilarRepos(repos, threshold);
  const totalDuplicates = similarGroups.reduce((sum, g) => sum + (g.repos.length - 1), 0);
  
  return {
    totalRepos: repos.length,
    duplicateGroups: similarGroups.length,
    totalDuplicates,
    potentialSavings: totalDuplicates,
    groups: similarGroups,
    summary: {
      highSimilarity: similarGroups.filter(g => g.averageSimilarity > 0.8).length,
      mediumSimilarity: similarGroups.filter(g => g.averageSimilarity > 0.6 && g.averageSimilarity <= 0.8).length,
      lowSimilarity: similarGroups.filter(g => g.averageSimilarity <= 0.6).length
    }
  };
}

export default {
  calculateStringSimilarity,
  calculateRepoSimilarity,
  detectSimilarRepos,
  clusterByLanguage,
  clusterByTopics,
  generateDeduplicationReport
};
