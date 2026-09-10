import { readdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';

const outputRoot = resolve('dist/client');
const githubBasePath = '/WMS_UIUX_HoaNamv2';
const textExtensions = new Set(['.css', '.html', '.js', '.json', '.map', '.svg', '.txt']);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else if (textExtensions.has(extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }

  return files;
}

const files = await walk(outputRoot);
const historyBootstrap = await readFile(resolve('scripts/prototype-history-bootstrap.js'), 'utf8');
let rewritten = 0;

for (const file of files) {
  const before = await readFile(file, 'utf8');
  // Protect already-prefixed assets before normalizing root-relative ones.
  // Using absolute project paths also works after a query/hash navigation.
  let after = before
    .replaceAll(`${githubBasePath.slice(1)}${githubBasePath}/`, `${githubBasePath.slice(1)}/`)
    .replaceAll(`${githubBasePath.slice(1)}/_next/`, '__HN_PAGES_ASSET__/')
    .replaceAll('/_next/', `${githubBasePath}/_next/`)
    .replaceAll('__HN_PAGES_ASSET__/', `${githubBasePath.slice(1)}/_next/`)
    .replaceAll(`"_next/`, `"${githubBasePath.slice(1)}/_next/`)
    .replaceAll(`'_next/`, `'${githubBasePath.slice(1)}/_next/`)
    .replaceAll('"/favicon.svg"', `"${githubBasePath}/favicon.svg"`)
    .replaceAll("'/favicon.svg'", `'${githubBasePath}/favicon.svg'`);

  // Router basePath is compiled by the client environment in vite.config.ts.
  // Never patch one minified
  // variable: the optimizer also inlines it into navigation controllers.

  // Register the one-document history owner before the RSC module registers
  // its popstate listener. A React effect is too late at window event target.
  if (file === join(outputRoot, 'index.html') && !after.includes('id="hn-prototype-history"')) {
    after = after.replace('<head>', `<head><script id="hn-prototype-history">${historyBootstrap}</script>`);
  }

  if (after !== before) {
    await writeFile(file, after);
    rewritten += 1;
  }
}

await writeFile(join(outputRoot, '.nojekyll'), '');
console.log(`Prepared ${relative(process.cwd(), outputRoot)} for GitHub Pages; rewrote ${rewritten} text assets.`);
