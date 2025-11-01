import toast from 'react-hot-toast';

/**
 * Toast 通知工具函数
 * 基于 react-hot-toast 的封装，提供统一的通知样式和接口
 */

// 默认配置
const defaultOptions = {
  duration: 4000,
  position: 'top-right',
  style: {
    background: '#fff',
    color: '#363636',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
    maxWidth: '500px',
  },
};

/**
 * 成功提示
 * @param {string} message - 提示消息
 * @param {object} options - 可选配置
 */
export const showSuccess = (message, options = {}) => {
  return toast.success(message, {
    ...defaultOptions,
    ...options,
    iconTheme: {
      primary: '#10B981',
      secondary: '#fff',
    },
  });
};

/**
 * 错误提示
 * @param {string} message - 错误消息
 * @param {object} options - 可选配置
 */
export const showError = (message, options = {}) => {
  return toast.error(message, {
    ...defaultOptions,
    duration: 5000, // 错误信息显示更长时间
    ...options,
    iconTheme: {
      primary: '#EF4444',
      secondary: '#fff',
    },
  });
};

/**
 * 警告提示
 * @param {string} message - 警告消息
 * @param {object} options - 可选配置
 */
export const showWarning = (message, options = {}) => {
  return toast(message, {
    ...defaultOptions,
    ...options,
    icon: '⚠️',
    style: {
      ...defaultOptions.style,
      borderLeft: '4px solid #F59E0B',
    },
  });
};

/**
 * 信息提示
 * @param {string} message - 信息消息
 * @param {object} options - 可选配置
 */
export const showInfo = (message, options = {}) => {
  return toast(message, {
    ...defaultOptions,
    ...options,
    icon: 'ℹ️',
    style: {
      ...defaultOptions.style,
      borderLeft: '4px solid #3B82F6',
    },
  });
};

/**
 * 加载提示
 * @param {string} message - 加载消息
 * @param {object} options - 可选配置
 * @returns {string} toast ID，可用于后续更新或关闭
 */
export const showLoading = (message, options = {}) => {
  return toast.loading(message, {
    ...defaultOptions,
    ...options,
  });
};

/**
 * Promise 提示
 * 根据 Promise 状态自动显示不同的提示
 * @param {Promise} promise - Promise 对象
 * @param {object} messages - 不同状态的消息 { loading, success, error }
 * @param {object} options - 可选配置
 */
export const showPromise = (promise, messages, options = {}) => {
  return toast.promise(
    promise,
    {
      loading: messages.loading || '加载中...',
      success: messages.success || '操作成功！',
      error: (err) => {
        // 处理错误消息
        if (typeof messages.error === 'function') {
          return messages.error(err);
        }
        return messages.error || err?.message || '操作失败！';
      },
    },
    {
      ...defaultOptions,
      ...options,
    }
  );
};

/**
 * 自定义提示
 * @param {string} message - 消息
 * @param {object} options - 可选配置
 */
export const showCustom = (message, options = {}) => {
  return toast(message, {
    ...defaultOptions,
    ...options,
  });
};

/**
 * 关闭指定的 toast
 * @param {string} toastId - toast ID
 */
export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

/**
 * 关闭所有 toast
 */
export const dismissAll = () => {
  toast.dismiss();
};

/**
 * API 错误处理
 * 根据错误类型显示相应的提示
 * @param {Error} error - 错误对象
 * @param {string} defaultMessage - 默认错误消息
 */
export const handleApiError = (error, defaultMessage = '操作失败') => {
  console.error('API Error:', error);

  // GitHub API 特定错误
  if (error.status === 401) {
    showError('身份验证失败，请重新登录');
    return;
  }

  if (error.status === 403) {
    const isRateLimit = error.response?.headers?.['x-ratelimit-remaining'] === '0';
    if (isRateLimit) {
      const resetTime = error.response?.headers?.['x-ratelimit-reset'];
      const resetDate = resetTime ? new Date(resetTime * 1000) : null;
      const resetStr = resetDate ? resetDate.toLocaleTimeString('zh-CN') : '稍后';
      showWarning(`API 调用次数已达上限，请在 ${resetStr} 后重试`);
      return;
    }
    showError('没有权限执行此操作');
    return;
  }

  if (error.status === 404) {
    showError('请求的资源不存在');
    return;
  }

  if (error.status === 422) {
    showError('请求参数有误，请检查后重试');
    return;
  }

  if (error.status >= 500) {
    showError('服务器错误，请稍后重试');
    return;
  }

  // 网络错误
  if (!error.status && error.message === 'Network Error') {
    showError('网络连接失败，请检查网络设置');
    return;
  }

  // 超时错误
  if (error.code === 'ECONNABORTED') {
    showError('请求超时，请稍后重试');
    return;
  }

  // 默认错误消息
  const message = error.message || error.toString() || defaultMessage;
  showError(message);
};

/**
 * 网络状态监听
 * 自动显示网络状态变化提示
 */
export const setupNetworkListener = () => {
  if (typeof window === 'undefined') return;

  window.addEventListener('online', () => {
    showSuccess('网络已连接');
  });

  window.addEventListener('offline', () => {
    showWarning('网络连接已断开，部分功能可能无法使用');
  });
};

// 导出默认的 toast 实例，用于高级用法
export { toast };

export default {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
  loading: showLoading,
  promise: showPromise,
  custom: showCustom,
  dismiss: dismissToast,
  dismissAll,
  handleApiError,
  setupNetworkListener,
};
