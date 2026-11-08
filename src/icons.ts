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
