import { execFileSync } from 'node:child_process';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=resolve(root,'../..','artifacts/dev-viewer-fix-20260913');
await mkdir(out,{recursive:true});
// Bundle only changed/new project files (not the nested Git database, dependencies,
// untouched original artwork, or earlier failed QA runs).
const changed=execFileSync('git',['diff','--name-only','-z'],{cwd:root}).toString().split('\0').filter(Boolean);
const added=execFileSync('git',['ls-files','--others','--exclude-standard','-z'],{cwd:root}).toString().split('\0').filter(Boolean);
const files=[...new Set([...changed,...added])];
const payload=resolve(out,'payload');
await mkdir(payload,{recursive:true});
for(const file of files){await mkdir(dirname(resolve(payload,file)),{recursive:true});await cp(resolve(root,file),resolve(payload,file));}
const integrity=[];
for(const file of files)integrity.push({file,sha256:createHash('sha256').update(await readFile(resolve(root,file))).digest('hex')});
await writeFile(resolve(out,'payload-manifest.json'),JSON.stringify({baseRevision:'0c7d151a11ea74741fb66b21f6ca6a906424a8ee',branch:'codex/dev-viewer-fix',files:integrity},null,2));
execFileSync('tar',['-a','-cf',resolve(out,'SystemHNWeb-viewer-fix.zip'),'-C',payload,'.'],{stdio:'inherit'});
console.log(`Packaged ${files.length} files: ${out}/SystemHNWeb-viewer-fix.zip`);
