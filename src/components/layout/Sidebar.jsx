import {
  Search,
  Filter,
  Tag,
  Grid,
  List,
  SortAsc,
  SortDesc,
  Star,
  Calendar,
  Type,
  X,
  FolderOpen,
  Plus,
} from "lucide-react";
import { useStarsStore, useUIStore } from "../../store";
import { useEffect, useState } from "react";
import { useDebounce } from "../../utils/performance";
import { APP_CONFIG } from "../../config";

export default function Sidebar({ onCreateCollection }) {
  const {
    searchQuery,
    setSearchQuery,
    selectedLanguages,
    setSelectedLanguages,
    selectedTags,
    setSelectedTags,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    getAllLanguages,
    getAllTags,
    filteredStars,
    collections,
    selectedCollection,
    setSelectedCollection,
  } = useStarsStore();

  const { sidebarOpen, setSidebarOpen, viewMode, setViewMode } = useUIStore();

  const collectionsEnabled = APP_CONFIG.features.collections;

  // 本地搜索输入状态
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  const languages = getAllLanguages();
  const tags = getAllTags();

  // 防抖更新搜索查询
  const debouncedSetSearch = useDebounce((value) => {
    setSearchQuery(value);
  }, 300);

  // 处理搜索输入变化
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setLocalSearchQuery(value);
    debouncedSetSearch(value);
  };

  // 同步外部 searchQuery 变化
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  // 处理窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      // 桌面端自动打开侧边栏
      if (window.innerWidth >= 1024 && !sidebarOpen) {
        setSidebarOpen(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [sidebarOpen, setSidebarOpen]);

  // 移动端点击遮罩关闭侧边栏
  const handleOverlayClick = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  // 阻止触摸滑动时关闭
  const handleSidebarClick = (e) => {
    e.stopPropagation();
  };

  const toggleLanguage = (lang) => {
    if (selectedLanguages.includes(lang)) {
      setSelectedLanguages(selectedLanguages.filter((l) => l !== lang));
    } else {
      setSelectedLanguages([...selectedLanguages, lang]);
    }
  };

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  if (!sidebarOpen) return null;

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className="fixed inset-0 bg-text-primary/30 z-40 lg:hidden backdrop-blur-sm"
        onClick={handleOverlayClick}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        role="navigation"
        aria-label="筛选和导航"
        className="fixed lg:static top-0 left-0 w-64 bg-surface-card border-r border-border flex flex-col h-screen lg:h-[calc(100vh-4rem)] overflow-hidden z-50 lg:z-auto transform transition-transform duration-180 ease-out lg:transform-none"
        onClick={handleSidebarClick}
      >
        {/* Mobile Close Button */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-h4 text-text-primary">筛选</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-surface transition-fast focus-ring"
            aria-label="关闭侧边栏"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>
        {/* Search Box */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="搜索 repositories..."
              value={localSearchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-body-sm text-text-primary placeholder:text-text-secondary focus-ring bg-surface"
            />
          </div>
        </div>

        {/* Result Count */}
        <div className="px-4 py-3 bg-surface border-b border-border">
          <p className="text-body-sm text-text-secondary">
            显示 <span className="font-semibold text-text-primary">{filteredStars.length}</span>{" "}
            个项目
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-body-sm font-medium text-text-primary">视图模式</span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg transition-fast focus-ring ${
                viewMode === "grid"
                  ? "bg-primary/10 text-primary"
                  : "bg-surface text-text-secondary hover:bg-surface-darker"
              }`}
            >
              <Grid className="w-4 h-4" strokeWidth={1.5} />
              <span className="text-body-sm">网格</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg transition-fast focus-ring ${
                viewMode === "list"
                  ? "bg-primary/10 text-primary"
                  : "bg-surface text-text-secondary hover:bg-surface-darker"
              }`}
            >
              <List className="w-4 h-4" strokeWidth={1.5} />
              <span className="text-body-sm">列表</span>
            </button>
          </div>
        </div>

        {/* Sort Options */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-body-sm font-medium text-text-primary">排序方式</span>
            <button
              onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
              className="p-1 hover:bg-surface rounded transition-fast focus-ring"
              title={sortDirection === "asc" ? "升序" : "降序"}
            >
              {sortDirection === "asc" ? (
                <SortAsc className="w-4 h-4 text-text-secondary" strokeWidth={1.5} />
              ) : (
                <SortDesc className="w-4 h-4 text-text-secondary" strokeWidth={1.5} />
              )}
            </button>
          </div>
          <div className="space-y-1">
            <button
              onClick={() => setSortBy("updated")}
              className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-body-sm transition-fast focus-ring ${
                sortBy === "updated"
                  ? "bg-primary/10 text-primary"
                  : "text-text-secondary hover:bg-surface"
              }`}
            >
              <Calendar className="w-4 h-4" strokeWidth={1.5} />
              <span>最近更新</span>
            </button>
            <button
              onClick={() => setSortBy("stars")}
              className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-body-sm transition-fast focus-ring ${
                sortBy === "stars"
                  ? "bg-primary/10 text-primary"
                  : "text-text-secondary hover:bg-surface"
              }`}
            >
              <Star className="w-4 h-4" strokeWidth={1.5} />
              <span>Star 数量</span>
            </button>
            <button
              onClick={() => setSortBy("name")}
              className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-body-sm transition-fast focus-ring ${
                sortBy === "name"
                  ? "bg-primary/10 text-primary"
                  : "text-text-secondary hover:bg-surface"
              }`}
            >
              <Type className="w-4 h-4" strokeWidth={1.5} />
              <span>项目名称</span>
            </button>
          </div>
        </div>

        {/* Scroll Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Language Filter */}
          {languages.length > 0 && (
            <div className="p-4 border-b border-border">
              <div className="flex items-center space-x-2 mb-3">
                <Filter className="w-4 h-4 text-text-secondary" strokeWidth={1.5} />
                <h3 className="text-body-sm font-medium text-text-primary">编程语言</h3>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {languages.map((lang) => (
                  <label key={lang} className="flex items-center space-x-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedLanguages.includes(lang)}
                      onChange={() => toggleLanguage(lang)}
                      className="w-4 h-4 text-primary border-border rounded focus:ring-2 focus:ring-primary focus:ring-offset-1 transition-fast"
                    />
                    <span className="text-body-sm text-text-secondary group-hover:text-text-primary transition-fast">
                      {lang}
                    </span>
                  </label>
                ))}
              </div>
              {selectedLanguages.length > 0 && (
                <button
                  onClick={() => setSelectedLanguages([])}
                  className="mt-2 text-caption text-primary hover:text-primary/80 transition-fast focus-ring rounded px-1"
                >
                  清除筛选
                </button>
              )}
            </div>
          )}

          {/* Tag Filter */}
          {tags.length > 0 && (
            <div className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Tag className="w-4 h-4 text-text-secondary" strokeWidth={1.5} />
                <h3 className="text-body-sm font-medium text-text-primary">标签</h3>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {tags.map((tag) => (
                  <label key={tag} className="flex items-center space-x-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag)}
                      onChange={() => toggleTag(tag)}
                      className="w-4 h-4 text-primary border-border rounded focus:ring-2 focus:ring-primary focus:ring-offset-1 transition-fast"
                    />
                    <span className="text-body-sm text-text-secondary group-hover:text-text-primary transition-fast">
                      {tag}
                    </span>
                  </label>
                ))}
              </div>
              {selectedTags.length > 0 && (
                <button
                  onClick={() => setSelectedTags([])}
                  className="mt-2 text-caption text-primary hover:text-primary/80 transition-fast focus-ring rounded px-1"
                >
                  清除筛选
                </button>
              )}
            </div>
          )}

          {/* Collections 收藏夹 */}
          {collectionsEnabled && (
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <FolderOpen className="w-4 h-4 text-text-secondary" strokeWidth={1.5} />
                  <h3 className="text-body-sm font-medium text-text-primary">收藏夹</h3>
                </div>
                <button
                  onClick={() => onCreateCollection?.()}
                  className="p-1 hover:bg-surface rounded transition-colors"
                  title="新建收藏夹"
                >
                  <Plus className="w-4 h-4 text-text-secondary" />
                </button>
              </div>

              {/* 全部选项 */}
              <button
                onClick={() => setSelectedCollection(null)}
                className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-body-sm transition-fast mb-1 ${
                  selectedCollection === null
                    ? "bg-primary/10 text-primary"
                    : "text-text-secondary hover:bg-surface"
                }`}
              >
                <span>全部项目</span>
                <span className="ml-auto text-xs text-text-secondary">{filteredStars.length}</span>
              </button>

              {/* 收藏夹列表 */}
              {collections.map((col) => (
                <button
                  key={col.id}
                  onClick={() =>
                    setSelectedCollection(selectedCollection === col.id ? null : col.id)
                  }
                  className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-body-sm transition-fast ${
                    selectedCollection === col.id
                      ? "bg-primary/10 text-primary"
                      : "text-text-secondary hover:bg-surface"
                  }`}
                >
                  <FolderOpen className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{col.name}</span>
                  <span className="ml-auto text-xs text-text-secondary shrink-0">
                    {col.repoIds.length}
                  </span>
                </button>
              ))}

              {collections.length === 0 && (
                <p className="text-xs text-text-secondary text-center py-2">点击 + 创建收藏夹</p>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
