import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trash2, 
  AlertTriangle, 
  Copy, 
  Clock, 
  TrendingDown, 
  Archive,
  RotateCcw,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import useStarsStore from '../store';
import { useAuthStore } from '../store';
import { 
  generateCleanupSuggestions,
  archiveRepos,
  restoreArchivedRepos,
  getArchivedRepos
} from '../services/cleanup.service';
import { 
  updateRepoMetadata, 
  batchUpdateMetadata,
  saveMetadataToGist
} from '../services/metadata.service';
import HealthBadge from '../components/common/HealthBadge';

export default function CleanupPage() {
  const navigate = useNavigate();
  const { stars, metadata, setMetadata } = useStarsStore();
  const { accessToken, gistId } = useAuthStore();
  
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('abandoned'); // abandoned | similar | lowEngagement | archived
  const [selectedRepos, setSelectedRepos] = useState(new Set());
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    if (stars.length > 0) {
      analyzeStars();
    }
  }, [stars, metadata]);

  const analyzeStars = () => {
    setLoading(true);
    try {
      const result = generateCleanupSuggestions(stars, metadata);
      setAnalysis(result);
    } catch (error) {
      console.error('分析失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRepo = (repoId) => {
    const newSelected = new Set(selectedRepos);
    if (newSelected.has(repoId)) {
      newSelected.delete(repoId);
    } else {
      newSelected.add(repoId);
    }
    setSelectedRepos(newSelected);
  };

  const handleSelectAll = (repos) => {
    const repoIds = repos.map(r => r.id);
    const allSelected = repoIds.every(id => selectedRepos.has(id));
    
    const newSelected = new Set(selectedRepos);
    if (allSelected) {
      repoIds.forEach(id => newSelected.delete(id));
    } else {
      repoIds.forEach(id => newSelected.add(id));
    }
    setSelectedRepos(newSelected);
  };

  const handleArchiveSelected = async () => {
    if (selectedRepos.size === 0) return;
    
    if (!confirm(`确定要归档 ${selectedRepos.size} 个项目吗？归档后 30 天内可恢复。`)) {
      return;
    }

    setArchiving(true);
    try {
      const updatedMetadata = archiveRepos(Array.from(selectedRepos), metadata);
      await saveMetadataToGist(accessToken, gistId, updatedMetadata);
      setMetadata(updatedMetadata);
      setSelectedRepos(new Set());
      analyzeStars(); // 重新分析
      setActiveTab('archived'); // 切换到归档标签页
    } catch (error) {
      console.error('归档失败:', error);
      alert('归档失败，请重试');
    } finally {
      setArchiving(false);
    }
  };

  const handleRestoreSelected = async () => {
    if (selectedRepos.size === 0) return;

    setArchiving(true);
    try {
      const updatedMetadata = restoreArchivedRepos(Array.from(selectedRepos), metadata);
      await saveMetadataToGist(accessToken, gistId, updatedMetadata);
      setMetadata(updatedMetadata);
      setSelectedRepos(new Set());
      analyzeStars(); // 重新分析
    } catch (error) {
      console.error('恢复失败:', error);
      alert('恢复失败，请重试');
    } finally {
      setArchiving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">正在分析你的 Stars...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <p className="text-gray-600">分析失败，请刷新重试</p>
        </div>
      </div>
    );
  }

  const archivedRepos = getArchivedRepos(stars, metadata);

  const tabs = [
    { id: 'abandoned', label: '废弃项目', count: analysis.categories.abandoned.length, icon: TrendingDown, color: 'red' },
    { id: 'similar', label: '相似项目', count: analysis.categories.similar.length, icon: Copy, color: 'yellow' },
    { id: 'lowEngagement', label: '低交互', count: analysis.categories.lowEngagement.length, icon: Clock, color: 'gray' },
    { id: 'archived', label: '已归档', count: archivedRepos.length, icon: Archive, color: 'blue' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            返回 Dashboard
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Trash2 className="w-8 h-8 text-primary-600" />
            智能清理建议
          </h1>
          
          {/* Summary */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-700">{analysis.summary.abandonedCount}</div>
              <div className="text-sm text-red-600">废弃项目</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-700">{analysis.summary.similarGroupsCount}</div>
              <div className="text-sm text-yellow-600">相似项目组</div>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-700">{analysis.summary.lowEngagementCount}</div>
              <div className="text-sm text-gray-600">低交互项目</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-700">{analysis.summary.cleanupPercentage}%</div>
              <div className="text-sm text-green-600">可优化比例</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-1 py-4 border-b-2 font-medium text-sm transition-colors
                    ${isActive
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`
                      px-2 py-0.5 text-xs rounded-full
                      ${isActive ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'}
                    `}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Bar */}
        {selectedRepos.size > 0 && (
          <div className="mb-6 bg-primary-50 border border-primary-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-primary-600" />
              <span className="text-primary-900 font-medium">
                已选择 {selectedRepos.size} 个项目
              </span>
            </div>
            <div className="flex gap-2">
              {activeTab === 'archived' ? (
                <button
                  onClick={handleRestoreSelected}
                  disabled={archiving}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  {archiving ? '恢复中...' : '恢复选中项'}
                </button>
              ) : (
                <button
                  onClick={handleArchiveSelected}
                  disabled={archiving}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Archive className="w-4 h-4" />
                  {archiving ? '归档中...' : '归档选中项'}
                </button>
              )}
              <button
                onClick={() => setSelectedRepos(new Set())}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
              >
                取消选择
              </button>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'abandoned' && (
          <AbandonedReposView
            repos={analysis.categories.abandoned}
            metadata={metadata}
            selectedRepos={selectedRepos}
            onSelect={handleSelectRepo}
            onSelectAll={handleSelectAll}
          />
        )}

        {activeTab === 'similar' && (
          <SimilarReposView
            groups={analysis.categories.similar}
            metadata={metadata}
            selectedRepos={selectedRepos}
            onSelect={handleSelectRepo}
            onSelectAll={handleSelectAll}
          />
        )}

        {activeTab === 'lowEngagement' && (
          <LowEngagementReposView
            repos={analysis.categories.lowEngagement}
            metadata={metadata}
            selectedRepos={selectedRepos}
            onSelect={handleSelectRepo}
            onSelectAll={handleSelectAll}
          />
        )}

        {activeTab === 'archived' && (
          <ArchivedReposView
            repos={archivedRepos}
            metadata={metadata}
            selectedRepos={selectedRepos}
            onSelect={handleSelectRepo}
            onSelectAll={handleSelectAll}
          />
        )}
      </div>
    </div>
  );
}

// Abandoned Repos View
function AbandonedReposView({ repos, metadata, selectedRepos, onSelect, onSelectAll }) {
  if (repos.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">太棒了！</h3>
        <p className="text-gray-600">没有发现废弃项目</p>
      </div>
    );
  }

  const allSelected = repos.every(r => selectedRepos.has(r.id));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          发现 {repos.length} 个废弃项目
        </h2>
        <button
          onClick={() => onSelectAll(repos)}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          {allSelected ? '取消全选' : '全选'}
        </button>
      </div>

      {repos.map(repo => {
        const healthScore = metadata[repo.id]?.healthScore;
        const isSelected = selectedRepos.has(repo.id);

        return (
          <div
            key={repo.id}
            className={`
              bg-white rounded-lg border-2 p-4 transition-all cursor-pointer
              ${isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}
            `}
            onClick={() => onSelect(repo.id)}
          >
            <div className="flex items-start gap-4">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelect(repo.id)}
                className="mt-1 w-5 h-5 text-primary-600 rounded"
                onClick={(e) => e.stopPropagation()}
              />
              
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <a 
                        href={repo.htmlUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-primary-600"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {repo.fullName}
                      </a>
                      {repo.archived && (
                        <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">已归档</span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{repo.description || '无描述'}</p>
                  </div>
                  {healthScore && <HealthBadge healthScore={healthScore} size="sm" />}
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                  <span>⭐ {repo.stargazersCount.toLocaleString()}</span>
                  {repo.language && <span className="px-2 py-0.5 bg-gray-100 rounded">{repo.language}</span>}
                  <span>{repo.daysSinceUpdate} 天未更新</span>
                </div>

                <div className={`
                  flex items-start gap-2 p-3 rounded-lg
                  ${repo.severity === 'high' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}
                `}>
                  <AlertTriangle className={`w-4 h-4 mt-0.5 ${repo.severity === 'high' ? 'text-red-600' : 'text-yellow-600'}`} />
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${repo.severity === 'high' ? 'text-red-900' : 'text-yellow-900'}`}>
                      {repo.reason}
                    </div>
                    <div className={`text-sm mt-1 ${repo.severity === 'high' ? 'text-red-700' : 'text-yellow-700'}`}>
                      {repo.recommendation}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Similar Repos View
function SimilarReposView({ groups, metadata, selectedRepos, onSelect, onSelectAll }) {
  if (groups.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">很好！</h3>
        <p className="text-gray-600">没有发现重复的相似项目</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">
        发现 {groups.length} 组相似项目
      </h2>

      {groups.map(group => {
        const duplicates = group.repos.slice(1); // 除了推荐的，其他都是重复的
        const allSelected = duplicates.every(r => selectedRepos.has(r.id));

        return (
          <div key={group.id} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Copy className="w-5 h-5 text-yellow-600" />
                  相似度 {group.avgSimilarity}% - {group.repos.length} 个项目
                </h3>
                <p className="text-sm text-gray-600 mt-1">{group.reason}</p>
              </div>
              <button
                onClick={() => onSelectAll(duplicates)}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                {allSelected ? '取消选择重复项' : '选择所有重复项'}
              </button>
            </div>

            <div className="space-y-3">
              {group.repos.map((repo, index) => {
                const isRecommended = index === 0;
                const isSelected = selectedRepos.has(repo.id);
                const healthScore = metadata[repo.id]?.healthScore;

                return (
                  <div
                    key={repo.id}
                    className={`
                      rounded-lg border-2 p-4 transition-all
                      ${isRecommended
                        ? 'border-green-300 bg-green-50'
                        : isSelected
                          ? 'border-primary-500 bg-primary-50 cursor-pointer'
                          : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                      }
                    `}
                    onClick={() => !isRecommended && onSelect(repo.id)}
                  >
                    <div className="flex items-start gap-4">
                      {!isRecommended && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onSelect(repo.id)}
                          className="mt-1 w-5 h-5 text-primary-600 rounded"
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900 flex items-center gap-2">
                              <a 
                                href={repo.htmlUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="hover:text-primary-600"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {repo.fullName}
                              </a>
                              {isRecommended && (
                                <span className="px-2 py-0.5 text-xs bg-green-600 text-white rounded flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" />
                                  推荐保留
                                </span>
                              )}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">{repo.description || '无描述'}</p>
                          </div>
                          {healthScore && <HealthBadge healthScore={healthScore} size="sm" />}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                          <span>⭐ {repo.stargazersCount.toLocaleString()}</span>
                          {repo.language && <span className="px-2 py-0.5 bg-gray-100 rounded">{repo.language}</span>}
                          {!isRecommended && repo.similarityScore && (
                            <span className="text-yellow-600">相似度 {repo.similarityScore}%</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Low Engagement Repos View
function LowEngagementReposView({ repos, metadata, selectedRepos, onSelect, onSelectAll }) {
  if (repos.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">做得很好！</h3>
        <p className="text-gray-600">所有项目都有良好的管理和互动</p>
      </div>
    );
  }

  const allSelected = repos.every(r => selectedRepos.has(r.id));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          发现 {repos.length} 个低交互项目
        </h2>
        <button
          onClick={() => onSelectAll(repos)}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          {allSelected ? '取消全选' : '全选'}
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-900">
            <div className="font-medium">建议：先添加标签整理</div>
            <div className="mt-1 text-blue-700">
              这些项目可能仍有价值，建议先添加标签分类，如果确实不需要再考虑归档
            </div>
          </div>
        </div>
      </div>

      {repos.map(repo => {
        const isSelected = selectedRepos.has(repo.id);

        return (
          <div
            key={repo.id}
            className={`
              bg-white rounded-lg border-2 p-4 transition-all cursor-pointer
              ${isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}
            `}
            onClick={() => onSelect(repo.id)}
          >
            <div className="flex items-start gap-4">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelect(repo.id)}
                className="mt-1 w-5 h-5 text-primary-600 rounded"
                onClick={(e) => e.stopPropagation()}
              />
              
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  <a 
                    href={repo.htmlUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-primary-600"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {repo.fullName}
                  </a>
                </h3>
                <p className="text-sm text-gray-600 mb-3">{repo.description || '无描述'}</p>

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                  <span>⭐ {repo.stargazersCount.toLocaleString()}</span>
                  {repo.language && <span className="px-2 py-0.5 bg-gray-100 rounded">{repo.language}</span>}
                  <span>{repo.daysSinceStarred} 天前收藏</span>
                </div>

                <div className="flex items-start gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <Clock className="w-4 h-4 text-gray-600 mt-0.5" />
                  <div className="flex-1 text-sm text-gray-700">
                    {repo.reason}
                    <div className="mt-1 text-gray-600">{repo.recommendation}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Archived Repos View
function ArchivedReposView({ repos, metadata, selectedRepos, onSelect, onSelectAll }) {
  if (repos.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <Archive className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无归档项目</h3>
        <p className="text-gray-600">归档的项目将在这里显示，30天后自动永久删除</p>
      </div>
    );
  }

  const allSelected = repos.every(r => selectedRepos.has(r.id));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          {repos.length} 个已归档项目
        </h2>
        <button
          onClick={() => onSelectAll(repos)}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          {allSelected ? '取消全选' : '全选'}
        </button>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div className="text-sm text-yellow-900">
            <div className="font-medium">归档说明</div>
            <div className="mt-1 text-yellow-700">
              归档的项目将在 30 天后永久删除，期间您可以随时恢复
            </div>
          </div>
        </div>
      </div>

      {repos.map(repo => {
        const isSelected = selectedRepos.has(repo.id);

        return (
          <div
            key={repo.id}
            className={`
              bg-white rounded-lg border-2 p-4 transition-all cursor-pointer
              ${isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}
            `}
            onClick={() => onSelect(repo.id)}
          >
            <div className="flex items-start gap-4">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelect(repo.id)}
                className="mt-1 w-5 h-5 text-primary-600 rounded"
                onClick={(e) => e.stopPropagation()}
              />
              
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      <a 
                        href={repo.htmlUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-primary-600"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {repo.fullName}
                      </a>
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{repo.description || '无描述'}</p>
                  </div>
                  {repo.canRestore ? (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {repo.daysRemaining} 天后删除
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                      即将删除
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>⭐ {repo.stargazersCount.toLocaleString()}</span>
                  {repo.language && <span className="px-2 py-0.5 bg-gray-100 rounded">{repo.language}</span>}
                  <span>归档于 {new Date(repo.archivedAt).toLocaleDateString('zh-CN')}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
