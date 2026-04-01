/**
 * StarKeeper 共享类型定义
 */

/** GitHub 用户信息 */
export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  avatarUrl: string;
  htmlUrl: string;
}

/** Starred 仓库信息 */
export interface StarredRepo {
  id: number;
  name: string;
  fullName: string;
  owner: {
    login: string;
    avatarUrl: string;
    htmlUrl: string;
  };
  description: string | null;
  language: string | null;
  stargazersCount: number;
  forksCount: number;
  htmlUrl: string;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  archived: boolean;
  isPrivate: boolean;
}

/** 仓库元数据（存储在 Gist 中） */
export interface RepoMetadata {
  tags?: string[];
  notes?: string;
  color?: string;
  healthScore?: HealthScore;
  aiSummary?: string;
  embedding?: number[];
  embeddingUpdatedAt?: string;
  archived?: boolean;
}

/** 健康度评分 */
export interface HealthScore {
  score: number;
  activity: number;
  community: number;
  maintenance: number;
  level: "excellent" | "good" | "fair" | "poor" | "critical";
  details: {
    commitsLast30Days?: number;
    daysSinceLastUpdate?: number;
    latestRelease?: { tagName: string; publishedAt: string } | null;
    openIssues?: number;
    openPRs?: number;
    contributors?: number;
    hasCI?: boolean;
    archived?: boolean;
  };
  calculatedAt: string;
  cacheExpiry: string;
  error?: string;
}

/** 收藏夹 */
export interface Collection {
  id: string;
  name: string;
  description: string;
  repoIds: number[];
  createdAt: string;
  updatedAt: string;
}

/** Gist 元数据格式 */
export interface GistMetadata {
  version: string;
  repositories: Record<string, RepoMetadata>;
  collections?: Collection[];
  shareConfig?: ShareConfig;
  sharedStars?: SharedStar[];
  createdAt?: string;
  updatedAt: string;
}

/** 分享配置 */
export interface ShareConfig {
  isPublic: boolean;
  shareId: string;
  shareTitle: string;
  shareDescription: string;
  updatedAt: string;
}

/** 分享的 Star */
export interface SharedStar {
  id: number;
  name: string;
  fullName: string;
  owner: { login: string; avatarUrl: string };
  description: string | null;
  language: string | null;
  stargazersCount: number;
  forksCount: number;
  htmlUrl: string;
  createdAt: string;
  updatedAt: string;
}

/** 同步队列操作 */
export interface SyncOperation {
  type: string;
  data: Record<string, unknown>;
  timestamp: number;
  retryCount?: number;
}

/** 统计报告 */
export interface StatsReport {
  basic: {
    totalStars: number;
    totalLanguages: number;
    totalTags: number;
    avgStarsPerRepo: number;
  };
  languages: { name: string; count: number; percentage: number }[];
  tags: { name: string; count: number; percentage: number }[];
  health: {
    averageScore: number;
    excellent: number;
    good: number;
    fair: number;
    poor: number;
    critical: number;
  };
  growth: {
    last30Days: number;
    last90Days: number;
    lastYear: number;
  };
}
