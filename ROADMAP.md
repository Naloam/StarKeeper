# StarKeeper 待办事项 (2026-03-31)

## 竞品对比发现

对标项目：StarWise (AI标签)、Astral (老牌经典)、GithubStarsManager (React+AI)、Stardex (ML聚类)

### StarKeeper 独特优势

- 一站式方案（管理+分析+清理+AI摘要+健康度+去重）
- GitHub Gist 存储，天然多设备同步
- 阿里云 DashScope 语义搜索，中英文支持
- PWA 离线支持

### 竞品有而我们缺少的

- AI 自动标签推荐（StarWise 用 Gemini 自动分类）
- 项目关系图谱可视化（Stardex 用 D3.js）
- 后台自动更新任务（StarWise 有定时任务）
- 个性化推荐系统
- 协作/团队功能

---

## 已完成

### ✅ 高优先级

- **添加测试覆盖** — PR #16: 5个测试文件, 61个用例 (health/similarity/semantic-search/export/cleanup)
- **修复数据同步竞态** — PR #18: enqueueWrite 写入队列, 串行化所有 Gist 写入
- **完善错误处理** — PR #17: 20处 alert→toast 替换

### ✅ 中优先级

- **性能优化** — PR #19: applyFilters 32ms 防抖 + 路由级代码分割 (704KB→215KB+按需)
- **完善 PWA 离线** — PR #20: 同步队列去重/指数退避重试/队列大小限制/ErrorBoundary 错误分类
- **实现 Collections 功能** — PR #21: 收藏夹 CRUD + Sidebar 过滤 + Gist 持久化 + Grid/List 视图支持

---

## 待做

### 低优先级

### 7. 无障碍 (a11y)

- 缺少键盘导航
- ARIA 标签不完整

### 8. TypeScript 迁移

- 纯 JS 项目，缺少类型安全

### 9. 竞品差异化功能

- AI 自动标签推荐
- 项目关系图谱
- 后台定时任务
- 个性化推荐
