# Arena Agent 项目交接：绿玫瑰周末来信

## 目标与约束

这是面向手机和微信的私人中文互动邀请函：用绿玫瑰营造温柔的邀请体验，逐步选择周末时间、活动和备注，汇总并尝试发送回信。保留当前外观、动画、音乐和交互；历史需求文件并非现行规格，后续用户变更优先。修改之前先检查现有实现和测试，避免重构或更改行为。

## 架构与运行

- 前端：Vite 8、TypeScript 7、原生 DOM 和 CSS，无 React/Vue/Next；`index.html` 唯一入口，`src/main.ts` 驱动步骤而非页面路由。
- 依赖：Node 24、npm，锁定于 `package-lock.json`。`npm ci`、`npm run dev`、`npm test`、`npm run build`；浏览器测试 `npx playwright install chromium webkit` 后运行 `npm run test:e2e`。生产模拟检查 `npm run test:production` 和 `node tests/delivery-smoke.mjs`。
- 本地界面：Vite 默认 5173；`npm run preview` 默认 4173。两者仅静态前端；`npm run build` 后 `npm start` 提供本地 API，需参照 `.env.example` 配置，详见 README。
- 线上：Cloudflare Worker 托管构建产物和 `/api/replies`，SQLite Durable Object 保存私密答复；可通过 FormSubmit 发邮件。`wrangler.jsonc` 已绑定现有账号、Worker 和正式域名，`npm run deploy` 会影响现有线上站点。静态 Netlify 配置不提供 API。

## 页面与行为

首页显示邀请、玫瑰、音乐控制及“有空呀/没空诶”；“有空”进入时间页，动态计算未结束的周末时段并支持其他时间；活动页有八项，支持多选，`你来决定` 与其他项互斥，备注最多 200 字；结果页汇总并发起提交、允许重试及返回修改。拒绝分支可通过键盘/辅助技术进入。输入状态在页面内存，刷新会重置；邀请密钥可能在当前标签 sessionStorage 保存。

首页逃跑按钮前两次移动缩淡、第三/四次变叶片、第五次起短暂隐身再现，实体触碰持续躲避；原始需求的可见拒绝入口及有限逃跑已被后续要求改变。结果页的复制/分享入口亦按后续要求移除。不要根据历史需求文档误判为缺失而自行恢复。

## 设计与目录

默认深绿 C「林间夜色」，标题 C「轻盈诗笺」，本地中文字体子集、精细透明水彩玫瑰和叶片、轻量渐入与呼吸；窄屏、横屏、安全区、键盘焦点、减少动态有针对性处理。设计令牌在 `src/config.ts` 和 `src/style.css`，主题覆盖在 `src/themes.css`。`DESIGN.md` 是历史设计记录，少量数值或验收项可能已过时，以代码为准。

`src/main.ts` 管理渲染、状态和事件；`logic.ts` 处理日期及活动规则；`reply.ts` 处理提交、错误、超时重试；`music.ts` 处理播放；`*preview.ts` 提供方案预览；`src/assets/` 与 `public/` 放资源。`cloudflare/worker.mjs`、`server/reply-core.mjs`、`scripts/invitation-server.mjs` 实现云端和本地服务；`tests/` 覆盖纯逻辑、接口和浏览器流程；`scripts/` 包含部署、资源和诊断工具。更多说明见 `arena-export/PROJECT_STRUCTURE.md`。

## 数据流、安全与边界

`main.ts` 收集计划 → `reply.ts` 携带邀请密钥和请求编号提交 `/api/replies` → Worker 验证请求、通过 Durable Object 私密保存 → 在浏览器邮件模式返回 prepared 和 FormSubmit 信息 → 浏览器请求邮件服务，收到成功回执才显示已送出。超时不能确定是否送达，重试可能造成重复。其他配置下服务端发送路径见代码。不得把 prepared 当成发信成功；不应把用户文本作为 HTML 注入。

真实 `.env`、`.dev.vars*`、`.cloudflare-tunnel/`、`.received/`、Wrangler 状态、邀请链接和个人回信均不交付、不提交。`.env.example` 是占位示例；服务 secrets 包括 `RECEIVER_EMAIL`、`INVITE_TOKEN`、`FORMSUBMIT_ID`，须在目标环境安全配置。当前 `wrangler.jsonc` 有账户 ID 和生产域名，虽非密码，但属于部署元数据；交付给外部前请确认愿意共享。用户提供的音乐资源有使用权限范围问题，公开分享前由用户确认授权。

## 已完成、待确认与风险

交互、响应式样式、本地资源、日期逻辑、云端备份及邮件处理已实现，测试集覆盖正常和失败路径。现存限制：Vite 静态预览不能真实发信；第三方邮件可能限流、失效或要求激活；收件箱实际送达与微信/手机真机兼容性需要实测，浏览器模拟不能保证；浏览器自动播放限制无法绕过。Cloudflare 可能注入统计脚本，README 的无统计说明需与实际配置核对。可见拒绝入口的易用性值得产品确认。

安全检查只能降低泄露风险，不能证明所有内容绝对无敏感信息；交付前复核文件与 Git 差异。不要运行 `scripts/*live*`、`scripts/activate-email.mjs` 或生产检查以外的线上写操作，除非明确了解其影响并得到授权；不要自行上传真实密钥、回信和截图。`artifacts/` 中可能有私人截图，交付包有意排除。

## 验证与接续

2026-11-08 本地重新安装后 `npm test` 18/18、`npm run build` 通过；正式首页曾返回 HTTP 200。Chromium 核心邀请流程单项通过。本次完整浏览器测试未跑完：两个 Chromium 躲避预览用例达到 30 秒超时后中止，快照显示已进入时间页，原因尚未确定。历史测试结果见 TESTING.md，不应当作本次全量通过。这些结果不是完整真机或真实邮件送达证明。后续先在隔离环境运行测试，检查页面、资源、路由及提交失败/重试；涉及实际发送、部署或更换域名先确认目标和权限。具体操作见 README 与 `arena-export/DEVELOPMENT_GUIDE.md`。
