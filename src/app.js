'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { loadConfig } = require('./core/config');
const { createLogger } = require('./core/log');
const { Store } = require('./core/store');
const sec = require('./core/security');
const { HttpError, fail, send, Router } = require('./core/http');
const t = require('./shared/time');
const { canPerform } = require('./features/booking/slots');
const { applyRetention } = require('./features/gdpr/gdpr');
const { createCalendar, createNotifier } = require('./features/integrations');

const FEATURES = [
  require('./features/seo/pages.routes'),
  require('./features/catalog/catalog.routes'),
  require('./features/booking/booking.routes'),
  require('./features/manage/manage.routes'),
  require('./features/media/media.routes'),
  require('./features/admin/admin.routes')
];

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8'
};

function createApp(overrides = {}) {
  const cfg = loadConfig(overrides);
  const log = overrides.logger || createLogger(cfg.logLevel);
  const store = new Store(cfg.dataDir, { seed: require('../seed'), log });
  const mediaDir = path.join(cfg.dataDir, 'media');
  fs.mkdirSync(mediaDir, { recursive: true });
  const limiter = new sec.RateLimiter();
  const now = () => t.nowIn(store.db.settings.timezone);

  function serveFile(req, res, file, cacheControl) {
    const st = fs.statSync(file);
    const etag = `W/"${st.size.toString(16)}-${Math.floor(st.mtimeMs).toString(16)}"`;
    if (req.headers['if-none-match'] === etag) { res.writeHead(304, { ETag: etag, ...res.sec }); return res.end(); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Content-Length': st.size, ETag: etag, 'Cache-Control': cacheControl, ...res.sec });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  }

  const ctx = {
    cfg, log, store, mediaDir, now, serveFile,
    sessions: new sec.Sessions(),
    adminPassword: sec.resolveAdminPassword(cfg, log),
    calendar: createCalendar({ cfg, store, log }),
    notify: createNotifier({ cfg, store, log }),
    uid: (prefix) => prefix + crypto.randomBytes(6).toString('hex'),
    limit: (req, action, max, windowMs) => { if (cfg.rateLimit && limiter.hit(action + ':' + sec.clientIp(req, cfg.trustProxy), max, windowMs)) fail(429, 'toomany'); },
    findService: (id) => store.db.services.find((s) => s.id === id && s.active),
    pool: (svc, spId) => store.db.specialists.filter((p) => canPerform(p, svc) && (!spId || spId === 'any' || p.id === spId)),
    slotArgs: (extra) => ({ bookings: store.db.bookings, settings: store.db.settings, now: now(), ...extra })
  };

  const router = new Router();
  for (const register of FEATURES) register(router, ctx);

  function serveStatic(req, res, url) {
    let rel;
    try { rel = decodeURIComponent(url.pathname); } catch { return send(res, 400, 'Bad request'); }
    const file = path.normalize(path.join(cfg.publicDir, rel));
    if (rel.includes('\0') || !file.startsWith(cfg.publicDir + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return send(res, 404, 'Not found');

    serveFile(req, res, file, /\.(html|js|css)$/.test(file) ? 'no-cache' : 'public, max-age=86400');
  }

  async function handle(req, res) {
    const started = process.hrtime.bigint();
    res.sec = sec.securityHeaders(sec.isSecure(req, cfg.trustProxy));
    let url;
    try { url = new URL(req.url, 'http://localhost'); } catch { return send(res, 400, 'Bad request'); }
    res.on('finish', () => {
      if (url.pathname !== '/healthz') log.info('http', { method: req.method, path: url.pathname, status: res.statusCode, ms: Number(process.hrtime.bigint() - started) / 1e6 });
    });
    try {
      const isApi = url.pathname.startsWith('/api/');
      if (isApi && req.method !== 'GET' && !sec.sameOrigin(req)) fail(403, 'origin');
      if (isApi && req.method === 'GET') ctx.limit(req, 'read', 240, 60e3);
      const m = router.match(req.method, url.pathname);
      if (m?.notAllowed) fail(405, 'method');
      if (m) {
        if (m.route.auth === 'admin' && !ctx.sessions.valid(sec.parseCookies(req).adm)) fail(401, 'auth');
        return await m.route.handler(req, res, { url, params: m.params });
      }
      if (isApi) fail(404, 'not_found');
      if (!['GET', 'HEAD'].includes(req.method)) fail(405, 'method');
      return serveStatic(req, res, url);
    } catch (e) {
      if (!(e instanceof HttpError)) {
        log.error('unhandled error', { path: url.pathname, err: e.message, stack: cfg.production ? undefined : e.stack });
        e = new HttpError(500, 'server', 'Internal error');
      }
      if (!res.headersSent) send(res, e.status, { error: e.message, code: e.code });
      else res.destroy();
    }
  }

  const server = http.createServer(handle);
  server.headersTimeout = 20e3;
  server.requestTimeout = 30e3;
  server.keepAliveTimeout = 5e3;

  const retention = () => {
    const n = applyRetention(store.db, now().date, cfg.retentionMonths);
    if (n) { store.save(); log.info('retention applied', { anonymized: n }); }
  };
  retention();
  const retentionTimer = setInterval(retention, 24 * 3600e3);
  retentionTimer.unref();

  function close() {
    clearInterval(retentionTimer);
    limiter.stop();
    return new Promise((resolve) => server.close(() => { store.save(); resolve(); }));
  }

  return { server, store, cfg, log, close, adminPassword: ctx.adminPassword };
}

module.exports = { createApp };
