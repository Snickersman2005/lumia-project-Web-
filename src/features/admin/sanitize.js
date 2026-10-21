'use strict';

const v = require('../../shared/validate');
const t = require('../../shared/time');
const { fail } = require('../../core/http');

const CATEGORIES = ['face', 'body', 'bikini', 'men', 'complex'];
const TRANSLATABLE = {
  services: ['name', 'short', 'description', 'prep', 'contra'], specialists: ['name', 'role', 'bio'],
  promos: ['title', 'text'], reviews: ['service', 'text'], faq: ['q', 'a'], beforeAfter: ['caption']
};
const TR_LANGS = ['ru', 'uk', 'en'];

function sanitizeItem(coll, d, old = {}, { serviceIds = [], today = '' } = {}) {
  const s = (k, n = 200, nl = false) => (k in d ? v.clean(d[k], n, nl) : old[k] ?? '');
  const num = (k, max = 1e6) => (k in d ? Math.min(max, Math.max(0, Math.round(+d[k]) || 0)) : old[k] ?? 0);
  const bool = (k, def) => (k in d ? d[k] === true : old[k] ?? def);
  let base;
  switch (coll) {
    case 'services': base = {
      category: CATEGORIES.includes(d.category) ? d.category : old.category || 'body',
      name: s('name', 80), price: num('price'), oldPrice: num('oldPrice'), duration: Math.max(5, num('duration', 480)), sessions: s('sessions', 20),
      popular: bool('popular', false), active: bool('active', true), short: s('short', 160),
      description: s('description', 1200, true), prep: s('prep', 500, true), contra: s('contra', 500, true) }; break;
    case 'specialists': base = {
      name: s('name', 80), role: s('role', 100), experience: num('experience', 80),
      color: /^#[0-9a-f]{6}$/i.test(d.color) ? d.color : old.color || '#C9857A', bio: s('bio', 600, true), active: bool('active', true),
      services: Array.isArray(d.services) ? d.services.filter((x) => serviceIds.includes(x)) : old.services || [],
      schedule: Array.isArray(d.schedule) ? Array.from({ length: 7 }, (_, i) => v.validRange(d.schedule[i])) : old.schedule || ['', '', '', '', '', '', ''],
      daysOff: Array.isArray(d.daysOff) ? [...new Set(d.daysOff.filter(t.isDate))].slice(0, 366) : old.daysOff || [] }; break;
    case 'promos': base = { title: s('title', 100), text: s('text', 400, true), badge: s('badge', 20), active: bool('active', true) }; break;
    case 'reviews': base = {
      name: s('name', 60), text: s('text', 1000, true), service: s('service', 80), rating: Math.min(5, Math.max(1, num('rating') || 5)),
      date: t.isDate(d.date) ? d.date : old.date || today, approved: bool('approved', true) }; break;
    case 'faq': base = { q: s('q', 200), a: s('a', 1000, true) }; break;
    case 'beforeAfter': base = {
      caption: s('caption', 120), sessions: Math.min(20, num('sessions')), published: bool('published', false),
      kind: ['client', 'illustration'].includes(d.kind) ? d.kind : old.kind || 'illustration', consentNote: s('consentNote', 200) }; break;
    default: fail(404, 'not_found');
  }
  if (TRANSLATABLE[coll]) {
    base.tr = {};
    for (const l of TR_LANGS) {
      base.tr[l] = {};
      for (const f of TRANSLATABLE[coll]) base.tr[l][f] = d.tr?.[l] && typeof d.tr[l][f] === 'string' ? v.clean(d.tr[l][f], 1200, true) : old.tr?.[l]?.[f] ?? '';
    }
  }
  return base;
}

module.exports = { sanitizeItem, TRANSLATABLE };
