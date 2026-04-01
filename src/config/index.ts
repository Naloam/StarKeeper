/**
 * 阿里云通义千问 DashScope API 配置
 */
export const DASHSCOPE_CONFIG = {
  apiKey: import.meta.env.VITE_DASHSCOPE_API_KEY,
  // 在开发环境使用代理，避免 CORS 问题
  baseUrl: import.meta.env.DEV
    ? "/api/dashscope/api/v1/services/aigc" // 开发环境使用代理
    : "https://dashscope.aliyuncs.com/api/v1/services/aigc", // 生产环境直接调用

  // 模型配置
  models: {
    turbo: "qwen-turbo", // 快速模型，适合实时交互，响应快
    plus: "qwen-plus", // 高质量模型，适合复杂摘要
    max: "qwen-max", // 最强模型，企业版使用
  },

  // Embedding 配置
  embedding: {
    model: "text-embedding-v2",
    dimension: 1536, // 向量维度（与 OpenAI 兼容）
    // Embedding API 使用独立的端点路径
    endpoint: "/embeddings",
  },

  // 价格（人民币/千tokens）
  pricing: {
    turbo: 0.0008,
    plus: 0.004,
    max: 0.012,
    embedding: 0.0007,
  },

  // API 端点
  endpoints: {
    textGeneration: "/text-generation/generation",
    embeddings: "/embeddings",
  },
};

/**
 * GitHub OAuth 配置
 */
export const GITHUB_CONFIG = {
  clientId: import.meta.env.VITE_GITHUB_CLIENT_ID,
  clientSecret: import.meta.env.VITE_GITHUB_CLIENT_SECRET,
  redirectUri: import.meta.env.VITE_GITHUB_REDIRECT_URI,

  // 请求的权限范围
  scopes: [
    "read:user", // 读取用户基本信息
    "public_repo", // 读取公开 starred repos
    "gist", // 读写 Gist（用于元数据存储）
  ],

  // GitHub API 配置
  api: {
    baseUrl: "https://api.github.com",
    graphqlUrl: "https://api.github.com/graphql",
  },
};

/**
 * 应用配置
 */
export const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME || "StarKeeper",
  url: import.meta.env.VITE_APP_URL || "http://localhost:3000",
  version: "0.3.0",

  // 功能开关
  features: {
    aiSummary: true,
    semanticSearch: true,
    healthMonitoring: true,
    collections: true,
  },

  // 数据存储模式
  storageMode: "gist", // 'gist' | 'hosted'

  // 缓存配置
  cache: {
    starsListTTL: 3600, // 1小时
    repoDetailsTTL: 7200, // 2小时
    aiSummaryTTL: 86400 * 7, // 7天
  },
};
