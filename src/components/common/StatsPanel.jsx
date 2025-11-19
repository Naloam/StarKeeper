import React from 'react';
import { 
  TrendingUp, 
  Star, 
  Tag, 
  FileText, 
  Sparkles,
  Activity,
  BarChart3,
  PieChart
} from 'lucide-react';

/**
 * 统计面板组件
 * 显示项目的基础统计信息
 */
const StatsPanel = ({ stats }) => {
  if (!stats) return null;

  const { basic, health } = stats;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-primary-600" />
        数据概览
      </h2>

      {/* 基础统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<Star className="w-5 h-5" />}
          label="总 Stars"
          value={basic.totalStars}
          color="blue"
        />
        <StatCard
          icon={<Tag className="w-5 h-5" />}
          label="标签数"
          value={basic.totalTags}
          color="purple"
        />
        <StatCard
          icon={<FileText className="w-5 h-5" />}
          label="有笔记"
          value={basic.withNotes}
          subtitle={`${basic.notesPercentage}%`}
          color="green"
        />
        <StatCard
          icon={<Sparkles className="w-5 h-5" />}
          label="AI 摘要"
          value={basic.withAISummary}
          subtitle={`${basic.aiSummaryPercentage}%`}
          color="yellow"
        />
      </div>

      {/* 健康度统计 */}
      {health.analyzedCount > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            健康度分析
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <HealthStatItem 
              label="平均健康度" 
              value={`${health.averageScore}分`}
              color="text-blue-600"
            />
            <HealthStatItem 
              label="已分析" 
              value={`${health.analyzedCount}项`}
              subtitle={`${health.analyzedPercentage}%`}
              color="text-gray-600"
            />
            <HealthStatItem 
              label="优秀" 
              value={health.distribution.excellent}
              color="text-green-600"
            />
            <HealthStatItem 
              label="良好" 
              value={health.distribution.good}
              color="text-blue-600"
            />
            <HealthStatItem 
              label="一般" 
              value={health.distribution.fair}
              color="text-yellow-600"
            />
            <HealthStatItem 
              label="需关注" 
              value={health.distribution.poor + health.distribution.critical}
              color="text-red-600"
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
const StatCard = ({ icon, label, value, subtitle, color = 'blue' }) => {
  const colorClasses = {
    blue: 'from-blue-50 to-blue-100 text-blue-600',
    purple: 'from-purple-50 to-purple-100 text-purple-600',
    green: 'from-green-50 to-green-100 text-green-600',
    yellow: 'from-yellow-50 to-yellow-100 text-yellow-600',
    red: 'from-red-50 to-red-100 text-red-600',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-lg p-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className="opacity-80">{icon}</span>
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-sm opacity-75">{label}</div>
      {subtitle && (
        <div className="text-xs opacity-60 mt-1">{subtitle}</div>
      )}
    </div>
  );
};

/**
 * 健康度统计项组件
 */
const HealthStatItem = ({ label, value, subtitle, color }) => {
  return (
    <div className="bg-gray-50 rounded p-3">
      <div className="text-xs text-gray-600 mb-1">{label}</div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
      {subtitle && (
        <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>
      )}
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
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <PieChart className="w-5 h-5 text-primary-600" />
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
  const colors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];

  const barColor = colors[index % colors.length];
  const width = (count / maxCount) * 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{language}</span>
        <span className="text-xs text-gray-500">{count} ({percentage}%)</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`${barColor} h-2 rounded-full transition-all duration-300`}
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
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Tag className="w-5 h-5 text-primary-600" />
        热门标签
      </h3>
      <div className="flex flex-wrap gap-2">
        {topTags.map((tag, index) => (
          <span
            key={tag.tag}
            className="inline-block px-3 py-1 bg-primary-50 text-primary-700 rounded-full hover:bg-primary-100 transition-colors cursor-pointer"
            style={{ fontSize: getFontSize(tag.count) }}
            title={`${tag.count} 个项目`}
          >
            {tag.tag}
          </span>
        ))}
      </div>
      {tags.length > 20 && (
        <div className="mt-3 text-xs text-gray-500 text-center">
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
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-primary-600" />
        最近活跃
      </h3>
      <div className="space-y-3">
        {repos.map(repo => (
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
      className="flex items-start justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 group-hover:text-primary-600 truncate">
          {repo.name}
        </div>
        <div className="text-sm text-gray-500">@{repo.owner}</div>
      </div>
      <div className="text-right ml-4">
        {repo.language && (
          <div className="text-xs text-gray-600 mb-1">{repo.language}</div>
        )}
        <div className="text-xs text-gray-500">{timeAgo}</div>
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

  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '昨天';
  if (diffDays < 7) return `${diffDays}天前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}月前`;
  return `${Math.floor(diffDays / 365)}年前`;
}

export default StatsPanel;
