import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { createInvitationServer } from '../scripts/invitation-server.mjs';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

// Build first. Use an isolated production server; never email a real recipient.
const receivedDir = await mkdtemp(path.join(os.tmpdir(), 'rose-production-'));
const { server, token } = createInvitationServer({ receivedDir, send: async () => {} });
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
page.on('requestfailed', request => errors.push(request.url()));
page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
try {
  await page.goto(`${base}/?invite=${token}`);
  await page.getByRole('button', { name: '有空呀' }).waitFor();
  assert.equal(await page.locator('html').getAttribute('data-design'), 'forest');
  assert.equal(await page.locator('html').getAttribute('data-title-layout'), 'poem');
  assert.equal(await page.locator('.design-preview').count(), 0);
  const icon = await page.locator('link[rel="icon"]').getAttribute('href');
  const response = await page.request.get(new URL(icon, page.url()).href);
  assert.equal(response.status(), 200);
  assert.match(await response.text(), /<svg/);
  await page.locator('.rose-image').evaluate(image => image.decode());
  assert.equal(await page.locator('.rose-image').evaluate(image => image.naturalWidth), 720);
  await page.waitForTimeout(1600);
  await page.screenshot({ path: 'artifacts/home-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: 'artifacts/home-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: '有空呀' }).click();
  await page.getByRole('button', { name: '暂停背景音乐' }).waitFor();
  assert.equal(await page.locator('audio').evaluate(audio => audio.loop), true);
  assert.ok(await page.locator('audio').evaluate(audio => audio.duration) > 50);
  await page.getByRole('radio').first().check();
  await page.getByRole('button', { name: '去挑好玩的' }).click();
  await page.getByRole('checkbox', { name: '散步聊天' }).check();
  await page.getByRole('button', { name: '生成周末计划' }).click();
  await page.locator('#result-activities').waitFor();
  await page.getByText('回信已送出，期待周末见。').waitFor();
  assert.equal(await page.locator('#result-activities').textContent(), '散步聊天');
  await page.waitForTimeout(1600);
  await page.screenshot({ path: 'artifacts/result-mobile.png', fullPage: true });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.deepEqual(errors, []);
  console.log('Production smoke passed: assets, SVG favicon, local music decoding/playback, full flow, mobile layout, no runtime errors.');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
  await rm(receivedDir, { recursive: true, force: true });
}
