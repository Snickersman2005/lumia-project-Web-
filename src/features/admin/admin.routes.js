'use strict';

const fs = require('fs');
const path = require('path');
const { send, readBody, fail } = require('../../core/http');
const sec = require('../../core/security');
const v = require('../../shared/validate');
const { toCsv } = require('../../shared/csv');
const { hasConflict } = require('../booking/slots');
const { applyRetention } = require('../gdpr/gdpr');
const { sanitizeItem } = require('./sanitize');

const STATUSES = ['new', 'confirmed', 'done', 'cancelled', 'noshow'];
const COLLECTIONS = 'services|specialists|promos|reviews|faq|bookings|beforeAfter';
const ID = '([a-z][0-9a-f]{1,32})';

module.exports = function adminRoutes(router, ctx) {
  const { cfg, store, uid, now, limit, log, calendar, sessions, adminPassword, mediaDir } = ctx;
  const admin = { auth: 'admin' };
  const cookieAttrs = (req) => `HttpOnly; SameSite=Strict; Path=/${sec.isSecure(req, cfg.trustProxy) ? '; Secure' : ''}`;
  const opts = () => ({ serviceIds: store.db.services.map((s) => s.id), today: now().date });

  router.post('/api/admin/login', async (req, res) => {
    limit(req, 'login', 10, 900e3);
    const d = await readBody(req);
    if (!sec.safeEqual(String(d.password || ''), adminPassword)) {
      log.warn('admin login failed', { ip: sec.clientIp(req, cfg.trustProxy) });
      fail(401, 'auth');
    }
    send(res, 200, { ok: true }, { 'Set-Cookie': `adm=${sessions.create()}; ${cookieAttrs(req)}; Max-Age=${sessions.ttl / 1000}` });
  });

  router.post('/api/admin/logout', (req, res) => {
    sessions.revoke(sec.parseCookies(req).adm);
    send(res, 200, { ok: true }, { 'Set-Cookie': `adm=; ${cookieAttrs(req)}; Max-Age=0` });
  }, admin);

  router.get('/api/admin/data', (req, res) => send(res, 200, {
    ...store.db, retentionMonths: cfg.retentionMonths,
    gcal: { enabled: calendar.enabled(), hasCreds: calendar.hasCreds(), email: calendar.serviceEmail() }
  }), admin);

  router.put('/api/admin/settings', async (req, res) => {
    const d = await readBody(req);
    const st = store.db.settings;
    const num = (val, def, min, max) => (val !== '' && val !== null && Number.isFinite(+val) && +val >= min && +val <= max ? +val : def);
    for (const k of ['name', 'phone', 'address', 'hours', 'currency', 'googleCalendarId', 'notifyTelegramChatId', 'companyName', 'dic']) if (k in d) st[k] = v.clean(d[k], 200);
    if ('email' in d) { const e = v.clean(d.email, 254); if (e && !v.isEmail(e)) fail(400, 'email'); st.email = e; }
    if ('ico' in d && /^\d{8}$/.test(String(d.ico).trim())) st.ico = String(d.ico).trim();
    for (const k of ['instagram', 'telegram']) if (k in d) st[k] = v.safeUrl(d[k]);
    for (const k of ['vatPayer', 'closedOnHolidays']) if (k in d) st[k] = d[k] === true;
    if ('lat' in d) st.lat = num(d.lat, st.lat, -90, 90);
    if ('lon' in d) st.lon = num(d.lon, st.lon, -180, 180);
    if ('leadHours' in d) st.leadHours = num(d.leadHours, st.leadHours, 0, 168);
    if ('horizonDays' in d) st.horizonDays = num(d.horizonDays, st.horizonDays, 1, 365);
    if ('slotStep' in d && [15, 30, 60].includes(+d.slotStep)) st.slotStep = +d.slotStep;
    if ('timezone' in d) {
      try { new Intl.DateTimeFormat('en', { timeZone: String(d.timezone) }); st.timezone = String(d.timezone); } catch { fail(400, 'timezone'); }
    }
    store.save();
    send(res, 200, st);
  }, admin);

  router.get('/api/admin/export.csv', (req, res) => {
    const db = store.db;
    const svcName = (id) => db.services.find((s) => s.id === id)?.name || '';
    const spName = (id) => db.specialists.find((s) => s.id === id)?.name || '';
    const rows = db.bookings.slice().sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
    const csv = toCsv(rows, [['date', 'Datum'], ['start', 'Začátek'], ['end', 'Konec'], [(r) => svcName(r.serviceId), 'Procedura'],
      [(r) => spName(r.specialistId), 'Specialista'], ['name', 'Jméno'], ['phone', 'Telefon'], ['email', 'E-mail'], ['price', 'Cena (Kč)'],
      ['promo', 'Promo kód'], ['status', 'Stav'], ['comment', 'Poznámka'], ['created', 'Vytvořeno']]);
    send(res, 200, csv, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="rezervace-${now().date}.csv"` });
  }, admin);

  router.post('/api/admin/retention', (req, res) => {
    const n = applyRetention(store.db, now().date, cfg.retentionMonths);
    store.save();
    send(res, 200, { anonymized: n });
  }, admin);

  router.post(new RegExp(`^/api/admin/(services|specialists|promos|reviews|faq)$`), async (req, res, { params: [coll] }) => {
    const item = { id: uid(coll[0]), ...sanitizeItem(coll, await readBody(req), {}, opts()) };
    store.db[coll].push(item);
    store.save();
    send(res, 201, item);
  }, admin);

  router.put(new RegExp(`^/api/admin/(${COLLECTIONS})/${ID}$`), async (req, res, { params: [coll, id] }) => {
    const item = store.db[coll].find((x) => x.id === id) || fail(404, 'not_found');
    const d = await readBody(req);
    if (coll === 'bookings') {
      const prev = item.status;
      if (STATUSES.includes(d.status) && d.status !== prev) {
        if (prev === 'cancelled' && hasConflict(store.db.bookings, item)) fail(409, 'taken');
        item.status = d.status;
      }
      if ('adminNote' in d) item.adminNote = v.clean(d.adminNote, 500, true);
      store.save();
      if (item.status === 'cancelled' && prev !== 'cancelled') await calendar.sync(item, 'delete');
      else if (prev === 'cancelled' && item.status !== 'cancelled') await calendar.sync(item, 'create');
      else if (prev !== item.status) await calendar.sync(item, 'update');
      return send(res, 200, item);
    }
    const next = sanitizeItem(coll, d, item, opts());
    if (coll === 'beforeAfter' && next.published && next.kind === 'client' && !next.consentNote) fail(400, 'consent');
    Object.assign(item, next);
    store.save();
    send(res, 200, item);
  }, admin);

  router.delete(new RegExp(`^/api/admin/(${COLLECTIONS})/${ID}$`), async (req, res, { params: [coll, id] }) => {
    const list = store.db[coll];
    const item = list.find((x) => x.id === id) || fail(404, 'not_found');
    if (coll === 'bookings') await calendar.sync(item, 'delete');
    if (coll === 'beforeAfter') for (const f of [item.before, item.after]) fs.rmSync(path.join(mediaDir, path.basename(f)), { force: true });
    list.splice(list.indexOf(item), 1);
    store.save();
    send(res, 200, { ok: true });
  }, admin);
};
