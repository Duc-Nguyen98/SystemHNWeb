// Build a hash-pinned profile from the supplied local export, not a cloud sync.
import { readdir, readFile, writeFile, mkdir, copyFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import sharp from 'sharp';
const root=resolve('.'),sourceRoot=resolve('..'),group='bao_cao_nhap_liet_doi_chieu_loi';
const prefix=`${group}/update/`;
const output='tools/import-profiles/data-recon-20260923.json';
try{await access(output);throw new Error('A pinned profile already exists; review changes explicitly instead of regenerating hashes.');}catch(e){if(e.code!=='ENOENT')throw e;}
const names=(await readdir(resolve(sourceRoot,prefix))).filter(name=>name.toLowerCase().endsWith('.png')).sort();
const files=[],excluded=[];
for(const name of names){
 const path=prefix+name,bytes=await readFile(resolve(sourceRoot,path));
 const sha256=createHash('sha256').update(bytes).digest('hex');
 if(name.startsWith('HN_AppPV_')){excluded.push({path,sha256,reason:'Different module: App PV, visually verified; not in this import scope'});continue;}
 if(name==='HN-DATA-RECON-REPORT-P01-default-tablet-1600x2560.png'){
  let error;try{await sharp(bytes).raw().toBuffer();}catch(e){error=e.message;}
  if(!error)throw new Error('Previously corrupt P01 tablet has changed; inspect before excluding it');
  excluded.push({path,sha256,reason:'PNG decode error; use the readable corrected P01 Tablet instead'});continue;
 }
 if(name==='HN-DATA-RECON-REPORT-P01-default-desktop-1920x1080.png'){
  const corrected=await readFile(resolve(sourceRoot,prefix+'HN-DATA-RECON-REPORT-P01-corrected-desktop-1920x1080.png'));
  if(!bytes.equals(corrected))throw new Error('P01 Desktop alternatives differ; explicit choice required');
  excluded.push({path,sha256,reason:'Byte-identical duplicate of corrected P01 Desktop'});continue;
 }
 let stem=name.replace(/\.png$/,'');
 let state,device;
 if(name.startsWith('ChatGPT Image ')){
  if(sha256!=='cfc815e37f579633f9ee675e3a0cd2b8324976e1a756b1c1b1903d1c63ebc3dd')throw new Error('Unrecognized timestamp-named artwork');
  state='P10 RECONCILIATION WARNING';device='desktop';
 }else{
  const match=stem.match(/^HN-DATA-RECON-REPORT-(P\d{2})-(.+)-(desktop|tablet)-\d+x\d+$/);
  if(!match)throw new Error(`Unclassified file: ${name}`);
  state=`${match[1]} ${match[2]==='corrected'?'DEFAULT':match[2].replaceAll('-',' ').toUpperCase()}`;device=match[3];
 }
 files.push({path,sha256,title:`HN DATA RECON REPORT ${state}`,device});
}
for(const device of ['desktop','tablet']){
 const path=`bao_cao_nhan_dong_goi_in_lai/update/HN-DATA-RECON-REPORT-P18-export-success-${device}-${device==='desktop'?'1920x1080':'1600x2560'}.png`;
 const bytes=await readFile(resolve(sourceRoot,path));
 files.push({path,sha256:createHash('sha256').update(bytes).digest('hex'),title:'HN DATA RECON REPORT P18 EXPORT SUCCESS',device,note:'Located in packaging-label folder; artwork and filename verified as data-reconciliation report'});
}
for(const item of files){const bytes=await readFile(resolve(sourceRoot,item.path));await sharp(bytes).raw().toBuffer();const meta=await sharp(bytes).metadata();item.width=meta.width;item.height=meta.height;if(item.width!==(item.device==='desktop'?1920:1600)||item.height!==(item.device==='desktop'?1080:2560))throw new Error('Unexpected native dimensions');}
if(files.length!==40)throw new Error(`Expected 40 distinct screen/device entries, found ${files.length}`);
const old=JSON.parse(await readFile('drive-screen-manifest.json','utf8')).screens.filter(s=>s.group===group);
const superseded=[];
for(const s of old){const archive=`design-archive/data-recon-20260923/${s.device}-${s.sha256}.png`;await mkdir(resolve(root,'design-archive/data-recon-20260923'),{recursive:true});await copyFile(s.src,archive);superseded.push({id:s.id,device:s.device,sha256:s.sha256,archive});}
const profile={version:1,id:'data-recon-20260923',group,groupTitle:'Báo cáo nhập liệu, đối chiếu & lỗi dữ liệu',updatedAt:'2026-09-23',
 sourceDirectory:group,requestedDriveFolder:'https://drive.google.com/drive/folders/1XC02PvoNQeT__KIBMiwW3YxN20KFs83N',
 sourceVerification:'Local workspace export verified; requested Google Drive folder denied access in current browser session. No cloud listing/download comparison was possible.',
 artPolicy:'Import supplied artwork unchanged; no redesign, AI synthesis or approval claim.',files:files.sort((a,b)=>a.title.localeCompare(b.title)||a.device.localeCompare(b.device)),excluded,superseded};
await mkdir('tools/import-profiles',{recursive:true});await writeFile(output,JSON.stringify(profile,null,2)+'\n');
console.log(`Pinned ${files.length} data-reconciliation files; ${excluded.length} non-selected local files; ${superseded.length} old baselines archived.`);
