import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { serve } from '../tools/serve.mjs';

const manifest = JSON.parse(await readFile('drive-screen-manifest.json', 'utf8'));
const server = await serve(resolve('.'), 0);
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  for (const prefix of ['', 'docs/']) {
    await page.goto(`${base}/${prefix}drive-gallery.html`);
    await page.waitForFunction(total => document.querySelectorAll('.card').length === total, manifest.total);
    assert.equal(await page.locator('.card').count(), manifest.total, `${prefix} complete inventory`);

    const group = manifest.groups.find(item => item.desktop && item.tablet) || manifest.groups[0];
    await page.locator('#group').selectOption(group.id);
    assert.equal(await page.locator('.card').count(), group.count, `${prefix} group filter`);
    await page.getByRole('button', { name: 'Tablet', exact: true }).click();
    assert.equal(await page.locator('.card').count(), group.tablet, `${prefix} device filter`);

    await page.locator('#group').selectOption('');
    await page.getByRole('button', { name: 'Tất cả', exact: true }).click();
    const popupPromise = page.waitForEvent('popup');
    await page.locator('a.preview').first().click();
    const popup = await popupPromise;
    await popup.locator('#frame').waitFor({ state: 'visible' });
    assert(popup.url().includes('collection=drive'), `${prefix} Drive viewer route`);
    const downloadPromise = popup.waitForEvent('download');
    await popup.locator('#download').click();
    const download = await downloadPromise;
    const actualHash = createHash('sha256').update(await readFile(await download.path())).digest('hex');
    const id = new URL(popup.url()).searchParams.get('screen');
    const downloadedScreen = manifest.screens.find(screen => screen.id === id);
    assert.equal(actualHash, downloadedScreen.sha256, `${prefix} original download hash`);
    assert.equal(download.suggestedFilename(), downloadedScreen.fileName, `${prefix} developer-facing download filename`);
    await popup.close();
  }
} finally {
  await browser.close();
  server.close();
}
console.log(`PASS: ${manifest.total} Drive screens, filters, viewer and original downloads.`);
