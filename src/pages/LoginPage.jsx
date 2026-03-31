import { useState } from "react";
import { Github, Star, Sparkles, Key } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { getGitHubAuthUrl } from "../utils/auth";
import { APP_CONFIG } from "../config";
import { useAuthStore } from "../store";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [token, setToken] = useState(import.meta.env.VITE_GITHUB_TOKEN || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleOAuthLogin = () => {
    // 检查是否配置了 GitHub OAuth
    if (!import.meta.env.VITE_GITHUB_CLIENT_ID) {
      toast.error(
        "请先配置 GitHub OAuth App。\n\n1. 访问 https://github.com/settings/developers\n2. 创建 New OAuth App\n3. 配置 .env 文件",
      );
      return;
    }

    const authUrl = getGitHubAuthUrl();
    window.location.href = authUrl;
  };

  const handleTokenLogin = async () => {
    if (!token.trim()) {
      setError("请输入 GitHub Personal Access Token");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 验证 token
      const response = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `token ${token.trim()}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Token 无效或已过期");
        }
        throw new Error("验证失败，请检查 Token 权限");
      }

      const user = await response.json();

      // 登录成功 - 只使用 zustand store 存储
      // 不再使用 localStorage 的 github_token，避免双重存储
      login(user, token.trim());

      // 强制刷新页面以确保使用新的 token
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Token login error:", err);
      setError(err.message || "Token 验证失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
      {/* 装饰性几何元素 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-20 left-10 w-32 h-32 border border-accent-olive rounded-full"></div>
        <div className="absolute bottom-32 right-20 w-24 h-24 border border-accent-sand rounded-full"></div>
        <div className="absolute top-1/2 right-1/3 w-16 h-16 border border-accent-smoke rounded-full"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Logo & Title - 自然、温暖 */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Star className="w-16 h-16 text-primary" strokeWidth={1.5} />
              <div className="absolute inset-0 w-16 h-16 text-primary opacity-20 blur-sm">
                <Star className="w-16 h-16" strokeWidth={1.5} />
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-semibold text-text-primary mb-3 tracking-tight">
            {APP_CONFIG.name}
          </h1>
          <p className="text-lg text-text-secondary font-light">智能管理你的 GitHub Stars</p>
        </div>

        {/* Features - 纸张卡片质感 */}
        <div className="card mb-8 backdrop-blur-sm">
          <div className="space-y-6 mb-8">
            <Feature
              icon={<Sparkles className="w-5 h-5 text-accent-olive" strokeWidth={1.5} />}
              title="AI 自动摘要"
              description="自动生成项目摘要，快速了解项目核心功能"
            />
            <Feature
              icon={<Star className="w-5 h-5 text-accent-sand" strokeWidth={1.5} />}
              title="标签管理"
              description="用标签整理你的 stars，轻松分类查找"
            />
            <Feature
              icon={<Github className="w-5 h-5 text-accent-smoke" strokeWidth={1.5} />}
              title="隐私优先"
              description="数据存储在你的 GitHub Gist，完全由你掌控"
            />
          </div>

          {/* Login Methods */}
          {!showTokenInput ? (
            <>
              {/* OAuth Login Button - 自然按钮 */}
              <button
                onClick={handleOAuthLogin}
                className="w-full flex items-center justify-center space-x-3 bg-text-primary text-white px-6 py-3.5 rounded-soft hover:bg-text-secondary transition-all duration-200 font-medium mb-3 shadow-card hover:shadow-card-hover"
              >
                <Github className="w-5 h-5" strokeWidth={1.5} />
                <span>使用 GitHub 登录</span>
              </button>

              {/* Token Login Link - 柔和链接 */}
              <button
                onClick={() => setShowTokenInput(true)}
                className="w-full flex items-center justify-center space-x-2 text-primary hover:text-primary/80 px-6 py-2.5 rounded-soft hover:bg-primary/5 transition-all text-sm font-medium border border-transparent hover:border-border"
              >
                <Key className="w-4 h-4" strokeWidth={1.5} />
                <span>使用个人令牌登录</span>
              </button>
            </>
          ) : (
            <>
              {/* Token Input Form */}
              <div className="space-y-3 mb-3">
                <div>
                  <label
                    htmlFor="token"
                    className="block text-sm font-medium text-text-primary mb-2"
                  >
                    GitHub Personal Access Token
                  </label>
                  <input
                    id="token"
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-4 py-2.5 border border-border rounded-soft bg-surface-card text-text-primary placeholder:text-text-tertiary focus-ring transition-all"
                    onKeyPress={(e) => e.key === "Enter" && handleTokenLogin()}
                  />
                </div>

                {error && (
                  <div className="bg-danger-light border border-danger/20 rounded-soft p-3">
                    <p className="text-sm text-danger-text">{error}</p>
                  </div>
                )}

                <div className="bg-info-light border border-info/20 rounded-soft p-3">
                  <p className="text-xs text-info-text leading-relaxed">
                    <strong>💡 提示：</strong> Token 需要以下权限：
                    <code className="text-xs bg-info/10 px-1.5 py-0.5 rounded ml-1">repo</code>、
                    <code className="text-xs bg-info/10 px-1.5 py-0.5 rounded mx-1">gist</code>、
                    <code className="text-xs bg-info/10 px-1.5 py-0.5 rounded">read:user</code>
                  </p>
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo,gist,read:user&description=StarKeeper"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-info hover:text-info/80 underline mt-2 inline-block transition-colors"
                  >
                    → 创建新 Token
                  </a>
                </div>
              </div>

              <button
                onClick={handleTokenLogin}
                disabled={loading || !token.trim()}
                className="w-full flex items-center justify-center space-x-2 bg-primary text-white px-6 py-3.5 rounded-soft hover:bg-primary/90 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed mb-2 shadow-card hover:shadow-card-hover"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>验证中...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-5 h-5" strokeWidth={1.5} />
                    <span>登录</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setShowTokenInput(false);
                  setToken("");
                  setError("");
                }}
                className="w-full text-text-secondary hover:text-text-primary px-6 py-2.5 rounded-soft hover:bg-surface transition-all text-sm border border-transparent hover:border-border"
              >
                返回
              </button>
            </>
          )}

          <p className="text-xs text-text-tertiary text-center mt-6">
            登录即表示你同意我们的服务条款和隐私政策
          </p>
        </div>

        {/* Setup Notice */}
        {!import.meta.env.VITE_GITHUB_CLIENT_ID && (
          <div className="bg-warning-light border border-warning/20 rounded-soft p-4 shadow-subtle">
            <p className="text-sm text-warning-text">
              <strong>⚠️ 配置提示：</strong> 需要先配置 GitHub OAuth App。
              <a
                href="https://github.com/settings/developers"
                target="_blank"
                rel="noopener noreferrer"
                className="underline ml-1 hover:text-warning transition-colors"
              >
                去配置
              </a>
            </p>
          </div>
        )}

        {/* Footer - 柔和自然 */}
        <div className="text-center text-sm text-text-tertiary space-y-3 mt-8">
          <p className="font-light">Made with ❤️ for GitHub Users</p>
          <button
            onClick={() => {
              localStorage.clear();
              sessionStorage.clear();
              window.location.reload();
            }}
            className="text-xs text-text-muted hover:text-text-secondary underline transition-colors"
          >
            清除缓存并刷新
          </button>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, description }) {
  return (
    <div className="flex items-start space-x-3 group">
      <div className="flex-shrink-0 mt-1 transition-transform group-hover:scale-110 duration-200">
        {icon}
      </div>
      <div>
        <h3 className="font-medium text-text-primary mb-1">{title}</h3>
        <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
