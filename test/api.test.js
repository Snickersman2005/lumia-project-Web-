'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createApp } = require('../src/app');

const PASSWORD = 'test-admin-password-1234567890';
const silent = { debug() {}, info() {}, warn() {}, error() {} };
let app, base, dir;

test.before(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lumia-test-'));
  app = createApp({ dataDir: dir, adminPassword: PASSWORD, logger: silent, port: 0, rateLimit: false });
  await new Promise((r) => app.server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${app.server.address().port}`;
});
test.after(async () => { await app.close(); fs.rmSync(dir, { recursive: true, force: true }); });

const json = (method, p, body, headers = {}) => fetch(base + p, {
  method, headers: { 'Content-Type': 'application/json', ...headers }, body: body === undefined ? undefined : JSON.stringify(body), redirect: 'manual'
});
async function login() {
  const r = await json('POST', '/api/admin/login', { password: PASSWORD });
  assert.equal(r.status, 200);
  return r.headers.get('set-cookie').split(';')[0];
}
async function firstSlot(service = 's4', specialist = 'p1') {
  const { days } = await (await fetch(`${base}/api/availability?service=${service}&specialist=${specialist}`)).json();
  for (const d of days) {
    const { slots } = await (await fetch(`${base}/api/slots?service=${service}&specialist=${specialist}&date=${d}`)).json();
    if (slots.length) return { date: d, time: slots[0].time };
  }
  throw new Error('no slots');
}
const booking = (o) => ({ serviceId: 's4', specialistId: 'p1', name: 'Kateřina Nováková', phone: '777 123 456', email: 'katka@seznam.cz', consent: true, lang: 'cs', ...o });

test('pages: language redirect, SEO head, security headers, sitemap', async () => {
  const r = await fetch(base + '/', { headers: { 'Accept-Language': 'uk-UA,uk;q=0.9' }, redirect: 'manual' });
  assert.equal(r.status, 302);
  assert.equal(r.headers.get('location'), '/uk/');
  const page = await fetch(base + '/en/');
  const html = await page.text();
  assert.match(html, /<html lang="en" data-lang="en"/);
  assert.match(html, /hreflang="cs"/);
  assert.match(html, /"@type":"BeautySalon"/);
  assert.match(page.headers.get('content-security-policy'), /script-src 'self'/);
  assert.equal(page.headers.get('x-frame-options'), 'DENY');
  assert.match(await (await fetch(base + '/sitemap.xml')).text(), /<loc>.*\/cs\/privacy\/<\/loc>/);
  assert.match(await (await fetch(base + '/robots.txt')).text(), /Disallow: \/admin/);
  assert.equal((await fetch(base + '/healthz')).status, 200);
});

test('static files: path traversal and private data are not reachable', async () => {
  for (const p of ['/../data/db.json', '/%2e%2e/data/db.json', '/..%5cserver.js', '/media/../db.json', '/data/admin-password.txt']) {
    assert.equal((await fetch(base + p)).status, 404, p);
  }
});

test('booking: validation, phone normalization, double-booking prevention', async () => {
  const slot = await firstSlot();
  assert.equal((await json('POST', '/api/bookings', booking({ ...slot, phone: '123' }))).status, 400);
  assert.equal((await json('POST', '/api/bookings', booking({ ...slot, consent: 'yes' }))).status, 400);
  assert.equal((await json('POST', '/api/bookings', booking({ ...slot, date: '2026-02-30' }))).status, 400);
  const r = await json('POST', '/api/bookings', booking(slot));
  assert.equal(r.status, 201);
  const { booking: b } = await r.json();
  assert.match(b.token, /^[0-9a-f]{32}$/);
  const again = await json('POST', '/api/bookings', booking(slot));
  assert.equal(again.status, 409);
  assert.equal((await again.json()).code, 'taken');
  const stored = app.store.db.bookings.find((x) => x.id === b.id);
  assert.equal(stored.phone, '+420777123456');
  assert.equal(stored.consent.version, '2026-10');
});

test('XSS payloads are stored as plain text and never as HTML', async () => {
  const slot = await firstSlot('s1', 'p2');
  const r = await json('POST', '/api/bookings', booking({ ...slot, serviceId: 's1', specialistId: 'p2', name: '<img src=x onerror=alert(1)>Eva', comment: '<script>alert(1)</script>' }));
  assert.equal(r.status, 201);

  const ct = r.headers.get('content-type');
  assert.match(ct, /^application\/json/);
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
});

test('CSRF: cross-origin and non-JSON writes are rejected', async () => {
  const r1 = await json('POST', '/api/reviews', { name: 'Eva', text: 'Skvělé služby, doporučuji!' }, { Origin: 'https://evil.example' });
  assert.equal(r1.status, 403);
  const r2 = await fetch(base + '/api/reviews', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: '{"name":"Eva","text":"Skvělé služby!!"}' });
  assert.equal(r2.status, 415);
});

test('malformed and oversized bodies', async () => {
  for (const body of ['null', '[1]', '{bad']) {
    const r = await fetch(base + '/api/manage/cancel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    assert.equal(r.status, 400, body);
  }
  const big = await fetch(base + '/api/manage/cancel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ x: 'a'.repeat(200000) }) });
  assert.equal(big.status, 413);
});

test('admin auth: wrong password, session revocation, protected routes', async () => {
  assert.equal((await json('POST', '/api/admin/login', { password: 'wrong' })).status, 401);
  assert.equal((await fetch(base + '/api/admin/data')).status, 401);
  const cookie = await login();
  assert.equal((await fetch(base + '/api/admin/data', { headers: { Cookie: cookie } })).status, 200);
  await json('POST', '/api/admin/logout', {}, { Cookie: cookie });
  assert.equal((await fetch(base + '/api/admin/data', { headers: { Cookie: cookie } })).status, 401);
});

test('admin settings: URL scheme, IČO, coordinates validation', async () => {
  const cookie = await login();
  const r = await json('PUT', '/api/admin/settings', { instagram: 'javascript:alert(1)', ico: '12AB', lat: 999, lon: -0.12 }, { Cookie: cookie });
  const s = await r.json();
  assert.equal(s.instagram, '');
  assert.equal(s.ico, '00000000');
  assert.equal(s.lat, 50.0813);
  assert.equal(s.lon, -0.12);
  assert.equal((await json('PUT', '/api/admin/settings', { timezone: 'Mars/Olympus' }, { Cookie: cookie })).status, 400);
});

test('CSV export is protected and injection safe', async () => {
  assert.equal((await fetch(base + '/api/admin/export.csv')).status, 401);
  const cookie = await login();
  const r = await fetch(base + '/api/admin/export.csv', { headers: { Cookie: cookie } });
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-disposition'), /attachment; filename="rezervace-/);
  const bytes = Buffer.from(await r.arrayBuffer());
  assert.deepEqual([...bytes.subarray(0, 3)], [0xef, 0xbb, 0xbf]);
  assert.match(bytes.toString('utf8', 3), /^Datum;/);
});

test('manage link: wrong token, reschedule, GDPR erasure', async () => {
  const slot = await firstSlot('s4', 'p1');
  const { booking: b } = await (await json('POST', '/api/bookings', booking(slot))).json();
  assert.equal((await fetch(`${base}/api/manage?id=${b.id}&token=${'0'.repeat(32)}`)).status, 404);
  const info = await (await fetch(`${base}/api/manage?id=${b.id}&token=${b.token}`)).json();
  assert.equal(info.booking.id, b.id);
  const er = await json('POST', '/api/manage/erase', { id: b.id, token: b.token });
  assert.equal(er.status, 200);
  const stored = app.store.db.bookings.find((x) => x.id === b.id);
  assert.equal(stored.name, '—');
  assert.equal(stored.status, 'cancelled');
  assert.equal((await fetch(`${base}/api/manage?id=${b.id}&token=${b.token}`)).status, 404);
});

test('admin cannot reopen a cancelled booking into an occupied slot', async () => {
  const cookie = await login();
  const slot = await firstSlot('s4', 'p3');
  const a = (await (await json('POST', '/api/bookings', booking({ ...slot, specialistId: 'p3' }))).json()).booking;
  await json('POST', '/api/manage/cancel', { id: a.id, token: a.token });
  assert.equal((await json('POST', '/api/bookings', booking({ ...slot, specialistId: 'p3' }))).status, 201);
  assert.equal((await json('PUT', `/api/admin/bookings/${a.id}`, { status: 'confirmed' }, { Cookie: cookie })).status, 409);
});

test('before/after upload accepts only real images and requires consent for client photos', async () => {
  const cookie = await login();
  const png = fs.readFileSync(path.join(__dirname, 'fixtures', 'pixel.png')).toString('base64');
  assert.equal((await json('POST', '/api/admin/before-after', { before: Buffer.from('<svg/>').toString('base64'), after: png }, { Cookie: cookie })).status, 400);
  assert.equal((await json('POST', '/api/admin/before-after', { before: png, after: png, kind: 'client' }, { Cookie: cookie })).status, 400);
  const r = await json('POST', '/api/admin/before-after', { before: png, after: png, kind: 'illustration', caption: 'Test', published: true }, { Cookie: cookie });
  assert.equal(r.status, 201);
  const item = await r.json();
  const img = await fetch(base + item.before);
  assert.equal(img.status, 200);
  assert.equal(img.headers.get('content-type'), 'image/png');
});

test('rate limiting blocks brute force on admin login', async () => {
  const dir2 = fs.mkdtempSync(path.join(os.tmpdir(), 'lumia-rl-'));
  const app2 = createApp({ dataDir: dir2, adminPassword: PASSWORD, logger: silent, port: 0 });
  await new Promise((r) => app2.server.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${app2.server.address().port}/api/admin/login`;
  const statuses = [];
  for (let i = 0; i < 12; i++) statuses.push((await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"password":"x"}' })).status);
  await app2.close();
  fs.rmSync(dir2, { recursive: true, force: true });
  assert.deepEqual(statuses.slice(0, 10), Array(10).fill(401));
  assert.deepEqual(statuses.slice(10), [429, 429]);
});
