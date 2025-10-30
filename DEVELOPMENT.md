# StarKeeper - 开发指南

## 🚀 快速开始

### 1. 安装依赖（已完成）
```bash
npm install
```

### 2. 配置 GitHub OAuth App

为了使用 GitHub 登录功能，你需要创建一个 GitHub OAuth App：

1. 访问 https://github.com/settings/developers
2. 点击 "New OAuth App"
3. 填写信息：
   - **Application name**: StarKeeper（或你喜欢的名字）
   - **Homepage URL**: `http://localhost:3001`
   - **Authorization callback URL**: `http://localhost:3001/auth/callback`
4. 创建后，复制 `Client ID` 和 `Client Secret`
5. 更新 `.env` 文件：
   ```bash
   VITE_GITHUB_CLIENT_ID=your_client_id_here
   VITE_GITHUB_CLIENT_SECRET=your_client_secret_here
   VITE_GITHUB_REDIRECT_URI=http://localhost:3001/auth/callback
   ```

### 3. 启动开发服务器
```bash
npm start
```

应用将在 http://localhost:3001 运行（如果 3000 被占用）。

---

## 🔧 临时开发方案（无需 OAuth）

如果暂时不想配置 OAuth App，可以使用 Personal Access Token：

### 步骤：

1. **创建 GitHub Personal Access Token**
   - 访问 https://github.com/settings/tokens
   - 点击 "Generate new token (classic)"
   - 选择权限：
     - ✅ `public_repo`
     - ✅ `read:user`
     - ✅ `gist`
   - 生成并复制 token（格式：`ghp_xxxxxxxxxxxx`）

2. **在浏览器控制台设置 token**
   - 打开应用 http://localhost:3001
   - 按 `F12` 打开开发者工具
   - 进入 Console 标签
   - 执行以下代码（替换 `YOUR_TOKEN`）：
   ```javascript
   localStorage.setItem('github_token', btoa('ghp_your_token_here'));
   window.location.href = '/';
   ```

3. **刷新页面**
   - 页面会自动跳转到 Dashboard
   - 开始使用 StarKeeper！

---

## 📁 项目结构

```
src/
├── config/               # 配置文件
│   └── index.js         # API 配置（GitHub, DashScope）
├── services/            # API 服务封装
│   ├── github.service.js    # GitHub API
│   └── dashscope.service.js # 阿里云通义千问 API
├── store/               # 状态管理（Zustand）
│   └── index.js         # 全局 store
├── utils/               # 工具函数
│   └── auth.js          # 认证工具
├── components/          # React 组件
│   ├── layout/          # 布局组件
│   │   ├── Header.jsx
│   │   ├── Sidebar.jsx
│   │   └── MainLayout.jsx
│   └── common/          # 通用组件（待添加）
├── pages/               # 页面组件
│   ├── LoginPage.jsx    # 登录页
│   ├── CallbackPage.jsx # OAuth 回调页
│   └── DashboardPage.jsx # 主面板
├── App.jsx              # 根组件
└── index.jsx            # 入口文件
```

---

## 🎯 已完成功能

✅ Tailwind CSS 配置  
✅ 阿里云通义千问 API 集成  
✅ GitHub API 封装（Octokit）  
✅ Zustand 状态管理  
✅ OAuth 认证流程（前端部分）  
✅ 响应式布局（Header + Sidebar）  
✅ Stars 列表展示（Grid/List 视图）  
✅ 搜索与过滤功能  

---

## 🔨 待实现功能

### Week 1 剩余任务：
- [ ] 标签添加/编辑功能
- [ ] Gist 存储逻辑（保存元数据）
- [ ] 导入/导出功能（Markdown/CSV）
- [ ] 响应式设计优化

### Week 2：
- [ ] AI 摘要生成（调用通义千问）
- [ ] 语义搜索（Embeddings）
- [ ] 活跃度监控
- [ ] 浏览器扩展

---

## 🐛 已知问题

1. **OAuth 需要后端支持**
   - GitHub OAuth 需要 `client_secret`，不能在前端直接完成
   - 临时方案：使用 Personal Access Token
   - 长期方案：创建 Serverless Function 处理 token 交换

2. **CSS 工具警告**
   - Tailwind 的 `@tailwind` 指令会被 CSS 工具标记为错误
   - 这不影响运行，可以忽略

---

## 📚 技术栈

- **React** 18.2.0
- **Vite** 4.x
- **Tailwind CSS** 3.x
- **React Router** 6.x
- **Zustand** 4.x（状态管理）
- **Octokit** 20.x（GitHub API）
- **Axios**（HTTP 客户端）
- **Lucide React**（图标库）
- **阿里云通义千问**（AI 服务）

---

## 🔗 相关链接

- [GitHub OAuth Apps](https://github.com/settings/developers)
- [GitHub Personal Access Tokens](https://github.com/settings/tokens)
- [阿里云通义千问文档](https://help.aliyun.com/zh/dashscope/)
- [项目开发计划书](./PROJECT_PLAN.md)

---

## 💡 提示

- 开发过程中可以使用 `npm run build` 构建生产版本
- 使用 `npm test` 运行测试（待添加）
- 所有配置都在 `.env` 文件中，不要提交到 Git

---

**祝开发愉快！** 🚀
