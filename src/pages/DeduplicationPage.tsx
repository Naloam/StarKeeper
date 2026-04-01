import { useState, useEffect } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Copy,
  TrendingUp,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useStarsStore, useAuthStore } from "../store";
import type { StarredRepo, RepoMetadata } from "../types";
import { generateDeduplicationReport } from "../services/similarity.service";
import { saveMetadataToGist } from "../services/metadata.service";
import SimilarReposCard from "../components/common/SimilarReposCard";
import MainLayout from "../components/layout/MainLayout";

/** 推荐信息 */
interface Recommendation {
  repoId: number;
  repoName: string;
  score: number;
  reasons: string[];
}

/** 相似项目组 */
interface DeduplicationGroup {
  repos: StarredRepo[];
  similarities: Array<{
    repo1: number;
    repo2: number;
    score: number;
    details: Record<string, number>;
  }>;
  averageSimilarity: number;
  recommendation: Recommendation;
}

/** 去重报告 */
interface DeduplicationReport {
  totalRepos: number;
  duplicateGroups: number;
  totalDuplicates: number;
  potentialSavings: number;
  groups: DeduplicationGroup[];
  summary: {
    highSimilarity: number;
    mediumSimilarity: number;
    lowSimilarity: number;
  };
}

export default function DeduplicationPage() {
  const navigate = useNavigate();
  const { stars, metadata, setMetadata } = useStarsStore() as {
    stars: StarredRepo[];
    metadata: Record<number, RepoMetadata>;
    setMetadata: (m: Record<number, RepoMetadata>) => void;
  };
  const { accessToken, gistId } = useAuthStore() as {
    accessToken: string | null;
    gistId: string | null;
  };

  const [report, setReport] = useState<DeduplicationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [threshold, setThreshold] = useState(0.6); // 相似度阈值
  const [selectedRepos, setSelectedRepos] = useState<Set<number>>(new Set());
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    if (stars.length > 0) {
      analyzeDeduplication();
    }
  }, [stars, threshold]);

  const analyzeDeduplication = () => {
    setLoading(true);
    try {
      const deduplicationReport = generateDeduplicationReport(stars, threshold);
      setReport(deduplicationReport);
    } catch (error) {
      console.error("分析失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRepo = (repoId: number) => {
    const newSelected = new Set(selectedRepos);
    if (newSelected.has(repoId)) {
      newSelected.delete(repoId);
    } else {
      newSelected.add(repoId);
    }
    setSelectedRepos(newSelected);
  };

  const handleSelectAllInGroup = (group: DeduplicationGroup) => {
    const newSelected = new Set(selectedRepos);
    const recommendedId = group.recommendation.repoId;

    // 选择组内除了推荐项之外的所有项目
    group.repos.forEach((repo) => {
      if (repo.id !== recommendedId) {
        if (newSelected.has(repo.id)) {
          newSelected.delete(repo.id);
        } else {
          newSelected.add(repo.id);
        }
      }
    });

    setSelectedRepos(newSelected);
  };

  const handleRemoveSelected = async () => {
    if (selectedRepos.size === 0) return;

    if (!confirm(`确定要归档 ${selectedRepos.size} 个重复项目吗？`)) {
      return;
    }

    setRemoving(true);
    try {
      // 将选中的项目标记为已归档
      const updatedMetadata = { ...metadata } as Record<
        number,
        RepoMetadata & Record<string, unknown>
      >;
      const now = new Date().toISOString();

      selectedRepos.forEach((repoId) => {
        if (!updatedMetadata[repoId]) {
          updatedMetadata[repoId] = {};
        }
        updatedMetadata[repoId].archived = true;
        updatedMetadata[repoId].archivedAt = now;
        updatedMetadata[repoId].archivedReason = "duplicate";
      });

      // 保存到 Gist
      await saveMetadataToGist(accessToken, gistId, updatedMetadata);
      setMetadata(updatedMetadata);

      // 清除选择
      setSelectedRepos(new Set());

      // 重新分析
      analyzeDeduplication();

      toast.success(`成功归档 ${selectedRepos.size} 个项目！`);
    } catch (error) {
      console.error("归档失败:", error);
      toast.error("归档失败，请重试");
    } finally {
      setRemoving(false);
    }
  };

  const handleThresholdChange = (e: ChangeEvent<HTMLInputElement>) => {
    setThreshold(parseFloat(e.target.value));
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">正在分析重复项目...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!report) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600">暂无分析数据</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              返回
            </button>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
              <Copy className="w-8 h-8 text-primary-600" />
              <span>智能去重</span>
            </h1>
            <p className="text-gray-600 mt-2">
              基于多维度相似度分析，帮助你识别和清理重复的 Star 项目
            </p>
          </div>

          {/* 操作按钮 */}
          {selectedRepos.size > 0 && (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">已选择 {selectedRepos.size} 个项目</span>
              <button
                onClick={() => setSelectedRepos(new Set())}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                清除选择
              </button>
              <button
                onClick={handleRemoveSelected}
                disabled={removing}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {removing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>归档中...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>批量归档</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Copy className="w-6 h-6" />}
            label="重复组数"
            value={report.duplicateGroups}
            color="yellow"
          />
          <StatCard
            icon={<Trash2 className="w-6 h-6" />}
            label="可清理数"
            value={report.totalDuplicates}
            color="red"
          />
          <StatCard
            icon={<CheckCircle className="w-6 h-6" />}
            label="高相似度"
            value={report.summary.highSimilarity}
            color="green"
            subtitle="> 80%"
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            label="中相似度"
            value={report.summary.mediumSimilarity}
            color="blue"
            subtitle="60-80%"
          />
        </div>

        {/* 相似度阈值调整 */}
        <div className="bg-surface-card rounded-lg border border-border p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">相似度阈值</h3>
              <p className="text-sm text-gray-600">
                调整阈值以控制检测灵敏度，当前阈值:{" "}
                <span className="font-bold text-primary-600">{(threshold * 100).toFixed(0)}%</span>
              </p>
            </div>
            <div className="w-64">
              <input
                type="range"
                min="0.4"
                max="0.9"
                step="0.05"
                value={threshold}
                onChange={handleThresholdChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>宽松 (40%)</span>
                <span>严格 (90%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* 内容区域 */}
        {report.duplicateGroups === 0 ? (
          <div className="bg-surface-card rounded-lg border border-border p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">太棒了！没有发现重复项目</h3>
            <p className="text-gray-600 mb-6">你的 Stars 列表很干净，没有明显的重复或相似项目</p>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              返回主页
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                发现 {report.duplicateGroups} 组相似项目
              </h2>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span>点击"选择移除"标记待清理项目</span>
              </div>
            </div>

            {report.groups.map((group, index) => (
              <div key={index} className="relative">
                {/* 快速选择按钮 */}
                <div className="absolute -top-3 right-4 z-10">
                  <button
                    onClick={() => handleSelectAllInGroup(group)}
                    className="px-3 py-1 text-xs bg-surface-card border border-border hover:bg-surface-darker rounded-full shadow-sm transition-colors"
                  >
                    快速选择非推荐项
                  </button>
                </div>

                <SimilarReposCard
                  group={group}
                  onSelectRepo={handleSelectRepo}
                  selectedRepos={selectedRepos}
                  metadata={metadata}
                />
              </div>
            ))}
          </div>
        )}

        {/* 提示信息 */}
        {report.duplicateGroups > 0 && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">💡 智能建议</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>绿色边框的项目是我们推荐保留的最佳选择</li>
                  <li>可以选择其他相似项目进行归档</li>
                  <li>归档的项目 30 天内可以在"智能清理"页面恢复</li>
                  <li>建议先查看项目详情，确认后再批量归档</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

// 统计卡片组件
interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: number;
  color: "yellow" | "red" | "green" | "blue";
  subtitle?: string;
}

function StatCard({ icon, label, value, color, subtitle }: StatCardProps) {
  const colorClasses: Record<string, string> = {
    yellow: "bg-yellow-50 text-yellow-600 border-yellow-200",
    red: "bg-red-50 text-red-600 border-red-200",
    green: "bg-green-50 text-green-600 border-green-200",
    blue: "bg-blue-50 text-blue-600 border-blue-200",
  };

  return (
    <div className={`rounded-lg border p-6 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-3">
        {icon}
        <span className="text-3xl font-bold">{value}</span>
      </div>
      <div className="text-sm font-medium">{label}</div>
      {subtitle && <div className="text-xs mt-1 opacity-80">{subtitle}</div>}
    </div>
  );
}
