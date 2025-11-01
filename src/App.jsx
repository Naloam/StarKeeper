import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store';
import LoginPage from './pages/LoginPage';
import CallbackPage from './pages/CallbackPage';
import DashboardPage from './pages/DashboardPage';
import CleanupPage from './pages/CleanupPage';
import SharePage from './pages/SharePage';
import { useEffect, useState } from 'react';
import { getStoredToken, clearStoredToken, validateGitHubToken } from './utils/auth';

function App() {
  const { isAuthenticated, login, logout } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  console.log('🚀 App 组件已加载');
  console.log('🔑 认证状态:', isAuthenticated);

  // 应用启动时检查本地存储的 token
  useEffect(() => {
    console.log('⚡ useEffect 执行 - 检查 token');
    const initAuth = async () => {
      const token = getStoredToken();
      console.log('🎫 存储的 token:', token ? '存在' : '不存在');
      
      if (token) {
        try {
          console.log('🔍 验证 token...');
          const result = await validateGitHubToken(token);
          
          if (result.valid) {
            console.log('✅ Token 验证成功:', result.user.login);
            login(result.user, token);
          } else {
            console.warn('❌ Token 验证失败:', result.error);
            // Token 无效，清除所有数据
            clearStoredToken();
            logout();
            
            // 清除 zustand persist 数据
            localStorage.removeItem('starkeeper-auth');
            
            // 显示友好提示
            if (result.error.includes('无效') || result.error.includes('过期')) {
              console.log('🧹 已清除失效的 Token，请重新登录');
            }
          }
        } catch (error) {
          console.error('❌ Token 验证异常:', error);
          // 验证失败，清除 token
          clearStoredToken();
          logout();
        }
      }
      
      setIsChecking(false);
    };
    
    initAuth();
  }, [login, logout]);

  console.log('📍 准备渲染路由，isAuthenticated:', isAuthenticated);

  // 显示加载状态
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />}
        />
        <Route path="/auth/callback" element={<CallbackPage />} />
        <Route
          path="/dashboard"
          element={isAuthenticated ? <DashboardPage /> : <Navigate to="/" />}
        />
        <Route
          path="/cleanup"
          element={isAuthenticated ? <CleanupPage /> : <Navigate to="/" />}
        />
        <Route path="/share/:shareId" element={<SharePage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
