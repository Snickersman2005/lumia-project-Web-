'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const t = require('../src/shared/time');
const v = require('../src/shared/validate');
const { freeSlots, hasConflict } = require('../src/features/booking/slots');
const { toCsv } = require('../src/shared/csv');
const { sanitizeImage } = require('../src/features/media/images');
const seo = require('../src/features/seo/seo');
const gdpr = require('../src/features/gdpr/gdpr');

test('Easter and Czech public holidays', () => {
  assert.equal(t.easterSunday(2026), '2026-04-05');
  assert.equal(t.easterSunday(2027), '2027-03-28');
  assert.equal(t.czechHoliday('2026-04-03'), 'Velký pátek');
  assert.equal(t.czechHoliday('2026-04-06'), 'Velikonoční pondělí');
  assert.equal(t.czechHoliday('2026-10-28'), 'Den vzniku samostatného československého státu');
  assert.equal(t.czechHoliday('2026-11-17'), 'Den boje za svobodu a demokracii');
  assert.equal(t.czechHoliday('2026-10-27'), null);
  assert.equal(t.czechHolidays(2026).size, 13);
});

test('strict date and time validation', () => {
  assert.ok(t.isDate('2026-02-28'));
  assert.ok(!t.isDate('2026-02-30'));
  assert.ok(!t.isDate('2026-2-3'));
  assert.ok(t.isTime('09:30'));
  assert.ok(!t.isTime('24:00'));
  assert.equal(t.minutesBetween('2026-10-20', 23 * 60, '2026-10-21', 60), 120);
});

test('phone normalization to E.164 (CZ + EU)', () => {
  assert.equal(v.normalizePhone('777 123 456'), '+420777123456');
  assert.equal(v.normalizePhone('+420 777-123-456'), '+420777123456');
  assert.equal(v.normalizePhone('00420777123456'), '+420777123456');
  assert.equal(v.normalizePhone('+49 151 23456789'), '+4915123456789');
  assert.equal(v.normalizePhone('+380 67 123 4567'), '+380671234567');
  assert.equal(v.normalizePhone('+420 12345'), null);
  assert.equal(v.normalizePhone('+420 077 123 456'), null);
  assert.equal(v.normalizePhone('abc'), null);
});

test('email, name, ranges, urls', () => {
  assert.ok(v.isEmail('jana.novakova@seznam.cz'));
  assert.ok(!v.isEmail('a@b'));
  assert.ok(!v.isEmail('x"<script>@a.cz'));
  assert.ok(v.isName('Kateřina Dvořáková'));
  assert.ok(v.isName('Олена'));
  assert.ok(!v.isName('12'));
  assert.equal(v.validRange('10:00-18:00'), '10:00-18:00');
  assert.equal(v.validRange('18:00-10:00'), '');
  assert.equal(v.validRange('25:00-26:00'), '');
  assert.equal(v.safeUrl('javascript:alert(1)'), '');
  assert.equal(v.safeUrl('https://instagram.com/lumia'), 'https://instagram.com/lumia');
  assert.equal(v.clean('a\u0000b\nc', 10), 'a b c');
  assert.equal(v.clean('a\nb', 10, true), 'a\nb');
});

const settings = { slotStep: 30, leadHours: 2, horizonDays: 45, closedOnHolidays: true };
const sp = { id: 'p1', active: true, services: [], schedule: ['', '10:00-13:00', '10:00-13:00', '10:00-13:00', '10:00-13:00', '10:00-13:00', ''], daysOff: ['2026-10-23'] };
const svc = { id: 's1', duration: 45 };
const now = { date: '2026-10-20', minutes: 9 * 60 };

test('free slots: schedule, duration rounding, busy time, lead time', () => {
  const base = { bookings: [], settings, specialist: sp, service: svc, now };
  assert.deepEqual(freeSlots({ ...base, date: '2026-10-21' }), ['10:00', '10:30', '11:00', '11:30', '12:00']);
  const bookings = [{ id: 'b1', specialistId: 'p1', date: '2026-10-21', start: '10:30', end: '11:30', status: 'new' }];
  assert.deepEqual(freeSlots({ ...base, bookings, date: '2026-10-21' }), ['11:30', '12:00']);
  assert.deepEqual(freeSlots({ ...base, bookings: [{ ...bookings[0], status: 'cancelled' }], date: '2026-10-21' }).length, 5);
  assert.deepEqual(freeSlots({ ...base, bookings, date: '2026-10-21', excludeId: 'b1' }).length, 5);
  assert.deepEqual(freeSlots({ ...base, date: '2026-10-20' }), ['11:00', '11:30', '12:00']);
});

test('free slots: day off, weekend, holiday, past, horizon, invalid date', () => {
  const base = { bookings: [], settings, specialist: sp, service: svc, now };
  assert.deepEqual(freeSlots({ ...base, date: '2026-10-23' }), []);
  assert.deepEqual(freeSlots({ ...base, date: '2026-10-25' }), []);
  assert.deepEqual(freeSlots({ ...base, date: '2026-10-28' }), []);
  assert.equal(freeSlots({ ...base, settings: { ...settings, closedOnHolidays: false }, date: '2026-10-28' }).length, 5);
  assert.deepEqual(freeSlots({ ...base, date: '2026-10-19' }), []);
  assert.deepEqual(freeSlots({ ...base, date: '2027-01-05' }), []);
  assert.deepEqual(freeSlots({ ...base, date: '2026-13-01' }), []);
});

test('conflict detection', () => {
  const a = { id: 'a', specialistId: 'p1', date: '2026-10-21', start: '10:00', end: '11:00', status: 'cancelled' };
  const b = { id: 'b', specialistId: 'p1', date: '2026-10-21', start: '10:30', end: '11:30', status: 'new' };
  assert.ok(hasConflict([a, b], a));
  assert.ok(!hasConflict([a, { ...b, start: '11:00', end: '12:00' }], a));
});

test('CSV: Excel-friendly and formula injection safe', () => {
  const csv = toCsv([{ a: '=HYPERLINK("http://evil")', b: 'x;y' }, { a: '+420777', b: 'ok' }], [['a', 'A'], ['b', 'B']]);
  assert.ok(csv.startsWith('﻿A;B\r\n'));
  assert.ok(csv.includes(`"'=HYPERLINK(""http://evil"")";"x;y"`));
  assert.ok(csv.includes("'+420777;ok"));
});

test('images: only real JPEG/PNG, EXIF removed', () => {

  const app1 = Buffer.concat([Buffer.from([0xff, 0xe1, 0x00, 0x08]), Buffer.from('GPS:50')]);
  const sof = Buffer.from([0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x14, 0x00, 0x0a, 0x01, 0x01, 0x11, 0x00]);
  const jpg = Buffer.concat([Buffer.from([0xff, 0xd8]), app1, sof, Buffer.from([0xff, 0xda, 0x00, 0x02, 0x00, 0xff, 0xd9])]);
  const out = sanitizeImage(jpg);
  assert.equal(out.type, 'jpg');
  assert.equal(out.width, 10);
  assert.equal(out.height, 20);
  assert.ok(!out.data.includes(Buffer.from('GPS:50')));
  assert.throws(() => sanitizeImage(Buffer.from('<svg onload=alert(1)>')), /bad image/);
  assert.throws(() => sanitizeImage(Buffer.from('GIF89a....')), /bad image/);
});

test('SEO: language negotiation, address parsing, JSON-LD escaping', () => {
  assert.equal(seo.negotiateLang('ru-RU,ru;q=0.9,en;q=0.8'), 'ru');
  assert.equal(seo.negotiateLang('de-DE,de;q=0.9,en;q=0.5'), 'en');
  assert.equal(seo.negotiateLang('fr'), 'cs');
  assert.deepEqual(seo.parseAddress('Václavské náměstí 12, 110 00 Praha 1'), { streetAddress: 'Václavské náměstí 12', postalCode: '110 00', addressLocality: 'Praha' });
  assert.ok(!seo.jsonForScript({ x: '</script><script>alert(1)</script>' }).includes('</script>'));
});

test('GDPR: retention anonymizes only old bookings', () => {
  const db = { bookings: [
    { id: 'b1', date: '2023-01-10', name: 'Jana', phone: '+420777123456', email: 'j@x.cz', token: 'x' },
    { id: 'b2', date: '2026-10-01', name: 'Petr', phone: '+420777000000', email: '', token: 'y' }] };
  assert.equal(gdpr.applyRetention(db, '2026-10-21', 24), 1);
  assert.equal(db.bookings[0].name, '—');
  assert.equal(db.bookings[0].token, '');
  assert.equal(db.bookings[1].name, 'Petr');
});
