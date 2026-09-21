import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { serve } from './serve.mjs';
import { sessionStates } from '../design-source/business-v1/fixtures.mjs';
const root=resolve('.'),out=resolve('design-source/business-v1/renders');
await mkdir(out,{recursive:true});
const all=[
  ...sessionStates.map(state=>({module:'auth',state})),
  {module:'warranty',state:'default'},
  ...Array.from({length:9},(_,i)=>({module:'outbound',state:`p${i+1}`})),
  ...['default','loading','empty','error','permission-denied','pending','processing','completed','overdue','urgent'].map(state=>({module:'overview',state})),
  ...Array.from({length:13},(_,i)=>({module:'filter',state:String(i+1)}))
];
const samples=process.argv.includes('--samples');
const selected=samples?all.filter(x=>x.module==='warranty'||x.module==='auth'&&x.state==='session-expired'||x.module==='outbound'&&x.state==='p7'||x.module==='overview'&&x.state==='default'||x.module==='filter'&&['6','7','9'].includes(x.state)):all;
const server=await serve(root,0),base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch();const results=[],overflows=[];
try {
 for(const device of ['desktop','tablet']){
  const context=await browser.newContext({viewport:device==='desktop'?{width:1920,height:1080}:{width:800,height:1280},deviceScaleFactor:device==='tablet'?2:1});
  const page=await context.newPage();page.on('pageerror',e=>{throw e});
  for(const target of selected){
   await page.goto(`${base}/design-source/business-v1/index.html?module=${target.module}&state=${target.state}`);
   await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');await page.evaluate(()=>document.fonts.ready);
   const size=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,width:innerWidth,height:innerHeight}));
   if(size.scrollWidth>size.width||size.scrollHeight>size.height)overflows.push({target,device,...size});
   const file=`${target.module}-${target.state}-${device}.png`;
   await page.screenshot({path:resolve(out,file),fullPage:false,animations:'disabled'});
   const bytes=await readFile(resolve(out,file));
   results.push({...target,device,file:`design-source/business-v1/renders/${file}`,width:device==='desktop'?1920:1600,height:device==='desktop'?1080:2560,sha256:createHash('sha256').update(bytes).digest('hex')});
   console.log(`Rendered ${target.module}/${target.state}/${device}`);
  }
  await context.close();
 }
}finally{await browser.close();server.close();}
if(overflows.length)throw new Error(`Layout overflow: ${JSON.stringify(overflows)}`);
await writeFile(resolve(out,samples?'samples.json':'manifest.json'),JSON.stringify({version:'business-v1',reviewStatus:'needs-owner-review',source:'design-source/business-v1',screens:results},null,2)+'\n');
