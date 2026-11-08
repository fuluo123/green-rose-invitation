# 源码摘录：原始路径保留

这是阅读辅助。完整项目、二进制资源、测试和其他脚本见同目录 ZIP；若内容不一致，以原始文件为准。

## `C:/Users/法国/.codex/worktrees/8d6d/codex list/src/escape-preview.css`

````text
.escape-preview { position: sticky; top: 0; z-index: 21; background: #e8eee1f2; color: #244b3a; border-bottom: 1px solid #bfd0b5; backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); }
.escape-preview-inner { max-width: 430px; margin: auto; padding: 11px 14px 10px; }
.escape-preview-heading { display: flex; justify-content: space-between; align-items: center; gap: 10px; font-size: 11px; margin-bottom: 9px; }
.escape-preview-heading a { font-size: 10px; color: #446c4e; text-underline-offset: 3px; }
.escape-options { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 5px; }
.escape-options button { min-height: 44px; padding: 5px 2px; border: 1px solid #c7d7c0; border-radius: 7px; background: #ffffff84; color: #315942; font-size: 10px; white-space: nowrap; }
.escape-options button[aria-pressed="true"] { background: #244b3a; border-color: #244b3a; color: #f2f6e9; }
.escape-options button:focus-visible, .escape-preview-heading a:focus-visible { outline: 2px solid #244b3a; outline-offset: 3px; }
.escape-preview-note { min-height: 17px; margin-top: 7px; font-size: 10px; line-height: 1.7; color: #597257; }
.escape-review .music-player { top: calc(126px + env(safe-area-inset-top)); }
.letter > .escape-layer { position: absolute; inset: 0; z-index: 4; pointer-events: none; }
.escape-layer .escape-button { width: 111px; min-width: 111px; pointer-events: auto; transition: top .33s cubic-bezier(.2,.8,.2,1), left .33s cubic-bezier(.2,.8,.2,1), opacity .26s, transform .33s, background .18s; }
.escape-leaf { display: none; }
.escape-layer .escape-button.is-leaf { width: 80px; min-width: 80px; min-height: 64px; height: 64px; padding: 0; border: 0; border-radius: 0; transform: rotate(-9deg); color: transparent; background: transparent; box-shadow: none; }
.escape-layer .escape-button.is-leaf .escape-label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
.escape-layer .escape-button.is-leaf .escape-leaf { display: block; width: 80px; height: 64px; object-fit: contain; pointer-events: none; filter: drop-shadow(0 3px 5px #071c172b); }
.escape-layer .escape-button.is-leaf:focus-visible { color: var(--ink); background: var(--secondary); transform: none; width: 111px; min-width: 111px; height: 48px; min-height: 48px; border: 1px solid var(--line); border-radius: 8px; }
.escape-layer .escape-button.is-leaf:focus-visible .escape-label { position: static; width: auto; height: auto; clip-path: none; }
.escape-layer .escape-button.is-leaf:focus-visible .escape-leaf { display: none; }
.escape-layer .escape-button.is-camouflaged { transform: scale(var(--escape-scale, .85)); opacity: var(--escape-opacity, .8); }
.escape-layer .escape-button.is-vanished { opacity: 0; transform: scale(.55) rotate(14deg); pointer-events: none; }
@media (prefers-reduced-motion: reduce) { .escape-layer .escape-button { transition: none; } }

````

## `C:/Users/法国/.codex/worktrees/8d6d/codex list/src/music.css`

````text
.music-player { position: fixed; top: calc(12px + env(safe-area-inset-top)); right: max(10px, env(safe-area-inset-right)); z-index: 15; }
.music-toggle { display: grid; place-items: center; width: 44px; height: 44px; padding: 0; border: 1px solid var(--line); border-radius: 50%; background: var(--paper); color: var(--ink); box-shadow: 0 3px 14px #0000000a; cursor: pointer; touch-action: manipulation; }
.music-toggle:focus-visible { outline: 2px solid var(--sage); outline-offset: 4px; }
.music-note { width: 19px; height: 19px; }
.music-bars { display: none; align-items: center; justify-content: center; gap: 3px; height: 20px; }
.music-bars i { width: 2px; height: 14px; border-radius: 2px; background: currentColor; animation: music-pulse 1.2s ease-in-out infinite alternate; }
.music-bars i:nth-child(2) { height: 20px; animation-delay: -.6s; }
.music-bars i:nth-child(3) { height: 10px; animation-delay: -.3s; }
.is-playing .music-bars { display: flex; }
.is-playing .music-note { display: none; }
.music-feedback { position: absolute; top: 53px; right: 0; width: 180px; color: var(--ink); background: var(--paper); font-size: 12px; line-height: 1.6; border-radius: 8px; }
.music-feedback:not(:empty) { padding: 10px 12px; border: 1px solid var(--line); }
.design-review .music-player { top: calc(135px + env(safe-area-inset-top)); }
@keyframes music-pulse { to { transform: scaleY(.4); } }
@media (prefers-reduced-motion: reduce) { .music-bars i { animation: none; } }

````

## `C:/Users/法国/.codex/worktrees/8d6d/codex list/src/reply.css`

````text
.reply-feedback { text-align: center; margin: 5px auto 8px; max-width: 290px; }
.reply-status { color: var(--muted); font-size: 11px; line-height: 1.9; letter-spacing: .3px; }
.reply-feedback[data-state="pending"] .reply-status::before { content: ''; display: inline-block; width: 5px; height: 5px; background: var(--sage); border-radius: 50%; margin-right: 7px; vertical-align: 2px; animation: reply-pulse 1.2s ease-in-out infinite; }
.reply-feedback[data-state="failed"] .reply-status { color: var(--validation); }
.reply-retry { text-decoration: underline; margin: 0 auto; display: block; padding-top: 6px; padding-bottom: 6px; }
@keyframes reply-pulse { 50% { opacity: .3; } }
@media (prefers-reduced-motion: reduce) { .reply-status::before { animation: none !important; } }

````

## `C:/Users/法国/.codex/worktrees/8d6d/codex list/src/style.css`

````text
:root {
  --paper: var(--base-paper, #F7F8F1); --mist: var(--base-mist, #EFF3E8); --ink: var(--base-ink, #244B3A); --sage: var(--base-sage, #93AD91);
  --leaf: var(--base-leaf, #D9E8D2); --petal: var(--base-petal, #C7E4B7); --muted: var(--base-muted, #697B6B); --line: var(--base-line, #DDE5D8); --gold: var(--base-gold, #C6AA75);
  --sans: 'PingFang SC', 'Microsoft YaHei', 'Noto Sans CJK SC', sans-serif;
  --serif: 'Songti SC', 'STSong', 'SimSun', serif;
  font-family: var(--sans); color: var(--ink); background: var(--mist);
  font-synthesis: none; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility;
}
* { box-sizing: border-box; }
body { margin: 0; min-width: 320px; min-height: 100vh; min-height: 100svh; }
body::before, body::after { content: ''; position: fixed; z-index: -1; pointer-events: none; border-radius: 50%; }
body::before { width: 550px; height: 720px; background: radial-gradient(ellipse, #93ad9121, transparent 66%); transform: rotate(-28deg); top: -160px; left: -170px; }
body::after { width: 600px; height: 900px; bottom: -420px; right: -200px; background: radial-gradient(ellipse, #93ad9126, transparent 65%); }
button, input, textarea { font: inherit; }
button { cursor: pointer; -webkit-tap-highlight-color: transparent; color: inherit; }
button, label, input, textarea { touch-action: manipulation; }
button { border: 0; }
button:focus-visible, input:focus-visible, textarea:focus-visible { outline: 2px solid var(--ink); outline-offset: 5px; }
h1:focus { outline: none; }
p, h1, h2, figure { margin: 0; }
[hidden] { display: none !important; }
svg { display: block; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
#app { padding: 36px 20px; opacity: 1; transition: opacity 140ms ease, transform 140ms ease; }
#app.leaving { opacity: 0; transform: translateY(-5px); }
.letter { width: min(100%, 430px); margin: 0 auto; padding: 26px 32px 28px; min-height: 770px; position: relative; background: var(--paper); border: 1px solid var(--line); border-radius: 12px; box-shadow: 0 18px 80px #244b3a08; overflow: hidden; }
.letter::after { content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 0; opacity: .13; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Cpath fill='%23697B6B' opacity='.3' d='M0 0h160v160H0z' filter='url(%23n)'/%3E%3C/svg%3E"); }
.letter > * { position: relative; z-index: 1; }
.letter-header { display: flex; justify-content: center; align-items: center; gap: 8px; padding: 0 0 15px; border-bottom: 1px solid var(--line); font-size: 10px; letter-spacing: 1.8px; color: var(--muted); }
.brand { display: flex; align-items: center; gap: 7px; }
.page-content { animation: page-in 350ms ease both; }
.intro { text-align: center; }
.eyebrow { color: var(--muted); font: italic 12px Georgia, 'Times New Roman', serif; letter-spacing: .3px; margin: 28px 0 14px; }
h1 { font: 400 clamp(25px, 6.7vw, 30px)/1.6 var(--serif); letter-spacing: 2px; text-wrap: pretty; }
.description { max-width: 290px; margin: 13px auto 0; font-size: 13px; color: var(--muted); line-height: 1.95; letter-spacing: .3px; text-wrap: pretty; }
.home .page-content { animation: none; }
.home .intro { animation: home-in 350ms ease both; }
.home h1 { line-height: 1.6; font-size: 30px; letter-spacing: 1.4px; }
.home .eyebrow { margin-top: 15px; }
.home .botanical { margin-top: 16px; margin-bottom: 18px; }
.home .letter-footer { margin-top: 18px; }
.botanical { height: 314px; position: relative; margin: 20px 0 22px; }
.rose { position: relative; transform-origin: 50% 90%; }
.rose svg { width: 100%; height: 100%; }
.rose-image { width: 100%; height: 100%; display: block; object-fit: contain; opacity: 0; transition: opacity 220ms ease; }
.rose-preview { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; filter: blur(3px); pointer-events: none; transition: opacity 220ms ease; }
.rose-ready .rose-image { opacity: 1; }
.rose-ready .rose-preview { opacity: 0; }
.rose-fallback { width: 100%; height: 100%; }
.rose g[filter] { transform-box: fill-box; transform-origin: 50% 75%; animation: petal-unfurl 1.2s cubic-bezier(.2,.7,.3,1) both; }
.hero-rose { width: 240px; height: 314px; margin: 0 auto; position: relative; animation: home-in 550ms ease both, breathe 8s 550ms ease-in-out infinite; }
.home-actions { text-align: center; animation: home-in 350ms ease both; }
.home-actions h2 { font-size: 15px; font-weight: 400; letter-spacing: 1.5px; margin-bottom: 17px; }
.button { min-height: 48px; border-radius: 8px; font-size: 13px; line-height: 1.4; padding: 13px 17px; display: flex; justify-content: center; align-items: center; gap: 10px; transition: background 180ms, box-shadow 180ms, transform 180ms, border-color 180ms; }
.button svg { width: 18px; height: 18px; flex: 0 0 auto; }
.button:active { transform: scale(.975); }
.primary { background: var(--ink); color: var(--paper); width: 100%; border: 1px solid var(--ink); box-shadow: 0 4px 10px #244b3a0e; }
.secondary { border: 1px solid #cdd9c7; background: #f1f4eb; }
@media (hover: hover) { .primary:hover { background: #345d48; box-shadow: 0 5px 15px #244b3a18; } .secondary:hover { background: #e8efdf; } .activity:hover .activity-body { border-color: var(--sage); } }
.answer-row { display: flex; align-items: flex-start; gap: 14px; height: 100px; }
.answer-row > .primary { width: calc(50% - 7px); }
.escape-zone { flex: 1; min-width: 0; height: 100px; position: relative; }
.escape-button { position: absolute; left: 0; top: 0; width: calc(100% - 30px); min-width: 100px; transition: top 180ms ease, left 180ms ease, transform 150ms ease, background 180ms; }
.escape-message { font-size: 11px; color: var(--muted); line-height: 1.8; min-height: 20px; letter-spacing: .4px; }
.text-button { background: transparent; padding: 10px 8px; min-height: 44px; font-size: 11px; color: var(--muted); text-underline-offset: 5px; }
.text-button:hover { color: var(--ink); text-decoration: underline; }
.letter-footer { text-align: center; margin-top: 24px; }
.steps { display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 10px; }
.step { height: 4px; width: 4px; border-radius: 5px; background: var(--line); }
.step.current { width: 16px; background: var(--sage); }
.step.complete { background: var(--sage); }
.back-button { display: flex; align-items: center; gap: 2px; padding: 8px 0; min-height: 44px; background: transparent; font-size: 11px; color: var(--muted); margin: 5px 0 -44px; z-index: 3; }
.back-button svg { width: 18px; height: 18px; }
.stamp { width: 66px; height: 78px; margin: 6px auto -13px; }
.time .eyebrow, .activities .eyebrow { margin-top: 12px; margin-bottom: 14px; }
.time h1, .activities h1 { font-size: 26px; letter-spacing: 1px; }
.time .description, .activities .description { margin-top: 10px; }
fieldset { border: 0; padding: 0; margin: 0; min-width: 0; }
.time-options { margin-top: 33px; }
.day-group { margin-bottom: 25px; }
.day-heading { display: flex; justify-content: space-between; align-items: baseline; font-size: 15px; margin-bottom: 12px; letter-spacing: .7px; }
.day-heading > span:last-child { font-size: 12px; color: var(--muted); }
.day-heading small { font: 9px Georgia, serif; padding-left: 4px; }
.periods { display: grid; grid-template-columns: repeat(3, 1fr); gap: 9px; }
.period, .activity, .other-time { position: relative; cursor: pointer; }
.period input, .activity input, .other-time input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; z-index: 1; }
.period > span { border: 1px solid var(--line); background: #f9faf5; border-radius: 7px; min-height: 53px; padding: 15px 10px; display: flex; justify-content: center; align-items: center; gap: 3px; font-size: 13px; transition: 180ms; }
.selection-check { display: none; }
.selection-check svg { width: 13px; height: 13px; }
.period input:checked + span { background: #e7eedf; border-color: #7f9c74; }
.period input:checked + span .selection-check { display: block; }
.period input:focus-visible + span, .activity input:focus-visible + span, .other-time:has(input:focus-visible) { outline: 2px solid var(--ink); outline-offset: 4px; }
.other-time { display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--line); border-radius: 8px; padding: 14px 15px; min-height: 69px; }
.other-time strong { font-size: 13px; font-weight: 400; display: block; }
.other-time small { font-size: 10px; color: var(--muted); display: block; margin-top: 5px; }
.round-check { width: 19px; height: 19px; border: 1px solid #c5d3bc; border-radius: 50%; padding: 2px; }
.round-check svg { width: 13px; height: 13px; visibility: hidden; }
.other-time:has(input:checked) { border-color: #7f9c74; background: #e7eedf; }
.other-time:has(input:checked) .round-check svg { visibility: visible; }
.field-label { display: block; font-size: 11px; color: var(--muted); margin: 15px 0 9px; }
.text-input, textarea { width: 100%; border: 1px solid var(--line); border-radius: 7px; color: var(--ink); background: #fafbf6; padding: 12px; font-size: 16px; line-height: 1.7; outline-offset: 3px; }
textarea { resize: vertical; }
input::placeholder, textarea::placeholder { font-size: 11px; color: var(--muted); }
.validation { min-height: 32px; font-size: 11px; line-height: 1.8; padding-top: 7px; color: #755842; }
.footnote { text-align: center; font-size: 10px; color: var(--muted); margin-top: 17px; }
.time .letter-footer { margin-top: 34px; }
.activity-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 25px; }
.activity-body { display: flex; align-items: center; gap: 9px; border: 1px solid var(--line); background: #fafbf6; border-radius: 8px; padding: 14px 25px 14px 13px; min-height: 72px; transition: border-color 180ms, background 180ms; position: relative; }
.activity-icon svg { width: 20px; height: 20px; color: #6d8a61; }
.activity-label { font-size: 13px; letter-spacing: .3px; }
.activity-detail { display: none; }
.activity-check { position: absolute; top: 50%; transform: translateY(-50%); right: 9px; width: 15px; height: 15px; border: 1px solid #c5d3bc; border-radius: 50%; }
.activity-check svg { width: 13px; height: 13px; display: none; }
.activity input:checked + span { border-color: #7f9c74; background: #e7eedf; }
.activity input:checked + span .activity-check { background: var(--ink); border-color: var(--ink); color: var(--paper); }
.activity input:checked + span .activity-check svg { display: block; }
.note-field { margin-top: 23px; }
.field-line { display: flex; justify-content: space-between; align-items: center; gap: 5px; font-size: 12px; margin-bottom: 9px; }
.field-line small { font-size: 10px; color: var(--muted); }
#note-count { font: 10px Georgia, serif; color: var(--muted); }
.activities .letter-footer { margin-top: 27px; }
.result-bloom { position: relative; height: 202px; margin-top: 13px; }
.result-rose { width: 155px; height: 186px; margin: auto; animation: bloom-in 1s both; }
.result-seal { position: absolute; left: 50%; bottom: 0; transform: translateX(-50%); color: var(--muted); font: 8px Georgia, serif; letter-spacing: 2.5px; white-space: nowrap; }
.result .eyebrow { margin: 24px 0 11px; }
.result h1 { font-size: 26px; letter-spacing: 1px; }
.plan { border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); padding: 22px 0; margin: 30px 0 18px; }
.result .plan { margin-top: 36px; }
.plan-top { display: flex; align-items: center; justify-content: space-between; font-size: 11px; letter-spacing: 1.5px; }
.tiny-flower { color: var(--sage); font-size: 24px; }
.tiny-flower svg { width: 18px; height: 18px; }
dl { margin: 14px 0 0; }
dl > div { display: grid; grid-template-columns: 83px 1fr; gap: 9px; padding: 9px 0; }
dt { font-size: 10px; color: var(--muted); line-height: 2; }
dd { margin: 0; font-size: 13px; line-height: 1.7; overflow-wrap: anywhere; white-space: pre-wrap; }
.edit-link { display: block; margin: 0 auto; text-decoration: underline; text-underline-offset: 4px; }
.plan-signature { text-align: right; color: var(--muted); font: italic 11px Georgia, serif; margin-top: 20px; }
.result .letter-footer { margin-top: 24px; }
.result .plan dl { margin-top: 17px; }
.result .plan dl > div { display: block; padding: 12px 0; }
.result .plan dt { margin-bottom: 5px; letter-spacing: .8px; }
.result .plan dd { font-size: 14px; line-height: 1.8; }
.declined .page-content { text-align: center; }
.declined-bloom { margin-top: 65px; }
.declined h1 { font-size: 25px; }
.declined .eyebrow { margin-top: 24px; }
.declined-rule { width: 30px; height: 1px; background: var(--gold); margin: 30px auto 23px; }
.declined-note { font-size: 12px; color: var(--muted); margin-bottom: 25px; }
.declined .secondary { width: 165px; margin: 0 auto; }
.declined .letter-footer { margin-top: 70px; }
@keyframes page-in { from { opacity: 0; transform: translateY(7px); } to { opacity: 1; transform: translateY(0); } }
@keyframes home-in { from { opacity: .85; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
@keyframes bloom-in { from { opacity: 0; transform: translateY(10px) scale(.94) rotate(-2deg); } to { opacity: 1; transform: translateY(0) scale(1) rotate(0); } }
@keyframes breathe { 0%, 100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-3px) rotate(.6deg); } }
@keyframes petal-unfurl { from { transform: scale(.93, .95); } to { transform: scale(1); } }
@media (max-width: 480px) {
  body { background: var(--paper); }
  #app { padding: 0; }
  .letter { min-height: 100svh; width: min(100%, 430px); border: 0; border-radius: 0; box-shadow: none; padding: calc(23px + env(safe-area-inset-top)) 30px calc(22px + env(safe-area-inset-bottom)); }
  .home .letter-footer { margin-top: 21px; }
}
@media (max-width: 360px) {
  .letter { padding-left: 23px; padding-right: 23px; }
  .letter-header { letter-spacing: .7px; }
  .home h1 { font-size: 26px; }
  .eyebrow { margin-top: 28px; }
  .description { font-size: 12px; }
  .botanical { height: 284px; }
  .hero-rose { height: 284px; width: 215px; }
  .button { font-size: 12px; padding-left: 10px; padding-right: 10px; }
  .activity-body { padding-left: 10px; padding-right: 22px; gap: 7px; }
  .activity-detail { font-size: 9px; }
  .result h1, .activities h1, .time h1 { font-size: 23px; }
  .declined h1 { font-size: 23px; }
}
@media (min-width: 481px) and (max-height: 700px) { #app { padding-top: 18px; padding-bottom: 18px; } }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; } }
.motion-off *, .motion-off *::before, .motion-off *::after { animation: none !important; transition: none !important; }

````

## `C:/Users/法国/.codex/worktrees/8d6d/codex list/src/themes.css`

````text
/* Review-only controls are mounted by ?preview=1; theme links show the invitation alone. */
.design-preview { position: sticky; top: 0; z-index: 20; color: #254c3a; background: #edf2e8f5; border-bottom: 1px solid #c9d8c6; backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); }
.design-preview-inner { max-width: 430px; margin: auto; padding: 12px 14px 10px; }
.design-caption { display: flex; justify-content: space-between; align-items: center; font-size: 10px; letter-spacing: .5px; margin-bottom: 8px; }
.design-open { color: #426647; text-underline-offset: 3px; padding: 4px 0 4px 12px; }
.design-options { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 5px; }
.design-option { min-height: 44px; padding: 8px 5px; border: 1px solid #cedbc9; border-radius: 7px; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 11px; white-space: nowrap; background: #ffffff70; color: #426047; }
.design-option[aria-pressed="true"] { background: #244b3a; border-color: #244b3a; color: #f2f6e9; }
.design-option:focus-visible, .design-open:focus-visible { outline: 2px solid #244b3a; outline-offset: 3px; }
.design-swatch { width: 13px; height: 13px; flex: 0 0 13px; border-radius: 50%; border: 1px solid #ffffff90; }
.swatch-sage { background: #b6cba5; }
.swatch-rose { background: radial-gradient(circle at 35% 35%, #f0f4cd 12%, #a8ba79 60%, #76935f); }
.swatch-forest { background: #153e30; }
.design-note { font-size: 10px; margin-top: 8px; line-height: 1.7; color: #536e54; }
.design-review { scroll-padding-top: 125px; }

:root[data-design] {
  --primary-bg: #254f37; --primary-text: #f2f6e9; --primary-hover: #376343;
  --surface: #f0f5e7; --secondary: #d9e6cb; --secondary-hover: #cbdcb9;
  --selected: #c3d7b1; --selected-border: #6e8b5a; --check-border: #a4bc90;
  --validation: #765036; --icon: #537641; --divider: #9eb689;
}
:root[data-design="sage"] {
  --paper: #e0ebd5; --mist: #becfac; --ink: #244b32; --muted: #526a47;
  --sage: #7f9f6b; --line: #b8ceaa; --leaf: #d0e1c1; --gold: #a79869;
}
[data-design="sage"] .letter { background: linear-gradient(145deg, #e7efdb 0%, #dce8cf 64%, #cfdfbf 100%); border-color: #adc399; box-shadow: 0 22px 85px #244b321c; }
[data-design="sage"] body { background: radial-gradient(ellipse at 50% 30%, #d6e3c6, #acbf98); }
[data-design="sage"] .hero-rose { filter: drop-shadow(0 10px 16px #3a633819); }

:root[data-design="rose"] {
  --paper: #e7edd5; --mist: #c2d19f; --ink: #29492a; --muted: #506644;
  --sage: #82985e; --line: #b4c79b; --leaf: #d9e5c3; --gold: #a69761;
  --primary-bg: #385a2f; --primary-hover: #476b37; --surface: #eef3e4eb;
  --secondary: #e7eed4d9; --secondary-hover: #d6e2bf; --selected: #cbdab3;
}
[data-design="rose"] body { background: #c2d19f; }
[data-design="rose"] body::before { z-index: 0; width: 900px; height: 1300px; top: -260px; left: calc(50% - 830px); background: url('./assets/rose-fine-art.webp') center / contain no-repeat; transform: rotate(-25deg); filter: blur(22px) saturate(1.15); opacity: .52; }
[data-design="rose"] body::after { z-index: 0; width: 750px; height: 1100px; right: calc(50% - 820px); bottom: -300px; background: url('./assets/rose-fine-art.webp') center / contain no-repeat; transform: rotate(28deg); filter: blur(26px); opacity: .45; }
[data-design="rose"] #app { position: relative; z-index: 1; }
[data-design="rose"] .letter { background: linear-gradient(160deg, #eaf0dce8, #e7efd5dc 42%, #dbe6c5e8); border-color: #d9e5bf; box-shadow: 0 22px 85px #344c2d24; }
[data-design="rose"] .letter::before { content: ''; position: absolute; z-index: 0; pointer-events: none; width: 790px; height: 1185px; left: -400px; top: -72px; background: url('./assets/rose-fine-art.webp') center / contain no-repeat; filter: blur(13px) saturate(1.2); transform: rotate(-22deg); opacity: .36; }
[data-design="rose"] .hero-rose { filter: drop-shadow(0 12px 18px #46652b20); }

:root[data-design="forest"] {
  color-scheme: dark;
  --paper: #153b2d; --mist: #102d23; --ink: #e4ecd4; --muted: #b6c8a7;
  --sage: #a8c48c; --line: #41634b; --leaf: #78966b; --gold: #bbba85;
  --primary-bg: #dce8ba; --primary-text: #24402b; --primary-hover: #edf3d5;
  --surface: #244a37; --secondary: #244b38; --secondary-hover: #325b43;
  --selected: #3e6549; --selected-border: #a7c184; --check-border: #779569;
  --validation: #ebc89b; --icon: #bdcf9e; --divider: #6a885e;
}
[data-design="forest"] body { background: radial-gradient(ellipse at 50% 35%, #264832, #0d281e 74%); }
[data-design="forest"] .letter { background: radial-gradient(ellipse at 50% 40%, #36543a 0%, #1c402f 44%, #15382a 85%); border-color: #476442; box-shadow: 0 24px 100px #071c1755; }
[data-design="forest"] .letter::after { opacity: .24; }
[data-design="forest"] .hero-rose { filter: drop-shadow(0 0 32px #d4e2a32e); }
[data-design="forest"] h1 { color: #e7eccf; }
[data-design="forest"] .letter-header { color: var(--muted); }

/* Apply the same palette to the date, activities, and result pages. */
[data-design] .primary { background: var(--primary-bg); border-color: var(--primary-bg); color: var(--primary-text); }
[data-design] .secondary { background: var(--secondary); border-color: var(--line); }
[data-design] .period > span, [data-design] .activity-body, [data-design] .text-input, [data-design] textarea { background: var(--surface); }
[data-design] .other-time { background: var(--surface); }
[data-design] .period input:checked + span, [data-design] .activity input:checked + span, [data-design] .other-time:has(input:checked) { background: var(--selected); border-color: var(--selected-border); }
[data-design] .round-check, [data-design] .activity-check { border-color: var(--check-border); }
[data-design] .activity input:checked + span .activity-check { background: var(--primary-bg); border-color: var(--primary-bg); color: var(--primary-text); }
[data-design] .activity-icon svg { color: var(--icon); }
[data-design] .validation { color: var(--validation); }
[data-design] .plan { border-color: var(--divider); }
@media (hover: hover) {
  [data-design] .primary:hover { background: var(--primary-hover); }
  [data-design] .secondary:hover { background: var(--secondary-hover); }
}
@media (max-width: 480px) {
  [data-design] .letter { box-shadow: none; }
  [data-design="rose"] body::before, [data-design="rose"] body::after { display: none; }
}

````

## `C:/Users/法国/.codex/worktrees/8d6d/codex list/src/title-preview.css`

````text
/* C is the selected default; the review toolbar still allows comparing A/B/C. */
.home .title-context, .home .title-opener, .home .title-condition, .home .title-invitation { display: block; }

:root[data-title-layout="note"] .home h1,
:root[data-title-layout="letter"] .home h1,
:root[data-title-layout="poem"] .home h1 { letter-spacing: 0; line-height: 1.4; font-weight: 400; }

:root[data-title-layout="note"] .home .intro { padding-top: 6px; }
:root[data-title-layout="note"] .home .eyebrow { margin-bottom: 24px; }
:root[data-title-layout="note"] .home h1 { font-family: var(--sans); }
:root[data-title-layout="note"] .title-opener,
:root[data-title-layout="note"] .title-condition { display: inline; }
:root[data-title-layout="note"] .title-context { color: var(--muted); font-size: 15px; letter-spacing: .3px; line-height: 1.8; }
:root[data-title-layout="note"] .title-invitation { margin-top: 11px; font-size: clamp(27px, 7.6vw, 31px); letter-spacing: .35px; line-height: 1.4; }
:root[data-title-layout="note"] .home .botanical { margin-top: 28px; }

:root[data-title-layout="letter"] .home .intro { max-width: 270px; margin: 0 auto; text-align: left; padding-top: 5px; }
:root[data-title-layout="letter"] .home .eyebrow { margin-bottom: 21px; font-size: 11px; }
:root[data-title-layout="letter"] .home h1 { font-family: 'Invitation Serif', var(--serif); }
:root[data-title-layout="letter"] .title-opener { font-size: 21px; line-height: 1.5; letter-spacing: .2px; }
:root[data-title-layout="letter"] .title-condition { margin-top: 5px; font: 400 14px/1.8 var(--sans); color: var(--muted); letter-spacing: .3px; }
:root[data-title-layout="letter"] .title-invitation { margin-top: 13px; font-size: clamp(28px, 8vw, 32px); line-height: 1.4; letter-spacing: .2px; }
:root[data-title-layout="letter"] .home .botanical { margin-top: 25px; }

:root[data-title-layout="poem"] .home .intro { padding-top: 8px; }
:root[data-title-layout="poem"] .home .eyebrow { margin-bottom: 25px; }
:root[data-title-layout="poem"] .home h1 { font-family: 'Invitation Serif', var(--serif); }
:root[data-title-layout="poem"] .title-opener,
:root[data-title-layout="poem"] .title-condition { display: inline; }
:root[data-title-layout="poem"] .title-context { color: var(--muted); font-size: 16px; letter-spacing: .5px; line-height: 1.8; }
:root[data-title-layout="poem"] .title-invitation { margin-top: 15px; font-size: clamp(29px, 8vw, 33px); line-height: 1.4; letter-spacing: .7px; }
:root[data-title-layout="poem"] .home .botanical { margin-top: 26px; }

.title-preview { position: sticky; top: 0; z-index: 22; color: #254c3a; background: #edf2e8f5; border-bottom: 1px solid #c9d8c6; backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); }
.title-preview-inner { max-width: 430px; margin: auto; padding: 10px 14px 9px; }
.title-preview-heading { display: flex; justify-content: space-between; align-items: center; font-size: 10px; letter-spacing: .3px; margin-bottom: 6px; }
.title-preview-open { color: #426647; padding: 5px 0 5px 10px; text-underline-offset: 3px; }
.title-preview-options { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 5px; }
.title-preview-options button { min-height: 44px; border: 1px solid #cedbc9; border-radius: 7px; padding: 8px 4px; background: #ffffff70; color: #426047; font-size: 11px; white-space: nowrap; }
.title-preview-options button[aria-pressed="true"] { background: #244b3a; border-color: #244b3a; color: #f2f6e9; }
.title-preview-options button:focus-visible, .title-preview-open:focus-visible { outline: 2px solid #244b3a; outline-offset: 3px; }
.title-preview-note { font-size: 10px; line-height: 1.7; color: #536e54; margin-top: 7px; }
.title-review { scroll-padding-top: 130px; }
.title-review .music-player { top: calc(134px + env(safe-area-inset-top)); }

@media (max-width: 360px) {
  :root[data-title-layout="note"] .title-context { font-size: 14px; }
  :root[data-title-layout="poem"] .title-context { font-size: 15px; }
}
@font-face {
  font-family: 'Invitation Serif';
  src: url('./assets/title-serif.woff2') format('woff2');
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  unicode-range: U+4e2a, U+4e5f, U+4f60, U+5468, U+5982, U+60f3, U+6709, U+672b, U+679c, U+7a7a, U+7ea6, U+89c1, U+8fd9, U+9762, U+ff0c;
}


````
