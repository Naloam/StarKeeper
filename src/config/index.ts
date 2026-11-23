import { useSettingsStore } from "../store/settings";

/**
 * 获取运行时 AI 配置（当前浏览器会话中的用户 Key）
 */
export function getAIConfig() {
  const settings = useSettingsStore.getState();
  return {
    apiKey: settings.deepseekApiKey,
    siliconflowApiKey: settings.siliconflowApiKey,
  };
}

/**
 * GitHub OAuth 配置
 */
export const GITHUB_CONFIG = {
  clientId: import.meta.env.VITE_GITHUB_CLIENT_ID,
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
  version: "0.4.0",

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
