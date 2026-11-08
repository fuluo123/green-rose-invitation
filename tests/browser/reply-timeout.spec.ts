import { test, expect } from '@playwright/test';

for (const stalled of ['backup', 'mail'] as const) {
  test(`${stalled} 回执内容卡住时可超时并重试`, async ({ page }) => {
    await page.clock.install({ time: new Date('2026-10-27T01:00:00Z') });
    await page.addInitScript((stalledStep) => {
      const nativeFetch = window.fetch.bind(window);
      let backupAttempts = 0;
      let mailAttempts = 0;
      window.fetch = async (input, init) => {
        const url = String(input);
        if (url.includes('/api/replies')) {
          backupAttempts++;
          const payload = JSON.parse(String(init?.body));
          if (stalledStep === 'backup' && backupAttempts === 1) return { ok: true, json: () => new Promise(() => {}) } as Response;
          if (stalledStep === 'backup') return new Response(JSON.stringify({ status: 'accepted', id: payload.id }), { status: 202 });
          return new Response(JSON.stringify({ status: 'prepared', id: payload.id, mail: { endpoint: `https://formsubmit.co/ajax/${'a'.repeat(32)}`, fields: {} } }), { status: 200 });
        }
        if (url.includes('formsubmit.co/ajax/')) {
          mailAttempts++;
          if (mailAttempts === 1) return { ok: true, json: () => new Promise(() => {}) } as Response;
          return new Response(JSON.stringify({ success: true }), { status: 200 });
        }
        return nativeFetch(input, init);
      };
    }, stalled);
    await page.goto('/?invite=test');
    await page.getByRole('button', { name: '有空呀' }).click();
    await page.getByRole('radio').first().check();
    await page.getByRole('button', { name: '去挑好玩的' }).click();
    await page.getByRole('checkbox', { name: '喝咖啡' }).check();
    await page.getByRole('button', { name: '生成周末计划' }).click();
    await expect(page.locator('.reply-status')).toContainText('正在送出');
    await page.clock.fastForward('01:00');
    await expect(page.getByRole('button', { name: '再试一次' })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.reply-status')).toContainText('无法确认');
    await expect(page.locator('#result-activities')).toHaveText('喝咖啡');
    await page.getByRole('button', { name: '再试一次' }).click();
    await expect(page.locator('.reply-status')).toContainText('回信已送出');
  });
}
