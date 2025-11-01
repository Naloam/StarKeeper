import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * ErrorBoundary 组件
 * 捕获 React 组件树中的 JavaScript 错误，记录错误并显示降级 UI
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    // 更新 state 以显示降级 UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // 记录错误到控制台
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // 更新状态
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // 可以在这里发送错误到日志服务
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, errorCount } = this.state;
      const isDevelopment = import.meta.env.DEV;

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* 错误图标区域 */}
            <div className="bg-gradient-to-r from-red-500 to-orange-500 p-8 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full backdrop-blur-sm mb-4">
                <AlertTriangle className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                哎呀，出错了！
              </h1>
              <p className="text-white/90 text-lg">
                应用遇到了一个意外的错误
              </p>
            </div>

            {/* 错误详情区域 */}
            <div className="p-8">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">
                  发生了什么？
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  我们的应用遇到了一个意外的问题。这可能是由于网络问题、数据加载失败或程序错误导致的。
                  您可以尝试刷新页面或返回首页。
                </p>
              </div>

              {/* 错误信息（开发环境显示） */}
              {isDevelopment && error && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    错误详情 (开发模式)
                  </h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 overflow-auto max-h-64">
                    <div className="mb-3">
                      <p className="text-sm font-mono text-red-800 font-semibold">
                        {error.toString()}
                      </p>
                    </div>
                    {errorInfo && errorInfo.componentStack && (
                      <div>
                        <p className="text-xs text-red-600 mb-2 font-semibold">
                          组件堆栈：
                        </p>
                        <pre className="text-xs text-red-700 font-mono whitespace-pre-wrap">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    错误次数: {errorCount}
                  </p>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <RefreshCw className="w-5 h-5" />
                  重试
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
                >
                  <Home className="w-5 h-5" />
                  返回首页
                </button>
              </div>

              {/* 帮助信息 */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-800 mb-2">
                  💡 提示
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 检查您的网络连接是否正常</li>
                  <li>• 清除浏览器缓存并重新加载页面</li>
                  <li>• 确认 GitHub Token 是否有效</li>
                  <li>• 如果问题持续存在，请联系开发者</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
