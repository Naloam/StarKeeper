import { useEffect, useState } from 'react';
import { Loader2, RefreshCw, Sparkles, Download, Share2 } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import { useAuthStore, useStarsStore, useUIStore } from '../store';
import { getAllStarredRepos, getRepoReadme } from '../services/github.service';
import { generateSummary } from '../services/dashscope.service';
import TagModal from '../components/tags/TagModal';
import TagBadge from '../components/tags/TagBadge';
import AISummary from '../components/common/AISummary';
import ExportModal from '../components/common/ExportModal';
import ShareModal from '../components/common/ShareModal';
import { 
  findOrCreateMetadataGist, 
  loadMetadataFromGist,
  updateRepoMetadata as saveRepoMetadataToGist,
  convertGistToStoreFormat,
  updateShareConfig
} from '../services/metadata.service';

export default function DashboardPage() {
  const { accessToken, gistId, setGistId } = useAuthStore();
  const { stars, filteredStars, setStars, setLoading, loading, updateRepoMetadata, metadata, getAllTags, setMetadata } = useStarsStore();
  const [progress, setProgress] = useState({ current: 0, hasMore: false });
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareConfig, setShareConfig] = useState(null);
  const [generatingSummary, setGeneratingSummary] = useState({});

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
      
      // 加载分享配置
      if (gistMetadata.shareConfig) {
        setShareConfig(gistMetadata.shareConfig);
      }
      
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
    console.log('💾 保存标签数据:', data);
    console.log('📊 当前 metadata 状态:', metadata);
    console.log('🔑 repoId:', data.repoId, 'type:', typeof data.repoId);
    
    // 先更新本地状态（立即反馈）
    updateRepoMetadata(data.repoId, {
      tags: data.tags,
      notes: data.notes,
      color: data.color,
    });
    
    // 立即检查更新后的状态
    setTimeout(() => {
      console.log('✨ 更新后的 metadata:', metadata);
      console.log('✨ 该仓库的 metadata:', metadata[data.repoId]);
    }, 100);

    // 保存到 Gist
    if (gistId) {
      try {
        console.log('📤 上传到 Gist:', { gistId, repoId: data.repoId });
        await saveRepoMetadataToGist(accessToken, gistId, data.repoId, {
          tags: data.tags,
          notes: data.notes,
          color: data.color,
        });
        console.log('✅ 标签已保存到 Gist');
        
        // 重新加载元数据确保同步
        const gistMetadata = await loadMetadataFromGist(accessToken, gistId);
        const storeMetadata = convertGistToStoreFormat(gistMetadata);
        setMetadata(storeMetadata);
        console.log('✅ 元数据已重新加载，共', Object.keys(storeMetadata).length, '个仓库');
        console.log('✅ 重新加载后该仓库的 metadata:', storeMetadata[data.repoId]);
      } catch (error) {
        console.error('❌ 保存到 Gist 失败:', error);
        alert('保存失败：' + error.message);
        throw error; // 抛出错误，阻止 Modal 关闭
      }
    } else {
      console.warn('⚠️ gistId 不存在，无法保存到 Gist');
    }
  };

  // 生成 AI 摘要
  const handleGenerateSummary = async (repo) => {
    const repoId = `${repo.owner.login}/${repo.name}`;
    setGeneratingSummary(prev => ({ ...prev, [repoId]: true }));

    try {
      // 获取 README
      const readmeContent = await getRepoReadme(accessToken, repo.owner.login, repo.name);
      
      if (!readmeContent) {
        alert('该项目没有 README 文件');
        return;
      }

      // 调用 AI 生成摘要
      const summary = await generateSummary(readmeContent, repo.name, repo.description);
      
      // 更新本地状态
      updateRepoMetadata(repoId, {
        aiSummary: summary,
      });

      // 保存到 Gist
      if (gistId) {
        await saveRepoMetadataToGist(accessToken, gistId, repoId, {
          aiSummary: summary,
        });
        console.log('✅ AI 摘要已保存到 Gist');
      }
    } catch (error) {
      console.error('生成 AI 摘要失败:', error);
      alert('生成失败：' + error.message);
    } finally {
      setGeneratingSummary(prev => ({ ...prev, [repoId]: false }));
    }
  };

  const handleUpdateShare = async (newShareConfig) => {
    console.log('🔄 开始更新分享配置:', newShareConfig);
    
    try {
      // 传递当前的 stars 数据，以便在分享页面展示
      const shareId = await updateShareConfig(accessToken, gistId, newShareConfig, stars);
      
      console.log('✅ 收到 ShareId:', shareId);
      
      // 更新本地状态
      const updatedConfig = {
        ...newShareConfig,
        shareId,
      };
      
      setShareConfig(updatedConfig);
      console.log('✅ 本地状态已更新:', updatedConfig);
      
      setShowShareModal(false);
      alert('分享设置已更新！');
    } catch (error) {
      console.error('❌ 更新分享配置失败:', error);
      alert('更新失败：' + error.message);
      throw error; // 重新抛出错误，防止 Modal 关闭
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
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowShareModal(true)}
              className="inline-flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>分享</span>
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className="inline-flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>导出</span>
            </button>
            <button
              onClick={loadStars}
              disabled={loading}
              className="inline-flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>刷新</span>
            </button>
          </div>
        </div>

        {/* Stars Grid/List */}
        <StarsList 
          stars={filteredStars} 
          onOpenTagModal={handleOpenTagModal}
          onGenerateSummary={handleGenerateSummary}
          generatingSummary={generatingSummary}
        />

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

        {/* Export Modal */}
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          stars={stars}
          metadata={metadata}
        />

        {/* Share Modal */}
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          shareConfig={shareConfig}
          onUpdateShare={handleUpdateShare}
        />
      </div>
    </MainLayout>
  );
}

function StarsList({ stars, onOpenTagModal, onGenerateSummary, generatingSummary }) {
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
          <StarCard 
            key={star.id} 
            star={star} 
            onOpenTagModal={onOpenTagModal}
            onGenerateSummary={onGenerateSummary}
            isGenerating={generatingSummary[`${star.owner.login}/${star.name}`]}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {stars.map((star) => (
        <StarListItem 
          key={star.id} 
          star={star} 
          onOpenTagModal={onOpenTagModal}
          onGenerateSummary={onGenerateSummary}
          isGenerating={generatingSummary[`${star.owner.login}/${star.name}`]}
        />
      ))}
    </div>
  );
}

function StarCard({ star, onOpenTagModal, onGenerateSummary, isGenerating }) {
  const { metadata } = useStarsStore();
  const repoId = `${star.owner.login}/${star.name}`;
  const repoMeta = metadata[star.id] || {};
  const tags = repoMeta.tags || [];
  const color = repoMeta.color || '#3B82F6';
  const aiSummary = repoMeta.aiSummary;
  
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

      {/* AI 摘要 */}
      <div className="mb-4">
        <AISummary
          summary={aiSummary}
          onGenerate={() => onGenerateSummary(star)}
          onRegenerate={() => onGenerateSummary(star)}
          loading={isGenerating}
          editable={true}
        />
      </div>

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

function StarListItem({ star, onOpenTagModal, onGenerateSummary, isGenerating }) {
  const { metadata } = useStarsStore();
  const repoId = `${star.owner.login}/${star.name}`;
  const repoMeta = metadata[star.id] || {};
  const tags = repoMeta.tags || [];
  const color = repoMeta.color || '#3B82F6';
  const aiSummary = repoMeta.aiSummary;
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
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
          <p className="text-sm text-gray-600 mb-3">
            {star.description || '暂无描述'}
          </p>
          
          {/* AI 摘要 */}
          <div className="mb-3">
            <AISummary
              summary={aiSummary}
              onGenerate={() => onGenerateSummary(star)}
              onRegenerate={() => onGenerateSummary(star)}
              loading={isGenerating}
              editable={true}
            />
          </div>
          
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
          className="ml-4 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors shrink-0"
        >
          {tags.length > 0 ? '编辑' : '添加标签'}
        </button>
      </div>
    </div>
  );
}
