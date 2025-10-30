import { Github, Star, Sparkles } from 'lucide-react';
import { getGitHubAuthUrl } from '../utils/auth';
import { APP_CONFIG } from '../config';

export default function LoginPage() {
  const handleLogin = () => {
    // 检查是否配置了 GitHub OAuth
    if (!import.meta.env.VITE_GITHUB_CLIENT_ID) {
      alert('请先配置 GitHub OAuth App。\n\n1. 访问 https://github.com/settings/developers\n2. 创建 New OAuth App\n3. 配置 .env 文件');
      return;
    }

    const authUrl = getGitHubAuthUrl();
    window.location.href = authUrl;
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

          {/* Login Button */}
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center space-x-3 bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            <Github className="w-5 h-5" />
            <span>使用 GitHub 登录</span>
          </button>

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
