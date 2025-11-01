import { Star, GitFork, Clock, TrendingUp, CheckCircle, ExternalLink, Info } from 'lucide-react';
import HealthBadge from './HealthBadge';

/**
 * 相似项目组展示卡片
 * @param {Object} props
 * @param {Array} props.group - 相似项目组
 * @param {Function} props.onSelectRepo - 选择项目回调
 * @param {Set} props.selectedRepos - 已选择的项目 ID 集合
 * @param {Object} props.metadata - 项目元数据
 */
export default function SimilarReposCard({ group, onSelectRepo, selectedRepos, metadata }) {
  const { repos, averageSimilarity, recommendation } = group;
  
  // 排序：推荐的在最前面
  const sortedRepos = [...repos].sort((a, b) => {
    if (a.id === recommendation.repoId) return -1;
    if (b.id === recommendation.repoId) return 1;
    return 0;
  });
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      {/* 头部 - 相似度信息 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">
              {repos.length} 个相似项目
            </span>
          </div>
          <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-50 rounded-full">
            <TrendingUp className="w-4 h-4 text-yellow-600" />
            <span className="text-xs font-medium text-yellow-700">
              相似度: {(averageSimilarity * 100).toFixed(0)}%
            </span>
          </div>
        </div>
        
        {/* 推荐标签 */}
        <div className="flex items-center space-x-1 px-3 py-1 bg-green-50 rounded-full">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-xs font-medium text-green-700">推荐保留 1 个</span>
        </div>
      </div>
      
      {/* 项目列表 */}
      <div className="space-y-3">
        {sortedRepos.map((repo, index) => {
          const isRecommended = repo.id === recommendation.repoId;
          const isSelected = selectedRepos.has(repo.id);
          const healthScore = metadata[repo.id]?.healthScore;
          
          return (
            <div
              key={repo.id}
              className={`relative p-4 rounded-lg border-2 transition-all ${
                isRecommended
                  ? 'border-green-300 bg-green-50'
                  : isSelected
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-200 hover:border-gray-300 bg-gray-50'
              }`}
            >
              {/* 推荐徽章 */}
              {isRecommended && (
                <div className="absolute -top-2 -right-2 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center space-x-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>推荐</span>
                </div>
              )}
              
              <div className="flex items-start justify-between">
                {/* 项目信息 */}
                <div className="flex-1 mr-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <a
                      href={repo.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-gray-900 hover:text-primary-600 flex items-center space-x-1"
                    >
                      <span>{repo.fullName}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    
                    {repo.language && (
                      <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                        {repo.language}
                      </span>
                    )}
                    
                    {healthScore && (
                      <HealthBadge healthScore={healthScore} size="sm" />
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {repo.description || '暂无描述'}
                  </p>
                  
                  {/* 指标 */}
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{repo.stargazersCount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <GitFork className="w-4 h-4" />
                      <span>{repo.forksCount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(repo.updatedAt).toLocaleDateString('zh-CN')}</span>
                    </div>
                  </div>
                  
                  {/* 推荐理由 */}
                  {isRecommended && recommendation.reasons.length > 0 && (
                    <div className="mt-3 flex items-start space-x-2 p-2 bg-green-100 rounded">
                      <Info className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-green-800">
                        <span className="font-medium">推荐理由：</span>
                        {recommendation.reasons.join('、')}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* 操作按钮 */}
                <div className="flex flex-col items-end space-y-2">
                  {!isRecommended && (
                    <button
                      onClick={() => onSelectRepo(repo.id)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        isSelected
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {isSelected ? '已选择移除' : '选择移除'}
                    </button>
                  )}
                  
                  {isRecommended && (
                    <div className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg">
                      建议保留
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* 底部建议 */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          <span className="font-medium">💡 去重建议：</span>
          这 {repos.length} 个项目功能相似，建议保留 
          <span className="font-bold text-blue-900 mx-1">{recommendation.repoName}</span>
          ，其他 {repos.length - 1} 个可以考虑移除。
        </p>
      </div>
    </div>
  );
}
