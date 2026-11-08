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
