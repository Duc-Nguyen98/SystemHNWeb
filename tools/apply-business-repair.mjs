import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve,dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=async p=>JSON.parse(await readFile(resolve(root,p),'utf8'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
export async function applyBusinessRepair({driveOnly=false}={}){
 const plan=await read('design-source/business-v1/targets.json'),renders=await read('design-source/business-v1/renders/manifest.json');
 const manifests={drive:await read('drive-screen-manifest.json'),main:await read('screen-manifest.json')};
 let updates=0;
 for(const target of plan.targets){
  if(driveOnly&&target.collection!=='drive')continue;
  const entry=manifests[target.collection].screens.find(s=>s.id===target.id);
  if(!entry)throw new Error(`Missing stable repair target ${target.id}`);
  const r=renders.screens.find(s=>s.module===target.render.module&&s.state===target.render.state&&s.device===target.render.device);
  if(!r)throw new Error(`Missing native render ${JSON.stringify(target.render)}`);
  const bytes=await readFile(resolve(root,r.file));if(hash(bytes)!==r.sha256)throw new Error('Unreviewed render hash drift');
  const stem=`${slug(target.original.title)}-${r.device}-${r.width}x${r.height}-business-v1-review-${r.sha256.slice(0,10)}`;
  const src=target.collection==='drive'?`previews/drive-screens/originals/business-v1/${stem}.png`:`previews/business-v1/originals/${stem}.png`;
  const thumb=target.collection==='drive'?`previews/drive-screens/thumbs/business-v1/${stem}.webp`:`previews/business-v1/thumbs/${stem}.webp`;
  await mkdir(dirname(resolve(root,src)),{recursive:true});await mkdir(dirname(resolve(root,thumb)),{recursive:true});
  await copyFile(resolve(root,r.file),resolve(root,src));
  const info=await sharp(bytes).resize({width:900,height:900,fit:'inside'}).webp({quality:85}).toFile(resolve(root,thumb));
  const canonical=`${r.module}.${r.state}.${r.device}`;
  if(target.collection==='main'&&r.module==='auth')entry.title=`AUTH-02 · ${r.state==='default'?'Xác nhận phiên đăng nhập':r.state==='entering-system'?'Đang vào hệ thống':'Phiên đăng nhập hết hạn'}`;
  Object.assign(entry,{src,thumb,width:r.width,height:r.height,thumbWidth:info.width,thumbHeight:info.height,sha256:r.sha256,
   fileName:`${entry.title.replace(/[ ·—]+/g,'_')}_${r.device.toUpperCase()}_${r.width}x${r.height}_BUSINESS_V1_REVIEW.png`,
   cssWidth:r.device==='tablet'?800:1920,cssHeight:r.device==='tablet'?1280:1080,stage:'review',origin:'native-repair',reviewStatus:'needs-owner-review',
   nativeSource:r.file,designSource:'design-source/business-v1/index.html',canonicalDesignKey:canonical,
   supersedes:{sha256:target.original.sha256,archive:target.archived,reason:target.reason},
   baselineStatus:'candidate-not-approved',provenance:'Deterministic HTML/SVG design repair; native viewport export; pending owner approval'});
  // sourcePaths remain the original Drive provenance; nativeSource is separate.
  if(entry.promptId){delete entry.promptId;delete entry.designReferences;}
  updates++;
 }
 for(const collection of driveOnly?['drive']:['drive','main'])await writeFile(resolve(root,collection==='drive'?'drive-screen-manifest.json':'screen-manifest.json'),JSON.stringify(manifests[collection],null,2)+'\n');
 if(!driveOnly){
  for(const page of ['index.html','previews/overview-filter-v2/index.html']){
   let html=await readFile(resolve(root,page),'utf8');const prefix=page==='index.html'?'':'../../';
   html=html.replace(/<article\b[^>]*>[\s\S]*?<\/article>/g,card=>{
    const id=card.match(/viewer\.html\?screen=([^"&]+)/)?.[1];const s=manifests.main.screens.find(x=>x.id===id&&x.origin==='native-repair');if(!s)return card;
    let changed=card.replace(/<img\b[^>]*>/,`<img loading="lazy" decoding="async" src="${prefix}${s.thumb}" width="${s.thumbWidth}" height="${s.thumbHeight}" alt="${s.title}">`);
    if(id.startsWith('AUTH-02-'))changed=changed.replace(/<h3>[\s\S]*?<\/h3>/,`<h3>${s.title}</h3>`).replace(/aria-label="[^"]*"/,`aria-label="Mở ${s.title}"`);
    changed=changed.replace(/<a\b[^>]*class="download"[^>]*>[\s\S]*?<\/a>/,`<a class="download" href="${prefix}${s.src}" download="${s.fileName}">Tải PNG · Cần duyệt ↓</a>`);
    changed=changed.replace(/<span class="tag">[\s\S]*?<\/span>/,`<span class="tag">${s.width} × ${s.height} · Bản sửa cần duyệt</span>`);
    return changed;
   });
   await writeFile(resolve(root,page),html);
  }
 }
 console.log(`Applied ${updates} native repair references; originals retained in design-archive.`);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await applyBusinessRepair();
