# 验证记录

验证日期：2026-10-12（Asia/Shanghai）。项目需求原文已保存到根目录 `绿玫瑰周末邀请函_Codex开发需求.md`。

## 三种绿色方案验证

- 生产构建通过，三种主题和背景图均使用本地资源。
- 新增主题预览测试共 4 项（Chromium、WebKit 各 2 项），最终全部通过：检查切换时日期、活动、备注与页面节点保留，URL 与浏览器颜色同步，单独链接隐藏预览控件，深绿方案完整流程可用。首次 Chromium 预览测试在完成正确结果后超时，将该多步测试的预算设为 60 秒后单独复跑，9.6 秒通过；没有修改页面逻辑或放宽断言。
- 三种 390px 手机截图、354×724 预览截图和并排对比图已生成，无横向溢出或运行错误；桌面预览也已实际检查。
- 对比图：`artifacts/design-comparison.png`；各方案：`artifacts/design-sage-mobile.png`、`artifacts/design-rose-mobile.png`、`artifacts/design-forest-mobile.png`。

## 执行结果

| 检查 | 结果 |
| --- | --- |
| npm install | 成功，依赖版本及 lockfile 已固定 |
| npm run dev | 成功，测试服务启动于 127.0.0.1:5173 |
| npm test | 6 项通过、0 失败 |
| npm run test:e2e | 32 项最终通过；Chromium 16 项 + WebKit 16 项；首次运行 30 项通过，2 项 Chromium 超时后单独复跑通过 |
| npm run build | 成功，TypeScript 检查通过，输出 dist |
| npm run preview | 成功，localhost:4173 |
| npm run test:production | 成功，生产资源和 SVG favicon、完整流程、手机布局无溢出、无运行错误 |

环境：Windows、Node 24.18.1、Vite 8.3.4、TypeScript 7.0.2、Playwright 1.64.0。浏览器使用 Playwright 安装的 Chromium 和 WebKit。测试日期固定为周一 2026-10-12，使真实周末日期断言可复现；页面代码的日期为设备当前日期，没有写死。

本次排版更新首次运行出现 Chromium context 关闭超时和触屏测试超时；使用 `npx playwright test --last-failed --workers=1` 单独复跑，2 项均通过（5.9s、16.2s）。没有改变交互代码或放宽断言。

## 需求验收

- [x] 首页按四处批注移除顶部名称、副文案及文字拒绝入口，更新邀请标题并分成三行，重新调整留白。

- [x] 主视觉按最新要求换成精细水彩绿玫瑰，透明 WebP 本地打包，首页、步骤与结果页复用；原图和提示词已留存。
- [x] 新玫瑰正常解码，图片请求失败时显示矢量兜底，主按钮仍可操作。
- [x] 默认 C 林间夜色，深绿信笺、纸张肌理、浅色文字、衬线中文标题。
- [x] 320×700、354×724、390×844、430×932、844×390、1440×1000：首页、时间页、活动页无横向溢出。短屏可自然纵向滚动。
- [x] 按最新要求，鼠标与触屏持续躲避，连续七次鼠标靠近和六次触屏触碰后仍移动；检查安全容器边界，主按钮可用；按首页批注移除了固定文字拒绝入口。
- [x] 日期支持周六/周日当天、时段过期、跨年、闰年，其他时间可写文字。
- [x] 活动多选和“你来决定”互斥，备注长度 200；没有选项但有自定义想法也能提交。
- [x] 返回保留时间、活动、备注；结果汇总正确；刷新重置。
- [x] 按最新批注删除复制和分享入口，结果页保留时间、活动、备注与返回修改。
- [x] 旧版复制和分享测试已随入口移除，改为结果页精简布局与返回保留选项的检查。
- [x] 减少动态模式关闭动画并瞬时换位；键盘 Enter 拒绝不会逃跑，新页面标题接收焦点。
- [x] HTML 样式的自由输入按纯文本显示，未生成 img/script 节点；控制台和资源检查无错误。
- [x] 本地构建通过，README 有预览、配置、状态说明和免费部署步骤。

## 截图

- `artifacts/home-mobile.png`：390px 手机首页，Chromium。
- `artifacts/home-desktop.png`：1440px 桌面首页，Chromium。
- `artifacts/result-mobile.png`：手机结果页，真实浏览器渲染。

## 修复与限制

- 修复 Vite 的 public 目录 SVG 导入警告：将插画集中到 `src/assets/rose.svg`，favicon 也引用同一文件，由构建器生成资源地址。
- 持续躲避处理中区分 pointerdown 与后续 click，避免一次触屏手势移动两次后回到原位置。
- 图片失效模拟最初误拦截 Vite 的资源 JS 模块，导致测试页面未启动。路由改为仅拦截 image 类型请求，两种浏览器下兜底检查通过。
- 生产截图等待入场动画结束，避免截图呈现未完成淡入时的低透明度状态。
- Headless WebKit 不是 iPhone Safari 或微信真机。没有验证微信特定版本、实际原生分享面板与微信分享卡片；已实现纯文本兜底。
- Playwright 命令行有环境 NO_COLOR/FORCE_COLOR 的提示，它不属于网页错误。
- 2026-10-12 最新修改：默认 C 林间夜色；本地音乐播放、暂停、跨步骤连续播放、手动暂停优先、浏览器拒绝和真实资源失败；随机躲避与结果页移除两个按钮、保留英文签名。Chromium/WebKit 相关流程、音乐、触屏、方案测试均已验证。最后一次针对结果页与两种音乐异常的复测为 6/6 通过（37 秒）；生产构建与生产页面检查通过，单元测试 6/6 通过。
- 新增三种“没空诶”互动预览：320/354/390px 手机切换、安全距离、消失再出现、触屏连续躲避和主按钮可用，在 Chromium/WebKit 共 10/10 通过；普通根地址仍保留当前行为。最新 Vite 构建和生产页面检查通过。预览对比图为 `artifacts/escape-comparison.png`。
- 用户选定 B → A → C 的组合后已设为正式默认。320/390px 真实触屏顺序、叶片透明资源解码、安全边界、隐身时主按钮、页面切换后定时器不干扰，以及鼠标一次靠近不重复计数均通过。相关浏览器用例首次 15/16 通过；Chromium 320px 用例超时，改为和既有触屏测试相同的 60 秒预算后单独复跑，11.2 秒通过。构建和生产检查通过。新叶片阶段截图：`artifacts/home-leaf-stage.png`。
- 背景音乐换为用户提供的完整 Rising Road MP3（3,905,034 字节），源文件和项目副本 SHA-256 一致。Chromium/WebKit 的真实解码、播放/暂停、跨步骤连续播放及首次点有空启动测试共 4/4 通过（21.4 秒）；构建、生产检查与预览内实际播放/暂停通过。
- 一次并行测试中 Chromium 触屏检查出现超时及损坏 trace，改成单工作进程后完整六次真实触屏触碰通过。WebKit 的独立媒体进程绕过请求路由，音乐失败测试改为真实缺失资源，两个浏览器下均通过。
- 辅助识图脚本返回 `API 403 / AllocationQuota.FreeTierOnly`：`Free quota exhausted. To continue accessing the model on a paid basis, please add funds or disable the "use free tier only" mode in the management console.` 截图正常生成，浏览器测试和构建不受影响。
- 首页标题新增 A/B/C 三种可切换提案，待用户选定：Chromium 检查三个版本在 320/354/390/430/844/1440px 的标题与页面无横向溢出，完整中文与英文保留，B/C 本地 WOFF2 正常加载，切换样式不重置步骤，普通根地址保持原版。WebKit 三版本字体加载、354px 布局及进入时间页通过。`node tests/title-screenshots.mjs` 生成手机截图和 `artifacts/title-comparison.png`；截图等待两个绘制帧，修复第一次截取发生在图片绘制前的空白玫瑰。
- 标题更新后的 `npm test` 6/6、生产构建、`npm run test:production` 均通过；首页精简文案与键盘拒绝用例 Chromium/WebKit 2/2 通过。Playwright 用例结束后 Windows 测试服务清理停滞，确认 5173 端口对应本次测试启动的 PID 后停止该临时服务，测试命令正常退出 0。4173 预览服务保持运行。字体 OFL 许可已进入 `dist/licenses/`。

- 2026-10-13：正式默认标题为 C 轻盈诗笺。邮件接收接口的校验、私有存储、重复提交去重、失败重试和频率限制，单元测试 15/15 通过。Chromium/WebKit 邮件交互测试及生产构建检查通过；这些邮件流程测试使用模拟邮件服务。正式 Cloudflare 域名已部署，页面与资源返回 200，私有文件不可访问。实际邮件发送仍待新域名开通确认，不能将模拟测试视为实际邮箱送达。

- 2026-10-13 正式域名确认后：本地标准 FormSubmit 表单 POST 返回精确 _next 成功跳转，服务已接受测试邮件。云端标准接口实测 HTTP 429，与 AJAX 云端限流一致，实际邮件链路尚未完成。标准接口回执、错误跳转与普通 200 页面不误报成功的测试加入后，16/16 通过，构建与部署通过。等待隐藏邮箱的 FormSubmit 表单地址以实现浏览器直接发送。

- 2026-10-13 完成：新增隐藏邮箱的浏览器直发通道与云端 prepared 备份状态测试，17/17 通过。正式网址真实 Chromium 390x844 完整流程，备份 HTTP 200、邮件服务 HTTP 200 success=true、页面成功提示通过。修复跨站 Referer 被 same-origin 策略省略，采用单次请求 strict-origin；邀请密钥不发送给邮件服务。截图 artifacts/cloudflare-live-mail-success.png。生产构建及正式部署通过。实际收件箱送达待用户查看最新测试邮件。

- 2026-10-13 音乐默认开启：入页自动尝试播放，自动播放限制下首次指针/触摸/点击/键盘操作以及 WeixinJSBridgeReady 重试，保留手动暂停优先；Chromium/WebKit 音乐测试 8/8，通过构建并部署。微信真机自动播放仍受平台策略限制，不能保证无触摸播放。

- 2026-10-13 手机发送失败修复：去除浏览器邮件请求对 AbortSignal.timeout 的依赖，改用 AbortController 与定时器；邀请密钥在同一标签会话保留，缺少密钥和请求过频显示分别提示。Chromium/WebKit 禁用 AbortSignal.timeout 后，prepared → 邮件失败 → 重试成功的模拟测试通过。构建及部署完成，正式网页完整提交实测备份 200、邮件服务 success=true。无法仅凭截图确认用户手机失败的唯一原因，待其重新打开完整链接实测。

- 2026-10-13 微信电脑端音乐反馈：修复初始播放 Promise 悬挂时 wanted 阻止后续真实手势重试的问题，按钮改按 audio.paused 判断播放/暂停；微信 BridgeReady、pageshow 与页面恢复按实际暂停状态尝试。自动播放 NotAllowedError 显示轻点页面提示，手动暂停仍优先。音乐浏览器测试 8 项初测通过；拒绝策略模拟原先与原生 autoplay/userActivation 相互干扰，改为独立手势事件标记后 Chromium/WebKit 2 项复测通过。构建、正式部署完成。未在真实微信电脑客户端验证，无法保证无交互有声自动播放。

- 2026-10-13 按用户批注移除自动播放受限的轻点页面提示；自动播放尝试与手势重试保留。Chromium/WebKit 自动拒绝时提示为空、随后点击正常播放的测试 2/2，通过构建与正式部署。客户端禁止无手势有声自动播放时仍不能强制播放。

- 2026-10-13 自动播放策略正式站复核：使用完整 Chromium（非 headless shell）、CDP Runtime.evaluate userGesture=false 读取媒体状态，读取前无任何页面交互。no-user-gesture-required：userActive=false、paused=false、currentTime=1.805831、muted=false；user-gesture-required：userActive=false、paused=true、currentTime=0，真实点击后 paused=false、currentTime=0.973609。由此确认当前站点在策略允许时可直接有声播放，策略要求交互时不能免点击播放。早先默认无头浏览器或可能触发用户激活的测试不能证明微信真机自动播放。此次未修改产品行为或重新部署。

- 2026-10-13 夸克空白页修复：修复前模拟 HTMLMediaElement.play 启动但返回 undefined，真实 WebKit 复现 appChildren=0、musicButtons=1、undefined is not an object (evaluating t.play().then)，与截图音乐按钮存在而邀请为空匹配。音乐兼容 void 返回与同步异常，首次邀请渲染移至音乐初始化之前。Chromium/WebKit 音乐测试 14/14，通过构建及部署。正式域名手机 WebKit 模拟 void/throw 两情形，玫瑰解码、首页文字与进入时间页、无 pageerror 均通过。截图 artifacts/quark-compatible-home.png。没有连接用户实际夸克客户端，仍需用户关闭旧页面重开确认。辅助识图脚本 API 403 AllocationQuota.FreeTierOnly。
# 2026-10-13 手机慢加载修复

- 用户澄清为页面、花出现慢，而非错误码或无法连接。实测旧图 251,806 字节、脚本执行后才请求；资产浏览器缓存为 `max-age=0, must-revalidate`。
- 原稿保留。清晰 WebP 改为 720×1080、97,120 字节（减少 61.4%），同图 1,804 字节预览内联；HTML 提前请求大图，首页内容不再经过从透明开始的长动画；版本化资产缓存一年。
- `node scripts/measure-mobile-load.mjs before/after`：本地生产服务器、冷缓存、1 Mbps 下载、150ms 延迟，各三轮。旧版玫瑰完成下载 5358/5332/5308ms，新版 2211/2205/2204ms；请求开始从 893–994ms 提前至 179–193ms。首个内容绘制旧版 948–1160ms，新版 1240–1292ms（提前下载图片存在带宽竞争）；在新版首次绘制后就有同图预览，不等待清晰图。此数据是受控网络模拟，不能当作国内手机实际耗时。
- 慢图测试先阻止大图传输，旧版可见花瓣像素为 0，失败；修复后 Chromium/WebKit 都能在大图待传输时显示花瓣，释放请求后清晰图正常解码。WebKit 将 preload 标为 `other`，因此阻塞的是实际图片 URL，放行 Vite 的 `?import` 模块。
- 首次 66 项浏览器回归中 64 项通过，2 项仍断言旧分辨率。更新为 720 后发现 WebKit 会复用已解码图片，使重新载入后拦截请求无法可靠产生图片错误；改为真实不存在的图片 URL 验证原生错误。两个引擎的图片解码/失败兜底最终 2/2 通过；慢图测试 2/2 通过。
- `node tests/mobile-browser-matrix.mjs`：14/14 UA 模拟配置通过。Chromium 覆盖百度、夸克、UC、QQ、微信安卓、华为、小米、vivo、OPPO、360；WebKit 覆盖 Safari、微信 iOS、百度 iOS、夸克 iOS。320–430px 宽度，测试触屏、四步排版、图片解码、HTTP 回信、修改保留、无运行异常。邮件使用假传输，没有向真实邮箱重复发送测试信。这不是上述手机 App 的真机测试，UA 不会改变模拟引擎版本。
- 生产检查、双引擎提交失败/重试/去重、旧 AbortSignal 缺失的浏览器邮件流程均通过；`npm test` 最终 18/18 通过；构建成功。
- 实际线上发现 MP3 的 `Range: bytes=0-1023` 请求返回 HTTP 200 和整首 3,905,034 字节。增加音乐资产专用 Worker 分段响应，保留原曲字节；单元测试覆盖头部、尾部、越界与 If-Range。最终线上两个引擎均验证播放和 HTTP 206，响应恰为 1,024 字节。
- `node scripts/check-live-loading.mjs`：从当前电脑网络访问真实公开域名，Chromium/WebKit 图片、播放、分段音频、排版和进入时间页均通过；没有提交回信。长期缓存头和微信验证 TXT 的原内容线上检查通过。
- 最终部署版本：`a557cbe3-c57e-4b47-9e64-a9fa6a144b9e`。性能记录和 UA 模拟结果在 `artifacts/mobile-load-before.json`、`artifacts/mobile-load-after.json`、`artifacts/mobile-browser-matrix.json`。当前环境无法替代国内运营商、真实手机 App 或平台域名拦截审核结果。

