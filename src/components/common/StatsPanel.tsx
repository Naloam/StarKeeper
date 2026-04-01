import React from "react";
import {
  TrendingUp,
  Star,
  Tag,
  FileText,
  Sparkles,
  Activity,
  BarChart3,
  PieChart,
} from "lucide-react";

/**
 * 统计面板组件
 * 显示项目的基础统计信息
 */
const StatsPanel = ({ stats }) => {
  if (!stats) return null;

  const { basic, health } = stats;

  return (
    <div className="card mb-6">
      <h2 className="text-h2 text-text-primary mb-4 flex items-center gap-2">
        <BarChart3 className="w-6 h-6 text-text-secondary" strokeWidth={1.5} />
        数据概览
      </h2>

      {/* Basic Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<Star className="w-5 h-5" strokeWidth={1.5} />}
          label="总 Stars"
          value={basic.totalStars}
        />
        <StatCard
          icon={<Tag className="w-5 h-5" strokeWidth={1.5} />}
          label="标签数"
          value={basic.totalTags}
        />
        <StatCard
          icon={<FileText className="w-5 h-5" strokeWidth={1.5} />}
          label="有笔记"
          value={basic.withNotes}
          subtitle={`${basic.notesPercentage}%`}
        />
        <StatCard
          icon={<Sparkles className="w-5 h-5" strokeWidth={1.5} />}
          label="AI 摘要"
          value={basic.withAISummary}
          subtitle={`${basic.aiSummaryPercentage}%`}
        />
      </div>

      {/* Health Statistics */}
      {health.analyzedCount > 0 && (
        <div className="border-t border-border pt-4">
          <h3 className="text-body-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4" strokeWidth={1.5} />
            健康度分析
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <HealthStatItem label="平均健康度" value={`${health.averageScore}分`} />
            <HealthStatItem
              label="已分析"
              value={`${health.analyzedCount}项`}
              subtitle={`${health.analyzedPercentage}%`}
            />
            <HealthStatItem label="优秀" value={health.distribution.excellent} />
            <HealthStatItem label="良好" value={health.distribution.good} />
            <HealthStatItem label="一般" value={health.distribution.fair} />
            <HealthStatItem
              label="需关注"
              value={health.distribution.poor + health.distribution.critical}
            />
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 统计卡片组件
 */
const StatCard = ({ icon, label, value, subtitle }) => {
  return (
    <div className="bg-surface rounded-xl p-4 border border-border transition-fast hover:shadow-card-hover">
      <div className="flex items-center justify-between mb-2">
        <span className="text-text-secondary">{icon}</span>
      </div>
      <div className="text-2xl font-semibold text-text-primary mb-1">{value}</div>
      <div className="text-body-sm text-text-secondary">{label}</div>
      {subtitle && <div className="text-caption text-text-tertiary mt-1">{subtitle}</div>}
    </div>
  );
};

/**
 * 健康度统计项组件
 */
const HealthStatItem = ({ label, value, subtitle }) => {
  return (
    <div className="bg-surface rounded-lg p-3 border border-border-light">
      <div className="text-caption text-text-secondary mb-1">{label}</div>
      <div className="text-h4 text-text-primary">{value}</div>
      {subtitle && <div className="text-caption text-text-tertiary mt-0.5">{subtitle}</div>}
    </div>
  );
};

/**
 * 语言分布组件
 */
export const LanguageDistribution = ({ languages }) => {
  if (!languages || languages.length === 0) return null;

  const topLanguages = languages.slice(0, 8);
  const maxCount = topLanguages[0]?.count || 1;

  return (
    <div className="card">
      <h3 className="text-h3 text-text-primary mb-4 flex items-center gap-2">
        <PieChart className="w-5 h-5 text-text-secondary" strokeWidth={1.5} />
        语言分布
      </h3>
      <div className="space-y-3">
        {topLanguages.map((lang, index) => (
          <LanguageBar
            key={lang.language}
            language={lang.language}
            count={lang.count}
            percentage={lang.percentage}
            maxCount={maxCount}
            index={index}
          />
        ))}
      </div>
      {languages.length > 8 && (
        <div className="mt-3 text-xs text-gray-500 text-center">
          还有 {languages.length - 8} 种其他语言
        </div>
      )}
    </div>
  );
};

/**
 * 语言条形图组件
 */
const LanguageBar = ({ language, count, percentage, maxCount, index }) => {
  const width = (count / maxCount) * 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-body-sm font-medium text-text-primary">{language}</span>
        <span className="text-caption text-text-secondary">
          {count} ({percentage}%)
        </span>
      </div>
      <div className="w-full bg-surface rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-180 ease-out"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
};

/**
 * 标签云组件
 */
export const TagCloud = ({ tags }) => {
  if (!tags || tags.length === 0) return null;

  const topTags = tags.slice(0, 20);
  const maxCount = topTags[0]?.count || 1;

  // 计算字体大小（12px - 24px）
  const getFontSize = (count) => {
    const size = 12 + (count / maxCount) * 12;
    return `${size}px`;
  };

  return (
    <div className="card">
      <h3 className="text-h3 text-text-primary mb-4 flex items-center gap-2">
        <Tag className="w-5 h-5 text-text-secondary" strokeWidth={1.5} />
        热门标签
      </h3>
      <div className="flex flex-wrap gap-2">
        {topTags.map((tag, index) => (
          <span
            key={tag.tag}
            className="inline-block px-3 py-1 bg-surface text-text-primary rounded-full hover:bg-surface-darker transition-fast cursor-pointer border border-border"
            style={{ fontSize: getFontSize(tag.count) }}
            title={`${tag.count} 个项目`}
          >
            {tag.tag}
          </span>
        ))}
      </div>
      {tags.length > 20 && (
        <div className="mt-3 text-caption text-text-secondary text-center">
          还有 {tags.length - 20} 个其他标签
        </div>
      )}
    </div>
  );
};

/**
 * 最近活跃项目列表
 */
export const RecentlyActiveRepos = ({ repos }) => {
  if (!repos || repos.length === 0) return null;

  return (
    <div className="card">
      <h3 className="text-h3 text-text-primary mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-text-secondary" strokeWidth={1.5} />
        最近活跃
      </h3>
      <div className="space-y-3">
        {repos.map((repo) => (
          <RepoItem key={repo.id} repo={repo} />
        ))}
      </div>
    </div>
  );
};

/**
 * 项目条目组件
 */
const RepoItem = ({ repo }) => {
  const timeAgo = getTimeAgo(repo.pushedAt);

  return (
    <a
      href={repo.htmlUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start justify-between p-3 hover:bg-surface rounded-lg transition-fast group border border-transparent hover:border-border"
    >
      <div className="flex-1 min-w-0">
        <div className="font-medium text-text-primary group-hover:text-primary truncate">
          {repo.name}
        </div>
        <div className="text-body-sm text-text-secondary">@{repo.owner}</div>
      </div>
      <div className="text-right ml-4">
        {repo.language && (
          <div className="text-caption text-text-secondary mb-1">{repo.language}</div>
        )}
        <div className="text-caption text-text-tertiary">{timeAgo}</div>
      </div>
    </a>
  );
};

/**
 * 计算时间差
 */
function getTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "今天";
  if (diffDays === 1) return "昨天";
  if (diffDays < 7) return `${diffDays}天前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}月前`;
  return `${Math.floor(diffDays / 365)}年前`;
}

export default StatsPanel;
