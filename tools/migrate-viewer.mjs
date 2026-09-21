// One-time migration of the 2026-09-13 gallery. No image synthesis or upscaling.
// Usage: node tools/migrate-viewer.mjs <original filter package directory>
import { readFile, writeFile, mkdir, cp, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(process.argv[2]);
const sha = b => createHash('sha256').update(b).digest('hex');
const manifest = { version: 1, sourceRevision: '0c7d151a11ea74741fb66b21f6ca6a906424a8ee', screens: [] };
const originalManifest = (await readFile(resolve(source, 'ASSET-MANIFEST.csv'), 'utf8')).trim().split(/\r?\n/).slice(1).map(line => line.split(','));
const filterEntries = {};
for (const device of ['desktop', 'tablet']) {
  const directory = device === 'desktop' ? 'Desktop' : 'Tablet';
  const files = (await readdir(resolve(source, directory))).filter(name => name.endsWith('.png')).sort();
  if (files.length !== 13) throw new Error(`Expected 13 original files for ${device}`);
  for (const [index, filename] of files.entries()) {
    const bytes = await readFile(resolve(source, directory, filename));
    const record = originalManifest.find(row => row[1] === filename);
    const metadata = await sharp(bytes).metadata();
    if (!record || sha(bytes) !== record[4] || metadata.width !== Number(record[2]) || metadata.height !== Number(record[3])) throw new Error(`Invalid original: ${filename}`);
    const src = `previews/overview-filter-v2/originals/${device}/${filename}`;
    await mkdir(dirname(resolve(root, src)), { recursive: true });
    await cp(resolve(source, directory, filename), resolve(root, src));
    filterEntries[`${device}-${index + 1}`] = { id: `filter-${device}-${String(index + 1).padStart(2, '0')}`, device, src, width: metadata.width, height: metadata.height, cssWidth: device === 'tablet' ? 800 : 1920, cssHeight: device === 'tablet' ? 1280 : 1080, sha256: sha(bytes), provenance: `HN-WMS-OVERVIEW-FILTER-STATES-v2/ASSET-MANIFEST.csv:${filename}` };
  }
}
let html = await readFile(resolve(root, 'index.html'), 'utf8');
if (!html.includes('function openImageViewer')) throw new Error('Migration expects the original gallery, not an already migrated file.');
const cards = [...html.matchAll(/<article\b[^>]*>[\s\S]*?<\/article>/g)];
let replacements = [], core = 0;
for (const match of cards) {
  const card = match[0];
  const anchor = card.match(/<a\b[^>]*class="preview"[^>]*>/);
  if (!anchor) continue;
  const href = anchor[0].match(/href="([^"]+)"/)[1];
  const title = card.match(/<h3>([\s\S]*?)<\/h3>/)[1];
  let entry;
  if (href === '#') {
    const prefix = html.slice(0, match.index);
    const section = [...prefix.matchAll(/<section\b[^>]*>/g)].at(-1)[0];
    const device = /desktop/.test(section) ? 'desktop' : 'tablet';
    const number = Number(title.match(/MAP-01-(\d+)/)[1]);
    entry = { ...filterEntries[`${device}-${number}`], title };
  } else {
    core++;
    const bytes = await readFile(resolve(root, href));
    const meta = await sharp(bytes).metadata();
    const device = href.includes('/desktop/') ? 'desktop' : 'tablet';
    entry = { id: href.split('/').at(-1).replace(/\.(jpg|png)$/, ''), title, src: href, device, width: meta.width, height: meta.height, sha256: sha(bytes), provenance: 'Existing gallery original; unchanged bytes' };
    // Do not claim legacy 1440x2048 auth artwork is an 800x1280 design.
    if (meta.width === 1600 && meta.height === 2560) { entry.cssWidth = 800; entry.cssHeight = 1280; }
  }
  manifest.screens.push(entry);
  let updated = card.replace(anchor[0], anchor[0].replace(/href="[^"]*"/, `href="viewer.html?screen=${entry.id}"`).replace('rel="noopener"', 'rel="noopener noreferrer"'));
  if (href === '#') {
    // Full originals for detail; the existing embedded thumbnail stays preview-only.
    updated = updated.replace(/<a class="download"[^>]*>[\s\S]*?<\/a>/, `<a class="download" download href="${entry.src}">Tải PNG gốc ↓</a>`);
    const thumb = updated.match(/<img\b[^>]*>/)[0];
    const meta = await sharp(Buffer.from(thumb.match(/src="data:[^,]+,([^"]+)"/)[1], 'base64')).metadata();
    updated = updated.replace(thumb, thumb.replace(/width="\d+"/, `width="${meta.width}"`).replace(/height="\d+"/, `height="${meta.height}"`));
  }
  replacements.push([card, updated]);
}
if (core !== 58 || manifest.screens.length !== 84) throw new Error('Unexpected gallery inventory');
for (const [old, updated] of replacements) html = html.replace(old, updated);
html = html.replace(/\n  function openImageViewer[\s\S]*?(?=<\/script>)/, '\n');
await writeFile(resolve(root, 'index.html'), html);
let detail = await readFile(resolve(root, 'previews/overview-filter-v2/index.html'), 'utf8');
for (const match of [...detail.matchAll(/<article\b[^>]*>[\s\S]*?<\/article>/g)]) {
  const card = match[0];
  if (!card.includes('class="preview"')) continue;
  const device = /— Desktop/.test(card) ? 'desktop' : 'tablet';
  const number = Number(card.match(/<h3>(\d+)/)[1]);
  const entry = filterEntries[`${device}-${number}`];
  const updated = card.replace('href="#"', `href="../../viewer.html?screen=${entry.id}" target="_blank" rel="noopener noreferrer"`)
    .replace(/<button class="download"[^>]*>[\s\S]*?<\/button>/, `<a class="download" download href="../../${entry.src}">Tải PNG gốc ↓</a>`);
  detail = detail.replace(card, updated);
}
detail = detail.replace(/function openPreview[\s\S]*?(?=if\(location.hash)/, '');
await writeFile(resolve(root, 'previews/overview-filter-v2/index.html'), detail);
await writeFile(resolve(root, 'screen-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log('Migrated 84 boards, restored 26 verified original PNGs, retained all existing board content.');
