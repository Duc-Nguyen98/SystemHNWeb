// One-time import review: compare actual bytes to the supplied export manifest.
import { access, readFile, writeFile, readdir, mkdir, copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import sharp from 'sharp';
const group = 'nhap_kho/danh_sach_phieu_nhap_kho', id = 'inbound-receipts-20260923';
const output = `tools/import-profiles/${id}.json`;
try { await access(output); throw new Error('Profile exists; inspect new sources rather than regenerate hashes.'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function parseCsv(text) {
  const rows = []; let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') { if (quoted && text[i + 1] === '"') { field += '"'; i++; } else quoted = !quoted; }
    else if (!quoted && (c === ',' || c === '\n')) { row.push(field.replace(/\r$/, '')); field = ''; if (c === '\n') { rows.push(row); row = []; } }
    else field += c;
  }
  assert(!quoted, 'Unclosed CSV quote');
  if (field || row.length) { row.push(field.replace(/\r$/, '')); rows.push(row); }
  const header = rows.shift();
  return rows.filter(row => row.some(Boolean)).map(row => { assert.equal(row.length, header.length); return Object.fromEntries(header.map((key, i) => [key, row[i]])); });
}
const manifestPath = `${group}/HN_NhapKho_PhieuNhap_Manifest_REVIEW_v1.0.csv`;
const manifestBytes = await readFile(resolve('..', manifestPath));
const rows = parseCsv(manifestBytes.toString().replace(/^\uFEFF/, ''));
assert.equal(rows.length, 60);
const actualPaths = [];
for (const device of ['Desktop', 'Tablet']) for (const name of await readdir(resolve('..', group, device))) actualPaths.push(`${device}/${name}`);
assert.deepEqual(actualPaths.sort(), rows.map(row => row.file).sort(), 'Folders must match all documented source filenames');
const corrupt = {
  'P09/tablet': 'f9d4cf9ae7b269c6f370b7894785d46366f24afe4cd5aa5e57647fe417e26a85',
  'P10/desktop': '3f24996ac81a704a635f6db333a5bea0f8f92cd2c75e68dec1717b4f15a1a88a',
  'P15/tablet': 'eb73387f1c9d79a321c1a599f66519829f50867cf5ef505aa801c7711305a756',
  'P20B/desktop': '0ef2d183ca02110be6953678acb7a2f0b68bc545ff997d9553f80b7f4c5cd414',
  'P20D/desktop': '607eab281d169235dace5da04a23b8cb4ee041e144cf012aae1362615096035a'
};
const files = [], excluded = [], missingStates = [];
for (const row of rows) {
  const path = `${group}/${row.file}`, bytes = await readFile(resolve('..', path));
  const sha256 = hash(bytes), device = row.device.toLowerCase(), key = `${row.state}/${device}`;
  const match = row.file.match(/HN_NhapKho_PhieuNhap_(P\d{2}[A-Z]?)_(.+)_(Desktop|Tablet)_(\d+)x(\d+)_(LOCKED|REVIEW)_v1\.0\.png$/);
  assert(match, row.file); assert.equal(match[1], row.state); assert.equal(match[3], row.device); assert.equal(match[6], row.status);
  const stateName = match[2].replace(/([a-z])([A-Z])/g, '$1 $2').toUpperCase();
  if (corrupt[key]) {
    assert.equal(sha256, corrupt[key], `Previously corrupt file changed; inspect ${key}`);
    await assert.rejects(sharp(bytes).raw().toBuffer(), /libpng read error/);
    assert(bytes.length < Number(row.bytes)); assert.notEqual(sha256, row.sha256);
    excluded.push({ path, sha256, bytes: bytes.length, expectedSha256: row.sha256, expectedBytes: Number(row.bytes), reason: 'Truncated PNG; full decode fails and bytes/hash do not match the supplied export manifest. Original retained unchanged.' });
    missingStates.push({ code: row.state, label: stateName, devices: [device], status: 'source-corrupt', reason: `File ${row.device} bị cắt dữ liệu PNG, không khớp dung lượng/hash trong manifest nguồn; cần cung cấp lại file nguyên vẹn.` });
    continue;
  }
  assert.equal(sha256, row.sha256, `Source hash mismatch: ${path}`); assert.equal(bytes.length, Number(row.bytes));
  const { info } = await sharp(bytes).raw().toBuffer({ resolveWithObject: true });
  assert.equal(info.width, Number(row.width)); assert.equal(info.height, Number(row.height));
  assert.equal(info.width, device === 'desktop' ? 1920 : 1600); assert.equal(info.height, device === 'desktop' ? 1080 : 2560);
  files.push({ path, sha256, title: `HN NHAP KHO PHIEU NHAP ${row.state} ${stateName}`, device, width: info.width, height: info.height,
    sourceDesignStatus: row.status, sourceExport: { nativeWidth: Number(row.native_width), nativeHeight: Number(row.native_height), method: row.export_method } });
}
assert.equal(files.length, 55); assert.equal(new Set(files.map(file => file.sha256)).size, 55); assert.equal(excluded.length, 5);
const current = JSON.parse(await readFile('drive-screen-manifest.json', 'utf8')), superseded = [];
await mkdir(`design-archive/${id}`, { recursive: true });
for (const screen of current.screens.filter(screen => screen.group === group)) {
  assert.equal(hash(await readFile(screen.src)), screen.sha256);
  const archive = `design-archive/${id}/${screen.device}-${screen.sha256}.png`;
  await copyFile(screen.src, archive); superseded.push({ id: screen.id, device: screen.device, sha256: screen.sha256, archive });
}
assert.equal(superseded.length, 2);
const sourceDocuments = [];
for (const name of ['HN_NhapKho_PhieuNhap_Manifest_REVIEW_v1.0.csv', 'HN_NhapKho_PhieuNhap_MaTran_QA_REVIEW_v1.0.md', 'HN_NhapKho_PhieuNhap_Prompts_REVIEW_v1.0.md']) {
  const path = `${group}/${name}`; sourceDocuments.push({ path, sha256: hash(await readFile(resolve('..', path))) });
}
const profile = { version: 1, id, group, groupTitle: 'Nhập kho · Danh sách phiếu nhập', updatedAt: '2026-09-23', sourceDirectory: group,
  requestedDriveFolder: 'https://drive.google.com/drive/folders/1Ii8cm1XID8eFTiD1lF6VGmpTVkxbyNqY',
  sourceVerification: 'Local Desktop/Tablet export verified against supplied CSV hashes; requested Drive folder denied access. No cloud listing/download comparison was possible.',
  artPolicy: 'Import unchanged exported pixels. P01 is labeled LOCKED in the source document; no new approval is inferred here. Other states are REVIEW. Source manifest discloses raster resizing before delivery; this import performs no upscaling. Exclude five truncated files and retain old P01 archives and viewer aliases.',
  sourceDocuments, missingStates: missingStates.sort((a, b) => a.code.localeCompare(b.code)),
  files: files.sort((a, b) => a.title.localeCompare(b.title, 'en', { numeric: true }) || a.device.localeCompare(b.device)), excluded, superseded };
await writeFile(output, JSON.stringify(profile, null, 2) + '\n');
console.log('Pinned 55 manifest-matching originals: 27 Desktop / 28 Tablet; excluded 5 truncated PNGs; archived 2 old baselines.');
