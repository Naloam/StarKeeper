import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store';
import LoginPage from './pages/LoginPage';
import CallbackPage from './pages/CallbackPage';
import DashboardPage from './pages/DashboardPage';
import CleanupPage from './pages/CleanupPage';
import SharePage from './pages/SharePage';
import { useEffect } from 'react';
import { getStoredToken } from './utils/auth';
import { getCurrentUser } from './services/github.service';

function App() {
  const { isAuthenticated, login } = useAuthStore();

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
          const user = await getCurrentUser(token);
          console.log('✅ Token 验证成功:', user.login);
          login(user, token);
        } catch (error) {
          console.error('❌ Token 验证失败:', error);
          // Token 无效，清除
          localStorage.removeItem('github_token');
        }
      }
    };
    
    initAuth();
  }, []);

  console.log('📍 准备渲染路由，isAuthenticated:', isAuthenticated);

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
