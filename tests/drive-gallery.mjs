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
    assert.equal(await page.locator('.badge').getByText('AI bổ sung · cần duyệt', { exact: true }).count(), 3, 'supplement review labels');
    assert.equal(await page.locator('.badge').getByText('Sửa nghiệp vụ · cần duyệt', { exact: true }).count(), 56, 'native repair review labels');

    const detail = await browser.newPage();
    for (const screen of manifest.screens.filter(item => item.origin === 'ai-supplement' || item.origin === 'native-repair' || item.aliases?.length)) {
      const screenId = screen.aliases?.[0] || screen.id;
      await detail.goto(`${base}/${prefix}viewer.html?collection=drive&screen=${encodeURIComponent(screenId)}`);
      await detail.locator('#frame').waitFor({ state: 'visible' });
      assert.equal(await detail.locator('#title').textContent(), screen.title, `${prefix} old/new viewer link resolves`);
      assert.equal(await detail.locator('#download').getAttribute('download'), screen.fileName);
      if (screen.origin === 'ai-supplement' || screen.origin === 'native-repair') {
        assert((await detail.locator('#metadata').textContent()).includes('cần chủ thiết kế duyệt'));
        const pendingDownload = detail.waitForEvent('download');
        await detail.locator('#download').click();
        const supplementDownload = await pendingDownload;
        assert.equal(supplementDownload.suggestedFilename(), screen.fileName);
        assert.equal(createHash('sha256').update(await readFile(await supplementDownload.path())).digest('hex'), screen.sha256);
      }
    }
    await detail.close();

    // Deep links must open the requested updated module, not the entire gallery.
    const inventoryGroup = 'ton_kho&doi_soat';
    const inventoryTitle = 'Báo cáo tồn kho & đối soát';
    await page.goto(`${base}/${prefix}drive-gallery.html?group=${encodeURIComponent(inventoryGroup)}`);
    await page.waitForFunction(() => document.querySelectorAll('.card').length === 28);
    assert.equal(await page.locator('#group').inputValue(), inventoryGroup, 'Keep the existing group deep link');
    assert.equal(await page.locator('#group option:checked').textContent(), `${inventoryTitle} · 28`);
    for (const label of await page.locator('.card .source').allTextContents()) assert(label.startsWith(`${inventoryTitle} · `));
    for (const alt of await page.locator('.preview img').evaluateAll(images => images.map(image => image.alt))) assert(alt.endsWith(` · ${inventoryTitle}`));
    for (const device of ['Desktop', 'Tablet']) {
      await page.getByRole('button', { name: device, exact: true }).click();
      assert.equal(await page.locator('.card').count(), 14);
    }
    await page.getByRole('button', { name: 'Tất cả', exact: true }).click();
    await page.locator('#group').selectOption('');
    await page.locator('#search').fill(inventoryTitle);
    assert.equal(await page.locator('.card').count(), 28, 'Search by the corrected report name');

    await page.goto(`${base}/${prefix}drive-gallery.html?group=bao_cao_nhap_liet_doi_chieu_loi`);
    await page.waitForFunction(() => document.querySelectorAll('.card').length === 40);
    assert.equal(await page.locator('#group').inputValue(), 'bao_cao_nhap_liet_doi_chieu_loi');
    assert(await page.locator('#source-note').isVisible());
    assert((await page.locator('#updated').textContent()).includes('23/09/2026'));
    for (const device of ['Desktop','Tablet']) {
      await page.getByRole('button', { name: device, exact: true }).click();
      assert.equal(await page.locator('.card').count(), 20);
    }
    await page.getByRole('button', { name: 'Tất cả', exact: true }).click();
    await page.locator('#search').fill('P18 EXPORT SUCCESS');
    assert.equal(await page.locator('.card').count(), 2);
    const reconDetail = await browser.newPage();
    for (const screen of manifest.screens.filter(item => item.importProfile === 'data-recon-20260923')) {
      await reconDetail.goto(`${base}/${prefix}viewer.html?collection=drive&screen=${encodeURIComponent(screen.id)}`);
      await reconDetail.locator('#frame').waitFor({ state: 'visible' });
      const pending = reconDetail.waitForEvent('download');
      await reconDetail.locator('#download').click();
      const file = await pending;
      assert.equal(file.suggestedFilename(), screen.fileName);
      assert.equal(createHash('sha256').update(await readFile(await file.path())).digest('hex'), screen.sha256);
    }
    await reconDetail.close();

    await page.goto(`${base}/${prefix}drive-gallery.html?group=san_pham_app_pv`);
    await page.waitForFunction(() => document.querySelectorAll('.card').length === 48);
    assert.equal(await page.locator('#group').inputValue(), 'san_pham_app_pv');
    assert(await page.locator('#coverage-note').isVisible());
    assert((await page.locator('#coverage-note').textContent()).includes('P20F'));
    for (const device of ['Desktop','Tablet']) {
      await page.getByRole('button', { name: device, exact: true }).click();
      assert.equal(await page.locator('.card').count(), 24);
    }
    await page.getByRole('button', { name: 'Tất cả', exact: true }).click();
    await page.locator('#search').fill('P20E');
    assert.equal(await page.locator('.card').count(), 2);
    await page.locator('#search').fill('P20F');
    assert.equal(await page.locator('.card').count(), 0, 'missing state must not be fabricated');
    assert(await page.locator('#coverage-note').isVisible());
    const appPvDetail = await browser.newPage();
    for (const screen of manifest.screens.filter(item => item.importProfile === 'app-pv-20260923')) {
      await appPvDetail.goto(`${base}/${prefix}viewer.html?collection=drive&screen=${encodeURIComponent(screen.id)}`);
      await appPvDetail.locator('#frame').waitFor({ state: 'visible' });
      const pending = appPvDetail.waitForEvent('download');
      await appPvDetail.locator('#download').click();
      const file = await pending;
      assert.equal(file.suggestedFilename(), screen.fileName);
      assert.equal(createHash('sha256').update(await readFile(await file.path())).digest('hex'), screen.sha256);
    }
    await appPvDetail.close();

    await page.goto(`${base}/${prefix}drive-gallery.html?group=danh_muc_benh_loi`);
    await page.waitForFunction(() => document.querySelectorAll('.card').length === 55);
    assert.equal(await page.locator('#group option:checked').textContent(), 'Danh mục Bệnh Lỗi · 55');
    assert(await page.locator('#source-note').isVisible());
    assert(await page.locator('#coverage-note').isVisible());
    const defectWarning = await page.locator('#coverage-note').textContent();
    assert(defectWarning.includes('P11F') && defectWarning.includes('Tablet') && defectWarning.includes('bị hỏng'));
    assert(!defectWarning.includes('Desktop'), 'Only the Tablet source is corrupt');
    for (const [device, count] of [['Desktop', 28], ['Tablet', 27]]) {
      await page.getByRole('button', { name: device, exact: true }).click();
      assert.equal(await page.locator('.card').count(), count);
    }
    await page.locator('#search').fill('P11F');
    assert.equal(await page.locator('.card').count(), 0, 'Never publish corrupt Tablet artwork');
    assert(await page.locator('#coverage-note').isVisible());
    await page.getByRole('button', { name: 'Desktop', exact: true }).click();
    assert.equal(await page.locator('.card').count(), 1, 'Keep the valid P11F Desktop');
    await page.getByRole('button', { name: 'Tất cả', exact: true }).click();
    await page.locator('#search').fill('P13B');
    assert.equal(await page.locator('.card').count(), 2, 'Letter-suffixed state codes remain searchable');
    const defectDetail = await browser.newPage();
    for (const screen of manifest.screens.filter(item => item.importProfile === 'defect-catalog-20260923')) {
      await defectDetail.goto(`${base}/${prefix}viewer.html?collection=drive&screen=${encodeURIComponent(screen.id)}`);
      await defectDetail.locator('#frame').waitFor({ state: 'visible' });
      assert.equal(await defectDetail.locator('#title').textContent(), screen.title);
      const pending = defectDetail.waitForEvent('download');
      await defectDetail.locator('#download').click();
      const file = await pending;
      assert.equal(file.suggestedFilename(), screen.fileName);
      assert.equal(createHash('sha256').update(await readFile(await file.path())).digest('hex'), screen.sha256);
    }
    await defectDetail.close();

    const inboundGroup = 'nhap_kho/danh_sach_phieu_nhap_kho';
    await page.goto(`${base}/${prefix}drive-gallery.html?group=${encodeURIComponent(inboundGroup)}`);
    await page.waitForFunction(() => document.querySelectorAll('.card').length === 55);
    assert.equal(await page.locator('#group option:checked').textContent(), 'Nhập kho · Danh sách phiếu nhập · 55');
    assert(await page.locator('#source-note').isVisible());
    const inboundWarning = await page.locator('#coverage-note').textContent();
    for (const code of ['P09', 'P10', 'P15', 'P20B', 'P20D']) assert(inboundWarning.includes(code));
    for (const [device, count, missingCode] of [['Desktop', 27, 'P10'], ['Tablet', 28, 'P09']]) {
      await page.getByRole('button', { name: device, exact: true }).click();
      await page.locator('#search').fill('');
      assert.equal(await page.locator('.card').count(), count);
      await page.locator('#search').fill(missingCode);
      assert.equal(await page.locator('.card').count(), 0, 'Exclude only the corrupt state/device source');
    }
    await page.getByRole('button', { name: 'Tất cả', exact: true }).click();
    await page.locator('#search').fill('P20A');
    assert.equal(await page.locator('.card').count(), 2);
    const inboundDetail = await browser.newPage();
    for (const screen of manifest.screens.filter(item => item.importProfile === 'inbound-receipts-20260923')) {
      await inboundDetail.goto(`${base}/${prefix}viewer.html?collection=drive&screen=${encodeURIComponent(screen.id)}`);
      await inboundDetail.locator('#frame').waitFor({ state: 'visible' });
      assert.equal(await inboundDetail.locator('#title').textContent(), screen.title);
      const pending = inboundDetail.waitForEvent('download');
      await inboundDetail.locator('#download').click();
      const file = await pending;
      assert.equal(file.suggestedFilename(), screen.fileName);
      assert.equal(createHash('sha256').update(await readFile(await file.path())).digest('hex'), screen.sha256);
    }
    await inboundDetail.close();
  }
} finally {
  await browser.close();
  server.close();
}
console.log(`PASS: ${manifest.total} Drive screens, filters, viewer and original downloads.`);
