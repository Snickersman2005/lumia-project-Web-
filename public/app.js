(() => {
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const { t, plural } = window.I18N;
const CATS = ['face', 'body', 'bikini', 'men', 'complex'];
let D;

const L = (it, f) => (window.I18N.lang !== 'cs' && it.tr?.[window.I18N.lang]?.[f]) || it[f] || '';
const money = (n) => new Intl.NumberFormat(window.I18N.locale()).format(n) + ' ' + D.settings.currency;
const fmtDate = (d, o = { weekday: 'long', day: 'numeric', month: 'long' }) => new Date(d + 'T12:00:00').toLocaleDateString(window.I18N.locale(), o);

const api = async (url, body) => {
  const r = await fetch(url, body && { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const key = 'err.' + j.code; throw Object.assign(new Error(j.code && t(key) !== key ? t(key) : t('err.generic')), { status: r.status, code: j.code }); }
  return j;
};

(async function init() {
  try { D = await api('/api/public'); } catch { document.body.insertAdjacentHTML('afterbegin', `<p style="padding:20px;text-align:center">${esc(t('err.load'))}</p>`); return; }
  renderAll();
  $('#year').textContent = new Date().getFullYear();
  loadNextSlot();
  initReveal();
  window.I18N.onChange(() => { renderAll(); if (!$('#modal').hidden) closeModal(); });
})();

let nextSlot = null;
async function loadNextSlot() {
  try {
    const svc = (D.services.find((s) => s.popular) || D.services[0]).id;
    const { days } = await api(`/api/availability?service=${svc}&specialist=any`);
    if (!days.length) return;
    const { slots } = await api(`/api/slots?service=${svc}&specialist=any&date=${days[0]}`);
    if (slots.length) { nextSlot = { date: days[0], time: slots[0].time }; drawHero(); }
  } catch {  }
}
function drawHero() {
  const r = D.reviews;
  $('#heroRating').textContent = r.length ? (r.reduce((a, x) => a + x.rating, 0) / r.length).toLocaleString(window.I18N.locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '5,0';
  if (!nextSlot) return;
  const today = new Date(); const iso = (d) => d.toLocaleDateString('en-CA');
  const tomorrow = new Date(today.getTime() + 864e5);
  const day = nextSlot.date === iso(today) ? t('today') : nextSlot.date === iso(tomorrow) ? t('tomorrow') : fmtDate(nextSlot.date, { weekday: 'short', day: 'numeric', month: 'short' });
  $('#nextSlot').textContent = day + ', ' + nextSlot.time;
}
function drawMarquee() {
  const names = D.services.map((s) => L(s, 'name'));
  const row = names.map((n) => `<span>${esc(n)}</span><i>✦</i>`).join('');
  $('#marquee').innerHTML = row + row;
}

let revealQueued = false;
function revealVisible() {
  revealQueued = false;
  const limit = innerHeight * 0.92;
  for (const el of document.querySelectorAll('.reveal:not(.is-in)')) {
    if (el.closest('.hero')) continue;
    if (el.getBoundingClientRect().top < limit) el.classList.add('is-in');
  }
}
function queueReveal() {
  if (revealQueued) return;
  revealQueued = true;
  setTimeout(revealVisible, 40);
}
function initReveal() {
  const sel = '.sec__head, .card, .promo, .feature, .person, .review, .steps li, .pgroup, .faq details, .book, .contacts > *, .ba';
  for (const el of document.querySelectorAll(sel)) {
    if (el.classList.contains('reveal')) continue;
    el.classList.add('reveal');
    el.style.setProperty('--d', (Array.prototype.indexOf.call(el.parentElement.children, el) % 6) * 70 + 'ms');
  }
  if (!initReveal.bound) {
    initReveal.bound = true;
    addEventListener('scroll', queueReveal, { passive: true });
    addEventListener('resize', queueReveal);
    addEventListener('hashchange', () => setTimeout(revealVisible, 50));
    const poll = setInterval(() => {
      revealVisible();
      if (!document.querySelector('.reveal:not(.is-in)')) clearInterval(poll);
    }, 500);
  }
  revealVisible();
}

function renderAll() {
  bindSettings(); drawHero(); drawMarquee(); renderServices(); renderPromos(); renderPrices(); renderTeam(); renderReviews(); renderFaq(); renderMap(); drawBA(); drawBooking();
  if (initReveal.bound) initReveal();
}

function bindSettings() {
  const s = D.settings;
  const vals = { ...s, city: (s.address || '').split(',').pop().replace(/\d/g, '').trim(), tel: 'tel:' + (s.phone || '').replace(/[^\d+]/g, ''), mailto: 'mailto:' + s.email };
  $$('[data-bind]').forEach((e) => { if (vals[e.dataset.bind] != null) e.textContent = vals[e.dataset.bind]; });
  $$('[data-bind-href]').forEach((e) => { const v = String(vals[e.dataset.bindHref] || ''); e.href = /^(https?:|tel:|mailto:)/i.test(v) ? v : '#'; });
  const min = Math.min(...D.services.map((x) => x.price));
  $('#minPrice').textContent = isFinite(min) ? t('from') + ' ' + money(min) : '';
  $('#freeConsult').textContent = money(0);
  $('#dicLine').textContent = s.dic ? ' · DIČ ' + s.dic : '';
  $('#vatNote').textContent = t(s.vatPayer ? 'footer.vat' : 'footer.novat');
  $('#cookieSettings').onclick = () => { try { localStorage.removeItem('consent'); } catch {} location.reload(); };
}

let activeCat = 'popular';
function renderServices() {
  const cats = [['popular', t('tab.popular')], ...CATS.filter((k) => D.services.some((s) => s.category === k)).map((k) => [k, t('cat.' + k)]), ['all', t('tab.all')]];
  $('#svcTabs').innerHTML = cats.map(([k, l]) => `<button class="tab" role="tab" aria-selected="${k === activeCat}" data-c="${k}">${esc(l)}</button>`).join('');
  $$('#svcTabs .tab').forEach((b) => b.onclick = () => { activeCat = b.dataset.c; renderServices(); });
  const list = D.services.filter((s) => activeCat === 'all' || (activeCat === 'popular' ? s.popular : s.category === activeCat));
  $('#svcGrid').innerHTML = list.map((s) => `
    <article class="card">
      ${s.oldPrice ? `<span class="badge">${t('promo')}</span>` : s.popular ? `<span class="badge">${t('hit')}</span>` : ''}
      <h3>${esc(L(s, 'name'))}</h3><p>${esc(L(s, 'short'))}</p>
      <div class="card__meta"><span class="price">${s.oldPrice ? `<s>${money(s.oldPrice)}</s>` : ''}${money(s.price)}</span><span class="dur">${s.duration} ${t('min')}</span></div>
      <div class="card__act"><button class="btn btn--ghost" data-more="${s.id}">${t('more')}</button><button class="btn" data-book="${s.id}">${t('book')}</button></div>
    </article>`).join('') || `<p class="empty">${t('empty.cat')}</p>`;
  $$('#svcGrid [data-more]').forEach((b) => b.onclick = () => openModal(b.dataset.more));
  $$('#svcGrid [data-book]').forEach((b) => b.onclick = () => startBooking(b.dataset.book));
}

function openModal(id) {
  const s = D.services.find((x) => x.id === id); if (!s) return;
  $('#modalBody').innerHTML = `
    <p class="eyebrow">${esc(t('cat.' + s.category))}</p><h3 id="mTitle">${esc(L(s, 'name'))}</h3>
    <div class="facts"><span>${s.oldPrice ? `<s>${money(s.oldPrice)}</s> ` : ''}${money(s.price)}</span><span>${s.duration} ${t('min')}</span><span>${t('course')}: ${esc(s.sessions)} ${t('sessions')}</span></div>
    <p>${esc(L(s, 'description'))}</p>
    ${L(s, 'prep') ? `<h4>${t('prep')}</h4><p>${esc(L(s, 'prep'))}</p>` : ''}${L(s, 'contra') ? `<h4>${t('contra')}</h4><p>${esc(L(s, 'contra'))}</p>` : ''}
    <button class="btn" id="mBook">${t('book.this')}</button>`;
  $('#modal').hidden = false; document.body.style.overflow = 'hidden'; $('#modalX').focus();
  $('#mBook').onclick = () => { closeModal(); startBooking(id); };
}
function closeModal() { $('#modal').hidden = true; document.body.style.overflow = ''; }
$('#modalX').onclick = closeModal;
$('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

function renderPromos() {
  $('#promos').hidden = !D.promos.length;
  $('#promoGrid').innerHTML = D.promos.map((p) => `<article class="promo"><span class="promo__badge">${esc(p.badge)}</span><h3>${esc(L(p, 'title'))}</h3><p>${esc(L(p, 'text'))}</p><a href="#booking" class="btn btn--ghost btn--sm" style="align-self:flex-start">${t('book')}</a></article>`).join('');
}

function renderPrices() {
  $('#priceList').innerHTML = CATS.map((k) => {
    const rows = D.services.filter((s) => s.category === k); if (!rows.length) return '';
    return `<div class="pgroup"><h3>${esc(t('cat.' + k))}</h3>${rows.map((s) => `<button class="prow" data-more="${s.id}"><span class="pname">${esc(L(s, 'name'))}</span><span class="pdur">${s.duration} ${t('min')}</span><span class="pdots"></span><span class="pval">${s.oldPrice ? `<s>${money(s.oldPrice)}</s>` : ''}${money(s.price)}</span></button>`).join('')}</div>`;
  }).join('');
  $$('#priceList [data-more]').forEach((b) => b.onclick = () => openModal(b.dataset.more));
}

function renderTeam() {
  $('#teamGrid').innerHTML = D.specialists.map((p) => `
    <article class="person"><div class="avatar" style="background:linear-gradient(135deg,${esc(p.color)},#261B2B)">${esc(L(p, 'name').split(' ').map((w) => w[0]).join('').slice(0, 2))}</div>
    <div class="person__b"><h3>${esc(L(p, 'name'))}</h3><div class="person__role">${esc(L(p, 'role'))}</div><p>${esc(L(p, 'bio'))}</p><span class="exp">${t('exp')} ${p.experience} ${plural(p.experience, 'year')}</span></div></article>`).join('');
}

function renderReviews() {
  const r = D.reviews;
  const avg = r.length ? (r.reduce((a, x) => a + x.rating, 0) / r.length).toFixed(1) : null;
  $('#ratingLine').textContent = avg ? t('rev.avg', { a: avg, n: r.length, w: plural(r.length, 'review') }) : '';
  $('#reviewGrid').innerHTML = r.map((x) => `<article class="review"><div class="stars" aria-label="${x.rating}/5">${'★'.repeat(x.rating)}${'☆'.repeat(5 - x.rating)}</div><p>${esc(L(x, 'text'))}</p><small><b>${esc(x.name)}</b>${L(x, 'service') ? ' · ' + esc(L(x, 'service')) : ''}</small></article>`).join('') || `<p class="empty">${t('rev.none')}</p>`;
  $('#reviewForm').onsubmit = async (e) => {
    e.preventDefault(); const f = e.target, msg = $('#reviewMsg'); msg.className = 'form__msg'; msg.textContent = '';
    try { await api('/api/reviews', Object.fromEntries(new FormData(f))); f.reset(); msg.className = 'form__msg ok'; msg.textContent = t('rev.ok'); }
    catch (er) { msg.className = 'form__msg err'; msg.textContent = er.message; }
  };
}

function renderFaq() {
  const open = $$('#faqList details').map((d) => d.open);
  $('#faqList').innerHTML = D.faq.map((f, i) => `<details${open[i] ? ' open' : ''}><summary>${esc(L(f, 'q'))}</summary><p>${esc(L(f, 'a'))}</p></details>`).join('');
}

function renderMap() {
  const { lat, lon, address, name } = D.settings;
  const q = encodeURIComponent(lat + ',' + lon);
  $('#routeGoogle').href = 'https://www.google.com/maps/dir/?api=1&destination=' + q;
  $('#routeMapy').href = `https://mapy.cz/zakladni?source=coor&id=${lon}%2C${lat}&x=${lon}&y=${lat}&z=17`;
  $('#routeApple').href = 'https://maps.apple.com/?daddr=' + q + '&q=' + encodeURIComponent(name);
  const box = $('#mapBox');
  const src = `https://maps.google.com/maps?q=${q}&z=16&hl=${window.I18N.lang}&output=embed`;
  const show = () => {
    box.innerHTML = `<iframe title="${esc(t('ct.map'))}: ${esc(address)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="${src}"></iframe><div class="map__pin" aria-hidden="true"><b>${esc(name)}</b><span>${esc(address)}</span></div>`;
    box.dataset.on = '1';
  };
  if (box.dataset.on) return;
  if (window.CONSENT.external()) return show();
  box.innerHTML = `<div class="map__ph"><span class="map__ph-pin" aria-hidden="true"></span><p><b>${esc(address)}</b></p><p>${t('map.ph')}</p><button class="btn btn--ghost btn--sm" id="mapShow">${t('map.show')}</button></div>`;
  $('#mapShow').onclick = show;
}
window.CONSENT.onAccept.push(() => { if (D && !$('#mapBox').dataset.on) renderMap(); });

const CASES = [{ k: 'ba.c1', sessions: 4, left: .06, dens: 1 }, { k: 'ba.c2', sessions: 6, left: .04, dens: 1.1 }, { k: 'ba.c3', sessions: 5, left: .05, dens: .9 }];
let baIdx = 0;
function drawSkin(cv, density, seed) {
  const c = cv.getContext('2d'), W = cv.width, H = cv.height;
  const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#F3D2C3'); g.addColorStop(1, '#E7B49F');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  const hl = c.createRadialGradient(W * .3, H * .25, 10, W * .3, H * .25, W * .6); hl.addColorStop(0, 'rgba(255,255,255,.35)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = hl; c.fillRect(0, 0, W, H);
  let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  c.lineCap = 'round';
  for (let i = 0, n = Math.round(1500 * density); i < n; i++) {
    const x = rnd() * W, y = rnd() * H, len = 14 + rnd() * 20, a = -Math.PI / 2 + (rnd() - .5) * 1.1;
    c.strokeStyle = `rgba(${60 + rnd() * 30 | 0},${40 + rnd() * 20 | 0},${35 + rnd() * 20 | 0},${.55 + rnd() * .4})`;
    c.lineWidth = .9 + rnd() * 1.2;
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a) * len * .5 + 4, y + Math.sin(a) * len * .5, x + Math.cos(a) * len, y + Math.sin(a) * len); c.stroke();
  }
}
function drawBA() {
  const photos = D.beforeAfter || [];
  if (photos.length) {
    const p = photos[Math.min(baIdx, photos.length - 1)];
    const alt = L(p, 'caption') || t('ba.h2');
    $('#baBeforeBox').innerHTML = `<img src="${esc(p.before)}" alt="${esc(t('ba.before') + ': ' + alt)}" width="${p.width}" height="${p.height}" decoding="async">`;
    $('#baAfterWrap').innerHTML = `<img src="${esc(p.after)}" alt="${esc(t('ba.photoAfter', { n: p.sessions }) + ': ' + alt)}" width="${p.width}" height="${p.height}" decoding="async">`;
    $('#ba').style.aspectRatio = p.width + '/' + p.height;
    $('#baTagAfter').textContent = t('ba.photoAfter', { n: p.sessions || 1 });
    $('#baNote').textContent = t(p.kind === 'client' ? 'ba.client' : 'ba.illustration');
    $('#baTabs').innerHTML = photos.length > 1 ? photos.map((x, i) => `<button class="tab" aria-selected="${i === baIdx}" data-i="${i}">${esc(L(x, 'caption') || String(i + 1))}</button>`).join('') : '';
  } else {
    const k = CASES[baIdx];
    drawSkin($('#baBefore'), k.dens, 1234 + baIdx * 77);
    drawSkin($('#baAfter'), k.left, 1234 + baIdx * 77);
    $('#baTagAfter').textContent = t('ba.after', { n: k.sessions });
    $('#baNote').textContent = t('ba.illustration');
    $('#baTabs').innerHTML = CASES.map((c, i) => `<button class="tab" aria-selected="${i === baIdx}" data-i="${i}">${esc(t(c.k))}</button>`).join('');
  }
  $$('#baTabs .tab').forEach((b) => b.onclick = () => { baIdx = +b.dataset.i; drawBA(); });
}
const setBA = (v) => { $('#baAfterWrap').style.clipPath = `inset(0 0 0 ${v}%)`; $('#baHandle').style.left = v + '%'; };
$('#baRange').oninput = (e) => setBA(e.target.value); setBA(50);

$('#burger').onclick = () => { const o = $('#nav').classList.toggle('open'); $('#burger').setAttribute('aria-expanded', o); };
$$('#nav a').forEach((a) => a.addEventListener('click', () => { $('#nav').classList.remove('open'); $('#burger').setAttribute('aria-expanded', false); }));
addEventListener('scroll', () => $('.header').classList.toggle('scrolled', scrollY > 10), { passive: true });

const B = { step: 1, service: null, specialist: 'any', date: null, time: null, days: [], slots: [], name: '', phone: '', email: '', comment: '', promo: '', consent: false, done: null, error: '' };
function startBooking(id) {
  Object.assign(B, { service: id, step: 2, specialist: 'any', date: null, time: null, done: null, error: '' });
  drawBooking(); $('#booking').scrollIntoView();
}
const svc = () => D?.services.find((s) => s.id === B.service);
const spById = (id) => D.specialists.find((p) => p.id === id);

function summary() {
  const s = svc(), el = $('#bookSummary');
  if (!s || B.done) { el.className = 'book__summary'; return; }
  el.className = 'book__summary show';
  el.innerHTML = `<b>${esc(L(s, 'name'))}</b> · ${money(s.price)} · ${s.duration} ${t('min')}` +
    (B.step > 2 ? ` · ${t('b.with')}: <b>${B.specialist === 'any' ? t('b.anySp') : esc(L(spById(B.specialist) || {}, 'name'))}</b>` : '') +
    (B.date && B.time ? ` · <b>${esc(fmtDate(B.date, { day: 'numeric', month: 'long' }))}, ${B.time}</b>` : '');
}

function drawBooking() {
  if (!D) return;
  $$('#bookSteps li').forEach((li) => {
    const n = +li.dataset.s; li.className = B.done ? 'done' : n === B.step ? 'active' : n < B.step ? 'done' : '';
    li.onclick = () => { if (!B.done && n < B.step) { B.step = n; drawBooking(); } };
  });
  const body = $('#bookBody');
  if (B.done) { drawDone(body); return; }
  if (B.step === 1) {
    const groups = CATS.map((k) => ({ l: t('cat.' + k), rows: D.services.filter((s) => s.category === k) })).filter((g) => g.rows.length);
    body.innerHTML = `<h3>${t('b.pick')}</h3><div class="opts">${groups.map((g) => `<div class="group-title">${esc(g.l)}</div>${g.rows.map((s) => `<button class="opt" data-id="${s.id}" aria-pressed="${s.id === B.service}"><b>${esc(L(s, 'name'))}<small>${s.duration} ${t('min')}</small></b><span>${money(s.price)}</span></button>`).join('')}`).join('')}</div>
      <div class="book__nav"><span></span><button class="btn" id="next" ${B.service ? '' : 'disabled'}>${t('b.next')}</button></div>`;
    $$('.opt', body).forEach((b) => b.onclick = () => { B.service = b.dataset.id; B.date = B.time = null; drawBooking(); });
    $('#next').onclick = () => { B.step = 2; drawBooking(); };
  } else if (B.step === 2) {
    const pool = D.specialists.filter((p) => !p.services?.length || p.services.includes(B.service));
    body.innerHTML = `<h3>${t('b.sp')}</h3><div class="opts">
      <button class="opt" data-id="any" aria-pressed="${B.specialist === 'any'}"><span class="dot" style="background:var(--grad)">★</span><b>${t('b.any')}<small>${t('b.any2')}</small></b></button>
      ${pool.map((p) => `<button class="opt" data-id="${p.id}" aria-pressed="${B.specialist === p.id}"><span class="dot" style="background:${esc(p.color)}">${esc(L(p, 'name')[0])}</span><b>${esc(L(p, 'name'))}<small>${esc(L(p, 'role'))}</small></b></button>`).join('')}</div>
      <div class="book__nav"><button class="btn btn--ghost" id="prev">${t('b.prev')}</button><button class="btn" id="next">${t('b.next')}</button></div>`;
    $$('.opt', body).forEach((b) => b.onclick = () => { B.specialist = b.dataset.id; B.date = B.time = null; drawBooking(); });
    $('#prev').onclick = () => { B.step = 1; drawBooking(); };
    $('#next').onclick = () => { B.step = 3; drawBooking(); };
  } else if (B.step === 3) drawDateTime(body);
  else drawContacts(body);
  summary();
}

async function drawDateTime(body) {
  body.innerHTML = `<h3>${t('b.dt')}</h3><div id="daysBox"><p class="empty">${t('b.loadDays')}</p></div><div id="timesBox"></div>
    <div class="book__nav"><button class="btn btn--ghost" id="prev">${t('b.prev')}</button><button class="btn" id="next" ${B.time ? '' : 'disabled'}>${t('b.next')}</button></div>`;
  $('#prev').onclick = () => { B.step = 2; drawBooking(); };
  $('#next').onclick = () => { B.step = 4; drawBooking(); };
  try {
    B.days = (await api(`/api/availability?service=${B.service}&specialist=${B.specialist}`)).days;
    const box = $('#daysBox'); if (!box || B.step !== 3) return;
    if (!B.days.length) { box.innerHTML = `<p class="empty">${t('b.noDays')}</p>`; return; }
    box.innerHTML = `<div class="days">${B.days.map((d) => `<button class="day" data-d="${d}" aria-pressed="${d === B.date}"><small>${esc(fmtDate(d, { weekday: 'short' }))}</small><b>${+d.slice(8)}</b><small>${esc(fmtDate(d, { month: 'short' }))}</small></button>`).join('')}</div>`;
    $$('.day', box).forEach((b) => b.onclick = () => { B.date = b.dataset.d; B.time = null; $$('.day', box).forEach((x) => x.setAttribute('aria-pressed', x === b)); loadTimes(); $('#next').disabled = true; summary(); });
    if (B.date) loadTimes();
  } catch (e) { const b = $('#daysBox'); if (b) b.innerHTML = `<p class="form__msg err">${esc(e.message)}</p>`; }
}
async function loadTimes() {
  const box = $('#timesBox'); box.innerHTML = `<p class="empty">${t('b.loadTimes')}</p>`;
  try {
    B.slots = (await api(`/api/slots?service=${B.service}&specialist=${B.specialist}&date=${B.date}`)).slots;
    if (!$('#timesBox')) return;
    box.innerHTML = B.slots.length ? `<div class="times">${B.slots.map((s) => `<button class="time" data-t="${s.time}" aria-pressed="${s.time === B.time}">${s.time}</button>`).join('')}</div>` : `<p class="empty">${t('b.noTimes')}</p>`;
    $$('.time', box).forEach((b) => b.onclick = () => {
      B.time = b.dataset.t; $$('.time', box).forEach((x) => x.setAttribute('aria-pressed', x === b)); $('#next').disabled = false; summary();
    });
  } catch (e) { box.innerHTML = `<p class="form__msg err">${esc(e.message)}</p>`; }
}

function drawContacts(body) {
  body.innerHTML = `<h3>${t('b.contacts')}</h3>
    <form class="form" id="bf" novalidate>
      <input name="name" placeholder="${esc(t('b.name'))}" autocomplete="name" required maxlength="80" value="${esc(B.name)}">
      <input name="phone" type="tel" placeholder="${esc(t('b.phone'))} — ${esc(t('b.phoneHint'))}" autocomplete="tel" inputmode="tel" required maxlength="30" value="${esc(B.phone)}">
      <input name="email" type="email" placeholder="${esc(t('b.email'))}" autocomplete="email" maxlength="120" value="${esc(B.email)}">
      <input name="promo" placeholder="${esc(t('b.promo'))}" maxlength="30" value="${esc(B.promo)}">
      <textarea name="comment" rows="2" placeholder="${esc(t('b.comment'))}" maxlength="500">${esc(B.comment)}</textarea>
      <input name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
      <label class="check"><input type="checkbox" name="consent" ${B.consent ? 'checked' : ''}> <span>${t('b.consentPre')} <a href="privacy/" target="_blank">${t('b.consentLink')}</a>.</span></label>
      <p class="form__msg err" id="bmsg" role="alert">${esc(B.error)}</p>
      <div class="book__nav"><button type="button" class="btn btn--ghost" id="prev">${t('b.prev')}</button><button class="btn" id="send">${t('b.confirm')}</button></div>
    </form>`;
  const f = $('#bf'), save = () => { const d = Object.fromEntries(new FormData(f)); Object.assign(B, { name: d.name || '', phone: d.phone || '', email: d.email || '', promo: d.promo || '', comment: d.comment || '', consent: !!d.consent }); return d; };
  $('#prev').onclick = () => { save(); B.step = 3; B.error = ''; drawBooking(); };
  f.onsubmit = async (e) => {
    e.preventDefault(); const d = save(), btn = $('#send'), msg = $('#bmsg'); msg.textContent = ''; B.error = '';
    if (d.name.trim().length < 2) return (msg.textContent = t('err.name'));
    if (d.phone.replace(/\D/g, '').length < 9) return (msg.textContent = t('err.phone'));
    if (!B.consent) return (msg.textContent = t('err.consent'));
    btn.disabled = true; btn.textContent = t('b.sending');
    try {
      const r = await api('/api/bookings', { serviceId: B.service, specialistId: B.specialist, date: B.date, time: B.time, ...d, consent: true, lang: window.I18N.lang });
      B.done = r.booking; drawBooking(); $('#booking').scrollIntoView();
    } catch (er) {
      btn.disabled = false; btn.textContent = t('b.confirm');
      if (er.status === 409) { B.error = er.message; B.time = null; B.step = 3; drawBooking(); } else msg.textContent = er.message;
    }
  };
}

const stamp = (d, tm) => d.replaceAll('-', '') + 'T' + tm.replace(':', '') + '00';
function drawDone(body) {
  const b = B.done, s = D.services.find((x) => x.id === b.serviceId) || {}, p = spById(b.specialistId) || {};
  const sName = L(s, 'name'), pName = L(p, 'name'), title = `${sName} — ${D.settings.name}`;
  const gcal = 'https://calendar.google.com/calendar/render?' + new URLSearchParams({
    action: 'TEMPLATE', text: title, dates: `${stamp(b.date, b.start)}/${stamp(b.date, b.end)}`, ctz: b.timezone,
    details: t('done.details', { sp: pName, phone: D.settings.phone }), location: b.address
  });
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//LUMIA//CS', 'BEGIN:VEVENT', `UID:${b.id}@lumia`, `DTSTAMP:${new Date().toISOString().replace(/[-:]|\.\d+/g, '')}`,
    `DTSTART;TZID=${b.timezone}:${stamp(b.date, b.start)}`, `DTEND;TZID=${b.timezone}:${stamp(b.date, b.end)}`, `SUMMARY:${title}`, `LOCATION:${b.address.replace(/,/g, '\\,')}`,
    'BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY', `DESCRIPTION:${t('done.alarm')}`, 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  body.innerHTML = `<div class="fin"><div class="tick">✓</div><h3>${t('done.h')}</h3>
    <p>${t('done.p')}</p>
    <dl><dt>${t('done.svc')}</dt><dd>${esc(sName)}</dd><dt>${t('done.sp')}</dt><dd>${esc(pName)}</dd><dt>${t('done.when')}</dt><dd>${esc(fmtDate(b.date))}, ${b.start}</dd><dt>${t('done.where')}</dt><dd>${esc(b.address)}</dd></dl>
    <p class="fin__manage"><a href="/manage.html?id=${encodeURIComponent(b.id)}&t=${encodeURIComponent(b.token)}&lang=${window.I18N.lang}">${t('done.manage')}</a><br><small>${t('done.manageHint')}</small></p>
    <div class="fin__act"><a class="btn" target="_blank" rel="noopener" href="${esc(gcal)}">${t('done.gcal')}</a>
    <a class="btn btn--ghost" download="lumia-booking.ics" href="data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}">${t('done.ics')}</a>
    <button class="btn btn--ghost" id="again">${t('done.again')}</button></div></div>`;
  $('#again').onclick = () => { Object.assign(B, { step: 1, service: null, specialist: 'any', date: null, time: null, done: null, error: '' }); drawBooking(); };
  $('#bookSummary').className = 'book__summary';
}
})();

if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => document.querySelector('.sticky-cta').classList.toggle('is-hidden', e.isIntersecting), { threshold: 0.15 }).observe(document.querySelector('#booking'));
