import { chromium,firefox,webkit } from 'playwright';
import assert from 'node:assert/strict';
import { readFile,writeFile,mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { serve } from '../tools/serve.mjs';
const server=await serve(resolve('.'),0),base=`http://127.0.0.1:${server.address().port}`;
const manifest=JSON.parse(await readFile('screen-manifest.json','utf8')),screen=manifest.screens.find(s=>s.id==='filter-desktop-06');
const report=[];
try {
  for(const name of (process.env.QA_BROWSERS || 'chromium,firefox,webkit').split(',')) {
    const engine={chromium,firefox,webkit}[name];
    const browser=await engine.launch();
    try {
      const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
      await page.goto(`${base}/viewer.html?screen=${screen.id}`);await page.locator('#frame').waitFor({state:'visible'});
      const downloadPromise=page.waitForEvent('download');await page.locator('#download').click();const download=await downloadPromise;
      const bytes=await readFile(await download.path());assert.equal(createHash('sha256').update(bytes).digest('hex'),screen.sha256);
      await page.locator('#plus').click();assert.equal(await page.locator('#fit').getAttribute('aria-pressed'),'false');
      await page.keyboard.press('0');await page.waitForFunction(()=>document.getElementById('plus').disabled);
      await page.keyboard.press('f');assert.equal(await page.locator('#fit').getAttribute('aria-pressed'),'true');
      let fullscreen='not supported';
      if(await page.evaluate(()=>document.fullscreenEnabled)) {
        await page.locator('#fullscreen').click();await page.waitForFunction(()=>!!document.fullscreenElement);
        await page.locator('#fullscreen').click();await page.waitForFunction(()=>!document.fullscreenElement);fullscreen='passed';
      }
      await page.route('**/screen-manifest.json',route=>route.fulfill({json:{...manifest,screens:manifest.screens.map(s=>s.id===screen.id?{...s,width:s.width+1}:s)}}));
      await page.reload();await page.getByText('Kích thước ảnh không khớp hồ sơ bàn giao.',{exact:false}).waitFor();assert(await page.locator('#fit').isDisabled());
      await page.unroute('**/screen-manifest.json');
      await page.goto(`${base}/previews/overview-filter-v2/index.html#tablet`);assert.equal(await page.locator('a.preview:visible').count(),13);
      await page.getByRole('button',{name:'Desktop ngang',exact:false}).click();assert.equal(await page.locator('#tablet').isVisible(),false);
      report.push({engine:name,fullscreen,downloadHash:'passed',keyboard:'passed',reducedMotion:'passed',dimensionMismatch:'blocked',deviceTabs:'passed'});
    }finally{await browser.close();}
  }
}finally{server.close();await mkdir('artifacts/qa',{recursive:true});await writeFile('artifacts/qa/controls.json',JSON.stringify(report,null,2));}
console.log(JSON.stringify(report,null,2));
