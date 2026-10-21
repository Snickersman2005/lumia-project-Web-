(() => {
const KEY = 'consent';
const FONTS = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Manrope:wght@400;500;600;700;800&display=swap';
const get = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
const set = (v) => { try { localStorage.setItem(KEY, v); } catch {} };
const loadFonts = () => {
  if (document.getElementById('gfonts')) return;
  const l = document.createElement('link'); l.id = 'gfonts'; l.rel = 'stylesheet'; l.href = FONTS; document.head.appendChild(l);
};
window.CONSENT = { external: () => get() === 'all', onAccept: [] };
if (get() === 'all') loadFonts();
if (get()) return;

const { t, onChange } = window.I18N;
const box = document.createElement('div');
box.className = 'cookie'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Cookies');
const draw = () => {
  box.innerHTML = `<p>${t('cookie.text')}</p><div class="cookie__act"><button class="btn btn--ghost btn--sm" data-c="necessary">${t('cookie.reject')}</button><button class="btn btn--ghost btn--sm" data-c="all">${t('cookie.accept')}</button></div>`;
};
draw(); onChange(draw);
box.addEventListener('click', (e) => {
  const c = e.target.closest('[data-c]'); if (!c) return;
  set(c.dataset.c); box.remove();
  if (c.dataset.c === 'all') { loadFonts(); window.CONSENT.onAccept.forEach((f) => f()); }
});
document.body.appendChild(box);
})();
