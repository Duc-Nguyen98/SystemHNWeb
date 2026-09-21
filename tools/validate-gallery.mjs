import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = path => readFile(resolve(root, path));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const manifest = JSON.parse(await read('screen-manifest.json'));
const ids = new Set();
for (const screen of manifest.screens) {
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
assert.equal(ids.size, 124, 'Update the reviewed inventory when adding/removing screens');
for (const page of ['index.html', 'previews/overview-filter-v2/index.html']) {
  const html = (await read(page)).toString();
  assert(!/document\.write|openImageViewer|openPreview/.test(html), `${page}: duplicated legacy viewer`);
  const cards = [...html.matchAll(/<article\b[^>]*>[\s\S]*?<\/article>/g)].map(m => m[0]).filter(card => card.includes('class="preview"'));
  assert.equal(cards.length, page === 'index.html' ? 124 : 26);
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
for (const file of ['viewer.html', 'screen-manifest.json']) assert.equal(hash(await read(file)), hash(await read(`docs/${file}`)), `Root/docs drift: ${file}`);
console.log('PASS: 124 originals + 150 gallery links, dimensions, hashes, download targets and root/docs parity.');
