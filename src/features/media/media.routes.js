'use strict';

const fs = require('fs');
const path = require('path');
const { send, readBody, fail } = require('../../core/http');
const { sanitizeImage } = require('./images');
const { sanitizeItem } = require('../admin/sanitize');

const MAX_UPLOAD = 12 * 1024 * 1024;

module.exports = function mediaRoutes(router, ctx) {
  const { store, uid, mediaDir, serveFile } = ctx;

  router.post('/api/admin/before-after', async (req, res) => {
    const d = await readBody(req, MAX_UPLOAD);
    const image = (b64) => { try { return sanitizeImage(Buffer.from(String(b64 || ''), 'base64')); } catch { return fail(400, 'image'); } };
    const before = image(d.before), after = image(d.after);
    const kind = d.kind === 'client' ? 'client' : 'illustration';

    if (kind === 'client' && (d.consent !== true || !String(d.consentNote || '').trim())) fail(400, 'consent');
    const id = uid('a');
    const files = { before: `${id}-before.${before.type}`, after: `${id}-after.${after.type}` };
    fs.writeFileSync(path.join(mediaDir, files.before), before.data, { mode: 0o644 });
    fs.writeFileSync(path.join(mediaDir, files.after), after.data, { mode: 0o644 });
    const item = { id, ...sanitizeItem('beforeAfter', { ...d, kind }), before: `/media/${files.before}`, after: `/media/${files.after}`,
      width: before.width, height: before.height, created: new Date().toISOString() };
    store.db.beforeAfter.push(item);
    store.save();
    send(res, 201, item);
  }, { auth: 'admin' });

  router.get(/^\/media\/(a[0-9a-f]{12}-(?:before|after)\.(?:jpg|png))$/, (req, res, { params: [name] }) => {
    const f = path.join(mediaDir, name);
    if (!fs.existsSync(f)) return send(res, 404, 'Not found');
    serveFile(req, res, f, 'public, max-age=86400');
  });
};
