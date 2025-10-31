# API 速率限制问题修复说明

## 问题描述

用户在访问分享链接时遇到以下错误：

```
无法加载 Collection
加载分享数据失败: API rate limit exceeded for 79.127.232.195. 
(But here's the good news: Authenticated requests get a higher rate limit. 
Check out the documentation for more details.)
```

## 问题原因

GitHub API 对**未认证请求**有严格的速率限制：
- **匿名请求**: 每小时 60 次
- **认证请求**: 每小时 5000 次

之前的 `getPublicGist()` 函数使用未认证的 Octokit 实例：
```javascript
const octokit = new Octokit(); // 没有 token
```

即使 Gist 是公开的，频繁访问也会很快达到速率限制。

## 解决方案

修改 `getPublicGist()` 函数，支持**可选的认证**：

### 1. github.service.js 修改

```javascript
export async function getPublicGist(gistId, accessToken = null) {
  try {
    // 如果提供了 token，使用认证请求（速率限制更高）
    // 否则使用匿名请求（每小时 60 次限制）
    const octokit = accessToken 
      ? createOctokitClient(accessToken) 
      : new Octokit();
    
    console.log('🔑 请求 Gist:', gistId, accessToken ? '(已认证)' : '(匿名)');
    
    const { data } = await octokit.gists.get({
      gist_id: gistId,
    });
    
    return data;
  } catch (error) {
    console.error('获取公开 Gist 失败:', error);
    throw error;
  }
}
```

### 2. SharePage.jsx 修改

在加载分享数据时，自动检测用户是否已登录：

```javascript
import { getAccessToken } from '../utils/auth';

const loadShareData = async () => {
  // 尝试获取当前用户的 token（如果已登录）
  const accessToken = getAccessToken();
  console.log('🔑 用户登录状态:', accessToken ? '已登录' : '未登录');

  // 传入 token 避免速率限制
  const gist = await getPublicGist(shareId, accessToken);
  // ...
};
```

## 工作原理

### 场景 1: 已登录用户访问分享链接
1. SharePage 从 localStorage 获取用户的 accessToken
2. 使用认证请求访问 Gist
3. 速率限制：5000 次/小时 ✅
4. 可以正常浏览分享内容

### 场景 2: 未登录用户访问分享链接
1. getAccessToken() 返回 null
2. 使用匿名请求访问 Gist
3. 速率限制：60 次/小时 ⚠️
4. 可以浏览，但频繁访问会受限

## 优势

✅ **向后兼容**: 未登录用户仍可访问（有限制）
✅ **性能优化**: 已登录用户享受更高速率限制
✅ **自动适配**: 无需用户手动操作，自动检测登录状态
✅ **用户友好**: 不强制要求登录即可查看公开分享

## 测试步骤

### 测试 1: 已登录状态访问分享链接（推荐）

1. **确保已登录** StarKeeper Dashboard
2. 生成一个分享链接：
   - 点击 "分享" 按钮
   - 启用 "公开"
   - 保存后复制 URL
3. **在当前浏览器** 打开分享链接（或新标签页）
4. 查看控制台日志，应该看到：
   ```
   🔑 用户登录状态: 已登录
   🔑 请求 Gist: gist_xxx (已认证)
   📦 获取到的 Gist: {...}
   ✅ 分享数据加载成功
   ```

### 测试 2: 未登录状态访问（可选）

1. 在**无痕模式**打开分享链接
2. 控制台应该显示：
   ```
   🔑 用户登录状态: 未登录
   🔑 请求 Gist: gist_xxx (匿名)
   ```
3. 如果达到速率限制，会显示：
   ```
   ❌ API rate limit exceeded...
   ```
4. **解决方法**: 提示用户登录 GitHub 账号

## 预期结果

✅ **已登录用户**: 完全不受速率限制影响
✅ **分享链接可用**: 其他用户可以正常访问
✅ **控制台日志清晰**: 明确显示认证状态

## 注意事项

⚠️ **最佳实践**: 建议用户在登录状态下访问分享链接
⚠️ **匿名限制**: 未登录用户每小时只能访问 60 次
⚠️ **速率限制共享**: 同一 IP 地址的所有匿名请求共享 60 次配额

## 后续优化建议

如果需要更好的匿名访问体验，可以考虑：

1. **添加登录提示**: 当检测到速率限制时，提示用户登录
2. **缓存机制**: 在前端缓存已加载的分享数据
3. **服务器代理**: 搭建后端服务器代理 GitHub API（需要额外开发）

---

**修复时间**: 2025-10-31  
**相关文件**:
- `src/services/github.service.js`
- `src/pages/SharePage.jsx`
- `src/utils/auth.js`
