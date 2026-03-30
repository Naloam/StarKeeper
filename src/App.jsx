import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./store";
import LoginPage from "./pages/LoginPage";
import CallbackPage from "./pages/CallbackPage";
import DashboardPage from "./pages/DashboardPage";
import CleanupPage from "./pages/CleanupPage";
import DeduplicationPage from "./pages/DeduplicationPage";
import SharePage from "./pages/SharePage";
import ErrorBoundary from "./components/common/ErrorBoundary";
import PWAInstallPrompt from "./components/common/PWAInstallPrompt";
import OfflineIndicator from "./components/common/OfflineIndicator";
import { useEffect, useState } from "react";
import { validateGitHubToken } from "./utils/auth";
import { setupNetworkListener } from "./utils/toast";

function App() {
  const { isAuthenticated, accessToken, login, logout } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  // 设置网络状态监听
  useEffect(() => {
    setupNetworkListener();
  }, []);

  // 应用启动时检查 store 中的 token
  useEffect(() => {
    const initAuth = async () => {
      // 从 zustand store 获取 token（已经 persist）
      const token = accessToken;

      if (token) {
        try {
          const result = await validateGitHubToken(token);

          if (result.valid) {
            // Token 有效，更新用户信息（如果需要）
            if (!isAuthenticated) {
              login(result.user, token);
            }
          } else {
            // Token 无效，通过 zustand 的 logout 清除数据
            logout();
          }
        } catch (error) {
          console.error("Token 验证异常:", error);
          logout();
        }
      }

      setIsChecking(false);
    };

    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    <ErrorBoundary>
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
          <Route
            path="/deduplication"
            element={isAuthenticated ? <DeduplicationPage /> : <Navigate to="/" />}
          />
          <Route path="/share/:shareId" element={<SharePage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>

      {/* PWA 安装提示 */}
      <PWAInstallPrompt />

      {/* 离线状态指示器 */}
      <OfflineIndicator />

      {/* Toast 通知组件 */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          // 默认配置
          duration: 4000,
          style: {
            background: "#fff",
            color: "#363636",
            borderRadius: "12px",
            padding: "16px",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
            maxWidth: "500px",
          },
          // 成功样式
          success: {
            iconTheme: {
              primary: "#10B981",
              secondary: "#fff",
            },
          },
          // 错误样式
          error: {
            duration: 5000,
            iconTheme: {
              primary: "#EF4444",
              secondary: "#fff",
            },
          },
        }}
      />
    </ErrorBoundary>
  );
}

export default App;
