import { useState, useEffect } from 'react';
import { X, Globe, Lock, Copy, Check, Share2, ExternalLink } from 'lucide-react';

/**
 * 分享功能 Modal
 * 允许用户公开分享他们的 Stars Collection
 */
export default function ShareModal({ isOpen, onClose, shareConfig, onUpdateShare }) {
  const [isPublic, setIsPublic] = useState(shareConfig?.isPublic || false);
  const [shareTitle, setShareTitle] = useState(shareConfig?.shareTitle || '');
  const [shareDescription, setShareDescription] = useState(shareConfig?.shareDescription || '');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsPublic(shareConfig?.isPublic || false);
      setShareTitle(shareConfig?.shareTitle || '');
      setShareDescription(shareConfig?.shareDescription || '');
      setCopied(false);
    }
  }, [isOpen, shareConfig]);

  if (!isOpen) return null;

  const shareUrl = shareConfig?.shareId
    ? `${window.location.origin}/share/${shareConfig.shareId}`
    : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdateShare({
        isPublic,
        shareTitle: shareTitle.trim() || 'My Stars Collection',
        shareDescription: shareDescription.trim(),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenShare = () => {
    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-info-light rounded-lg">
              <Share2 className="w-5 h-5 text-info-text" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">
                分享 Collection
              </h2>
              <p className="text-sm text-text-secondary">
                让其他人看到你精心整理的项目收藏
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-darker rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* 公开/私有切换 */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-text-primary">
              分享状态
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setIsPublic(false)}
                className={`flex items-center gap-3 p-4 border-2 rounded-lg transition-all ${
                  !isPublic
                    ? 'border-info bg-info-light'
                    : 'border-border hover:border-text-secondary'
                }`}
              >
                <Lock className={`w-5 h-5 ${!isPublic ? 'text-info-text' : 'text-text-muted'}`} />
                <div className="text-left">
                  <div className={`font-medium ${!isPublic ? 'text-info-text' : 'text-text-primary'}`}>
                    私有
                  </div>
                  <div className="text-xs text-text-secondary">
                    只有你可以访问
                  </div>
                </div>
              </button>

              <button
                onClick={() => setIsPublic(true)}
                className={`flex items-center gap-3 p-4 border-2 rounded-lg transition-all ${
                  isPublic
                    ? 'border-info bg-info-light'
                    : 'border-border hover:border-text-secondary'
                }`}
              >
                <Globe className={`w-5 h-5 ${isPublic ? 'text-info-text' : 'text-text-muted'}`} />
                <div className="text-left">
                  <div className={`font-medium ${isPublic ? 'text-info-text' : 'text-text-primary'}`}>
                    公开
                  </div>
                  <div className="text-xs text-text-secondary">
                    任何人都可以查看
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* 分享标题 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              Collection 标题
            </label>
            <input
              type="text"
              value={shareTitle}
              onChange={(e) => setShareTitle(e.target.value)}
              placeholder="例如：我的前端开发工具箱"
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-info focus:border-transparent bg-surface text-text-primary"
            />
          </div>

          {/* 分享描述 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              描述（可选）
            </label>
            <textarea
              value={shareDescription}
              onChange={(e) => setShareDescription(e.target.value)}
              placeholder="简单介绍一下这个 collection..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
            />
          </div>

          {/* 分享链接 */}
          {isPublic && shareUrl && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                分享链接
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 text-sm"
                />
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg transition-colors flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm">已复制</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span className="text-sm">复制</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleOpenShare}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="text-sm">预览</span>
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                💡 链接将在保存后生成
              </p>
            </div>
          )}

          {/* 提示：需要先保存 */}
          {isPublic && !shareUrl && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                💡 点击"保存设置"后将生成分享链接
              </p>
            </div>
          )}

          {/* 提示信息 */}
          {isPublic && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 公开后，任何人都可以通过链接查看你的 Stars Collection（只读模式）
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>保存中...</span>
              </>
            ) : (
              <span>保存设置</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
