'use strict';

const { createApp } = require('./src/app');

let app;
try {
  app = createApp();
} catch (e) {
  console.error(JSON.stringify({ t: new Date().toISOString(), level: 'error', msg: 'startup failed', err: e.message }));
  process.exit(1);
}
const { server, cfg, log } = app;

server.listen(cfg.port, cfg.host, () => {
  log.info('server started', { url: `http://localhost:${cfg.port}`, admin: `http://localhost:${cfg.port}/admin`, baseUrl: cfg.baseUrl, production: cfg.production });
});

let stopping = false;
for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, async () => {
    if (stopping) return;
    stopping = true;
    log.info('shutting down', { signal: sig });
    const force = setTimeout(() => process.exit(1), 10e3);
    force.unref();
    await app.close();
    process.exit(0);
  });
}
process.on('unhandledRejection', (e) => log.error('unhandled rejection', { err: String(e && e.message || e) }));
