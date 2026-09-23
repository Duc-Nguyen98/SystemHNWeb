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

test('reviewed available inventory, seven unfinished groups, and seven explicit source gaps', () => {
  assert.equal(inventory.total, 568);
  assert.deepEqual(assertDriveStateCoverage(inventory), { checkedGroups: 15, checkedScreens: 554, exemptGroups: 7, knownMissingStates: 7 });
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

test('App PV imports the matching state family and recovers P18/P19 without duplicate P16', () => {
  const profile = JSON.parse(readFileSync(new URL('../tools/import-profiles/app-pv-20260923.json', import.meta.url)));
  const screens = inventory.screens.filter(screen => screen.group === profile.group);
  assert.equal(screens.length, 48);
  assert.equal(new Set(screens.map(s => s.sha256)).size, 48);
  assert.equal(screens.filter(s => s.device === 'desktop').length, 24);
  assert.equal(profile.excluded.length, 6);
  assert.deepEqual(profile.missingStates.map(s => s.code), ['P20F']);
  assert(screens.every(s => s.fileName.startsWith('HN_APP_PV_CATALOG_')));
  assert(screens.filter(s => ['P18','P19'].includes(s.stateCode)).every(s => s.sourcePaths[0].startsWith('bao_cao_nhap_liet_doi_chieu_loi/')));
  assert(screens.filter(s => s.stateCode === 'P01').every(s => s.sourcePaths[0].includes('_P01_Default_')));
  assert.equal(screens.filter(s => s.stateCode === 'P16').length, 2);
  assert(!screens.some(s => s.stateCode === 'P20' || s.stateCode === 'P20F'));
  for (const old of profile.superseded) assert(screens.find(s => s.stateCode === 'P01' && s.device === old.device).aliases.includes(old.id));
  const register = JSON.parse(readFileSync(new URL('../baseline-register.json', import.meta.url)));
  const baselines = register.baselines.filter(b => b.group === profile.group);
  assert.equal(baselines.length, 2, 'Create Form Default is not an additional P01 baseline');
  assert(baselines.every(b => screens.find(s => s.id === b.screenId).stateCode === 'P01'));
});

test('the unavailable App PV state must remain explicitly declared, not hidden', () => {
  const manifest = clone();
  manifest.importProfiles.find(p => p.group === 'san_pham_app_pv').missingStates = [];
  assert.throws(() => assertDriveStateCoverage(manifest), /missing-state declaration/);
});

test('inbound receipt folders stay one group with 55 hash-pinned sources and old P01 viewer aliases', () => {
  const profile = JSON.parse(readFileSync(new URL('../tools/import-profiles/inbound-receipts-20260923.json', import.meta.url)));
  const screens = inventory.screens.filter(screen => screen.group === profile.group);
  assert.equal(screens.length, 55);
  assert.equal(new Set(screens.map(screen => screen.sha256)).size, 55);
  assert.equal(screens.filter(screen => screen.device === 'desktop').length, 27);
  assert.equal(screens.filter(screen => screen.device === 'tablet').length, 28);
  assert.equal(profile.excluded.length, 5);
  assert.deepEqual(profile.missingStates.map(item => `${item.code}/${item.devices[0]}`), ['P09/tablet', 'P10/desktop', 'P15/tablet', 'P20B/desktop', 'P20D/desktop']);
  for (const screen of screens) {
    const source = profile.files.find(file => file.path === screen.sourcePaths[0]);
    assert(source); assert.equal(screen.sha256, source.sha256);
    assert.equal(screen.groupTitle, 'Nhập kho · Danh sách phiếu nhập');
    assert.equal(screen.stage, 'review');
    assert.equal(screen.reviewStatus, 'approval-not-recorded');
    assert.equal(screen.sourceDesignStatus, screen.stateCode === 'P01' ? 'LOCKED' : 'REVIEW');
    assert.deepEqual(screen.sourceExport, source.sourceExport);
    assert(!profile.excluded.some(file => file.sha256 === screen.sha256));
    assert.equal(screen.width, screen.device === 'desktop' ? 1920 : 1600);
    assert.equal(screen.height, screen.device === 'desktop' ? 1080 : 2560);
  }
  assert.equal(profile.superseded.length, 2);
  for (const previous of profile.superseded) assert(screens.find(screen => screen.stateCode === 'P01' && screen.device === previous.device).aliases.includes(previous.id));
  assert(!screens.some(screen => screen.stateCode === 'P19A' || screen.stateCode === 'P20'));
  assert.equal(correctedGroup('HN_NhapKho_PhieuNhap_P20A_Saving_Desktop', 'nhap_kho/Desktop'), profile.group);
  for (const code of ['P09', 'P10', 'P15', 'P20B', 'P20D']) assert.equal(screens.filter(screen => screen.stateCode === code).length, 1);
});

test('inbound source gaps cannot hide loss of the valid counterpart or another device', () => {
  for (const code of ['P09', 'P10', 'P15', 'P20B', 'P20D', 'P16B']) {
    const manifest = clone();
    const source = manifest.screens.find(screen => screen.group === 'nhap_kho/danh_sach_phieu_nhap_kho' && screen.stateCode === code);
    manifest.screens = manifest.screens.filter(screen => screen.id !== source.id);
    recount(manifest);
    assert.throws(() => assertDriveStateCoverage(manifest), /state-code inventory|missing device counterpart/);
  }
  const manifest = clone();
  manifest.importProfiles.find(profile => profile.group === 'nhap_kho/danh_sach_phieu_nhap_kho').missingStates[0].devices = ['desktop', 'tablet'];
  assert.throws(() => assertDriveStateCoverage(manifest), /missing-state declaration/);
});

test('Bệnh Lỗi imports 55 original files, excludes the truncated Tablet, and retains REVIEW provenance', () => {
  const profile = JSON.parse(readFileSync(new URL('../tools/import-profiles/defect-catalog-20260923.json', import.meta.url)));
  const screens = inventory.screens.filter(screen => screen.group === profile.group);
  assert.equal(screens.length, 55);
  assert.equal(screens.filter(screen => screen.device === 'desktop').length, 28);
  assert.equal(screens.filter(screen => screen.device === 'tablet').length, 27);
  assert.equal(new Set(screens.map(screen => screen.sha256)).size, 55);
  assert.equal(profile.excluded.length, 3);
  const corrupt = profile.excluded.find(file => file.path.includes('P11F'));
  assert.equal(corrupt.sha256, '3e575392181077e9b6db85c2ef9ea686a4e455f82f1348a8f704f9815f815d2a');
  assert(!screens.some(screen => screen.sha256 === corrupt.sha256));
  for (const screen of screens) {
    assert.equal(screen.stage, 'review');
    assert.equal(screen.origin, 'workspace-update');
    assert.equal(screen.reviewStatus, 'approval-not-recorded');
    assert.equal(screen.groupTitle, 'Danh mục Bệnh Lỗi');
    assert.equal(screen.sourceVerification, 'local-export-verified-cloud-access-denied');
    assert(screen.fileName.startsWith('HN_DANH_MUC_BENH_LOI_P'));
    assert.equal(screen.sha256, profile.files.find(file => file.path === screen.sourcePaths[0]).sha256);
  }
  assert(screens.filter(screen => screen.stateCode === 'P01').every(screen => screen.sourcePaths[0].endsWith('_REVIEW_v5.0.png')));
  assert.deepEqual(screens.filter(screen => screen.stateCode === 'P11F').map(screen => screen.device), ['desktop']);
  const register = JSON.parse(readFileSync(new URL('../baseline-register.json', import.meta.url)));
  assert.equal(register.baselines.filter(item => item.group === profile.group).length, 2);
  assert(register.baselines.filter(item => item.group === profile.group).every(item => item.baselineStatus === 'reference-unverified'));
  assert.equal(correctedGroup('HN_DanhMuc_BenhLoi_P13B_ConcurrencyConflict_Tablet', 'danh_sach_SKU'), profile.group);
});

test('P11F Tablet source gap cannot hide a missing Desktop or another state', () => {
  for (const code of ['P11F', 'P13B']) {
    const manifest = clone();
    manifest.screens = manifest.screens.filter(screen => !(screen.group === 'danh_muc_benh_loi' && screen.stateCode === code && screen.device === 'desktop'));
    recount(manifest);
    assert.throws(() => assertDriveStateCoverage(manifest), /state-code inventory|missing device counterpart/);
  }
  const manifest = clone();
  manifest.importProfiles.find(profile => profile.group === 'danh_muc_benh_loi').missingStates[0].devices = ['desktop', 'tablet'];
  assert.throws(() => assertDriveStateCoverage(manifest), /missing-state declaration/);
});

test('corrupt Tablet cannot be silently published under an existing source-gap warning', () => {
  const manifest = clone();
  const desktop = manifest.screens.find(screen => screen.group === 'danh_muc_benh_loi' && screen.stateCode === 'P11F');
  manifest.screens.push({ ...desktop, id: 'unexpected-tablet', device: 'tablet' });
  recount(manifest);
  assert.throws(() => assertDriveStateCoverage(manifest), /remove the source-gap declaration/);
});

test('an additional missing App PV pair cannot be masked by the P20F exception', () => {
  const manifest = clone();
  manifest.screens = manifest.screens.filter(s => !(s.group === 'san_pham_app_pv' && s.stateCode === 'P20E'));
  recount(manifest);
  assert.throws(() => assertDriveStateCoverage(manifest), /state-code inventory/);
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
