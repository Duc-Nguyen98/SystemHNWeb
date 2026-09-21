import { access, copyFile, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { basename, dirname, extname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = resolve(process.argv[2] || resolve(root, '..'));
const outputRoot = resolve(root, 'previews', 'drive-screens');
const manifestPath = resolve(root, 'drive-screen-manifest.json');
const imageExtensions = new Set(['.png', '.jpg', '.jpeg']);

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
  'bao_cao_nhap_liet_doi_chieu_loi': 'Báo cáo nhập liệu & đối chiếu lỗi',
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
  'san_pham_app_pv': 'Sản phẩm App PV',
  'ton_kho&doi_soat': 'Tồn kho & đối soát',
  'xuat_kho': 'Xuất kho · Phiếu xuất kho'
}));

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
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
  const parts = relativePath.split('/');
  if (parts.length === 1) return false;
  if (relativePath.startsWith('dang_nhap& phien_lam_viec/dang_nhap/update2/')) return false;
  if (relativePath.startsWith('tong_quan/update/')) return false;
  if (parts.length === 2 && updateTopLevels.has(parts[0])) return false;
  return true;
}).sort((a, b) => a.relativePath.localeCompare(b.relativePath, 'vi', { numeric: true }));

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });

const byHash = new Map();
for (const item of selected) {
  const sha256 = createHash('sha256').update(await readFile(item.path)).digest('hex');
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
  const metadata = await sharp(item.path).metadata();
  if (!metadata.width || !metadata.height) throw new Error(`Missing dimensions: ${item.relativePath}`);
  const parts = item.relativePath.split('/');
  const groupParts = parts.slice(0, -1).filter(part => !/^update\d*$/i.test(part));
  const group = groupParts.join('/');
  const groupTitle = groupNames.get(group) || group.replace(/[_&]+/g, ' ').replace(/\s+/g, ' ').trim();
  const filename = parts.at(-1);
  const sourceStem = filename.replace(extname(filename), '');
  const semanticTitle = semanticTitles.get(sourceStem);
  const device = /tablet/i.test(filename) || (!/desktop/i.test(filename) && metadata.height > metadata.width) ? 'tablet' : 'desktop';
  const extension = extname(filename).toLowerCase() === '.jpeg' ? '.jpg' : extname(filename).toLowerCase();
  const shortHash = item.sha256.slice(0, 10);
  const stage = /candidate|review|chatgpt image|^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(sourceStem) ? 'review' : 'delivery';
  const handoffStem = semanticTitle
    ? `${semanticTitle.replace(/\s+/g, '_')}_${device.toUpperCase()}_${metadata.width}x${metadata.height}_${stage.toUpperCase()}`
    : sourceStem;
  const base = `${slug(handoffStem)}-${shortHash}`;
  const groupSlug = slug(group);
  const src = `previews/drive-screens/originals/${groupSlug}/${device}/${base}${extension}`;
  const thumb = `previews/drive-screens/thumbs/${groupSlug}/${device}/${base}.webp`;
  const srcPath = resolve(root, src);
  const thumbPath = resolve(root, thumb);
  await mkdir(dirname(srcPath), { recursive: true });
  await mkdir(dirname(thumbPath), { recursive: true });
  await copyFile(item.path, srcPath);
  const thumbInfo = await sharp(item.path).resize({ width: 900, height: 900, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 76, effort: 2 }).toFile(thumbPath);
  const screen = {
    id: `drive-${groupSlug}-${slug(handoffStem)}-${shortHash}`,
    title: semanticTitle || displayTitle(filename),
    fileName: `${handoffStem}${extension}`,
    group, groupTitle, device, stage, src, thumb,
    width: metadata.width, height: metadata.height,
    thumbWidth: thumbInfo.width, thumbHeight: thumbInfo.height,
    sha256: item.sha256, sourcePaths: item.sourcePaths
  };
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
  provenance: 'Drive workspace export supplied by the repository owner',
  exclusions: ['AUTH-01 and Tổng quan assets already present in the primary gallery', 'top-level duplicate baselines when an update set exists', 'non-image files and root asset.png'],
  total: screens.length,
  groups,
  screens
};
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Imported ${screens.length} unique Drive screens across ${groups.length} groups.`);
