// Freeze the exact pre-repair records. Re-running never rebases the repair on itself.
import { readFile, writeFile, access, mkdir, copyFile } from 'node:fs/promises';
import { resolve,dirname } from 'node:path';
const root=resolve('.'),planPath=resolve('design-source/business-v1/targets.json');
try {await access(planPath); console.log('Existing pre-repair plan retained.');process.exit(0);}catch{}
const drive=JSON.parse(await readFile('drive-screen-manifest.json','utf8'));
const main=JSON.parse(await readFile('screen-manifest.json','utf8'));
function target(screen,collection){
 if(collection==='drive'){
  if(screen.group==='bao_hanh_sua_chua/phieu_xuat_linh_kien_bao_hanh')return {module:'warranty',state:'default'};
  if(screen.group==='bao_cao_xuat_kho')return {module:'outbound',state:'p'+Number(screen.stateCode.slice(1))};
  if(screen.group==='dang_nhap& phien_lam_viec/phien_lam_viec')return {module:'auth',state:screen.title.replace('AUTH 02 ','').replaceAll(' ','-')};
  if(/session ?expired/i.test(screen.title))return {module:'auth',state:'session-expired'};
 }else{
  if(screen.id.startsWith('AUTH-02-'))return {module:'auth',state:screen.id.includes('expired')?'session-expired':screen.id.includes('starting')?'entering-system':'default'};
  if(screen.id.startsWith('overview-')){const m=screen.id.match(/overview-state-\d+-(.+)-(desktop|tablet)-/);return {module:'overview',state:m[1]==='pending-approval'?'pending':m[1]};}
  if(screen.id.startsWith('filter-'))return {module:'filter',state:String(Number(screen.id.split('-').at(-1)))};
 }
}
const targets=[];
for(const [collection,manifest]of[['drive',drive],['main',main]])for(const screen of manifest.screens){
 const render=target(screen,collection);if(!render)continue;
 const archived=`design-archive/business-v1/${collection}/${screen.sha256}.${screen.src.split('.').at(-1)}`;
 await mkdir(dirname(resolve(root,archived)),{recursive:true});
 await copyFile(screen.src,archived);
 targets.push({collection,id:screen.id,render:{...render,device:screen.device},archived,original:screen,reason:render.module==='auth'?'Canonical session confirmation / privacy-safe expired':render.module==='warranty'?'Wrong module artwork; restore warranty fixture contract':render.module==='outbound'?'Readonly and data-driven status chart':'Consistent time-series/date fixture across overview/filter states'});
}
await writeFile(planPath,JSON.stringify({version:1,basedOn:'da7ea46',reviewStatus:'needs-owner-review',targets},null,2)+'\n');
console.log(`Frozen ${targets.length} repair targets; pre-repair images archived non-destructively.`);
