(() => {
const $ = (s, r = document) => r.querySelector(s);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const { t } = window.I18N;
const q = new URLSearchParams(location.search), id = q.get('id'), token = q.get('t');
let data, pub, view = 'main', newDate = null, newTime = null, msg = '', err = '', erased = false;
const L = (it, f) => (window.I18N.lang !== 'cs' && it.tr?.[window.I18N.lang]?.[f]) || it[f] || '';
const fmt = (d, o) => new Date(d + 'T12:00:00').toLocaleDateString(window.I18N.locale(), o || { weekday: 'long', day: 'numeric', month: 'long' });
const call = async (path, body, extra = '') => {
  const opt = body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, token, ...body }) } : undefined;
  const r = await fetch(path + (body ? '' : `?id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}${extra}`), opt);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.code ? t('err.' + j.code) : t('err.generic')), { code: j.code });
  return j;
};

async function init() {
  try { pub = await (await fetch('/api/public')).json(); } catch {  }
  try { data = await call('/api/manage'); } catch (e) { err = e.message; }
  draw(); window.I18N.onChange(draw);
}

function draw() {
  const box = $('#mg');
  if (erased) { box.innerHTML = `<p class="form__msg ok" role="status">${esc(t('mg.erased'))}</p>`; return; }
  if (err && !data) { box.innerHTML = `<p class="form__msg err">${esc(err)}</p>`; return; }
  const b = data.booking, s = pub?.services.find((x) => x.id === b.serviceId) || {}, p = pub?.specialists.find((x) => x.id === b.specialistId) || {};
  const status = b.status === 'cancelled' || b.status === 'done' ? t('mg.status.' + b.status) : '';
  let html = `<div class="fin" style="padding-top:0"><h3>${esc(L(s, 'name'))}</h3>
    <dl><dt>${t('done.sp')}</dt><dd>${esc(L(p, 'name'))}</dd><dt>${t('mg.when')}</dt><dd>${esc(fmt(b.date))}, ${b.start}</dd><dt>${t('done.where')}</dt><dd>${esc(b.address)}</dd></dl>
    ${status ? `<p><b>${esc(status)}</b></p>` : ''}</div>`;
  if (msg) html += `<p class="form__msg ok" role="status">${esc(msg)}</p>`;
  if (err) html += `<p class="form__msg err" role="alert">${esc(err)}</p>`;
  if (!['new', 'confirmed'].includes(b.status)) {  }
  else if (!data.editable) html += `<p class="empty">${t('mg.late', { phone: esc(b.phone) })}</p>`;
  else if (view === 'main') html += `<div class="fin__act"><button class="btn" id="chg">${t('mg.change')}</button><button class="btn btn--ghost" id="can">${t('mg.cancel')}</button></div>`;
  else html += `<h3 style="margin:22px 0 10px">${t('mg.pickDate')}</h3><div id="days"><p class="empty">${t('b.loadDays')}</p></div><div id="times"></div>
    <div class="book__nav"><button class="btn btn--ghost" id="back">${t('b.prev')}</button><button class="btn" id="sv" ${newTime ? '' : 'disabled'}>${t('mg.save')}</button></div>`;

  if (view === 'main') html += `<p class="erase"><button class="linklike" id="erase">${t('mg.erase')}</button></p>`;
  box.innerHTML = html;
  const run = (fn) => async () => { err = ''; msg = ''; try { await fn(); } catch (e) { err = e.message; if (e.code === 'late') data.editable = false; } draw(); };
  if ($('#chg')) $('#chg').onclick = () => { view = 'pick'; newDate = newTime = null; err = ''; msg = ''; draw(); loadDays(); };
  if ($('#can')) $('#can').onclick = run(async () => { if (!confirm(t('mg.confirmCancel'))) return; await call('/api/manage/cancel', {}); data = await call('/api/manage'); msg = t('mg.cancelled'); });
  if ($('#erase')) $('#erase').onclick = run(async () => { if (!confirm(t('mg.confirmErase'))) return; await call('/api/manage/erase', {}); erased = true; });
  if ($('#back')) $('#back').onclick = () => { view = 'main'; draw(); };
  if ($('#sv')) $('#sv').onclick = run(async () => { await call('/api/manage/reschedule', { date: newDate, time: newTime }); data = await call('/api/manage'); view = 'main'; msg = t('mg.rescheduled'); });
}

async function loadDays() {
  const box = $('#days'); if (!box) return;
  try {
    const { days } = await call('/api/manage/days', null, '');
    if (!days.length) { box.innerHTML = `<p class="empty">${t('b.noDays')}</p>`; return; }
    box.innerHTML = `<div class="days">${days.map((d) => `<button class="day" data-d="${d}" aria-pressed="${d === newDate}"><small>${esc(fmt(d, { weekday: 'short' }))}</small><b>${+d.slice(8)}</b><small>${esc(fmt(d, { month: 'short' }))}</small></button>`).join('')}</div>`;
    box.querySelectorAll('.day').forEach((b) => (b.onclick = () => { newDate = b.dataset.d; newTime = null; box.querySelectorAll('.day').forEach((x) => x.setAttribute('aria-pressed', x === b)); loadTimes(); const sv = $('#sv'); if (sv) sv.disabled = true; }));
  } catch (e) { box.innerHTML = `<p class="form__msg err">${esc(e.message)}</p>`; }
}
async function loadTimes() {
  const box = $('#times'); box.innerHTML = `<p class="empty">${t('b.loadTimes')}</p>`;
  try {
    const { slots } = await call('/api/manage/slots', null, '&date=' + newDate);
    box.innerHTML = slots.length ? `<div class="times">${slots.map((s) => `<button class="time" data-t="${s.time}" aria-pressed="false">${s.time}</button>`).join('')}</div>` : `<p class="empty">${t('b.noTimes')}</p>`;
    box.querySelectorAll('.time').forEach((b) => (b.onclick = () => { newTime = b.dataset.t; box.querySelectorAll('.time').forEach((x) => x.setAttribute('aria-pressed', x === b)); $('#sv').disabled = false; }));
  } catch (e) { box.innerHTML = `<p class="form__msg err">${esc(e.message)}</p>`; }
}
init();
})();
