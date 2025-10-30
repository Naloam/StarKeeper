import { X, Download, FileText, Table, Code } from 'lucide-react';
import { useState } from 'react';
import { 
  exportAndDownloadMarkdown, 
  exportAndDownloadCSV, 
  exportAndDownloadJSON,
  getExportStats 
} from '../../services/export.service';

/**
 * 导出模态框组件
 */
export default function ExportModal({ isOpen, onClose, stars, metadata }) {
  const [selectedFormat, setSelectedFormat] = useState('markdown');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const stats = getExportStats(stars, metadata);

  const formats = [
    {
      id: 'markdown',
      name: 'Markdown',
      icon: FileText,
      description: '按标签分类，包含 AI 摘要和笔记',
      extension: '.md',
      color: 'blue',
    },
    {
      id: 'csv',
      name: 'CSV',
      icon: Table,
      description: '表格格式，适合 Excel 打开',
      extension: '.csv',
      color: 'green',
    },
    {
      id: 'json',
      name: 'JSON',
      icon: Code,
      description: '完整数据，包含所有元数据',
      extension: '.json',
      color: 'purple',
    },
  ];

  const handleExport = () => {
    setIsExporting(true);
    
    setTimeout(() => {
      try {
        switch (selectedFormat) {
          case 'markdown':
            exportAndDownloadMarkdown(stars, metadata);
            break;
          case 'csv':
            exportAndDownloadCSV(stars, metadata);
            break;
          case 'json':
            exportAndDownloadJSON(stars, metadata);
            break;
          default:
            break;
        }
        
        // 延迟关闭以显示成功动画
        setTimeout(() => {
          onClose();
          setIsExporting(false);
        }, 500);
      } catch (error) {
        console.error('导出失败:', error);
        alert('导出失败：' + error.message);
        setIsExporting(false);
      }
    }, 300);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">导出 Stars 数据</h2>
              <p className="text-sm text-gray-500">选择导出格式并下载</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Stats */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">数据统计</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-600">项目总数</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <p className="text-2xl font-bold text-primary-600">{stats.tagged}</p>
              <p className="text-xs text-gray-600">已添加标签</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <p className="text-2xl font-bold text-purple-600">{stats.withAISummary}</p>
              <p className="text-xs text-gray-600">有 AI 摘要</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <p className="text-2xl font-bold text-green-600">{stats.withNotes}</p>
              <p className="text-xs text-gray-600">有笔记</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <p className="text-2xl font-bold text-orange-600">{stats.totalTags}</p>
              <p className="text-xs text-gray-600">标签总数</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <p className="text-2xl font-bold text-gray-400">{stats.untagged}</p>
              <p className="text-xs text-gray-600">未分类</p>
            </div>
          </div>
        </div>

        {/* Format Selection */}
        <div className="p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">选择导出格式</h3>
          <div className="space-y-3">
            {formats.map((format) => {
              const Icon = format.icon;
              const isSelected = selectedFormat === format.id;
              
              return (
                <button
                  key={format.id}
                  onClick={() => setSelectedFormat(format.id)}
                  className={`w-full flex items-start space-x-4 p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? `border-${format.color}-500 bg-${format.color}-50`
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? `bg-${format.color}-100`
                        : 'bg-gray-100'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        isSelected
                          ? `text-${format.color}-600`
                          : 'text-gray-600'
                      }`}
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold text-gray-900">{format.name}</h4>
                      <span className="text-xs text-gray-500">{format.extension}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{format.description}</p>
                  </div>
                  {isSelected && (
                    <div className="flex-shrink-0">
                      <div className={`w-5 h-5 rounded-full bg-${format.color}-500 flex items-center justify-center`}>
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500">
            导出文件名: github-stars-{new Date().toISOString().split('T')[0]}
            {formats.find(f => f.id === selectedFormat)?.extension}
          </p>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center space-x-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>导出中...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>导出</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
