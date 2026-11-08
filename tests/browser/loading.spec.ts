import { test, expect } from '@playwright/test';

test('慢网下大图尚未下载时，首页已经显示同一朵玫瑰', async ({ page }) => {
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/rose-fine-art*.webp*', async route => {
    if (!new URL(route.request().url()).searchParams.has('import')) await pending;
    await route.continue();
  });
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: '有空呀' })).toBeVisible();
    await page.waitForTimeout(1400);
    // WebKit screenshots wait for outstanding image requests. Inspect pixels
    // from a decoded, visible image instead, while its large version is pending.
    const petalFraction = await page.locator('.hero-rose').evaluate(rose => {
      const image = [...rose.querySelectorAll('img')].find(image => image.naturalWidth > 0 &&
        getComputedStyle(image).display !== 'none' && Number(getComputedStyle(image).opacity) > .5);
      if (!image) return 0;
      const canvas = document.createElement('canvas');
      canvas.width = 64; canvas.height = 96;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(image, 0, 0, 64, 96);
      const { data } = ctx.getImageData(0, 0, 64, 96);
      let petals = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] > 145 && data[i + 1] > 150 && data[i + 2] > 100 && data[i + 3] > 128) petals++;
      }
      return petals / (64 * 96);
    });
    expect(petalFraction).toBeGreaterThan(.05);
  } finally { release(); }
  await expect.poll(() => page.locator('.rose-image').evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
});
