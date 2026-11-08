import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 354, height: 724 }, reducedMotion: 'reduce' });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const layouts = [
  { id: 'note', name: 'A · 温柔便笺', note: '清爽无衬线 · 两行居中' },
  { id: 'letter', name: 'B · 林间来信', note: '细致思源宋体 · 左对齐' },
  { id: 'poem', name: 'C · 轻盈诗笺', note: '细致思源宋体 · 两行居中' },
];
const title = '这个周末，如果你也有空，想约你见个面';
try {
  for (const layout of layouts) {
    for (const width of [320, 354, 390, 430, 844, 1440]) {
      await page.setViewportSize({ width, height: width === 844 ? 390 : 724 });
      await page.goto(`http://127.0.0.1:4173/?title=${layout.id}`);
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.locator('h1').textContent(), title);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${layout.id} at ${width}px`);
      assert.equal(await page.locator('.title-preview').count(), 0);
      assert.equal(await page.locator('.eyebrow').textContent(), 'A little invitation · for you');
      const fits = await page.locator('h1').evaluate(heading => {
        const box = heading.getBoundingClientRect();
        return [...heading.querySelectorAll('span')].every(span => {
          const text = document.createRange();
          text.selectNodeContents(span);
          return [...text.getClientRects()].every(rect => rect.left >= box.left - 1 && rect.right <= box.right + 1);
        });
      });
      assert.equal(fits, true, `Title fits ${layout.id} at ${width}px`);
    }
    await page.setViewportSize({ width: 354, height: 724 });
    await page.goto(`http://127.0.0.1:4173/?title=${layout.id}`);
    await page.locator('.rose-image').evaluate(image => image.decode());
    await page.evaluate(() => document.fonts.ready);
    if (layout.id !== 'note') assert.equal(await page.evaluate(() => document.fonts.check('32px "Invitation Serif"', '想约你见个面')), true);
    await page.locator('.hero-rose').waitFor({ state: 'visible' });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.screenshot({ path: `artifacts/title-${layout.id}-mobile.png`, fullPage: true });
    layout.image = (await readFile(`artifacts/title-${layout.id}-mobile.png`)).toString('base64');
  }

  await page.goto('http://127.0.0.1:4173/?titlePreview=1&title=note');
  for (const layout of layouts) {
    await page.getByRole('button', { name: layout.name, exact: true }).click();
    assert.equal(await page.locator('html').getAttribute('data-title-layout'), layout.id);
    assert.equal(await page.getByRole('button', { name: layout.name, exact: true }).getAttribute('aria-pressed'), 'true');
    assert.equal(new URL(page.url()).searchParams.get('title'), layout.id);
    assert.equal(await page.locator('h1').textContent(), title);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  }
  await page.getByRole('button', { name: layouts[0].name, exact: true }).click();
  await page.screenshot({ path: 'artifacts/title-preview-mobile.png', fullPage: true });
  // The typography controls change styling without resetting the invitation.
  await page.getByRole('button', { name: '有空呀' }).click();
  await page.locator('.time').waitFor();
  await page.getByRole('button', { name: layouts[1].name, exact: true }).click();
  assert.equal(await page.locator('.time').count(), 1);
  await page.getByRole('button', { name: '返回', exact: true }).click();
  await page.locator('.home').waitFor();
  assert.equal(await page.locator('html').getAttribute('data-title-layout'), 'letter');
  await page.goto('http://127.0.0.1:4173/');
  assert.equal(await page.locator('html').getAttribute('data-title-layout'), 'poem');
  assert.equal(await page.locator('.title-preview').count(), 0);
  assert.equal(await page.locator('h1').textContent(), title);

  await page.setViewportSize({ width: 1166, height: 866 });
  await page.setContent(`<html lang="zh-CN"><head><meta charset="utf-8"><style>
    *{box-sizing:border-box}body{margin:0;padding:24px 28px 30px;background:#edf1e8;color:#294833;font-family:'Microsoft YaHei',sans-serif}
    header{display:flex;justify-content:space-between;align-items:baseline;margin:0 0 22px}h1{font-size:20px;font-weight:400;margin:0;letter-spacing:1px}header p{font-size:11px;color:#63755e;margin:0}
    main{display:grid;grid-template-columns:repeat(3,354px);gap:24px}figure{margin:0}figcaption{font-size:15px;height:55px}small{display:block;font-size:11px;color:#687b60;margin-top:7px}
    img{display:block;width:354px;height:724px;object-fit:cover;object-position:top;border:1px solid #b6c8ad;border-radius:10px}
    </style></head><body><header><h1>同一句邀请，三种写法</h1><p>手机视口 · 354 × 724</p></header><main>${layouts.map(layout => `<figure><figcaption>${layout.name}<small>${layout.note}</small></figcaption><img src="data:image/png;base64,${layout.image}" alt="${layout.name}"></figure>`).join('')}</main></body></html>`);
  await page.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
  await page.screenshot({ path: 'artifacts/title-comparison.png', fullPage: true });
  assert.deepEqual(errors, []);
  console.log('Three title layouts fit six viewport widths. Local serif font loaded, exact copy and English retained, preview switching works without losing the step, selected default C confirmed. Mobile screenshots and comparison saved.');
} finally {
  await browser.close();
}
