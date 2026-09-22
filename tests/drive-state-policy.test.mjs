import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { assertDriveStateCoverage, correctedGroup, outboundTitle } from '../tools/drive-state-policy.mjs';

const inventory = JSON.parse(readFileSync(new URL('../drive-screen-manifest.json', import.meta.url)));
const clone = () => structuredClone(inventory);
function recount(manifest) {
  manifest.total = manifest.screens.length;
  for (const group of manifest.groups) {
    const items = manifest.screens.filter(screen => screen.group === group.id);
    group.count = items.length;
    group.desktop = items.filter(screen => screen.device === 'desktop').length;
    group.tablet = items.filter(screen => screen.device === 'tablet').length;
  }
}

test('complete coverage, excluding the nine unfinished groups', () => {
  assert.equal(inventory.total, 414);
  assert.deepEqual(assertDriveStateCoverage(inventory), { checkedGroups: 12, checkedScreens: 396, exemptGroups: 9 });
  assert.equal(inventory.screens.filter(screen => screen.origin === 'ai-supplement').length, 3);
  assert.equal(inventory.screens.filter(screen => screen.origin === 'native-repair').length, 56);
});

test('original misplaced filenames always map to the correct module', () => {
  assert.equal(correctedGroup('HN_PKG_LABEL_P17_Forbidden_Desktop_1920x1080_v1.2', 'bao_cao_lich_su_nhap_xuat_kho'), 'bao_cao_nhan_dong_goi_in_lai');
  assert.equal(correctedGroup('HN-DEALER-RECIPIENT-REPORT-P14-not-found-tablet-1600x2560', 'danh_sach_SKU'), 'bao_cao_xuat_theo_nguoi_nhan_dai_ly');
  assert.equal(correctedGroup('HN-DATA-RECON-REPORT-P18-export-success-desktop-1920x1080', 'bao_cao_nhan_dong_goi_in_lai'), 'bao_cao_nhap_liet_doi_chieu_loi');
});

test('DATA RECON profile selects valid originals, semantic names and old viewer aliases', () => {
  const profile = JSON.parse(readFileSync(new URL('../tools/import-profiles/data-recon-20260923.json', import.meta.url)));
  const screens = inventory.screens.filter(screen => screen.group === profile.group);
  assert.equal(screens.length, 40);
  assert.equal(new Set(screens.map(screen => screen.sha256)).size, 40);
  assert.equal(profile.excluded.length, 8);
  assert.equal(profile.excluded.filter(file => file.path.includes('HN_AppPV')).length, 6);
  for (const screen of screens) {
    assert.equal(screen.origin, 'workspace-update');
    assert(screen.fileName.startsWith('HN_DATA_RECON_REPORT_P'));
    assert.equal(screen.sourceVerification, 'local-export-verified-cloud-access-denied');
    assert.equal(screen.width, screen.device === 'desktop' ? 1920 : 1600);
    assert.equal(screen.height, screen.device === 'desktop' ? 1080 : 2560);
    assert(!screen.sourcePaths.some(path => path.includes('HN_AppPV')));
    assert(!profile.excluded.some(file => file.sha256 === screen.sha256 && file.reason.includes('PNG decode')));
  }
  const warning = screens.find(screen => screen.stateCode === 'P10' && screen.device === 'desktop');
  assert(warning.sourcePaths[0].includes('ChatGPT Image'));
  assert.equal(warning.stateName, 'RECONCILIATION WARNING');
  assert(screens.filter(screen => screen.stateCode === 'P18').every(screen => screen.sourcePaths[0].startsWith('bao_cao_nhan_dong_goi_in_lai/')));
  for (const previous of profile.superseded) {
    const current = screens.find(screen => screen.stateCode === 'P01' && screen.device === previous.device);
    assert(current.aliases.includes(previous.id));
  }
});

test('golden export is refresh success, not a separate export-warning state', () => {
  assert.equal(outboundTitle('hoa-nam-golden-export-desktop-warning-repaired', 'bao_cao_xuat_kho'), 'HN BAO CAO XUAT KHO P09 SUCCESS UPDATE');
  assert.equal(outboundTitle('hoa-nam-bao-cao-xuat-kho-success-update-tablet-1280x2048', 'bao_cao_xuat_kho'), 'HN BAO CAO XUAT KHO P09 SUCCESS UPDATE');
  const outbound = inventory.screens.filter(screen => screen.group === 'bao_cao_xuat_kho');
  assert.equal(outbound.length, 18);
  assert(outbound.every(screen => /\bP0[1-9]\b/.test(screen.title)));
  assert(outbound.every(screen => /_P0[1-9]_/.test(screen.fileName)));
});

test('missing counterpart fails even when counts are updated', () => {
  const manifest = clone();
  manifest.screens = manifest.screens.filter(screen => !(screen.group === 'ton_kho&doi_soat' && screen.stateCode === 'P12' && screen.device === 'tablet'));
  recount(manifest);
  assert.throws(() => assertDriveStateCoverage(manifest), /missing device counterpart/);
});

test('missing full state pair fails, not just Desktop/Tablet imbalance', () => {
  for (const [group, code] of [['bao_cao_lich_su_nhap_xuat_kho', 'P16'], ['bao_cao_truy_vet_hang_hoa', 'P10'], ['bao_cao_nhap_liet_doi_chieu_loi', 'P18']]) {
    const manifest = clone();
    manifest.screens = manifest.screens.filter(screen => !(screen.group === group && screen.stateCode === code));
    recount(manifest);
    assert.throws(() => assertDriveStateCoverage(manifest), /state-code inventory/);
  }
});

test('wrong module fails even when counts are updated', () => {
  const manifest = clone();
  manifest.screens.find(screen => screen.title === 'HN PKG LABEL P17 Forbidden').group = 'bao_cao_lich_su_nhap_xuat_kho';
  recount(manifest);
  assert.throws(() => assertDriveStateCoverage(manifest), /wrong module/);
});

test('<=3-image groups remain exempt by user policy', () => {
  const manifest = clone();
  const group = manifest.groups.find(item => item.count === 2);
  manifest.screens = manifest.screens.filter(screen => !(screen.group === group.id && screen.device === 'tablet'));
  recount(manifest);
  assert.doesNotThrow(() => assertDriveStateCoverage(manifest));
});
