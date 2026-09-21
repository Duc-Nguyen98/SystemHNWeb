import { cp, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Explicit allowlist; never copy source tooling, local evidence or .git into Pages.
for (const item of ['index.html', 'viewer.html', 'screen-manifest.json', 'README.md', 'handoff-OVERVIEW-STATES-v2.md', 'assets', 'previews/overview-jpg', 'previews/overview-thumbs', 'previews/overview-filter-v2']) {
  const target = resolve(root, 'docs', item);
  await mkdir(dirname(target), { recursive: true });
  await cp(resolve(root, item), target, { recursive: true });
}
console.log('Root and /docs viewer assets synchronized.');
