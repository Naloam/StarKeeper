# StarKeeper ⭐

> GitHub Stars 智能管理工具 - 让每个 star 都有价值

基于 AI 增强的 GitHub Stars 管理应用，通过自动摘要、健康度分析、智能清理等功能，帮助开发者高效管理和利用已收藏的开源项目。

**在线体验**: [star-keeper-eight.vercel.app](https://star-keeper-eight.vercel.app)

## 核心功能

- **AI 自动摘要** - 一键生成项目洞察（技术栈/功能/适用场景）
- **AI 语义搜索** - 自然语言搜索，基于向量智能匹配
- **健康度分析** - 评估项目活跃度和维护状态（0-100分）
- **智能标签** - 自定义标签 + 笔记功能
- **智能清理** - 自动检测废弃/相似/低交互项目
- **智能去重** - 相似项目聚类和对比分析
- **导入导出** - JSON/Markdown/CSV 格式支持
- **PWA 支持** - 离线访问 + 桌面安装
- **隐私优先** - 数据存储在你的 GitHub Gist，完全由你掌控

## Quick Start

### 本地开发

```bash
# 克隆项目
git clone https://github.com/Naloam/StarKeeper.git
cd StarKeeper

# 安装依赖
npm install

# 启动开发服务器
npm start
# 访问 http://localhost:3000
```

### 登录方式

支持两种登录方式：

1. **GitHub OAuth 登录** - 点击「使用 GitHub 登录」直接授权
2. **Personal Access Token** - 在 [GitHub Settings](https://github.com/settings/tokens/new?scopes=repo,gist,read:user&description=StarKeeper) 创建 Token（勾选 `repo`、`gist`、`read:user`），粘贴到登录页

### 环境变量（可选）

创建 `.env` 文件以启用 AI 功能：

```env
# 阿里云 DashScope API（AI 摘要 + 语义搜索）
VITE_DASHSCOPE_API_KEY=your_api_key

# SiliconFlow API（Embedding 向量）
VITE_SILICONFLOW_API_KEY=your_api_key
```

> 不配置 API Key 也可以正常使用标签、搜索、健康度分析等功能，只是无法使用 AI 摘要和语义搜索。

### 部署到 Vercel

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

部署后在 Vercel 项目设置中添加以下环境变量：

- `VITE_GITHUB_CLIENT_ID` / `VITE_GITHUB_CLIENT_SECRET` - GitHub OAuth 应用凭据
- `VITE_GITHUB_REDIRECT_URI` - 回调地址（如 `https://your-domain.vercel.app/auth/callback`）

## License

[MIT](./LICENSE)
