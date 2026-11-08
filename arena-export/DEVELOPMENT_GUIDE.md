# 开发与接手

安装 Node.js 24 和 npm，在解压后的项目根目录执行：

```sh
npm ci
npm run dev
npm test
npm run build
npx playwright install chromium webkit
npm run test:e2e
npm run test:production
node tests/delivery-smoke.mjs
```

锁文件部分包使用 npm 镜像地址。2026-11-08 当前环境的离线缓存不完整，且 npm 默认禁止远程包；允许访问锁文件中镜像后用 `npm ci --allow-remote=all --no-audit --no-fund` 安装成功。仅在信任锁文件来源时启用该选项。安装时环境拦截了 esbuild 和 workerd 的安装脚本；前端构建通过，但部署工具是否可正常运行没有验证。

Vite 默认地址由终端显示（通常 http://localhost:5173）；`npm run preview` 预览 `dist`，通常 4173。两者没有邮件 API。完整后端使用 `npm run build` 和 `npm start`，需要私有 `.env` 与邀请密钥，详见 README；不要将真实凭据或完整邀请链接提交或提供给第三方。

部署为 `npm run deploy`，会作用于 `wrangler.jsonc` 配置的现有 Worker、账号和域名；部署前必须确认账号、目标、数据与权限。不要自行部署或调用生产写操作。`.env.example` 没有真实凭据；Cloudflare 上额外的 `FORMSUBMIT_ID` 需单独安全配置。静态托管不能完整发送回信。

先阅读 `ARENA_HANDOFF.md` 和 `README.md`，再从 `src/main.ts`、`src/config.ts`、`src/reply.ts`、`cloudflare/worker.mjs` 追踪逻辑。修改前运行相关测试，之后重新构建并检查手机布局。真实手机、微信、实际收件箱和第三方服务仍需用户实测。

## 连接 GitHub 私有仓库

当前原工作区的 `origin` 指向另一个 Gitee 仓库，且位于 detached HEAD；不要直接覆盖它或执行 `git add .`。推荐将交付 ZIP 解压到全新目录，在 GitHub 网站手动创建**私有**空仓库（不要选择公开），然后在解压目录执行：

```sh
git init
git add .
git status --short
git diff --cached --stat
git diff --cached -- . ':!package-lock.json'
git commit -m "Prepare green rose project handoff"
git branch -M main
git remote add origin https://github.com/你的用户名/你的私有仓库名.git
git push -u origin main
```

替换仓库地址并按 GitHub 的认证提示登录。提交前检查文件清单与差异，确保没有真实密钥、邀请链接、回信或不愿共享的账户信息；账户 ID、生产域名及用户提供的音乐仍在源码包中。不要用真实邀请链接做示例。若远程仓库已有内容，先了解其历史再合并，不要强制推送。交付 ZIP 中没有其自身；上传到 Arena 时使用 ZIP（如支持解压），或解压后上传所有文件，尤其 `src/assets/` 二进制资源。
