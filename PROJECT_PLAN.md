# GitHub Stars 管理项目 - 开发计划书

## 📋 项目概述

### 项目名称
**StarKeeper** (可根据需要调整)

### 项目定位
基于 AI 增强的 GitHub Stars 智能管理工具，通过自动摘要、语义搜索、活跃度追踪等功能，帮助开发者高效管理和利用已收藏的开源项目。

### 核心价值主张
1. **智能化**：AI 自动摘要 + 语义搜索，让每个 star 都有价值
2. **可追溯**：活跃度监控 + 健康指数，避免依赖过时项目
3. **隐私优先**：支持 Gist 存储，数据归用户所有
4. **跨平台**：Web + 浏览器扩展 + VSCode 插件无缝同步

---

## 🎯 差异化竞争优势

与现有方案（Astral、StarOrder、Starflare）的差异点：

| 功能 | 现有方案 | 我们的方案 |
|------|----------|------------|
| 标签管理 | ✓ | ✓ |
| AI 自动摘要 | ✗ | ✓ |
| 语义搜索 | ✗ | ✓ |
| 活跃度追踪 | 部分 | ✓ 健康指数 |
| 学习路径 | ✗ | ✓ |
| 安全扫描 | ✗ | ✓ (企业版) |
| 智能去重 | ✗ | ✓ |
| 隐私存储 | 部分 | ✓ Gist/本地 |

---

## 📅 开发路线图

### 阶段一：MVP (最小可行产品) - 预计 2-3 周

#### 目标
快速上线可用版本，获取用户反馈

#### 功能清单
- [ ] **F1.1 用户认证**
  - GitHub OAuth 登录
  - 最小权限申请：`public_repo`（读取 starred）+ `gist`（写入元数据）
  - 支持 token 存储与刷新
  
- [ ] **F1.2 Stars 数据获取**
  - 调用 GitHub GraphQL API 拉取用户 starred 列表
  - 获取基础信息：repo name, description, language, stars count, last update
  - 实现分页加载（处理大量 stars）
  
- [ ] **F1.3 标签系统**
  - 用户为 repo 添加自定义标签（支持多标签）
  - 标签颜色自定义
  - 元数据存储到用户 GitHub Gist（JSON 格式）
  - 可选：提供托管存储模式（后端数据库）
  
- [ ] **F1.4 基础搜索与过滤**
  - 按 repo 名称、描述关键词搜索
  - 按语言、标签过滤
  - 按 stars 数、更新时间排序
  
- [ ] **F1.5 卡片化展示**
  - Grid/List 视图切换
  - 每个卡片显示：
    - Repo 名称 + Owner
    - 原始描述
    - 语言图标
    - Stars 数 / Forks 数
    - 最后更新时间
    - 用户标签
    - 快速操作按钮（编辑标签、访问 repo、取消 star）
  
- [ ] **F1.6 导入/导出**
  - 导出为 Markdown（带标签分类）
  - 导出为 CSV
  - 从 Markdown/CSV 导入标签数据
  
- [ ] **F1.7 公开分享**
  - 生成可分享的 Collection 页面
  - 支持公开/私有切换
  - 一键复制分享链接

#### 技术栈（MVP）
- **前端**：React 18.2.0 (LTS 稳定版) + Vite 4.x
- **样式**：Tailwind CSS 3.x + shadcn/ui 组件库
- **状态管理**：Zustand 4.x (轻量级) 或 React Query 4.x (数据获取)
- **路由**：React Router v6.x (稳定版)
- **API 交互**：Octokit.js 3.x (GitHub API 客户端)
- **LLM 服务**：阿里云通义千问 (DashScope API)
  - API Key: `sk-c61481ce440445db9dc8b12298f7aecb`
  - Endpoint: `https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation`
  - 模型：qwen-turbo (成本优化) / qwen-plus (高质量)
- **数据存储**：
  - 模式 A：用户 Gist（隐私优先）
  - 模式 B：Vercel KV / Supabase（托管模式，可选）
- **部署**：Vercel / Netlify

#### 开发任务拆解

**Week 1: 基础架构 + OAuth**
1. 初始化 Tailwind CSS + 配置 shadcn/ui
2. 实现 GitHub OAuth 流程（frontend + serverless function）
3. 创建基础布局组件（Header, Sidebar, Main）
4. 实现 GitHub API 封装（Octokit 初始化 + 错误处理）
5. 测试 starred repos 数据获取

**Week 2: 核心功能**
1. 实现 Stars 列表展示（卡片组件）
2. 实现标签添加/编辑/删除功能
3. 实现 Gist 存储逻辑（CRUD 操作）
4. 实现搜索与过滤功能
5. 实现排序功能

**Week 3: 完善与发布**
1. 实现导入/导出功能
2. 实现公开分享功能
3. 响应式设计优化
4. 性能优化（虚拟滚动、懒加载）
5. 编写文档（README + 用户指南）
6. 部署上线 + Beta 测试

---

### 阶段二：进阶功能 - 预计 3-4 周

#### 目标
提升用户粘性，实现产品差异化

#### 功能清单

- [ ] **F2.1 AI 自动摘要**
  - 抓取 README 内容（前 3000 字符）
  - 调用阿里云通义千问 API 生成：
    - 一句话摘要（50 字以内）
    - 主要功能点（3-5 条）
    - 适用场景
    - 关键依赖
  - 配置信息：
    - API Key: `sk-c61481ce440445db9dc8b12298f7aecb`
    - Endpoint: `https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation`
    - 模型选择：qwen-turbo (快速) / qwen-plus (高质量)
  - 缓存生成结果（避免重复调用，使用 Redis 或 LocalStorage）
  - 用户可编辑/重新生成
  
- [ ] **F2.2 语义搜索**
  - 为 README + Description 生成 embeddings（DashScope text-embedding-v2）
  - 向量维度：1536（与 OpenAI 兼容）
  - 选择向量数据库：
    - 轻量：SQLite + sqlite-vss 扩展（本地优先）
    - 托管：Supabase Vector (pgvector)
  - 实现自然语言查询（"用于实时图像处理的 Python 库"）
  - 相似度排序（余弦相似度）+ 高亮匹配原因
  - 成本优势：相比 OpenAI embeddings 节省约 80% 成本
  
- [ ] **F2.3 活跃度监控**
  - 定时任务（每日/每周）拉取 repo 更新数据：
    - 最新 release 时间
    - 最近 commits（30 天内）
    - Open issues / PRs 数量
    - Issue 响应时间中位数
  - 计算健康指数（0-100 分）：
    - 活跃度（40%）：commit 频率 + release 频率
    - 社区健康（30%）：issue 响应率 + PR merge 率
    - 维护状态（30%）：最后更新距今 + 是否标记 archived
  - 可视化展示（进度条 + 标签）
  - 低健康分项目预警通知
  
- [ ] **F2.4 浏览器扩展（Chrome + Firefox）**
  - 在 GitHub repo 页面侧边栏显示：
    - 是否已 star
    - 已添加的标签
    - AI 生成的摘要
    - 健康指数
  - 快速操作：
    - 一键添加标签（无需切换到主应用）
    - 添加笔记
    - 加入学习路径
  - 与主应用双向同步（WebSocket / Polling）
  
- [ ] **F2.5 学习路径（Reading List）**
  - 创建学习序列（Playlist）
  - 拖拽排序 repos
  - 为每个 repo 添加：
    - 学习状态（未开始 / 进行中 / 已完成）
    - 笔记与心得
    - 推荐阅读顺序
  - 生成学习报告（Markdown 导出）
  - 分享学习路径（公开 URL）
  
- [ ] **F2.6 智能去重与聚类**
  - 基于 embeddings 计算相似度
  - 自动检测功能重复的库
  - 展示对比表格（stars, 活跃度, 性能, 文档质量）
  - 推荐"保留哪个"（基于综合评分）
  - 一键批量取消 star

#### 技术栈（进阶）
- **LLM**：阿里云通义千问 DashScope API
  - 文本生成：qwen-turbo / qwen-plus
  - 成本：qwen-turbo ¥0.0008/千tokens (约为 OpenAI 的 1/10)
- **Embeddings**：DashScope text-embedding-v2 API
  - 向量维度：1536
  - 成本：¥0.0007/千tokens
- **向量数据库**：Supabase Vector (pgvector) 或本地 SQLite + VSS
- **后端**：Next.js 14.x API Routes (稳定版) 或独立 Node.js 18.x LTS 服务
- **定时任务**：Vercel Cron 或 GitHub Actions
- **浏览器扩展**：Manifest V3 + Plasmo 框架
- **缓存**：Redis 7.x（Vercel KV / Upstash）

#### 开发任务拆解

**Week 1: AI 基础设施**
1. 搭建 LLM 调用服务（API 封装 + 错误处理）
2. 实现 README 抓取逻辑
3. 实现摘要生成功能
4. 设计摘要展示 UI
5. 实现缓存机制

**Week 2: 语义搜索**
1. 搭建向量数据库（选型 + 初始化）
2. 实现 embeddings 生成管道
3. 批量处理已有 stars 的 embeddings
4. 实现语义搜索 API
5. 优化搜索结果展示

**Week 3: 活跃度监控**
1. 设计健康指数算法
2. 实现数据拉取定时任务
3. 实现健康分计算逻辑
4. 设计健康指数 UI（仪表盘）
5. 实现预警通知功能

**Week 4: 扩展 + 学习路径**
1. 开发浏览器扩展基础框架
2. 实现扩展与主应用同步
3. 实现学习路径 CRUD
4. 实现拖拽排序与状态管理
5. 实现去重聚类算法

---

### 阶段三：企业版与变现 - 预计 4-6 周

#### 目标
面向团队与企业用户，实现商业化

#### 功能清单

- [ ] **F3.1 安全与依赖扫描**
  - 集成 GitHub Dependabot API
  - 集成 Snyk / OSV.dev API
  - 检测已知漏洞（CVE）
  - 依赖版本过时提醒
  - 生成安全报告（PDF/HTML）
  - 修复建议与 PR 链接
  
- [ ] **F3.2 团队协作**
  - 组织账户管理
  - 团队成员邀请与权限控制（Owner / Admin / Member）
  - 共享 Collections
  - 评论与讨论功能
  - @提及团队成员
  - Audit Log（操作日志）
  
- [ ] **F3.3 高级分析**
  - 数据可视化仪表盘：
    - Stars 增长趋势（时间轴）
    - 语言分布（饼图）
    - 主题/领域分布（词云）
    - 活跃度热力图
  - 团队 Stars 统计
  - 导出可定制报告
  
- [ ] **F3.4 VSCode 扩展**
  - 侧边栏集成
  - 快速搜索 starred repos
  - 从 VSCode 添加标签
  - Clone repo 一键操作
  - 查看 AI 摘要
  
- [ ] **F3.5 企业级特性**
  - SSO 登录（SAML / OAuth）
  - 私有部署选项（Docker 镜像）
  - 数据导出与备份
  - SLA 保障
  - 优先技术支持

#### 定价策略

**个人版（Free）**
- 最多 500 个 stars 管理
- 基础标签与搜索
- Gist 存储
- 导出功能
- 社区支持

**Pro 版（$5/月）**
- 无限 stars
- AI 自动摘要（每月 100 次）
- 语义搜索
- 活跃度监控
- 学习路径
- 浏览器扩展
- 优先支持

**团队版（$15/用户/月）**
- Pro 版全部功能
- 团队协作
- 共享 Collections
- 安全扫描（基础）
- 高级分析
- API 访问

**企业版（Contact Sales）**
- 团队版全部功能
- 深度安全扫描
- 私有部署
- SSO
- Audit Log
- SLA
- 专属客户成功经理

---

## 🏗️ 技术架构设计

### 系统架构图

```
┌─────────────────────────────────────────────────────┐
│                     用户层                           │
│  Web App  │  Browser Extension  │  VSCode Extension │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│                  API Gateway                         │
│            (Next.js API Routes)                      │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼             ▼
   ┌────────┐  ┌──────────┐  ┌─────────┐
   │ GitHub │  │   LLM    │  │ Vector  │
   │  API   │  │ Service  │  │   DB    │
   └────────┘  └──────────┘  └─────────┘
        │            │             │
        └────────────┼─────────────┘
                     ▼
              ┌─────────────┐
              │  Database   │
              │ (Postgres)  │
              └─────────────┘
                     │
                     ▼
              ┌─────────────┐
              │   Cache     │
              │   (Redis)   │
              └─────────────┘
```

### 数据模型

```typescript
// User
interface User {
  id: string;
  githubId: number;
  username: string;
  avatarUrl: string;
  accessToken: string; // encrypted
  gistId?: string; // 用户 Gist ID（隐私模式）
  plan: 'free' | 'pro' | 'team' | 'enterprise';
  createdAt: Date;
  updatedAt: Date;
}

// StarredRepo
interface StarredRepo {
  id: string;
  userId: string;
  repoId: number;
  owner: string;
  name: string;
  fullName: string;
  description: string;
  language: string;
  starsCount: number;
  forksCount: number;
  lastUpdateAt: Date;
  starredAt: Date;
  
  // 增强数据
  aiSummary?: string;
  keyFeatures?: string[];
  useCase?: string;
  embedding?: number[]; // 向量
  healthScore?: number;
  
  // 元数据
  tags: string[];
  notes: string;
  customColor?: string;
}

// Collection (学习路径)
interface Collection {
  id: string;
  userId: string;
  name: string;
  description: string;
  repos: {
    repoId: string;
    order: number;
    status: 'todo' | 'in-progress' | 'completed';
    notes: string;
  }[];
  isPublic: boolean;
  slug: string; // 用于分享链接
  createdAt: Date;
}

// HealthMetrics
interface HealthMetrics {
  repoId: string;
  lastCommitAt: Date;
  commitsLast30Days: number;
  lastReleaseAt?: Date;
  openIssuesCount: number;
  openPRsCount: number;
  avgIssueResponseTime: number; // 小时
  isArchived: boolean;
  healthScore: number;
  calculatedAt: Date;
}
```

### API 设计

```
# 认证
POST   /api/auth/github/login
POST   /api/auth/github/callback
POST   /api/auth/logout

# Stars 管理
GET    /api/stars                     # 获取列表
POST   /api/stars/:id/tags            # 添加标签
PUT    /api/stars/:id/notes           # 更新笔记
DELETE /api/stars/:id                 # 取消 star

# AI 功能
POST   /api/ai/summarize/:repoId      # 生成摘要
POST   /api/ai/search                 # 语义搜索

# 健康监控
GET    /api/health/:repoId            # 获取健康指数
POST   /api/health/refresh            # 刷新健康数据

# Collections
GET    /api/collections               # 获取列表
POST   /api/collections               # 创建
PUT    /api/collections/:id           # 更新
DELETE /api/collections/:id           # 删除
GET    /api/collections/:slug/public  # 公开分享

# 导出
GET    /api/export/markdown
GET    /api/export/csv

# 团队（企业版）
POST   /api/teams
GET    /api/teams/:id/members
POST   /api/teams/:id/invite
```

---

## 🔒 隐私与安全

### GitHub API 权限说明

**最小权限原则**
```
read:user          # 读取用户基本信息
public_repo        # 读取公开 starred repos
gist               # 读写 Gist（用于元数据存储）
```

**用户数据处理**
1. Access Token 加密存储（AES-256）
2. 支持 Token 撤销与重新授权
3. 明示数据使用范围（显示在授权页面）
4. 遵守 GDPR：支持数据导出与删除

### 数据存储策略

**模式 A：隐私优先（Gist 存储）**
- 元数据存储在用户的 GitHub Gist
- 服务端不保存标签、笔记等敏感信息
- 仅缓存公开数据（repo 信息、健康指数）

**模式 B：托管模式**
- 元数据存储在服务端数据库
- 支持跨设备实时同步
- 更快的搜索与分析性能
- 需明确告知用户数据存储位置

**用户可选择模式**，默认为 Gist 模式。

### GitHub API 速率限制处理

- **认证请求**：5000 次/小时
- **策略**：
  1. 实现请求队列与速率控制
  2. 使用 ETags 缓存响应
  3. GraphQL 批量查询减少请求数
  4. Redis 缓存热数据（TTL: 1 小时）
  5. 用户触发的刷新限制为 10 次/小时

---

## 💰 商业化与增长策略

### 变现路径

1. **Freemium 模式**（主要收入）
   - 免费版吸引用户，Pro 版提供高价值功能
   - 预期转化率：3-5%
   
2. **团队订阅**（高客单价）
   - 面向开发团队、技术社区
   - 提供协作与管理功能
   
3. **企业定制**（长尾收入）
   - 私有部署 + 定制开发
   - 年度合约制

### 增长策略

1. **内容营销**
   - 技术博客（"如何高效管理 1000+ GitHub Stars"）
   - 开源项目推荐列表
   - YouTube 教程
   
2. **社区驱动**
   - 公开的精选 Collections（Hacker News / Reddit 传播）
   - 用户分享激励（推荐返利）
   - Product Hunt 发布
   
3. **集成生态**
   - VSCode Extension Marketplace
   - Chrome Web Store
   - Notion / Obsidian 插件集成
   
4. **KOL 合作**
   - 技术 UP 主 / YouTuber 试用推广
   - 开源项目作者背书

---

## 📊 成功指标（KPI）

### MVP 阶段
- [ ] 100 个 Beta 用户注册
- [ ] 10,000 个 stars 被管理
- [ ] 平均每用户添加 5+ 标签
- [ ] 用户留存率 D7 > 30%

### 进阶阶段
- [ ] 1,000 个活跃用户
- [ ] 10% 用户使用 AI 摘要功能
- [ ] 5% 用户创建学习路径
- [ ] 付费转化率 > 3%

### 企业阶段
- [ ] 50 个付费团队
- [ ] MRR > $5,000
- [ ] NPS > 50
- [ ] 企业客户 > 5 家

---

## 🚀 开发规范

### 代码规范
- **风格**：ESLint + Prettier
- **类型安全**：TypeScript strict mode
- **命名**：camelCase (变量) / PascalCase (组件)
- **注释**：JSDoc 用于公共 API

### Git 工作流
- **分支策略**：Git Flow
  - `main`：生产环境
  - `develop`：开发主分支
  - `feature/*`：功能分支
  - `hotfix/*`：紧急修复
- **Commit 规范**：Conventional Commits
  ```
  feat: 新功能
  fix: Bug 修复
  docs: 文档更新
  style: 代码格式
  refactor: 重构
  test: 测试
  chore: 构建/工具
  ```

### 测试策略
- **单元测试**：Jest + React Testing Library（覆盖率 > 70%）
- **E2E 测试**：Playwright（核心流程）
- **CI/CD**：GitHub Actions
  ```yaml
  - Lint & Type Check
  - Unit Tests
  - Build
  - Deploy (Preview)
  - E2E Tests (Production)
  ```

### 性能要求
- **首屏加载**：< 2s (3G 网络)
- **搜索响应**：< 500ms
- **AI 摘要生成**：< 5s
- **语义搜索**：< 1s

---

## 📝 文档计划

### 用户文档
- [ ] 快速开始指南
- [ ] 功能教程（带截图）
- [ ] 常见问题 FAQ
- [ ] 隐私政策
- [ ] 服务条款

### 开发文档
- [ ] 架构设计文档
- [ ] API 文档（Swagger）
- [ ] 数据库 Schema
- [ ] 部署指南
- [ ] 贡献指南

---

## ⚠️ 风险与应对

| 风险 | 影响 | 概率 | 应对措施 |
|------|------|------|----------|
| GitHub API 限流 | 高 | 中 | 缓存 + 队列 + 降级策略 |
| LLM 成本过高 | 中 | 高 | 限制免费额度 + 本地模型备选 |
| 竞品抄袭 | 中 | 中 | 快速迭代 + 建立用户黏性 |
| 安全漏洞 | 高 | 低 | 代码审计 + 渗透测试 |
| 用户增长慢 | 高 | 中 | 加大内容营销 + 社区运营 |

---

## 🎯 里程碑与交付物

### Milestone 1: MVP 上线 (Week 3)
- ✅ 可运行的 Web 应用
- ✅ GitHub OAuth 认证
- ✅ Stars 管理基础功能
- ✅ 部署到生产环境
- ✅ README + 用户文档

### Milestone 2: 进阶功能 (Week 7)
- ✅ AI 摘要功能
- ✅ 语义搜索
- ✅ 活跃度监控
- ✅ 浏览器扩展 (Chrome)
- ✅ 学习路径功能

### Milestone 3: 商业化准备 (Week 13)
- ✅ 付费订阅系统
- ✅ 团队协作功能
- ✅ 安全扫描
- ✅ VSCode 扩展
- ✅ 完整的市场营销材料

---

## 📞 沟通与协作

### 开发节奏
- **每日站会**：同步进度与阻塞（15 分钟）
- **周会**：Demo 本周成果 + 下周计划
- **双周 Review**：用户反馈回顾 + 路线图调整

### 决策机制
- **技术决策**：记录 ADR (Architecture Decision Record)
- **产品决策**：基于数据 + 用户反馈
- **优先级评估**：Impact vs Effort 矩阵

---

## ✅ 下一步行动

看完此计划书后，您需要确认：

1. **是否同意整体技术栈选型？**（React + Next.js + Tailwind + Supabase）
2. **是否同意三阶段路线图？**（MVP → 进阶 → 企业）
3. **首选的数据存储模式？**（Gist 隐私模式 vs 托管模式）
4. **LLM 服务商选择？**（OpenAI / Anthropic / 自托管）
5. **是否需要调整商业化策略？**（定价 / 目标用户）

---

## 🔧 技术栈版本锁定

为确保稳定性，我们使用以下经过验证的版本：

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@octokit/rest": "^20.0.2",
    "zustand": "^4.4.7",
    "@tanstack/react-query": "^4.36.1",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "vite": "^4.5.0",
    "tailwindcss": "^3.3.5",
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "typescript": "^5.2.2",
    "eslint": "^8.54.0",
    "prettier": "^3.1.0"
  }
}
```

### 阿里云通义千问 API 配置

```javascript
// config/dashscope.config.js
export const DASHSCOPE_CONFIG = {
  apiKey: 'sk-c61481ce440445db9dc8b12298f7aecb',
  baseUrl: 'https://dashscope.aliyuncs.com/api/v1/services/aigc',
  models: {
    turbo: 'qwen-turbo',      // 快速模型，适合实时交互
    plus: 'qwen-plus',        // 高质量模型，适合复杂摘要
    max: 'qwen-max'           // 最强模型，企业版使用
  },
  embedding: {
    model: 'text-embedding-v2',
    dimension: 1536
  },
  pricing: {
    turbo: 0.0008,   // ¥/千tokens
    plus: 0.004,
    embedding: 0.0007
  }
}
```

### API 调用示例

```javascript
// services/dashscope.service.js
import axios from 'axios';
import { DASHSCOPE_CONFIG } from '@/config/dashscope.config';

export async function generateSummary(readmeContent) {
  const response = await axios.post(
    `${DASHSCOPE_CONFIG.baseUrl}/text-generation/generation`,
    {
      model: DASHSCOPE_CONFIG.models.turbo,
      input: {
        prompt: `请为以下 GitHub 项目的 README 生成简洁摘要：\n\n${readmeContent}\n\n要求：\n1. 一句话概括（50字内）\n2. 主要功能点（3-5条）\n3. 适用场景\n4. 关键技术栈`
      },
      parameters: {
        max_tokens: 500,
        temperature: 0.7
      }
    },
    {
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response.data.output.text;
}

export async function generateEmbedding(text) {
  const response = await axios.post(
    `${DASHSCOPE_CONFIG.baseUrl}/embeddings`,
    {
      model: DASHSCOPE_CONFIG.embedding.model,
      input: { texts: [text] }
    },
    {
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response.data.output.embeddings[0].embedding;
}
```

---

**确认后，我将立即开始：**
1. 初始化项目结构（配置 Tailwind + shadcn/ui）
2. 配置阿里云通义千问 API 服务
3. 实现 GitHub OAuth 认证流程
4. 搭建基础 UI 框架

**请回复 "确认开始" 或提出需要调整的部分！** 🚀
