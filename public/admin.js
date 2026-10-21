(() => {
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const DAYS = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
const STATUS = { new: 'Новая', confirmed: 'Подтверждена', done: 'Выполнена', cancelled: 'Отменена', noshow: 'Не пришёл' };
const CATS = { face: 'Лицо', body: 'Тело', bikini: 'Бикини', men: 'Мужские', complex: 'Комплексы' };
let D, tab = 'bookings', filter = 'active';
const ERRORS = {
  auth: 'Неверный пароль или сессия истекла', toomany: 'Слишком много попыток — подождите 15 минут',
  consent: 'Для фото клиентки нужна отметка о письменном согласии и где оно хранится', image: 'Файл не является корректным JPEG/PNG',
  too_big: 'Слишком большой файл', taken: 'Это время уже занято другой записью', email: 'Некорректный e-mail',
  timezone: 'Неизвестный часовой пояс', not_found: 'Не найдено', origin: 'Запрос отклонён (другой источник)', server: 'Ошибка сервера'
};

async function api(method, url, body) {
  const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 && url !== '/api/admin/login') { D = null; renderLogin(); throw new Error('Требуется вход'); }
  if (!r.ok) throw new Error(ERRORS[j.code] || 'Ошибка запроса');
  return j;
}
function toast(t, err) { const m = $('#msg'); m.textContent = t; m.className = 'msg' + (err ? ' err' : ''); m.style.display = 'block'; clearTimeout(toast.t); toast.t = setTimeout(() => (m.style.display = 'none'), 2600); }
const guard = (fn) => async (...a) => { try { await fn(...a); } catch (e) { toast(e.message, true); } };

async function load() { D = await api('GET', '/api/admin/data'); render(); }
function renderLogin() {
  $('#app').innerHTML = `<form class="login" id="lf"><h2>LUMIA · вход</h2><input type="password" name="password" placeholder="Пароль администратора" autofocus required><button class="btn">Войти</button></form>`;
  $('#lf').onsubmit = guard(async (e) => { e.preventDefault(); await api('POST', '/api/admin/login', { password: e.target.password.value }); await load(); });
}

const SECTIONS = {
  services: { title: 'Процедуры и цены', label: (s) => s.name, sub: (s) => `${Intl.NumberFormat('ru-RU').format(s.price)} ${D.settings.currency} · ${s.duration} мин`, off: (s) => !s.active,
    blank: { category: 'body', name: 'Nová procedura', price: 1000, oldPrice: 0, duration: 30, sessions: '6–8', popular: false, active: true, short: '', description: '', prep: '', contra: '' },
    fields: [['name', 'Название (CS)'], ['category', 'Категория', 'select', CATS], ['price', 'Цена', 'number'], ['oldPrice', 'Старая цена (0 — нет)', 'number'], ['duration', 'Длительность, мин', 'number'], ['sessions', 'Сеансов в курсе'],
      ['short', 'Короткое описание', 'text', null, 1], ['description', 'Подробное описание', 'textarea', null, 1], ['prep', 'Подготовка', 'textarea', null, 1], ['contra', 'Противопоказания', 'textarea', null, 1], ['popular', 'Показывать как «Хит»', 'checkbox'], ['active', 'Показывать на сайте', 'checkbox']] },
  specialists: { title: 'Специалисты и расписание', label: (s) => s.name, sub: (s) => s.role, off: (s) => !s.active,
    blank: { name: 'Nový specialista', role: 'Laserová kosmetička', experience: 1, color: '#C9857A', bio: '', active: true, services: [], schedule: ['', '10:00-19:00', '10:00-19:00', '10:00-19:00', '10:00-19:00', '10:00-19:00', ''], daysOff: [] },
    fields: [['name', 'Имя'], ['role', 'Должность'], ['experience', 'Опыт, лет', 'number'], ['color', 'Цвет', 'color'], ['bio', 'О мастере', 'textarea', null, 1], ['active', 'Принимает записи', 'checkbox'], ['schedule', 'График (ЧЧ:ММ-ЧЧ:ММ, пусто — выходной)', 'schedule'],
      ['daysOff', 'Выходные даты (ГГГГ-ММ-ДД через запятую)', 'dates'], ['services', 'Выполняет процедуры (ничего не выбрано — все)', 'services']] },
  promos: { title: 'Акции', label: (p) => p.title, sub: (p) => p.badge, off: (p) => !p.active, blank: { title: 'Nová akce', text: '', badge: '−10%', active: true },
    fields: [['title', 'Заголовок'], ['badge', 'Бейдж'], ['text', 'Описание', 'textarea', null, 1], ['active', 'Показывать на сайте', 'checkbox']] },
  reviews: { title: 'Отзывы', label: (r) => `${r.name} · ${'★'.repeat(r.rating)}`, sub: (r) => (r.approved ? '' : 'на модерации'), off: (r) => !r.approved, pending: (r) => !r.approved,
    blank: { name: 'Klient', rating: 5, service: '', text: 'Skvělý servis!', date: new Date().toISOString().slice(0, 10), approved: true },
    fields: [['name', 'Имя'], ['service', 'Процедура'], ['rating', 'Оценка (1–5)', 'number'], ['date', 'Дата (ГГГГ-ММ-ДД)'], ['text', 'Текст', 'textarea', null, 1], ['approved', 'Опубликован', 'checkbox']] },
  faq: { title: 'Вопросы и ответы', label: (f) => f.q, sub: () => '', blank: { q: 'Nová otázka', a: '' }, fields: [['q', 'Вопрос', 'text', null, 1], ['a', 'Ответ', 'textarea', null, 1]] }
};

const TRF = { services: ['name', 'short', 'description', 'prep', 'contra'], specialists: ['name', 'role', 'bio'], promos: ['title', 'text'], reviews: ['service', 'text'], faq: ['q', 'a'] };
const TL = { ru: 'Русский', uk: 'Українська', en: 'English' };
function trHTML(key, sec, it) {
  if (!TRF[key]) return '';
  return '<details class="f wide trbox"><summary>Переводы: RU / UK / EN (пустое поле — показывается чешский)</summary>' + Object.entries(TL).map(([l, ln]) => '<div class="trlang"><b>' + ln + '</b>' + TRF[key].map((k) => {
    const def = sec.fields.find((f) => f[0] === k), v = it.tr?.[l]?.[k] ?? '';
    return '<div class="f"><label>' + def[1] + '</label>' + (def[2] === 'textarea' ? '<textarea data-tr="' + l + '.' + k + '" rows="2">' + esc(v) + '</textarea>' : '<input data-tr="' + l + '.' + k + '" value="' + esc(v) + '">') + '</div>';
  }).join('') + '</div>').join('') + '</details>';
}
function fieldHTML(sec, f, it) {
  const [k, label, type = 'text', opts, wide] = f, v = it[k];
  const w = wide ? ' wide' : '';
  if (type === 'checkbox') return `<div class="f chk"><input type="checkbox" name="${k}" id="${it.id}${k}" ${v ? 'checked' : ''}><label for="${it.id}${k}">${label}</label></div>`;
  if (type === 'textarea') return `<div class="f${w}"><label>${label}</label><textarea name="${k}" rows="3">${esc(v)}</textarea></div>`;
  if (type === 'select') return `<div class="f"><label>${label}</label><select name="${k}">${Object.entries(opts).map(([a, b]) => `<option value="${a}" ${a === v ? 'selected' : ''}>${b}</option>`).join('')}</select></div>`;
  if (type === 'schedule') return `<div class="f wide"><label>${label}</label><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px">${[1, 2, 3, 4, 5, 6, 0].map((d) => `<div><small>${DAYS[d]}</small><input data-day="${d}" placeholder="выходной" value="${esc(v[d])}"></div>`).join('')}</div></div>`;
  if (type === 'dates') return `<div class="f wide"><label>${label}</label><input name="${k}" value="${esc((v || []).join(', '))}"></div>`;
  if (type === 'services') return `<div class="f wide"><label>${label}</label><div class="checks">${D.services.map((s) => `<label><input type="checkbox" data-svc="${s.id}" ${(v || []).includes(s.id) ? 'checked' : ''}>${esc(s.name)}</label>`).join('')}</div></div>`;
  return `<div class="f${w}"><label>${label}</label><input name="${k}" type="${type}" value="${esc(v)}"></div>`;
}
function readForm(sec, form, it) {
  const out = {};
  for (const [k, , type = 'text'] of sec.fields) {
    if (type === 'checkbox') out[k] = form.elements[k].checked;
    else if (type === 'schedule') { out[k] = [0, 1, 2, 3, 4, 5, 6].map((d) => $(`[data-day="${d}"]`, form).value.trim()); }
    else if (type === 'dates') out[k] = form.elements[k].value.split(/[\s,;]+/).filter(Boolean);
    else if (type === 'services') out[k] = $$('[data-svc]:checked', form).map((x) => x.dataset.svc);
    else out[k] = form.elements[k].value;
  }
  const tr = $$('[data-tr]', form);
  if (tr.length) { out.tr = {}; tr.forEach((el) => { const [l, k] = el.dataset.tr.split('.'); (out.tr[l] = out.tr[l] || {})[k] = el.value; }); }
  return out;
}

function renderCollection(key) {
  const sec = SECTIONS[key];
  const items = D[key].slice().sort((a, b) => (key === 'reviews' ? b.date.localeCompare(a.date) : 0));
  return `<h2>${sec.title}</h2><div class="row"><button class="btn" id="add">+ Добавить</button><span style="color:var(--muted)">Основной язык сайта — чешский. Переводы на RU/UK/EN — внутри каждой записи.</span></div>` + items.map((it) => `
    <details class="item" data-id="${it.id}"><summary><b>${esc(sec.label(it))}</b><small>${esc(sec.sub(it))}</small>${sec.pending?.(it) ? '<span class="pill new">Модерация</span>' : sec.off?.(it) ? '<span class="pill off">скрыто</span>' : ''}</summary>
    <form>${sec.fields.map((f) => fieldHTML(sec, f, it)).join('')}${trHTML(key, sec, it)}<div class="acts"><button class="btn" type="submit">Сохранить</button>${key === 'reviews' && !it.approved ? '<button class="btn ghost" type="button" data-approve>Опубликовать</button>' : ''}<button class="btn danger sm" type="button" data-del>Удалить</button></div></form></details>`).join('');
}
function bindCollection(key) {
  const sec = SECTIONS[key];
  $('#add').onclick = guard(async () => { await api('POST', `/api/admin/${key}`, sec.blank); await load(); toast('Добавлено — откройте и отредактируйте'); });
  $$('.item').forEach((el) => {
    const it = D[key].find((x) => x.id === el.dataset.id), form = $('form', el);
    form.onsubmit = guard(async (e) => { e.preventDefault(); await api('PUT', `/api/admin/${key}/${it.id}`, readForm(sec, form, it)); await load(); toast('Сохранено'); });
    $('[data-del]', el).onclick = guard(async () => { if (confirm('Удалить безвозвратно?')) { await api('DELETE', `/api/admin/${key}/${it.id}`); await load(); toast('Удалено'); } });
    const ap = $('[data-approve]', el); if (ap) ap.onclick = guard(async () => { await api('PUT', `/api/admin/reviews/${it.id}`, { approved: true }); await load(); toast('Опубликовано'); });
  });
}

function renderBookings() {
  const svc = (id) => D.services.find((s) => s.id === id)?.name || '—', sp = (id) => D.specialists.find((s) => s.id === id)?.name || '—';
  const all = D.bookings.slice().sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  const rows = all.filter((b) => filter === 'all' || (filter === 'active' ? ['new', 'confirmed'].includes(b.status) : b.status === filter));
  const g = D.gcal;
  return `<h2>Заявки и записи</h2>
    <div class="note">Google Calendar: ${g.enabled ? '<b class="g-ok">подключён</b> — записи добавляются автоматически, отмена удаляет событие.' : `<b class="g-bad">не подключён</b> — ${!g.hasCreds ? 'положите JSON сервисного аккаунта в <code>data/google-service-account.json</code>' : 'укажите ID календаря в «Настройках»'}. Инструкция в README.`}</div>
    <div class="row"><a class="btn ghost sm" href="/api/admin/export.csv" download>Экспорт CSV (Excel)</a><button class="btn ghost sm" id="ret">Обезличить записи старше ${D.retentionMonths} мес.</button></div>
    <div class="row"><select id="flt" style="width:auto"><option value="active">Активные</option><option value="all">Все</option>${Object.entries(STATUS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select><span>${rows.length} из ${all.length}</span></div>
    <div class="tw"><table><tr><th>Когда</th><th>Клиент</th><th>Процедура / мастер</th><th>Статус</th><th>Календарь</th><th></th></tr>
    ${rows.map((b) => `<tr data-id="${b.id}"><td><b>${esc(b.date)}</b><br>${esc(b.start)}–${esc(b.end)}</td>
      <td>${b.anonymized ? '<small>обезличено (GDPR)</small><br>' : ''}${esc(b.name)}<br><a href="tel:${esc(b.phone)}">${esc(b.phone)}</a>${b.email ? `<br><small>${esc(b.email)}</small>` : ''}${b.comment ? `<br><small>«${esc(b.comment)}»</small>` : ''}${b.promo ? `<br><small>промокод: ${esc(b.promo)}</small>` : ''}</td>
      <td>${esc(svc(b.serviceId))}<br><small>${esc(sp(b.specialistId))}</small></td>
      <td><select data-st style="width:auto">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${k === b.status ? 'selected' : ''}>${v}</option>`).join('')}</select></td>
      <td>${b.gcalEventId ? '<span class="g-ok">✓</span>' : b.gcalError ? `<span class="g-bad" title="${esc(b.gcalError)}">ошибка</span>` : '—'}</td>
      <td><button class="btn danger sm" data-del>×</button></td></tr>`).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--muted)">Нет записей</td></tr>'}</table></div>`;
}
function bindBookings() {
  $('#ret').onclick = guard(async () => { const r = await api('POST', '/api/admin/retention', {}); await load(); toast('Обезличено записей: ' + r.anonymized); });
  $('#flt').value = filter; $('#flt').onchange = (e) => { filter = e.target.value; render(); };
  $$('tr[data-id]').forEach((tr) => {
    $('[data-st]', tr).onchange = guard(async (e) => { await api('PUT', `/api/admin/bookings/${tr.dataset.id}`, { status: e.target.value }); await load(); toast('Статус обновлён'); });
    $('[data-del]', tr).onclick = guard(async () => { if (confirm('Удалить запись (и событие в календаре)?')) { await api('DELETE', `/api/admin/bookings/${tr.dataset.id}`); await load(); } });
  });
}

function renderSettings() {
  const s = D.settings, f = (k, l, t = 'text', wide) => `<div class="f${wide ? ' wide' : ''}"><label>${l}</label><input name="${k}" type="${t}" value="${esc(s[k])}"></div>`;
  return `<h2>Настройки</h2><form class="item" id="sf" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;padding:18px">
    ${f('name', 'Название')}${f('phone', 'Телефон')}${f('email', 'Email')}${f('address', 'Адрес', 'text', 1)}${f('hours', 'Часы работы (например 10:00 – 21:00)')}
    ${f('companyName', 'Юр. лицо (s.r.o. / OSVČ)')}${f('ico', 'IČO (8 цифр)')}${f('dic', 'DIČ (если есть)')}
    <div class="f chk"><input type="checkbox" id="vatPayer" name="vatPayer" ${s.vatPayer ? 'checked' : ''}><label for="vatPayer">Плательщик DPH (на сайте: «ceny vč. DPH»)</label></div>
    <div class="f chk"><input type="checkbox" id="closedOnHolidays" name="closedOnHolidays" ${s.closedOnHolidays !== false ? 'checked' : ''}><label for="closedOnHolidays">Закрыто в госпраздники ЧР (запись недоступна)</label></div>
    ${f('lat', 'Широта (карта)')}${f('lon', 'Долгота (карта)')}${f('instagram', 'Instagram (ссылка)')}${f('telegram', 'Telegram (ссылка)')}${f('currency', 'Валюта')}${f('timezone', 'Часовой пояс (IANA)')}
    <div class="f"><label>Шаг записи, мин</label><select name="slotStep">${[15, 30, 60].map((n) => `<option ${n === s.slotStep ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
    ${f('leadHours', 'Запись не ближе, чем за (часов)', 'number')}${f('horizonDays', 'Запись открыта на (дней вперёд)', 'number')}
    ${f('googleCalendarId', 'ID Google Календаря (или переменная GOOGLE_CALENDAR_ID)', 'text', 1)}${f('notifyTelegramChatId', 'Telegram chat ID для уведомлений (нужен TELEGRAM_BOT_TOKEN)', 'text', 1)}
    <div class="acts"><button class="btn">Сохранить</button></div></form>
    ${D.gcal.email ? `<p class="note">Для интеграции предоставьте доступ «Вносить изменения в мероприятия» для <b>${esc(D.gcal.email)}</b> в настройках вашего Google Календаря.</p>` : ''}`;
}
function bindSettings() {
  $('#sf').onsubmit = guard(async (e) => { e.preventDefault(); const d = Object.fromEntries(new FormData(e.target)); d.vatPayer = e.target.vatPayer.checked; d.closedOnHolidays = e.target.closedOnHolidays.checked; await api('PUT', '/api/admin/settings', d); await load(); toast('Настройки сохранены'); });
}

const readFile = (input) => new Promise((resolve, reject) => {
  const f = input.files[0];
  if (!f) return reject(new Error('Выберите оба файла'));
  if (!/^image\/(jpeg|png)$/.test(f.type)) return reject(new Error('Только JPEG или PNG'));
  if (f.size > 4 * 1024 * 1024) return reject(new Error('Файл больше 4 МБ'));
  const r = new FileReader();
  r.onload = () => resolve(String(r.result).split(',')[1]);
  r.onerror = () => reject(new Error('Не удалось прочитать файл'));
  r.readAsDataURL(f);
});
function renderBA() {
  const items = D.beforeAfter || [];
  return `<h2>До / После</h2>
    <p class="note">Фото клиентов публикуются <b>только с письменного согласия</b> (GDPR, ст. 9). Метаданные EXIF (геолокация, модель телефона) удаляются автоматически. Пара снимков должна быть сделана с одного ракурса и при одинаковом свете.</p>
    <form class="item" id="baf" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;padding:18px">
      <div class="f"><label>Фото «до» (JPEG/PNG, до 4 МБ)</label><input type="file" name="before" accept="image/jpeg,image/png" required></div>
      <div class="f"><label>Фото «после»</label><input type="file" name="after" accept="image/jpeg,image/png" required></div>
      <div class="f"><label>Подпись (CS)</label><input name="caption" maxlength="120" placeholder="Podpaží"></div>
      <div class="f"><label>После сеанса №</label><input name="sessions" type="number" min="1" max="20" value="4"></div>
      <div class="f"><label>Тип</label><select name="kind"><option value="client">Фото клиентки</option><option value="illustration">Иллюстрация</option></select></div>
      <div class="f wide"><label>Согласие: где хранится (например «písemný souhlas č. 12/2026»)</label><input name="consentNote" maxlength="200"></div>
      <div class="f chk"><input type="checkbox" id="baConsent" name="consent"><label for="baConsent">Есть письменное согласие клиентки на публикацию</label></div>
      <div class="f chk"><input type="checkbox" id="baPub" name="published" checked><label for="baPub">Сразу опубликовать</label></div>
      <div class="acts"><button class="btn">Загрузить</button></div>
    </form>
    ${items.map((x) => `<div class="item" data-id="${x.id}" style="display:flex;gap:14px;align-items:center;padding:12px 16px">
      <img src="${esc(x.before)}" alt="" width="96" height="60" style="object-fit:cover"><img src="${esc(x.after)}" alt="" width="96" height="60" style="object-fit:cover">
      <div style="flex:1"><b>${esc(x.caption || '—')}</b><br><small>${x.kind === 'client' ? 'клиентка · ' + esc(x.consentNote) : 'иллюстрация'} · сеанс ${x.sessions}</small></div>
      <button class="btn ghost sm" data-pub>${x.published ? 'Скрыть' : 'Опубликовать'}</button><button class="btn danger sm" data-del>×</button></div>`).join('') || '<p class="note">Пока нет фото — на сайте показывается иллюстрация.</p>'}`;
}
function bindBA() {
  $('#baf').onsubmit = guard(async (e) => {
    e.preventDefault();
    const f = e.target;
    const [before, after] = await Promise.all([readFile(f.before), readFile(f.after)]);
    await api('POST', '/api/admin/before-after', { before, after, caption: f.caption.value, sessions: +f.sessions.value, kind: f.kind.value,
      consentNote: f.consentNote.value, consent: f.consent.checked, published: f.published.checked });
    await load(); toast('Загружено');
  });
  $$('[data-id]').forEach((el) => {
    const it = D.beforeAfter.find((x) => x.id === el.dataset.id);
    $('[data-pub]', el).onclick = guard(async () => { await api('PUT', '/api/admin/beforeAfter/' + it.id, { published: !it.published }); await load(); });
    $('[data-del]', el).onclick = guard(async () => { if (confirm('Удалить фото безвозвратно?')) { await api('DELETE', '/api/admin/beforeAfter/' + it.id); await load(); } });
  });
}

function render() {
  if (!D) return renderLogin();
  const newCnt = D.bookings.filter((b) => b.status === 'new').length, revCnt = D.reviews.filter((r) => !r.approved).length;
  const tabs = [['bookings', 'Заявки', newCnt], ['services', 'Процедуры'], ['specialists', 'Специалисты'], ['promos', 'Акции'], ['reviews', 'Отзывы', revCnt], ['faq', 'FAQ'], ['ba', 'До / После'], ['settings', 'Настройки']];
  $('#app').innerHTML = `<div class="top"><b>LUMIA</b><span>Панель управления</span><a href="/" target="_blank">Открыть сайт ↗</a><button class="btn ghost sm" id="out" style="color:#fff;border-color:#fff">Выйти</button></div>
    <div class="nav">${tabs.map(([k, l, c]) => `<button data-t="${k}" class="${k === tab ? 'on' : ''}">${l}${c ? `<span class="cnt">${c}</span>` : ''}</button>`).join('')}</div>
    <main>${tab === 'bookings' ? renderBookings() : tab === 'settings' ? renderSettings() : tab === 'ba' ? renderBA() : renderCollection(tab)}</main>`;
  $$('.nav [data-t]').forEach((b) => (b.onclick = () => { tab = b.dataset.t; render(); }));
  $('#out').onclick = guard(async () => { await api('POST', '/api/admin/logout'); D = null; render(); });
  if (tab === 'bookings') bindBookings(); else if (tab === 'settings') bindSettings(); else if (tab === 'ba') bindBA(); else bindCollection(tab);
}

load().catch(() => renderLogin());
})();
