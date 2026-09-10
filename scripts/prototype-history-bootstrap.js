// Runs synchronously before the static export's module router is evaluated.
// Same-document history belongs to this single-page DEMO review board.
window.addEventListener('popstate', function restorePrototypeHistory(event) {
  event.stopImmediatePropagation();
  window.dispatchEvent(new CustomEvent('hn:prototype-history'));
}, true);
