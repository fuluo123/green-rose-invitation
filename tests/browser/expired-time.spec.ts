import { test, expect } from '@playwright/test';

test('选择时段在填写活动时过期，不会发送并保留已填内容', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-17T03:59:00Z') });
  let submissions = 0;
  await page.route('**/api/replies', async route => { submissions++; await route.fulfill({ status: 200, json: {} }); });
  await page.goto('/');
  await page.getByRole('button', { name: '有空呀' }).click();
  await page.getByRole('radio', { name: '上午' }).first().check();
  await page.getByRole('button', { name: '去挑好玩的' }).click();
  await page.getByRole('checkbox', { name: '喝咖啡' }).check();
  await page.locator('#note').fill('想去河边');
  await page.clock.setFixedTime(new Date('2026-10-17T04:00:00Z'));
  await page.getByRole('button', { name: '生成周末计划' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('那你什么时候方便？');
  await expect(page.getByRole('alert')).toContainText('时间');
  expect(submissions).toBe(0);
  await page.getByRole('radio', { name: '下午' }).first().check();
  await page.getByRole('button', { name: '去挑好玩的' }).click();
  await expect(page.getByRole('checkbox', { name: '喝咖啡' })).toBeChecked();
  await expect(page.locator('#note')).toHaveValue('想去河边');
});
