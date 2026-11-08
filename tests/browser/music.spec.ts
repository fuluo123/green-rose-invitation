import { test, expect } from '@playwright/test';

for (const mode of ['void', 'throw'] as const) {
  test(`手机音频接口${mode === 'void' ? '不返回 Promise' : '同步抛错'}时邀请仍显示并可操作`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(mode => {
      const original = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function () {
        if (mode === 'throw') throw new DOMException('not allowed', 'NotAllowedError');
        const playback = original.call(this);
        if (playback) void playback.catch(() => {});
        return undefined as unknown as Promise<void>;
      };
    }, mode);
    await page.goto('/');
    await expect(page.locator('.rose-image')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('想约你见个面');
    await page.getByRole('button', { name: '有空呀' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('那你什么时候方便？');
    await page.getByRole('radio').first().check();
    await page.getByRole('button', { name: '去挑好玩的' }).click();
    await expect(page.getByRole('checkbox', { name: '喝咖啡' })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('音乐默认尝试播放、真实解码，跨步骤连续播放且可以暂停', async ({ page }) => {
  await page.goto('/');
  const audio = page.locator('#background-music');
  await expect(audio).toHaveAttribute('src', /rising-road/);
  await expect(audio).toHaveAttribute('preload', 'auto');
  await expect(audio).toHaveAttribute('autoplay', '');
  if (await audio.evaluate((el: HTMLAudioElement) => el.paused)) await page.getByRole('button', { name: '播放背景音乐' }).click();
  await expect(page.getByRole('button', { name: '暂停背景音乐' })).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => audio.evaluate((el: HTMLAudioElement) => el.currentTime)).toBeGreaterThan(.1);
  expect(await audio.evaluate((el: HTMLAudioElement) => el.duration)).toBeGreaterThan(50);
  expect(await audio.evaluate((el: HTMLAudioElement) => el.loop)).toBe(true);
  const before = await audio.evaluate((el: HTMLAudioElement) => { el.dataset.original = 'true'; return el.currentTime; });
  await page.getByRole('button', { name: '有空呀' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('那你什么时候方便？');
  await expect(audio).toHaveAttribute('data-original', 'true');
  expect(await audio.evaluate((el: HTMLAudioElement) => el.currentTime)).toBeGreaterThanOrEqual(before);
  await page.getByRole('button', { name: '暂停背景音乐' }).click();
  await expect(page.getByRole('button', { name: '播放背景音乐' })).toHaveAttribute('aria-pressed', 'false');
  expect(await audio.evaluate((el: HTMLAudioElement) => el.paused)).toBe(true);
});

test('第一次点有空开启音乐，手动暂停后不会被后续操作重新开启', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '有空呀' }).click();
  await expect(page.getByRole('button', { name: '暂停背景音乐' })).toBeVisible();
  await page.getByRole('button', { name: '暂停背景音乐' }).click();
  await page.getByRole('button', { name: '返回', exact: true }).click();
  await page.getByRole('button', { name: '有空呀' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('那你什么时候方便？');
  expect(await page.locator('audio').evaluate((el: HTMLAudioElement) => el.paused)).toBe(true);
});

test('播放被浏览器拒绝时状态真实，仍可重试与继续邀请', async ({ page }) => {
  await page.addInitScript(() => {
    // Also block the native autoplay attribute: mocking play() alone does not
    // stop the engine from automatically starting media in test profiles.
    Object.defineProperty(HTMLMediaElement.prototype, 'autoplay', { get() { return false; }, set() {} });
    let gesture = false;
    document.addEventListener('pointerdown', () => { gesture = true; }, { capture: true });
    document.addEventListener('click', () => { gesture = true; }, { capture: true });
    const original = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      if (!gesture) return Promise.reject(new DOMException('gesture required', 'NotAllowedError'));
      return original.call(this);
    };
  });
  await page.goto('/');
  await expect(page.locator('.music-feedback')).toBeEmpty();
  await page.getByRole('button', { name: '有空呀' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('那你什么时候方便？');
  await expect(page.getByRole('button', { name: '暂停背景音乐' })).toBeVisible();
  await expect(page.locator('.music-feedback')).toBeEmpty();
});

test('音乐加载失败不影响邀请', async ({ page }) => {
  await page.goto('/');
  // WebKit's media process can bypass Playwright request routing. Use a real
  // missing URL so both engines exercise the native media failure event.
  if (await page.getByRole('button', { name: '暂停背景音乐' }).isVisible()) await page.getByRole('button', { name: '暂停背景音乐' }).click();
  await page.locator('audio').evaluate((el: HTMLAudioElement) => { el.src = '/missing-background.mp3'; });
  await page.getByRole('button', { name: '播放背景音乐' }).click();
  await expect(page.locator('.music-feedback')).not.toBeEmpty();
  await expect(page.getByRole('button', { name: '播放背景音乐' })).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: '有空呀' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('那你什么时候方便？');
});


test('电脑端初始播放请求悬挂时，首次点击仍立即启动音乐', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      if (!navigator.userActivation.isActive) return new Promise<void>(() => {});
      return original.call(this);
    };
  });
  await page.goto('/');
  await page.getByRole('button', { name: '有空呀' }).click();
  await expect(page.getByRole('button', { name: '暂停背景音乐' })).toBeVisible();
  await expect.poll(() => page.locator('audio').evaluate((audio: HTMLAudioElement) => audio.currentTime)).toBeGreaterThan(.1);
  await page.getByRole('button', { name: '暂停背景音乐' }).click();
  await page.evaluate(() => document.dispatchEvent(new Event('WeixinJSBridgeReady')));
  expect(await page.locator('audio').evaluate((audio: HTMLAudioElement) => audio.paused)).toBe(true);
});
