# StarKeeper 项目上下文

> **最后更新**: 2025-10-31  
> **当前分支**: main  
> **最新 PR**: #5 (已合并)

## 🎯 项目概述

**StarKeeper** - GitHub Stars 管理工具，帮助开发者组织、搜索和分享收藏的开源项目。

- **仓库**: Naloam/StarKeeper (private)
- **技术栈**: React 18.2 + Vite 4 + Zustand 4.4 + Octokit.js 20 + Tailwind CSS 3.3
- **数据存储**: GitHub Gist (starkeeper-metadata.json)
- **开发环境**: GitHub Codespaces (端口 3001)

## ✅ 已完成功能 (PR #1-5)

### PR #1: MVP 基础功能
- GitHub OAuth 认证
- Stars 列表展示
- 基础搜索和语言筛选

### PR #2: 标签管理系统
- 添加/编辑标签和备注
- 标签颜色选择
- 标签筛选功能

### PR #3: AI 摘要功能（已暂停）
- 阿里云 DashScope API 集成
- 项目摘要生成
- **暂停原因**: API endpoint 无法访问

### PR #4: 导入导出
- JSON 格式导出
- Markdown 格式导出
- 数据导入功能

### PR #5: 搜索增强 & 公开分享
- **搜索排序**: 最近更新/Star数量/项目名称，支持升序/降序
- **公开分享**: 
  - ShareModal UI (公开/私有切换)
  - SharePage 只读展示
  - 使用 Gist ID 作为 shareId
  - 认证请求避免 API 速率限制

## 🔧 关键技术细节

### 认证流程
```javascript
// OAuth 流程
1. 用户点击登录 → GitHub OAuth 授权
2. 回调 /auth/callback → 获取 code
3. 后端代理交换 token (使用 Cloudflare Worker)
4. 存储 token 到 localStorage
```

### 数据存储
```javascript
// Gist 结构: starkeeper-metadata.json
{
  repositories: {
    [repoId]: {
      tags: ['前端', 'React'],
      notes: '备注内容',
      color: '#3B82F6',
      aiSummary: '...'
    }
  },
  shareConfig: {
    isPublic: true,
    shareId: 'gist_abc123',  // 使用 Gist ID
    shareTitle: '分享标题',
    shareDescription: '描述'
  },
  sharedStars: [...]  // 完整的 repo 数据
}
```

### 状态管理 (Zustand)
```javascript
// src/store/index.js
{
  user: {},
  accessToken: '',
  stars: [],
  filteredStars: [],
  metadata: {},
  searchQuery: '',
  selectedLanguages: [],
  selectedTags: [],
  sortBy: 'updated',  // 'updated' | 'stars' | 'name'
  sortDirection: 'desc'  // 'asc' | 'desc'
}
```

## 🐛 已修复的关键 Bug

1. **标签创建不显示**: TagModal handleSave 改为 async/await
2. **分享 URL 无法访问**: 从随机 shareId 改为使用 Gist ID
3. **API 速率限制**: getPublicGist 支持可选的 accessToken 参数
4. **Manifest CORS 错误**: 注释 index.html 中的 manifest.json 引用
5. **导入名称错误**: getAccessToken → getStoredToken

## 📂 关键文件结构

```
src/
├── components/
│   ├── common/
│   │   ├── AISummary.jsx        # AI 摘要显示
│   │   ├── ShareModal.jsx       # 分享配置弹窗
│   │   └── ExportModal.jsx      # 导出功能弹窗
│   ├── layout/
│   │   ├── Sidebar.jsx          # 搜索/筛选/排序
│   │   ├── Header.jsx
│   │   └── MainLayout.jsx
│   └── tags/
│       ├── TagModal.jsx         # 标签编辑弹窗（异步保存）
│       ├── TagInput.jsx
│       └── TagBadge.jsx
├── pages/
│   ├── LoginPage.jsx
│   ├── CallbackPage.jsx
│   ├── DashboardPage.jsx        # 主界面
│   └── SharePage.jsx            # 公开分享页面
├── services/
│   ├── github.service.js        # GitHub API (Stars, Gist)
│   ├── metadata.service.js      # Gist CRUD (核心数据层)
│   ├── dashscope.service.js     # 阿里云 AI (暂停)
│   └── export.service.js        # 导出功能
├── store/
│   └── index.js                 # Zustand 状态管理
└── utils/
    └── auth.js                  # OAuth 工具函数
```

## ⚙️ 开发环境配置

### Codespaces 特殊要求
```bash
# Git 命令前必须 unset GITHUB_TOKEN
unset GITHUB_TOKEN && git push
unset GITHUB_TOKEN && gh pr create
```

### 启动开发服务器
```bash
npm start  # 运行在 http://localhost:3001
```

### Vite 配置
```javascript
// vite.config.js
server: {
  host: true,
  port: 3001,
  strictPort: false,
  hmr: { clientPort: 443 }  // Codespaces 配置
}
```

## 📋 待开发功能 (PROJECT_PLAN.md)

### 优先级 P0 (核心功能)
- ✅ F1.1: 基础认证
- ✅ F1.2: Stars 同步
- ✅ F1.3: 标签管理
- ✅ F1.4: 搜索过滤（基础+排序）
- ✅ F1.5: 数据导入导出
- ✅ F1.7: 公开分享
- ⏸️ F1.6: AI 摘要（暂停）

### 优先级 P1 (增强功能)
- ⏳ F2.1: 语义化搜索（需要 AI，暂停）
- 📝 F2.3: 活跃度监控（健康度指数）
- 📝 F2.4: 浏览器扩展（侧边栏快速访问）
- 📝 F2.5: 学习路径（阅读列表）
- 📝 F2.6: 智能去重（相似项目聚类）

### 优先级 P2 (高级功能)
- 📝 F3.1: 协作功能（团队共享）
- 📝 F3.2: 定时同步（后台自动更新）
- 📝 F3.3: 数据分析（Star 趋势）

## 🔍 调试技巧

### 查看 Gist 数据
```javascript
// 浏览器控制台
JSON.parse(localStorage.getItem('starkeeper_metadata'))
```

### 常见日志标记
- 🚀 应用启动
- 🔑 认证相关
- 📦 数据加载
- 💾 数据保存
- ✅ 成功操作
- ❌ 错误信息

## 📚 文档索引

- **PROJECT_PLAN.md** - 完整项目规划（功能清单、技术架构）
- **PROGRESS.md** - 开发进度追踪
- **FEATURE_SUMMARY.md** - 功能详细说明
- **API_RATE_LIMIT_FIX.md** - API 速率限制解决方案
- **SHARE_FIX_GUIDE.md** - 分享功能修复指南
- **TESTING_CHECKLIST.md** - 50+ 测试用例

## 🎯 下一步建议

**不依赖 AI 的功能**（可立即开发）：
1. **活跃度监控** (F2.3) - 显示项目健康度、最近提交频率
2. **浏览器扩展** (F2.4) - Chrome/Firefox 侧边栏快速访问
3. **学习路径** (F2.5) - 创建阅读列表、拖拽排序
4. **数据分析** (F3.3) - Star 增长趋势图表

**等待 AI 服务恢复后**：
- 恢复 AI 摘要功能 (F1.6)
- 语义化搜索 (F2.1)
- 智能去重 (F2.6)

---

**使用方法**: 在新对话开始时，发送：
```
请阅读 PROJECT_CONTEXT.md，然后帮我实现 [具体功能名称]
```
