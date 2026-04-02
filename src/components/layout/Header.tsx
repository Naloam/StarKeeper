import { Star, Github, LogOut, Settings, Menu, Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore, useUIStore } from "../../store";
import { APP_CONFIG } from "../../config";
import LazyImage from "../common/LazyImage";
import { useTheme } from "../../contexts/ThemeContext";

export default function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    if (window.confirm("确定要退出登录吗？")) {
      logout();
      window.location.href = "/";
    }
  };

  return (
    <>
      {/* Skip Navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg"
      >
        跳转到主要内容
      </a>
      <header className="bg-surface border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-surface/95">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo + Menu Button */}
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-surface-darker transition-fast focus-ring"
                aria-label="切换侧边栏"
              >
                <Menu className="w-5 h-5 text-text-secondary" />
              </button>

              <div className="flex items-center space-x-2">
                <Star className="w-6 h-6 text-primary" strokeWidth={1.5} />
                <h1 className="text-h3 text-text-primary">{APP_CONFIG.name}</h1>
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
                  <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg hover:bg-surface-darker transition-fast focus-ring"
                    title={theme === "dark" ? "切换到亮色模式" : "切换到深色模式"}
                  >
                    {theme === "dark" ? (
                      <Sun className="w-5 h-5 text-text-secondary" strokeWidth={1.5} />
                    ) : (
                      <Moon className="w-5 h-5 text-text-secondary" strokeWidth={1.5} />
                    )}
                  </button>

                  <a
                    href={`https://github.com/${user.login}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-surface-darker transition-fast focus-ring"
                    title="查看 GitHub 主页"
                  >
                    <Github className="w-5 h-5 text-text-secondary" strokeWidth={1.5} />
                  </a>

                  <button
                    onClick={() => navigate("/settings")}
                    className="hidden sm:block p-2 rounded-lg hover:bg-surface-darker transition-fast focus-ring"
                    title="设置"
                  >
                    <Settings className="w-5 h-5 text-text-secondary" strokeWidth={1.5} />
                  </button>

                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg hover:bg-surface-darker transition-fast focus-ring"
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
    </>
  );
}
