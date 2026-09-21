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
  const device = /tablet/i.test(filename) || (!/desktop/i.test(filename) && metadata.height > metadata.width) ? 'tablet' : 'desktop';
  const extension = extname(filename).toLowerCase() === '.jpeg' ? '.jpg' : extname(filename).toLowerCase();
  const shortHash = item.sha256.slice(0, 10);
  const base = `${slug(filename.replace(extname(filename), ''))}-${shortHash}`;
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
  const stage = /candidate|review|chatgpt image|^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(filename.replace(extname(filename), '')) ? 'review' : 'delivery';
  const screen = {
    id: `drive-${groupSlug}-${slug(filename.replace(extname(filename), ''))}-${shortHash}`,
    title: displayTitle(filename), group, groupTitle, device, stage, src, thumb,
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
