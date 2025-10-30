import { X, Tag, Save, Palette } from 'lucide-react';
import { useState, useEffect } from 'react';
import TagBadge from './TagBadge';
import TagInput from './TagInput';

/**
 * 标签管理 Modal
 */
export default function TagModal({ 
  isOpen, 
  onClose, 
  repo, 
  currentTags = [],
  currentNotes = '',
  currentColor = '#3B82F6',
  allTags = [],
  onSave 
}) {
  const [tags, setTags] = useState(currentTags);
  const [notes, setNotes] = useState(currentNotes);
  const [selectedColor, setSelectedColor] = useState(currentColor);

  useEffect(() => {
    if (isOpen) {
      setTags(currentTags);
      setNotes(currentNotes);
      setSelectedColor(currentColor);
    }
  }, [isOpen, currentTags, currentNotes, currentColor]);

  const predefinedColors = [
    '#EF4444', // Red
    '#F59E0B', // Orange
    '#10B981', // Green
    '#3B82F6', // Blue
    '#6366F1', // Indigo
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#6B7280', // Gray
  ];

  const handleAddTag = (tag) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const handleRemoveTag = (tag) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSave = () => {
    onSave({
      repoId: repo.id,
      tags,
      notes,
      color: selectedColor,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Tag className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                管理标签
              </h2>
              <p className="text-sm text-gray-500">
                {repo?.fullName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* 添加标签 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              添加标签
            </label>
            <TagInput
              suggestions={allTags.filter(t => !tags.includes(t))}
              onAdd={handleAddTag}
              placeholder="输入标签名称或从建议中选择..."
            />
          </div>

          {/* 当前标签 */}
          {tags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
          )}

          {/* 颜色选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          </div>

          {/* 笔记 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              笔记 (可选)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="添加关于这个项目的笔记..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
          </div>

          {/* 项目信息 */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="font-medium text-gray-900 mb-2">{repo?.name}</h3>
            <p className="text-sm text-gray-600 mb-3">
              {repo?.description || '暂无描述'}
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
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
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>保存</span>
          </button>
        </div>
      </div>
    </div>
  );
}
