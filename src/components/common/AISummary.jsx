import { Sparkles, RefreshCw, Edit2, Check, X } from 'lucide-react';
import { useState } from 'react';

/**
 * AI 摘要展示组件
 * 用于显示项目的 AI 生成摘要
 */
export default function AISummary({ 
  summary, 
  onGenerate, 
  onRegenerate, 
  loading = false,
  editable = false
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSummary, setEditedSummary] = useState(summary?.summary || '');

  const handleSave = () => {
    // TODO: 实现保存编辑后的摘要
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedSummary(summary?.summary || '');
    setIsEditing(false);
  };

  // 如果没有摘要且不在加载中，显示生成按钮
  if (!summary && !loading) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-700">
              使用 AI 生成智能摘要
            </span>
          </div>
          <button
            onClick={onGenerate}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
          >
            <Sparkles className="w-4 h-4" />
            <span>生成摘要</span>
          </button>
        </div>
      </div>
    );
  }

  // 加载状态
  if (loading) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
        <div className="flex items-center space-x-3">
          <RefreshCw className="w-5 h-5 text-purple-600 animate-spin" />
          <div className="flex-1">
            <div className="h-4 bg-purple-200 rounded animate-pulse mb-2"></div>
            <div className="h-3 bg-purple-100 rounded animate-pulse w-3/4"></div>
          </div>
        </div>
        <p className="text-xs text-purple-600 mt-2">AI 正在分析项目内容...</p>
      </div>
    );
  }

  // 显示摘要内容
  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
      {/* 头部：图标 + 操作按钮 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <span className="text-sm font-semibold text-gray-700">AI 智能摘要</span>
        </div>
        <div className="flex items-center space-x-2">
          {editable && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-100 rounded transition-colors"
              title="编辑摘要"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="p-1.5 text-green-600 hover:bg-green-100 rounded transition-colors"
                title="保存"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancel}
                className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                title="取消"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={onRegenerate}
              className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-100 rounded transition-colors"
              title="重新生成"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 一句话摘要 */}
      {isEditing ? (
        <textarea
          value={editedSummary}
          onChange={(e) => setEditedSummary(e.target.value)}
          className="w-full p-2 text-sm text-gray-700 border border-purple-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          rows={2}
          placeholder="编辑项目摘要..."
        />
      ) : (
        <p className="text-sm text-gray-700 leading-relaxed mb-3">
          {summary?.summary}
        </p>
      )}

      {/* 功能点 */}
      {summary?.features && summary.features.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs font-semibold text-gray-600 mb-2">主要功能</h4>
          <ul className="space-y-1">
            {summary.features.map((feature, index) => (
              <li key={index} className="text-xs text-gray-600 flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 适用场景 + 技术栈 */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        {summary?.useCase && (
          <div>
            <span className="font-semibold text-gray-600">适用场景：</span>
            <span className="text-gray-600">{summary.useCase}</span>
          </div>
        )}
        {summary?.techStack && summary.techStack.length > 0 && (
          <div>
            <span className="font-semibold text-gray-600">技术栈：</span>
            <span className="text-gray-600">{summary.techStack.join(', ')}</span>
          </div>
        )}
      </div>

      {/* 时间戳 */}
      {summary?.timestamp && (
        <p className="text-xs text-gray-400 mt-2">
          生成于 {new Date(summary.timestamp).toLocaleString('zh-CN')}
        </p>
      )}
    </div>
  );
}
