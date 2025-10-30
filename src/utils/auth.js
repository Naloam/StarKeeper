import { GITHUB_CONFIG } from '../config';

/**
 * 生成 GitHub OAuth 授权 URL
 * @returns {string}
 */
export function getGitHubAuthUrl() {
  const params = new URLSearchParams({
    client_id: GITHUB_CONFIG.clientId,
    redirect_uri: GITHUB_CONFIG.redirectUri,
    scope: GITHUB_CONFIG.scopes.join(' '),
    state: generateRandomState(),
  });
  
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

/**
 * 生成随机 state 用于 CSRF 保护
 * @returns {string}
 */
function generateRandomState() {
  const state = Math.random().toString(36).substring(2, 15);
  sessionStorage.setItem('github_oauth_state', state);
  return state;
}

/**
 * 验证 OAuth 回调中的 state
 * @param {string} state
 * @returns {boolean}
 */
export function validateState(state) {
  const savedState = sessionStorage.getItem('github_oauth_state');
  sessionStorage.removeItem('github_oauth_state');
  return state === savedState;
}

/**
 * 从 URL 中提取 OAuth 回调参数
 * @param {string} url
 * @returns {Object} { code, state, error }
 */
export function parseOAuthCallback(url) {
  const params = new URLSearchParams(new URL(url).search);
  return {
    code: params.get('code'),
    state: params.get('state'),
    error: params.get('error'),
    errorDescription: params.get('error_description'),
  };
}

/**
 * 使用 code 交换 access token
 * 注意：这个操作需要在后端完成，因为需要 client_secret
 * 这里仅作为示例，实际应该调用后端 API
 * @param {string} code
 * @returns {Promise<Object>}
 */
export async function exchangeCodeForToken(code) {
  // TODO: 实现后端 API endpoint
  // 因为 GitHub OAuth 需要 client_secret，不能在前端直接调用
  
  // 临时方案：使用 GitHub OAuth Proxy 或者 Serverless Function
  // 这里返回模拟数据，实际需要替换
  
  throw new Error('此功能需要后端支持。请先配置 GitHub OAuth App 并创建后端 API。');
  
  // 实际实现示例：
  // const response = await fetch('/api/auth/github/callback', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ code }),
  // });
  // return response.json();
}

/**
 * 刷新 access token（如果支持）
 * @param {string} refreshToken
 * @returns {Promise<string>}
 */
export async function refreshAccessToken(refreshToken) {
  // GitHub 的 OAuth token 不会过期，所以通常不需要刷新
  // 如果需要撤销访问，用户需要在 GitHub 设置中手动撤销
  throw new Error('GitHub OAuth tokens do not expire');
}

/**
 * 撤销 access token
 * @param {string} accessToken
 * @returns {Promise<void>}
 */
export async function revokeAccessToken(accessToken) {
  // 这个操作也需要在后端完成
  // 调用 GitHub API: DELETE https://api.github.com/applications/{client_id}/token
  
  throw new Error('此功能需要后端支持');
}

/**
 * 存储 token 到 localStorage (加密)
 * @param {string} token
 */
export function storeToken(token) {
  // 简单的 base64 编码（实际应该使用更安全的加密）
  const encoded = btoa(token);
  localStorage.setItem('github_token', encoded);
}

/**
 * 从 localStorage 获取 token
 * @returns {string|null}
 */
export function getStoredToken() {
  const encoded = localStorage.getItem('github_token');
  if (!encoded) return null;
  
  try {
    return atob(encoded);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
}

/**
 * 清除存储的 token
 */
export function clearStoredToken() {
  localStorage.removeItem('github_token');
}

export default {
  getGitHubAuthUrl,
  validateState,
  parseOAuthCallback,
  exchangeCodeForToken,
  refreshAccessToken,
  revokeAccessToken,
  storeToken,
  getStoredToken,
  clearStoredToken,
};
