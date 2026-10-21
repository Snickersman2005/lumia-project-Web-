'use strict';

function cell(v) {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[";\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function toCsv(rows, cols) {
  const lines = [cols.map(([, h]) => cell(h)).join(';')];
  for (const r of rows) lines.push(cols.map(([k]) => cell(typeof k === 'function' ? k(r) : r[k])).join(';'));
  return '﻿' + lines.join('\r\n') + '\r\n';
}

module.exports = { toCsv, cell };
