# StarKeeper

StarKeeper 管理 GitHub Stars，也能发现开源项目、解释推荐理由，并判断候选项目与你正在做的项目是否相关。当前开发版本为 **v0.4.0**。

[体验现有线上版本](https://star-keeper-eight.vercel.app)

## 功能

- **我的 Stars**：标签、笔记、Collections、图表、相似项目、健康度、智能清理和去重，以及 JSON、Markdown、CSV 导出。
- **Discover**：按新项目、近期活跃、话题和个性化四种方式搜索真实 GitHub 仓库，支持 7、30、90 天窗口、语言筛选、一键 Star、独立的本地收藏和推荐反馈。
- **Project Match**：对比公开仓库的描述、话题、README、主要语言、依赖清单和许可证，给出证据、关系推断、下一步与待验证事项。
- **AI**：可选的 DeepSeek 摘要和项目深入分析，以及 SiliconFlow 语义索引。Discover 和基础项目匹配可直接使用。
- **同步和分享**：Gist 保存标签、笔记和收藏夹。分享使用独立的快照链接。已缓存的公开 Stars 与发现结果支持离线浏览。

## Windows 和 macOS 本地运行

使用 Node.js 22.13+ 或 24 LTS。以下命令可在 macOS 终端和 Windows PowerShell 执行。

```sh
git clone https://github.com/Naloam/StarKeeper.git
cd StarKeeper
npm ci
npm start
```

打开 [http://localhost:3000](http://localhost:3000)。Windows PowerShell 若限制脚本执行，可用 `npm.cmd ci` 和 `npm.cmd start`。本地 Vite 可用 GitHub Personal Access Token 登录。Classic PAT 的 `read:user`、`public_repo` 和 `gist` 支持公开仓库、Star 和元数据同步。需要使用 OAuth 回调时，用 Vercel 开发环境运行应用，并把 OAuth App 回调注册为本地对应地址。

在设置页输入 DeepSeek 或 SiliconFlow Key，可在当前标签页会话中使用。退出登录或结束会话后需重新配置。OAuth Token 和 PAT 同样使用标签页会话存储。同源脚本仍可访问这些凭据，向前部署时请避免在应用同源加载不受信任的脚本。

## Discover 与 Project Match

1. 打开 **Discover**。选择发现模式，按仓库关键词、GitHub Topic、语言和时间过滤。
2. 在 **兴趣画像** 添加话题、调整权重和屏蔽项，或启用从公开 Stars、标签和收藏夹推断。手动填写的 GitHub 搜索词和用于召回的话题会进入 GitHub 搜索请求。个人标签、收藏夹名称和项目目标在本机参与排序。
3. 打开 **我的项目**，选择自己拥有的公开仓库，或填入一个公开 GitHub 仓库地址。添加项目目标和关键词后，从候选卡片打开 **项目匹配**。
4. 可将候选 Star 到 GitHub 或收藏到当前浏览器。反馈会影响个性化结果。隐藏持续 7 天，可在兴趣画像中重置反馈。

个性化每页最多依次搜索三个话题，三页最多九个基础搜索请求。搜索缓存使用 IndexedDB，8 小时内直接复用，刷新时使用 GitHub 返回的 ETag。可重试的短暂错误会退避，较长限流会显示状态。新项目模式使用创建窗口和当前累计 Star 数。近期活跃模式使用 Push 日期。两者的综合分来自相应的新鲜度和质量信号。

个性化排序结合兴趣相关度 35、项目关联度 30、质量 20、新鲜度 15。未选择项目或关闭个性化时，按仍然启用的信号重新归一化。质量使用对数星数和许可证识别信号。项目匹配用话题、描述、语言和关键词解释排序。正向反馈可提升有相似话题的项目，负向反馈和屏蔽项会过滤候选。

公开项目的详情最多为每个仓库读取基础元数据、README、一个识别出的依赖清单与许可证，详情缓存 8 小时。**用 AI 深入分析**会重新检查公开状态，经确认后最多发出 1 次模型请求，输入是公开资料摘录，输出限制 500 Token。模型价格由服务商决定。报告中列出的许可证和集成建议需要人工核实。语义索引单次最多处理 100 个公开仓库，每 10 个仓库一批，提交前显示请求量。默认索引只发送公开内容，包含个人标签、摘要、笔记的选项需显式选择。项目目标、关键词和反馈保存在浏览器，Project Match 的模型请求仅包含公开仓库证据。

## 数据迁移与恢复

- **选择现有 Gist**：优先使用当前账号已保存的 Gist ID，验证所有权。通过特征文件分页发现旧 Gist。识别到多个候选时，界面会请你打开候选并选择。两个历史描述均可识别。
- **编辑与离线**：原主文件保留，各设备在同一 Gist 写入独立的字段编辑日志，读取时按时间和唯一操作 ID 合并。离线补交只重放操作，保留独立字段。两台设备修改同一字段时，按操作时间排序，同一时间用操作 ID 决胜。多标签页有 Web Locks 时串行写同一个设备文件，否则各标签页有独立日志。长期高频编辑会使日志增长。
- **仓库 ID 与向量**：旧的 `owner/repo` 记录保留，能确认对应关系的字段迁至 GitHub 数字 ID。应用尝试解析少量旧地址的 GitHub 重定向，已失效或复用的名称需要人工核对。迁移前原始 JSON 保留一份副本。旧向量留在原 Gist，并在浏览器建立独立缓存。来源模型未知的旧向量保留作恢复，当前索引以输入哈希和模型判定失效。
- **旧版分享**：裸 Gist ID 链接在新版分享路由停用。已知旧分享地址的访问者仍可能直接访问 GitHub Gist 和历史。应用发现主 Gist 曾用于分享时暂停写入，并提供确认后复制到新 Gist 的选项。原 Gist 与历史会保留并标记退役。新分享链接只读取独立快照文件，内含公开仓库的白名单字段和用户输入的标题、简介。撤销会关闭当前快照，已有的副本和 GitHub 历史仍可能被访问。
- **备份和回滚**：使用设置页的 **下载元数据备份** 导出合并视图与本机待同步编辑。回滚旧版前先做备份，旧版只能读取主快照，无法识别新版日志。需要继续用旧版时，可在 GitHub Gists 创建新的未列出 Gist，将备份内容作为 `starkeeper-metadata.json`，并在旧版先确认选中的 Gist。旧版 `offline-sync-queue` 和 `metadata-cache` 若有数据依然保留在浏览器，可手动导出核对。主快照因旧版覆盖出现缺字段时，可从 GitHub Gist 修订历史和本地备份恢复。

GitHub 的未列出 Gist 仍可被掌握地址的人读取。主元数据 Gist 地址应独立保存。

## GitHub Pages 体验版

构建命令为 `npm run build -- --mode pages`，站点路径为 `/StarKeeper/`。Pages 构建使用 hash 路由，访客可刷新和直接打开 `#/share/…` 链接。使用只需 `public_repo`、`gist`、`read:user` 范围的 GitHub 个人令牌体验。GitHub OAuth 入口部署在 Vercel，Pages 体验版提供个人令牌登录。

仓库的 Settings → Pages → Source 设为 GitHub Actions 后，重新运行 `Publish StarKeeper Pages preview` 工作流即可发布。

## Vercel

导入仓库，选择 Vite 框架，安装用 `npm ci`，构建用 `npm run build`，产物目录为 `dist`。OAuth 需在 GitHub OAuth App 注册对应的 `https://<domain>/auth/callback`，并在 Vercel 环境中设置：

| 变量                       | 配置                         |
| -------------------------- | ---------------------------- |
| `VITE_GITHUB_CLIENT_ID`    | OAuth App 的公开 Client ID   |
| `VITE_GITHUB_REDIRECT_URI` | 对应环境的完整回调 URL       |
| `GITHUB_CLIENT_SECRET`     | 仅服务端读取的 Client Secret |

如果旧环境曾配置 `VITE_GITHUB_CLIENT_SECRET`，维护者应轮换 OAuth Secret，并从对应部署环境移除旧变量。旧的 `VITE_*_API_KEY` 和 `VITE_GITHUB_TOKEN` 应从构建环境移除，后续在设置页或登录页按会话输入凭据。Preview 可用 PAT 验证，或配置专用 OAuth App 及固定 Preview 地址。生产环境的模型请求由浏览器直连服务商，需要服务商支持该站点的 CORS 请求。

## 验证

```sh
npm ci
npx tsc --noEmit
npm run lint
npm test -- --run
npm run build
```

## License

[MIT](./LICENSE)
