# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2025-11-24

### Added

- **AI 语义搜索功能** - 项目最具差异化的新功能
  - 自然语言搜索，无需精确关键词
  - 基于 DashScope Embedding API 生成 1536 维向量
  - 余弦相似度计算，智能匹配相关项目
  - 向量缓存到 Gist，加速后续搜索
  - 支持搜索项目描述、README、标签、笔记等内容
  - 增量更新机制，只为新增或修改的项目生成向量
  - 搜索结果实时展示，相似度评分可视化
  - 提供示例查询，帮助用户快速上手

### Fixed

- PWA 构建警告 - 配置 `maximumFileSizeToCacheInBytes` 为 3MB
- 版本号不一致问题 - 统一为 v0.3.0

### Changed

- 更新项目文档，补充统计分析和数据可视化功能说明
- 更新功能完成度记录（16/16 = 100%）

### Technical Details

- 新增 `semantic-search.service.js` 服务（10个核心函数）
  - `cosineSimilarity()` - 余弦相似度计算
  - `generateSearchText()` - 生成搜索文本
  - `generateRepoEmbedding()` - 单个项目向量生成
  - `batchGenerateRepoEmbeddings()` - 批量向量生成
  - `semanticSearch()` - 语义搜索主函数
  - `findSimilarRepos()` - 相似项目推荐
  - `loadEmbeddingsFromMetadata()` - 从 Gist 加载向量
  - `saveEmbeddingsToMetadata()` - 保存向量到 Gist
  - `getReposNeedingEmbedding()` - 检测需要更新的项目
- 新增 `SemanticSearch.jsx` UI 组件
  - 自动初始化向量索引
  - 实时搜索进度展示
  - 示例查询快速选择
  - 错误处理和用户提示
- Dashboard 集成
  - 语义搜索结果过滤
  - 与现有过滤器协同工作

## [0.2.0] - 2025-11-19

### Added

- **统计分析系统** - 完整的数据统计服务
  - 基础统计（总数、标签数、笔记率、AI摘要率）
  - 健康度统计（分布、平均分）
  - 语言分布统计
  - 标签使用统计
  - Stars 增长趋势
  - 活跃项目排行
  - 热力图数据

- **数据可视化仪表板**
  - 统计面板（StatsPanel）展示关键指标
  - 可视化组件（StatsVisualization）
  - Chart.js 图表集成（折线图/饼图/柱状图）
  - 图表导出为图片功能
  - 多维度图表切换

- **自定义统计过滤器**
  - 健康度范围过滤
  - Stars 数量过滤
  - 时间范围过滤
  - 组合过滤支持

- **扩展组件**
  - 语言分布卡片
  - 标签云展示
  - 最近活跃项目列表

## [0.1.0] - 2025-11-15

### Added

- MVP 基础功能
  - GitHub OAuth 认证
  - Stars 数据同步
  - 基础 UI 框架
  - Zustand 状态管理
  - 响应式设计

- 核心功能
  - 标签管理系统（CRUD + 自动补全）
  - AI 自动摘要（通义千问）
  - 导入导出（JSON/Markdown/CSV）
  - 公开分享功能
  - 健康度分析（0-100分）
  - 智能清理（废弃/相似/低交互检测）
  - 智能去重（相似度计算 + 聚类）

- 体验优化
  - ErrorBoundary + Toast 通知
  - 虚拟滚动（react-window）
  - 图片懒加载
  - 骨架屏加载
  - PWA 离线支持
  - 离线指示器

## 下一步计划

### P1: 核心功能增强

- [ ] 学习路径功能
- [ ] 深色模式支持
- [ ] 快捷键系统

### P2: 新功能开发

- [ ] 多账号支持
- [ ] 浏览器扩展
- [ ] 协作功能

### P3: 性能与优化

- [ ] 大量 Stars 优化（>1000）
- [ ] 缓存策略改进
- [ ] 构建体积优化
