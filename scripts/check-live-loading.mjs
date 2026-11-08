import { chromium, webkit, expect } from '@playwright/test';
import assert from 'node:assert/strict';

for (const engine of [chromium, webkit]) {
  const proxy = process.env.HTTPS_PROXY ?? process.env.HTTP_PROXY;
  const browser = await engine.launch({ ...(proxy ? { proxy: { server: proxy } } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('https://rose.shushu.dpdns.org/', { waitUntil: 'domcontentloaded', timeout: 40000 });
    await page.locator('.rose-image').evaluate(image => image.decode());
    assert.equal(await page.locator('.rose-image').evaluate(image => image.naturalWidth), 720);
    await expect(page.locator('.rose-image')).toHaveCSS('opacity', '1');
    if (engine === chromium) await page.screenshot({ path: 'artifacts/live-loading-optimized.png', fullPage: true });
    await page.getByRole('button', { name: '有空呀' }).tap();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('那你什么时候方便？');
    await expect.poll(() => page.locator('audio').evaluate(audio => audio.currentTime), { timeout: 20000 }).toBeGreaterThan(.1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.deepEqual(errors, []);
    const audio = await page.locator('audio').getAttribute('src');
    const partial = await page.request.get(new URL(audio, page.url()).href, { headers: { Range: 'bytes=0-1023' } });
    assert.equal(partial.status(), 206);
    assert.equal((await partial.body()).length, 1024);
    console.log(`${engine.name()}: actual public domain, optimized rose, music playback, 1024-byte HTTP 206 and layout passed on this computer's network; no reply submitted.`);
  } finally { await browser.close(); }
}
