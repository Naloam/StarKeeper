import { useState } from "react";
import { X, Plus, FolderOpen, Trash2, Check } from "lucide-react";

/**
 * CollectionModal — 创建/编辑收藏夹，或将 repo 添加到收藏夹
 *
 * mode:
 *   "create" — 创建新收藏夹
 *   "edit"   — 编辑收藏夹名称/描述
 *   "add"    — 将某个 repo 添加到已有收藏夹
 */
export default function CollectionModal({
  isOpen,
  onClose,
  mode = "create",
  collection,
  repoId,
  collections,
  onSave,
  onDelete,
}) {
  const [name, setName] = useState(collection?.name || "");
  const [description, setDescription] = useState(collection?.description || "");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() && mode !== "add") return;
    onSave({ name: name.trim(), description: description.trim() });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface-card rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">
            {mode === "create" && "新建收藏夹"}
            {mode === "edit" && "编辑收藏夹"}
            {mode === "add" && "添加到收藏夹"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface transition-colors"
            aria-label="关闭"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {mode === "add" ? (
            /* 添加到收藏夹模式：显示收藏夹列表 */
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {collections.length === 0 ? (
                <p className="text-sm text-text-secondary text-center py-4">
                  还没有收藏夹，请先创建一个
                </p>
              ) : (
                collections.map((col) => {
                  const isAdded = col.repoIds.includes(repoId);
                  return (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => {
                        if (!isAdded) {
                          onSave({ collectionId: col.id, repoId });
                          onClose();
                        }
                      }}
                      disabled={isAdded}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        isAdded
                          ? "bg-green-50 border-green-200 text-green-700"
                          : "border-border hover:bg-surface-darker text-text-primary"
                      }`}
                    >
                      <FolderOpen className="w-4 h-4 shrink-0" />
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium">{col.name}</p>
                        <p className="text-xs text-text-secondary">{col.repoIds.length} 个项目</p>
                      </div>
                      {isAdded && <Check className="w-4 h-4 text-green-500" />}
                    </button>
                  );
                })
              )}
            </div>
          ) : (
            /* 创建/编辑模式 */
            <>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">名称</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例如：前端框架、学习资源..."
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary bg-surface"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  描述（可选）
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="收藏夹的简短描述..."
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary bg-surface resize-none"
                  rows={2}
                />
              </div>
            </>
          )}

          {/* 操作按钮 */}
          <div className="flex items-center justify-between pt-2">
            {mode === "edit" && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(collection.id);
                  onClose();
                }}
                className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                删除
              </button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-text-secondary hover:bg-surface rounded-lg transition-colors"
              >
                取消
              </button>
              {mode !== "add" && (
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="flex items-center gap-1 px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  {mode === "create" ? "创建" : "保存"}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
