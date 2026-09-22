import { access, mkdir, mkdtemp, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, extname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { correctedGroup, outboundTitle, stateIdentity, assertDriveStateCoverage } from './drive-state-policy.mjs';
import { applyBusinessRepair } from './apply-business-repair.mjs';
import { loadImportProfiles } from './import-profiles.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const reviewedOnly = args.includes('--reviewed-only');
const sourceRoot = resolve(args.find(arg => !arg.startsWith('--')) || resolve(root, '..'));
const outputRoot = resolve(root, 'previews', 'drive-screens');
const manifestPath = resolve(root, 'drive-screen-manifest.json');
const imageExtensions = new Set(['.png', '.jpg', '.jpeg']);
const previousManifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const supplements = JSON.parse(await readFile(resolve(root, 'design-supplements/manifest.json'), 'utf8'));
const repairPlan = JSON.parse(await readFile(resolve(root, 'design-source/business-v1/targets.json'), 'utf8'));
const profiles = await loadImportProfiles();
const profileGroups = new Set(profiles.map(profile => profile.group));
const curatedSources = new Map(profiles.flatMap(profile => profile.files.map(file => [file.path, { ...file, profile }])));
const importHistory = previousManifest.screens.map(screen => repairPlan.targets.find(t => t.collection === 'drive' && t.id === screen.id)?.original || screen);
const reviewedSources = new Map(importHistory.filter(screen => screen.origin !== 'ai-supplement' && !profileGroups.has(screen.group)).flatMap(screen => screen.sourcePaths.map(path => [path, screen.sha256])));

// Drive review exports sometimes arrive with UUID or timestamp-only filenames.
// Keep those names in sourcePaths for provenance, but publish a stable,
// state-oriented handoff name so developers can identify each screen quickly.
const semanticTitles = new Map(Object.entries({
  // Báo cáo bảo hành linh kiện · Desktop
  'b361a481-7f5c-497d-8be5-7a5db155a154': 'HN WARRANTY REPORT P01 DEFAULT',
  'ChatGPT Image 00_31_10 20 thg 9, 2026': 'HN WARRANTY REPORT P02 INITIAL LOADING',
  'de59bf31-b4df-49b2-99e7-7ca2a60d6a55': 'HN WARRANTY REPORT P03 REFRESHING',
  '3e39d484-a9db-4e43-b270-2cbe2783fa13': 'HN WARRANTY REPORT P04 EMPTY DATASET',
  '1a3923f5-c94d-4b78-a555-bc24787e6d54': 'HN WARRANTY REPORT P05 NO RESULT',
  '26da1537-ad39-44a9-b1b0-acb72ae0bb28': 'HN WARRANTY REPORT P06 DATA LOAD ERROR',
  'f0d314e4-3137-4586-bf64-de9511e2b9d6': 'HN WARRANTY REPORT P07 OFFLINE',
  '08def2e1-4306-4a4e-ba82-66efe2bb59ba': 'HN WARRANTY REPORT P08 PARTIAL DATA WARNING',
  '941fc679-8907-4d4c-8150-79da682070e9': 'HN WARRANTY REPORT P09 INVALID DATE RANGE',
  'a38e446c-dd3f-47c3-b9ae-90887db344d6': 'HN WARRANTY REPORT P10 EXPORT FAILED',
  'e9b63f6d-49dd-4400-983b-433fd5677f09': 'HN WARRANTY REPORT P11 EXPORTING',
  '748d901c-8965-4a8d-872a-c098b6b8ee1c': 'HN WARRANTY REPORT P12 EXPORT SUCCESS',

  // Báo cáo bảo hành linh kiện · Tablet
  '87171505-b091-4be1-a239-8dec0e510a64': 'HN WARRANTY REPORT P01 DEFAULT',
  '0b58db35-2a38-44a6-bd4f-08617d56d806': 'HN WARRANTY REPORT P02 INITIAL LOADING',
  '07dfa0c7-4002-4866-b8d8-a113e8513dcf': 'HN WARRANTY REPORT P03 REFRESHING',
  '393ba82f-63a2-44a5-9ee9-bac7adf7a262': 'HN WARRANTY REPORT P04 EMPTY DATASET',
  '7025288a-09f2-4896-967d-cd4785d82496': 'HN WARRANTY REPORT P05 NO RESULT',
  '86339f0f-98b7-4667-bf16-89fdda45b67e': 'HN WARRANTY REPORT P06 DATA LOAD ERROR',
  'e4073f27-5c34-4ed4-a91f-0b7ba6792523': 'HN WARRANTY REPORT P07 OFFLINE',
  '7b090fbe-c7bc-4e10-bd4d-666bebb53ae9': 'HN WARRANTY REPORT P08 PARTIAL DATA WARNING',
  '47e68033-7c8f-449e-8d5c-26b5b9747691': 'HN WARRANTY REPORT P09 INVALID DATE RANGE',
  '14137a16-d7a3-47e5-913b-a5831a20e945': 'HN WARRANTY REPORT P10 EXPORT FAILED',
  '26cc1a88-10d7-4853-b8e5-df6dd827462b': 'HN WARRANTY REPORT P11 EXPORTING',
  'cdc1a29a-30c5-4304-a927-35966efa6920': 'HN WARRANTY REPORT P12 EXPORT SUCCESS',

  // Các màn hình mặc định còn mang tên tạm từ Drive
  'ChatGPT Image 04_57_31 19 thg 9, 2026': 'HN NHAP LIEU DOI CHIEU LOI P01 DEFAULT',
  'ChatGPT Image 04_58_20 19 thg 9, 2026': 'HN NHAP LIEU DOI CHIEU LOI P01 DEFAULT',
  'c0e60604-46de-4c86-8062-07102254c5b8': 'HN BAO HANH PHIEU XUAT LINH KIEN P01 DEFAULT',
  '380a919c-f250-41a9-a0a4-124b37266cd4': 'HN BAO HANH PHIEU XUAT LINH KIEN P01 DEFAULT',
  '7c90d8df-35b2-4487-8916-a2dfc3b0aad0': 'HN NHAP KHO DANH SACH KHAY P01 DEFAULT',
  'c4f79217-2f12-4267-a547-cb12bdffc564': 'HN NHAP KHO DANH SACH KHAY P01 DEFAULT',
  '5e0a9134-a480-4767-9c79-7ea0780dd6b3': 'HN NHAP KHO HANG CHO XEP KHAY P01 DEFAULT',
  'd5476247-3e95-4ff4-a21e-42485797c8d5': 'HN NHAP KHO HANG CHO XEP KHAY P01 DEFAULT',
  'f148d5f6-70bd-4983-8c8a-86c24f4442dd': 'HN NHAP KHO LENH XEP KHAY P01 DEFAULT',
  '2f837b9a-264e-4949-a7cd-0c34d1851b36': 'HN NHAP KHO LENH XEP KHAY P01 DEFAULT',
  'b1518a5a-523a-4a76-b8cd-27ab0978a6c7': 'HN SAN PHAM APP PV P01 DEFAULT',
  '43d2840e-b658-4320-99a8-dc5e4c1131c5': 'HN SAN PHAM APP PV P01 DEFAULT'
}));

if (!outputRoot.startsWith(`${root}${sep}`)) throw new Error('Generated output must stay inside the repository.');
await access(sourceRoot);

const groupNames = new Map(Object.entries({
  'bao_cao_bao_hanh_linh_kien': 'Báo cáo bảo hành linh kiện',
  'bao_cao_lich_su_nhap_xuat_kho': 'Báo cáo lịch sử nhập xuất kho',
  'bao_cao_nhan_dong_goi_in_lai': 'Báo cáo nhãn đóng gói & in lại',
  'bao_cao_nhap_kho': 'Báo cáo nhập kho',
  'bao_cao_nhap_liet_doi_chieu_loi': 'Báo cáo nhập liệu, đối chiếu & lỗi dữ liệu',
  'bao_cao_truy_vet_hang_hoa': 'Báo cáo truy vết hàng hóa',
  'bao_cao_xuat_kho': 'Báo cáo xuất kho',
  'bao_cao_xuat_theo_nguoi_nhan_dai_ly': 'Báo cáo xuất theo người nhận/đại lý',
  'bao_hanh_sua_chua/ho_so_bao_hanh': 'Bảo hành sửa chữa · Hồ sơ bảo hành',
  'bao_hanh_sua_chua/phieu_xuat_linh_kien_bao_hanh': 'Bảo hành sửa chữa · Phiếu xuất linh kiện',
  'dang_nhap& phien_lam_viec/phien_lam_viec': 'Đăng nhập & phiên làm việc · Xác nhận phiên',
  'danh_muc_dai_ly_noi_nhan': 'Danh mục đại lý/nơi nhận',
  'danh_muc_san_pham': 'Danh mục sản phẩm',
  'danh_sach_SKU': 'Danh sách SKU',
  'nhap_kho/danh_sach_phieu_nhap_kho': 'Nhập kho · Danh sách phiếu nhập',
  'nhap_kho/linh_kien_cho_xep_khay/danh_sach_khay': 'Nhập kho · Danh sách khay',
  'nhap_kho/linh_kien_cho_xep_khay/hang_cho': 'Nhập kho · Hàng chờ xếp khay',
  'nhap_kho/linh_kien_cho_xep_khay/lenh_xep_khay': 'Nhập kho · Lệnh xếp khay',
  'san_pham_app_pv': 'Sản phẩm trên App PV',
  'ton_kho&doi_soat': 'Tồn kho & đối soát',
  'xuat_kho': 'Xuất kho · Phiếu xuất kho'
}));

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (path === root) continue;
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
}

function slash(path) { return path.split(sep).join('/'); }
function slug(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 110) || 'screen';
}
function displayTitle(filename) {
  return filename.replace(extname(filename), '')
    .replace(/[_-](desktop|tablet)[_-]\d{3,4}x\d{3,4}.*$/i, '')
    .replace(/[_-](desktop|tablet).*$/i, '')
    .replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

const allFiles = (await walk(sourceRoot)).filter(path => !path.startsWith(`${root}${sep}`));
const candidates = allFiles.filter(path => imageExtensions.has(extname(path).toLowerCase()));
const relativeCandidates = candidates.map(path => ({ path, relativePath: slash(relative(sourceRoot, path)) }));
const updateTopLevels = new Set(relativeCandidates.filter(({ relativePath }) => {
  const parts = relativePath.split('/');
  return parts.length > 2 && /^update\d*$/i.test(parts[1]);
}).map(({ relativePath }) => relativePath.split('/')[0]));

const selected = relativeCandidates.filter(({ relativePath }) => {
  // Exact, hash-pinned profile wins over folder location and temporary filenames.
  // Other files in a curated module are not silently included on re-import.
  if (curatedSources.has(relativePath)) return true;
  if (profiles.some(profile => relativePath.startsWith(`${profile.sourceDirectory}/`))) return false;
  // Scoped repairs must not ingest other design work arriving in the shared
  // Drive export while this import is running.
  if (reviewedOnly) return reviewedSources.has(relativePath);
  const parts = relativePath.split('/');
  if (parts.length === 1) return false;
  if (relativePath.startsWith('dang_nhap& phien_lam_viec/dang_nhap/update2/')) return false;
  if (relativePath.startsWith('tong_quan/update/')) return false;
  if (parts.length === 2 && updateTopLevels.has(parts[0])) return false;
  return true;
}).sort((a, b) => a.relativePath.localeCompare(b.relativePath, 'vi', { numeric: true }));
for (const [path, curated] of curatedSources) {
  const item = selected.find(item => item.relativePath === path);
  if (!item) throw new Error(`Curated source missing: ${path}`);
  item.curated = curated;
}
if (reviewedOnly) {
  const available = new Set(selected.map(item => item.relativePath));
  for (const path of reviewedSources.keys()) if (!available.has(path)) throw new Error(`Reviewed source missing: ${path}`);
}

// Supplemental artwork is versioned inside the repo, separately from Drive.
// It survives every re-import and is never represented as approved source art.
for (const item of supplements.screens) {
  const path = resolve(root, 'design-supplements', item.file);
  if (!path.startsWith(`${resolve(root, 'design-supplements')}${sep}`)) throw new Error('Invalid supplement path');
  await access(path);
  selected.push({ path, relativePath: `design-supplements/${item.file}`, supplement: item });
}

// Build in isolation. A corrupt source must not erase the working gallery.
await mkdir(resolve(root, 'artifacts'), { recursive: true });
const staging = await mkdtemp(resolve(root, 'artifacts/drive-import-'));

const byHash = new Map();
for (const item of selected) {
  const sha256 = createHash('sha256').update(await readFile(item.path)).digest('hex');
  if (item.curated && item.curated.sha256 !== sha256) throw new Error(`Curated source changed; inspect before updating the profile: ${item.relativePath}`);
  if (reviewedOnly && !item.supplement && !item.curated && reviewedSources.get(item.relativePath) !== sha256) throw new Error(`Reviewed source changed: ${item.relativePath}`);
  if (byHash.has(sha256)) {
    byHash.get(sha256).sourcePaths.push(item.relativePath);
    continue;
  }
  byHash.set(sha256, { ...item, sha256, sourcePaths: [item.relativePath] });
}

async function mapConcurrent(items, limit, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

const screens = await mapConcurrent([...byHash.values()], 8, async item => {
  const sourceBytes = await readFile(item.path);
  if (createHash('sha256').update(sourceBytes).digest('hex') !== item.sha256) throw new Error(`Source changed during import: ${item.relativePath}`);
  const metadata = await sharp(sourceBytes).metadata();
  if (!metadata.width || !metadata.height) throw new Error(`Missing dimensions: ${item.relativePath}`);
  const parts = item.relativePath.split('/');
  const groupParts = parts.slice(0, -1).filter(part => !/^update\d*$/i.test(part));
  const filename = parts.at(-1);
  const sourceStem = filename.replace(extname(filename), '');
  const group = item.curated?.profile.group || item.supplement?.group || correctedGroup(sourceStem, groupParts.join('/'));
  const groupTitle = groupNames.get(group) || group.replace(/[_&]+/g, ' ').replace(/\s+/g, ' ').trim();
  const semanticTitle = item.curated?.title || item.supplement?.title || semanticTitles.get(sourceStem) || outboundTitle(sourceStem, group);
  const device = item.curated?.device || item.supplement?.device || (/tablet/i.test(filename) || (!/desktop/i.test(filename) && metadata.height > metadata.width) ? 'tablet' : 'desktop');
  const extension = extname(filename).toLowerCase() === '.jpeg' ? '.jpg' : extname(filename).toLowerCase();
  const shortHash = item.sha256.slice(0, 10);
  const stage = item.curated || item.supplement || /candidate|review|chatgpt image|^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(sourceStem) ? 'review' : 'delivery';
  const handoffStem = semanticTitle
    ? `${semanticTitle.replace(/\s+/g, '_')}_${device.toUpperCase()}_${metadata.width}x${metadata.height}_${stage.toUpperCase()}`
    : sourceStem;
  const base = `${slug(handoffStem)}-${shortHash}`;
  const groupSlug = slug(group);
  const src = `previews/drive-screens/originals/${groupSlug}/${device}/${base}${extension}`;
  const thumb = `previews/drive-screens/thumbs/${groupSlug}/${device}/${base}.webp`;
  const srcPath = resolve(staging, relative(outputRoot, resolve(root, src)));
  const thumbPath = resolve(staging, relative(outputRoot, resolve(root, thumb)));
  await mkdir(dirname(srcPath), { recursive: true });
  await mkdir(dirname(thumbPath), { recursive: true });
  await writeFile(srcPath, sourceBytes);
  const thumbInfo = await sharp(sourceBytes).resize({ width: 900, height: 900, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 76, effort: 2 }).toFile(thumbPath).catch(error => { throw new Error(`Cannot decode ${item.relativePath}: ${error.message}`); });
  const screen = {
    id: `drive-${groupSlug}-${slug(handoffStem)}-${shortHash}`,
    title: semanticTitle || displayTitle(filename),
    fileName: `${handoffStem}${extension}`,
    group, groupTitle, device, stage, src, thumb,
    width: metadata.width, height: metadata.height,
    thumbWidth: thumbInfo.width, thumbHeight: thumbInfo.height,
    sha256: item.sha256, sourcePaths: item.sourcePaths
  };
  const state = stateIdentity(screen.title);
  if (state) { screen.stateCode = state.code; screen.stateName = state.name; }
  if (item.curated) {
    if (metadata.width !== item.curated.width || metadata.height !== item.curated.height) throw new Error(`Curated dimensions changed: ${item.relativePath}`);
    screen.origin = 'workspace-update';
    screen.reviewStatus = 'approval-not-recorded';
    screen.importProfile = item.curated.profile.id;
    screen.sourceVerification = 'local-export-verified-cloud-access-denied';
    screen.requestedDriveFolder = item.curated.profile.requestedDriveFolder;
    screen.updatedAt = item.curated.profile.updatedAt;
  }
  if (item.supplement) {
    screen.origin = 'ai-supplement';
    screen.reviewStatus = 'needs-owner-review';
    screen.designReferences = item.supplement.references;
    screen.promptId = item.supplement.promptId;
  }
  // Preserve shared viewer links across renames/regrouping, by immutable bytes.
  const previous = importHistory.find(candidate => candidate.sha256 === item.sha256);
  const superseded = item.curated && screen.stateCode === 'P01' ? item.curated.profile.superseded.filter(s => s.device === screen.device).map(s => s.id) : [];
  const aliases = [...new Set([...(previous?.aliases || []), ...(previous && previous.id !== screen.id ? [previous.id] : []), ...superseded])].filter(id => id !== screen.id);
  if (aliases.length) screen.aliases = aliases;
  return screen;
});

screens.sort((a, b) => a.groupTitle.localeCompare(b.groupTitle, 'vi') || (a.device === b.device ? 0 : a.device === 'desktop' ? -1 : 1) || a.title.localeCompare(b.title, 'vi', { numeric: true }));
const groups = [...new Map(screens.map(screen => [screen.group, screen.groupTitle])).entries()].map(([id, title]) => ({
  id, title,
  count: screens.filter(screen => screen.group === id).length,
  desktop: screens.filter(screen => screen.group === id && screen.device === 'desktop').length,
  tablet: screens.filter(screen => screen.group === id && screen.device === 'tablet').length
})).sort((a, b) => a.title.localeCompare(b.title, 'vi'));
const manifest = {
  version: 1,
  importedAt: '2026-09-22',
  updatedAt: profiles.map(profile => profile.updatedAt).sort().at(-1),
  provenance: 'Drive workspace export supplied by the repository owner; AI supplements are explicitly marked for owner review',
  exclusions: ['AUTH-01 and Tổng quan assets already present in the primary gallery', 'top-level duplicate baselines when an update set exists', 'non-image files and root asset.png'],
  total: screens.length,
  groups,
  screens
};
manifest.importProfiles = profiles.map(({ id, group, updatedAt, sourceVerification, missingStates }) => ({ id, group, updatedAt, sourceVerification, ...(missingStates ? { missingStates } : {}) }));
assertDriveStateCoverage(manifest);
const backup = `${staging}-previous`;
const stagedManifest = `${staging}-manifest.json`;
await writeFile(stagedManifest, `${JSON.stringify(manifest, null, 2)}\n`);
await rename(outputRoot, backup);
let installed = false;
try {
  await rename(staging, outputRoot); installed = true;
  await rename(stagedManifest, manifestPath);
} catch (error) {
  if (installed) await rename(outputRoot, staging);
  await rename(backup, outputRoot);
  throw error;
}
console.log(`Imported ${screens.length} unique Drive screens across ${groups.length} groups.`);
await applyBusinessRepair({ driveOnly: true });
