# 🧪 PR #2 功能测试指南

## 快速开始

### 1. 启动开发服务器
```bash
npm start
# 服务器运行在 http://localhost:3000
```

### 2. 准备测试环境
- GitHub Personal Access Token（需要 `repo` 和 `gist` 权限）
- 清除浏览器缓存（可选,测试首次初始化）

---

## 🎯 核心功能测试流程

### Phase 1: Gist 初始化测试

**目标**: 验证首次登录时自动创建 metadata Gist

**步骤**:
1. 打开浏览器 DevTools (F12)
2. 清除 localStorage: `localStorage.clear()`
3. 使用 PAT 登录应用
4. 观察 Console 输出:
   ```
   ✅ 应该看到: "Gist initialized with ID: gist_xxxxx"
   ❌ 不应该有错误
   ```
5. 检查 localStorage:
   ```javascript
   localStorage.getItem('auth-storage')
   // 应该包含 gistId 字段
   ```
6. 访问 GitHub Gists: https://gist.github.com/
7. 确认存在名为 "StarKeeper metadata" 的新 Gist

**预期结果**:
- ✅ Gist 自动创建成功
- ✅ gistId 保存到本地存储
- ✅ Gist 内容为有效 JSON 格式

---

### Phase 2: 标签管理测试

**目标**: 验证标签的添加、编辑、删除功能

#### 2.1 添加标签

**步骤**:
1. 在 Dashboard 选择任意 repository 卡片
2. 点击"管理标签"按钮（或 Tag 图标）
3. 在 TagInput 中输入 "react"
4. 按 Enter 键添加
5. 观察标签出现在下方列表中

**预期结果**:
- ✅ Modal 正确打开
- ✅ 标签立即显示
- ✅ 标签默认颜色为蓝色

#### 2.2 自定义颜色

**步骤**:
1. 在刚添加的 "react" 标签上
2. 点击不同的颜色选项（红、绿、蓝等）
3. 观察标签颜色实时变化
4. 关闭 Modal
5. 刷新页面
6. 重新打开该 repo 的 Modal

**预期结果**:
- ✅ 颜色立即生效
- ✅ 颜色持久化保存
- ✅ 刷新后颜色不丢失

#### 2.3 删除标签

**步骤**:
1. 打开有标签的 repo Modal
2. 点击标签上的 × 图标
3. 确认标签从列表移除
4. 关闭 Modal
5. 刷新页面验证

**预期结果**:
- ✅ 标签立即删除
- ✅ 删除后自动保存
- ✅ 刷新后标签确认不存在

---

### Phase 3: 自动补全测试

**目标**: 验证标签输入时的智能建议

**步骤**:
1. 在 3 个不同的 repos 中添加 "react" 标签
2. 打开第 4 个 repo 的 Modal
3. 在 TagInput 中输入 "re"
4. 观察下拉建议列表
5. 点击建议中的 "react"

**预期结果**:
- ✅ 输入时显示建议
- ✅ 建议基于已有标签
- ✅ 点击建议快速添加

---

### Phase 4: 笔记功能测试

**目标**: 验证 repo 笔记的保存与读取

**步骤**:
1. 打开任意 repo Modal
2. 在 "Notes" 文本框输入:
   ```
   这是我的个人学习项目
   值得深入研究
   ```
3. 关闭 Modal（自动保存）
4. 刷新页面
5. 重新打开该 Modal

**预期结果**:
- ✅ 笔记内容完整保存
- ✅ 格式保持一致
- ✅ 刷新后不丢失

---

### Phase 5: 标签筛选测试

**目标**: 验证 Sidebar 标签过滤功能

**步骤**:
1. 给至少 5 个 repos 添加不同标签:
   - Repo A: react, frontend
   - Repo B: python, backend
   - Repo C: react, tutorial
   - Repo D: frontend, css
   - Repo E: python, data-science
2. 在 Sidebar 查看"标签"部分
3. 勾选 "react" 标签
4. 确认只显示 Repo A 和 Repo C
5. 再勾选 "python" 标签
6. 确认显示 Repo A, B, C, E（OR 逻辑）
7. 点击"清除筛选"

**预期结果**:
- ✅ Sidebar 显示所有已用标签
- ✅ 单选筛选正确
- ✅ 多选筛选正确（OR 逻辑）
- ✅ 清除筛选恢复全部显示

---

### Phase 6: 数据持久化测试

**目标**: 验证所有数据保存到 Gist

**步骤**:
1. 完成上述所有测试
2. 在 GitHub 查看你的 StarKeeper metadata Gist
3. 检查 JSON 内容格式
4. 关闭浏览器
5. 重新打开应用并登录
6. 验证所有标签、颜色、笔记都存在

**预期 Gist 格式**:
```json
{
  "version": "1.0.0",
  "lastUpdated": "2024-01-15T10:30:00Z",
  "repositories": {
    "facebook/react": {
      "tags": ["react", "frontend"],
      "notes": "这是我的个人学习项目\n值得深入研究",
      "color": "blue"
    },
    "python/cpython": {
      "tags": ["python", "backend"],
      "notes": "",
      "color": "green"
    }
  }
}
```

**预期结果**:
- ✅ Gist 内容格式正确
- ✅ 所有标签完整保存
- ✅ 颜色映射正确
- ✅ 笔记完整保存
- ✅ 重新登录后数据完整

---

### Phase 7: 视图显示测试

**目标**: 验证标签在不同视图下的显示

**步骤**:
1. 给某个 repo 添加 5 个标签
2. 切换到 Grid 视图
3. 观察标签显示（最多 3 个 + "+2"）
4. 切换到 List 视图
5. 观察标签显示

**预期结果**:
- ✅ Grid 视图最多显示 3 个标签
- ✅ 超出部分显示 "+N"
- ✅ List 视图显示方式合理
- ✅ 标签颜色正确显示

---

## 🔥 压力测试

### 多标签测试
- 给单个 repo 添加 10+ 个标签
- 观察 UI 是否正常
- 验证性能是否流畅

### 大量 repos 测试
- 如果你有 100+ stars
- 测试加载速度
- 测试筛选性能

---

## 🐛 错误处理测试

### 网络错误
1. 断开网络连接
2. 尝试添加标签
3. 观察错误提示
4. 恢复网络后重试

**预期结果**:
- ✅ 友好的错误提示
- ✅ 不影响其他功能
- ✅ 恢复后可以重试

### Token 过期
1. 修改 localStorage 中的 token
2. 尝试操作
3. 观察错误处理

**预期结果**:
- ✅ 提示重新登录
- ✅ 清除无效数据

---

## ✅ 测试清单

**基础功能**:
- [ ] Gist 自动创建
- [ ] 标签添加
- [ ] 标签删除
- [ ] 颜色自定义
- [ ] 笔记保存
- [ ] 自动补全

**过滤功能**:
- [ ] 单标签筛选
- [ ] 多标签筛选
- [ ] 清除筛选

**显示功能**:
- [ ] Grid 视图显示
- [ ] List 视图显示
- [ ] 颜色正确显示

**持久化**:
- [ ] 页面刷新
- [ ] 重新登录
- [ ] Gist 格式正确

**错误处理**:
- [ ] 网络错误
- [ ] Token 错误
- [ ] 边界情况

---

## 📸 测试截图建议

建议记录以下截图用于 PR 说明:

1. **Gist 初始化**: Console 输出
2. **标签 Modal**: 显示标签管理界面
3. **颜色选择**: 不同颜色的标签
4. **自动补全**: 建议列表
5. **Sidebar 筛选**: 标签筛选效果
6. **GitHub Gist**: Gist 内容截图
7. **Grid 视图**: 标签在卡片上的显示
8. **List 视图**: 标签在列表中的显示

---

## 🎉 测试完成后

如果所有测试通过:

1. **Commit 代码**:
   ```bash
   git add .
   git commit -m "feat: implement tag management with Gist storage

   - Add TagBadge, TagInput, TagModal components
   - Implement metadata.service.js for Gist CRUD
   - Integrate tag management into DashboardPage
   - Add tag filtering in Sidebar
   - Support custom colors for tags
   - Add notes functionality
   - Auto-save with debounce (1s)
   - Persist all metadata to GitHub Gist
   
   Closes #2"
   ```

2. **Push 分支**:
   ```bash
   git push origin feature/tag-management
   ```

3. **创建 PR #2**:
   - 标题: `feat: Tag Management with Gist Storage`
   - 使用 TESTING.md 中的截图
   - 列出所有新功能
   - 标注测试通过项

4. **通知用户**:
   ```
   ✅ PR #2 已创建
   🔗 查看: https://github.com/Naloam/StarKeeper/pull/2
   📋 等待 Review
   ```

---

## 🚀 下一步

PR #2 合并后:
- 开始 AI 自动摘要功能
- 或者实现导入/导出功能
- 继续按照 PROJECT_PLAN.md 推进

---

**Happy Testing! 🎊**
