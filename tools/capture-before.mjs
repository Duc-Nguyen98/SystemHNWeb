import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { serve } from './serve.mjs';
const server = await serve(resolve('.'), 0);
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const results = [];
await mkdir('artifacts/before', { recursive: true });
try {
  for (const [name, hash, title] of [['filter', 'overview-desktop', 'MAP-01-06'], ['loading', 'overview-tablet', 'Đang tải'], ['otp', 'auth-tablet', 'OTP'], ['reset', 'auth-desktop', 'Đặt lại mật khẩu']]) {
    const context = await browser.newContext({ viewport: { width: 1920, height: 953 } });
    const page = await context.newPage();
    await page.goto(`${base}/#${hash}`);
    const card = page.locator('.viewport:not([hidden]) .card').filter({ has: page.locator('h3', { hasText: title }) }).first();
    const popupPromise = page.waitForEvent('popup');
    await card.locator('.preview').click();
    const popup = await popupPromise;
    await popup.locator('#frame').waitFor();
    await popup.waitForFunction(() => document.getElementById('frame').complete);
    await popup.waitForTimeout(250); // Original viewer has a 150ms transform transition.
    const measure = () => popup.evaluate(() => {
      const img = document.getElementById('frame'), stage = document.querySelector('.stage'), r = img.getBoundingClientRect(), s = stage.getBoundingClientRect();
      return { natural: [img.naturalWidth, img.naturalHeight], image: { x:r.x,y:r.y,width:r.width,height:r.height }, stage: { width:s.width,height:s.height,scrollWidth:stage.scrollWidth,scrollHeight:stage.scrollHeight }, meta: document.querySelector('.meta').textContent, transform: getComputedStyle(img).transform };
    });
    const before = await measure();
    await popup.screenshot({ path: `artifacts/before/${name}-fit.png` });
    await popup.locator('#one').click();
    await popup.waitForTimeout(250);
    const one = await measure();
    await popup.screenshot({ path: `artifacts/before/${name}-native.png` });
    results.push({ name, before, one });
    await context.close();
  }
} finally {
  await writeFile('artifacts/before/measurements.json', JSON.stringify(results, null, 2));
  await browser.close(); server.close();
}
console.log(JSON.stringify(results, null, 2));
