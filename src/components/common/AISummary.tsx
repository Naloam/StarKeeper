import { Sparkles, RefreshCw, Edit2, Check, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

/**
 * AI 摘要展示组件
 * 用于显示项目的 AI 生成摘要
 */
export default function AISummary({
  summary,
  onGenerate,
  onRegenerate,
  onSave,
  loading = false,
  editable = false,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSummary, setEditedSummary] = useState(summary?.summary || "");

  const handleSave = async () => {
    if (onSave && editedSummary.trim()) {
      try {
        // 调用保存回调，传递编辑后的摘要
        await onSave({
          ...summary,
          summary: editedSummary.trim(),
        });
        setIsEditing(false);
      } catch (error) {
        console.error("保存摘要失败:", error);
        toast.error("保存失败：" + error.message);
      }
    } else {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedSummary(summary?.summary || "");
    setIsEditing(false);
  };

  // 如果没有摘要且不在加载中，显示生成按钮
  if (!summary && !loading) {
    return (
      <div className="bg-surface rounded-xl p-4 border border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-surface-card border border-border rounded-lg">
              <Sparkles className="w-4 h-4 text-text-secondary" strokeWidth={1.5} />
            </div>
            <div>
              <span className="text-body-sm font-medium text-text-primary">AI 智能摘要</span>
              <p className="text-caption text-text-secondary">快速了解项目核心价值</p>
            </div>
          </div>
          <button
            onClick={onGenerate}
            className="btn bg-primary text-white hover:bg-primary/90 text-body-sm"
          >
            <Sparkles className="w-4 h-4" strokeWidth={1.5} />
            <span>生成</span>
          </button>
        </div>
      </div>
    );
  }

  // 加载状态
  if (loading) {
    return (
      <div className="bg-surface rounded-xl p-4 border border-border">
        <div className="flex items-center space-x-3 mb-3">
          <div className="p-1.5 bg-surface-card border border-border rounded-lg">
            <RefreshCw className="w-4 h-4 text-text-secondary animate-spin" strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <div className="h-3 bg-surface-darker rounded animate-pulse mb-2"></div>
            <div className="h-2 bg-surface-darker rounded animate-pulse w-3/4"></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-2 bg-surface-darker rounded animate-pulse"></div>
          <div className="h-2 bg-surface-darker rounded animate-pulse w-5/6"></div>
        </div>
        <p className="text-caption text-text-secondary mt-3 flex items-center">
          <span className="inline-block w-1 h-1 bg-text-secondary rounded-full mr-2 animate-pulse"></span>
          AI 正在分析项目内容...
        </p>
      </div>
    );
  }

  // 显示摘要内容
  return (
    <div className="card hover:shadow-card-hover transition-fast">
      {/* 头部：图标 + 操作按钮 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-surface border border-border rounded-lg">
            <Sparkles className="w-4 h-4 text-text-secondary" strokeWidth={1.5} />
          </div>
          <span className="text-body-sm font-semibold text-text-primary">AI 智能摘要</span>
        </div>
        <div className="flex items-center space-x-1">
          {editable && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-text-secondary hover:text-primary hover:bg-surface rounded-lg transition-fast focus-ring"
              title="编辑摘要"
            >
              <Edit2 className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          )}
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="p-1.5 text-success hover:bg-success-light rounded-lg transition-fast focus-ring"
                title="保存"
              >
                <Check className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
              <button
                onClick={handleCancel}
                className="p-1.5 text-danger hover:bg-danger-light rounded-lg transition-fast focus-ring"
                title="取消"
              >
                <X className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            </>
          ) : (
            <button
              onClick={onRegenerate}
              className="p-1.5 text-text-secondary hover:text-primary hover:bg-surface rounded-lg transition-fast focus-ring"
              title="重新生成"
            >
              <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>

      {/* 一句话摘要 */}
      {isEditing ? (
        <textarea
          value={editedSummary}
          onChange={(e) => setEditedSummary(e.target.value)}
          className="w-full p-3 text-body-sm text-text-primary bg-surface-card border border-border rounded-lg focus-ring resize-none"
          rows={2}
          placeholder="编辑项目摘要..."
        />
      ) : (
        <p className="text-body-sm text-text-primary leading-relaxed mb-3 font-medium">
          {summary?.summary}
        </p>
      )}

      {/* 功能点 */}
      {summary?.features && summary.features.length > 0 && (
        <div className="mb-3">
          <h4 className="text-caption font-bold text-text-primary mb-2 uppercase tracking-wide">
            主要功能
          </h4>
          <ul className="space-y-1.5">
            {summary.features.map((feature, index) => (
              <li key={index} className="text-caption text-text-secondary flex items-start">
                <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 适用场景 + 技术栈 */}
      <div className="grid grid-cols-1 gap-2 text-caption">
        {summary?.useCase && (
          <div className="bg-surface rounded-lg p-2">
            <span className="font-bold text-text-primary">💡 适用场景：</span>
            <span className="text-text-secondary ml-1">{summary.useCase}</span>
          </div>
        )}
        {summary?.techStack && summary.techStack.length > 0 && (
          <div className="bg-surface rounded-lg p-2">
            <span className="font-bold text-text-primary">🔧 技术栈：</span>
            <span className="text-text-secondary ml-1">{summary.techStack.join(", ")}</span>
          </div>
        )}
      </div>

      {/* 时间戳 */}
      {summary?.timestamp && (
        <p className="text-caption text-text-tertiary mt-3">
          生成于 {new Date(summary.timestamp).toLocaleString("zh-CN")}
        </p>
      )}
    </div>
  );
}
