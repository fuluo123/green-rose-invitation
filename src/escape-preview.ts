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
