'use strict';

class HttpError extends Error {
  constructor(status, code, message) { super(message || code); this.status = status; this.code = code; }
}
const fail = (status, code, message) => { throw new HttpError(status, code, message); };

function send(res, status, data, headers = {}) {
  const isObj = typeof data === 'object' && !Buffer.isBuffer(data);
  res.writeHead(status, {
    'Content-Type': isObj ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store', ...res.sec, ...headers
  });
  res.end(isObj ? JSON.stringify(data) : data);
}

function readBody(req, maxBytes = 100 * 1024) {
  return new Promise((resolve, reject) => {
    if (!String(req.headers['content-type'] || '').startsWith('application/json')) {
      req.resume();
      return reject(new HttpError(415, 'unsupported', 'JSON expected'));
    }
    const chunks = [];
    let size = 0, tooBig = false;
    req.on('data', (c) => { size += c.length; if (size > maxBytes) { tooBig = true; chunks.length = 0; } else if (!tooBig) chunks.push(c); });
    req.on('end', () => {
      if (tooBig) return reject(new HttpError(413, 'too_big', 'Payload too large'));
      const s = Buffer.concat(chunks).toString('utf8');
      if (!s) return resolve({});
      try {
        const val = JSON.parse(s);
        if (val === null || typeof val !== 'object' || Array.isArray(val)) throw new Error();
        resolve(val);
      } catch { reject(new HttpError(400, 'bad_json', 'Invalid JSON')); }
    });
    req.on('error', () => reject(new HttpError(400, 'bad_request')));
  });
}

class Router {
  constructor() { this.routes = []; }
  add(method, pattern, handler, opts = {}) { this.routes.push({ method, pattern, handler, ...opts }); return this; }
  get(p, h, o) { return this.add('GET', p, h, o); }
  post(p, h, o) { return this.add('POST', p, h, o); }
  put(p, h, o) { return this.add('PUT', p, h, o); }
  delete(p, h, o) { return this.add('DELETE', p, h, o); }
  match(method, pathname) {
    let pathMatched = false;
    for (const r of this.routes) {
      const params = typeof r.pattern === 'string' ? (r.pattern === pathname ? [] : null) : r.pattern.exec(pathname)?.slice(1);
      if (!params) continue;
      pathMatched = true;
      if (r.method === method || (method === 'HEAD' && r.method === 'GET')) return { route: r, params };
    }
    return pathMatched ? { notAllowed: true } : null;
  }
}

module.exports = { HttpError, fail, send, readBody, Router };
