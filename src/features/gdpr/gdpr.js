'use strict';

const { addDays } = require('../../shared/time');

const CONSENT_VERSION = '2026-10';
const ERASED = '—';

function anonymize(b) {
  Object.assign(b, { name: ERASED, phone: ERASED, email: '', comment: '', promo: '', adminNote: '', token: '', anonymized: true });
  return b;
}

function applyRetention(db, today, retentionMonths) {
  const cutoff = addDays(today, -Math.round(retentionMonths * 30.44));
  let n = 0;
  for (const b of db.bookings) if (!b.anonymized && b.date < cutoff) { anonymize(b); n++; }
  return n;
}

module.exports = { anonymize, applyRetention, CONSENT_VERSION };
