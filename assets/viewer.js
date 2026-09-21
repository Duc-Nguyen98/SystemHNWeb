import { fitScale, nativeScale, clampScale } from './viewer-math.mjs';

const $ = id => document.getElementById(id);
const img = $('frame'), stage = $('stage'), canvas = $('canvas');
let screen, scale = 1, mode = 'fit', ready = false, scheduled = false;
const params = new URLSearchParams(location.search);
const collection = params.get('collection') === 'drive' ? 'drive' : 'main';
const returnPage = collection === 'drive' ? 'drive-gallery.html' : 'index.html';
const dpr = () => window.devicePixelRatio || 1;
function paint(preserveCenter = false) {
  if (!ready) return;
  const stageBefore = [stage.clientWidth, stage.clientHeight];
  const previous = scale;
  const center = [(stage.scrollLeft + stage.clientWidth / 2) / previous, (stage.scrollTop + stage.clientHeight / 2) / previous];
  if (mode === 'fit' || mode === 'width') scale = fitScale(img.naturalWidth, img.naturalHeight, stage.clientWidth, stage.clientHeight, dpr(), mode);
  else if (mode === 'native') scale = nativeScale(dpr());
  else scale = clampScale(scale, dpr());
  const width = img.naturalWidth * scale, height = img.naturalHeight * scale;
  img.style.width = `${width}px`; img.style.height = `${height}px`;
  canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
  if (mode === 'fit' || mode === 'width') stage.scrollTo(0, 0);
  else if (preserveCenter) stage.scrollTo(center[0] * scale - stage.clientWidth / 2, center[1] * scale - stage.clientHeight / 2);
  $('zoom').value = `${Math.round(scale * dpr() * 100)}%`;
  $('zoom').title = 'Tỉ lệ pixel ảnh so với pixel màn hình';
  $('plus').disabled = scale >= nativeScale(dpr()) - .00001;
  $('minus').disabled = scale <= .01 * nativeScale(dpr()) + .00001;
  for (const [id, value] of [['fit', 'fit'], ['width', 'width'], ['one', 'native']]) $(id).setAttribute('aria-pressed', String(mode === value));
  $('hint').textContent = $('plus').disabled
    ? 'Đã đạt độ phân giải gốc. Cuộn để xem đủ bốn mép; không phóng vượt độ nét của ảnh. · f: vừa màn hình'
    : 'Giữ đúng tỉ lệ ảnh · f: vừa màn hình · w: vừa chiều rộng · 0: 1:1 pixel · +/−: thu phóng';
  // Toolbar/footer wrapping and scrollbars can change the available space.
  // Reconcile on the next frame, without observing the same box we resize.
  if ((mode === 'fit' || mode === 'width') && (stage.clientWidth !== stageBefore[0] || stage.clientHeight !== stageBefore[1])) onResize();
}
function selectMode(value) { mode = value; paint(); }
function zoom(factor) {
  if (!ready) return;
  const old = scale;
  const center = [(stage.scrollLeft + stage.clientWidth / 2) / old, (stage.scrollTop + stage.clientHeight / 2) / old];
  mode = 'manual'; scale = clampScale(scale * factor, dpr()); paint();
  stage.scrollTo(center[0] * scale - stage.clientWidth / 2, center[1] * scale - stage.clientHeight / 2);
}
function onResize() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => { scheduled = false; paint(true); });
}
function closeViewer() {
  // Direct links also work: navigate home if this tab was not script-opened.
  window.close();
  setTimeout(() => { if (!window.closed) location.href = new URL(returnPage, location.href).href; }, 100);
}
$('fit').onclick = () => selectMode('fit');
$('width').onclick = () => selectMode('width');
$('one').onclick = () => selectMode('native');
$('minus').onclick = () => zoom(1 / 1.25);
$('plus').onclick = () => zoom(1.25);
$('close').onclick = closeViewer;
$('fullscreen').onclick = async () => {
  try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
  catch { $('status').hidden = false; $('status').textContent = 'Trình duyệt chưa cho phép toàn màn hình. Các chế độ xem ảnh vẫn hoạt động.'; }
};
addEventListener('resize', onResize);
visualViewport?.addEventListener('resize', onResize);
document.fonts.ready.then(onResize);
document.addEventListener('fullscreenchange', () => { $('fullscreen').textContent = document.fullscreenElement ? 'Thoát toàn màn hình' : 'Toàn màn hình'; onResize(); });
addEventListener('keydown', event => {
  if (event.ctrlKey || event.metaKey || event.altKey || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
  const actions = { f: () => selectMode('fit'), w: () => selectMode('width'), '0': () => selectMode('native'), '+': () => zoom(1.25), '=': () => zoom(1.25), '-': () => zoom(1 / 1.25), Escape: () => document.fullscreenElement ? document.exitFullscreen() : closeViewer() };
  if (actions[event.key]) { event.preventDefault(); actions[event.key](); }
});
try {
  const manifestFile = collection === 'drive' ? 'drive-screen-manifest.json' : 'screen-manifest.json';
  const response = await fetch(new URL(`../${manifestFile}`, import.meta.url));
  if (!response.ok) throw new Error('Không tải được danh sách ảnh.');
  const manifest = await response.json();
  const requestedId = params.get('screen');
  const aliases = {
    'AUTH-01-dang-nhap-tablet-1440x2048': 'AUTH-01-dang-nhap-tablet-1600x2560',
    'AUTH-01-dang-nhap-loading-tablet-1440x2048': 'AUTH-01-dang-nhap-loading-tablet-1600x2560',
    'AUTH-01-dang-nhap-validation-error-tablet-1440x2048': 'AUTH-01-dang-nhap-validation-error-tablet-1600x2560'
  };
  screen = manifest.screens.find(item => item.id === (aliases[requestedId] || requestedId));
  if (!screen) throw new Error('Không tìm thấy màn hình. Vui lòng quay lại thư viện để chọn ảnh.');
  $('title').textContent = screen.title; document.title = `${screen.title} · Hoa Nam WMS`;
  img.alt = screen.title;
  img.src = new URL(`../${screen.src}`, import.meta.url).href;
  await img.decode().catch(() => { throw new Error('Không tải được ảnh gốc. Vui lòng tải lại trang hoặc quay lại thư viện.'); });
  if (img.naturalWidth !== screen.width || img.naturalHeight !== screen.height) throw new Error('Kích thước ảnh không khớp hồ sơ bàn giao. Vui lòng tải lại trang hoặc liên hệ người phụ trách thư viện.');
  const css = screen.cssWidth ? ` · ${screen.cssWidth} × ${screen.cssHeight} CSS px` : '';
  $('metadata').textContent = `${screen.device === 'desktop' ? 'Desktop ngang' : 'Tablet dọc'} · ${img.naturalWidth} × ${img.naturalHeight} px ảnh gốc${css}`;
  $('download').href = img.src; $('download').hidden = false;
  for (const id of ['fit', 'width', 'one', 'minus', 'plus', 'fullscreen']) $(id).disabled = false;
  $('fullscreen').hidden = !document.fullscreenEnabled;
  $('status').hidden = true; img.hidden = false; ready = true; paint();
} catch (error) {
  $('metadata').textContent = 'Chưa mở được ảnh';
  $('status').textContent = /^(Không |Kích thước )/.test(error.message) ? error.message : 'Không tải được ảnh. Vui lòng thử lại hoặc quay lại thư viện.';
  $('status').hidden = false;
}
