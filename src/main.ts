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
