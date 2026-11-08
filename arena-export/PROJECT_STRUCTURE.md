# 项目结构与职责

- `index.html`：文档入口、资源预加载、Vite 模块入口。
- `src/main.ts`：步骤状态、渲染、事件、躲避交互；`config.ts`：文案、主题和活动。
- `src/logic.ts`：周末时段、活动互斥等纯逻辑；`reply.ts`：回信提交及超时重试；`music.ts`：音频播放。
- `src/*preview.ts` 与对应 CSS：主题、标题和躲避方案预览；`icons.ts`：图标；`style.css`、`themes.css` 等：布局、主题和动画。
- `src/assets/`：玫瑰、叶片、SVG、字体、音乐原始资源，构建必需；`public/`：静态文件、字体许可与域名验证文件。
- `cloudflare/worker.mjs`：静态文件及 API 入口、私密 Durable Object；`server/reply-core.mjs`：验证和邮件共享逻辑；`scripts/invitation-server.mjs`：本地服务。
- `scripts/`：部署、调试、资源和测试辅助，部分 live 脚本会访问生产环境或发送测试邮件；`tests/`：单元、接口、Playwright 及生产检查。
- `package.json`、`package-lock.json`、`tsconfig.json`、`playwright.config.ts`、`wrangler.jsonc`：依赖、构建、测试、部署配置；`netlify.toml` 只适合静态前端。
- `.env.example`：占位示例；私有 `.env`、邀请链接、云端凭据、回信数据不应上传。
- `artifacts/` 是本地截图与测试记录，可能包含私人信息；不包含在本交付包。源码中的 `output/` 文件属于其他项目，不是网站依赖，也未纳入。
