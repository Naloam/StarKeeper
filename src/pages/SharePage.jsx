import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, AlertCircle, Star, GitFork, ExternalLink, Tag } from "lucide-react";
import { getPublicGist } from "../services/github.service";
import { useAuthStore } from "../store";
import TagBadge from "../components/tags/TagBadge";

/**
 * 公开分享页面
 * 展示其他用户分享的 Stars Collection
 */
export default function SharePage() {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shareData, setShareData] = useState(null);
  const [filteredStars, setFilteredStars] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadShareData();
  }, [shareId]);

  useEffect(() => {
    if (shareData) {
      applyFilters();
    }
  }, [shareData, selectedTags, searchQuery]);

  const loadShareData = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("🔍 加载分享数据，ShareId:", shareId);

      // 尝试获取当前用户的 token（如果已登录）
      // 使用 token 可以避免 API 速率限制
      console.log("🔑 用户登录状态:", accessToken ? "已登录" : "未登录");

      // 从 Gist 加载分享数据（传入 token 避免速率限制）
      const gist = await getPublicGist(shareId, accessToken);

      console.log("📦 获取到的 Gist:", gist);

      if (!gist || !gist.files["starkeeper-metadata.json"]) {
        console.error("❌ Gist 中找不到 starkeeper-metadata.json 文件");
        setError("找不到该分享的 Collection");
        return;
      }

      const content = JSON.parse(gist.files["starkeeper-metadata.json"].content);

      console.log("📄 Gist 内容:", content);
      console.log("🔧 ShareConfig:", content.shareConfig);
      console.log("📊 SharedStars 数量:", content.sharedStars?.length || 0);

      // 检查是否公开
      if (!content.shareConfig?.isPublic) {
        console.error("❌ Collection 未公开");
        setError("该 Collection 未公开分享");
        return;
      }

      // 使用 sharedStars 字段（保存完整的仓库列表）
      const shareData = {
        shareConfig: content.shareConfig,
        metadata: content.repositories || {},
        stars: content.sharedStars || [],
      };

      console.log("✅ 分享数据加载成功:", shareData);
      setShareData(shareData);
    } catch (err) {
      console.error("❌ 加载分享数据失败:", err);
      setError("加载分享数据失败: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = shareData.stars || [];

    // 按标签筛选
    if (selectedTags.length > 0) {
      filtered = filtered.filter((star) => {
        const metadata = shareData.metadata[star.id];
        if (!metadata || !metadata.tags) return false;
        return selectedTags.some((tag) => metadata.tags.includes(tag));
      });
    }

    // 按关键词搜索
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (star) =>
          star.name.toLowerCase().includes(query) ||
          star.fullName.toLowerCase().includes(query) ||
          (star.description && star.description.toLowerCase().includes(query)),
      );
    }

    setFilteredStars(filtered);
  };

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const getAllTags = () => {
    if (!shareData) return [];
    const tags = new Set();
    Object.values(shareData.metadata || {}).forEach((m) => {
      m.tags?.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            无法加载 Collection
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const allTags = getAllTags();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-surface-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {shareData?.shareConfig?.shareTitle || "Stars Collection"}
              </h1>
              {shareData?.shareConfig?.shareDescription && (
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {shareData.shareConfig.shareDescription}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span>{filteredStars.length} 个项目</span>
                {allTags.length > 0 && <span>{allTags.length} 个标签</span>}
              </div>
            </div>
            <button
              onClick={() => window.open("/", "_blank")}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <span>创建我的 Collection</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-surface-card rounded-lg border border-border p-4 sticky top-8">
              {/* 搜索 */}
              <div className="mb-6">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索项目..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>

              {/* 标签筛选 */}
              {allTags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    按标签筛选
                  </h3>
                  <div className="space-y-2">
                    {allTags.map((tag) => {
                      const metadata = Object.values(shareData.metadata || {}).find((m) =>
                        m.tags?.includes(tag),
                      );
                      const color = metadata?.color || "#3B82F6";
                      const isSelected = selectedTags.includes(tag);

                      return (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                            isSelected
                              ? "bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500"
                              : "bg-gray-50 dark:bg-gray-700 border-2 border-transparent hover:border-gray-300"
                          }`}
                        >
                          <TagBadge tag={tag} color={color} size="sm" />
                        </button>
                      );
                    })}
                  </div>
                  {selectedTags.length > 0 && (
                    <button
                      onClick={() => setSelectedTags([])}
                      className="w-full mt-3 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      清除筛选
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {filteredStars.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  {searchQuery || selectedTags.length > 0
                    ? "没有匹配的项目"
                    : "该 Collection 还没有项目"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStars.map((star) => {
                  const metadata = shareData.metadata[star.id] || {};
                  const tags = metadata.tags || [];
                  const color = metadata.color || "#3B82F6";

                  return (
                    <div
                      key={star.id}
                      className="bg-surface-card rounded-lg border border-border p-6 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 mb-1">
                            <a href={star.htmlUrl} target="_blank" rel="noopener noreferrer">
                              {star.name}
                            </a>
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            @{star.owner.login}
                          </p>
                        </div>
                        {star.language && (
                          <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                            {star.language}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {star.description || "暂无描述"}
                      </p>

                      {/* 标签 */}
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {tags.map((tag) => (
                            <TagBadge key={tag} tag={tag} color={color} size="sm" />
                          ))}
                        </div>
                      )}

                      {/* 笔记 */}
                      {metadata.notes && (
                        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                            "{metadata.notes}"
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Star className="w-4 h-4" />
                            {star.stargazersCount.toLocaleString()}
                          </span>
                          {star.forksCount > 0 && (
                            <span className="flex items-center gap-1">
                              <GitFork className="w-4 h-4" />
                              {star.forksCount.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <a
                          href={star.htmlUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Powered by <span className="font-semibold text-blue-600">StarKeeper</span>
          </p>
        </div>
      </div>
    </div>
  );
}
