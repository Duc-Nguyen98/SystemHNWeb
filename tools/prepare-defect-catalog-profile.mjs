// One-time review record; never refresh pinned hashes without inspecting new sources.
import { readFile, writeFile, readdir, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import sharp from 'sharp';
const group = 'danh_muc_benh_loi', directory = `${group}/update`;
const output = 'tools/import-profiles/defect-catalog-20260923.json';
try { await access(output); throw new Error('Profile exists; inspect changes instead of regenerating hashes.'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const documentPath = `${group}/HN_DANH_MUC_BENH_LOI_BASELINE_STATE_PROMPTS_v1.0.md`;
const document = await readFile(resolve('..', documentPath));
const names = (await readdir(resolve('..', directory))).sort();
const documented = [...new Set(document.toString().match(/HN_DanhMuc_BenhLoi_P\d{2}[A-Z]?_[\w.]+\.png/g))].sort();
assert.deepEqual(names, documented, 'Workspace must match the 56 documented state/device filenames');
assert.equal(names.length, 56);
const files = [], excluded = [];
const corruptName = 'HN_DanhMuc_BenhLoi_P11F_OpenFormFailed_Tablet_1600x2560_REVIEW_v1.0.png';
const corruptHash = '3e575392181077e9b6db85c2ef9ea686a4e455f82f1348a8f704f9815f815d2a';
for (const name of names) {
  const path = `${directory}/${name}`, bytes = await readFile(resolve('..', path)), sha256 = digest(bytes);
  if (name === corruptName) {
    assert.equal(sha256, corruptHash, 'Corrupt source changed; inspect whether it has been repaired');
    await assert.rejects(sharp(bytes).raw().toBuffer(), /libpng read error/);
    excluded.push({ path, sha256, reason: 'Truncated PNG: incomplete IDAT data and no IEND chunk; full PNG decode fails. Preserve source, do not upload or fabricate replacement.' });
    continue;
  }
  const match = name.match(/^HN_DanhMuc_BenhLoi_(P\d{2}[A-Z]?)_(.+)_(Desktop|Tablet)_(\d+)x(\d+)_REVIEW_v([\d.]+)\.png$/);
  assert(match, `Unclassified source: ${name}`);
  const { info } = await sharp(bytes).raw().toBuffer({ resolveWithObject: true });
  const device = match[3].toLowerCase();
  assert.equal(info.width, device === 'desktop' ? 1920 : 1600);
  assert.equal(info.height, device === 'desktop' ? 1080 : 2560);
  const state = match[2].replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' ').toUpperCase();
  files.push({ path, sha256, title: `HN DANH MUC BENH LOI ${match[1]} ${state}`, device, width: info.width, height: info.height });
  if (match[1] === 'P01') {
    const duplicatePath = `${group}/${name}`;
    assert.equal(digest(await readFile(resolve('..', duplicatePath))), sha256);
    excluded.push({ path: duplicatePath, sha256, reason: 'Byte-identical top-level P01 duplicate; use the update folder only.' });
  }
}
assert.equal(files.length, 55);
assert.equal(new Set(files.map(file => file.sha256)).size, 55);
const profile = {
  version: 1, id: 'defect-catalog-20260923', group, groupTitle: 'Danh mục Bệnh Lỗi', updatedAt: '2026-09-23', sourceDirectory: group,
  requestedDriveFolder: 'https://drive.google.com/drive/folders/1XSHFE3v9aF56qHGbEb8UGJFQhAsxz2SU',
  sourceVerification: 'Local workspace export verified; requested Google Drive folder denied access in current browser session. No cloud listing/download comparison was possible.',
  sourceDocument: { path: documentPath, sha256: digest(document), status: 'REVIEW; baseline, fixture and backend contracts not approved' },
  artPolicy: 'Import valid supplied images unchanged; keep P01 REVIEW v5.0 and other states REVIEW v1.0. Do not synthesize, upscale, or infer approval. Exclude truncated P11F Tablet.',
  missingStates: [{ code: 'P11F', label: 'OPEN FORM FAILED', devices: ['tablet'], status: 'source-corrupt', reason: 'Ảnh P11F Tablet trong bản xuất trên máy bị cắt dữ liệu PNG; cần cung cấp lại file nguyên vẹn. Desktop vẫn có sẵn.' }],
  files: files.sort((a, b) => a.title.localeCompare(b.title, 'en', { numeric: true }) || a.device.localeCompare(b.device)), excluded, superseded: []
};
await writeFile(output, JSON.stringify(profile, null, 2) + '\n');
console.log('Pinned 55 decoded originals; excluded 1 corrupt PNG and 2 duplicate baselines. P11F Tablet remains explicitly missing.');
