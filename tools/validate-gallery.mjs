import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { assertDriveStateCoverage, stateIdentity } from './drive-state-policy.mjs';
import { loadImportProfiles } from './import-profiles.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = path => readFile(resolve(root, path));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const manifest = JSON.parse(await read('screen-manifest.json'));
const driveManifest = JSON.parse(await read('drive-screen-manifest.json'));
assert.equal(driveManifest.groups.find(group => group.id === 'ton_kho&doi_soat')?.title, 'Báo cáo tồn kho & đối soát', 'Inventory report must use its full business name');
const importProfiles = await loadImportProfiles();
const ids = new Set();
async function validateNative(screen) {
  if (screen.origin !== 'native-repair') return;
  assert.equal(screen.reviewStatus, 'needs-owner-review');
  assert.equal(screen.baselineStatus, 'candidate-not-approved');
  assert.equal(hash(await read(screen.nativeSource)), screen.sha256, 'Native source drift');
  assert.equal(hash(await read(screen.supersedes.archive)), screen.supersedes.sha256, 'Pre-repair archive drift');
  assert.equal(screen.width, screen.device === 'desktop' ? 1920 : 1600);
  assert.equal(screen.height, screen.device === 'desktop' ? 1080 : 2560);
  assert(screen.canonicalDesignKey && screen.fileName.includes(`${screen.width}x${screen.height}`));
}
for (const screen of manifest.screens) {
  await validateNative(screen);
  assert(!ids.has(screen.id), `Duplicate ${screen.id}`); ids.add(screen.id);
  assert(/^previews\/[\w./-]+\.(png|jpg)$/.test(screen.src) && !screen.src.includes('..'), `Original path required: ${screen.id}`);
  assert(!screen.src.includes('thumb'), `Thumbnail used for detail: ${screen.id}`);
  const bytes = await read(screen.src), meta = await sharp(bytes).metadata();
  assert.equal(meta.width, screen.width, `${screen.id} width`);
  assert.equal(meta.height, screen.height, `${screen.id} height`);
  assert.equal(hash(bytes), screen.sha256, `${screen.id} source changed; review required`);
  assert.equal(hash(await read(`docs/${screen.src}`)), screen.sha256, `${screen.id} deployed copy mismatch`);
  assert(screen.device === 'desktop' ? screen.width >= 1920 && screen.height >= 1080 && screen.width > screen.height : screen.width >= 1440 && screen.height >= 2048 && screen.height > screen.width, `Insufficient/wrong source canvas: ${screen.id}`);
  if (screen.cssWidth) assert(Math.abs(screen.width / screen.height - screen.cssWidth / screen.cssHeight) < .0001, `CSS aspect-ratio mismatch: ${screen.id}`);
}
assert.equal(ids.size, 84, 'Update the reviewed inventory when adding/removing screens');
const driveIds = new Set();
const allDriveIds = new Set(driveManifest.screens.map(screen => screen.id));
const oldDriveIds = new Set();
for (const screen of driveManifest.screens) {
  assert.equal(screen.groupTitle, driveManifest.groups.find(group => group.id === screen.group)?.title, `${screen.id}: group label differs from filter label`);
  await validateNative(screen);
  assert(!driveIds.has(screen.id), `Duplicate Drive screen ${screen.id}`); driveIds.add(screen.id);
  assert(typeof screen.fileName === 'string' && /\.(png|jpg)$/i.test(screen.fileName), `${screen.id} missing handoff filename`);
  assert(!/^[0-9a-f]{8}(?:\s|[-_][0-9a-f]{4})/i.test(screen.title), `${screen.id} still exposes an opaque UUID title`);
  assert(!/^ChatGPT Image/i.test(screen.title), `${screen.id} still exposes a timestamp-only title`);
  assert(/^previews\/drive-screens\/originals\/[\w./-]+\.(png|jpg)$/.test(screen.src) && !screen.src.includes('..'), `Drive original path required: ${screen.id}`);
  assert(/^previews\/drive-screens\/thumbs\/[\w./-]+\.webp$/.test(screen.thumb) && !screen.thumb.includes('..'), `Drive thumbnail path required: ${screen.id}`);
  const bytes = await read(screen.src), meta = await sharp(bytes).metadata();
  assert.equal(meta.width, screen.width, `${screen.id} width`);
  assert.equal(meta.height, screen.height, `${screen.id} height`);
  assert.equal(hash(bytes), screen.sha256, `${screen.id} source changed; review required`);
  assert.equal(hash(await read(`docs/${screen.src}`)), screen.sha256, `${screen.id} deployed copy mismatch`);
  const thumb = await read(screen.thumb), thumbMeta = await sharp(thumb).metadata();
  assert.equal(thumbMeta.width, screen.thumbWidth, `${screen.id} thumbnail width`);
  assert.equal(thumbMeta.height, screen.thumbHeight, `${screen.id} thumbnail height`);
  assert.equal(hash(thumb), hash(await read(`docs/${screen.thumb}`)), `${screen.id} deployed thumbnail mismatch`);
  assert(['desktop', 'tablet'].includes(screen.device), `${screen.id} invalid device`);
  assert(Array.isArray(screen.sourcePaths) && screen.sourcePaths.length > 0, `${screen.id} missing Drive provenance`);
  const state = stateIdentity(screen.title);
  if (state) { assert.equal(screen.stateCode, state.code); assert.equal(screen.stateName, state.name); }
  for (const alias of screen.aliases || []) {
    assert(!oldDriveIds.has(alias) && !allDriveIds.has(alias), `Ambiguous legacy viewer link: ${alias}`);
    oldDriveIds.add(alias);
  }
  if (screen.origin === 'ai-supplement') {
    assert.equal(screen.stage, 'review', 'AI supplements must not be marked as approved delivery');
    assert.equal(screen.reviewStatus, 'needs-owner-review');
    assert(screen.designReferences?.length && screen.promptId, `${screen.id}: missing generation provenance`);
    assert.equal(hash(await read(screen.sourcePaths[0])), screen.sha256, `${screen.id}: supplement source mismatch`);
    assert(screen.fileName.includes(`${screen.width}x${screen.height}`), 'Supplement filename must use native dimensions');
  }
  if (screen.origin === 'workspace-update') {
    const profile = importProfiles.find(profile => profile.id === screen.importProfile);
    assert(profile, `${screen.id}: missing import profile`);
    const source = profile.files.find(file => screen.sourcePaths.includes(file.path));
    assert(source, `${screen.id}: source absent from pinned import profile`);
    assert.equal(screen.sha256, source.sha256);
    assert.equal(screen.title, source.title);
    assert.equal(screen.width, source.width); assert.equal(screen.height, source.height);
    if (source.sourceDesignStatus) assert.equal(screen.sourceDesignStatus, source.sourceDesignStatus);
    if (source.sourceExport) assert.deepEqual(screen.sourceExport, source.sourceExport);
    assert.equal(screen.group, profile.group);
    assert.equal(screen.sourceVerification, 'local-export-verified-cloud-access-denied');
    assert.equal(screen.reviewStatus, 'approval-not-recorded');
    assert(screen.fileName.includes(`${source.width}x${source.height}`));
  }
}
for (const profile of importProfiles) {
  const imported = driveManifest.screens.filter(screen => screen.importProfile === profile.id);
  assert.equal(imported.length, profile.files.length, `${profile.id}: pinned source inventory incomplete`);
  for (const source of profile.files) assert.equal(imported.filter(screen => screen.sha256 === source.sha256 && screen.sourcePaths.includes(source.path)).length, 1, `${profile.id}: source omitted or duplicated: ${source.path}`);
  for (const previous of profile.superseded) assert.equal(hash(await read(previous.archive)), previous.sha256, `${profile.id}: previous baseline archive mismatch`);
}
const coverage = assertDriveStateCoverage(driveManifest);
assert.equal(driveIds.size, driveManifest.total, 'Drive manifest total mismatch');
assert.equal(driveManifest.groups.reduce((sum, group) => sum + group.count, 0), driveManifest.total, 'Drive group totals mismatch');
const driveHtml = (await read('drive-gallery.html')).toString();
assert(driveHtml.includes("fetch('drive-screen-manifest.json', { cache: 'no-store' })"), 'Drive gallery must load its current reviewed manifest, not stale cached inventory');
assert(driveHtml.includes('viewer.html?collection=drive&screen='), 'Drive gallery must use the shared full-resolution viewer');
assert.equal(driveHtml, (await read('docs/drive-gallery.html')).toString(), 'Root/docs drift: drive-gallery.html');
for (const page of ['index.html', 'previews/overview-filter-v2/index.html']) {
  const html = (await read(page)).toString();
  assert(!/document\.write|openImageViewer|openPreview/.test(html), `${page}: duplicated legacy viewer`);
  const cards = [...html.matchAll(/<article\b[^>]*>[\s\S]*?<\/article>/g)].map(m => m[0]).filter(card => card.includes('class="preview"'));
  assert.equal(cards.length, page === 'index.html' ? 84 : 26);
  for (const card of cards) {
    const a = card.match(/<a\b[^>]*class="preview"[^>]*>/)[0];
    const id = a.match(/viewer\.html\?screen=([^"&]+)/)?.[1];
    assert(ids.has(id), `${page}: broken viewer link`);
    const entry = manifest.screens.find(s => s.id === id);
    assert(card.includes(`href="${page === 'index.html' ? '' : '../../'}${entry.src}"`), `${id}: original download missing`);
    const img = card.match(/<img\b[^>]*>/)[0], src = img.match(/\bsrc="([^"]+)"/)[1];
    const meta = await sharp(src.startsWith('data:') ? Buffer.from(src.split(',')[1], 'base64') : await read(resolve(root,dirname(page),src))).metadata();
    const w = img.match(/width="(\d+)"/), h = img.match(/height="(\d+)"/);
    if (w && h) { assert.equal(Number(w[1]), meta.width, `${id} thumbnail width`); assert.equal(Number(h[1]), meta.height, `${id} thumbnail height`); }
    for (const [_, candidate, width] of (img.match(/srcset="([^"]+)"/)?.[1] || '').matchAll(/([^,\s]+) (\d+)w/g)) assert.equal((await sharp(await read(candidate)).metadata()).width, Number(width), `${id} srcset width`);
  }
  assert.equal(html, (await read(`docs/${page}`)).toString(), `Root/docs drift: ${page}`);
}
async function compare(path) {
  for (const entry of await readdir(resolve(root, path), { withFileTypes: true })) {
    const file = `${path}/${entry.name}`;
    if (entry.isDirectory()) await compare(file);
    else assert.equal(hash(await read(file)), hash(await read(`docs/${file}`)), `Root/docs drift: ${file}`);
  }
}
await compare('assets');
await compare('design-source/business-v1');
for (const file of ['business-repair.html','baseline-register.json','handoff-BUSINESS-REPAIR-v1.md','handoff-DATA-RECON-UPDATE-20260923.md','handoff-APP-PV-UPDATE-20260923.md','handoff-DEFECT-CATALOG-UPDATE-20260923.md','handoff-INBOUND-RECEIPTS-UPDATE-20260923.md']) assert.equal(hash(await read(file)), hash(await read(`docs/${file}`)), `Handoff drift: ${file}`);
for (const file of ['viewer.html', 'screen-manifest.json', 'drive-screen-manifest.json']) assert.equal(hash(await read(file)), hash(await read(`docs/${file}`)), `Root/docs drift: ${file}`);
console.log(`PASS: 84 primary boards + ${driveManifest.total} Drive screens, dimensions, hashes, downloads and root/docs parity.`);
console.log(`PASS: state coverage for ${coverage.checkedScreens} screens / ${coverage.checkedGroups} groups; ${coverage.exemptGroups} unfinished groups (<=3 images) exempt.`);
if (coverage.knownMissingStates) console.log(`SOURCE GAP: ${coverage.knownMissingStates} documented states have unavailable images across App PV, Bệnh Lỗi and Phiếu nhập; available-file checks are not full design coverage.`);
