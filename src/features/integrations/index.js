'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const TIMEOUT = 10e3;
const fetchT = (url, opt = {}) => fetch(url, { ...opt, signal: AbortSignal.timeout(TIMEOUT) });

function createCalendar({ cfg, store, log }) {
  let token = { value: null, exp: 0 };
  const creds = () => {
    try {
      if (cfg.google.serviceAccountJson) return JSON.parse(cfg.google.serviceAccountJson);
      const f = cfg.google.serviceAccountFile || path.join(cfg.dataDir, 'google-service-account.json');
      if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8'));
    } catch (e) { log.error('google credentials invalid', { err: e.message }); }
    return null;
  };
  const calendarId = () => cfg.google.calendarId || store.db.settings.googleCalendarId;
  const enabled = () => !!(creds() && calendarId());

  async function accessToken() {
    if (token.value && token.exp > Date.now() + 60e3) return token.value;
    const c = creds();
    const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    const unsigned = b64({ alg: 'RS256', typ: 'JWT' }) + '.' + b64({
      iss: c.client_email, scope: 'https://www.googleapis.com/auth/calendar.events', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600
    });
    const sig = crypto.createSign('RSA-SHA256').update(unsigned).sign(c.private_key, 'base64url');
    const r = await fetchT('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: unsigned + '.' + sig })
    });
    const j = await r.json();
    if (!j.access_token) throw new Error('google token error: ' + (j.error || r.status));
    token = { value: j.access_token, exp: Date.now() + j.expires_in * 1000 };
    return token.value;
  }

  async function call(method, suffix, body) {
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId())}/events${suffix}`;
    const r = await fetchT(url, { method, headers: { Authorization: 'Bearer ' + (await accessToken()), 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });
    if (r.status === 204 || r.status === 410) return {};
    const j = await r.json();
    if (!r.ok) throw new Error('google calendar ' + r.status + ': ' + (j.error?.message || ''));
    return j;
  }

  function eventBody(b) {
    const db = store.db, tz = db.settings.timezone;
    const svc = db.services.find((s) => s.id === b.serviceId) || { name: '?' };
    const sp = db.specialists.find((s) => s.id === b.specialistId) || { name: '?' };
    return {
      summary: `${svc.name} — ${b.name}`,
      description: `Specialista: ${sp.name}\nTelefon: ${b.phone}\nStav: ${b.status}`,
      start: { dateTime: `${b.date}T${b.start}:00`, timeZone: tz },
      end: { dateTime: `${b.date}T${b.end}:00`, timeZone: tz },
      reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 60 }, { method: 'popup', minutes: 1440 }] }
    };
  }

  async function sync(b, op) {
    if (!enabled()) return;
    try {
      if (op === 'create') { const e = await call('POST', '', eventBody(b)); b.gcalEventId = e.id; }
      else if (op === 'update' && b.gcalEventId) await call('PATCH', '/' + encodeURIComponent(b.gcalEventId), eventBody(b));
      else if (op === 'delete' && b.gcalEventId) { await call('DELETE', '/' + encodeURIComponent(b.gcalEventId)); b.gcalEventId = ''; }
      b.gcalError = '';
    } catch (e) { b.gcalError = String(e.message).slice(0, 200); log.error('calendar sync failed', { op, booking: b.id, err: e.message }); }
    store.save();
  }

  return { enabled, sync, serviceEmail: () => creds()?.client_email || '', hasCreds: () => !!creds() };
}

function createNotifier({ cfg, store, log }) {
  return async function notify(text) {
    const chat = cfg.telegram.chatId || store.db.settings.notifyTelegramChatId;
    if (!cfg.telegram.token || !chat) return;
    try {
      await fetchT(`https://api.telegram.org/bot${cfg.telegram.token}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chat, text })
      });
    } catch (e) { log.warn('telegram notify failed', { err: e.name }); }
  };
}

module.exports = { createCalendar, createNotifier };
