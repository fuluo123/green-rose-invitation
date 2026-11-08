import { test, expect, type Page } from '@playwright/test';

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test('手机方案预览切换保持填写内容，链接与浏览器主题同步', async ({ page }) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 354, height: 724 });
  await page.goto('/?preview=1&theme=rose');
  const panel = page.getByRole('complementary', { name: '选择页面设计方案' });
  const sage = panel.getByRole('button', { name: 'A · 雾绿信笺' });
  const rose = panel.getByRole('button', { name: 'B · 玫瑰花影' });
  const forest = panel.getByRole('button', { name: 'C · 林间夜色' });
  const browserColor = page.locator('meta[name="theme-color"]');
  await expect(rose).toHaveAttribute('aria-pressed', 'true');
  await expect(panel.getByRole('button', { pressed: true })).toHaveCount(1);
  const roseColor = await browserColor.getAttribute('content');
  expect(roseColor?.trim()).toBeTruthy();
  await expectNoHorizontalOverflow(page);

  await page.getByRole('button', { name: '有空呀' }).click();
  const date = page.getByRole('radio').first();
  await date.check();
  const dateNode = await date.elementHandle();
  await sage.click();
  await expect(sage).toHaveAttribute('aria-pressed', 'true');
  await expect(date).toBeChecked();
  expect(await dateNode!.evaluate(element => element.isConnected)).toBe(true);
  await expect(page).toHaveURL(/theme=sage/);
  const sageColor = await browserColor.getAttribute('content');
  expect(sageColor?.trim()).toBeTruthy();
  expect(sageColor).not.toBe(roseColor);

  await page.getByRole('radio', { name: '其他时间' }).check();
  const customTime = page.getByRole('textbox', { name: '你方便的时间' });
  await customTime.fill('周日下午四点，河边见');
  const customTimeNode = await customTime.elementHandle();
  await forest.click();
  await expect(forest).toHaveAttribute('aria-pressed', 'true');
  await expect(customTime).toHaveValue('周日下午四点，河边见');
  expect(await customTimeNode!.evaluate(element => element.isConnected)).toBe(true);
  await expect(page).toHaveURL(/theme=forest/);
  const forestColor = await browserColor.getAttribute('content');
  expect(forestColor?.trim()).toBeTruthy();
  expect(forestColor).not.toBe(sageColor);
  expect(forestColor).not.toBe(roseColor);
  await expectNoHorizontalOverflow(page);

  await page.getByRole('button', { name: '去挑好玩的' }).click();
  const activity = page.getByRole('checkbox', { name: '喝咖啡' });
  await activity.check();
  const note = page.getByRole('textbox', { name: '还有别的想法' });
  await note.fill('想坐在有树荫的地方');
  const noteNode = await note.elementHandle();
  await rose.click();
  await expect(activity).toBeChecked();
  await expect(note).toHaveValue('想坐在有树荫的地方');
  expect(await noteNode!.evaluate(element => element.isConnected)).toBe(true);
  await expect(browserColor).toHaveAttribute('content', roseColor!);
  await expect(rose).toHaveAttribute('aria-pressed', 'true');
  await expect(panel.getByRole('button', { pressed: true })).toHaveCount(1);
  const currentUrl = new URL(page.url());
  expect(currentUrl.searchParams.get('preview')).toBe('1');
  expect(currentUrl.searchParams.get('theme')).toBe('rose');
  const standaloneUrl = new URL(await panel.getByRole('link', { name: '单独打开' }).getAttribute('href')!, page.url());
  expect(standaloneUrl.searchParams.has('preview')).toBe(false);
  expect(standaloneUrl.searchParams.get('theme')).toBe('rose');
  await expectNoHorizontalOverflow(page);

  await page.getByRole('button', { name: '生成周末计划' }).click();
  await expect(page.locator('#result-time')).toHaveText('周日下午四点，河边见');
  await expect(page.locator('#result-activities')).toHaveText('喝咖啡');
  await expect(page.locator('#result-note')).toHaveText('想坐在有树荫的地方');
  await expect(panel).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test('默认首页采用林间夜色且隐藏方案控件，完整邀请流程可用', async ({ page }) => {
  await page.setViewportSize({ width: 354, height: 724 });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-design', 'forest');
  await expect(page.getByRole('complementary', { name: '选择页面设计方案' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /雾绿信笺|玫瑰花影|林间夜色/ })).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
  await page.getByRole('button', { name: '有空呀' }).click();
  await page.getByRole('radio').first().check();
  await page.getByRole('button', { name: '去挑好玩的' }).click();
  await page.getByRole('checkbox', { name: '散步聊天' }).check();
  await page.getByRole('textbox', { name: '还有别的想法' }).fill('带一杯热茶');
  await page.getByRole('button', { name: '生成周末计划' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('好，那就期待见面啦');
  await expect(page.locator('#result-time')).not.toBeEmpty();
  await expect(page.locator('#result-activities')).toHaveText('散步聊天');
  await expect(page.locator('#result-note')).toHaveText('带一杯热茶');
  await expect(page.getByRole('button', { name: '复制小计划' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '分享给我' })).toHaveCount(0);
  await expect(page.getByRole('complementary', { name: '选择页面设计方案' })).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
  await expectNoHorizontalOverflow(page);
});
