import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { parseOAuthCallback, validateState } from "../utils/auth";
import { useAuthStore } from "../store";
import { getCurrentUser } from "../services/github.service";

export default function CallbackPage() {
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // 解析 URL 参数
      const {
        code,
        state,
        error: oauthError,
        errorDescription,
      } = parseOAuthCallback(window.location.href);

      if (oauthError) {
        throw new Error(errorDescription || oauthError);
      }

      if (!code) {
        throw new Error("缺少授权码");
      }

      // 验证 state（CSRF 保护）
      if (!validateState(state)) {
        throw new Error("State 验证失败，可能存在安全风险");
      }

      // 通过 Vercel Serverless Function 交换 token
      const tokenResponse = await fetch("/api/auth/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok || !tokenData.access_token) {
        throw new Error(tokenData.error || "获取 access token 失败");
      }

      const user = await getCurrentUser(tokenData.access_token);
      login(user, tokenData.access_token);
      navigate("/dashboard");
    } catch (err) {
      console.error("OAuth 回调处理失败:", err);
      setError(err.message);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">❌</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">登录失败</h2>
            <p className="text-gray-600 mb-6 whitespace-pre-line">{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => navigate("/")}
                className="w-full bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                返回首页
              </button>

              {import.meta.env.DEV && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
                  <p className="text-sm font-medium text-yellow-900 mb-2">开发模式快速设置：</p>
                  <ol className="text-xs text-yellow-800 space-y-1 list-decimal list-inside">
                    <li>创建 GitHub Personal Access Token</li>
                    <li>打开浏览器控制台</li>
                    <li>执行以下代码：</li>
                  </ol>
                  <pre className="mt-2 text-xs bg-yellow-100 p-2 rounded overflow-x-auto">
                    {`localStorage.setItem(
  'github_token', 
  btoa('ghp_your_token_here')
);
window.location.href = '/';`}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">正在登录...</h2>
        <p className="text-gray-600">请稍候，正在处理您的授权信息</p>
      </div>
    </div>
  );
}
