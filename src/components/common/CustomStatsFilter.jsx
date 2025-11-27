import React, { useState, useMemo } from 'react';
import { Filter, X, Plus, Sparkles } from 'lucide-react';

/**
 * 自定义统计维度组件
 * 允许用户自定义统计条件和分组
 */
export default function CustomStatsFilter({ stars, metadata, onApplyFilter }) {
  const [filters, setFilters] = useState([]);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // 可用的过滤维度
  const availableDimensions = [
    { id: 'language', label: '编程语言', type: 'select' },
    { id: 'stars', label: 'Stars 数量', type: 'range' },
    { id: 'forks', label: 'Forks 数量', type: 'range' },
    { id: 'tags', label: '标签', type: 'multiselect' },
    { id: 'hasNotes', label: '有笔记', type: 'boolean' },
    { id: 'hasAISummary', label: '有 AI 摘要', type: 'boolean' },
    { id: 'hasHealth', label: '已分析健康度', type: 'boolean' },
    { id: 'healthLevel', label: '健康度等级', type: 'select' },
    { id: 'dateRange', label: 'Star 时间范围', type: 'daterange' },
    { id: 'updateTime', label: '最后更新时间', type: 'daterange' },
  ];

  // 添加过滤条件
  const addFilter = (dimension) => {
    const newFilter = {
      id: Date.now(),
      dimension: dimension.id,
      label: dimension.label,
      type: dimension.type,
      value: null
    };
    setFilters([...filters, newFilter]);
    setShowFilterModal(false);
  };

  // 移除过滤条件
  const removeFilter = (filterId) => {
    setFilters(filters.filter(f => f.id !== filterId));
  };

  // 更新过滤条件值
  const updateFilterValue = (filterId, value) => {
    setFilters(filters.map(f => 
      f.id === filterId ? { ...f, value } : f
    ));
  };

  // 应用过滤
  const handleApplyFilters = () => {
    const filteredStars = stars.filter(star => {
      return filters.every(filter => {
        const repoMeta = metadata[star.id] || {};
        
        switch (filter.dimension) {
          case 'language':
            return !filter.value || star.language === filter.value;
          
          case 'stars':
            if (!filter.value) return true;
            const { min, max } = filter.value;
            return star.stargazersCount >= (min || 0) && 
                   star.stargazersCount <= (max || Infinity);
          
          case 'forks':
            if (!filter.value) return true;
            return star.forksCount >= (filter.value.min || 0) && 
                   star.forksCount <= (filter.value.max || Infinity);
          
          case 'tags':
            if (!filter.value || filter.value.length === 0) return true;
            return filter.value.some(tag => repoMeta.tags?.includes(tag));
          
          case 'hasNotes':
            return filter.value === null || 
                   (filter.value ? !!repoMeta.notes : !repoMeta.notes);
          
          case 'hasAISummary':
            return filter.value === null || 
                   (filter.value ? !!repoMeta.aiSummary : !repoMeta.aiSummary);
          
          case 'hasHealth':
            return filter.value === null || 
                   (filter.value ? !!repoMeta.healthScore : !repoMeta.healthScore);
          
          case 'healthLevel':
            return !filter.value || repoMeta.healthScore?.level === filter.value;
          
          case 'dateRange':
            if (!filter.value) return true;
            const starDate = new Date(star.starredAt);
            return starDate >= new Date(filter.value.start) && 
                   starDate <= new Date(filter.value.end);
          
          case 'updateTime':
            if (!filter.value) return true;
            const updateDate = new Date(star.pushedAt);
            return updateDate >= new Date(filter.value.start) && 
                   updateDate <= new Date(filter.value.end);
          
          default:
            return true;
        }
      });
    });

    onApplyFilter(filteredStars, filters);
  };

  // 重置过滤
  const handleResetFilters = () => {
    setFilters([]);
    onApplyFilter(stars, []);
  };

  // 获取所有语言选项
  const languageOptions = useMemo(() => {
    const languages = new Set();
    stars.forEach(star => {
      if (star.language) languages.add(star.language);
    });
    return Array.from(languages).sort();
  }, [stars]);

  // 获取所有标签选项
  const tagOptions = useMemo(() => {
    const tags = new Set();
    Object.values(metadata).forEach(meta => {
      if (meta.tags) meta.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [metadata]);

  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-h3 text-text-primary flex items-center gap-2">
          <Filter className="w-5 h-5 text-text-secondary" strokeWidth={1.5} />
          自定义统计维度
        </h3>
        <div className="flex gap-2">
          {filters.length > 0 && (
            <button
              onClick={handleResetFilters}
              className="btn bg-surface border border-border text-text-secondary hover:bg-surface-darker text-body-sm"
            >
              重置
            </button>
          )}
          <button
            onClick={() => setShowFilterModal(true)}
            className="btn bg-primary text-white hover:bg-primary/90 text-body-sm"
          >
            <Plus className="w-4 h-4" strokeWidth={1.5} />
            <span>添加条件</span>
          </button>
        </div>
      </div>

      {/* 过滤条件列表 */}
      {filters.length > 0 ? (
        <div className="space-y-3 mb-4">
          {filters.map(filter => (
            <div key={filter.id} className="flex items-center gap-3 p-3 bg-surface rounded-lg border border-border">
              <div className="flex-1">
                <label className="block text-caption text-text-secondary mb-1">
                  {filter.label}
                </label>
                {renderFilterInput(filter, languageOptions, tagOptions, updateFilterValue)}
              </div>
              <button
                onClick={() => removeFilter(filter.id)}
                className="p-1 hover:bg-surface-darker rounded transition-fast"
              >
                <X className="w-4 h-4 text-text-secondary" strokeWidth={1.5} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-text-secondary">
          <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" strokeWidth={1.5} />
          <p className="text-body-sm">暂无过滤条件</p>
          <p className="text-caption mt-1">点击"添加条件"开始自定义统计</p>
        </div>
      )}

      {/* 应用按钮 */}
      {filters.length > 0 && (
        <button
          onClick={handleApplyFilters}
          className="btn w-full bg-primary text-white hover:bg-primary/90"
        >
          应用过滤条件 ({filters.length})
        </button>
      )}

      {/* 添加过滤条件模态框 */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-text-primary/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-h4 text-text-primary">选择统计维度</h4>
              <button
                onClick={() => setShowFilterModal(false)}
                className="p-1 hover:bg-surface rounded transition-fast"
              >
                <X className="w-5 h-5 text-text-secondary" strokeWidth={1.5} />
              </button>
            </div>
            <div className="space-y-2">
              {availableDimensions.map(dimension => (
                <button
                  key={dimension.id}
                  onClick={() => addFilter(dimension)}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-surface border border-transparent hover:border-border transition-fast"
                >
                  <div className="text-body-sm text-text-primary">{dimension.label}</div>
                  <div className="text-caption text-text-secondary mt-1">
                    {getDimensionDescription(dimension.type)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 渲染不同类型的输入框
function renderFilterInput(filter, languageOptions, tagOptions, updateValue) {
  switch (filter.type) {
    case 'select':
      if (filter.dimension === 'language') {
        return (
          <select
            value={filter.value || ''}
            onChange={(e) => updateValue(filter.id, e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-body-sm focus-ring"
          >
            <option value="">全部语言</option>
            {languageOptions.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        );
      } else if (filter.dimension === 'healthLevel') {
        return (
          <select
            value={filter.value || ''}
            onChange={(e) => updateValue(filter.id, e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-body-sm focus-ring"
          >
            <option value="">全部等级</option>
            <option value="excellent">优秀</option>
            <option value="good">良好</option>
            <option value="fair">一般</option>
            <option value="poor">较差</option>
            <option value="critical">严重</option>
          </select>
        );
      }
      break;

    case 'range':
      return (
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="最小值"
            value={filter.value?.min || ''}
            onChange={(e) => updateValue(filter.id, { ...filter.value, min: e.target.value })}
            className="flex-1 px-3 py-2 border border-border rounded-lg text-body-sm focus-ring"
          />
          <span className="text-text-secondary self-center">-</span>
          <input
            type="number"
            placeholder="最大值"
            value={filter.value?.max || ''}
            onChange={(e) => updateValue(filter.id, { ...filter.value, max: e.target.value })}
            className="flex-1 px-3 py-2 border border-border rounded-lg text-body-sm focus-ring"
          />
        </div>
      );

    case 'boolean':
      return (
        <div className="flex gap-2">
          <button
            onClick={() => updateValue(filter.id, true)}
            className={`flex-1 px-3 py-2 rounded-lg text-body-sm transition-fast ${
              filter.value === true
                ? 'bg-primary text-white'
                : 'bg-surface text-text-secondary hover:bg-surface-darker'
            }`}
          >
            是
          </button>
          <button
            onClick={() => updateValue(filter.id, false)}
            className={`flex-1 px-3 py-2 rounded-lg text-body-sm transition-fast ${
              filter.value === false
                ? 'bg-primary text-white'
                : 'bg-surface text-text-secondary hover:bg-surface-darker'
            }`}
          >
            否
          </button>
        </div>
      );

    case 'multiselect':
      return (
        <select
          multiple
          value={filter.value || []}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions, option => option.value);
            updateValue(filter.id, selected);
          }}
          className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-body-sm focus-ring h-32"
        >
          {tagOptions.map(tag => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>
      );

    case 'daterange':
      return (
        <div className="flex gap-2">
          <input
            type="date"
            value={filter.value?.start || ''}
            onChange={(e) => updateValue(filter.id, { ...filter.value, start: e.target.value })}
            className="flex-1 px-3 py-2 border border-border rounded-lg text-body-sm focus-ring"
          />
          <span className="text-text-secondary self-center">-</span>
          <input
            type="date"
            value={filter.value?.end || ''}
            onChange={(e) => updateValue(filter.id, { ...filter.value, end: e.target.value })}
            className="flex-1 px-3 py-2 border border-border rounded-lg text-body-sm focus-ring"
          />
        </div>
      );

    default:
      return null;
  }
}

// 获取维度描述
function getDimensionDescription(type) {
  const descriptions = {
    select: '选择一个选项',
    range: '设置数值范围',
    boolean: '是/否选择',
    multiselect: '选择多个选项',
    daterange: '选择日期范围',
  };
  return descriptions[type] || '';
}
