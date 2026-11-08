import { chromium } from '@playwright/test';
import { createInvitationServer } from './invitation-server.mjs';
import { writeFile } from 'node:fs/promises';

const { server } = createInvitationServer({ send: async () => {} });
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch();
try {
  const samples = [];
  for (let run = 0; run < 3; run++) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 125000, uploadThroughput: 62500 });
    await page.goto(`http://127.0.0.1:${server.address().port}`, { waitUntil: 'domcontentloaded' });
    await page.locator('.rose-image').evaluate(image => image.decode());
    samples.push(await page.evaluate(() => {
      const rose = performance.getEntriesByType('resource').find(entry => /rose-fine-art.*webp/.test(entry.name));
      return {
        firstPaint: Math.round(performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0),
        roseRequested: Math.round(rose.startTime), roseReady: Math.round(rose.responseEnd),
        roseBytes: rose.encodedBodySize,
      };
    }));
    await context.close();
  }
  const result = { conditions: 'cold cache; 1 Mbps download; 150 ms latency; local production server; Chromium emulation', samples };
  const label = process.argv[2] ?? 'current';
  await writeFile(`artifacts/mobile-load-${label}.json`, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
} finally {
  await browser.close();
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}
