import { useState, useEffect } from "react";
import { X, Download, Star } from "lucide-react";

/**
 * PWA 安装提示组件
 * 在支持 PWA 的浏览器中显示安装横幅
 */
export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // 检查是否已经安装或已经关闭过提示
    const isInstalled = window.matchMedia("(display-mode: standalone)").matches;
    const wasDismissed = localStorage.getItem("pwa-install-dismissed");

    if (isInstalled || wasDismissed) {
      return;
    }

    // 监听 beforeinstallprompt 事件
    const handleBeforeInstallPrompt = (e) => {
      // 阻止默认的浏览器安装提示
      e.preventDefault();
      // 保存事件以便稍后触发
      setDeferredPrompt(e);
      // 延迟 3 秒显示我们的自定义提示
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 监听应用安装事件
    const handleAppInstalled = () => {
      console.log("✅ PWA 已安装");
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // 显示浏览器的安装提示
    deferredPrompt.prompt();

    // 等待用户响应
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`用户选择: ${outcome}`);

    // 清理
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // 记住用户关闭了提示（7天内不再显示）
    const dismissedUntil = Date.now() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem("pwa-install-dismissed", dismissedUntil);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-2xl p-4 text-white">
        {/* 关闭按钮 */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
          aria-label="关闭"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 图标和标题 */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Star className="w-6 h-6" />
          </div>
          <div className="flex-1 pt-1">
            <h3 className="font-bold text-lg mb-1">安装 StarKeeper</h3>
            <p className="text-sm text-white/90">获得更快的访问速度和离线使用能力</p>
          </div>
        </div>

        {/* 功能列表 */}
        <ul className="text-sm space-y-1 mb-4 text-white/90">
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            <span>⚡ 闪电般的加载速度</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            <span>📱 离线访问已加载的数据</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            <span>🎯 桌面快捷方式</span>
          </li>
        </ul>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <button
            onClick={handleInstallClick}
            className="flex-1 bg-white text-indigo-600 px-4 py-2.5 rounded-lg font-semibold 
                     hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            立即安装
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2.5 rounded-lg font-medium hover:bg-white/10 transition-colors"
          >
            稍后
          </button>
        </div>
      </div>
    </div>
  );
}
