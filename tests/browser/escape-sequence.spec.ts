import { test, expect } from '@playwright/test';

for (const width of [320, 390]) {
  test(`默认 ${width}px 手机按 B→A→C 递进，叶片可躲避且有空可用`, async ({ browser, browserName }) => {
    test.setTimeout(60000);
    const context = await browser.newContext({ hasTouch: true, viewport: { width, height: 844 } });
    try {
      const page = await context.newPage();
      await page.goto('http://127.0.0.1:5173/');
      await expect(page.locator('.escape-preview')).toHaveCount(0);
      const no = page.getByRole('button', { name: '没空诶' });
      await page.locator('.escape-leaf').evaluate((el: HTMLImageElement) => el.decode());
      expect(await page.locator('.escape-leaf').evaluate((el: HTMLImageElement) => el.naturalWidth)).toBe(320);
      for (let attempt = 1; attempt <= 5; attempt++) {
        await no.tap();
        const phase = attempt <= 2 ? 'camouflage' : attempt <= 4 ? 'roam' : 'vanish';
        await expect(no).toHaveAttribute('data-escape-attempt', String(attempt));
        await expect(no).toHaveAttribute('data-escape-phase', phase);
        if (attempt <= 2) await expect(no).toHaveClass(/is-camouflaged/);
        if (attempt === 3 || attempt === 4) {
          await expect(no).toHaveClass(/is-leaf/);
          await expect(no).not.toHaveClass(/is-camouflaged/);
          await expect(page.locator('.escape-leaf')).toBeVisible();
        }
        if (attempt < 5) await page.waitForTimeout(380);
        const safe = await no.evaluate(el => {
          const button = el.getBoundingClientRect();
          const letter = el.closest('.letter')!.getBoundingClientRect();
          const yes = document.querySelector('[data-action="yes"]')!.getBoundingClientRect();
          return button.left >= letter.left && button.right <= letter.right && button.bottom < yes.top;
        });
        expect(safe).toBe(true);
        if (attempt === 4 && width === 390 && browserName === 'chromium') await page.screenshot({ path: 'artifacts/home-leaf-stage.png', fullPage: true });
      }
      await expect(no).toHaveClass(/is-vanished/);
      await page.getByRole('button', { name: '有空呀' }).tap();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('那你什么时候方便？');
      await page.waitForTimeout(1700);
      await expect(page.locator('.escape-layer')).toHaveCount(0);
    } finally {
      await context.close();
    }
  });
}

test('一次鼠标靠近及随后的按下只推进一个阶段', async ({ page }) => {
  await page.goto('/');
  const no = page.getByRole('button', { name: '没空诶' });
  await no.dispatchEvent('pointerenter', { pointerType: 'mouse' });
  await no.dispatchEvent('pointerdown', { pointerType: 'mouse' });
  await no.dispatchEvent('click', { detail: 1 });
  await expect(no).toHaveAttribute('data-escape-attempt', '1');
  await expect(page.getByRole('button', { name: '有空呀' })).toBeVisible();
});
