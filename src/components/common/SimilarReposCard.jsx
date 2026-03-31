import { Star, GitFork, Clock, TrendingUp, CheckCircle, ExternalLink, Info } from "lucide-react";
import HealthBadge from "./HealthBadge";

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
    <div className="bg-surface-card rounded-lg border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
      {/* 头部 - 相似度信息 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-warning rounded-full"></div>
            <span className="text-sm font-medium text-text-primary">{repos.length} 个相似项目</span>
          </div>
          <div className="flex items-center space-x-1 px-2 py-1 bg-warning-light rounded-full">
            <TrendingUp className="w-4 h-4 text-warning-text" />
            <span className="text-xs font-medium text-warning-text">
              相似度: {(averageSimilarity * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* 推荐标签 */}
        <div className="flex items-center space-x-1 px-3 py-1 bg-success-light rounded-full">
          <CheckCircle className="w-4 h-4 text-success-text" />
          <span className="text-xs font-medium text-success-text">推荐保留 1 个</span>
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
                  ? "border-success bg-success-light"
                  : isSelected
                    ? "border-danger bg-danger-light"
                    : "border-border hover:border-text-secondary bg-surface-darker"
              }`}
            >
              {/* 推荐徽章 */}
              {isRecommended && (
                <div className="absolute -top-2 -right-2 px-2 py-1 bg-success text-white text-xs font-bold rounded-full shadow-lg flex items-center space-x-1">
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
                      className="font-semibold text-text-primary hover:text-primary flex items-center space-x-1"
                    >
                      <span>{repo.fullName}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    {repo.language && (
                      <span className="px-2 py-0.5 text-xs bg-info-light text-info-text rounded">
                        {repo.language}
                      </span>
                    )}

                    {healthScore && <HealthBadge healthScore={healthScore} size="sm" />}
                  </div>

                  <p className="text-sm text-text-secondary mb-3 line-clamp-2">
                    {repo.description || "暂无描述"}
                  </p>

                  {/* 指标 */}
                  <div className="flex items-center space-x-4 text-sm text-text-muted">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 fill-warning text-warning" />
                      <span>{repo.stargazersCount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <GitFork className="w-4 h-4" />
                      <span>{repo.forksCount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(repo.updatedAt).toLocaleDateString("zh-CN")}</span>
                    </div>
                  </div>

                  {/* 推荐理由 */}
                  {isRecommended && recommendation.reasons.length > 0 && (
                    <div className="mt-3 flex items-start space-x-2 p-2 bg-success-light rounded">
                      <Info className="w-4 h-4 text-success-text mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-success-text">
                        <span className="font-medium">推荐理由：</span>
                        {recommendation.reasons.join("、")}
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
                          ? "bg-danger text-white hover:bg-danger-text"
                          : "bg-surface-darker text-text-primary hover:bg-border"
                      }`}
                    >
                      {isSelected ? "已选择移除" : "选择移除"}
                    </button>
                  )}

                  {isRecommended && (
                    <div className="px-3 py-1.5 text-sm bg-success text-white rounded-lg">
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
      <div className="mt-4 p-3 bg-info-light rounded-lg border border-info-light">
        <p className="text-sm text-info-text">
          <span className="font-medium">💡 去重建议：</span>这 {repos.length}{" "}
          个项目功能相似，建议保留
          <span className="font-bold text-info-text mx-1">{recommendation.repoName}</span>
          ，其他 {repos.length - 1} 个可以考虑移除。
        </p>
      </div>
    </div>
  );
}
