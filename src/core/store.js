'use strict';

const fs = require('fs');
const path = require('path');

const SCHEMA_VERSION = 2;
const DEFAULT_SETTINGS = {
  companyName: 'LUMIA s.r.o.', ico: '00000000', dic: '', vatPayer: true, closedOnHolidays: true
};

function migrate(db) {
  db.settings = { ...DEFAULT_SETTINGS, ...db.settings };
  for (const k of ['services', 'specialists', 'promos', 'reviews', 'faq', 'bookings', 'beforeAfter']) if (!Array.isArray(db[k])) db[k] = [];
  db.schemaVersion = SCHEMA_VERSION;
  return db;
}

class Store {
  constructor(dataDir, { seed, log }) {
    this.dir = dataDir;
    this.file = path.join(dataDir, 'db.json');
    this.log = log;
    fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });
    this.db = this.read();
    if (!this.db) { this.db = seed(); this.log.info('database seeded'); }
    migrate(this.db);
    this.save();
  }

  read() {
    for (const f of [this.file, this.file + '.bak']) {
      if (!fs.existsSync(f)) continue;
      try {
        const d = JSON.parse(fs.readFileSync(f, 'utf8'));
        if (f !== this.file) this.log.warn('db.json corrupted — restored from backup');
        return d;
      } catch (e) { this.log.error('cannot read database file', { file: path.basename(f), err: e.message }); }
    }
    if (fs.existsSync(this.file)) throw new Error('Database is corrupted and no backup exists — fix data/db.json manually (it will not be overwritten).');
    return null;
  }

  save() {
    const tmp = this.file + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(this.db, null, 2), { mode: 0o600 });
    if (fs.existsSync(this.file)) fs.copyFileSync(this.file, this.file + '.bak');
    fs.renameSync(tmp, this.file);
  }
}

module.exports = { Store, migrate, SCHEMA_VERSION };
