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

    // Every module/device combination must show exactly its reviewed inventory.
    for (const item of manifest.groups) {
      await page.locator('#group').selectOption(item.id);
      for (const device of ['desktop', 'tablet']) {
        await page.getByRole('button', { name: device === 'desktop' ? 'Desktop' : 'Tablet', exact: true }).click();
        assert.equal(await page.locator('.card').count(), item[device], `${prefix}${item.id}/${device} inventory`);
      }
    }
    await page.locator('#group').selectOption('bao_cao_xuat_kho');
    await page.getByRole('button', { name: 'Tất cả', exact: true }).click();
    await page.locator('#search').fill('P09 SUCCESS UPDATE');
    assert.equal(await page.locator('.card').count(), 2, 'misleading golden-export is paired with success-update');
    await page.locator('#search').fill('');
    await page.locator('#group').selectOption('');
    assert.equal(await page.locator('.badge').getByText('AI bổ sung · cần duyệt', { exact: true }).count(), 7, 'supplement review labels');

    const detail = await browser.newPage();
    for (const screen of manifest.screens.filter(item => item.origin === 'ai-supplement' || item.aliases?.length)) {
      const screenId = screen.aliases?.[0] || screen.id;
      await detail.goto(`${base}/${prefix}viewer.html?collection=drive&screen=${encodeURIComponent(screenId)}`);
      await detail.locator('#frame').waitFor({ state: 'visible' });
      assert.equal(await detail.locator('#title').textContent(), screen.title, `${prefix} old/new viewer link resolves`);
      assert.equal(await detail.locator('#download').getAttribute('download'), screen.fileName);
      if (screen.origin === 'ai-supplement') {
        assert((await detail.locator('#metadata').textContent()).includes('cần chủ thiết kế duyệt'));
        const pendingDownload = detail.waitForEvent('download');
        await detail.locator('#download').click();
        const supplementDownload = await pendingDownload;
        assert.equal(supplementDownload.suggestedFilename(), screen.fileName);
        assert.equal(createHash('sha256').update(await readFile(await supplementDownload.path())).digest('hex'), screen.sha256);
      }
    }
    await detail.close();
  }
} finally {
  await browser.close();
  server.close();
}
console.log(`PASS: ${manifest.total} Drive screens, filters, viewer and original downloads.`);
