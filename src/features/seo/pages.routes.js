'use strict';

const path = require('path');
const fs = require('fs');
const { send } = require('../../core/http');
const seo = require('./seo');

module.exports = function pageRoutes(router, ctx) {
  const { cfg, store, serveFile } = ctx;
  const cache = {};
  const template = (name) => (cfg.production && cache[name]) || (cache[name] = fs.readFileSync(path.join(cfg.publicDir, name), 'utf8'));
  const ogImage = fs.existsSync(path.join(cfg.publicDir, 'og.png'));
  const redirect = (res, status, location, extra = {}) => { res.writeHead(status, { Location: location, ...res.sec, ...extra }); res.end(); };
  const html = (res, body) => { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache', ...res.sec }); res.end(body); };

  router.get('/healthz', (req, res) => send(res, 200, { ok: true, uptime: Math.round(process.uptime()) }));

  router.get(/^\/(?:index\.html)?$/, (req, res) => redirect(res, 302, `/${seo.negotiateLang(req.headers['accept-language'])}/`, { Vary: 'Accept-Language' }));

  router.get(/^\/(cs|en|ru|uk)(?:\/(privacy)?)?$/, (req, res, { url, params: [lang, page] }) => {
    if (!url.pathname.endsWith('/')) return redirect(res, 301, url.pathname + '/');
    const p = page ? 'privacy/' : '';
    html(res, seo.renderPage(template(page ? 'privacy.html' : 'index.html'), { db: store.db, baseUrl: cfg.baseUrl, lang, page: p, ogImage }));
  });
  router.get(/^\/(cs|en|ru|uk)\/privacy\/$/, (req, res, { params: [lang] }) => {
    html(res, seo.renderPage(template('privacy.html'), { db: store.db, baseUrl: cfg.baseUrl, lang, page: 'privacy/', ogImage }));
  });

  router.get('/admin', (req, res) => serveFile(req, res, path.join(cfg.publicDir, 'admin.html'), 'no-cache'));
  router.get('/sitemap.xml', (req, res) => send(res, 200, seo.sitemap(cfg.baseUrl), { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' }));
  router.get('/robots.txt', (req, res) => send(res, 200, seo.robots(cfg.baseUrl), { 'Cache-Control': 'public, max-age=3600' }));
};
