'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');

function loadDotEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (!m) continue;
    let v = m[2];
    if (/^(['"]).*\1$/.test(v)) v = v.slice(1, -1);
    if (!(m[1] in process.env)) process.env[m[1]] = v;
  }
}

function loadConfig(overrides = {}) {
  loadDotEnv(path.join(ROOT, '.env'));
  const env = process.env;
  const cfg = {
    root: ROOT,
    publicDir: path.join(ROOT, 'public'),
    port: Number(env.PORT) || 3000,
    host: env.HOST || '0.0.0.0',
    dataDir: path.resolve(env.DATA_DIR || path.join(ROOT, 'data')),
    production: env.NODE_ENV === 'production',
    trustProxy: env.TRUST_PROXY === '1',
    baseUrl: (env.BASE_URL || env.RENDER_EXTERNAL_URL || '').replace(/\/+$/, ''),
    adminPassword: env.ADMIN_PASSWORD || '',
    retentionMonths: Math.min(120, Math.max(1, Number(env.RETENTION_MONTHS) || 24)),
    logLevel: env.LOG_LEVEL || 'info',
    rateLimit: env.RATE_LIMIT !== '0',
    google: {
      serviceAccountJson: env.GOOGLE_SERVICE_ACCOUNT_JSON || '',
      serviceAccountFile: env.GOOGLE_SERVICE_ACCOUNT_FILE || '',
      calendarId: env.GOOGLE_CALENDAR_ID || ''
    },
    telegram: { token: env.TELEGRAM_BOT_TOKEN || '', chatId: env.TELEGRAM_CHAT_ID || '' },
    ...overrides
  };
  if (!cfg.baseUrl) cfg.baseUrl = `http://localhost:${cfg.port}`;
  return cfg;
}

module.exports = { loadConfig, loadDotEnv };
