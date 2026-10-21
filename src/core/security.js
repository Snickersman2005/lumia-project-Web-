'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const sha = (v) => crypto.createHash('sha256').update(String(v)).digest();
const safeEqual = (a, b) => typeof a === 'string' && typeof b === 'string' && crypto.timingSafeEqual(sha(a), sha(b));

function resolveAdminPassword(cfg, log) {
  if (cfg.adminPassword) {
    if (cfg.adminPassword.length < 12) log.warn('ADMIN_PASSWORD is shorter than 12 characters');
    return cfg.adminPassword;
  }
  const file = path.join(cfg.dataDir, 'admin-password.txt');
  const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').trim() : '';
  if (existing.length >= 16) return existing;
  const pw = crypto.randomBytes(18).toString('base64url');
  fs.writeFileSync(file, pw, { mode: 0o600 });
  log.warn('generated new admin password — see data/admin-password.txt');
  return pw;
}

class Sessions {
  constructor(ttlMs = 8 * 3600e3) { this.ttl = ttlMs; this.map = new Map(); }
  create() {
    const now = Date.now();
    for (const [k, exp] of this.map) if (exp < now) this.map.delete(k);
    const token = crypto.randomBytes(32).toString('hex');
    this.map.set(token, now + this.ttl);
    return token;
  }
  valid(token) {
    const exp = token && this.map.get(token);
    if (!exp) return false;
    if (exp < Date.now()) { this.map.delete(token); return false; }
    return true;
  }
  revoke(token) { this.map.delete(token); }
}

class RateLimiter {
  constructor() {
    this.hits = new Map();
    this.timer = setInterval(() => this.sweep(), 600e3);
    this.timer.unref();
  }
  hit(key, max, windowMs) {
    const now = Date.now();
    if (this.hits.size > 50000) this.hits.clear();
    const arr = (this.hits.get(key) || []).filter((t) => now - t < windowMs);
    arr.push(now);
    this.hits.set(key, arr);
    return arr.length > max;
  }
  sweep() { const now = Date.now(); for (const [k, a] of this.hits) if (!a.length || now - a[a.length - 1] > 3600e3) this.hits.delete(k); }
  stop() { clearInterval(this.timer); }
}

const clientIp = (req, trustProxy) => (trustProxy && req.headers['x-forwarded-for']
  ? String(req.headers['x-forwarded-for']).split(',').pop().trim()
  : req.socket.remoteAddress) || 'unknown';
const isSecure = (req, trustProxy) => !!req.socket.encrypted || (trustProxy && req.headers['x-forwarded-proto'] === 'https');

const parseCookies = (req) => Object.fromEntries((req.headers.cookie || '').split(/;\s*/).filter(Boolean).map((c) => {
  const i = c.indexOf('='); return i < 0 ? [c, ''] : [c.slice(0, i), c.slice(i + 1)];
}));

function sameOrigin(req) {
  const o = req.headers.origin || req.headers.referer;
  if (!o) return true;
  try { return new URL(o).host === req.headers.host; } catch { return false; }
}

const CSP = [
  "default-src 'self'", "script-src 'self'", "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  'font-src https://fonts.gstatic.com', "img-src 'self' data:", 'frame-src https://www.google.com https://maps.google.com',
  "connect-src 'self'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'", "object-src 'none'"
].join('; ');
function securityHeaders(secure) {
  const h = {
    'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'X-Frame-Options': 'DENY',
    'Permissions-Policy': 'geolocation=(), camera=(), microphone=(), payment=(), interest-cohort=()',
    'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Resource-Policy': 'same-origin', 'Content-Security-Policy': CSP
  };
  if (secure) h['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
  return h;
}

module.exports = { resolveAdminPassword, safeEqual, Sessions, RateLimiter, clientIp, isSecure, parseCookies, sameOrigin, securityHeaders };
