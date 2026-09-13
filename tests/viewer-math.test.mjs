import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fitScale, nativeScale, clampScale } from '../assets/viewer-math.mjs';
test('fit uses both available dimensions, no crop and no upscaling', () => {
  for (const [w,h] of [[1920,1080],[1600,2560],[1440,2048]]) for (const [vw,vh] of [[1920,870],[360,600],[7680,3600]]) for (const dpr of [.25,.5,1,1.25,2,3]) {
    const s = fitScale(w,h,vw,vh,dpr);
    assert(s > 0); assert(w*s <= vw-32+.0001); assert(h*s <= vh-32+.0001); assert(s*dpr <= 1);
  }
});
test('zoom-out DPR below 1 must not leave a native image four times too small', () => {
  assert.equal(nativeScale(.25),4);
  assert(fitScale(1920,1080,7680,3600,.25) > 3);
});
test('width mode preserves aspect ratio and may scroll vertically', () => {
  assert.equal(fitScale(1600,2560,1200,800,1,'width'),1168/1600);
});
test('native scale and zoom ceiling match physical pixels', () => {
  for (const dpr of [.25,.5,1,1.25,2,3]) { assert.equal(nativeScale(dpr)*dpr,1); assert.equal(clampScale(100,dpr),nativeScale(dpr)); }
});
test('unloaded/invalid sizes never produce NaN or infinity', () => {
  assert.equal(fitScale(0,1080,1920,900),0); assert.equal(fitScale(NaN,1080,1920,900),0); assert.equal(nativeScale(0),1);
});
