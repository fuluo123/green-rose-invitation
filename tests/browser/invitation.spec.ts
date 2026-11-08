import { test, expect, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-12T01:00:00Z') });
  await page.goto('/');
});
async function toTime(page: Page) {
  await page.getByRole('button', { name: '有空呀' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('那你什么时候方便？');
}
async function toActivities(page: Page) {
  await toTime(page);
  await page.getByRole('radio').first().check();
  await page.getByRole('button', { name: '去挑好玩的' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('如果见面，你想做什么？');
}
async function toResult(page: Page) {
  await toActivities(page);
  await page.getByRole('checkbox', { name: '喝咖啡' }).check();
  await page.getByRole('button', { name: '生成周末计划' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('好，那就期待见面啦');
}

test('完整流程、返回保留、互斥和结果日期', async ({ page }) => {
  await toTime(page);
  await page.getByRole('button', { name: '去挑好玩的' }).click();
  await expect(page.getByRole('alert')).toContainText('选一个方便的时间');
  await expect(page.locator('.day-heading').first()).toContainText('10月17日');
  await page.getByRole('radio').nth(1).check();
  await page.getByRole('button', { name: '去挑好玩的' }).click();
  await page.getByRole('checkbox', { name: '一起吃饭' }).check();
  await page.getByRole('checkbox', { name: '喝咖啡' }).check();
  await page.getByRole('checkbox', { name: '你来决定' }).check();
  await expect(page.locator('input[name="activity"]:checked')).toHaveCount(1);
  await page.getByRole('checkbox', { name: '看电影' }).check();
  await expect(page.getByRole('checkbox', { name: '你来决定' })).not.toBeChecked();
  await page.getByRole('checkbox', { name: '喝咖啡' }).check();
  await page.getByRole('textbox', { name: '还有别的想法' }).fill('想去河边');
  await page.getByRole('button', { name: '返回', exact: true }).click();
  await expect(page.getByRole('radio').nth(1)).toBeChecked();
  await page.getByRole('button', { name: '去挑好玩的' }).click();
  await expect(page.getByRole('checkbox', { name: '看电影' })).toBeChecked();
  await expect(page.locator('#note')).toHaveValue('想去河边');
  await page.getByRole('button', { name: '生成周末计划' }).click();
  await expect(page.locator('#result-time')).toHaveText('2026年10月17日 周六 下午');
  await expect(page.locator('#result-activities')).toHaveText('喝咖啡、看电影');
  await expect(page.locator('#result-note')).toHaveText('想去河边');
  await page.waitForTimeout(1600);
  await page.screenshot({ path: 'artifacts/result-mobile.png', fullPage: true });
  await page.getByRole('button', { name: '返回修改' }).click();
  await expect(page.getByRole('checkbox', { name: '喝咖啡' })).toBeChecked();
  await page.reload();
  await expect(page.getByRole('button', { name: '有空呀' })).toBeVisible();
});
test('其他时间、只填想法、输入安全与字数上限', async ({ page }) => {
  await toTime(page);
  await page.getByRole('radio', { name: '其他时间' }).check();
  await page.getByRole('button', { name: '去挑好玩的' }).click();
  await expect(page.getByRole('alert')).toContainText('选一个方便的时间');
  await page.getByRole('textbox', { name: '你方便的时间' }).fill('<img src=x onerror=alert(1)>下周也可以');
  await page.getByRole('button', { name: '去挑好玩的' }).click();
  await page.getByRole('button', { name: '生成周末计划' }).click();
  await expect(page.getByRole('alert')).toContainText('选一件喜欢的事');
  await page.locator('#note').fill('a'.repeat(201));
  await expect(page.locator('#note-count')).toHaveText('200/200');
  await page.locator('#note').fill('<script>alert(1)</script>去骑车');
  await page.getByRole('button', { name: '生成周末计划' }).click();
  await expect(page.locator('#result-time')).toContainText('<img');
  await expect(page.locator('#result-activities')).toHaveText('<script>alert(1)</script>去骑车');
  await expect(page.locator('.plan img, .plan script')).toHaveCount(0);
});
test('首页精简文案，键盘拒绝后可重新选择', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('这个周末，如果你也有空，想约你见个面');
  await expect(page.locator('.letter-header, .description, .decline-link')).toHaveCount(0);
  await page.getByRole('button', { name: '没空诶', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('没关系呀，等你有空再说。');
  await page.getByRole('button', { name: '重新选择' }).click();
  await expect(page.getByRole('button', { name: '有空呀' })).toBeVisible();
});
test('鼠标持续躲避且不越过信笺，实体点击不会进入拒绝页', async ({ page }) => {
  const button = page.getByRole('button', { name: '没空诶', exact: true });
  let previous = await button.boundingBox();
  for (let i = 0; i < 7; i++) {
    await button.dispatchEvent('pointerenter', { pointerType: 'mouse' });
    await page.waitForTimeout(250);
    const current = await button.boundingBox();
    expect(current!.y).not.toBe(previous!.y);
    previous = current;
    const inside = await button.evaluate(el => {
      const b = el.getBoundingClientRect(); const z = el.closest('.letter')!.getBoundingClientRect();
      return b.left >= z.left && b.right <= z.right + 1 && b.top >= z.top && b.bottom <= z.bottom + 1;
    });
    expect(inside).toBe(true);
  }
  await button.dispatchEvent('click', { detail: 1 });
  await expect(page.getByRole('button', { name: '有空呀' })).toBeVisible();
});
test('触屏反复触碰都会移动，主按钮仍可正常进入下一步', async ({ browser }) => {
  test.setTimeout(60000);
  const context = await browser.newContext({ hasTouch: true, viewport: { width: 320, height: 700 } });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:5173');
  const button = page.getByRole('button', { name: '没空诶', exact: true });
  for (let i = 0; i < 6; i++) {
    const before = await button.boundingBox();
    await button.tap();
    await page.waitForTimeout(300);
    const after = await button.boundingBox();
    expect(after!.y).not.toBe(before!.y);
    await expect(page.getByRole('button', { name: '有空呀' })).toBeVisible();
    const safe = await button.evaluate(el => {
      const b = el.getBoundingClientRect(); const z = el.closest('.letter')!.getBoundingClientRect();
      return b.left >= z.left && b.right <= z.right + 1 && b.top >= z.top && b.bottom <= z.bottom + 1;
    });
    expect(safe).toBe(true);
  }
  await toTime(page);
  await context.close();
});
test('新玫瑰加载成功，资源失败时展示矢量兜底', async ({ page }) => {
  const image = page.locator('.rose-image');
  await image.evaluate((el: HTMLImageElement) => el.decode());
  expect(await image.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBe(720);
  await expect(page.locator('.rose-fallback')).toBeHidden();
  // A fresh missing URL exercises the native image error. WebKit can reuse a
  // decoded preload across reloads even when its network request is aborted.
  await image.evaluate((el: HTMLImageElement) => { el.src = '/missing-rose.webp'; });
  await expect(page.locator('.rose-fallback')).toBeVisible();
  await expect(image).toBeHidden();
  await expect(page.getByRole('button', { name: '有空呀' })).toBeVisible();
});
test('键盘拒绝不会逃跑，焦点跟随新页面', async ({ page }) => {
  const button = page.getByRole('button', { name: '没空诶', exact: true });
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('没关系呀');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
});
test('减少动态时关闭动画，鼠标躲避瞬移，键盘可拒绝', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  expect(await page.locator('.hero-rose').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  const button = page.getByRole('button', { name: '没空诶', exact: true });
  const before = await button.boundingBox();
  await button.dispatchEvent('pointerenter', { pointerType: 'mouse' });
  const after = await button.boundingBox();
  expect(after!.y).not.toBe(before!.y);
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('没关系呀');
});
test('结果页保留小计划与返回修改，移除复制和分享按钮', async ({ page }) => {
  await toResult(page);
  await expect(page.locator('#result-activities')).toHaveText('喝咖啡');
  await expect(page.getByRole('button', { name: '复制小计划' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '分享给我' })).toHaveCount(0);
  await expect(page.getByText('把这份期待，留给周末。')).toHaveCount(0);
  await expect(page.getByText('a little time, a little happiness.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '返回修改' }).click();
  await expect(page.getByRole('checkbox', { name: '喝咖啡' })).toBeChecked();
});
for (const [width, height] of [[320, 700], [354, 724], [390, 844], [430, 932], [844, 390], [1440, 1000]]) {
  test(`布局无横向溢出 ${width}×${height}`, async ({ page, browserName }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('requestfailed', req => errors.push(req.url()));
    await page.setViewportSize({ width, height });
    await page.reload();
    await page.waitForTimeout(1600);
    await expect(page.getByRole('button', { name: '有空呀' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if ((width === 390 || width === 1440) && browserName === 'chromium') await page.screenshot({ path: `artifacts/home-${width === 390 ? 'mobile' : 'desktop'}.png`, fullPage: true });
    await toTime(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('radio').first().check();
    await page.getByRole('button', { name: '去挑好玩的' }).click();
    await expect(page.getByRole('checkbox')).toHaveCount(8);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}
