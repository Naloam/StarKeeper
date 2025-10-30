import { useEffect, useState } from 'react';
import { Loader2, RefreshCw, Sparkles } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import { useAuthStore, useStarsStore, useUIStore } from '../store';
import { getAllStarredRepos } from '../services/github.service';

export default function DashboardPage() {
  const { accessToken } = useAuthStore();
  const { stars, filteredStars, setStars, setLoading, loading } = useStarsStore();
  const [progress, setProgress] = useState({ current: 0, hasMore: false });

  useEffect(() => {
    if (accessToken && stars.length === 0) {
      loadStars();
    }
  }, [accessToken]);

  const loadStars = async () => {
    setLoading(true);
    try {
      const repos = await getAllStarredRepos(accessToken, setProgress);
      setStars(repos);
    } catch (error) {
      console.error('加载 stars 失败:', error);
      alert('加载失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              正在加载你的 Stars...
            </h2>
            {progress.current > 0 && (
              <p className="text-gray-600">
                已加载 {progress.current} 个项目
                {progress.hasMore && '...'}
              </p>
            )}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (stars.length === 0) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center max-w-md">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              还没有 Star 任何项目
            </h2>
            <p className="text-gray-600 mb-6">
              去 GitHub 上 star 一些有趣的项目吧！
            </p>
            <button
              onClick={loadStars}
              className="inline-flex items-center space-x-2 bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>刷新</span>
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6">
        {/* Toolbar */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              我的 Stars
            </h2>
            <p className="text-gray-600">
              共 {stars.length} 个项目 · 显示 {filteredStars.length} 个
            </p>
          </div>
          <button
            onClick={loadStars}
            disabled={loading}
            className="inline-flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>刷新</span>
          </button>
        </div>

        {/* Stars Grid/List */}
        <StarsList stars={filteredStars} />
      </div>
    </MainLayout>
  );
}

function StarsList({ stars }) {
  const { viewMode } = useUIStore();

  if (stars.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">没有匹配的项目</p>
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stars.map((star) => (
          <StarCard key={star.id} star={star} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {stars.map((star) => (
        <StarListItem key={star.id} star={star} />
      ))}
    </div>
  );
}

function StarCard({ star }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 hover:text-primary-600 mb-1">
            <a href={star.htmlUrl} target="_blank" rel="noopener noreferrer">
              {star.name}
            </a>
          </h3>
          <p className="text-sm text-gray-500">@{star.owner.login}</p>
        </div>
        {star.language && (
          <span className="px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded">
            {star.language}
          </span>
        )}
      </div>

      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {star.description || '暂无描述'}
      </p>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <span>⭐ {star.stargazersCount.toLocaleString()}</span>
          {star.forksCount > 0 && (
            <span>🔀 {star.forksCount.toLocaleString()}</span>
          )}
        </div>
        <span className="text-xs">
          {new Date(star.updatedAt).toLocaleDateString('zh-CN')}
        </span>
      </div>
    </div>
  );
}

function StarListItem({ star }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="font-semibold text-gray-900 hover:text-primary-600">
              <a href={star.htmlUrl} target="_blank" rel="noopener noreferrer">
                {star.fullName}
              </a>
            </h3>
            {star.language && (
              <span className="px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded">
                {star.language}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-2">
            {star.description || '暂无描述'}
          </p>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>⭐ {star.stargazersCount.toLocaleString()}</span>
            <span>🔀 {star.forksCount.toLocaleString()}</span>
            <span>更新于 {new Date(star.updatedAt).toLocaleDateString('zh-CN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
