'use strict';

function clean(v, max, allowNewlines = false) {
  const re = allowNewlines ? /[\u0000-\u0009\u000b-\u001f\u007f]/g : /[\u0000-\u001f\u007f]/g;
  return String(v == null ? '' : v).normalize('NFC').replace(re, ' ').trim().slice(0, max);
}

function safeUrl(v) {
  try { const u = new URL(String(v).trim()); return ['http:', 'https:'].includes(u.protocol) ? u.href.slice(0, 200) : ''; } catch { return ''; }
}

function normalizePhone(raw) {
  let s = String(raw || '').replace(/[\s\-().\/]/g, '');
  if (s.startsWith('00')) s = '+' + s.slice(2);
  if (/^\d{9}$/.test(s)) s = '+420' + s;
  if (!/^\+[1-9]\d{7,14}$/.test(s)) return null;
  if (s.startsWith('+420') && !/^\+420[1-9]\d{8}$/.test(s)) return null;
  return s;
}

const EMAIL = /^[^\s@<>()[\]\\,;:"]{1,64}@(?=.{1,253}$)[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
const isEmail = (s) => typeof s === 'string' && s.length <= 254 && EMAIL.test(s);

const isName = (s) => typeof s === 'string' && s.length >= 2 && s.length <= 80 && /\p{L}/u.test(s);

const isId = (s) => typeof s === 'string' && /^[a-z][0-9a-f]{6,32}$/.test(s);

function validRange(x) {
  const m = /^([01]\d|2[0-3]):([0-5]\d)-([01]\d|2[0-3]):([0-5]\d)$/.exec(String(x || '').trim());
  if (!m) return '';
  return Number(m[1]) * 60 + Number(m[2]) < Number(m[3]) * 60 + Number(m[4]) ? m[0] : '';
}

module.exports = { clean, safeUrl, normalizePhone, isEmail, isName, isId, validRange };
