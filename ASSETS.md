# 绿玫瑰主视觉

工具：内置 imagegen（非 CLI/API 自建脚本）。新图为本项目生成，无第三方网络素材。源稿：`src/assets/rose-fine-art.png`，保留 1024×1536 原始分辨率。页面使用 `src/assets/rose-fine-art.webp`，通过 Sharp 输出 720×1080、质量 82、透明通道质量 65 的 WebP，97,120 字节；比上一版 251,806 字节减少 61.4%。首页显示尺寸约 220–240px，覆盖三倍像素密度屏幕。`rose-preview.webp` 是同一张插画的 64×96 预览，1,804 字节，Vite 内联在脚本里；清晰图未完成时显示，下载完成后淡入清晰图。可运行 `node scripts/optimize-rose.mjs` 重新生成，两份资源均保留透明背景，不修改原稿。

生成提示词：

Use case: illustration-story. Asset type: transparent botanical illustration for a refined private Chinese weekend invitation website. Generate ONE exquisite single pale green rose on a slender gracefully curving stem with two small natural serrated sage-green leaves. Fine art botanical watercolor with realistic sculptural detail, translucent thin petals, elegant French florist editorial taste. The bloom is a genuine refined ROSE: many delicate irregular overlapping petals spiraling around a small tightly furled center, outer petals opened into graceful pointed soft curls; three-quarter view slightly tilted left, organic asymmetry. NOT a cabbage, NOT rounded stacked bowls or thick vegetable leaves. Large beautiful flower head with soft ivory-celadon highlights, pistachio/pale mint petal surfaces, nuanced olive-green shadows between paper-thin petals. Light comes softly from upper left. Stem thin and tapering, leaves have fine visible veins. Sophisticated handmade watercolor pigment edges and incredibly delicate gradients with crisp detailed central petals. Portrait composition, flower occupies upper half, stem and two offset leaves lower half, entire stem visible, no cropping. Flower head about 70 percent of canvas width; subject fills 90 percent of height. TRUE fully transparent background around all petals, leaves and stem, no rectangular backdrop, no cast ground shadow, no decorative frame, no text, no watermark, no other flowers, no props, no photo background, no plastic, no 3D render, no flat vector look. This asset will be displayed on warm ivory paper #F7F8F1 with dark green text #244B3A. Make it look like a beautiful premium botanical print that deserves to be the central image of a romantic invitation.

原版 SVG 位于 `src/assets/rose.svg`，仅作为网络/图片解码失败的兜底和 favicon 使用。全站图片为本地打包资源，无须密钥。

## 标题字体提案

字体预览 B、C 使用 Noto Serif SC（思源宋体），400 字重，只保留首页标题的 15 个去重字符。`src/assets/title-serif.woff2` 为真实 WOFF2，3,800 字节，通过 Google Fonts 官方 CSS 的 `text` 参数获取。字体随项目打包，浏览时不连接外部字体服务；`font-display: swap` 允许在载入失败时继续使用设备衬线字体。A 使用设备的苹方/微软雅黑等无衬线字体。

许可证为 SIL Open Font License 1.1，来源：[Google Fonts 官方仓库](https://github.com/google/fonts/blob/main/ofl/notoserifsc/OFL.txt)。完整许可保存在 `public/licenses/NotoSerifSC-OFL.txt`，构建时一并复制到 `dist/licenses/`。字体子集仅覆盖当前标题；修改中文标题时须重新生成子集，否则新增字符使用本地降级字体。

## 躲藏叶片

使用内置 imagegen 生成透明水彩玫瑰叶。源稿：`src/assets/rose-leaf.png`；页面使用 `src/assets/rose-leaf.webp`，320×320，27,910 字节，保留透明度，在 80×64 的可触碰区域里显示。自然锯齿、细叶脉、轻微卷边与橄榄绿水彩层次，配合主玫瑰插画。

生成提示词：

Create ONE exquisite botanical watercolor ROSE LEAF as a tiny interactive sprite for a romantic green rose invitation website. Single natural asymmetrical rose leaflet, finely serrated edges, delicate branching veins, soft olive and sage-green pigment layers, subtle translucent celadon highlights, slight organic curl and a very short slender petiole. Three-quarter view, diagonally pointing toward upper right, luminous upper surface, restrained fine art botanical watercolor, visually match a premium pale-green rose watercolor on dark forest green #153b2d. Leaf must be graceful, elongated oval pointed silhouette, not a plastic icon or flat gradient pill. Fill 85% of square image, entire leaf and short petiole visible. No flowers, no other leaves, no text, no watermark, no shadow outside subject. Truly fully transparent background around the leaf. Crisp beautiful organic detail that remains readable at 74 pixels.

## 背景音乐

当前曲目：`src/assets/rising-road.mp3`，《Rising Road ～メインテーマ～》。来源为用户指定的本地 MP3，完整复制，无裁剪或重编码；3,905,034 字节，复制前后 SHA-256 一致。播放器默认尝试有声播放、循环播放并支持跨步骤持续播放；浏览器拒绝自动播放时，首次操作或音乐按钮可重试。

旧原创备选（当前不引用、不进入生产构建）：

`src/assets/weekend-nocturne.mp3`：《林间晚风》，58.3 秒、96kbps 双声道，700,918 字节。为本项目编排的原创稀疏钢琴合成乐段，使用谐波衰减、立体声位置和轻微延迟营造余韵，无采样和第三方旋律。源码 `scripts/generate-music.py` 使用 numpy 合成 PCM、lameenc 1.8.4 编码 MP3。编码器仅用于构建素材，网站无需该依赖。首尾淡入淡出、低音量循环，播放时才下载。
