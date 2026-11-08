import { chromium, webkit, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createInvitationServer } from '../scripts/invitation-server.mjs';

// UA profiles are simulations; these do not launch the vendors' phone apps.
const android = 'Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36';
const ios = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';
const profiles = [
  ['百度', 'chromium', `${android} baidubrowser/6.25.0.1`, 360],
  ['夸克', 'chromium', `${android} Quark/7.0.0.0`, 390],
  ['UC', 'chromium', `${android} UCBrowser/16.0.0.0`, 354],
  ['QQ浏览器', 'chromium', `${android} MQQBrowser/15.0.0`, 430],
  ['微信安卓', 'chromium', `${android} MicroMessenger/8.0.50`, 360],
  ['华为', 'chromium', `${android} HuaweiBrowser/14.0.0.0`, 390],
  ['小米', 'chromium', `${android} MiuiBrowser/18.0.0`, 393],
  ['vivo', 'chromium', `${android} VivoBrowser/20.0.0`, 360],
  ['OPPO', 'chromium', `${android} HeyTapBrowser/45.0.0.0`, 360],
  ['360', 'chromium', `${android} 360 Aphone Browser`, 320],
  ['Safari', 'webkit', `${ios} Version/17.4 Safari/604.1`, 390],
  ['微信iOS', 'webkit', `${ios} MicroMessenger/8.0.50`, 375],
  ['百度iOS', 'webkit', `${ios} baidubrowser/6.25.0.1`, 390],
  ['夸克iOS', 'webkit', `${ios} Quark/7.0.0.0`, 390],
];
const receivedDir = await mkdtemp(path.join(os.tmpdir(), 'rose-mobile-matrix-'));
const browsers = { chromium: await chromium.launch(), webkit: await webkit.launch() };
const results = [];
try {
  for (const [name, engine, userAgent, width] of profiles) {
    let reply;
    const { server, token } = createInvitationServer({ receivedDir, send: async value => { reply = value; } });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const context = await browsers[engine].newContext({ userAgent, viewport: { width, height: 844 }, hasTouch: true, deviceScaleFactor: 2, timezoneId: 'Asia/Shanghai' });
    try {
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`http://127.0.0.1:${server.address().port}/?invite=${token}`);
      await page.locator('.rose-image').evaluate(image => image.decode());
      const photo = await page.locator('.rose-image').evaluate(image => ({ width: image.naturalWidth, opacity: getComputedStyle(image).opacity }));
      assert.equal(photo.width, 720);
      assert.equal(photo.opacity, '1');
      const checkLayout = async () => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${name}: horizontal overflow`);
      await checkLayout();
      await page.getByRole('button', { name: '有空呀' }).tap();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('那你什么时候方便？');
      await checkLayout();
      await page.getByRole('radio').first().check();
      await page.getByRole('button', { name: '去挑好玩的' }).tap();
      await expect(page.getByRole('checkbox', { name: '喝咖啡' })).toBeVisible();
      await checkLayout();
      await page.getByRole('checkbox', { name: '喝咖啡' }).check();
      await page.locator('#note').fill('周末一起喝咖啡');
      await page.getByRole('button', { name: '生成周末计划' }).tap();
      await expect(page.locator('.reply-status')).toHaveText('回信已送出，期待周末见。');
      await checkLayout();
      assert.deepEqual(reply.activities, ['喝咖啡']);
      assert.equal(reply.note, '周末一起喝咖啡');
      await page.getByRole('button', { name: '返回修改' }).tap();
      await expect(page.getByRole('checkbox', { name: '喝咖啡' })).toBeChecked();
      assert.deepEqual(errors, []);
      results.push({ name, engine, width, passed: true });
      console.log(`${name}: ${engine} UA simulation, ${width}px, rose, touch, 4-step layout, HTTP reply and edit passed; fake mail only.`);
    } finally {
      await context.close();
      server.closeAllConnections();
      await new Promise(resolve => server.close(resolve));
    }
  }
  await writeFile('artifacts/mobile-browser-matrix.json', JSON.stringify({ scope: 'Chromium/WebKit UA simulations; not actual vendor apps or China ISP testing; mock mail transport', results }, null, 2));
} finally {
  await Promise.all(Object.values(browsers).map(browser => browser.close()));
  await rm(receivedDir, { recursive: true, force: true });
}
