import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store';
import LoginPage from './pages/LoginPage';
import CallbackPage from './pages/CallbackPage';
import DashboardPage from './pages/DashboardPage';
import { useEffect } from 'react';
import { getStoredToken } from './utils/auth';
import { getCurrentUser } from './services/github.service';

function App() {
  const { isAuthenticated, login } = useAuthStore();

  // 应用启动时检查本地存储的 token
  useEffect(() => {
    const initAuth = async () => {
      const token = getStoredToken();
      if (token) {
        try {
          const user = await getCurrentUser(token);
          login(user, token);
        } catch (error) {
          console.error('Token 验证失败:', error);
          // Token 无效，清除
          localStorage.removeItem('github_token');
        }
      }
    };
    
    initAuth();
  }, []);

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
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
