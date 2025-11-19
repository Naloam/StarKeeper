import React from 'react';

/**
 * 健康度徽章组件
 * 显示项目的健康度评分和等级
 */
const HealthBadge = ({ healthScore, size = 'md', showScore = true, onClick }) => {
  if (!healthScore) return null;

  const { score, level } = healthScore;

  // 根据等级配置颜色和图标
  const getLevelConfig = (level) => {
    switch (level) {
      case 'excellent':
        return {
          color: 'bg-surface',
          textColor: 'text-success',
          bgLight: 'bg-surface',
          borderColor: 'border-success-light',
          icon: '🟢',
          label: '优秀',
        };
      case 'good':
        return {
          color: 'bg-surface',
          textColor: 'text-primary',
          bgLight: 'bg-surface',
          borderColor: 'border-primary/20',
          icon: '🔵',
          label: '良好',
        };
      case 'fair':
        return {
          color: 'bg-surface',
          textColor: 'text-warning',
          bgLight: 'bg-surface',
          borderColor: 'border-warning-light',
          icon: '🟡',
          label: '一般',
        };
      case 'poor':
        return {
          color: 'bg-surface',
          textColor: 'text-warning',
          bgLight: 'bg-surface',
          borderColor: 'border-warning-light',
          icon: '🟠',
          label: '较差',
        };
      case 'critical':
        return {
          color: 'bg-surface',
          textColor: 'text-danger',
          bgLight: 'bg-surface',
          borderColor: 'border-danger-light',
          icon: '🔴',
          label: '危险',
        };
      default:
        return {
          color: 'bg-surface',
          textColor: 'text-text-secondary',
          bgLight: 'bg-surface',
          borderColor: 'border-border',
          icon: '⚪',
          label: '未知',
        };
    }
  };

  const config = getLevelConfig(level);

  // 根据尺寸配置样式
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  const handleClick = (e) => {
    if (onClick) {
      e.stopPropagation();
      onClick();
    }
  };

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 rounded-full
        ${config.bgLight} ${config.borderColor} border
        ${sizeClasses[size]}
        ${onClick ? 'cursor-pointer hover:shadow-card-hover transition-fast' : ''}
      `}
      onClick={handleClick}
      title={`健康度评分: ${score}分 (${config.label})`}
    >
      <span className="text-base">{config.icon}</span>
      {showScore && (
        <span className={`font-semibold ${config.textColor}`}>
          {score}分
        </span>
      )}
      <span className={`${config.textColor} opacity-80`}>
        {config.label}
      </span>
    </div>
  );
};

/**
 * 简单的健康度进度条
 */
export const HealthProgressBar = ({ score, showLabel = true }) => {
  const getColor = (score) => {
    if (score >= 80) return 'bg-success';
    if (score >= 60) return 'bg-primary';
    if (score >= 40) return 'bg-warning';
    if (score >= 20) return 'bg-warning';
    return 'bg-danger';
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-caption text-text-secondary mb-1">
          <span>健康度</span>
          <span className="font-semibold">{score}分</span>
        </div>
      )}
      <div className="w-full bg-surface rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-180 ${getColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
};

/**
 * 健康度图标（紧凑版）
 */
export const HealthIcon = ({ level, size = '16' }) => {
  const icons = {
    excellent: '🟢',
    good: '🔵',
    fair: '🟡',
    poor: '🟠',
    critical: '🔴',
  };

  return (
    <span style={{ fontSize: `${size}px` }} title={`健康度: ${level}`}>
      {icons[level] || '⚪'}
    </span>
  );
};

export default HealthBadge;
