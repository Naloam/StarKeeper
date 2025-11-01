# StarKeeper - 开发计划书

> **最后更新**: 2025-11-01  
> **当前阶段**: MVP 基础功能完成，进入进阶功能开发阶段  
> **版本**: v0.2.0-alpha

## 📋 项目概述

### 项目名称
**StarKeeper** - GitHub Stars 智能管理工具

### 项目定位
基于 AI 增强的 GitHub Stars 智能管理工具，通过自动摘要、标签系统、活跃度追踪等功能，帮助开发者高效管理和利用已收藏的开源项目。

### 核心价值主张
1. **智能化**: AI 自动摘要 (阿里云通义千问)，一键生成项目洞察
2. **可追溯**: 活跃度监控 + 健康指数，避免依赖过时项目
3. **隐私优先**: 使用 GitHub Gist 存储，数据归用户所有
4. **高效管理**: 标签分类 + 多维度搜索过滤 + 批量操作

---

## 🎯 当前项目状态 (2025-11-01)

### ✅ 已完成功能 (v0.1.0)

#### 阶段一: MVP 核心功能 (已完成 - PR #1-6)

| 功能模块 | 完成度 | PR | 关键文件 |
|---------|-------|-----|---------|
| **F1.1 用户认证** | ✅ 100% | #1 | `utils/auth.js`, `CallbackPage.jsx` |
| **F1.2 Stars 数据获取** | ✅ 100% | #1 | `services/github.service.js` |
| **F1.3 标签系统** | ✅ 100% | #2 | `components/tags/*`, `metadata.service.js` |
| **F1.4 基础搜索与过滤** | ✅ 100% | #1 | `DashboardPage.jsx`, Zustand filters |
| **F1.5 卡片化展示** | ✅ 100% | #1 | `DashboardPage.jsx` (网格视图) |
| **F1.6 导入/导出** | ✅ 100% | #4 | `services/export.service.js`, `ExportModal.jsx` |
| **F1.7 公开分享** | ✅ 100% | #5 | `SharePage.jsx`, `ShareModal.jsx` |
| **F2.1 AI 自动摘要** | ✅ 100% | #3, #6 | `dashscope.service.js`, `AISummary.jsx` |

**技术债务清单**:
- ⚠️ 虚拟滚动未实现 (大量 stars 性能问题)
- ⚠️ 列表视图未实现 (仅支持网格视图)
- ⚠️ 批量取消 star 未实现 (仅有批量 AI 生成)
- ⚠️ 单元测试覆盖率不足 (已有框架但缺测试用例)

### 🚧 进行中功能

暂无 (等待下一阶段任务启动)

### 📋 待开发功能路线图

详见下方 [开发路线图](#开发路线图) 部分。

---

## 📅 开发路线图

### 🎯 阶段二: 进阶功能增强 (预计 3-4 周)

> **目标**: 提升核心价值，完善用户体验，实现产品差异化

#### P0 - 核心价值功能 (立即开始)#### P0 - 核心价值功能 (立即开始)

##### 📊 F2.2 项目健康度分析 (优先级: 🔴 最高)

**业务价值**: 解决用户核心痛点 - 判断项目是否值得持续关注

**功能需求**:
- [ ] **任务 2.2.1**: 扩展 GitHub API 数据获取
  - 实现 `getRepoReleases()` - 获取最新 release 信息
  - 实现 `getRepoActivity()` - 获取 commits/issues/PRs 统计
  - 实现 `getRepoCIStatus()` - 获取 GitHub Actions 状态
  - 文件: `services/github.service.js`
  - 预计: 1 天

- [ ] **任务 2.2.2**: 创建健康度评分服务
  - 实现 `calculateHealthScore()` - 综合评分算法 (0-100分)
  - 实现 `analyzeActivity()` - 活跃度分析
  - 实现 `detectStaleRepos()` - 检测废弃/低维护项目
  - 创建文件: `services/health.service.js`
  - 预计: 1 天

- [ ] **任务 2.2.3**: UI 展示与交互
  - 在仓库卡片上显示健康度徽章 (绿🟢/黄🟡/红🔴)
  - 添加"批量分析健康度"按钮
  - 实现按健康度过滤功能
  - 创建 `HealthBadge.jsx` 组件
  - 修改文件: `DashboardPage.jsx`
  - 预计: 1 天

- [ ] **任务 2.2.4**: 健康度详情弹窗
  - 创建 `HealthDetailModal.jsx` 组件
  - 显示评分细分项 (活跃度/社区响应/维护状态)
  - 显示趋势图 (简单的进度条可视化)
  - 显示改进建议
  - 预计: 1 天

**健康度算法设计**:
```javascript
健康度评分 = 活跃度(40%) + 社区健康(30%) + 维护状态(30%)

- 活跃度 (40分):
  * 最近30天 commits 数量: 15分
  * Release 频率: 15分
  * 最后更新距今时间: 10分

- 社区健康 (30分):
  * Issue 响应速度: 15分
  * PR merge 率: 10分
  * Contributors 数量: 5分

- 维护状态 (30分):
  * 是否被标记为 archived: -30分
  * 是否有活跃的 CI/CD: 15分
  * README 更新时间: 15分
```

**数据缓存策略**:
- 健康度数据缓存在 Gist 的 `metadata.json` 中
- 缓存有效期: 7天
- 用户可手动刷新单个或批量项目

**PR 交付标准**: PR #7
- ✅ 健康度分析功能完整可用
- ✅ UI 美观,交互流畅
- ✅ 批量分析支持进度展示
- ✅ 错误处理完善
- ✅ 代码有注释和文档

**预计完成时间**: 3-4 天

---

##### 🧹 F2.3 智能清理建议 (优先级: 🔴 高)

**业务价值**: 帮助用户清理无效/重复的 stars,提升管理效率

**功能需求**:
- [ ] **任务 2.3.1**: 清理分析算法
  - 实现废弃项目检测 (健康度 < 30 分)
  - 实现相似项目检测 (基于名称/语言/描述相似度)
  - 实现低交互项目检测 (从未打开过/无标签/无笔记)
  - 创建文件: `services/cleanup.service.js`
  - 预计: 1.5 天

- [ ] **任务 2.3.2**: 清理建议 UI
  - 创建 `pages/CleanupPage.jsx`
  - 按类别展示建议 (废弃项目/相似项目/未使用项目)
  - 显示详细理由和替代方案
  - 支持逐个审查和批量确认
  - 预计: 1.5 天

- [ ] **任务 2.3.3**: 清理执行与恢复
  - 实现安全删除 (先移至"归档"区,30天后永久删除)
  - 实现一键恢复功能
  - 显示恢复期限倒计时
  - 预计: 1 天

**清理规则**:
1. **废弃项目**: 健康度 < 30 分 且 最后更新 > 1年
2. **相似项目**: 名称相似度 > 80% 或 功能描述重复
3. **未使用项目**: Star 后从未打开 + 无标签 + 无笔记

**PR 交付标准**: PR #8
- ✅ 三类清理建议准确识别
- ✅ UI 清晰易懂,操作安全
- ✅ 恢复机制完善
- ✅ 用户数据不丢失

**预计完成时间**: 3-4 天

---

##### 🔗 F2.4 智能去重与聚类 (优先级: 🟡 中)

**业务价值**: 发现功能重复的库,帮助用户做技术选型

**功能需求**:
- [ ] **任务 2.4.1**: 简单相似度计算 (不使用 Embedding)
  - 基于 repo 名称的编辑距离
  - 基于语言 + 主要关键词匹配
  - 基于 topics 标签重合度
  - 创建文件: `services/similarity.service.js`
  - 预计: 1 天

- [ ] **任务 2.4.2**: 聚类展示 UI
  - 创建 `components/SimilarReposCard.jsx`
  - 展示相似项目组
  - 对比关键指标 (stars/forks/活跃度/健康度)
  - 推荐最佳选择
  - 预计: 1.5 天

- [ ] **任务 2.4.3**: 去重操作
  - 批量取消 star (带确认对话框)
  - 记录用户偏好 (下次自动推荐)
  - 显示去重统计报告
  - 预计: 0.5 天

**相似度阈值**:
- 高度相似: > 80% (直接提示去重)
- 中度相似: 60-80% (提示对比)
- 低度相似: < 60% (不展示)

**PR 交付标准**: PR #9
- ✅ 相似项目准确识别
- ✅ 对比信息全面
- ✅ 去重操作安全可靠

**预计完成时间**: 2-3 天

---

#### P1 - 体验优化功能 (第二优先级)

##### 🎨 F2.5 UI/UX 增强

- [ ] **任务 2.5.1**: 错误处理完善
  - 创建 `ErrorBoundary.jsx` 组件
  - 集成 react-hot-toast 通知系统
  - 实现骨架屏加载状态
  - 实现全局错误提示
  - 预计: 1-2 天

- [ ] **任务 2.5.2**: 移动端响应式优化
  - 侧边栏改为抽屉式 (Drawer)
  - 优化触摸交互 (增大点击区域)
  - 实现下拉刷新
  - 优化小屏幕布局
  - 预计: 2-3 天

- [ ] **任务 2.5.3**: 性能优化
  - 实现虚拟滚动 (react-window)
  - 实现图片懒加载
  - 优化大列表渲染性能
  - 实现代码分割
  - 预计: 2 天

**PR 交付标准**: PR #10
- ✅ 移动端体验良好
- ✅ 错误提示友好
- ✅ 加载速度明显提升

**预计完成时间**: 4-5 天

---

##### 📱 F2.6 PWA 离线支持

- [ ] **任务 2.6.1**: Service Worker 配置
  - 使用 Vite PWA 插件
  - 配置离线缓存策略
  - 缓存静态资源
  - 预计: 1 天

- [ ] **任务 2.6.2**: 离线功能实现
  - 离线查看已加载的 stars
  - 离线编辑标签和笔记 (同步队列)
  - 网络恢复后自动同步
  - 预计: 1.5 天

- [ ] **任务 2.6.3**: 安装提示
  - 实现 PWA 安装横幅
  - 添加桌面图标和启动画面
  - 优化 manifest.json
  - 预计: 0.5 天

**PR 交付标准**: PR #11
- ✅ 可作为独立 App 安装
- ✅ 离线功能可用
- ✅ 图标和启动画面美观

**预计完成时间**: 2-3 天

---

#### P2 - 差异化功能 (中期规划)

##### 🔍 F2.7 语义搜索 (需要 Embedding)

**技术依赖**: 阿里云 DashScope text-embedding-v2 API

- [ ] **任务 2.7.1**: Embedding 生成服务
  - 扩展 `dashscope.service.js`
  - 实现 `generateEmbedding()` 方法
  - 批量生成 embeddings
  - 预计: 1 天

- [ ] **任务 2.7.2**: 向量存储选型与集成
  - 选项 A: 本地 SQLite + sqlite-vss
  - 选项 B: Supabase Vector (pgvector)
  - 实现向量 CRUD 操作
  - 预计: 2 天

- [ ] **任务 2.7.3**: 语义搜索实现
  - 实现自然语言查询
  - 计算余弦相似度
  - 排序和高亮匹配原因
  - 创建 `SemanticSearch.jsx` 组件
  - 预计: 2 天

**成本估算**: 
- 1000个 stars × 500 tokens/README = 500K tokens
- 成本: ¥0.0007 × 500 = ¥0.35 (首次)
- 每月增量更新: < ¥0.1

**PR 交付标准**: PR #12
- ✅ 语义搜索准确度高
- ✅ 响应速度 < 1s
- ✅ UI 清晰展示相关性

**预计完成时间**: 4-5 天

---

##### 📚 F2.8 学习路径功能

- [ ] **任务 2.8.1**: 数据模型扩展
  - 扩展 Collection 类型为 LearningPath
  - 定义 Milestone 数据结构
  - 实现路径 CRUD 操作
  - 预计: 1 天

- [ ] **任务 2.8.2**: 学习路径创建 UI
  - 创建 `CreateLearningPath.jsx`
  - 实现拖拽排序 (react-beautiful-dnd)
  - 实现里程碑编辑
  - 预计: 2 天

- [ ] **任务 2.8.3**: 学习进度追踪
  - 创建时间线视图
  - 显示完成进度条
  - 实现状态切换 (未开始/进行中/已完成)
  - 添加笔记和心得
  - 预计: 1.5 天

- [ ] **任务 2.8.4**: 学习路径分享
  - 导出为 Markdown
  - 生成公开分享链接
  - 创建只读展示页面
  - 预计: 1 天

**PR 交付标准**: PR #13
- ✅ 学习路径创建流畅
- ✅ 进度追踪清晰
- ✅ 分享页面美观

**预计完成时间**: 4-5 天

---

##### 🌐 F2.9 浏览器扩展 (Chrome)

- [ ] **任务 2.9.1**: 扩展项目初始化
  - 使用 Plasmo 框架
  - 配置 Manifest V3
  - 设置 TypeScript + Tailwind
  - 预计: 1 天

- [ ] **任务 2.9.2**: Content Script 实现
  - 检测 GitHub repo 页面
  - 注入侧边栏 UI
  - 显示是否已 star + 标签
  - 显示 AI 摘要和健康度
  - 预计: 2 天

- [ ] **任务 2.9.3**: Popup UI
  - 创建扩展弹窗界面
  - 显示最近 stars
  - 实现快速搜索
  - 添加设置和主应用链接
  - 预计: 1.5 天

- [ ] **任务 2.9.4**: 数据同步
  - 使用 chrome.storage
  - 实现与主应用的数据同步
  - 处理冲突和合并
  - 预计: 1.5 天

- [ ] **任务 2.9.5**: 发布到 Chrome Web Store
  - 准备商店资料 (描述/截图/图标)
  - 提交审核
  - 预计: 1 天

**PR 交付标准**: PR #14
- ✅ 扩展功能完整
- ✅ 与主应用同步正常
- ✅ 通过 Chrome 商店审核

**预计完成时间**: 1 周

---

### 🚀 阶段三: 企业版与变现 (长期规划 4-6 周)

#### P3 - 企业级功能

##### 🔐 F3.1 安全与依赖扫描

- [ ] 集成 GitHub Dependabot API
- [ ] 集成 Snyk 或 OSV.dev
- [ ] 检测已知漏洞 (CVE)
- [ ] 生成安全报告

**预计**: 1 周

---

##### 👥 F3.2 团队协作

- [ ] 组织账户管理
- [ ] 团队成员邀请与权限
- [ ] 共享 Collections
- [ ] 评论与讨论
- [ ] Audit Log

**预计**: 2 周

---

##### 📊 F3.3 高级分析与可视化

- [ ] 数据可视化仪表盘
- [ ] Stars 增长趋势图
- [ ] 语言分布统计
- [ ] 主题词云
- [ ] 自定义报告导出

**预计**: 1 周

---

##### 💻 F3.4 VSCode 扩展

- [ ] 侧边栏集成
- [ ] 快速搜索 starred repos
- [ ] 查看 AI 摘要
- [ ] Clone repo 一键操作

**预计**: 1 周

---

##### 🏢 F3.5 企业级特性

- [ ] SSO 登录 (SAML / OAuth)
- [ ] 私有部署选项 (Docker)
- [ ] 数据导出与备份
- [ ] SLA 保障
- [ ] 优先技术支持

**预计**: 2 周

---

## 📊 任务优先级矩阵

| 功能 | 优先级 | 业务价值 | 技术复杂度 | 预计时间 | 目标PR |
|------|-------|---------|-----------|---------|--------|
| 项目健康度分析 | 🔴 P0 | 很高 | 中 | 3-4天 | #7 |
| 智能清理建议 | 🔴 P0 | 高 | 中 | 3-4天 | #8 |
| 智能去重聚类 | 🟡 P0 | 中 | 低 | 2-3天 | #9 |
| UI/UX 增强 | 🟡 P1 | 高 | 低 | 4-5天 | #10 |
| PWA 离线支持 | 🟡 P1 | 中 | 中 | 2-3天 | #11 |
| 语义搜索 | 🟢 P2 | 中 | 高 | 4-5天 | #12 |
| 学习路径 | 🟢 P2 | 中 | 中 | 4-5天 | #13 |
| 浏览器扩展 | 🟢 P2 | 高 | 高 | 1周 | #14 |
| 安全扫描 | 🔵 P3 | 中 | 中 | 1周 | #15+ |
| 团队协作 | 🔵 P3 | 低 | 高 | 2周 | #16+ |
| 高级分析 | 🔵 P3 | 低 | 中 | 1周 | #17+ |
| VSCode 扩展 | 🔵 P3 | 中 | 高 | 1周 | #18+ |

**优先级说明**:
- 🔴 P0: 立即开始 (本周启动)
- 🟡 P1: 近期规划 (本月完成)
- 🟢 P2: 中期规划 (下月)
- 🔵 P3: 长期规划 (Q1 2026)

---

## 🔧 技术栈

### 当前技术栈 (v0.1.0)
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
