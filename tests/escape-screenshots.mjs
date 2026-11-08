import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

await mkdir('artifacts', { recursive: true });
const browser = await chromium.launch();
try {
  for (const [mode, steps] of [['roam', 4], ['camouflage', 4], ['vanish', 1]]) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    await page.goto(`http://127.0.0.1:4173/?escapePreview=1&escape=${mode}`);
    await page.locator('.rose-image').evaluate(image => image.decode());
    await page.waitForTimeout(1300);
    for (let i = 0; i < steps; i++) await page.locator('.escape-button').dispatchEvent('pointerenter', { pointerType: 'mouse' });
    await page.waitForTimeout(380);
    await page.screenshot({ path: `artifacts/escape-${mode}.png`, fullPage: true });
    await page.close();
  }
} finally {
  await browser.close();
}
