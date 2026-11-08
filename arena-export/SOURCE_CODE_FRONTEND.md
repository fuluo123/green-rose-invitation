# 源码摘录：原始路径保留

这是阅读辅助。完整项目、二进制资源、测试和其他脚本见同目录 ZIP；若内容不一致，以原始文件为准。

## `src/reply.ts`

````text
import './reply.css';

export type ReplyPlan = { answer: 'available' | 'unavailable'; time: string; activities: string[]; note: string };
type Delivery = { id: string; state: 'pending' | 'accepted' | 'failed'; message: string };
const deliveries = new Map<string, Delivery>();
let invitationKey = new URL(location.href).searchParams.get('invite') ?? '';
try {
  if (invitationKey) sessionStorage.setItem('rose-invite', invitationKey);
  else invitationKey = sessionStorage.getItem('rose-invite') ?? '';
} catch { /* Private browsing can disable storage; the complete link still works. */ }

async function timedJson(url: string, options: RequestInit, milliseconds: number): Promise<{ response: Response; body: any }> {
  const controller = new AbortController();
  let timeout = 0;
  const deadline = new Promise<never>((_, reject) => {
    timeout = window.setTimeout(() => { controller.abort(); reject(new Error('timeout')); }, milliseconds);
  });
  try {
    return await Promise.race([(async () => {
      const response = await fetch(url, { ...options, signal: controller.signal });
      const body = await response.json();
      return { response, body };
    })(), deadline]);
  }
  finally { window.clearTimeout(timeout); }
}

function id(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function replyMarkup(): string {
  return '<div class="reply-feedback" aria-live="polite" aria-atomic="true"><p class="reply-status" role="status">正在送出这份回信…</p><button type="button" class="text-button reply-retry" data-action="retry-reply" hidden>再试一次</button></div>';
}

function show(delivery: Delivery): void {
  const box = document.querySelector<HTMLElement>('.reply-feedback');
  if (!box) return;
  box.dataset.state = delivery.state;
  box.querySelector('.reply-status')!.textContent = delivery.message;
  box.querySelector<HTMLButtonElement>('.reply-retry')!.hidden = delivery.state !== 'failed';
}

export async function submitReply(plan: ReplyPlan): Promise<void> {
  const fingerprint = JSON.stringify(plan);
  let delivery = deliveries.get(fingerprint);
  if (delivery && delivery.state !== 'failed') { show(delivery); return; }
  delivery ??= { id: id(), state: 'pending', message: '' };
  delivery.state = 'pending';
  delivery.message = '正在送出这份回信…';
  deliveries.set(fingerprint, delivery);
  show(delivery);
  try {
    const { response, body: receipt } = await timedJson('/api/replies', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...plan, id: delivery.id, token: invitationKey }),
    }, 25000);
    if (response.ok && receipt.status === 'prepared' && receipt.id === delivery.id) {
      if (!/^https:\/\/formsubmit\.co\/ajax\/[a-f0-9]{32}$/.test(receipt.mail?.endpoint)) throw new Error('delivery');
      const { response: mailResponse, body: mailReceipt } = await timedJson(receipt.mail.endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(receipt.mail.fields), referrerPolicy: 'strict-origin',
      }, 30000);
      if (!mailResponse.ok || ![true, 'true'].includes(mailReceipt.success)) {
        throw new Error(/activat|confirm.*email|verify.*email/i.test(String(mailReceipt.message)) ? 'activation' : 'delivery');
      }
      receipt.status = 'accepted';
    }
    if (!response.ok || receipt.status !== 'accepted' || receipt.id !== delivery.id) {
      throw new Error(receipt.code === 'activation_required' ? 'activation' : receipt.code === 'invalid_invitation' ? 'invitation' : receipt.code === 'try_later' ? 'limited' : 'delivery');
    }
    delivery.state = 'accepted';
    delivery.message = '回信已送出，期待周末见。';
  } catch (error) {
    delivery.state = 'failed';
    delivery.message = error instanceof Error && error.message === 'invitation'
      ? '邀请链接不完整，请使用收到的完整邀请链接重新打开。'
      : error instanceof Error && error.message === 'limited'
      ? '刚才尝试得有点频繁，请稍等一分钟再试。'
      : error instanceof Error && error.message === 'activation'
      ? '回信通道还在开通中，稍后再试一次就好。'
      : error instanceof Error && error.message === 'timeout'
      ? '暂时无法确认是否送出。你的选择还在，重试可能产生重复回信。'
      : '这次没送出去。你的选择还在，点一下再试。';
  }
  // A request may finish after she has gone back to edit the plan.
  if (document.querySelector('.reply-feedback')?.getAttribute('data-reply-id') === delivery.id) show(delivery);
}

export function bindReply(plan: ReplyPlan): void {
  const fingerprint = JSON.stringify(plan);
  const delivery = deliveries.get(fingerprint);
  const box = document.querySelector<HTMLElement>('.reply-feedback');
  if (!box) return;
  if (delivery) { box.dataset.replyId = delivery.id; show(delivery); }
  else {
    const fresh = { id: id(), state: 'failed' as const, message: '' };
    deliveries.set(fingerprint, fresh);
    box.dataset.replyId = fresh.id;
  }
  void submitReply(plan);
}

````

## `src/music.ts`

````text
import soundtrack from './assets/rising-road.mp3';
import './music.css';

/** Lives outside the changing invitation pages, so navigation preserves playback. */
export function initMusic(): void {
  const player = document.createElement('div');
  player.className = 'music-player';
  player.innerHTML = `<button class="music-toggle" type="button" aria-label="播放背景音乐" aria-pressed="false" title="Rising Road ～メインテーマ～ · 播放音乐"><svg class="music-note" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M9 17V6l11-2v11M9 9l11-2"/><ellipse cx="6" cy="18" rx="3" ry="2"/><ellipse cx="17" cy="16" rx="3" ry="2"/></svg><span class="music-bars" aria-hidden="true"><i></i><i></i><i></i></span></button><span class="music-feedback" role="status"></span>`;
  const audio = document.createElement('audio');
  audio.id = 'background-music';
  audio.src = soundtrack;
  audio.preload = 'auto';
  audio.autoplay = true;
  audio.loop = true;
  audio.setAttribute('playsinline', '');
  audio.volume = .3;
  player.append(audio);
  document.body.append(player);
  const button = player.querySelector<HTMLButtonElement>('button')!;
  const feedback = player.querySelector<HTMLElement>('.music-feedback')!;
  let wanted = false;
  let attempted = false;
  let generation = 0;
  function reflect(): void {
    const playing = !audio.paused && !audio.ended && audio.readyState >= 2;
    player.classList.toggle('is-playing', playing);
    button.setAttribute('aria-pressed', String(playing));
    button.setAttribute('aria-label', playing ? '暂停背景音乐' : '播放背景音乐');
    button.title = `Rising Road ～メインテーマ～ · ${playing ? '暂停音乐' : '播放音乐'}`;
  }
  function pause(): void {
    wanted = false;
    generation++;
    audio.pause();
    reflect();
  }
  function play(quiet = false): void {
    wanted = true;
    feedback.textContent = '';
    const request = ++generation;
    const failed = () => {
      if (request !== generation) return;
      wanted = false;
      reflect();
      if (!quiet) feedback.textContent = '音乐还没响，点一下再试试。';
    };
    // Called directly in the click handler to retain the mobile user gesture.
    // Older embedded browsers start playback but return void, and some throw
    // synchronously. Neither case should interrupt invitation initialization.
    let playback: Promise<void> | undefined;
    try { playback = audio.play(); }
    catch { failed(); return; }
    void Promise.resolve(playback).then(() => {
      if (!wanted) audio.pause();
      reflect();
    }).catch(failed);
  }
  button.addEventListener('click', () => {
    attempted = true;
    if (!audio.paused) pause(); else play();
  });
  function unlock(event: Event): void {
    // Desktop WebViews can leave the initial play promise pending. A real
    // gesture must retry even while that earlier request is still outstanding.
    if (!attempted && audio.paused && !(event.target instanceof Element && event.target.closest('.music-player'))) play(true);
  }
  document.addEventListener('pointerdown', unlock, { capture: true });
  document.addEventListener('touchend', unlock, { capture: true, passive: true });
  document.addEventListener('click', unlock, { capture: true });
  document.addEventListener('keydown', unlock, { capture: true });
  function retryAutomatic(): void { if (!attempted && audio.paused && !document.hidden) play(true); }
  document.addEventListener('WeixinJSBridgeReady', retryAutomatic);
  audio.addEventListener('playing', () => { if (!wanted) audio.pause(); reflect(); });
  audio.addEventListener('pause', reflect);
  audio.addEventListener('error', () => {
    wanted = false;
    reflect();
    feedback.textContent = '音乐暂时没加载好，邀请可以继续。';
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); else retryAutomatic(); });
  window.addEventListener('pagehide', pause);
  window.addEventListener('pageshow', retryAutomatic);
  play(true);
}

````

## `src/icons.ts`

````text
const paths: Record<string, string> = {
  dinner: '<path d="M5 3v6m3-6v6M5 6h3M6.5 9v12M17 3c-3 3-3 8 0 9V3Zm0 9v9"/>',
  coffee: '<path d="M4 9h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Zm13 1h2a3 3 0 0 1 0 6h-2M7 3v3m4-4v4m4-3v3M3 22h16"/>',
  movie: '<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 10h18M7 5l3 5m4-5 3 5M10 13l5 2-5 3v-5Z"/>',
  walk: '<path d="M5 21c0-8 14-3 14-11M3 15c2-6 7-3 7-8"/><ellipse cx="8" cy="4" rx="2" ry="3" transform="rotate(25 8 4)"/><ellipse cx="18" cy="6" rx="2" ry="3" transform="rotate(-25 18 6)"/>',
  park: '<path d="M12 3 5 12h3l-4 6h16l-4-6h3L12 3Zm0 15v4M8 22h8"/>',
  gallery: '<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M6 17l5-6 4 4 3-3 3 4"/><circle cx="16" cy="8" r="1.5"/>',
  book: '<path d="M12 6C9 3 5 3 2 4v16c4-1 7-1 10 1 3-2 6-2 10-1V4c-4-1-7-1-10 2Zm0 0v15M5 8h4m-4 4h4m6-4h4m-4 4h4"/>',
  decide: '<path d="M12 3v5m0 8v5M3 12h5m8 0h5M6 6l3 3m6 6 3 3M6 18l3-3m6-6 3-3"/><circle cx="12" cy="12" r="2"/>',
  arrow: '<path d="M4 12h15m-5-5 5 5-5 5"/>',
  back: '<path d="m14 7-5 5 5 5"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  copy: '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M15 8V3H4v13h4"/>',
  share: '<path d="M12 15V3m-4 4 4-4 4 4M6 11H4v10h16V11h-2"/>',
};
export function icon(name: string): string {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.decide}</svg>`;
}

````

## `src/design-preview.ts`

````text
import './themes.css';

const designs = [
  { id: 'sage', name: '雾绿信笺', note: '浅鼠尾草绿，像一封带着草木气息的信。' },
  { id: 'rose', name: '玫瑰花影', note: '虚化的花瓣与柔光，衬着一枝清晰的绿玫瑰。' },
  { id: 'forest', name: '林间夜色', note: '深绿的安静夜色，让这枝玫瑰像被月光照亮。' },
] as const;
type Design = typeof designs[number]['id'];

export function initDesignPreview(defaultDesign: Design): void {
  const url = new URL(window.location.href);
  const reviewing = url.searchParams.get('preview') === '1';
  const requested = url.searchParams.get('theme');
  const initial = designs.find(item => item.id === requested)?.id ?? defaultDesign;

  let panel: HTMLElement | undefined;
  function selectDesign(id: Design, updateUrl = false): void {
    document.documentElement.dataset.design = id;
    const palette = getComputedStyle(document.documentElement);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', palette.getPropertyValue('--paper').trim());
    if (updateUrl) {
      const next = new URL(window.location.href);
      next.searchParams.set('theme', id);
      window.history.replaceState(null, '', next);
    }
    if (!panel) return;
    panel.querySelectorAll<HTMLButtonElement>('[data-design-option]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.designOption === id));
    });
    panel.querySelector('.design-note')!.textContent = designs.find(item => item.id === id)!.note;
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete('preview');
    cleanUrl.searchParams.set('theme', id);
    panel.querySelector<HTMLAnchorElement>('.design-open')!.href = cleanUrl.href;
  }

  if (reviewing) {
    document.body.classList.add('design-review');
    panel = document.createElement('aside');
    panel.className = 'design-preview';
    panel.setAttribute('aria-label', '选择页面设计方案');
    panel.innerHTML = `<div class="design-preview-inner">
      <div class="design-caption"><span>选一种你喜欢的氛围</span><a class="design-open" href="?theme=${initial}">单独打开 ${'↗'}</a></div>
      <div class="design-options" role="group" aria-label="三种色彩方案">${designs.map((item, index) => `<button type="button" class="design-option" data-design-option="${item.id}" aria-pressed="false"><span class="design-swatch swatch-${item.id}" aria-hidden="true"></span><span>${String.fromCharCode(65 + index)} · ${item.name}</span></button>`).join('')}</div>
      <p class="design-note" aria-live="polite"></p>
    </div>`;
    document.body.prepend(panel);
    panel.addEventListener('click', event => {
      const button = (event.target as Element).closest<HTMLButtonElement>('[data-design-option]');
      const id = designs.find(item => item.id === button?.dataset.designOption)?.id;
      if (id) selectDesign(id, true);
    });
  }
  selectDesign(initial);
}

````

## `src/title-preview.ts`

````text
import './title-preview.css';

const layouts = [
  { id: 'note', name: 'A · 温柔便笺', note: '小字铺垫，大字邀请。清爽的无衬线，两行居中。' },
  { id: 'letter', name: 'B · 林间来信', note: '像一封慢慢写下的信。左对齐，三行有轻重。' },
  { id: 'poem', name: 'C · 轻盈诗笺', note: '细致的衬线字形，两行居中，留一点诗意。' },
] as const;

type TitleLayout = typeof layouts[number]['id'] | 'original';

export function homeTitleMarkup(title: string): string {
  const firstComma = title.indexOf('，');
  const lastComma = title.lastIndexOf('，');
  if (firstComma < 0 || firstComma === lastComma) return title;
  return `<span class="title-context"><span class="title-opener">${title.slice(0, firstComma + 1)}</span><span class="title-condition">${title.slice(firstComma + 1, lastComma + 1)}</span></span><span class="title-invitation">${title.slice(lastComma + 1)}</span>`;
}

export function initTitlePreview(defaultLayout: TitleLayout = 'poem'): void {
  const url = new URL(location.href);
  const reviewing = url.searchParams.get('titlePreview') === '1';
  const requested = layouts.find(item => item.id === url.searchParams.get('title'))?.id;
  const initial: TitleLayout = requested ?? defaultLayout;
  let panel: HTMLElement | undefined;

  function select(layout: TitleLayout, updateUrl = false): void {
    document.documentElement.dataset.titleLayout = layout;
    if (updateUrl) {
      const next = new URL(location.href);
      next.searchParams.set('title', layout);
      history.replaceState(null, '', next);
    }
    if (!panel) return;
    panel.querySelectorAll<HTMLButtonElement>('[data-title-option]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.titleOption === layout));
    });
    panel.querySelector('.title-preview-note')!.textContent = layouts.find(item => item.id === layout)!.note;
    const cleanUrl = new URL(location.href);
    cleanUrl.searchParams.delete('titlePreview');
    cleanUrl.searchParams.set('title', layout);
    panel.querySelector<HTMLAnchorElement>('.title-preview-open')!.href = cleanUrl.href;
  }

  if (reviewing) {
    document.body.classList.add('title-review');
    panel = document.createElement('aside');
    panel.className = 'title-preview';
    panel.setAttribute('aria-label', '选择首页标题排版');
    panel.innerHTML = `<div class="title-preview-inner"><div class="title-preview-heading"><span>首页标题 · 三种排版</span><a class="title-preview-open" href="?title=${initial}">单独看这一版 ↗</a></div><div class="title-preview-options" role="group" aria-label="三种标题排版">${layouts.map(item => `<button type="button" data-title-option="${item.id}" aria-pressed="false">${item.name}</button>`).join('')}</div><p class="title-preview-note" aria-live="polite"></p></div>`;
    document.body.prepend(panel);
    panel.addEventListener('click', event => {
      const option = (event.target as Element).closest<HTMLButtonElement>('[data-title-option]');
      const layout = layouts.find(item => item.id === option?.dataset.titleOption)?.id;
      if (layout) select(layout, true);
    });
  }
  select(initial);
}

````

## `src/escape-preview.ts`

````text
import './escape-preview.css';

export type EscapeMode = 'original' | 'roam' | 'camouflage' | 'vanish' | 'sequence';

const variants = [
  { id: 'roam', name: 'A · 林间捉迷藏', note: '跳到花枝两侧；几次之后，缩成一片小叶子。' },
  { id: 'camouflage', name: 'B · 花瓣伪装', note: '每次远远躲开，再一点点缩小、融进绿意。' },
  { id: 'vanish', name: 'C · 消失的回信', note: '碰一下就隐身，片刻后从花边偷偷出现。' },
] as const;

const params = new URL(location.href).searchParams;
export const reviewingEscape = params.get('escapePreview') === '1';
export let escapeMode: EscapeMode = variants.find(item => item.id === params.get('escape'))?.id ?? (reviewingEscape ? 'roam' : 'sequence');

export function initEscapePreview(onChange: () => void): void {
  if (!reviewingEscape) return;
  if (escapeMode === 'original') escapeMode = 'roam';
  document.body.classList.add('escape-review');
  const panel = document.createElement('aside');
  panel.className = 'escape-preview';
  panel.setAttribute('aria-label', '选择没空诶的互动方案');
  panel.innerHTML = `<div class="escape-preview-inner"><div class="escape-preview-heading"><span>「没空诶」怎么玩？</span><a href="/">回到当前版本 ↗</a></div><div class="escape-options" role="group" aria-label="三种躲避方案">${variants.map(item => `<button type="button" data-escape-option="${item.id}" aria-pressed="false">${item.name}</button>`).join('')}</div><p class="escape-preview-note" aria-live="polite"></p></div>`;
  document.body.prepend(panel);
  const update = () => {
    panel.querySelectorAll<HTMLButtonElement>('[data-escape-option]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.escapeOption === escapeMode)));
    panel.querySelector('.escape-preview-note')!.textContent = variants.find(item => item.id === escapeMode)?.note ?? '';
  };
  panel.addEventListener('click', event => {
    const value = (event.target as Element).closest<HTMLButtonElement>('[data-escape-option]')?.dataset.escapeOption;
    const next = variants.find(item => item.id === value)?.id;
    if (!next || next === escapeMode) return;
    escapeMode = next;
    const url = new URL(location.href);
    url.searchParams.set('escape', next);
    history.replaceState(null, '', url);
    update();
    onChange();
  });
  update();
}

````
