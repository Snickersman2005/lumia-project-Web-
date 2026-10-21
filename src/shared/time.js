'use strict';

const pad = (n) => String(n).padStart(2, '0');
const toMin = (t) => { const [h, m] = String(t).split(':').map(Number); return h * 60 + m; };
const toStr = (m) => pad(Math.floor(m / 60)) + ':' + pad(m % 60);

const isDate = (s) => {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
};
const isTime = (s) => typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
const weekday = (date) => new Date(date + 'T00:00:00Z').getUTCDay();
const addDays = (date, n) => new Date(Date.parse(date + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10);

function nowIn(timeZone, at = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  }).formatToParts(at).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, minutes: Number(p.hour) * 60 + Number(p.minute) };
}

const minutesBetween = (aDate, aMin, bDate, bMin) => (Date.parse(bDate + 'T00:00:00Z') - Date.parse(aDate + 'T00:00:00Z')) / 6e4 + (bMin - aMin);

function easterSunday(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return `${y}-${pad(month)}-${pad(day)}`;
}

const FIXED = {
  '01-01': 'Den obnovy samostatného českého státu / Nový rok',
  '05-01': 'Svátek práce',
  '05-08': 'Den vítězství',
  '07-05': 'Den slovanských věrozvěstů Cyrila a Metoděje',
  '07-06': 'Den upálení mistra Jana Husa',
  '09-28': 'Den české státnosti',
  '10-28': 'Den vzniku samostatného československého státu',
  '11-17': 'Den boje za svobodu a demokracii',
  '12-24': 'Štědrý den',
  '12-25': '1. svátek vánoční',
  '12-26': '2. svátek vánoční'
};
const cache = new Map();

function czechHolidays(year) {
  if (cache.has(year)) return cache.get(year);
  const map = new Map(Object.entries(FIXED).map(([md, name]) => [`${year}-${md}`, name]));
  const easter = easterSunday(year);
  map.set(addDays(easter, -2), 'Velký pátek');
  map.set(addDays(easter, 1), 'Velikonoční pondělí');
  cache.set(year, map);
  return map;
}
const czechHoliday = (date) => (isDate(date) ? czechHolidays(Number(date.slice(0, 4))).get(date) || null : null);

module.exports = { pad, toMin, toStr, isDate, isTime, weekday, addDays, nowIn, minutesBetween, easterSunday, czechHolidays, czechHoliday };
