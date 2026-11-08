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
