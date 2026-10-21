'use strict';

const { send, readBody, fail } = require('../../core/http');
const { safeEqual } = require('../../core/security');
const t = require('../../shared/time');
const { freeSlots, availableDays, durationFor } = require('../booking/slots');
const { anonymize } = require('../gdpr/gdpr');

const MIN_NOTICE_MIN = 12 * 60;

module.exports = function manageRoutes(router, ctx) {
  const { store, limit, log, calendar, notify, now, slotArgs } = ctx;

  async function load(req, url) {
    limit(req, 'manage', 60, 3600e3);
    const d = req.method === 'POST' ? await readBody(req) : Object.fromEntries(url.searchParams);
    const db = store.db;
    const b = typeof d.id === 'string' && db.bookings.find((x) => x.id === d.id);
    if (!b || !b.token || !safeEqual(String(d.token || ''), b.token)) fail(404, 'notfound');
    const svc = db.services.find((s) => s.id === b.serviceId), sp = db.specialists.find((p) => p.id === b.specialistId);
    const n = now();
    const editable = ['new', 'confirmed'].includes(b.status) && t.minutesBetween(n.date, n.minutes, b.date, t.toMin(b.start)) >= MIN_NOTICE_MIN;
    const s = db.settings;
    const view = () => ({ id: b.id, serviceId: b.serviceId, specialistId: b.specialistId, date: b.date, start: b.start, end: b.end,
      status: b.status, address: s.address, timezone: s.timezone, phone: s.phone });
    const requireEditable = () => { if (!editable || !svc || !sp) fail(409, 'late'); };
    return { d, b, svc, sp, editable, view, requireEditable };
  }

  router.get('/api/manage', async (req, res, { url }) => {
    const { view, editable } = await load(req, url);
    send(res, 200, { booking: view(), editable });
  });

  router.get('/api/manage/days', async (req, res, { url }) => {
    const { b, svc, sp, requireEditable } = await load(req, url);
    requireEditable();
    send(res, 200, { days: availableDays(slotArgs({ service: svc, specialists: [sp], excludeId: b.id })) });
  });

  router.get('/api/manage/slots', async (req, res, { url }) => {
    const { d, b, svc, sp, requireEditable } = await load(req, url);
    requireEditable();
    if (!t.isDate(d.date)) fail(400, 'date');
    send(res, 200, { slots: freeSlots(slotArgs({ specialist: sp, service: svc, date: d.date, excludeId: b.id })).map((time) => ({ time })) });
  });

  router.post('/api/manage/reschedule', async (req, res, { url }) => {
    const { d, b, svc, sp, view, requireEditable } = await load(req, url);
    requireEditable();
    if (!t.isDate(d.date) || !t.isTime(d.time)) fail(400, 'time');
    if (!freeSlots(slotArgs({ specialist: sp, service: svc, date: d.date, excludeId: b.id })).includes(d.time)) fail(409, 'taken');
    Object.assign(b, { date: d.date, start: d.time, end: t.toStr(t.toMin(d.time) + durationFor(svc, store.db.settings.slotStep || 30)) });
    store.save();
    await calendar.sync(b, 'update');
    notify(`Rezervace přesunuta klientem\n${svc.name}\n${b.date} ${b.start}`);
    send(res, 200, { ok: true, booking: view() });
  });

  router.post('/api/manage/cancel', async (req, res, { url }) => {
    const { b, svc, requireEditable } = await load(req, url);
    requireEditable();
    b.status = 'cancelled';
    store.save();
    await calendar.sync(b, 'delete');
    notify(`Rezervace zrušena klientem\n${svc?.name}\n${b.date} ${b.start}`);
    send(res, 200, { ok: true });
  });

  router.post('/api/manage/erase', async (req, res, { url }) => {
    const { b } = await load(req, url);
    if (['new', 'confirmed'].includes(b.status)) { b.status = 'cancelled'; await calendar.sync(b, 'delete'); }
    anonymize(b);
    store.save();
    log.info('booking erased by data subject', { booking: b.id });
    send(res, 200, { ok: true });
  });
};
