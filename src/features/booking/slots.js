'use strict';

const { toMin, toStr, isDate, weekday, addDays, czechHoliday } = require('../../shared/time');

const ACTIVE = (b) => b.status !== 'cancelled';
const durationFor = (service, step) => Math.ceil(service.duration / step) * step;
const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && aEnd > bStart;
const canPerform = (sp, svc) => !!sp.active && (!sp.services || !sp.services.length || sp.services.includes(svc.id));

function freeSlots({ bookings, settings, specialist, service, date, now, excludeId }) {
  if (!isDate(date) || !specialist || !service) return [];
  if (date < now.date || date > addDays(now.date, settings.horizonDays || 45)) return [];
  if ((specialist.daysOff || []).includes(date)) return [];
  if (settings.closedOnHolidays !== false && czechHoliday(date)) return [];
  const m = /^(\d{2}:\d{2})-(\d{2}:\d{2})$/.exec((specialist.schedule || [])[weekday(date)] || '');
  if (!m) return [];
  const step = settings.slotStep || 30;
  const dur = durationFor(service, step);
  const busy = bookings
    .filter((b) => b.specialistId === specialist.id && b.date === date && ACTIVE(b) && b.id !== excludeId)
    .map((b) => [toMin(b.start), toMin(b.end)]);
  const minStart = date === now.date ? now.minutes + (settings.leadHours || 0) * 60 : 0;
  const out = [];
  for (let t = toMin(m[1]); t + dur <= toMin(m[2]); t += step) {
    if (t >= minStart && !busy.some(([s, e]) => overlaps(t, t + dur, s, e))) out.push(toStr(t));
  }
  return out;
}

function availableDays(o) {
  const days = [];
  for (let i = 0; i <= (o.settings.horizonDays || 45); i++) {
    const date = addDays(o.now.date, i);
    if (o.specialists.some((specialist) => freeSlots({ ...o, specialist, date }).length)) days.push(date);
  }
  return days;
}

const hasConflict = (bookings, item) => bookings.some((o) => o.id !== item.id && o.specialistId === item.specialistId && o.date === item.date
  && ACTIVE(o) && overlaps(toMin(item.start), toMin(item.end), toMin(o.start), toMin(o.end)));

module.exports = { freeSlots, availableDays, durationFor, overlaps, canPerform, hasConflict };
