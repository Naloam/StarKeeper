# StarKeeper ⭐

> GitHub Stars 智能管理工具 - 让每个 star 都有价值

基于 AI 增强的 GitHub Stars 管理应用，通过自动摘要、健康度分析、智能清理等功能，帮助开发者高效管理和利用已收藏的开源项目。

[![Version](https://img.shields.io/badge/version-0.3.0-blue)](https://github.com/Naloam/StarKeeper)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
[![React](https://img.shields.io/badge/React-18.2.0-61dafb)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-4.5.0-646cff)](https://vitejs.dev/)

## ✨ 核心功能

- 🤖 **AI 自动摘要** - 一键生成项目洞察（技术栈/功能/适用场景）
- 🔍 **AI 语义搜索** - 自然语言搜索，基于 embedding 向量智能匹配
- 📊 **健康度分析** - 评估项目活跃度和维护状态（0-100分）
- 🏷️ **智能标签** - 自定义标签 + 自动补全 + 笔记功能
- 🔍 **多维搜索** - 关键词/语言/标签多条件过滤
- 🧹 **智能清理** - 自动检测废弃/相似/低交互项目
- 🔄 **智能去重** - 相似项目聚类和对比分析
- 📤 **导入导出** - JSON/Markdown/CSV 格式支持
- 📱 **PWA 支持** - 离线访问 + 桌面安装
- 🔒 **隐私优先** - 数据存储在你的 GitHub Gist

## 📚 项目文档

- 📋 [项目计划](./PROJECT_PLAN.md) - 完整的开发计划和架构说明

## 🚀 快速开始

### 开发环境

```bash
# 安装依赖
npm install

# 启动开发服务器
npm start
# 访问 http://localhost:3000

# 构建生产版本
npm build

# 预览生产构建
npm preview
```

### 环境变量

创建 `.env` 文件：

```env
# GitHub OAuth（可选，用于生产环境）
VITE_GITHUB_CLIENT_ID=your_client_id
VITE_GITHUB_REDIRECT_URI=http://localhost:3000/callback

# 阿里云 DashScope API
VITE_DASHSCOPE_API_KEY=your_api_key

# PWA（开发模式可选启用）
VITE_PWA_DEV=false
```

### GitHub Personal Access Token

开发模式下，可以直接使用 Personal Access Token：

1. 访问 https://github.com/settings/tokens
2. 生成 token（勾选 `repo`, `gist` 权限）
3. 登录页面输入 token

## 📦 技术栈

- **框架**: React 18.2 + Vite 4.5
- **状态管理**: Zustand 4.5
- **样式**: Tailwind CSS 3.3
- **路由**: React Router 6.30
- **图标**: Lucide React
- **API**: Octokit.js (GitHub), Axios
- **PWA**: vite-plugin-pwa + Workbox
- **性能**: React Window (虚拟滚动)

## 📁 项目结构

```
src/
├── components/    # 组件
│   ├── common/    # 通用组件（12个）
│   ├── layout/    # 布局组件
│   └── tags/      # 标签组件
├── pages/         # 页面（6个）
├── services/      # 服务层（7个）
├── store/         # Zustand stores
├── utils/         # 工具函数
└── config/        # 配置
```

## 🎯 功能特性

### 1. AI 自动摘要
- 基于 README 和描述生成项目摘要

### 2. AI 语义搜索
- 自然语言搜索，无需精确关键词
- 基于 DashScope Embedding API 生成向量
- 余弦相似度计算，智能匹配相关项目
- 向量缓存到 Gist，加速后续搜索
- 支持搜索项目描述、README、标签、笔记等内容
- **优化版**：智能权重分配、领域识别、多语言支持
- 搜索结果直接展示项目卡片，可点击跳转

**使用技巧**：
- 🎯 使用领域词汇："React 组件库" 比 "库" 效果更好
- 🔤 中英文混合："Python 机器学习" 效果更佳
- 📊 相似度 >30% 为高度相关，20-30% 为相关
- 💡 返回最多 20 个结果，阈值设置为 15%

### 3. 数据可视化
- 自动提取技术栈、功能、适用场景
- 支持批量生成和缓存

### 2. 健康度分析
- **综合评分**（0-100分）
  - 活跃度 40分：commits/release/更新时间
  - 社区健康 30分：issue响应/PR合并率/contributors
  - 维护状态 30分：archived/CI/README更新
- 5个等级徽章：优秀/良好/一般/较差/危险
- 批量分析支持

### 3. 智能清理
- 废弃项目检测（健康度低 + 长期未更新）
- 相似项目检测（名称/语言/描述相似）
- 低交互项目检测（无标签/无笔记）
- 安全归档机制（30天内可恢复）

### 4. 智能去重
- 相似度计算（编辑距离 + topics 匹配）
- 项目聚类和对比分析
- 推荐最佳选择

### 5. PWA 离线支持
- Service Worker 缓存策略
- 离线访问已加载数据
- 离线编辑自动同步
- 支持桌面安装

## 🔐 隐私说明

- 所有元数据（标签/笔记/配置）存储在用户自己的 GitHub Gist
- 不收集任何用户数据
- 完全开源，代码透明

## 📝 开发计划

查看 [PROJECT_PLAN.md](./PROJECT_PLAN.md) 了解：
- 已完成功能（13个PR）
- 未来规划（语义搜索、学习路径等）
- 技术架构详情

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### Git 提交规范
```
feat: 新功能
fix: Bug 修复
docs: 文档更新
refactor: 重构
perf: 性能优化
```

## 📄 许可证

MIT License - 详见 [LICENSE](./LICENSE)

## 🙏 致谢

- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [GitHub REST API](https://docs.github.com/rest)
- [阿里云通义千问](https://dashscope.aliyun.com/)

---

**Star 这个项目** 如果你觉得它有用！⭐
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

## Learn More

You can learn more in the [Vite documentation](https://vitejs.dev/guide/).

To learn Vitest, a Vite-native testing framework, go to [Vitest documentation](https://vitest.dev/guide/)

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://sambitsahoo.com/blog/vite-code-splitting-that-works.html](https://sambitsahoo.com/blog/vite-code-splitting-that-works.html)

### Analyzing the Bundle Size

This section has moved here: [https://github.com/btd/rollup-plugin-visualizer#rollup-plugin-visualizer](https://github.com/btd/rollup-plugin-visualizer#rollup-plugin-visualizer)

### Making a Progressive Web App

This section has moved here: [https://dev.to/hamdankhan364/simplifying-progressive-web-app-pwa-development-with-vite-a-beginners-guide-38cf](https://dev.to/hamdankhan364/simplifying-progressive-web-app-pwa-development-with-vite-a-beginners-guide-38cf)

### Advanced Configuration

This section has moved here: [https://vitejs.dev/guide/build.html#advanced-base-options](https://vitejs.dev/guide/build.html#advanced-base-options)

### Deployment

This section has moved here: [https://vitejs.dev/guide/build.html](https://vitejs.dev/guide/build.html)

### Troubleshooting

This section has moved here: [https://vitejs.dev/guide/troubleshooting.html](https://vitejs.dev/guide/troubleshooting.html)
