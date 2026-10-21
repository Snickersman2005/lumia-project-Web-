'use strict';

const crypto = require('crypto');
const { send, readBody, fail } = require('../../core/http');
const v = require('../../shared/validate');
const t = require('../../shared/time');
const { freeSlots, availableDays, durationFor } = require('./slots');
const { CONSENT_VERSION } = require('../gdpr/gdpr');

const LANGS = ['cs', 'en', 'ru', 'uk'];

module.exports = function bookingRoutes(router, ctx) {
  const { store, uid, limit, log, calendar, notify, slotArgs, findService, pool } = ctx;

  router.get('/api/availability', (req, res, { url }) => {
    const svc = findService(url.searchParams.get('service')) || fail(400, 'service');
    send(res, 200, { days: availableDays(slotArgs({ service: svc, specialists: pool(svc, url.searchParams.get('specialist')) })) });
  });

  router.get('/api/slots', (req, res, { url }) => {
    const svc = findService(url.searchParams.get('service')) || fail(400, 'service');
    const date = url.searchParams.get('date');
    if (!t.isDate(date)) fail(400, 'date');
    const map = {};
    for (const p of pool(svc, url.searchParams.get('specialist'))) {
      for (const time of freeSlots(slotArgs({ specialist: p, service: svc, date }))) (map[time] = map[time] || []).push(p.id);
    }
    send(res, 200, { slots: Object.keys(map).sort().map((time) => ({ time, specialists: map[time] })), holiday: t.czechHoliday(date) });
  });

  router.post('/api/bookings', async (req, res) => {
    limit(req, 'book', 8, 3600e3);
    const d = await readBody(req);
    if (d.website) return send(res, 200, { ok: true });
    const db = store.db, settings = db.settings;
    const svc = findService(d.serviceId) || fail(400, 'service');
    const name = v.clean(d.name, 80), email = v.clean(d.email, 254).toLowerCase(), comment = v.clean(d.comment, 500, true);
    if (!v.isName(name)) fail(400, 'name');
    const phone = v.normalizePhone(d.phone) || fail(400, 'phone');
    if (email && !v.isEmail(email)) fail(400, 'email');
    if (d.consent !== true) fail(400, 'consent');
    if (!t.isDate(d.date)) fail(400, 'date');
    if (!t.isTime(d.time)) fail(400, 'time');
    const sp = pool(svc, d.specialistId).find((p) => freeSlots(slotArgs({ specialist: p, service: svc, date: d.date })).includes(d.time)) || fail(409, 'taken');

    const b = {
      id: uid('b'), token: crypto.randomBytes(16).toString('hex'), serviceId: svc.id, specialistId: sp.id,
      date: d.date, start: d.time, end: t.toStr(t.toMin(d.time) + durationFor(svc, settings.slotStep || 30)),
      name, phone, email, comment, promo: v.clean(d.promo, 30).toUpperCase(), price: svc.price,
      lang: LANGS.includes(d.lang) ? d.lang : 'cs', status: 'new', gcalEventId: '', gcalError: '',
      consent: { at: new Date().toISOString(), version: CONSENT_VERSION }, created: new Date().toISOString()
    };
    db.bookings.push(b);
    store.save();
    calendar.sync(b, 'create');
    notify(`Nová rezervace\n${svc.name}\n${b.date} ${b.start}, ${sp.name}\n${name}, ${phone}`);
    log.info('booking created', { booking: b.id });
    send(res, 201, { ok: true, booking: { id: b.id, token: b.token, serviceId: svc.id, specialistId: sp.id,
      date: b.date, start: b.start, end: b.end, address: settings.address, timezone: settings.timezone } });
  });
};
