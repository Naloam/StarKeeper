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
    <header className="bg-white border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo + Menu Button */}
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-surface transition-fast focus-ring"
              aria-label="切换侧边栏"
            >
              <Menu className="w-5 h-5 text-text-secondary" />
            </button>
            
            <div className="flex items-center space-x-2">
              <Star className="w-6 h-6 text-primary" strokeWidth={1.5} />
              <h1 className="text-h3 text-text-primary">
                {APP_CONFIG.name}
              </h1>
            </div>
          </div>

          {/* User Info */}
          {user && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <LazyImage
                  src={user.avatarUrl}
                  alt={user.name || user.login}
                  className="w-8 h-8 rounded-full ring-1 ring-border"
                />
                <div className="hidden lg:block">
                  <p className="text-body-sm font-medium text-text-primary">
                    {user.name || user.login}
                  </p>
                  <p className="text-caption text-text-secondary">@{user.login}</p>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <a
                  href={`https://github.com/${user.login}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg hover:bg-surface transition-fast focus-ring"
                  title="查看 GitHub 主页"
                >
                  <Github className="w-5 h-5 text-text-secondary" strokeWidth={1.5} />
                </a>

                <button
                  className="hidden sm:block p-2 rounded-lg hover:bg-surface transition-fast focus-ring"
                  title="设置"
                >
                  <Settings className="w-5 h-5 text-text-secondary" strokeWidth={1.5} />
                </button>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg hover:bg-surface transition-fast focus-ring"
                  title="退出登录"
                >
                  <LogOut className="w-5 h-5 text-text-secondary" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
