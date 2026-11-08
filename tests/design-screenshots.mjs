import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const designs = [
  { id: 'sage', name: 'A · 雾绿信笺', note: '清新、自然，绿色信纸' },
  { id: 'rose', name: 'B · 玫瑰花影', note: '柔光、花影，温柔的氛围' },
  { id: 'forest', name: 'C · 林间夜色', note: '深绿、月光，安静的仪式感' },
];
try {
  for (const design of designs) {
    await page.goto(`http://127.0.0.1:4173/?theme=${design.id}`);
    await page.locator('.rose-image').evaluate(image => image.decode());
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({ path: `artifacts/design-${design.id}-mobile.png`, fullPage: true });
    design.image = (await readFile(`artifacts/design-${design.id}-mobile.png`)).toString('base64');
  }
  await page.setViewportSize({ width: 354, height: 724 });
  await page.goto('http://127.0.0.1:4173/?preview=1&theme=rose');
  await page.locator('.rose-image').evaluate(image => image.decode());
  await page.screenshot({ path: 'artifacts/design-preview-small.png', fullPage: true });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.deepEqual(errors, []);

  await page.setViewportSize({ width: 1266, height: 1004 });
  await page.setContent(`<html lang="zh-CN"><head><meta charset="utf-8"><style>
    *{box-sizing:border-box}body{margin:0;background:#edf1e8;color:#294833;font-family:'Microsoft YaHei',sans-serif;padding:22px 24px 26px}
    header{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:20px}h1{font:400 22px 'SimSun',serif;margin:0;letter-spacing:2px}header p{font-size:11px;color:#63755e;margin:0}
    main{display:grid;grid-template-columns:repeat(3,390px);gap:24px}figure{margin:0}figcaption{height:56px;font-size:14px;letter-spacing:1px}small{display:block;font-size:10px;letter-spacing:.5px;color:#687b60;margin-top:7px}
    img{display:block;width:390px;height:844px;object-fit:cover;object-position:top;border:1px solid #c6d4bd;border-radius:12px}
    </style></head><body><header><h1>一枝绿玫瑰，三种氛围</h1><p>手机页面 · 三种色彩提案</p></header><main>${designs.map(design => `<figure><figcaption>${design.name}<small>${design.note}</small></figcaption><img src="data:image/png;base64,${design.image}" alt="${design.name}"></figure>`).join('')}</main></body></html>`);
  await page.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
  await page.screenshot({ path: 'artifacts/design-comparison.png', fullPage: true });
  console.log('Captured all three mobile designs, the 354px preview, and side-by-side comparison. No overflow or runtime errors.');
} finally {
  await browser.close();
}
