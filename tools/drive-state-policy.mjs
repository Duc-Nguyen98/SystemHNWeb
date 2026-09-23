import assert from 'node:assert/strict';

// Pxx belongs to its module, not to a global state vocabulary.
// Groups with <= 3 images are intentionally unfinished and exempt from coverage.
const range = count => Array.from({ length: count }, (_, index) => `P${String(index + 1).padStart(2, '0')}`);
export const expectedCodes = {
  bao_cao_bao_hanh_linh_kien: range(15),
  bao_cao_lich_su_nhap_xuat_kho: range(20),
  bao_cao_nhan_dong_goi_in_lai: range(20).map(code => code === 'P08' ? 'P08A' : code),
  bao_cao_nhap_liet_doi_chieu_loi: range(20),
  bao_cao_truy_vet_hang_hoa: range(20),
  bao_cao_xuat_kho: range(9),
  bao_cao_xuat_theo_nguoi_nhan_dai_ly: range(20),
  danh_muc_benh_loi: [...range(20), ...'ABCDEF'.split('').map(suffix => `P11${suffix}`), 'P13A', 'P13B'],
  danh_muc_san_pham: range(20),
  danh_sach_SKU: range(20),
  san_pham_app_pv: [...range(19), ...'ABCDEF'.split('').map(suffix => `P20${suffix}`)],
  'ton_kho&doi_soat': range(14)
};

const legacyStates = {
  bao_cao_nhap_kho: ['DEFAULT', 'EMPTY', 'ERROR', 'INVALID DATE', 'LOADING', 'NO SEARCH', 'READONLY', 'ROW HIGHLIGHT', 'SUCCESS UPDATE'],
  'dang_nhap& phien_lam_viec/phien_lam_viec': ['ACCESS DENIED', 'ACCOUNT UNAVAILABLE', 'CHECKING SESSION', 'CONFIRMATION FAILED', 'CONTEXT LOAD ERROR', 'DEFAULT', 'ENTERING SYSTEM', 'OFFLINE BEFORE SUBMIT', 'OUTCOME UNKNOWN', 'SESSION EXPIRED', 'WAREHOUSE SUSPENDED']
};

const moduleFamilies = [
  [/^HN[ _-]+(?:DanhMuc|DANH[ _-]+MUC)[ _-]+(?:BenhLoi|BENH[ _-]+LOI)[ _-]/i, 'danh_muc_benh_loi'],
  [/^HN[ _-]+APP[ _-]?PV[ _-]/i, 'san_pham_app_pv'],
  [/^HN[ _-]+DATA[ _-]+RECON[ _-]+REPORT[ _-]/i, 'bao_cao_nhap_liet_doi_chieu_loi'],
  [/^HN[ _-]+PKG[ _-]+LABEL[ _-]/i, 'bao_cao_nhan_dong_goi_in_lai'],
  [/^HN[ _-]+DEALER[ _-]+RECIPIENT[ _-]+REPORT[ _-]/i, 'bao_cao_xuat_theo_nguoi_nhan_dai_ly'],
  [/^HN[ _-]+BaoCao[ _-]+LichSuNhapXuatKho[ _-]/i, 'bao_cao_lich_su_nhap_xuat_kho'],
  [/^HN[ _-]+TRACE[ _-]+REPORT[ _-]/i, 'bao_cao_truy_vet_hang_hoa'],
  [/^HN[ _-]+DanhMuc[ _-]+DanhSachSKU[ _-]/i, 'danh_sach_SKU']
];

export function correctedGroup(sourceStem, fallback) {
  return moduleFamilies.find(([pattern]) => pattern.test(sourceStem))?.[1] || fallback;
}

// New stable IDs for the nine existing outbound-report states, paired by content.
// The misleading 'golden-export...warning-repaired' image visibly contains the
// same report-refresh success toast as the tablet success-update image.
const outboundStates = [
  [/^(?:hoa-nam-)?bao-cao-xuat-kho-default-/, 'P01 DEFAULT'],
  [/^hoa-nam-bao-cao-xuat-kho-loading-/, 'P02 LOADING'],
  [/^hoa-nam-bao-cao-xuat-kho-(?:emty|empty)-/, 'P03 EMPTY'],
  [/^hoa-nam-bao-cao-xuat-kho-error-/, 'P04 ERROR'],
  [/^hoa-nam-bao-cao-xuat-kho-invalid-date-range-/, 'P05 INVALID DATE RANGE'],
  [/^hoa-nam-bao-cao-xuat-kho-no-search-result-/, 'P06 NO SEARCH RESULT'],
  [/^hoa-nam-bao-cao-xuat-kho-readonly-/, 'P07 READONLY'],
  [/^hoa-nam-bao-cao-xuat-kho-row-highlight-/, 'P08 ROW HIGHLIGHT'],
  [/^hoa-nam-bao-cao-xuat-kho-success-update-|^hoa-nam-golden-export-desktop-warning-repaired$/, 'P09 SUCCESS UPDATE']
];

export function outboundTitle(sourceStem, group) {
  if (group !== 'bao_cao_xuat_kho') return undefined;
  const state = outboundStates.find(([pattern]) => pattern.test(sourceStem))?.[1];
  return state && `HN BAO CAO XUAT KHO ${state}`;
}

export function stateIdentity(title) {
  const match = title.match(/\b(P\d{2}[A-Z]?)\s+(.+)$/i);
  if (match) return { code: match[1].toUpperCase(), name: match[2].replace(/([a-z])([A-Z])/g, '$1 $2').toUpperCase().replace(/[ _-]+/g, ' ').trim() };
  const legacy = title.match(/^(?:WMS HOA NAM RPT 01|AUTH 02)\s+(.+)$/i);
  return legacy ? { code: null, name: legacy[1].toUpperCase() } : null;
}

export function assertDriveStateCoverage(manifest) {
  let checkedGroups = 0, checkedScreens = 0, exemptGroups = 0, knownMissingStates = 0;
  // Documented source gap only; do not turn arbitrary missing states into passes.
  const allowedSourceGaps = {
    san_pham_app_pv: [{ code: 'P20F', devices: ['desktop', 'tablet'], status: 'source-not-found' }],
    danh_muc_benh_loi: [{ code: 'P11F', devices: ['tablet'], status: 'source-corrupt' }]
  };
  for (const id of [...Object.keys(expectedCodes), ...Object.keys(legacyStates)]) assert(manifest.groups.some(group => group.id === id), `${id}: reviewed module missing`);
  for (const group of manifest.groups) {
    const screens = manifest.screens.filter(screen => screen.group === group.id);
    assert.equal(group.count, screens.length, `${group.id}: incorrect count`);
    for (const device of ['desktop', 'tablet']) assert.equal(group[device], screens.filter(screen => screen.device === device).length, `${group.id}: incorrect ${device} count`);
    if (screens.length <= 3) { exemptGroups++; continue; }
    checkedGroups++; checkedScreens += screens.length;
    const states = new Map();
    for (const screen of screens) {
      assert.equal(correctedGroup(screen.title, screen.group), screen.group, `${screen.title}: wrong module`);
      const state = stateIdentity(screen.title);
      assert(state?.name, `${screen.title}: missing semantic state`);
      if (expectedCodes[group.id]) assert(state.code, `${screen.title}: missing Pxx code`);
      const key = state.code || state.name;
      const entry = states.get(key) || { name: state.name, devices: new Set() };
      assert.equal(entry.name, state.name, `${group.id}/${key}: conflicting state labels`);
      assert(!entry.devices.has(screen.device), `${group.id}/${key}: duplicate ${screen.device}`);
      entry.devices.add(screen.device); states.set(key, entry);
    }
    const missing = manifest.importProfiles?.find(profile => profile.group === group.id)?.missingStates || [];
    if (expectedCodes[group.id]) {
      const declarations = missing.map(({ code, devices, status }) => ({ code, devices: [...devices].sort(), status })).sort((a, b) => a.code.localeCompare(b.code));
      assert.deepEqual(declarations, allowedSourceGaps[group.id] || [], `${group.id}: undocumented or stale missing-state declaration`);
      for (const item of missing) {
        assert(item.reason && item.label, `${group.id}/${item.code}: source-gap explanation required`);
        for (const device of item.devices) assert(!states.get(item.code)?.devices.has(device), `${group.id}/${item.code}/${device}: remove the source-gap declaration after supplying this image`);
      }
      knownMissingStates += missing.length;
      const fullyMissingCodes = missing.filter(item => item.devices.length === 2).map(item => item.code);
      assert.deepEqual([...states.keys()].sort(), expectedCodes[group.id].filter(code => !fullyMissingCodes.includes(code)).sort(), `${group.id}: state-code inventory differs from reviewed contract`);
    }
    for (const [key, state] of states) {
      const missingDevices = missing.find(item => item.code === key)?.devices || [];
      assert.deepEqual([...state.devices].sort(), ['desktop', 'tablet'].filter(device => !missingDevices.includes(device)), `${group.id}/${key}: missing device counterpart`);
    }
    if (legacyStates[group.id]) assert.deepEqual([...states.keys()].sort(), [...legacyStates[group.id]].sort(), `${group.id}: named-state inventory differs from reviewed contract`);
  }
  return { checkedGroups, checkedScreens, exemptGroups, knownMissingStates };
}
