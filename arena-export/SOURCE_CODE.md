# 源码摘录：原始路径保留

这是阅读辅助。完整项目、二进制资源、测试和其他脚本见同目录 ZIP；若内容不一致，以原始文件为准。

## `index.html`

````text
<!doctype html>
<html lang="zh-CN" data-design="forest" data-title-layout="poem">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#153b2d" />
    <meta name="description" content="一枝绿玫瑰，一封留给你的周末邀请。选一个舒服的时间，做一点喜欢的事。" />
    <link rel="icon" type="image/svg+xml" href="/src/assets/rose.svg" />
    <link rel="preload" as="image" href="/src/assets/rose-fine-art.webp" fetchpriority="high" />
    <title>一封周末邀请</title>
  </head>
  <body>
    <div id="app"></div>
    <noscript><p style="padding:40px;color:#244B3A">这是一封互动邀请函，请启用 JavaScript 后打开。没关系呀，愿你的周末有好心情。</p></noscript>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>

````

## `package.json`

````text
{
  "name": "green-rose-invitation",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview --host 0.0.0.0",
    "test": "node --experimental-strip-types --test tests/logic.test.ts tests/replies.test.mjs tests/cloudflare.test.mjs",
    "start": "node scripts/invitation-server.mjs",
    "test:e2e": "playwright test",
    "test:production": "node tests/production-smoke.mjs",
    "cloudflare": "node scripts/cloudflare.mjs",
    "deploy": "npm run build && node scripts/cloudflare.mjs deploy"
  },
  "devDependencies": {
    "@playwright/test": "1.64.0",
    "@types/node": "26.6.5",
    "sharp": "0.35.5",
    "typescript": "7.0.2",
    "vite": "8.3.4",
    "wrangler": "^4.149.0"
  }
}

````

## `tsconfig.json`

````text
{
  "compilerOptions": {
    "target": "ES2022", "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext", "moduleResolution": "Bundler", "strict": true,
    "allowImportingTsExtensions": true, "noEmit": true, "skipLibCheck": true,
    "types": ["vite/client"]
  },
  "include": ["src"]
}

````

## `playwright.config.ts`

````text
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  workers: 2,
  reporter: 'list',
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }, { name: 'webkit', use: { browserName: 'webkit' } }],
  use: { baseURL: 'http://127.0.0.1:5173', timezoneId: 'Asia/Shanghai', viewport: { width: 390, height: 844 }, trace: 'retain-on-failure' },
  webServer: { command: 'npm run dev -- --port 5173 --strictPort', url: 'http://127.0.0.1:5173', reuseExistingServer: !process.env.CI },
});

````

## `wrangler.jsonc`

````text
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "green-rose-invitation",
  "main": "cloudflare/worker.mjs",
  "compatibility_date": "2026-10-12",
  "account_id": "afbfd4dfd2cefd8b385dbd0f4060fb40",
  "workers_dev": true,
  "observability": { "logs": { "enabled": true, "invocation_logs": false } },
  "routes": [{ "pattern": "rose.shushu.dpdns.org", "custom_domain": true }],
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS",
    "run_worker_first": ["/api/*", "/assets/rising-road-*"],
    "not_found_handling": "404-page"
  },
  "durable_objects": {
    "bindings": [{ "name": "REPLIES", "class_name": "ReplyMailbox" }]
  },
  "migrations": [{ "tag": "v1", "new_sqlite_classes": ["ReplyMailbox"] }]
}

````

## `src/config.ts`

````text
export const config = {
  title: '一封周末邀请',
  brand: '一封周末邀请',
  design: 'forest' as const,
  titleDesign: 'poem' as const,
  copy: {
    eyebrow: 'A little invitation · for you',
    homeTitle: '这个周末，如果你也有空，想约你见个面',
    question: '这个周末，你有空吗？',
    hint: '据说这朵绿玫瑰有点偏心。',
    timeTitle: '那你什么时候方便？',
    activityTitle: '如果见面，你想做什么？',
    resultTitle: '好，那就期待见面啦',
    declinedTitle: '没关系呀，等你有空再说。',
  },
  theme: {
    paper: '#F7F8F1', mist: '#EFF3E8', ink: '#244B3A', sage: '#93AD91',
    leaf: '#D9E8D2', petal: '#C7E4B7', muted: '#697B6B', line: '#DDE5D8', gold: '#C6AA75',
  },
  motion: true,
  playfulEscape: true,
  maxNoteLength: 200,
  activities: [
    { id: 'dinner', label: '一起吃饭', detail: '好好吃一顿', icon: 'dinner' },
    { id: 'coffee', label: '喝咖啡', detail: '慢慢聊一会儿', icon: 'coffee' },
    { id: 'movie', label: '看电影', detail: '共享两小时的故事', icon: 'movie' },
    { id: 'walk', label: '散步聊天', detail: '走走，吹吹风', icon: 'walk' },
    { id: 'park', label: '逛公园', detail: '把绿色装进眼睛', icon: 'park' },
    { id: 'gallery', label: '看展', detail: '发现一点新鲜事', icon: 'gallery' },
    { id: 'book', label: '去书店', detail: '翻翻书，慢一点', icon: 'book' },
    { id: 'decide', label: '你来决定', detail: '留一点小小惊喜', icon: 'decide' },
  ],
};

````

## `src/logic.ts`

````text
export type TimeOption = { id: string; date: string; day: string; period: string; label: string };
export function weekendOptions(now = new Date()): TimeOption[] {
  const saturday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekday = now.getDay();
  saturday.setDate(saturday.getDate() + (weekday === 0 ? -1 : (6 - weekday + 7) % 7));
  const options: TimeOption[] = [];
  for (let offset = 0; offset < 2; offset++) {
    const date = new Date(saturday);
    date.setDate(date.getDate() + offset);
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const day = offset === 0 ? '周六' : '周日';
    for (const [period, endHour] of [['上午', 12], ['下午', 18], ['晚上', 24]] as const) {
      const end = new Date(date);
      end.setHours(endHour);
      if (end <= now) continue;
      options.push({ id: `${iso}-${period}`, date: iso, day, period, label: `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${day} ${period}` });
    }
  }
  return options;
}
export function toggleActivity(selected: string[], id: string): string[] {
  if (selected.includes(id)) return selected.filter(item => item !== id);
  if (id === 'decide') return ['decide'];
  return [...selected.filter(item => item !== 'decide'), id];
}
export function planText(time: string, activities: string[], note: string): string {
  return ['我们的周末小计划', `时间：${time}`, `想做的事：${activities.length ? activities.join('、') : note.trim()}`, activities.length && note.trim() ? `还有一个想法：${note.trim()}` : '', '期待见面啦。'].filter(Boolean).join('\n');
}

````

## `src/main.ts`

````text
import './style.css';
import { initDesignPreview } from './design-preview';
import { initEscapePreview, escapeMode } from './escape-preview';
import { homeTitleMarkup, initTitlePreview } from './title-preview';
import { initMusic } from './music';
import { bindReply, replyMarkup, type ReplyPlan } from './reply';
import roseMarkup from './assets/rose.svg?raw';
import roseImage from './assets/rose-fine-art.webp';
import rosePreview from './assets/rose-preview.webp';
import leafImage from './assets/rose-leaf.webp';
import { config } from './config';
import { icon } from './icons';
import { weekendOptions, toggleActivity, type TimeOption } from './logic';

type Stage = 'home' | 'time' | 'activities' | 'result' | 'declined';
const root = document.querySelector<HTMLDivElement>('#app')!;
const state = { stage: 'home' as Stage, time: '', customTime: '', activities: [] as string[], note: '' };
let options: TimeOption[] = weekendOptions();
let transitioning = false;
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const reducedMotion = () => !config.motion || motionQuery.matches;
document.documentElement.classList.toggle('motion-off', !config.motion);
Object.entries(config.theme).forEach(([key, value]) => document.documentElement.style.setProperty(`--base-${key}`, value));
initDesignPreview(config.design);
initEscapePreview(() => { state.stage = 'home'; render(); window.scrollTo({ top: 0, behavior: 'instant' }); });
initTitlePreview(config.titleDesign);
document.title = config.title;

function rose(size = ''): string {
  return `<div class="rose ${size}" role="img" aria-label="一枝浅绿玫瑰，薄而卷曲的花瓣层层舒展，细茎旁有两片自然枝叶"><img class="rose-preview" src="${rosePreview}" alt="" aria-hidden="true" width="64" height="96"><img class="rose-image" src="${roseImage}" alt="" width="720" height="1080" decoding="async" fetchpriority="high"><div class="rose-fallback" hidden>${roseMarkup}</div></div>`;
}
function primary(label: string, action: string): string {
  return `<button class="button primary" data-action="${action}"><span>${label}</span>${icon('arrow')}</button>`;
}
function heading(eyebrow: string, title: string, description = ''): string {
  return `<div class="intro"><p class="eyebrow">${eyebrow}</p><h1 tabindex="-1">${title}</h1>${description ? `<p class="description">${description}</p>` : ''}</div>`;
}
function home(): string {
  return `${heading(config.copy.eyebrow, homeTitleMarkup(config.copy.homeTitle))}
    <figure class="botanical">${rose('hero-rose')}</figure>
    <div class="home-actions"><h2>${config.copy.question}</h2>
      <div class="answer-row">${primary('有空呀', 'yes')}<div class="escape-zone"><button class="button secondary escape-button" data-action="no"><span class="escape-label">没空诶</span><img class="escape-leaf" src="${leafImage}" alt="" aria-hidden="true" width="80" height="64"></button></div></div>
      <p id="escape-message" class="escape-message" role="status">${config.copy.hint}</p>
    </div>`;
}
function time(): string {
  options = weekendOptions();
  if (state.time !== 'custom' && !options.some(item => item.id === state.time)) state.time = '';
  const groups = [...new Set(options.map(item => item.date))];
  return `${rose('stamp')}${heading('02 / A moment for us', config.copy.timeTitle, '不用赶时间，选你舒服的就好。')}
    <fieldset class="time-options"><legend class="sr-only">选择方便的时间</legend>
      ${groups.map(date => {
        const items = options.filter(item => item.date === date);
        const [, month, day] = date.split('-').map(Number);
        return `<div class="day-group"><div class="day-heading"><span>${items[0].day}</span><span>${month}月${day}日 <small>${date.slice(0, 4)}</small></span></div><div class="periods">${items.map(item => `<label class="period"><input type="radio" name="time" value="${item.id}" ${state.time === item.id ? 'checked' : ''}><span>${item.period}<span class="selection-check">${icon('check')}</span></span></label>`).join('')}</div></div>`;
      }).join('')}
      <label class="other-time"><input type="radio" name="time" value="custom" ${state.time === 'custom' ? 'checked' : ''}><span><strong>其他时间</strong><small>时间可以再商量</small></span><span class="round-check">${icon('check')}</span></label>
      <div id="custom-time-wrap" ${state.time === 'custom' ? '' : 'hidden'}><label class="field-label" for="custom-time">你方便的时间</label><input id="custom-time" class="text-input" maxlength="100" placeholder="比如：下周也可以、周日四点后" autocomplete="off" aria-describedby="time-error"></div>
    </fieldset><p class="validation" id="time-error" role="alert"></p>
    ${primary('去挑好玩的', 'to-activities')}<p class="footnote">好天气值得等，你也是。</p>`;
}
function activities(): string {
  return `${rose('stamp')}${heading('03 / The little joys', config.copy.activityTitle, '选几件喜欢的事，剩下的慢慢来。')}
    <fieldset class="activity-grid"><legend class="sr-only">选择活动，可多选</legend>${config.activities.map(item => `<label class="activity"><input type="checkbox" name="activity" value="${item.id}" ${state.activities.includes(item.id) ? 'checked' : ''}><span class="activity-body"><span class="activity-icon">${icon(item.icon)}</span><span class="activity-label">${item.label}</span><span class="activity-detail">${item.detail}</span><span class="activity-check">${icon('check')}</span></span></label>`).join('')}</fieldset>
    <div class="note-field"><div class="field-line"><label for="note">还有别的想法？<small>（选填）</small></label><span id="note-count">${state.note.length}/${config.maxNoteLength}</span></div><textarea id="note" maxlength="${config.maxNoteLength}" rows="2" placeholder="想去的地方、想吃的东西，都可以告诉我。" aria-describedby="activity-error"></textarea></div>
    <p class="validation" id="activity-error" role="alert"></p>${primary('生成周末计划', 'to-result')}`;
}
function selectedTime(): string {
  return state.time === 'custom' ? state.customTime.trim() : options.find(item => item.id === state.time)?.label ?? '';
}
function selectedActivities(): string[] {
  return config.activities.filter(item => state.activities.includes(item.id)).map(item => item.label);
}
function currentReply(): ReplyPlan {
  return state.stage === 'declined'
    ? { answer: 'unavailable', time: '', activities: [], note: '' }
    : { answer: 'available', time: selectedTime(), activities: selectedActivities(), note: state.note.trim() };
}
function result(): string {
  return `<div class="result-bloom">${rose('result-rose')}<span class="result-seal">FOR OUR WEEKEND</span></div>
    ${heading('04 / See you soon', config.copy.resultTitle)}
    <div class="plan"><div class="plan-top"><span>我们的周末小计划</span><span class="tiny-flower">${icon('decide')}</span></div><dl><div><dt>见面的时间</dt><dd id="result-time"></dd></div><div><dt>一起做的事</dt><dd id="result-activities"></dd></div><div id="result-note-row" ${state.note.trim() && state.activities.length ? '' : 'hidden'}><dt>还有一个想法</dt><dd id="result-note"></dd></div></dl><p class="plan-signature">a little time, a little happiness.</p></div>
    ${replyMarkup()}<button class="text-button edit-link" data-action="edit">返回修改</button>`;
}
function declined(): string {
  return `<div class="declined-bloom">${rose('result-rose')}</div>${heading('Until another lovely day', config.copy.declinedTitle, '愿你的周末也有好心情。')}<div class="declined-rule"></div><p class="declined-note">这枝绿玫瑰，还是送给你。</p>${replyMarkup()}<button class="button secondary" data-action="restart">重新选择 ${icon('arrow')}</button>`;
}
function render(focus = false): void {
  const stages = ['home', 'time', 'activities', 'result'];
  const index = stages.indexOf(state.stage);
  root.innerHTML = `<main class="letter ${state.stage}" aria-label="绿玫瑰周末邀请函">${state.stage === 'home' ? '' : `<header class="letter-header"><span class="brand">${config.brand}</span></header>`}
    ${state.stage === 'time' || state.stage === 'activities' ? `<button class="back-button" data-action="back">${icon('back')}<span>返回</span></button>` : ''}
    <section class="page-content" aria-label="${state.stage === 'declined' ? '这周不方便' : `第 ${index + 1} 步`}">${({ home, time, activities, result, declined })[state.stage]()}</section>
    <footer class="letter-footer"><div class="steps" aria-label="${state.stage === 'declined' ? '邀请已结束' : `第 ${index + 1} 步，共 4 步`}">${stages.map((_, i) => `<span class="step ${i === index ? 'current' : ''} ${i < index ? 'complete' : ''}" aria-hidden="true"></span>`).join('')}</div></footer></main>`;
  document.querySelectorAll<HTMLImageElement>('.rose-image').forEach(image => {
    const reveal = () => image.parentElement!.classList.add('rose-ready');
    image.addEventListener('load', reveal, { once: true });
    if (image.complete && image.naturalWidth > 0) reveal();
    image.addEventListener('error', () => {
      image.hidden = true;
      image.parentElement!.classList.add('rose-ready');
      image.parentElement!.querySelector<HTMLElement>('.rose-fallback')!.hidden = false;
    }, { once: true });
  });
  const custom = document.querySelector<HTMLInputElement>('#custom-time');
  if (custom) custom.value = state.customTime;
  const note = document.querySelector<HTMLTextAreaElement>('#note');
  if (note) note.value = state.note;
  if (state.stage === 'result') {
    document.querySelector('#result-time')!.textContent = selectedTime();
    document.querySelector('#result-activities')!.textContent = selectedActivities().join('、') || state.note.trim();
    document.querySelector('#result-note')!.textContent = state.note.trim();
  }
  if (state.stage === 'home') wireEscape();
  if (state.stage === 'result' || state.stage === 'declined') bindReply(currentReply());
  if (focus) document.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
}
function navigate(stage: Stage): void {
  if (transitioning) return;
  transitioning = true;
  root.classList.add('leaving');
  window.setTimeout(() => {
    const timeExpired = (stage === 'activities' || stage === 'result') && state.time !== 'custom'
      && !weekendOptions().some(item => item.id === state.time);
    if (timeExpired) stage = 'time';
    state.stage = stage;
    root.classList.remove('leaving');
    render(true);
    if (timeExpired) error('time-error', '之前选择的时间已经过去，请重新选择。');
    window.scrollTo({ top: 0, behavior: 'instant' });
    transitioning = false;
  }, reducedMotion() ? 0 : 140);
}
function error(id: string, message: string): void {
  document.querySelector(`#${id}`)!.textContent = message;
}
function wireEscape(): void {
  const button = document.querySelector<HTMLButtonElement>('.escape-button')!;
  let position = 0;
  let previousTop = 0;
  let ignoreNextClick = false;
  const expanded = escapeMode !== 'original';
  const letter = button.closest<HTMLElement>('.letter')!;
  const layer = expanded ? document.createElement('div') : null;
  if (layer) { layer.className = 'escape-layer'; letter.append(layer); }
  let revealTimer = 0;
  let lastHoverDodge = -Infinity;
  const setMessage = (message: string) => {
    const status = letter.querySelector('#escape-message');
    if (status) status.textContent = message;
  };
  function roam(): void {
    if (!layer) return;
    const firstMove = button.parentElement !== layer;
    if (firstMove) {
      const origin = button.getBoundingClientRect();
      const box = letter.getBoundingClientRect();
      layer.append(button);
      button.style.left = `${origin.left - box.left}px`;
      button.style.top = `${origin.top - box.top}px`;
    }
    window.clearTimeout(revealTimer);
    button.classList.remove('is-vanished');
    const combined = escapeMode === 'sequence';
    const phase = combined ? (position < 2 ? 'camouflage' : position < 4 ? 'roam' : 'vanish') : escapeMode;
    const leaf = combined ? position >= 2 : phase === 'roam' && position >= 2;
    button.classList.toggle('is-leaf', leaf);
    button.classList.toggle('is-camouflaged', phase === 'camouflage');
    button.dataset.escapePhase = phase;
    button.dataset.escapeAttempt = String(position + 1);
    const flower = letter.querySelector('.botanical')!.getBoundingClientRect();
    const box = letter.getBoundingClientRect();
    const size = leaf ? 80 : 111;
    const maxX = Math.max(8, box.width - size - 9);
    const topEdge = flower.top - box.top;
    const yA = Math.max(8, topEdge + flower.height * .15);
    const yB = Math.min(box.height - 76, topEdge + flower.height * .56);
    const atLeft = position % 2 === 0;
    const targetX = atLeft ? 10 : maxX;
    const targetY = atLeft ? yA : yB;
    // Keep the moving label over the botanical area, clear of the answer row.
    button.style.left = `${targetX}px`;
    button.style.top = `${targetY}px`;
    if (phase === 'roam') {
      setMessage(leaf ? '咦，躲进叶子里了。' : '玫瑰旁边，有个小小的影子。');
    } else if (phase === 'camouflage') {
      const level = Math.min(position + 1, 4);
      button.classList.add('is-camouflaged');
      button.style.setProperty('--escape-scale', String(1 - level * .095));
      button.style.setProperty('--escape-opacity', String(1 - level * .13));
      setMessage('它又悄悄融进绿色里了。');
    } else {
      button.classList.add('is-vanished');
      setMessage('嘘，它躲起来了。');
      revealTimer = window.setTimeout(() => {
        if (!button.isConnected) return;
        button.classList.remove('is-vanished');
        setMessage('看，它又从花边探出头。');
      }, reducedMotion() ? 450 : combined ? 1500 : 950);
    }
  }
  function dodge(): boolean {
    if (!config.playfulEscape || button.matches(':focus-visible')) return false;
    if (expanded) {
      roam();
      position++;
      return true;
    }
    const zone = button.parentElement!;
    const maxX = Math.max(0, zone.clientWidth - button.offsetWidth);
    const maxY = Math.max(0, zone.clientHeight - button.offsetHeight);
    // Random landing in the opposite band guarantees a visible move each time.
    // The independent zone keeps every landing clear of the yes button.
    const top = previousTop < maxY / 2
      ? maxY * (.65 + Math.random() * .35)
      : maxY * Math.random() * .35;
    button.style.left = `${Math.random() * maxX}px`;
    button.style.top = `${top}px`;
    previousTop = top;
    position++;
    setMessage(['哎呀，差一点就点到了。', '它又悄悄挪了一下。'][position % 2]);
    return true;
  }
  button.addEventListener('pointerenter', e => {
    if (e.pointerType === 'mouse' && dodge()) lastHoverDodge = performance.now();
  });
  button.addEventListener('pointerdown', e => {
    ignoreNextClick = false;
    // A mouse hover and its immediately following press are one approach.
    if (expanded && e.pointerType === 'mouse' && performance.now() - lastHoverDodge < 400 && !button.matches(':focus-visible')) {
      ignoreNextClick = true;
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (dodge()) {
      ignoreNextClick = true;
      e.preventDefault();
      e.stopPropagation();
    }
  });
  button.addEventListener('click', e => {
    if (e.detail !== 0 && config.playfulEscape) {
      e.stopPropagation(); e.preventDefault();
      if (ignoreNextClick) ignoreNextClick = false;
      else dodge();
    }
  });
}

root.addEventListener('change', e => {
  const input = e.target as HTMLInputElement;
  if (input.name === 'time') {
    state.time = input.value;
    document.querySelector<HTMLElement>('#custom-time-wrap')!.hidden = input.value !== 'custom';
    error('time-error', '');
    if (input.value === 'custom') document.querySelector<HTMLInputElement>('#custom-time')!.focus();
  }
  if (input.name === 'activity') {
    state.activities = toggleActivity(state.activities, input.value);
    document.querySelectorAll<HTMLInputElement>('input[name="activity"]').forEach(item => { item.checked = state.activities.includes(item.value); });
    error('activity-error', '');
  }
});
root.addEventListener('input', e => {
  const input = e.target as HTMLInputElement | HTMLTextAreaElement;
  if (input.id === 'custom-time') { state.customTime = input.value.slice(0, 100); error('time-error', ''); }
  if (input.id === 'note') {
    state.note = input.value.slice(0, config.maxNoteLength);
    document.querySelector('#note-count')!.textContent = `${state.note.length}/${config.maxNoteLength}`;
    error('activity-error', '');
  }
});
root.addEventListener('click', e => {
  const button = (e.target as Element).closest<HTMLButtonElement>('[data-action]');
  if (!button || transitioning) return;
  switch (button.dataset.action) {
    case 'yes': navigate('time'); break;
    case 'no': navigate('declined'); break;
    case 'restart': navigate('home'); break;
    case 'back': navigate(state.stage === 'time' ? 'home' : 'time'); break;
    case 'edit': navigate('activities'); break;
    case 'retry-reply': bindReply(currentReply()); break;
    case 'to-activities':
      if (!state.time || (state.time === 'custom' && !state.customTime.trim())) {
        error('time-error', '选一个方便的时间，或写下你的想法就好。');
        if (state.time === 'custom') document.querySelector<HTMLInputElement>('#custom-time')!.focus();
      } else navigate('activities');
      break;
    case 'to-result':
      if (!state.activities.length && !state.note.trim()) error('activity-error', '选一件喜欢的事，或写下一个小想法吧。');
      else navigate('result');
      break;
  }
});
render();
initMusic();

````
