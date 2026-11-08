# 云端部署与本地预览

正式域名：`https://rose.shushu.dpdns.org/`。分享给她时使用 `.cloudflare-tunnel/share-url.txt` 中包含 `?invite=` 的完整链接。这个链接允许提交计划，没有读取任何回信的权限。

网页、邮件接口和私密回信存储均部署在 Cloudflare Workers，电脑关机不影响网站。使用免费计划，没有开通付费订阅。接收邮箱和邀请密钥是服务器端加密 secrets，不会进入 `dist`。已有 `c2c-ai.shushu.dpdns.org` 项目未修改。

## 本地预览

在项目目录执行：

```powershell
npm install
npm run dev
```

打开终端显示的本地地址，一般为 `http://localhost:5173/`。预览生产界面使用 `npm run build`、`npm run preview`，地址通常是 `http://localhost:4173/`。这两种服务只预览界面。

需要本地测试邮件接口时，创建私有 `.env`（参照 `.env.example`），配置 `RECEIVER_EMAIL`，然后运行 `npm run build`、`npm start`。服务只提供 `dist`，监听 `http://127.0.0.1:4174/`。在地址后加入 `?invite=` 和 `.cloudflare-tunnel/invitation-key.txt` 中的密钥。

## 更新云端网页

当前项目已完成官方 Wrangler 授权。日后修改代码，执行：

```powershell
npm run deploy
```

会重新构建并上传同一 Worker，保持网址不变，并保留 secrets 和私密回信数据。`wrangler.jsonc` 中配置了账号、域名、静态资源和 SQLite Durable Object。

首次在新电脑部署，需要先登录官方工具：

```powershell
npm run cloudflare -- login --scopes account:read user:read workers:write workers_scripts:write workers_routes:write zone:read
npm run deploy
node scripts/configure-cloudflare.mjs
```

配置脚本读取私有 `.env` 的邮箱和邀请密钥，通过标准输入上传为后台 secrets。不要把 `.env`、`.cloudflare-tunnel/` 或 `.received/` 上传到源码仓库；这些路径已被 Git 忽略。

邮件使用 FormSubmit。首次使用或更换网站地址时，需要在接收邮箱点击该网站的 Activate Form 确认邮件。后台校验时间、活动、备注和邀请密钥，保存回信后尝试发邮件；仅在邮件服务接受后向页面返回成功。重复编号不会重复发送，同编号修改内容会被拒绝；每分钟最多尝试发送 5 次邮件。

云端私密保存最多 1000 份回信，未开放查询页面或读取接口。日常结果直接在接收邮箱查看。使用 [Workers 免费额度](https://developers.cloudflare.com/workers/platform/pricing/)和 [SQLite Durable Objects 免费额度](https://developers.cloudflare.com/durable-objects/platform/pricing/)。单独上传 `dist` 到静态托管平台不能运行本项目的邮件接口。

## 验证

```powershell
npm test
npm run build
npm run test:production
node tests/delivery-smoke.mjs
```

测试覆盖后端校验、私有文件保护、重复提交、失败重试、云端持久化，以及 Chromium/WebKit 354px 手机流程。自动化测试使用模拟邮件，不会发送真实通知。

## 临时隧道记录

已按 [cloudflare-tunnel-skill](https://github.com/xiaoyuboi/cloudflare-tunnel-skill) 尝试发布本地服务。原网络无法连接 Cloudflare 的 TCP/UDP 7844 端口，申请到的 Quick Tunnel 域名未连通，失败进程已经停止。随后按用户选择改为云端部署。临时隧道必须验证 `Registered tunnel connection` 和公网网页后才可分享；电脑关机后不可用。

## 当前邮件方式（2026-10-13）
正式部署使用 FORMSUBMIT_ID 隐藏邮箱的表单标识。Worker 校验邀请密钥和答卷、写入私有备份后返回 prepared；浏览器再向 FormSubmit 官方 AJAX 地址提交，仅在邮件服务 success 为 true 时显示已送出。跨站请求采用 strict-origin，只提供网站域名，不发送邀请查询参数。Worker 的 prepared 不是发送成功回执。邮件服务错误或网络中断时保留选项并提供重试；超时后服务是否已接受可能不明确，重试可能产生重复邮件，可按回信编号识别。电脑可以关机。
验证：正式网址真实 Chromium 手机视口完成选择到提交，云端备份 HTTP 200、FormSubmit HTTP 200 success=true，结果显示回信已送出。截图 artifacts/cloudflare-live-mail-success.png。
