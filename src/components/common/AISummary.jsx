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
  onSave,
  loading = false,
  editable = false
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSummary, setEditedSummary] = useState(summary?.summary || '');

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
        console.error('保存摘要失败:', error);
        alert('保存失败：' + error.message);
      }
    } else {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedSummary(summary?.summary || '');
    setIsEditing(false);
  };

  // 如果没有摘要且不在加载中，显示生成按钮
  if (!summary && !loading) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 rounded-lg p-4 border border-purple-200/60 shadow-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-purple-100 rounded-lg">
              <Sparkles className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <span className="text-sm font-medium text-gray-800">AI 智能摘要</span>
              <p className="text-xs text-gray-500">快速了解项目核心价值</p>
            </div>
          </div>
          <button
            onClick={onGenerate}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg text-sm font-medium"
          >
            <Sparkles className="w-4 h-4" />
            <span>生成</span>
          </button>
        </div>
      </div>
    );
  }

  // 加载状态
  if (loading) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 rounded-lg p-4 border border-purple-200/60">
        <div className="flex items-center space-x-3 mb-3">
          <div className="p-1.5 bg-purple-100 rounded-lg">
            <RefreshCw className="w-4 h-4 text-purple-600 animate-spin" />
          </div>
          <div className="flex-1">
            <div className="h-3 bg-purple-200/60 rounded animate-pulse mb-2"></div>
            <div className="h-2 bg-purple-100/60 rounded animate-pulse w-3/4"></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-2 bg-purple-100/40 rounded animate-pulse"></div>
          <div className="h-2 bg-purple-100/40 rounded animate-pulse w-5/6"></div>
        </div>
        <p className="text-xs text-purple-600 mt-3 flex items-center">
          <span className="inline-block w-1 h-1 bg-purple-600 rounded-full mr-2 animate-pulse"></span>
          AI 正在分析项目内容...
        </p>
      </div>
    );
  }

  // 显示摘要内容
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 rounded-lg p-4 border border-purple-200/60 shadow-sm hover:shadow-md transition-shadow">
      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-200/20 rounded-full blur-2xl -mr-12 -mt-12"></div>
      
      {/* 头部：图标 + 操作按钮 */}
      <div className="relative flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-purple-100 rounded-lg">
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-sm font-semibold text-gray-800">AI 智能摘要</span>
        </div>
        <div className="flex items-center space-x-1">
          {editable && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-100/80 rounded-lg transition-all"
              title="编辑摘要"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="p-1.5 text-green-600 hover:bg-green-100/80 rounded-lg transition-all"
                title="保存"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCancel}
                className="p-1.5 text-red-600 hover:bg-red-100/80 rounded-lg transition-all"
                title="取消"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <button
              onClick={onRegenerate}
              className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-100/80 rounded-lg transition-all"
              title="重新生成"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 一句话摘要 */}
      {isEditing ? (
        <textarea
          value={editedSummary}
          onChange={(e) => setEditedSummary(e.target.value)}
          className="relative w-full p-3 text-sm text-gray-700 bg-white/60 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none backdrop-blur-sm"
          rows={2}
          placeholder="编辑项目摘要..."
        />
      ) : (
        <p className="relative text-sm text-gray-700 leading-relaxed mb-3 font-medium">
          {summary?.summary}
        </p>
      )}

      {/* 功能点 */}
      {summary?.features && summary.features.length > 0 && (
        <div className="relative mb-3">
          <h4 className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">主要功能</h4>
          <ul className="space-y-1.5">
            {summary.features.map((feature, index) => (
              <li key={index} className="text-xs text-gray-600 flex items-start">
                <span className="inline-block w-1.5 h-1.5 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 适用场景 + 技术栈 */}
      <div className="relative grid grid-cols-1 gap-2 text-xs">
        {summary?.useCase && (
          <div className="bg-white/40 rounded-lg p-2 backdrop-blur-sm">
            <span className="font-bold text-gray-700">💡 适用场景：</span>
            <span className="text-gray-600 ml-1">{summary.useCase}</span>
          </div>
        )}
        {summary?.techStack && summary.techStack.length > 0 && (
          <div className="bg-white/40 rounded-lg p-2 backdrop-blur-sm">
            <span className="font-bold text-gray-700">🔧 技术栈：</span>
            <span className="text-gray-600 ml-1">{summary.techStack.join(', ')}</span>
          </div>
        )}
      </div>

      {/* 时间戳 */}
      {summary?.timestamp && (
        <p className="relative text-xs text-gray-400 mt-3">
          生成于 {new Date(summary.timestamp).toLocaleString('zh-CN')}
        </p>
      )}
    </div>
  );
}
