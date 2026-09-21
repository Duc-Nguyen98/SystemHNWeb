import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {serve} from '../tools/serve.mjs';
import {outbound,warranty,overviewStock,overviewSeries,seriesForRange,displayDate} from '../design-source/business-v1/fixtures.mjs';
const main=JSON.parse(await readFile('screen-manifest.json','utf8'));
const drive=JSON.parse(await readFile('drive-screen-manifest.json','utf8'));
const plan=JSON.parse(await readFile('design-source/business-v1/targets.json','utf8'));
const renders=JSON.parse(await readFile('design-source/business-v1/renders/manifest.json','utf8'));
assert.equal(outbound.daily.reduce((a,b)=>a+b,0),1186);
assert.equal(outbound.status.reduce((a,b)=>a+b.value,0),42);
assert.equal(warranty.posted+warranty.draft+warranty.scanning+warranty.cancelled,84);
assert.equal(overviewStock.reduce((a,b)=>a+b.value,0),647);
assert.equal(overviewSeries.at(-1).closing,647);
assert.equal(overviewSeries.find(p=>p.date==='2026-09-07').closing,685);
assert(displayDate('2026-09-10').includes('Thứ Năm'));
for(const [r,n]of[['7d',7],['14d',14],['30d',30],['custom',5]])assert.equal(seriesForRange(r).length,n);
assert.equal(plan.targets.length,108);assert.equal(renders.screens.length,88);
for(const t of plan.targets){
 const s=(t.collection==='drive'?drive:main).screens.find(s=>s.id===t.id);
 assert.equal(s.origin,'native-repair');assert.equal(s.reviewStatus,'needs-owner-review');
 assert.equal(s.supersedes.sha256,t.original.sha256);
 assert.equal(createHash('sha256').update(await readFile(s.supersedes.archive)).digest('hex'),t.original.sha256);
}
const canonical=new Map();
for(const s of [...main.screens,...drive.screens].filter(s=>s.origin==='native-repair')){if(canonical.has(s.canonicalDesignKey))assert.equal(canonical.get(s.canonicalDesignKey),s.sha256);else canonical.set(s.canonicalDesignKey,s.sha256);}
const server=await serve(resolve('.'),0),base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch();const checks=[];
try{
 for(const device of ['desktop','tablet']){
  const context=await browser.newContext({viewport:device==='desktop'?{width:1920,height:1080}:{width:800,height:1280},deviceScaleFactor:device==='tablet'?2:1});
  const page=await context.newPage();const pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message));
  async function open(module,state){await page.goto(`${base}/design-source/business-v1/index.html?module=${module}&state=${state}`);await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');await page.evaluate(()=>document.fonts.ready);}
  for(const r of renders.screens.filter(r=>r.device===device)){
   await open(r.module,r.state);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight),`${r.module}/${r.state}/${device}: page overflow`);
   const clipped=await page.locator('td,th,button,h1,h2,.badge,.field').evaluateAll(es=>es.filter(e=>e.getBoundingClientRect().width>0&&e.scrollWidth>e.clientWidth+2).map(e=>e.innerText));
   assert.deepEqual(clipped,[],`${r.module}/${r.state}/${device}: text/control overflow`);
   if(r.module==='auth'){
    assert(!(await page.locator('body').innerText()).includes('bắt đầu ca'));
    if(r.state==='session-expired'){
     const text=await page.locator('body').innerText();
     for(const forbidden of ['Minh Anh','Nhân viên kho','Kho Hoa Nam','Đang hoạt động','Bạn có thể bắt đầu','Xuất Excel'])assert(!text.includes(forbidden),forbidden);
     assert.equal(await page.locator('.auth-card button').count(),1);assert.equal(await page.locator('.auth-card button').textContent(),'Đăng nhập lại');
    }
   }
   if(r.module==='outbound'){
    if(r.state==='p7'){assert(await page.locator('#apply').isEnabled());assert(await page.locator('#reset').isEnabled());assert(await page.locator('#table-search').isEnabled());assert(await page.locator('#export').isDisabled());}
    assert.equal(await page.locator('[data-segment="cancelled"]').count(),0,'zero cancelled value must not draw an arc');
    if(!['p2','p3','p4','p6'].includes(r.state)){assert.equal(await page.locator('.outbound-table tbody tr').count(),5);}
    if(!['p2','p3','p4'].includes(r.state))assert.equal(await page.locator('[data-chart-day]').count(),7);
   }
   if(r.module==='warranty'){
    const text=await page.locator('main.workspace').innerText();assert(text.includes('Phiếu xuất linh kiện bảo hành'));assert(!text.includes('Tạo phiếu nhập'));assert(!text.includes('PN-260910'));
    assert.equal(await page.locator('.warranty-table tbody tr').count(),7);
    const actions=await page.locator('.warranty-table .row-action button:first-child').allTextContents();assert.deepEqual(actions.map(x=>x.trim()),warranty.rows.map(r=>r[8]));
   }
   if(r.module==='overview'||r.module==='filter'){
    assert((await page.locator('body').innerText()).includes('Thứ Năm'));
    const dayCount=await page.locator('[data-chart-day]').count();
    const expected=r.module==='filter'?({'4':14,'5':30,'8':5}[r.state]||(['10','11','12','13'].includes(r.state)?0:7)):['loading','empty','error','permission-denied'].includes(r.state)?0:7;
    assert.equal(dayCount,expected,`${r.module}/${r.state}: number of days`);assert.equal(await page.locator('[data-stock-day]').count(),expected);
    if(r.module==='filter'&&r.state==='9')assert((await page.locator('.tooltip-card').innerText()).includes('Tồn kho: 685'));
    if(r.module==='filter'&&r.state==='7')assert(await page.locator('#apply-range').isDisabled());
   }
   checks.push({module:r.module,state:r.state,device,result:'pass'});
  }
  assert.equal(pageErrors.length,0);await context.close();
 }
 const p=await browser.newPage();await p.goto(`${base}/business-repair.html`);await p.locator('.card img').first().waitFor();assert.equal(await p.locator('.grid .card').count(),2);
 await p.getByRole('button',{name:'Xác nhận phiên',exact:true}).click();assert.equal(await p.locator('.grid .card').count(),22);
 await p.close();
}finally{await browser.close();server.close();}
await mkdir('artifacts/qa',{recursive:true});await writeFile('artifacts/qa/business-repair.json',JSON.stringify({checks,result:'pass',note:'Design fixture assertions, not production API/RBAC validation'},null,2));
console.log(`PASS: ${checks.length} native-state semantic/layout checks; fixture equations; 108 preserved source records.`);
