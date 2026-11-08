# 绿玫瑰 · 周末来信

> 交接与安全说明：先阅读 [ARENA_HANDOFF.md](ARENA_HANDOFF.md)。当前 `wrangler.jsonc` 指向已有 Cloudflare 项目与域名，`npm run deploy` 会更新该线上站点；部署前确认目标和权限。Vite 本地预览和纯静态托管不提供回信 API。请勿提交真实 `.env`、邀请链接、凭据、回信或私人截图。用户提供的音乐在公开分享前须确认授权。

推荐使用 Node.js 24 和锁定依赖安装：`npm ci`。完整命令与限制见下文及 [交接开发指南](arena-export/DEVELOPMENT_GUIDE.md)。历史需求和测试记录可能与后续修改不同，以当前源码和最新交接说明为准。

一封可以在手机浏览器和微信内打开的私人邀请函。Vite + TypeScript + 原生 CSS，配有自动发送邮件的 Cloudflare Worker；无统计脚本、无外链字体或图片。主视觉是精细植物水彩绿玫瑰，透明 WebP 本地打包。绿色主题和首页标题均已选定 C。

## 本地预览

三种绿色设计方案：启动预览后打开 `http://localhost:4173/?preview=1&theme=rose`，可切换 A 雾绿信笺、B 玫瑰花影、C 林间夜色。点击“单独打开”可查看完整邀请函，方案参数分别为 `?theme=sage`、`?theme=rose`、`?theme=forest`。已选定 C「林间夜色」，普通根地址默认采用该方案，正式邀请不显示方案切换条。

“没空诶”已采用 B → A → C 的递进玩法，普通根地址直接体验：前两次远距离移动并缩小变淡，第 3、4 次化为水彩玫瑰叶，第 5 次起短暂隐身、1.5 秒后从花边重现。正式页面不显示方案选项栏。旧方案仍可独立预览：`http://localhost:4173/?escapePreview=1&escape=roam`；单独地址为 `?escape=roam`、`?escape=camouflage` 或 `?escape=vanish`。

需要 Node.js 24（本项目已在 24.18.1 验证）及 npm。在项目根目录执行：

```powershell
npm install
npm run dev
```

打开终端显示的地址，通常为 http://localhost:5173 。命令监听局域网地址，同一 Wi-Fi 下的手机可以打开终端显示的 Network 地址，例如 `http://192.168.1.100:5173`。Windows 防火墙需允许 Node 的专用网络访问。

预览最终构建：

```powershell
npm run build
npm run preview
```

通常打开 http://localhost:4173 。不要直接双击 dist/index.html，需要 HTTP 服务。

## 功能

- 深绿林间夜色、自然排版、精细水彩绿玫瑰、轻柔进入与低幅度呼吸。
- 四步邀请：有空 → 时间 → 活动 → 小计划；返回修改保留填写内容。
- “没空诶”在鼠标靠近或每次触屏按下时远距离躲避，依次缩小变淡、变成叶片、短暂隐身，实体点击不会触发拒绝。落点在玫瑰区域两侧，不遮挡主按钮；按最新批注移除了首页底部文字拒绝入口，键盘/屏幕阅读器仍可直接拒绝。减少动态模式换成瞬时移动。
- 本地背景音乐《Rising Road ～メインテーマ～》，采用你提供的完整 MP3，循环播放。首次点“有空呀”尝试开启，也可点右上角音符提前播放或暂停；跨步骤连续播放，切到后台暂停。载入失败或浏览器限制播放时仍可继续邀请并手动重试。音乐仅在播放时下载。
- 周末真实日期、具体时段单选、其他时间自由填写；八种活动多选，“你来决定”与其他活动互斥。
- 最多 200 字的补充想法、字数提示、温和校验，允许只填自定义想法。
- 结果页集中显示时间、活动和备注，按最新截图要求移除了复制、分享按钮，保留英文签名与返回修改。
- 320–430px 窄屏、横屏、桌面、全面屏 safe-area、键盘焦点、减少动态设置。
- 输入只通过 DOM value/textContent 显示，不将自由输入拼入 HTML。

填写状态只在页面内存保存，**刷新或关闭网页重置**。使用完整邀请链接进入后，生成计划会自动提交并邮件通知；同一次页面内相同计划不会重复发送，返回修改保留输入，发送失败可重试。接收邮箱和邀请密钥放在后台加密配置中。云端私密保存回信，没有公开读取接口。只有收到邮件服务的成功回执后，页面才显示“回信已送出”。

本地验证邮件接口：配置私有 `.env`（参照 `.env.example`），执行 `npm run build`、`npm start`。服务位于 `http://127.0.0.1:4174/`，将 `.cloudflare-tunnel/invitation-key.txt` 中的值作为 `?invite=密钥` 参数加入地址。`npm run dev` 和 `npm run preview` 仅预览静态界面，不提供邮件接口。

## 修改邀请内容

主要配置位于 `src/config.ts`：

| 项目 | 修改位置 |
| --- | --- |
| 网页标题、信笺名称 | `title`、`brand` |
| 首页及各阶段文案 | `copy` |
| 配色 | `theme`（自动映射 CSS 变量） |
| 活动名、提示语、图标 | `activities`；图标路径在 `src/icons.ts` |
| 动画开关、躲避开关 | `motion`、`playfulEscape` |
| 备注长度 | `maxNoteLength` |

主插画在 `src/assets/rose-fine-art.webp`，由内置 imagegen 工具为本项目生成；保留 `rose-fine-art.png` 原稿。WebP 约 97KB，透明底，首页、步骤印记与结果页共用；HTML 提前预加载，下载期间先显示同图的 1.8KB 内联预览。旧 SVG 用于加载失败兜底及 favicon。原版及 A 方案使用设备本地字体；标题 B、C 方案使用自托管的思源宋体 3.8KB 子集，提供本地衬线降级，不连接外部字体服务。字体许可随构建发布；修改标题后须更新子集。生成提示词、字体及资源说明在 `ASSETS.md`。`index.html` 内也有标题和描述，修改主题文案时可以同步更新，用于载入阶段和搜索摘要。

首页标题已选定 C「轻盈诗笺」，普通根地址默认采用两行居中的细致宋体排版，保留完整中文与英文。`?titlePreview=1&title=note` 可回看 A/B/C 提案，`?title=note|letter|poem` 显示各自独立版本。切换样式不会重置步骤。

`src/logic.ts` 集中日期、活动互斥和分享文本；`src/main.ts` 管理页面与交互；`src/style.css` 管理排版与动画。`DESIGN.md` 记录设计原则。

背景音乐位于 `src/assets/rising-road.mp3`（约 3.91MB），由用户提供的文件完整复制，播放器在 `src/music.ts`、`src/music.css`。可用自己的 MP3 替换该文件后重新构建。旧原创曲 `weekend-nocturne.mp3` 与生成源码保留为备选，当前构建使用 Rising Road。播放器交互参考 [Romantic-Date-Invitation](https://github.com/nikhilchauhan5/Romantic-Date-Invitation-/blob/main/src/components/AudioPlayer.tsx)，随机躲避思路参考 [valentine-web-page](https://github.com/KoVoidG/valentine-web-page/blob/main/script.js)，均适配了当前手机布局。

## 日期规则

按打开页面的设备本地日期计算“下一个尚未结束的周末”：周一至周五取即将到来的周六/周日；周六和周日保留本周末。周日不再提供已经过去的周六。时段定义为上午（当天 0:00–12:00）、下午（12:00–18:00）、晚上（18:00–次日 0:00）；只展示结束时间晚于当前时间的时段，不保证时段内每个时刻都尚未发生。其他时间可自由填写精确时间。

每次进入时间页重新计算；已过期的预选时段会清除。构造本地 Date 并使用日历加天，避免 UTC 日期偏移；跨年、闰年可正常处理。

## 测试

```powershell
npm test
npx playwright install chromium webkit
npm run test:e2e
npm run build
```

构建产物的额外检查：构建后执行 `npm run test:production` 和 `node tests/delivery-smoke.mjs`。它们自行启动隔离的生产服务，模拟邮件服务，不发送真实邮件。

单元测试覆盖工作日、周六下午、周日晚上、跨年、闰年、周一零点、活动互斥和中文计划文本。浏览器测试覆盖完整流程、回退、校验、自定义时间和活动、输入安全、备注上限、刷新重置、鼠标与触屏持续躲避、键盘拒绝及首页批注文案、减少动态、结果页精简布局、音乐实际解码与播放/暂停、播放被拒绝及载入失败、新玫瑰加载与图片失败兜底，以及 320×700、354×724、390×844、430×932、844×390、1440×1000 无横向溢出。

`artifacts/home-mobile.png`、`home-desktop.png` 和 `result-mobile.png` 是真实浏览器截图。完整测试结果见 `TESTING.md`。自动化 WebKit 接近 Safari 渲染环境，但**不等同于 iPhone 或微信真机测试**；本环境没有做真机验证。

## 免费云端部署与邮件

已选择 Cloudflare Workers，正式域名为 https://rose.shushu.dpdns.org/。网页、邮件接口和私密回信存储都在云端，电脑关机不影响访问。完整分享链接保存在忽略提交的 .cloudflare-tunnel/share-url.txt。更新命令、后台配置和本地预览说明见 [CLOUDFLARE.md](CLOUDFLARE.md)。

只把 dist 拖到静态托管平台不能运行邮件接口。微信分享缩略图由微信抓取策略决定；浏览器自动化不等同于微信真机验证。
