/**
 * 语义搜索服务
 * 基于 DashScope Embedding API 实现自然语言搜索
 */

import { generateEmbedding, batchGenerateEmbeddings } from './dashscope.service';

/**
 * 计算余弦相似度
 * @param {Array<number>} vec1 - 向量1
 * @param {Array<number>} vec2 - 向量2
 * @returns {number} 相似度分数 (0-1)
 */
export function cosineSimilarity(vec1, vec2) {
  if (!vec1 || !vec2 || vec1.length !== vec2.length) {
    throw new Error('向量维度不匹配');
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }

  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

/**
 * 为项目生成搜索文本（用于向量化）
 * @param {Object} repo - GitHub 仓库对象
 * @param {Object} metadata - 项目元数据
 * @returns {string} 搜索文本
 */
export function generateSearchText(repo, metadata) {
  const parts = [];

  // 1. 项目名称（重复2次增加权重）
  parts.push(repo.name);
  parts.push(repo.name);
  
  // 2. 项目全名（owner/name 格式）
  if (repo.full_name) {
    parts.push(repo.full_name);
  }
  
  // 3. 描述（最重要的特征，重复2次）
  if (repo.description) {
    parts.push(repo.description);
    parts.push(repo.description);
  }
  
  // 4. 语言（重复2次，语言是重要特征）
  if (repo.language) {
    parts.push(repo.language);
    parts.push(repo.language);
    // 添加常见的语言相关词汇
    const langKeywords = {
      'JavaScript': 'JS 前端 Web Node.js',
      'TypeScript': 'TS 前端 Web 类型安全',
      'Python': 'Python 脚本 数据分析 机器学习',
      'Java': 'Java 后端 企业级',
      'Go': 'Golang 后端 微服务',
      'Rust': 'Rust 系统编程 性能',
      'C++': 'CPP 系统编程 游戏',
      'C#': 'CSharp .NET Unity',
      'PHP': 'PHP Web 后端',
      'Ruby': 'Ruby Rails Web',
      'Swift': 'Swift iOS macOS',
      'Kotlin': 'Kotlin Android',
      'Vue': 'Vue.js 前端框架',
      'React': 'React.js 前端框架'
    };
    if (langKeywords[repo.language]) {
      parts.push(langKeywords[repo.language]);
    }
  }
  
  // 5. 主题标签（GitHub topics，只加一次，topics 本身已经很精确）
  if (repo.topics && Array.isArray(repo.topics)) {
    const topicsStr = repo.topics.join(' ');
    parts.push(topicsStr);
  }
  
  // 6. AI 摘要（详细的项目信息）
  if (metadata?.aiSummary) {
    if (typeof metadata.aiSummary === 'string') {
      parts.push(metadata.aiSummary);
    } else if (metadata.aiSummary.summary) {
      parts.push(metadata.aiSummary.summary);
      if (metadata.aiSummary.features && Array.isArray(metadata.aiSummary.features)) {
        parts.push(metadata.aiSummary.features.join(' '));
      }
      if (metadata.aiSummary.useCase) {
        parts.push(metadata.aiSummary.useCase);
      }
      if (metadata.aiSummary.techStack && Array.isArray(metadata.aiSummary.techStack)) {
        const techStack = metadata.aiSummary.techStack.join(' ');
        parts.push(techStack);
      }
    }
  }

  // 7. 用户标签（只加一次）
  if (metadata?.tags && Array.isArray(metadata.tags)) {
    const tagsStr = metadata.tags.join(' ');
    parts.push(tagsStr);
  }

  // 8. 笔记
  if (metadata?.notes) {
    parts.push(metadata.notes);
  }
  
  // 9. 根据项目类型添加关键词
  const nameAndDesc = `${repo.name} ${repo.description || ''}`.toLowerCase();
  
  // 前端相关
  if (nameAndDesc.match(/react|vue|angular|svelte|component|ui|frontend|前端/)) {
    parts.push('前端 Web UI 组件 界面');
  }
  
  // 后端相关
  if (nameAndDesc.match(/server|backend|api|express|koa|flask|django|spring|后端/)) {
    parts.push('后端 服务器 API 接口');
  }
  
  // 工具库
  if (nameAndDesc.match(/util|tool|helper|library|库|工具/)) {
    parts.push('工具 库 辅助 实用');
  }
  
  // 框架
  if (nameAndDesc.match(/framework|engine|框架|引擎/)) {
    parts.push('框架 平台 系统');
  }
  
  // 数据相关
  if (nameAndDesc.match(/data|database|sql|mongo|redis|数据/)) {
    parts.push('数据 数据库 存储');
  }
  
  // 可视化
  if (nameAndDesc.match(/chart|graph|visual|echarts|d3|可视化|图表/)) {
    parts.push('可视化 图表 数据展示');
  }

  return parts.filter(Boolean).join(' ');
}

/**
 * 为单个项目生成 embedding 向量
 * @param {Object} repo - GitHub 仓库对象
 * @param {Object} metadata - 项目元数据
 * @returns {Promise<Array<number>>} embedding 向量
 */
export async function generateRepoEmbedding(repo, metadata) {
  const searchText = generateSearchText(repo, metadata);
  
  if (!searchText.trim()) {
    throw new Error('无法生成搜索文本');
  }

  return await generateEmbedding(searchText);
}

/**
 * 批量生成项目 embedding 向量
 * @param {Array<Object>} repos - GitHub 仓库数组
 * @param {Object} metadataMap - 元数据映射 {repoId: metadata}
 * @param {Function} onProgress - 进度回调 (current, total)
 * @returns {Promise<Object>} {repoId: embedding} 映射
 */
export async function batchGenerateRepoEmbeddings(repos, metadataMap, onProgress) {
  const embeddings = {};
  const batchSize = 10; // 每批处理 10 个

  for (let i = 0; i < repos.length; i += batchSize) {
    const batch = repos.slice(i, Math.min(i + batchSize, repos.length));
    
    // 生成搜索文本
    const texts = batch.map(repo => {
      const metadata = metadataMap[repo.id] || {};
      return generateSearchText(repo, metadata);
    });

    try {
      // 批量生成 embeddings
      const batchEmbeddings = await batchGenerateEmbeddings(texts);
      
      // 映射到 repoId
      batch.forEach((repo, idx) => {
        embeddings[repo.id] = batchEmbeddings[idx];
      });

      // 报告进度
      if (onProgress) {
        onProgress(Math.min(i + batchSize, repos.length), repos.length);
      }

      // 避免速率限制
      if (i + batchSize < repos.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`批量生成 embeddings 失败 (batch ${i}-${i + batchSize}):`, error);
      throw error;
    }
  }

  return embeddings;
}

/**
 * 语义搜索
 * @param {string} query - 搜索查询（自然语言）
 * @param {Array<Object>} repos - GitHub 仓库数组
 * @param {Object} embeddingsMap - embedding 映射 {repoId: embedding}
 * @param {Object} options - 搜索选项
 * @param {number} options.topK - 返回前 K 个结果，默认 10（动态调整）
 * @param {number} options.threshold - 最小相似度阈值，默认 0.4
 * @returns {Promise<Array<Object>>} 搜索结果 [{repo, score, relevance}]
 */
export async function semanticSearch(query, repos, embeddingsMap, options = {}) {
  const { topK = 10, threshold = 0.4 } = options;

  if (!query || !query.trim()) {
    return [];
  }

  // 生成查询向量
  const queryEmbedding = await generateEmbedding(query);

  // 计算相似度
  const results = [];
  for (const repo of repos) {
    const repoEmbedding = embeddingsMap[repo.id];
    if (!repoEmbedding) continue;

    try {
      const score = cosineSimilarity(queryEmbedding, repoEmbedding);
      
      if (score >= threshold) {
        // 确定相关度等级
        let relevance = 'low';
        if (score >= 0.7) {
          relevance = 'high';
        } else if (score >= 0.55) {
          relevance = 'medium';
        }

        results.push({
          repo,
          score: Math.round(score * 100) / 100, // 保留两位小数
          relevance
        });
      }
    } catch (error) {
      console.error(`计算相似度失败 (repo ${repo.id}):`, error);
    }
  }

  // 按相似度降序排序
  results.sort((a, b) => b.score - a.score);

  // 动态调整结果数量
  // 如果有高相关度结果，优先返回高相关度的
  const highRelevance = results.filter(r => r.relevance === 'high');
  const mediumRelevance = results.filter(r => r.relevance === 'medium');
  const lowRelevance = results.filter(r => r.relevance === 'low');

  let finalResults = [];
  
  // 策略：优先返回高相关度，如果不足再补充中等相关度
  if (highRelevance.length >= 3) {
    // 如果有足够的高相关度结果，主要返回高相关度
    finalResults = [...highRelevance.slice(0, Math.min(highRelevance.length, topK))];
    const remaining = topK - finalResults.length;
    if (remaining > 0 && mediumRelevance.length > 0) {
      finalResults.push(...mediumRelevance.slice(0, Math.min(remaining, 3)));
    }
  } else {
    // 混合返回
    finalResults = [...highRelevance];
    const remaining = topK - finalResults.length;
    if (remaining > 0) {
      finalResults.push(...mediumRelevance.slice(0, Math.min(remaining, Math.ceil(remaining * 0.6))));
    }
    const stillRemaining = topK - finalResults.length;
    if (stillRemaining > 0) {
      finalResults.push(...lowRelevance.slice(0, Math.min(stillRemaining, 5)));
    }
  }

  return finalResults;
}

/**
 * 查找相似项目（基于项目本身的 embedding）
 * @param {Object} targetRepo - 目标项目
 * @param {Array<Object>} repos - 所有项目
 * @param {Object} embeddingsMap - embedding 映射
 * @param {Object} options - 选项
 * @param {number} options.topK - 返回前 K 个结果，默认 5
 * @param {number} options.threshold - 最小相似度阈值，默认 0.5
 * @returns {Array<Object>} 相似项目 [{repo, score}]
 */
export function findSimilarRepos(targetRepo, repos, embeddingsMap, options = {}) {
  const { topK = 5, threshold = 0.5 } = options;

  const targetEmbedding = embeddingsMap[targetRepo.id];
  if (!targetEmbedding) {
    return [];
  }

  const results = [];
  for (const repo of repos) {
    // 排除自己
    if (repo.id === targetRepo.id) continue;

    const repoEmbedding = embeddingsMap[repo.id];
    if (!repoEmbedding) continue;

    try {
      const score = cosineSimilarity(targetEmbedding, repoEmbedding);
      
      if (score >= threshold) {
        results.push({
          repo,
          score: Math.round(score * 100) / 100
        });
      }
    } catch (error) {
      console.error(`计算相似度失败 (repo ${repo.id}):`, error);
    }
  }

  // 按相似度降序排序
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, topK);
}

/**
 * 从 Gist 加载 embeddings
 * @param {Object} metadata - 元数据对象
 * @returns {Object} embeddings 映射
 */
export function loadEmbeddingsFromMetadata(metadata) {
  const embeddings = {};
  
  for (const [repoId, repoMeta] of Object.entries(metadata)) {
    if (repoMeta?.embedding && Array.isArray(repoMeta.embedding)) {
      embeddings[repoId] = repoMeta.embedding;
    }
  }

  return embeddings;
}

/**
 * 将 embeddings 保存到元数据
 * @param {Object} metadata - 元数据对象
 * @param {Object} embeddingsMap - embeddings 映射
 * @returns {Object} 更新后的元数据
 */
export function saveEmbeddingsToMetadata(metadata, embeddingsMap) {
  const updatedMetadata = { ...metadata };

  for (const [repoId, embedding] of Object.entries(embeddingsMap)) {
    if (!updatedMetadata[repoId]) {
      updatedMetadata[repoId] = {};
    }
    updatedMetadata[repoId].embedding = embedding;
    updatedMetadata[repoId].embeddingUpdatedAt = Date.now();
  }

  return updatedMetadata;
}

/**
 * 检查哪些项目需要重新生成 embedding
 * @param {Array<Object>} repos - 项目列表
 * @param {Object} metadata - 元数据
 * @returns {Array<Object>} 需要更新的项目列表
 */
export function getReposNeedingEmbedding(repos, metadata) {
  const needUpdate = [];

  for (const repo of repos) {
    const repoMeta = metadata[repo.id];
    
    // 没有 embedding
    if (!repoMeta?.embedding) {
      needUpdate.push(repo);
      continue;
    }

    // 元数据更新时间晚于 embedding 生成时间（说明内容有更新）
    if (repoMeta.updatedAt && repoMeta.embeddingUpdatedAt) {
      if (repoMeta.updatedAt > repoMeta.embeddingUpdatedAt) {
        needUpdate.push(repo);
      }
    }
  }

  return needUpdate;
}

export default {
  cosineSimilarity,
  generateSearchText,
  generateRepoEmbedding,
  batchGenerateRepoEmbeddings,
  semanticSearch,
  findSimilarRepos,
  loadEmbeddingsFromMetadata,
  saveEmbeddingsToMetadata,
  getReposNeedingEmbedding,
};
