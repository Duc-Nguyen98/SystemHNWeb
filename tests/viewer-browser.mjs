import assert from 'node:assert/strict';
import { chromium, firefox, webkit } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { serve } from '../tools/serve.mjs';
const server = await serve(resolve('.'), 0);
const base = `http://127.0.0.1:${server.address().port}`;
const manifest = JSON.parse(await readFile('screen-manifest.json', 'utf8'));
const results = { checks: [], errors: [] };
const out = resolve('artifacts/qa'); await mkdir(out, { recursive: true });
const resultFile = process.env.QA_BROWSERS ? `results-${process.env.QA_BROWSERS.replaceAll(',', '-')}.json` : 'results.json';
const viewports = [[1920,953,1],[1366,768,1],[1024,768,1],[768,1024,1],[320,568,2],[360,800,3],[390,844,3],[430,932,3],[7680,3812,.25],[3840,1906,.5],[1536,762,1.25],[960,477,2]];
const samples = manifest.screens.filter(s => s.id === 'filter-desktop-06' || s.title.includes('OTP') && s.device === 'tablet' || s.title.includes('Đang tải') && s.device === 'tablet' || s.title.includes('Đặt lại mật khẩu') && s.device === 'desktop');
async function settled(page) { await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))); }
async function measure(page) {
  return page.evaluate(() => {
    const i = document.getElementById('frame'), s = document.getElementById('stage'), r = i.getBoundingClientRect(), v = s.getBoundingClientRect();
    return { width: r.width, height: r.height, x: r.x, y: r.y, right: r.right, bottom: r.bottom, stage: { x:v.x,y:v.y,right:v.right,bottom:v.bottom,width:s.clientWidth,height:s.clientHeight,scrollWidth:s.scrollWidth,scrollHeight:s.scrollHeight }, natural:[i.naturalWidth,i.naturalHeight], bodyOverflow: document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight, dpr:devicePixelRatio, transform:getComputedStyle(i).transform };
  });
}
function fitAssertions(m, screen) {
  assert.equal(m.bodyOverflow,false,`${screen.id}: body overflow`);
  assert.equal(m.transform,'none',`${screen.id}: transform reintroduced`);
  assert.deepEqual(m.natural,[screen.width,screen.height],`${screen.id}: wrong source`);
  assert(Math.abs(m.width/m.height - screen.width/screen.height)<.002,`${screen.id}: aspect ratio`);
  assert(m.x>=m.stage.x-1 && m.y>=m.stage.y-1 && m.right<=m.stage.right+1 && m.bottom<=m.stage.bottom+1,`${screen.id}: fit clips an edge ${JSON.stringify(m)}`);
  assert(m.stage.scrollWidth<=m.stage.width+1 && m.stage.scrollHeight<=m.stage.height+1,`${screen.id}: phantom scroll`);
  const expected = Math.min((m.stage.width-32)/screen.width,(m.stage.height-32)/screen.height,1/m.dpr);
  assert(Math.abs(m.width-screen.width*expected)<2,`${screen.id}: unnecessarily small fit`);
}
async function open(page, screen, prefix = '') {
  await page.goto(`${base}/${prefix}viewer.html?screen=${screen.id}`);
  await page.locator('#frame').waitFor({ state:'visible' }); await settled(page);
}
try {
  for (const engineName of (process.env.QA_BROWSERS || 'chromium').split(',')) {
    const browser = await ({chromium,firefox,webkit}[engineName]).launch();
    try {
      for (const [width,height,deviceScaleFactor] of viewports) {
        const context = await browser.newContext({ viewport:{width,height},deviceScaleFactor });
        const page = await context.newPage(); page.on('pageerror', e => results.errors.push(e.message));
        for (const screen of manifest.screens) {
          await open(page,screen); fitAssertions(await measure(page),screen);
          results.checks.push({ engineName,width,height,deviceScaleFactor,id:screen.id,mode:'fit' });
        }
        for (const screen of samples) {
          await open(page,screen);
          if (width===1920) await page.screenshot({path:resolve(out,`${engineName}-${screen.id}-fit.png`)});
          await page.locator('#one').click(); await settled(page);
          let m=await measure(page);
          assert(Math.abs(m.width*m.dpr-screen.width)<2,'native pixel size');
          await page.locator('#stage').evaluate(s=>s.scrollTo(0,0)); m=await measure(page);
          assert(m.x>=m.stage.x && m.y>=m.stage.y,'top/left unreachable');
          await page.locator('#stage').evaluate(s=>s.scrollTo(s.scrollWidth,s.scrollHeight)); m=await measure(page);
          assert(m.right<=m.stage.right+1 && m.bottom<=m.stage.bottom+1,'bottom/right unreachable');
          if(width===1920) await page.screenshot({path:resolve(out,`${engineName}-${screen.id}-native-end.png`)});
          assert(await page.locator('#plus').isDisabled(),'must not upscale raster');
          await page.keyboard.press('-'); await settled(page); const manual=await measure(page);
          await page.setViewportSize({width:width+100,height:height+50}); await settled(page);
          assert(Math.abs((await measure(page)).width-manual.width)<1,'resize reset manual zoom');
          await page.setViewportSize({width,height}); await page.locator('#width').click(); await settled(page);
          m=await measure(page); assert(m.width*m.dpr<=screen.width+2,'width mode upscales source');
          await page.keyboard.press('f'); await settled(page); fitAssertions(await measure(page),screen);
          await page.setViewportSize({width:height,height:width}); await settled(page); fitAssertions(await measure(page),screen);
          await page.setViewportSize({width,height});
          results.checks.push({engineName,width,height,deviceScaleFactor,id:screen.id,mode:'native/edges/zoom/resize/rotate/width/keyboard'});
        }
        console.log(`${engineName}: 84 boards + interactions at ${width}x${height} DPR ${deviceScaleFactor}`);
        await context.close();
      }
      const page=await browser.newPage({viewport:{width:1366,height:768}}); page.on('pageerror',e=>results.errors.push(e.message));
      for(const prefix of ['', 'docs/']) {
        for(const screen of manifest.screens) {await open(page,screen,prefix);fitAssertions(await measure(page),screen);results.checks.push({engineName,prefix,id:screen.id,mode:'base-path'});}
        for(const [route,hash,count] of [['index.html','auth-desktop',19],['index.html','auth-tablet',19],['index.html','overview-desktop',23],['index.html','overview-tablet',23],['previews/overview-filter-v2/index.html','desktop',13],['previews/overview-filter-v2/index.html','tablet',13]]) {
          await page.goto(`${base}/${prefix}${route}#${hash}`);
          // Same-document navigation resolves before hashchange in WebKit.
          await page.waitForFunction(expected => [...document.querySelectorAll('a.preview')].filter(a=>a.getClientRects().length>0).length===expected,count);
          const links=page.locator('a.preview:visible'); assert.equal(await links.count(),count,`hash ${route}#${hash}`);
          const popupPromise=page.waitForEvent('popup'); await links.first().click(); const popup=await popupPromise;
          await popup.locator('#frame').waitFor({state:'visible'});assert(popup.url().includes('viewer.html?screen='));
          const closing=popup.waitForEvent('close');
          // Firefox may report closure before returning the successful click.
          await popup.locator('#close').click().catch(error=>{if(!popup.isClosed())throw error;});
          await closing;
          results.checks.push({engineName,route:prefix+route,hash,mode:'navigation'});
        }
      }
      await page.goto(`${base}/viewer.html?screen=missing`); await page.getByText('Không tìm thấy màn hình.',{exact:false}).waitFor();
      assert(await page.locator('#fit').isDisabled());
      await page.route('**/previews/**',route=>route.abort());
      await page.goto(`${base}/viewer.html?screen=${samples[0].id}`); await page.waitForFunction(()=>document.getElementById('metadata').textContent==='Chưa mở được ảnh');
      assert(await page.locator('#plus').isDisabled()); await page.close();
      assert.equal(results.errors.length,0,'browser runtime errors');
    } finally {await browser.close();}
  }
} catch(error) {results.errors.push(error.stack);process.exitCode=1;console.error(error);}
finally {await writeFile(resolve(out,resultFile),JSON.stringify(results,null,2));server.close();}
console.log(`${results.errors.length?'FAIL':'PASS'}: ${results.checks.length} recorded browser checks; ${results.errors.length} errors.`);
