import { useState } from 'react';
import { Github, Star, Sparkles, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getGitHubAuthUrl } from '../utils/auth';
import { APP_CONFIG } from '../config';
import { useAuthStore } from '../store';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleOAuthLogin = () => {
    // 检查是否配置了 GitHub OAuth
    if (!import.meta.env.VITE_GITHUB_CLIENT_ID) {
      alert('请先配置 GitHub OAuth App。\n\n1. 访问 https://github.com/settings/developers\n2. 创建 New OAuth App\n3. 配置 .env 文件');
      return;
    }

    const authUrl = getGitHubAuthUrl();
    window.location.href = authUrl;
  };

  const handleTokenLogin = async () => {
    if (!token.trim()) {
      setError('请输入 GitHub Personal Access Token');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 验证 token
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${token.trim()}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Token 无效或已过期');
        }
        throw new Error('验证失败，请检查 Token 权限');
      }

      const user = await response.json();

      // 登录成功
      login(token.trim(), user);
      navigate('/dashboard');
    } catch (err) {
      console.error('Token login error:', err);
      setError(err.message || 'Token 验证失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Star className="w-20 h-20 text-primary-600 fill-primary-600 animate-pulse" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {APP_CONFIG.name}
          </h1>
          <p className="text-lg text-gray-600">
            智能管理你的 GitHub Stars
          </p>
        </div>

        {/* Features */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="space-y-4 mb-8">
            <Feature
              icon={<Sparkles className="w-5 h-5 text-primary-600" />}
              title="AI 自动摘要"
              description="自动生成项目摘要，快速了解项目核心功能"
            />
            <Feature
              icon={<Star className="w-5 h-5 text-primary-600" />}
              title="标签管理"
              description="用标签整理你的 stars，轻松分类查找"
            />
            <Feature
              icon={<Github className="w-5 h-5 text-primary-600" />}
              title="隐私优先"
              description="数据存储在你的 GitHub Gist，完全由你掌控"
            />
          </div>

          {/* Login Methods */}
          {!showTokenInput ? (
            <>
              {/* OAuth Login Button */}
              <button
                onClick={handleOAuthLogin}
                className="w-full flex items-center justify-center space-x-3 bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium mb-3"
              >
                <Github className="w-5 h-5" />
                <span>使用 GitHub 登录</span>
              </button>

              {/* Token Login Link */}
              <button
                onClick={() => setShowTokenInput(true)}
                className="w-full flex items-center justify-center space-x-2 text-primary-600 hover:text-primary-700 px-6 py-2 rounded-lg hover:bg-primary-50 transition-colors text-sm font-medium"
              >
                <Key className="w-4 h-4" />
                <span>使用个人令牌登录</span>
              </button>
            </>
          ) : (
            <>
              {/* Token Input Form */}
              <div className="space-y-3 mb-3">
                <div>
                  <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-2">
                    GitHub Personal Access Token
                  </label>
                  <input
                    id="token"
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && handleTokenLogin()}
                  />
                </div>
                
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    <strong>💡 提示：</strong> Token 需要以下权限：
                    <code className="text-xs bg-blue-100 px-1 rounded ml-1">repo</code>、
                    <code className="text-xs bg-blue-100 px-1 rounded mx-1">gist</code>、
                    <code className="text-xs bg-blue-100 px-1 rounded">read:user</code>
                  </p>
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo,gist,read:user&description=StarKeeper"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                  >
                    → 创建新 Token
                  </a>
                </div>
              </div>

              <button
                onClick={handleTokenLogin}
                disabled={loading || !token.trim()}
                className="w-full flex items-center justify-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed mb-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>验证中...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-5 h-5" />
                    <span>登录</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setShowTokenInput(false);
                  setToken('');
                  setError('');
                }}
                className="w-full text-gray-600 hover:text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                返回
              </button>
            </>
          )}

          <p className="text-xs text-gray-500 text-center mt-4">
            登录即表示你同意我们的服务条款和隐私政策
          </p>
        </div>

        {/* Setup Notice */}
        {!import.meta.env.VITE_GITHUB_CLIENT_ID && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ 配置提示：</strong> 需要先配置 GitHub OAuth App。
              <a
                href="https://github.com/settings/developers"
                target="_blank"
                rel="noopener noreferrer"
                className="underline ml-1"
              >
                去配置
              </a>
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>Made with ❤️ for GitHub Users</p>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, description }) {
  return (
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0 mt-1">
        {icon}
      </div>
      <div>
        <h3 className="font-medium text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}
