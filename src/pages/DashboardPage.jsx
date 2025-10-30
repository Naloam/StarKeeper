import { useEffect, useState } from 'react';
import { Loader2, RefreshCw, Sparkles } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import { useAuthStore, useStarsStore, useUIStore } from '../store';
import { getAllStarredRepos } from '../services/github.service';
import TagModal from '../components/tags/TagModal';
import TagBadge from '../components/tags/TagBadge';
import { 
  findOrCreateMetadataGist, 
  loadMetadataFromGist,
  updateRepoMetadata as saveRepoMetadataToGist,
  convertGistToStoreFormat
} from '../services/metadata.service';

export default function DashboardPage() {
  const { accessToken, gistId, setGistId } = useAuthStore();
  const { stars, filteredStars, setStars, setLoading, loading, updateRepoMetadata, metadata, getAllTags, setMetadata } = useStarsStore();
  const [progress, setProgress] = useState({ current: 0, hasMore: false });
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [showTagModal, setShowTagModal] = useState(false);

  useEffect(() => {
    if (accessToken && stars.length === 0) {
      loadStars();
    }
  }, [accessToken]);

  // 加载元数据
  useEffect(() => {
    if (accessToken && !gistId) {
      initializeMetadata();
    } else if (accessToken && gistId) {
      loadMetadata();
    }
  }, [accessToken, gistId]);

  const initializeMetadata = async () => {
    try {
      const id = await findOrCreateMetadataGist(accessToken);
      setGistId(id);
      console.log('✅ Gist ID 已初始化:', id);
    } catch (error) {
      console.error('初始化元数据失败:', error);
    }
  };

  const loadMetadata = async () => {
    try {
      const gistMetadata = await loadMetadataFromGist(accessToken, gistId);
      const storeMetadata = convertGistToStoreFormat(gistMetadata);
      setMetadata(storeMetadata);
      console.log('✅ 元数据已加载，共', Object.keys(storeMetadata).length, '个仓库');
    } catch (error) {
      console.error('加载元数据失败:', error);
    }
  };

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

  const handleOpenTagModal = (repo) => {
    setSelectedRepo(repo);
    setShowTagModal(true);
  };

  const handleSaveTag = async (data) => {
    // 更新本地状态
    updateRepoMetadata(data.repoId, {
      tags: data.tags,
      notes: data.notes,
      color: data.color,
    });

    // 保存到 Gist
    if (gistId) {
      try {
        await saveRepoMetadataToGist(accessToken, gistId, data.repoId, {
          tags: data.tags,
          notes: data.notes,
          color: data.color,
        });
        console.log('✅ 标签已保存到 Gist');
      } catch (error) {
        console.error('保存到 Gist 失败:', error);
        alert('保存失败：' + error.message);
      }
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
        <StarsList stars={filteredStars} onOpenTagModal={handleOpenTagModal} />

        {/* Tag Modal */}
        <TagModal
          isOpen={showTagModal}
          onClose={() => setShowTagModal(false)}
          repo={selectedRepo}
          currentTags={metadata[selectedRepo?.id]?.tags || []}
          currentNotes={metadata[selectedRepo?.id]?.notes || ''}
          currentColor={metadata[selectedRepo?.id]?.color || '#3B82F6'}
          allTags={getAllTags()}
          onSave={handleSaveTag}
        />
      </div>
    </MainLayout>
  );
}

function StarsList({ stars, onOpenTagModal }) {
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
          <StarCard key={star.id} star={star} onOpenTagModal={onOpenTagModal} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {stars.map((star) => (
        <StarListItem key={star.id} star={star} onOpenTagModal={onOpenTagModal} />
      ))}
    </div>
  );
}

function StarCard({ star, onOpenTagModal }) {
  const { metadata } = useStarsStore();
  const repoMeta = metadata[star.id] || {};
  const tags = repoMeta.tags || [];
  const color = repoMeta.color || '#3B82F6';
  
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

      {/* 标签显示 */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {tags.slice(0, 3).map((tag) => (
            <TagBadge key={tag} tag={tag} color={color} size="sm" />
          ))}
          {tags.length > 3 && (
            <span className="px-2 py-0.5 text-xs text-gray-500">
              +{tags.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <span>⭐ {star.stargazersCount.toLocaleString()}</span>
          {star.forksCount > 0 && (
            <span>🔀 {star.forksCount.toLocaleString()}</span>
          )}
        </div>
        <button
          onClick={() => onOpenTagModal(star)}
          className="text-primary-600 hover:text-primary-700 text-xs font-medium"
        >
          {tags.length > 0 ? '编辑标签' : '添加标签'}
        </button>
      </div>
    </div>
  );
}

function StarListItem({ star, onOpenTagModal }) {
  const { metadata } = useStarsStore();
  const repoMeta = metadata[star.id] || {};
  const tags = repoMeta.tags || [];
  const color = repoMeta.color || '#3B82F6';
  
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
          
          {/* 标签显示 */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag) => (
                <TagBadge key={tag} tag={tag} color={color} size="sm" />
              ))}
            </div>
          )}
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>⭐ {star.stargazersCount.toLocaleString()}</span>
            <span>🔀 {star.forksCount.toLocaleString()}</span>
            <span>更新于 {new Date(star.updatedAt).toLocaleDateString('zh-CN')}</span>
          </div>
        </div>
        <button
          onClick={() => onOpenTagModal(star)}
          className="ml-4 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
        >
          {tags.length > 0 ? '编辑' : '添加标签'}
        </button>
      </div>
    </div>
  );
}
