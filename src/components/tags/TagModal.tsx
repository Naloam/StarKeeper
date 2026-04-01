import { X, Tag, Save, Palette, Sparkles, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import TagBadge from "./TagBadge";
import TagInput from "./TagInput";
import useModalA11y from "../../hooks/useModalA11y";
import { suggestTags } from "../../services/dashscope.service";

interface TagModalProps {
  isOpen: boolean;
  onClose: () => void;
  repo: {
    id: number;
    name: string;
    fullName: string;
    description: string | null;
    language: string | null;
    stargazersCount: number;
  };
  currentTags?: string[];
  currentNotes?: string;
  currentColor?: string;
  allTags?: string[];
  onSave: (data: { repoId: number; tags: string[]; notes: string; color: string }) => Promise<void>;
}

/**
 * 标签管理 Modal
 */
export default function TagModal({
  isOpen,
  onClose,
  repo,
  currentTags = [],
  currentNotes = "",
  currentColor = "#3B82F6",
  allTags = [],
  onSave,
}: TagModalProps) {
  const [tags, setTags] = useState<string[]>(currentTags);
  const [notes, setNotes] = useState(currentNotes);
  const [selectedColor, setSelectedColor] = useState(currentColor);
  const [aiLoading, setAiLoading] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);

  const modalRef = useModalA11y(isOpen, onClose);

  useEffect(() => {
    if (isOpen) {
      setTags(currentTags);
      setNotes(currentNotes);
      setSelectedColor(currentColor);
    }
  }, [isOpen, currentTags, currentNotes, currentColor]);

  const predefinedColors = [
    "#EF4444", // Red
    "#F59E0B", // Orange
    "#10B981", // Green
    "#3B82F6", // Blue
    "#6366F1", // Indigo
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#6B7280", // Gray
  ];

  const handleAddTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleAiSuggest = async () => {
    if (aiLoading) return;
    setAiLoading(true);
    try {
      const recommended = await suggestTags(
        repo.fullName,
        repo.description,
        repo.language,
        tags,
        allTags,
      );
      if (recommended.length > 0) {
        setSuggestedTags(recommended);
        toast.success(`AI 推荐了 ${recommended.length} 个标签`);
      } else {
        toast("暂无推荐标签");
      }
    } catch (error) {
      console.error("AI 标签推荐失败:", error);
      toast.error("AI 推荐失败，请重试");
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddSuggestedTag = (tag: string) => {
    handleAddTag(tag);
    setSuggestedTags(suggestedTags.filter((t) => t !== tag));
  };

  const handleAddAllSuggested = () => {
    const newTags = suggestedTags.filter((t) => !tags.includes(t));
    setTags([...tags, ...newTags]);
    setSuggestedTags([]);
    toast.success(`已添加 ${newTags.length} 个标签`);
  };

  const handleSave = async () => {
    try {
      await onSave({
        repoId: repo.id,
        tags,
        notes,
        color: selectedColor,
      });
      onClose();
    } catch (error) {
      console.error("保存失败:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tag-modal-title"
        className="bg-surface-card rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden animate-slide-up"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Tag className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 id="tag-modal-title" className="text-xl font-semibold text-text-primary">
                管理标签
              </h2>
              <p className="text-sm text-text-secondary">{repo?.fullName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-darker rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* 添加标签 */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">添加标签</label>
            <TagInput
              suggestions={allTags.filter((t) => !tags.includes(t))}
              onAdd={handleAddTag}
              placeholder="输入标签名称或从建议中选择..."
            />
          </div>

          {/* AI 推荐标签 */}
          {suggestedTags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                <Sparkles className="w-4 h-4 inline mr-1 text-purple-500" />
                AI 推荐标签
              </label>
              <div className="flex flex-wrap gap-2">
                {suggestedTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleAddSuggestedTag(tag)}
                    className="px-3 py-1 text-sm rounded-full border border-dashed border-purple-300 text-purple-600 hover:bg-purple-50 transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
                <button
                  onClick={handleAddAllSuggested}
                  className="px-3 py-1 text-sm rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                >
                  全部添加
                </button>
              </div>
            </div>
          )}

          {/* 当前标签 */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              当前标签 ({tags.length})
            </label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <TagBadge
                  key={tag}
                  tag={tag}
                  color={selectedColor}
                  removable
                  onRemove={handleRemoveTag}
                  size="md"
                />
              ))}
            </div>
          </div>

          {/* 颜色选择 */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              <Palette className="w-4 h-4 inline mr-1" />
              标签颜色
            </label>
            <div className="flex flex-wrap gap-3">
              {predefinedColors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    selectedColor === color
                      ? "ring-2 ring-offset-2 ring-border-dark scale-110"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          </div>

          {/* 笔记 */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">笔记 (可选)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="添加关于这个项目的笔记..."
              rows={4}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-surface text-text-primary"
            />
          </div>

          {/* 项目信息 */}
          <div className="bg-surface-darker rounded-lg p-4 border border-border">
            <h3 className="font-medium text-text-primary mb-2">{repo?.name}</h3>
            <p className="text-sm text-text-secondary mb-3">{repo?.description || "暂无描述"}</p>
            <div className="flex items-center space-x-4 text-sm text-text-muted">
              <span>⭐ {repo?.stargazersCount?.toLocaleString()}</span>
              {repo?.language && (
                <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded">
                  {repo?.language}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border bg-surface-darker">
          <button
            onClick={handleAiSuggest}
            disabled={aiLoading}
            className="inline-flex items-center space-x-2 px-4 py-2 text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50"
          >
            {aiLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>{aiLoading ? "推荐中..." : "AI 推荐标签"}</span>
          </button>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-text-primary hover:bg-border rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>保存</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
