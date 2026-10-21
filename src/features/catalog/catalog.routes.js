'use strict';

const { send, readBody, fail } = require('../../core/http');
const v = require('../../shared/validate');

module.exports = function catalogRoutes(router, ctx) {
  const { store, cfg, uid, now, limit } = ctx;

  router.get('/api/public', (req, res) => {
    const db = store.db;
    const { notifyTelegramChatId, googleCalendarId, ...settings } = db.settings;
    send(res, 200, {
      settings: { ...settings, retentionMonths: cfg.retentionMonths },
      services: db.services.filter((s) => s.active),
      specialists: db.specialists.filter((s) => s.active).map(({ schedule, daysOff, ...p }) => p),
      promos: db.promos.filter((p) => p.active),
      reviews: db.reviews.filter((r) => r.approved).sort((a, b) => b.date.localeCompare(a.date)),
      faq: db.faq,
      beforeAfter: db.beforeAfter.filter((x) => x.published).map(({ consentNote, ...x }) => x)
    });
  });

  router.post('/api/reviews', async (req, res) => {
    limit(req, 'review', 3, 3600e3);
    const d = await readBody(req);
    if (d.website) return send(res, 200, { ok: true });
    const name = v.clean(d.name, 60), text = v.clean(d.text, 1000, true);
    if (!v.isName(name) || text.length < 10) fail(400, 'review');
    store.db.reviews.push({ id: uid('r'), name, text, service: v.clean(d.service, 80),
      rating: Math.min(5, Math.max(1, Math.round(+d.rating) || 5)), date: now().date, approved: false });
    store.save();
    send(res, 201, { ok: true });
  });
};
