'use strict';

function sniff(buf) {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  return null;
}

function stripJpeg(buf) {
  const out = [buf.subarray(0, 2)];
  let i = 2;
  while (i + 4 <= buf.length) {
    if (buf[i] !== 0xff) throw new Error('bad jpeg');
    const marker = buf[i + 1];
    if (marker === 0xda) { out.push(buf.subarray(i)); return Buffer.concat(out); }
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) { out.push(buf.subarray(i, i + 2)); i += 2; continue; }
    const len = buf.readUInt16BE(i + 2);
    if (len < 2 || i + 2 + len > buf.length) throw new Error('bad jpeg');
    if (!(marker === 0xe1 || marker === 0xed || marker === 0xfe)) out.push(buf.subarray(i, i + 2 + len));
    i += 2 + len;
  }
  throw new Error('bad jpeg');
}

function stripPng(buf) {
  const out = [buf.subarray(0, 8)];
  let i = 8, seenEnd = false;
  while (i + 12 <= buf.length) {
    const len = buf.readUInt32BE(i), type = buf.toString('latin1', i + 4, i + 8);
    if (i + 12 + len > buf.length) throw new Error('bad png');
    if (!['tEXt', 'iTXt', 'zTXt', 'eXIf', 'tIME'].includes(type)) out.push(buf.subarray(i, i + 12 + len));
    i += 12 + len;
    if (type === 'IEND') { seenEnd = true; break; }
  }
  if (!seenEnd) throw new Error('bad png');
  return Buffer.concat(out);
}

function dimensions(buf, type) {
  if (type === 'png') return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  let i = 2;
  while (i + 9 < buf.length) {
    const marker = buf[i + 1], len = buf.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) };
    i += 2 + len;
  }
  return { width: 0, height: 0 };
}

function sanitizeImage(buf, maxBytes = 4 * 1024 * 1024) {
  if (!Buffer.isBuffer(buf) || buf.length === 0 || buf.length > maxBytes) throw new Error('bad image');
  const type = sniff(buf);
  if (!type) throw new Error('bad image');
  try {
    const data = type === 'jpg' ? stripJpeg(buf) : stripPng(buf);
    const { width, height } = dimensions(data, type);
    if (!width || !height || width > 8000 || height > 8000) throw new Error('bad image');
    return { type, data, width, height };
  } catch { throw new Error('bad image'); }
}

module.exports = { sniff, stripJpeg, stripPng, sanitizeImage, dimensions };
