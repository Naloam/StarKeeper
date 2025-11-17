import { Star, Github, LogOut, Settings, Menu, X } from 'lucide-react';
import { useAuthStore, useUIStore } from '../../store';
import { APP_CONFIG } from '../../config';
import LazyImage from '../common/LazyImage';

export default function Header() {
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  const handleLogout = () => {
    if (window.confirm('确定要退出登录吗？')) {
      logout();
      window.location.href = '/';
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 左侧：Logo + 菜单按钮 */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hover:bg-transparent"
              aria-label="切换侧边栏"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            
            <div className="flex items-center space-x-2">
              <Star className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600 fill-primary-600" />
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                {APP_CONFIG.name}
              </h1>
            </div>
          </div>

          {/* 右侧：用户信息 */}
          {user && (
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <LazyImage
                  src={user.avatarUrl}
                  alt={user.name || user.login}
                  className="w-8 h-8 rounded-full"
                />
                <div className="hidden lg:block text-sm">
                  <p className="font-medium text-gray-900">
                    {user.name || user.login}
                  </p>
                  <p className="text-gray-500">@{user.login}</p>
                </div>
              </div>

              <div className="flex items-center space-x-1 sm:space-x-2">
                <a
                  href={`https://github.com/${user.login}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="查看 GitHub 主页"
                >
                  <Github className="w-5 h-5 text-gray-600" />
                </a>

                <button
                  className="hidden sm:block p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="设置"
                >
                  <Settings className="w-5 h-5 text-gray-600" />
                </button>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="退出登录"
                >
                  <LogOut className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
