import { test, expect } from '@playwright/test';

for (const width of [320, 354, 390]) {
  test(`三种躲避预览在 ${width}px 手机可切换，安全且能继续邀请`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 320 ? 700 : 844 });
    await page.goto('/?escapePreview=1&escape=roam');
    const no = page.getByRole('button', { name: '没空诶' });
    const yes = page.getByRole('button', { name: '有空呀' });
    const original = await no.boundingBox();
    await no.dispatchEvent('pointerenter', { pointerType: 'mouse' });
    await expect(no).toHaveClass(/escape-button/);
    await expect.poll(async () => {
      const jumped = await no.boundingBox();
      return Math.hypot(jumped!.x - original!.x, jumped!.y - original!.y);
    }).toBeGreaterThan(100);
    for (let attempt = 0; attempt < 3; attempt++) await no.dispatchEvent('pointerenter', { pointerType: 'mouse' });
    await expect(no).toHaveClass(/is-leaf/);
    await page.getByRole('button', { name: 'B · 花瓣伪装' }).click();
    await expect(page).toHaveURL(/escape=camouflage/);
    await no.dispatchEvent('pointerenter', { pointerType: 'mouse' });
    await expect(no).toHaveClass(/is-camouflaged/);
    await page.getByRole('button', { name: 'C · 消失的回信' }).click();
    await expect(page).toHaveURL(/escape=vanish/);
    await no.dispatchEvent('pointerenter', { pointerType: 'mouse' });
    await expect(no).toHaveClass(/is-vanished/);
    await expect(no).not.toHaveClass(/is-vanished/, { timeout: 3000 });
    const noBox = await no.boundingBox();
    const yesBox = await yes.boundingBox();
    expect(noBox!.x + noBox!.width <= yesBox!.x || noBox!.y + noBox!.height <= yesBox!.y).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await yes.click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('那你什么时候方便？');
  });
}

test('正式页隐藏预览控件，键盘仍能拒绝', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.escape-preview')).toHaveCount(0);
  await page.getByRole('button', { name: '没空诶' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('没关系呀，等你有空再说。');
});

test('手机连续触碰藏叶方案仍远距离躲避，主按钮可用', async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, viewport: { width: 354, height: 724 } });
  try {
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:5173/?escapePreview=1&escape=roam');
    const no = page.getByRole('button', { name: '没空诶' });
    const before = await no.boundingBox();
    await no.tap();
    await expect.poll(async () => {
      const after = await no.boundingBox();
      return Math.hypot(after!.x - before!.x, after!.y - before!.y);
    }).toBeGreaterThan(100);
    await no.tap();
    await no.tap();
    await expect(no).toHaveClass(/is-leaf/);
    await page.getByRole('button', { name: '有空呀' }).tap();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('那你什么时候方便？');
  } finally {
    await context.close();
  }
});
