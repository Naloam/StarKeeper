import React from 'react';
import { HealthProgressBar } from './HealthBadge';

/**
 * 健康度详情弹窗
 * 显示详细的评分分解和建议
 */
const HealthDetailModal = ({ repo, healthScore, onClose }) => {
  if (!healthScore) return null;

  const { score, activity, community, maintenance, level, details } = healthScore;

  // 获取等级配置
  const getLevelConfig = (level) => {
    switch (level) {
      case 'excellent':
        return { color: 'text-green-600', bg: 'bg-green-50', label: '优秀 🎉' };
      case 'good':
        return { color: 'text-blue-600', bg: 'bg-blue-50', label: '良好 👍' };
      case 'fair':
        return { color: 'text-yellow-600', bg: 'bg-yellow-50', label: '一般 😐' };
      case 'poor':
        return { color: 'text-orange-600', bg: 'bg-orange-50', label: '较差 😟' };
      case 'critical':
        return { color: 'text-red-600', bg: 'bg-red-50', label: '危险 ⚠️' };
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-50', label: '未知' };
    }
  };

  const config = getLevelConfig(level);

  // 生成建议
  const getRecommendations = () => {
    const recommendations = [];

    if (details.archived) {
      recommendations.push({
        type: 'error',
        text: '该项目已被归档，不再维护。建议寻找替代方案。',
      });
    }

    if (details.daysSinceLastUpdate > 365) {
      recommendations.push({
        type: 'warning',
        text: `已超过 ${Math.floor(details.daysSinceLastUpdate / 30)} 个月未更新，可能已停止维护。`,
      });
    } else if (details.daysSinceLastUpdate > 180) {
      recommendations.push({
        type: 'info',
        text: `已超过 ${Math.floor(details.daysSinceLastUpdate / 30)} 个月未更新，建议关注项目动态。`,
      });
    }

    if (details.commitsLast30Days === 0) {
      recommendations.push({
        type: 'warning',
        text: '最近 30 天无提交记录，项目活跃度较低。',
      });
    } else if (details.commitsLast30Days >= 20) {
      recommendations.push({
        type: 'success',
        text: `最近 30 天有 ${details.commitsLast30Days} 次提交，项目非常活跃！`,
      });
    }

    if (!details.hasCI) {
      recommendations.push({
        type: 'info',
        text: '项目未配置 CI/CD，代码质量保障可能较弱。',
      });
    }

    if (details.openIssues > 500) {
      recommendations.push({
        type: 'warning',
        text: `积压了 ${details.openIssues} 个 Issues，维护压力较大。`,
      });
    }

    if (details.contributors < 2) {
      recommendations.push({
        type: 'info',
        text: '仅有单人维护，项目持续性可能存在风险。',
      });
    }

    if (score >= 80) {
      recommendations.push({
        type: 'success',
        text: '项目各项指标优秀，可以放心使用！',
      });
    }

    return recommendations;
  };

  const recommendations = getRecommendations();

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return '未知';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
         onClick={onClose}>
      <div className="bg-surface-card rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
           onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-surface-card border-b border-border px-6 py-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-text-primary">
                项目健康度报告
              </h2>
              <p className="text-sm text-text-secondary mt-1">
                {repo.fullName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text-secondary transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* 综合评分 */}
          <div className={`${config.bg} rounded-lg p-6 text-center`}>
            <div className={`text-6xl font-bold ${config.color} mb-2`}>
              {score}
            </div>
            <div className={`text-xl font-semibold ${config.color}`}>
              {config.label}
            </div>
            <div className="text-sm text-text-secondary mt-2">
              计算时间: {formatDate(healthScore.calculatedAt)}
            </div>
          </div>

          {/* 评分细分 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text-primary">评分细分</h3>
            
            <div className="space-y-3">
              {/* 活跃度 */}
              <div>
                <div className="flex justify-between text-sm text-text-primary mb-1">
                  <span>活跃度 (40分)</span>
                  <span className="font-semibold">{activity}分</span>
                </div>
                <HealthProgressBar score={(activity / 40) * 100} showLabel={false} />
                <div className="mt-2 text-xs text-text-secondary space-y-1">
                  <div>• 最近 30 天提交: {details.commitsLast30Days} 次</div>
                  <div>• 距今更新: {details.daysSinceLastUpdate} 天</div>
                  {details.latestRelease && (
                    <div>• 最新版本: {details.latestRelease.tagName} ({formatDate(details.latestRelease.publishedAt)})</div>
                  )}
                </div>
              </div>

              {/* 社区健康 */}
              <div>
                <div className="flex justify-between text-sm text-text-primary mb-1">
                  <span>社区健康 (30分)</span>
                  <span className="font-semibold">{community}分</span>
                </div>
                <HealthProgressBar score={(community / 30) * 100} showLabel={false} />
                <div className="mt-2 text-xs text-text-secondary space-y-1">
                  <div>• 开放 Issues: {details.openIssues}</div>
                  <div>• 开放 PRs: {details.openPRs}</div>
                  <div>• 贡献者: {details.contributors} 人</div>
                </div>
              </div>

              {/* 维护状态 */}
              <div>
                <div className="flex justify-between text-sm text-text-primary mb-1">
                  <span>维护状态 (30分)</span>
                  <span className="font-semibold">{maintenance}分</span>
                </div>
                <HealthProgressBar score={(maintenance / 30) * 100} showLabel={false} />
                <div className="mt-2 text-xs text-text-secondary space-y-1">
                  <div>• 归档状态: {details.archived ? '已归档 ❌' : '正常 ✅'}</div>
                  <div>• CI/CD: {details.hasCI ? '已配置 ✅' : '未配置 ⚠️'}</div>
                  <div>• 最后更新: {formatDate(repo.updatedAt)}</div>
                </div>
              </div>
            </div>
          </div>


          {/* 建议 */}
          {recommendations.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-text-primary">分析建议</h3>
              <div className="space-y-2">
                {recommendations.map((rec, index) => {
                  const typeConfig = {
                    success: { bg: 'bg-success-light', border: 'border-success-light', icon: '✅' },
                    warning: { bg: 'bg-warning-light', border: 'border-warning-light', icon: '⚠️' },
                    error: { bg: 'bg-danger-light', border: 'border-danger-light', icon: '❌' },
                    info: { bg: 'bg-info-light', border: 'border-info-light', icon: 'ℹ️' },
                  };
                  const cfg = typeConfig[rec.type];

                  return (
                    <div
                      key={index}
                      className={`${cfg.bg} ${cfg.border} border rounded-lg px-4 py-3 text-sm text-text-primary`}
                    >
                      <span className="mr-2">{cfg.icon}</span>
                      {rec.text}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-surface-darker border-t border-border px-6 py-4">
          <button
            onClick={onClose}
            className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default HealthDetailModal;
