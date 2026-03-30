# StarKeeper 项目计划书

> **当前版本**: v0.3.0  
> **最后更新**: 2025-11-24  
> **项目状态**: 核心功能已完成，统计分析系统已实现，准备开发语义搜索

---

## 📋 项目概述

**StarKeeper** 是一款基于 AI 增强的 GitHub Stars 智能管理工具，帮助开发者高效管理和利用已收藏的开源项目。

### 技术栈

- **前端**: React 18.2 + Vite 4.5 + Tailwind CSS 3.3
- **状态管理**: Zustand 4.5
- **AI 服务**: 阿里云通义千问 DashScope API
- **存储方案**: GitHub Gist（隐私优先）

### 核心价值

- 🤖 AI 自动摘要 - 一键生成项目洞察
- 📊 健康度分析 - 评估项目活跃度和维护状态
- 🧹 智能清理 - 自动检测废弃和重复项目
- 🏷️ 灵活标签 - 自定义分类管理
- ⚡ 离线支持 - PWA 应用，支持离线访问
- 🔒 隐私优先 - 数据存储在用户 Gist

---

## ✅ 已完成功能（13个PR）

### Phase 1: MVP 基础功能

#### PR #1: MVP Foundation ✅

- GitHub OAuth 认证
- Stars 数据同步（分页加载）
- 基础 UI 框架（Header/Sidebar/MainLayout）
- Zustand 状态管理
- 响应式设计

#### PR #2: 标签管理系统 ✅

- 标签 CRUD 操作
- 自动补全
- 颜色自定义
- 笔记功能
- Gist 存储

#### PR #3 & #6: AI 自动摘要 ✅

- 一键生成项目摘要
- 批量生成
- 摘要缓存
- 手动编辑

#### PR #4: 导入导出 ✅

- 导出 Markdown/JSON/CSV
- 数据备份和迁移

#### PR #5: 公开分享 ✅

- 生成分享链接
- 自定义标题描述
- 公开页面展示

### Phase 2: 智能增强

#### PR #7: 健康度分析 ✅

- 综合评分（0-100分）
  - 活跃度40分：commits/release/更新
  - 社区30分：issue/PR/contributors
  - 维护30分：archived/CI/README
- 5个等级徽章
- 批量分析
- 详情弹窗

#### PR #8: 智能清理 ✅

- 废弃项目检测
- 相似项目检测
- 低交互检测
- 安全归档（30天可恢复）

#### PR #9: 智能去重 ✅

- 相似度计算
- 项目聚类
- 对比分析
- 推荐最佳

### Phase 3: 体验优化

#### PR #10 & #11: UI/UX 增强 ✅

- ErrorBoundary + Toast 通知
- 移动端优化
- 虚拟滚动
- 图片懒加载
- 骨架屏

#### PR #12: PWA 离线支持 ✅

- Service Worker
- 离线缓存策略
- PWA 安装提示
- 离线编辑同步

#### PR #13: 统计分析与数据可视化 ✅

- 完整的统计分析服务（17个函数）
  - 基础统计（总数、标签、笔记、AI摘要率）
  - 健康度统计（分布、平均分）
  - 语言分布统计
  - 标签使用统计
  - Stars 增长趋势
  - 活跃项目排行
- 数据可视化仪表板
  - 统计面板（StatsPanel）
  - 可视化组件（StatsVisualization）
  - Chart.js 图表（折线图/饼图/柱状图）
  - 图表导出功能
- 自定义统计过滤器
  - 健康度范围过滤
  - Stars 数量过滤
  - 时间范围过滤
- 扩展组件
  - 语言分布卡片
  - 标签云
  - 最近活跃项目

#### PR #14: AI 语义搜索功能 ✅

- 语义搜索服务（semantic-search.service.js）
  - embedding 向量生成
  - 余弦相似度计算
  - 自然语言搜索
  - 相似项目推荐
- 语义搜索 UI 组件
  - 自然语言输入
  - 自动初始化向量索引
  - 搜索结果展示
  - 示例查询
- Dashboard 集成
  - 向量缓存到 Gist
  - 增量更新机制
  - 搜索结果过滤

---

## 📊 功能完成度

| 功能        | 状态 | 核心文件                                           |
| ----------- | ---- | -------------------------------------------------- |
| OAuth 认证  | ✅   | `auth.js`, `CallbackPage.jsx`                      |
| Stars 同步  | ✅   | `github.service.js`                                |
| 标签管理    | ✅   | `tags/*`, `metadata.service.js`                    |
| AI 摘要     | ✅   | `dashscope.service.js`                             |
| 导入导出    | ✅   | `export.service.js`                                |
| 公开分享    | ✅   | `SharePage.jsx`                                    |
| 健康度分析  | ✅   | `health.service.js`                                |
| 智能清理    | ✅   | `cleanup.service.js`                               |
| 智能去重    | ✅   | `similarity.service.js`                            |
| 错误处理    | ✅   | `ErrorBoundary.jsx`                                |
| 性能优化    | ✅   | `VirtualizedGrid.jsx`                              |
| PWA 离线    | ✅   | `OfflineIndicator.jsx`                             |
| 统计分析    | ✅   | `stats.service.js`                                 |
| 数据可视化  | ✅   | `StatsVisualization.jsx`, `charts/*`               |
| AI 语义搜索 | ✅   | `semantic-search.service.js`, `SemanticSearch.jsx` |

**总完成度**: 16/16 = **100%** ✅

---

## 🚀 未来规划

### P1: 高级功能（优先）

**1. 语义搜索** ✅ 已完成

- 自然语言查询
- 向量化检索
- 相似项目推荐

**2. 学习路径**

- 创建学习计划
- 进度追踪
- 路径分享

**3. 趋势分析**

- Stars 增长曲线
- 健康度历史
- 统计分析

### P2: 增强优化

**4. 多账号支持**
**5. 浏览器扩展**
**6. 协作功能**
**7. 深色模式**
**8. 快捷键**

---

## 📁 项目结构

```
src/
├── components/
│   ├── common/      # 12个通用组件
│   ├── layout/      # Header, Sidebar, MainLayout
│   └── tags/        # 标签相关组件
├── pages/           # 6个页面
│   ├── LoginPage.jsx
│   ├── CallbackPage.jsx
│   ├── DashboardPage.jsx
│   ├── CleanupPage.jsx
│   ├── DeduplicationPage.jsx
│   └── SharePage.jsx
├── services/        # 7个服务
│   ├── github.service.js
│   ├── dashscope.service.js
│   ├── metadata.service.js
│   ├── health.service.js
│   ├── cleanup.service.js
│   ├── similarity.service.js
│   └── export.service.js
├── store/           # Zustand stores
├── utils/           # 工具函数
└── config/          # 配置
```

---

## 🎯 开发建议

### 当前优先级

1. **生产部署** - 项目已稳定，可部署使用
2. **用户反馈** - 收集真实使用场景的反馈
3. **功能增强** - 学习路径、深色模式等

### 下一步功能

- ✅ 数据可视化（已完成）
- ✅ 语义搜索（已完成）
- 📋 学习路径（计划中）
- 📋 深色模式（计划中）

---

## 📝 Git 规范

### 提交格式

```
feat: 新功能
fix: Bug 修复
docs: 文档更新
refactor: 重构
perf: 性能优化
```

### 分支策略

```
main         - 生产分支
feature/*    - 功能分支
fix/*        - 修复分支
```

---

**文档版本**: v2.0  
**最后更新**: 2025-11-19
