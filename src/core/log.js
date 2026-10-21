'use strict';

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 99 };

function createLogger(level = 'info') {
  const min = LEVELS[level] ?? LEVELS.info;
  const write = (lvl, msg, extra) => {
    if (LEVELS[lvl] < min) return;
    const line = JSON.stringify({ t: new Date().toISOString(), level: lvl, msg, ...extra });
    (lvl === 'error' || lvl === 'warn' ? process.stderr : process.stdout).write(line + '\n');
  };
  return {
    debug: (m, e) => write('debug', m, e), info: (m, e) => write('info', m, e),
    warn: (m, e) => write('warn', m, e), error: (m, e) => write('error', m, e)
  };
}

module.exports = { createLogger };
