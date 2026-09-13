const tabs = [...document.querySelectorAll('[data-device]')];
const sections = [...document.querySelectorAll('section[id]')];
function showDevice() {
  const selected = ['desktop','tablet','tablet-landscape'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'desktop';
  for (const tab of tabs) { const active = tab.dataset.device === selected; tab.classList.toggle('active',active); tab.setAttribute('aria-pressed',String(active)); }
  for (const section of sections) section.hidden = section.id !== selected;
}
for (const tab of tabs) tab.addEventListener('click', () => { history.replaceState(null,'',`#${tab.dataset.device}`); showDevice(); });
addEventListener('hashchange',showDevice);
showDevice();
