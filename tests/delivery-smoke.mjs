import { chromium, webkit, expect } from '@playwright/test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createInvitationServer } from '../scripts/invitation-server.mjs';

const receivedDir = await mkdtemp(path.join(os.tmpdir(), 'rose-browser-replies-'));
let shouldFail = true;
const sent = [];
try {
  for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
    const { server, token } = createInvitationServer({ receivedDir, send: async reply => {
      sent.push(reply);
      if (shouldFail) throw new Error('mail_failed');
    } });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const browser = await engine.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 354, height: 724 }, reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      shouldFail = true;
      const before = sent.length;
      await page.goto(`${base}/?invite=${token}`);
      assert.equal(await page.locator('html').getAttribute('data-title-layout'), 'poem');
      await page.locator('.rose-image').evaluate(image => image.decode());
      await page.evaluate(() => document.fonts.ready);
      if (name === 'chromium') await page.screenshot({ path: 'artifacts/home-selected-c.png', fullPage: true });
      await page.getByRole('button', { name: '有空呀' }).click();
      await page.getByRole('radio').first().check();
      await page.getByRole('button', { name: '去挑好玩的' }).click();
      await page.getByRole('checkbox', { name: '喝咖啡' }).check();
      await page.locator('#note').fill('想去河边');
      await page.getByRole('button', { name: '生成周末计划' }).click();
      await expect(page.locator('.reply-status')).toContainText('这次没送出去');
      assert.equal(sent.length, before + 1);
      assert.equal(await page.locator('#result-note').textContent(), '想去河边');
      shouldFail = false;
      await page.getByRole('button', { name: '再试一次' }).click();
      await expect(page.locator('.reply-status')).toHaveText('回信已送出，期待周末见。');
      assert.equal(sent.length, before + 2);
      assert.equal(sent[before].id, sent[before + 1].id);
      await page.getByRole('button', { name: '返回修改' }).click();
      await page.getByRole('button', { name: '生成周末计划' }).click();
      await expect(page.locator('.reply-status')).toHaveText('回信已送出，期待周末见。');
      assert.equal(sent.length, before + 2);
      await page.getByRole('button', { name: '返回修改' }).click();
      await page.locator('#note').fill('想去河边看晚霞');
      await page.getByRole('button', { name: '生成周末计划' }).click();
      await expect(page.locator('.reply-status')).toHaveText('回信已送出，期待周末见。');
      assert.equal(sent.length, before + 3);
      assert.notEqual(sent[before + 2].id, sent[before].id);
      assert.equal(sent[before + 2].note, '想去河边看晚霞');
      const saved = (await readFile(path.join(receivedDir, 'replies.jsonl'), 'utf8')).trim().split('\n').map(line => JSON.parse(line));
      assert.equal(saved.filter(reply => reply.id === sent[before].id).length, 1);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      if (name === 'chromium') await page.screenshot({ path: 'artifacts/result-mail-submitted.png', fullPage: true });
      assert.deepEqual(errors, []);
      console.log(`${name}: selected C, real HTTP submission + private backup, failed mail/retry, duplicate prevention, changed plan and mobile layout passed (fake mail transport; no real recipient contacted).`);
    } finally {
      await browser.close();
      server.closeAllConnections();
      await new Promise(resolve => server.close(resolve));
    }
  }
} finally {
  await rm(receivedDir, { recursive: true, force: true });
}
