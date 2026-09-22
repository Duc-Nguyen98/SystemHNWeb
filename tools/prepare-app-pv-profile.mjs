// One-time review record for the supplied App PV workspace export.
import {readFile,writeFile,readdir,mkdir,copyFile,access} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const group='san_pham_app_pv',prefix=group+'/update/',output='tools/import-profiles/app-pv-20260923.json';
try{await access(output);throw new Error('Profile already exists; inspect changes rather than regenerate pinned hashes.');}catch(e){if(e.code!=='ENOENT')throw e;}
const files=[],excluded=[];
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
async function add(path){
 const bytes=await readFile(resolve('..',path));await sharp(bytes).raw().toBuffer();const meta=await sharp(bytes).metadata();
 const name=path.split('/').at(-1),match=name.match(/^HN_AppPV_SanPham_(P\d{2}[A-Z]?)_(.+)_(desktop|tablet)_(\d+)x(\d+)(?:_REVIEW)?_v1\.0\.png$/i);
 if(!match)throw new Error(`Unclassified App PV artwork: ${path}`);
 const device=match[3].toLowerCase();
 if(meta.width!==(device==='desktop'?1920:1600)||meta.height!==(device==='desktop'?1080:2560))throw new Error(`Unexpected canvas: ${path}`);
 files.push({path,sha256:digest(bytes),title:`HN APP PV CATALOG ${match[1].toUpperCase()} ${match[2].replaceAll('_',' ').toUpperCase()}`,device,width:meta.width,height:meta.height});
}
for(const name of (await readdir(resolve('..',prefix))).filter(n=>/\.png$/i.test(n)).sort()){
 const path=prefix+name;
 if(name.startsWith('HN_AppPV_P01_')||name.startsWith('HN_DanhMuc_')){
  excluded.push({path,sha256:digest(await readFile(resolve('..',path))),reason:name.startsWith('HN_DanhMuc_')?'Different module: product-catalog maintenance; not App PV save timeout':'Alternative P01 Candidate v2.1; retain source but use Default v1.0 with the matching v1.0 state set. No baseline approval inferred.'});
 }else await add(path);
}
for(const device of ['desktop','tablet']){
 const size=device==='desktop'?'1920x1080':'1600x2560';
 for(const [code,state] of [['P18','Edit_Form_Populated'],['P19','Preview_Readonly']])await add(`bao_cao_nhap_liet_doi_chieu_loi/update/HN_AppPV_SanPham_${code}_${state}_${device}_${size}_v1.0.png`);
 const path=`bao_cao_nhap_liet_doi_chieu_loi/update/HN_AppPV_SanPham_P16_Row_Selected_Focus_${device}_${size}_v1.0.png`;
 const bytes=await readFile(resolve('..',path)),hash=digest(bytes);
 if(!files.some(f=>f.sha256===hash&&f.device===device&&f.title.includes(' P16 ')))throw new Error('P16 duplicate differs; inspect before excluding');
 excluded.push({path,sha256:hash,reason:'Byte-identical P16 duplicate already included from the App PV update folder'});
}
if(files.length!==48||new Set(files.map(f=>f.sha256)).size!==48)throw new Error('Expected 48 unique supplied App PV state/device images');
const current=JSON.parse(await readFile('drive-screen-manifest.json','utf8'));
const superseded=[];
await mkdir('design-archive/app-pv-20260923',{recursive:true});
for(const screen of current.screens.filter(s=>s.group===group)){
 const archive=`design-archive/app-pv-20260923/${screen.device}-${screen.sha256}.png`;
 await copyFile(screen.src,archive);superseded.push({id:screen.id,device:screen.device,sha256:screen.sha256,archive});
}
const profile={version:1,id:'app-pv-20260923',group,groupTitle:'Sản phẩm trên App PV',updatedAt:'2026-09-23',sourceDirectory:group,
 requestedDriveFolder:'https://drive.google.com/drive/folders/1X6PxgiSmrZnwBi2vxcE4wnNpMmbE29MN',
 sourceVerification:'Local workspace export verified; requested Google Drive folder denied access in current browser session. No cloud listing/download comparison was possible.',
 artPolicy:'Import supplied images unchanged. Use Default v1.0 with its matching state family; retain alternate candidates outside the active state inventory. No AI synthesis or approval claim.',
 missingStates:[{code:'P20F',label:'SAVE TIMEOUT UNKNOWN',devices:['desktop','tablet'],status:'source-not-found',reason:'Required by APP-PV-CATALOG-01 source document; no matching artwork found in the supplied workspace export. Cloud listing inaccessible.'}],
 files:files.sort((a,b)=>a.title.localeCompare(b.title)||a.device.localeCompare(b.device)),excluded,superseded};
await mkdir('tools/import-profiles',{recursive:true});await writeFile(output,JSON.stringify(profile,null,2)+'\n');
console.log(`Pinned ${files.length} originals; excluded ${excluded.length} alternate/foreign/duplicate sources; declared P20F missing, not fabricated.`);
