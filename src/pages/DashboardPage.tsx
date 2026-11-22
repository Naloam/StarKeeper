import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Grid3x3,
  List,
  Download,
  Upload,
  RefreshCw,
  Settings,
  Share2,
  Sparkles,
  Activity,
  Trash2,
  Loader2,
  Zap,
  Copy,
  FolderPlus,
} from "lucide-react";
import toast from "react-hot-toast";
import MainLayout from "../components/layout/MainLayout";
import { useAuthStore, useStarsStore, useUIStore } from "../store";
import { getRepoReadme } from "../services/github.service";
import { loadSessionStars } from "../services/session-stars.service";
import { generateSummary } from "../services/dashscope.service";
import { calculateHealthScore, batchCalculateHealthScore } from "../services/health.service";
import { generateStatsReport } from "../services/stats.service";
import type {
  StarredRepo,
  RepoMetadata,
  StatsReport,
  Collection,
  ShareConfig,
  HealthScore,
} from "../types";
import TagModal from "../components/tags/TagModal";
import TagBadge from "../components/tags/TagBadge";
import AISummary from "../components/common/AISummary";
import ExportModal from "../components/common/ExportModal";
import ShareModal from "../components/common/ShareModal";
import HealthBadge from "../components/common/HealthBadge";
import HealthDetailModal from "../components/common/HealthDetailModal";
import StatsPanel, {
  LanguageDistribution,
  TagCloud,
  RecentlyActiveRepos,
} from "../components/common/StatsPanel";
import StatsVisualization from "../components/common/StatsVisualization";
import CustomStatsFilter from "../components/common/CustomStatsFilter";
import SemanticSearch from "../components/common/SemanticSearch";
import LazyImage from "../components/common/LazyImage";
import RelationGraph from "../components/common/RelationGraph";
import { useDebounce } from "../utils/performance";
import { applySessionMetadata, updateSessionMetadata } from "../services/session-metadata.service";
import { updateShareSnapshot } from "../services/share.service";
import CollectionModal from "../components/common/CollectionModal";
import { APP_CONFIG } from "../config";
import { useSettingsStore } from "../store/settings";

interface SemanticSearchResult {
  repo: StarredRepo;
  score: number;
  relevance: string;
}

interface ActiveFilter {
  type: string;
  label: string;
  count: number;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { accessToken, gistId, user } = useAuthStore();
  const { stars, filteredStars, setLoading, loading, metadata, getAllTags, collections } =
    useStarsStore();
  const [progress, setProgress] = useState<{ current: number; hasMore: boolean }>({
    current: 0,
    hasMore: false,
  });
  const [selectedRepo, setSelectedRepo] = useState<StarredRepo | null>(null);
  const tagBaseline = useRef<RepoMetadata>({});
  const [showTagModal, setShowTagModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const shareConfig = useStarsStore((state) => state.shareConfig);
  const [generatingSummary, setGeneratingSummary] = useState<Record<string, boolean>>({});
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: 0,
  });

  // 健康度分析相关状态
  const [analyzingHealth, setAnalyzingHealth] = useState<Record<number | string, boolean>>({});
  const [batchAnalyzing, setBatchAnalyzing] = useState(false);
  const [healthAnalysisProgress, setHealthAnalysisProgress] = useState<{
    current: number;
    total: number;
  }>({
    current: 0,
    total: 0,
  });
  const [selectedHealthRepo, setSelectedHealthRepo] = useState<{
    repo: StarredRepo;
    healthScore: HealthScore;
  } | null>(null);
  const [showHealthModal, setShowHealthModal] = useState(false);

  // 统计数据状态
  const [stats, setStats] = useState<StatsReport | null>(null);
  const [showStats, setShowStats] = useState(true);

  // 自定义过滤状态
  const [customFilteredStars, setCustomFilteredStars] = useState<StarredRepo[] | null>(null);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);

  // 语义搜索状态
  const [semanticSearchResults, setSemanticSearchResults] = useState<SemanticSearchResult[] | null>(
    null,
  );

  // Collections 状态
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [collectionModalMode, setCollectionModalMode] = useState<string>("create"); // create | add
  const [collectionRepoId, setCollectionRepoId] = useState<number | null>(null);

  const collectionsEnabled = APP_CONFIG.features.collections;

  useEffect(() => {
    if (accessToken && stars.length === 0) {
      void loadStars(false);
    }
  }, [accessToken]);

  // 生成统计数据
  useEffect(() => {
    if (stars.length > 0) {
      const statsReport = generateStatsReport(stars, metadata);
      setStats(statsReport);
    }
  }, [stars, metadata]);

  // 处理自定义过滤
  const handleApplyCustomFilter = (filteredData: StarredRepo[], filters: ActiveFilter[]) => {
    setCustomFilteredStars(filteredData);
    setActiveFilters(filters);

    // 使用过滤后的数据重新生成统计
    if (filteredData.length > 0) {
      const statsReport = generateStatsReport(filteredData, metadata);
      setStats(statsReport);
    }
  };

  // 确定要显示的数据 - 如果有语义搜索结果，需要与侧边栏筛选取交集
  // Collection 操作
  const handleCreateCollection = () => {
    setCollectionModalMode("create");
    setCollectionRepoId(null);
    setShowCollectionModal(true);
  };

  const handleAddToCollection = (repoId: number) => {
    if (collections.length === 0) {
      // 没有收藏夹，先创建
      setCollectionModalMode("create");
      setCollectionRepoId(repoId);
      setShowCollectionModal(true);
    } else {
      setCollectionModalMode("add");
      setCollectionRepoId(repoId);
      setShowCollectionModal(true);
    }
  };

  const handleCollectionSave = async (data: {
    name?: string;
    description?: string;
    collectionId?: string;
    repoId?: number;
  }) => {
    try {
      const at = new Date().toISOString();
      if (collectionModalMode === "create" && data.name) {
        const collection: Collection = {
          id: crypto.randomUUID(),
          name: data.name,
          description: data.description ?? "",
          repoIds: collectionRepoId ? [collectionRepoId] : [],
          createdAt: at,
          updatedAt: at,
        };
        await updateSessionMetadata([{ kind: "collection-create", collection }]);
        toast.success("收藏夹已创建");
      } else if (data.collectionId && data.repoId) {
        await updateSessionMetadata([
          { kind: "collection-add", id: data.collectionId, repoId: data.repoId, at },
        ]);
        toast.success("已添加到收藏夹");
      }
    } catch {
      toast.error("保存收藏夹失败，请检查同步状态");
    }
  };

  const handleDeleteCollection = async (id: string) => {
    try {
      await updateSessionMetadata([{ kind: "collection-delete", id }]);
      toast.success("收藏夹已删除");
    } catch {
      toast.error("删除收藏夹失败，请检查同步状态");
    }
  };

  const sidebarProps = collectionsEnabled ? { onCreateCollection: handleCreateCollection } : {};

  const displayStars = (() => {
    if (semanticSearchResults) {
      // 有语义搜索结果时，与 filteredStars 取交集
      const semanticRepoIds = new Set(
        semanticSearchResults.map((r: SemanticSearchResult) => r.repo.id),
      );
      return filteredStars.filter((star: StarredRepo) => semanticRepoIds.has(star.id));
    }
    // 否则使用自定义过滤或默认的侧边栏筛选结果
    return customFilteredStars || filteredStars;
  })();

  // 处理语义搜索结果
  const handleSemanticSearchResults = (results: SemanticSearchResult[] | null) => {
    setSemanticSearchResults(results);
    if (results) {
      // 更新过滤标签，但不直接设置 customFilteredStars
      // 让 displayStars 逻辑自动计算交集
      const semanticFilters: ActiveFilter[] = [
        {
          type: "semantic-search",
          label: `AI 搜索结果`,
          count: results.length,
        },
      ];
      // 保留原有的自定义过滤标签
      setActiveFilters((prev: ActiveFilter[]) => {
        const nonSemanticFilters = prev.filter((f: ActiveFilter) => f.type !== "semantic-search");
        return [...nonSemanticFilters, ...semanticFilters];
      });
    } else {
      // 清除语义搜索标签
      setActiveFilters((prev: ActiveFilter[]) =>
        prev.filter((f: ActiveFilter) => f.type !== "semantic-search"),
      );
    }
  };

  const loadStars = async (refresh = true) => {
    if (!accessToken || !user) return;
    setLoading(true);
    try {
      await loadSessionStars(accessToken, user.id, setProgress, refresh);
    } catch (error) {
      toast.error("加载失败：" + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTagModal = (repo: StarredRepo) => {
    tagBaseline.current = metadata[repo.id] ?? {};
    setSelectedRepo(repo);
    setShowTagModal(true);
  };

  const handleSaveTag = async (data: {
    repoId: number;
    tags: string[];
    notes: string;
    color: string;
  }) => {
    try {
      const original = tagBaseline.current;
      const fields: Partial<RepoMetadata> = {};
      if (data.notes !== (original.notes ?? "")) fields.notes = data.notes;
      if (data.color !== (original.color ?? "#3B82F6")) fields.color = data.color;
      if (JSON.stringify(data.tags) !== JSON.stringify(original.tags ?? []))
        fields.tags = data.tags;
      if (Object.keys(fields).length) await saveRepoMetadataToGist(data.repoId, fields);
    } catch (error) {
      toast.error("保存失败，请检查元数据连接");
      throw error;
    }
  };

  async function saveRepoMetadataToGist(repoId: number, fields: Partial<RepoMetadata>) {
    await updateSessionMetadata([{ kind: "repos", changes: { [repoId]: fields } }]);
  }

  // 生成 AI 摘要
  const handleGenerateSummary = async (repo: StarredRepo) => {
    const repoId = repo.id;
    const repoMeta = metadata[repo.id] || {};

    // 检查是否已有摘要且未过期（7天内）
    if (!gistId) {
      toast.error("请先连接元数据 Gist");
      return;
    }
    if (repo.isPrivate !== false || repo.visibility !== "public") {
      toast.error("AI 摘要仅用于公开仓库");
      return;
    }
    const existingSummary = repoMeta.aiSummary;
    if (
      existingSummary &&
      typeof existingSummary === "object" &&
      "timestamp" in (existingSummary as Record<string, unknown>)
    ) {
      const daysSinceGeneration =
        (Date.now() - (existingSummary as { timestamp: number }).timestamp) / (1000 * 60 * 60 * 24);
      if (daysSinceGeneration < 7) {
        const confirmed = window.confirm(
          `该项目已有 AI 摘要（生成于 ${Math.floor(daysSinceGeneration)} 天前）。是否重新生成？`,
        );
        if (!confirmed) return;
      }
    }

    setGeneratingSummary((prev: Record<string, boolean>) => ({ ...prev, [repoId]: true }));

    try {
      // 获取 README
      const readmeContent = await getRepoReadme(undefined, repo.owner.login, repo.name);

      if (!readmeContent) {
        toast.error("该项目没有 README 文件");
        return;
      }

      // 调用 AI 生成摘要
      const summary = await generateSummary(readmeContent, repo.name, repo.description);

      // 使用稳定的 GitHub 仓库 ID
      if (gistId) {
        await saveRepoMetadataToGist(repoId, {
          aiSummary: summary,
        });
      }
    } catch (error) {
      toast.error("生成失败：" + (error as Error).message);
    } finally {
      setGeneratingSummary((prev: Record<string, boolean>) => ({ ...prev, [repoId]: false }));
    }
  };

  // 保存编辑后的 AI 摘要
  const handleSaveSummary = async (repo: StarredRepo, updatedSummary: string) => {
    const repoId = repo.id;

    await saveRepoMetadataToGist(repoId, { aiSummary: updatedSummary });
  };

  // 批量生成 AI 摘要
  const handleBatchGenerateSummary = async () => {
    if (!gistId) {
      toast.error("请先连接元数据 Gist");
      return;
    }
    // 筛选出还没有 AI 摘要的项目
    const reposWithoutSummary = filteredStars
      .filter((star: StarredRepo) => {
        if (star.isPrivate !== false || star.visibility !== "public") return false;
        const repoMeta = metadata[star.id] || {};
        return !repoMeta.aiSummary;
      })
      .slice(0, 30);

    if (reposWithoutSummary.length === 0) {
      toast.success("当前显示的所有项目都已有 AI 摘要");
      return;
    }

    const confirmed = window.confirm(
      `即将为 ${reposWithoutSummary.length} 个公开项目生成 AI 摘要（至多每个项目 1 次模型请求）。是否继续？`,
    );

    if (!confirmed) return;

    setBatchGenerating(true);
    setBatchProgress({ current: 0, total: reposWithoutSummary.length });

    let successCount = 0;

    for (let i = 0; i < reposWithoutSummary.length; i++) {
      const repo = reposWithoutSummary[i];
      const repoId = repo.id;

      try {
        // 获取 README
        const readmeContent = await getRepoReadme(undefined, repo.owner.login, repo.name);

        if (!readmeContent) {
          setBatchProgress({
            current: i + 1,
            total: reposWithoutSummary.length,
          });
          continue;
        }

        // 调用 AI 生成摘要
        const summary = await generateSummary(readmeContent, repo.name, repo.description);

        // 使用稳定的 GitHub 仓库 ID
        if (gistId) {
          await saveRepoMetadataToGist(repoId, {
            aiSummary: summary,
          });
        }

        successCount++;

        // 更新进度
        setBatchProgress({ current: i + 1, total: reposWithoutSummary.length });

        // 避免速率限制，每个请求之间等待 2 秒
        if (i < reposWithoutSummary.length - 1) {
          await new Promise((resolve: (value: unknown) => void) => setTimeout(resolve, 2000));
        }
      } catch (error) {
        // 继续处理下一个
        setBatchProgress({ current: i + 1, total: reposWithoutSummary.length });
      }
    }

    setBatchGenerating(false);
    toast.success(`批量生成完成！成功生成 ${successCount} 个项目的摘要。`);
  };

  // 分析单个项目健康度
  const handleAnalyzeHealth = async (repo: StarredRepo) => {
    const repoId = repo.id;
    const repoMeta = metadata[repoId] || {};

    // 检查是否已有健康度数据且未过期（7天内）
    const existingHealth = repoMeta.healthScore;
    if (existingHealth && existingHealth.cacheExpiry) {
      const isExpired = new Date(existingHealth.cacheExpiry) < new Date();
      if (!isExpired) {
        // 直接显示现有数据
        setSelectedHealthRepo({ repo, healthScore: existingHealth });
        setShowHealthModal(true);
        return;
      }
    }

    setAnalyzingHealth((prev: Record<number | string, boolean>) => ({ ...prev, [repoId]: true }));

    try {
      // 计算健康度
      const healthScore = await calculateHealthScore(accessToken!, repo);

      // 保存到 Gist
      if (gistId) {
        await saveRepoMetadataToGist(repoId, {
          healthScore: healthScore,
        });
      }

      // 显示详情弹窗
      setSelectedHealthRepo({ repo, healthScore });
      setShowHealthModal(true);
    } catch (error) {
      toast.error("分析失败：" + (error as Error).message);
    } finally {
      setAnalyzingHealth((prev: Record<number | string, boolean>) => ({
        ...prev,
        [repoId]: false,
      }));
    }
  };

  // 批量分析健康度
  const handleBatchAnalyzeHealth = async () => {
    // 筛选出还没有健康度数据或数据已过期的项目
    const reposNeedingAnalysis = filteredStars.filter((star: StarredRepo) => {
      const repoMeta = metadata[star.id] || {};
      const existingHealth = repoMeta.healthScore;
      if (!existingHealth) return true;
      if (!existingHealth.cacheExpiry) return true;
      return new Date(existingHealth.cacheExpiry) < new Date();
    });

    if (reposNeedingAnalysis.length === 0) {
      toast.success("当前显示的所有项目都已有健康度数据（且未过期）");
      return;
    }

    const confirmed = window.confirm(
      `即将为 ${reposNeedingAnalysis.length} 个项目分析健康度，这可能需要一些时间。是否继续？`,
    );

    if (!confirmed) return;

    setBatchAnalyzing(true);
    setHealthAnalysisProgress({
      current: 0,
      total: reposNeedingAnalysis.length,
    });

    let healthSuccessCount = 0;

    for (let i = 0; i < reposNeedingAnalysis.length; i++) {
      const repo = reposNeedingAnalysis[i];
      const repoId = repo.id;

      try {
        // 计算健康度
        const healthScore = await calculateHealthScore(accessToken!, repo);

        healthSuccessCount++;

        // 保存到 Gist
        if (gistId) {
          await saveRepoMetadataToGist(repoId, {
            healthScore: healthScore,
          });
        }

        // 更新进度
        setHealthAnalysisProgress({
          current: i + 1,
          total: reposNeedingAnalysis.length,
        });

        // 避免速率限制，每个请求之间等待 1 秒
        if (i < reposNeedingAnalysis.length - 1) {
          await new Promise((resolve: (value: unknown) => void) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        // 继续处理下一个
        setHealthAnalysisProgress({
          current: i + 1,
          total: reposNeedingAnalysis.length,
        });
      }
    }

    setBatchAnalyzing(false);
    toast.success(`批量分析完成！成功分析 ${healthSuccessCount} 个项目的健康度。`);
  };

  // 显示健康度详情
  const handleShowHealthDetail = (repo: StarredRepo) => {
    const repoMeta = metadata[repo.id] || {};
    if (repoMeta.healthScore) {
      setSelectedHealthRepo({ repo, healthScore: repoMeta.healthScore });
      setShowHealthModal(true);
    } else {
      // 如果没有健康度数据，直接分析
      handleAnalyzeHealth(repo);
    }
  };

  const handleUpdateShare = async (
    config: Pick<ShareConfig, "isPublic" | "shareTitle" | "shareDescription">,
  ) => {
    try {
      if (!accessToken || !gistId || !user?.id) throw new Error("请先连接元数据 Gist");
      const result = await updateShareSnapshot(accessToken, gistId, user, config, stars);
      applySessionMetadata(accessToken, gistId, result.metadata);
      setShowShareModal(false);
      toast.success(result.pending ? "分享快照已更新，设置待同步" : "分享设置已更新");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "更新分享失败");
      throw error;
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-text-primary mb-2">正在加载你的 Stars...</h2>
            {progress.current > 0 && (
              <p className="text-text-secondary">
                已加载 {progress.current} 个项目
                {progress.hasMore && "..."}
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
              <Sparkles className="w-12 h-12 text-text-muted" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">还没有 Star 任何项目</h2>
            <p className="text-text-secondary mb-6">去 GitHub 上 star 一些有趣的项目吧！</p>
            <button
              onClick={() => void loadStars()}
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
    <MainLayout sidebarProps={sidebarProps}>
      <div>
        {/* AI Key 配置提示 */}
        {!useSettingsStore.getState().deepseekApiKey && (
          <div className="mb-4 p-4 bg-primary/10 border border-primary/30 rounded-lg flex items-center justify-between">
            <p className="text-sm text-text-primary">
              配置 AI Key 以启用智能摘要、标签推荐和语义搜索功能
            </p>
            <button
              onClick={() => navigate("/settings")}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary/90"
            >
              <Settings className="w-3.5 h-3.5" />
              去设置
            </button>
          </div>
        )}

        {/* Toolbar */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary">我的 Stars</h2>
            <p className="text-sm sm:text-base text-text-secondary">
              共 {stars.length} 个项目 · 显示 {filteredStars.length} 个
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={handleBatchGenerateSummary}
              disabled={batchGenerating || loading}
              className="btn flex-1 sm:flex-none bg-primary text-white hover:bg-primary/90 text-body-sm"
              title="为当前显示的所有项目批量生成 AI 摘要"
            >
              {batchGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">
                    生成中 {batchProgress.current}/{batchProgress.total}
                  </span>
                  <span className="sm:hidden">生成中</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span className="hidden sm:inline">批量生成摘要</span>
                  <span className="sm:hidden">批量摘要</span>
                </>
              )}
            </button>
            <button
              onClick={handleBatchAnalyzeHealth}
              disabled={batchAnalyzing || loading}
              className="btn flex-1 sm:flex-none bg-success text-white hover:bg-success/90 text-body-sm"
              title="为当前显示的所有项目批量分析健康度"
            >
              {batchAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">
                    分析中 {healthAnalysisProgress.current}/{healthAnalysisProgress.total}
                  </span>
                  <span className="sm:hidden">分析中</span>
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4" />
                  <span className="hidden sm:inline">批量分析健康度</span>
                  <span className="sm:hidden">批量健康</span>
                </>
              )}
            </button>
            <button
              onClick={() => navigate("/cleanup")}
              className="btn flex-1 sm:flex-none bg-danger text-white hover:bg-danger/90 text-body-sm"
              title="智能清理建议，帮你整理无效或重复的 Stars"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">智能清理</span>
              <span className="sm:hidden">清理</span>
            </button>
            <button
              onClick={() => navigate("/deduplication")}
              className="btn flex-1 sm:flex-none bg-warning text-white hover:bg-warning/90 text-body-sm"
              title="智能去重，识别和清理相似项目"
            >
              <Copy className="w-4 h-4" />
              <span className="hidden sm:inline">智能去重</span>
              <span className="sm:hidden">去重</span>
            </button>
            <button
              onClick={() => setShowShareModal(true)}
              className="btn flex-1 sm:flex-none bg-surface-card border border-border text-text-primary hover:bg-surface-darker text-body-sm"
            >
              <Share2 className="w-4 h-4" />
              <span>分享</span>
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-2 bg-surface-card border border-border text-text-primary px-3 sm:px-4 py-2 rounded-lg hover:bg-surface-darker transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              <span>导出</span>
            </button>
            <button
              onClick={() => void loadStars()}
              disabled={loading}
              className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-2 bg-surface-card border border-border text-text-primary px-3 sm:px-4 py-2 rounded-lg hover:bg-surface-darker transition-colors disabled:opacity-50 text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span>刷新</span>
            </button>
          </div>
        </div>

        {/* 统计面板 */}
        {showStats && stats && (
          <div className="mb-6">
            <StatsPanel stats={stats} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              <LanguageDistribution languages={stats.languages} />
              <TagCloud tags={stats.tags} />
              <RecentlyActiveRepos
                repos={(stats as StatsReport & { recentlyActive: StarredRepo[] }).recentlyActive}
              />
            </div>
          </div>
        )}

        {/* AI 语义搜索 */}
        {gistId && (
          <SemanticSearch
            stars={stars}
            metadata={metadata}
            scope={gistId}
            onResults={handleSemanticSearchResults}
          />
        )}

        {/* 自定义统计维度过滤器 */}
        <CustomStatsFilter
          stars={filteredStars}
          metadata={metadata}
          onApplyFilter={handleApplyCustomFilter}
        />

        {/* 数据可视化 */}
        {stats && (
          <StatsVisualization stars={displayStars} metadata={metadata} healthStats={stats.health} />
        )}

        {/* 项目关系图谱 */}
        {displayStars.length > 0 && (
          <div className="mt-6">
            <RelationGraph />
          </div>
        )}

        {/* 显示当前过滤条件 */}
        {activeFilters.length > 0 && (
          <div className="mb-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-body-sm text-text-primary font-medium">
                  已应用 {activeFilters.length} 个过滤条件
                </span>
                <span className="text-caption text-text-secondary">
                  显示 {displayStars.length} / {filteredStars.length} 个项目
                </span>
              </div>
              <button
                onClick={() => {
                  setCustomFilteredStars(null);
                  setActiveFilters([]);
                  setSemanticSearchResults(null); // 同时清除语义搜索结果
                  const statsReport = generateStatsReport(filteredStars, metadata);
                  setStats(statsReport);
                }}
                className="text-body-sm text-primary hover:text-primary/80"
              >
                清除过滤
              </button>
            </div>
          </div>
        )}

        {/* Stars Grid/List */}
        <StarsList
          stars={displayStars}
          onAddToCollection={collectionsEnabled ? handleAddToCollection : null}
          onOpenTagModal={handleOpenTagModal}
          onGenerateSummary={handleGenerateSummary}
          onSaveSummary={handleSaveSummary}
          generatingSummary={generatingSummary}
          onAnalyzeHealth={handleAnalyzeHealth}
          onShowHealthDetail={handleShowHealthDetail}
          analyzingHealth={analyzingHealth}
        />

        {/* Tag Modal */}
        <TagModal
          isOpen={showTagModal}
          onClose={() => setShowTagModal(false)}
          repo={selectedRepo}
          currentTags={metadata[selectedRepo?.id ?? 0]?.tags || []}
          currentNotes={metadata[selectedRepo?.id ?? 0]?.notes || ""}
          currentColor={metadata[selectedRepo?.id ?? 0]?.color || "#3B82F6"}
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

        {/* Health Detail Modal */}
        {showHealthModal && selectedHealthRepo && (
          <HealthDetailModal
            repo={selectedHealthRepo.repo}
            healthScore={selectedHealthRepo.healthScore}
            onClose={() => setShowHealthModal(false)}
          />
        )}

        {/* Collection Modal */}
        {collectionsEnabled && (
          <CollectionModal
            isOpen={showCollectionModal}
            onClose={() => setShowCollectionModal(false)}
            mode={collectionModalMode}
            repoId={collectionRepoId}
            collections={collections}
            onSave={handleCollectionSave}
            onDelete={handleDeleteCollection}
          />
        )}
      </div>
    </MainLayout>
  );
}

// --- Internal component type definitions ---

interface StarsListProps {
  stars: StarredRepo[];
  onOpenTagModal: (repo: StarredRepo) => void;
  onGenerateSummary: (repo: StarredRepo) => void;
  onSaveSummary: (repo: StarredRepo, updatedSummary: string) => void;
  generatingSummary: Record<string, boolean>;
  onAnalyzeHealth: (repo: StarredRepo) => void;
  onShowHealthDetail: (repo: StarredRepo) => void;
  analyzingHealth: Record<number | string, boolean>;
  onAddToCollection: ((repoId: number) => void) | null;
}

interface StarCardProps {
  star: StarredRepo;
  onOpenTagModal: (repo: StarredRepo) => void;
  onGenerateSummary: (repo: StarredRepo) => void;
  onSaveSummary: (repo: StarredRepo, updatedSummary: string) => void;
  isGenerating: boolean | undefined;
  onAnalyzeHealth: (repo: StarredRepo) => void;
  onShowHealthDetail: (repo: StarredRepo) => void;
  isAnalyzing: boolean | undefined;
  onAddToCollection: ((repoId: number) => void) | null;
}

interface StarListItemProps {
  star: StarredRepo;
  onOpenTagModal: (repo: StarredRepo) => void;
  onGenerateSummary: (repo: StarredRepo) => void;
  onSaveSummary: (repo: StarredRepo, updatedSummary: string) => void;
  isGenerating: boolean | undefined;
  onAnalyzeHealth: (repo: StarredRepo) => void;
  onShowHealthDetail: (repo: StarredRepo) => void;
  isAnalyzing: boolean | undefined;
  onAddToCollection: ((repoId: number) => void) | null;
}

function StarsList({
  stars,
  onOpenTagModal,
  onGenerateSummary,
  onSaveSummary,
  generatingSummary,
  onAnalyzeHealth,
  onShowHealthDetail,
  analyzingHealth,
  onAddToCollection,
}: StarsListProps) {
  const { viewMode } = useUIStore() as { viewMode: string };

  if (stars.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">没有匹配的项目</p>
      </div>
    );
  }

  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {stars.map((star: StarredRepo) => (
          <StarCard
            key={star.id}
            star={star}
            onOpenTagModal={onOpenTagModal}
            onGenerateSummary={onGenerateSummary}
            onSaveSummary={onSaveSummary}
            isGenerating={generatingSummary[`${star.owner.login}/${star.name}`]}
            onAnalyzeHealth={onAnalyzeHealth}
            onShowHealthDetail={onShowHealthDetail}
            isAnalyzing={analyzingHealth[star.id]}
            onAddToCollection={onAddToCollection}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {stars.map((star: StarredRepo) => (
        <StarListItem
          key={star.id}
          star={star}
          onOpenTagModal={onOpenTagModal}
          onGenerateSummary={onGenerateSummary}
          onSaveSummary={onSaveSummary}
          isGenerating={generatingSummary[`${star.owner.login}/${star.name}`]}
          onAnalyzeHealth={onAnalyzeHealth}
          onShowHealthDetail={onShowHealthDetail}
          isAnalyzing={analyzingHealth[star.id]}
          onAddToCollection={onAddToCollection}
        />
      ))}
    </div>
  );
}

function StarCard({
  star,
  onOpenTagModal,
  onGenerateSummary,
  onSaveSummary,
  isGenerating,
  onAnalyzeHealth,
  onShowHealthDetail,
  isAnalyzing,
  onAddToCollection,
}: StarCardProps) {
  const { metadata } = useStarsStore() as { metadata: Record<number, RepoMetadata> };
  const repoId = star.id;
  const repoMeta = metadata[star.id] || {};
  const tags = repoMeta.tags || [];
  const color = repoMeta.color || "#3B82F6";
  const aiSummary = repoMeta.aiSummary;
  const healthScore = repoMeta.healthScore;

  return (
    <div className="bg-surface-card rounded-lg border border-border p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-text-primary hover:text-primary-600 mb-1">
            <a href={star.htmlUrl} target="_blank" rel="noopener noreferrer">
              {star.name}
            </a>
          </h3>
          <p className="text-sm text-text-secondary">@{star.owner.login}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {star.language && (
            <span className="px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded">
              {star.language}
            </span>
          )}
          {/* 健康度徽章 */}
          {healthScore && !isAnalyzing ? (
            <HealthBadge
              healthScore={healthScore}
              size="sm"
              onClick={() => onShowHealthDetail(star)}
            />
          ) : isAnalyzing ? (
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs text-text-secondary">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>分析中...</span>
            </div>
          ) : (
            <button
              onClick={() => onAnalyzeHealth(star)}
              className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs text-text-primary transition-colors"
              title="分析健康度"
            >
              <Activity className="w-3 h-3" />
              <span>分析健康度</span>
            </button>
          )}
        </div>
      </div>

      <p className="text-sm text-text-secondary mb-4 line-clamp-2">
        {star.description || "暂无描述"}
      </p>

      {/* AI 摘要 */}
      <div className="mb-4">
        <AISummary
          summary={aiSummary}
          onGenerate={() => onGenerateSummary(star)}
          onRegenerate={() => onGenerateSummary(star)}
          onSave={(updatedSummary: string) => onSaveSummary(star, updatedSummary)}
          loading={isGenerating}
          editable={true}
        />
      </div>

      {/* 标签显示 */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {tags.slice(0, 3).map((tag: string) => (
            <TagBadge key={tag} tag={tag} color={color} size="sm" />
          ))}
          {tags.length > 3 && (
            <span className="px-2 py-0.5 text-xs text-text-secondary">+{tags.length - 3}</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-text-secondary">
        <div className="flex items-center space-x-4">
          <span>⭐ {star.stargazersCount.toLocaleString()}</span>
          {star.forksCount > 0 && <span>🔀 {star.forksCount.toLocaleString()}</span>}
        </div>
        <div className="flex items-center gap-3">
          {onAddToCollection && (
            <button
              onClick={() => onAddToCollection(star.id)}
              className="text-text-secondary hover:text-primary-600 text-xs font-medium"
              title="添加到收藏夹"
            >
              <FolderPlus className="w-3.5 h-3.5 inline" />
            </button>
          )}
          <button
            onClick={() => onOpenTagModal(star)}
            className="text-primary-600 hover:text-primary-700 text-xs font-medium"
          >
            {tags.length > 0 ? "编辑标签" : "添加标签"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StarListItem({
  star,
  onOpenTagModal,
  onGenerateSummary,
  onSaveSummary,
  isGenerating,
  onAnalyzeHealth,
  onShowHealthDetail,
  isAnalyzing,
  onAddToCollection,
}: StarListItemProps) {
  const { metadata } = useStarsStore() as { metadata: Record<number, RepoMetadata> };
  const repoId = star.id;
  const repoMeta = metadata[star.id] || {};
  const tags = repoMeta.tags || [];
  const color = repoMeta.color || "#3B82F6";
  const aiSummary = repoMeta.aiSummary;
  const healthScore = repoMeta.healthScore;

  return (
    <div className="bg-surface-card rounded-lg border border-border p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="font-semibold text-text-primary hover:text-primary-600">
              <a href={star.htmlUrl} target="_blank" rel="noopener noreferrer">
                {star.fullName}
              </a>
            </h3>
            {star.language && (
              <span className="px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded">
                {star.language}
              </span>
            )}
            {/* 健康度徽章 */}
            {healthScore && !isAnalyzing ? (
              <HealthBadge
                healthScore={healthScore}
                size="sm"
                onClick={() => onShowHealthDetail(star)}
              />
            ) : isAnalyzing ? (
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs text-text-secondary">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>分析中...</span>
              </div>
            ) : (
              <button
                onClick={() => onAnalyzeHealth(star)}
                className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs text-text-primary transition-colors"
                title="分析健康度"
              >
                <Activity className="w-3 h-3" />
                <span>分析健康度</span>
              </button>
            )}
          </div>
          <p className="text-sm text-text-secondary mb-3">{star.description || "暂无描述"}</p>

          {/* AI 摘要 */}
          <div className="mb-3">
            <AISummary
              summary={aiSummary}
              onGenerate={() => onGenerateSummary(star)}
              onRegenerate={() => onGenerateSummary(star)}
              onSave={(updatedSummary: string) => onSaveSummary(star, updatedSummary)}
              loading={isGenerating}
              editable={true}
            />
          </div>

          {/* 标签显示 */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag: string) => (
                <TagBadge key={tag} tag={tag} color={color} size="sm" />
              ))}
            </div>
          )}

          <div className="flex items-center space-x-4 text-sm text-text-secondary">
            <span>⭐ {star.stargazersCount.toLocaleString()}</span>
            <span>🔀 {star.forksCount.toLocaleString()}</span>
            <span>更新于 {new Date(star.updatedAt).toLocaleDateString("zh-CN")}</span>
          </div>
        </div>
        <div className="ml-4 flex items-center gap-2 shrink-0">
          {onAddToCollection && (
            <button
              onClick={() => onAddToCollection(star.id)}
              className="p-1.5 text-text-secondary hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="添加到收藏夹"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onOpenTagModal(star)}
            className="px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          >
            {tags.length > 0 ? "编辑" : "添加标签"}
          </button>
        </div>
      </div>
    </div>
  );
}
