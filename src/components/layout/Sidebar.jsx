import { Search, Filter, Tag, Grid, List, SortAsc } from 'lucide-react';
import { useStarsStore, useUIStore } from '../../store';

export default function Sidebar() {
  const {
    searchQuery,
    setSearchQuery,
    selectedLanguages,
    setSelectedLanguages,
    selectedTags,
    setSelectedTags,
    getAllLanguages,
    getAllTags,
    filteredStars,
  } = useStarsStore();

  const { sidebarOpen, viewMode, setViewMode } = useUIStore();

  const languages = getAllLanguages();
  const tags = getAllTags();

  const toggleLanguage = (lang) => {
    if (selectedLanguages.includes(lang)) {
      setSelectedLanguages(selectedLanguages.filter(l => l !== lang));
    } else {
      setSelectedLanguages([...selectedLanguages, lang]);
    }
  };

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  if (!sidebarOpen) return null;

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* 搜索框 */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索 repositories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* 结果统计 */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <p className="text-sm text-gray-600">
          显示 <span className="font-semibold text-gray-900">{filteredStars.length}</span> 个项目
        </p>
      </div>

      {/* 视图模式切换 */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">视图模式</span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              viewMode === 'grid'
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span className="text-sm">网格</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              viewMode === 'list'
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <List className="w-4 h-4" />
            <span className="text-sm">列表</span>
          </button>
        </div>
      </div>

      {/* 滚动区域 */}
      <div className="flex-1 overflow-y-auto">
        {/* 语言过滤 */}
        {languages.length > 0 && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2 mb-3">
              <Filter className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-medium text-gray-700">编程语言</h3>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {languages.map((lang) => (
                <label key={lang} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedLanguages.includes(lang)}
                    onChange={() => toggleLanguage(lang)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">{lang}</span>
                </label>
              ))}
            </div>
            {selectedLanguages.length > 0 && (
              <button
                onClick={() => setSelectedLanguages([])}
                className="mt-2 text-xs text-primary-600 hover:text-primary-700"
              >
                清除筛选
              </button>
            )}
          </div>
        )}

        {/* 标签过滤 */}
        {tags.length > 0 && (
          <div className="p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Tag className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-medium text-gray-700">标签</h3>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {tags.map((tag) => (
                <label key={tag} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(tag)}
                    onChange={() => toggleTag(tag)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">{tag}</span>
                </label>
              ))}
            </div>
            {selectedTags.length > 0 && (
              <button
                onClick={() => setSelectedTags([])}
                className="mt-2 text-xs text-primary-600 hover:text-primary-700"
              >
                清除筛选
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
