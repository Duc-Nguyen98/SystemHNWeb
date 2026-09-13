export const GUTTER = 16;
export function nativeScale(dpr = 1) {
  // Browser zoom-out can make DPR < 1. Capping it at 1 recreates tiny boards.
  return 1 / (Number.isFinite(dpr) && dpr > 0 ? dpr : 1);
}
export function fitScale(width, height, stageWidth, stageHeight, dpr = 1, mode = 'fit') {
  if (![width, height, stageWidth, stageHeight].every(v => Number.isFinite(v) && v > 0)) return 0;
  return Math.min(Math.max(1, stageWidth - 2 * GUTTER) / width,
    mode === 'width' ? Infinity : Math.max(1, stageHeight - 2 * GUTTER) / height, nativeScale(dpr));
}
export function clampScale(scale, dpr = 1) {
  return Math.min(nativeScale(dpr), Math.max(.01 * nativeScale(dpr), scale));
}
