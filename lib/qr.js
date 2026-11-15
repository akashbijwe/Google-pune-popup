import crypto from 'crypto';
import { QR_SECRET } from './config';

// Table numbers are sealed with AES-256-GCM. A fresh random IV is used each time,
// so the same table yields a different (but equally valid) code on every print.
const KEY = crypto.createHash('sha256').update(QR_SECRET).digest();

export function encryptTable(table) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const enc = Buffer.concat([c.update(`table:${table}`, 'utf8'), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), enc]).toString('base64url');
}

// Returns the table number as a string, or null if the code is invalid/tampered.
export function decryptTable(token) {
  try {
    const buf = Buffer.from(String(token || ''), 'base64url');
    if (buf.length < 29) return null;
    const d = crypto.createDecipheriv('aes-256-gcm', KEY, buf.subarray(0, 12));
    d.setAuthTag(buf.subarray(12, 28));
    const text = Buffer.concat([d.update(buf.subarray(28)), d.final()]).toString('utf8');
    const m = /^table:(\d{1,3})$/.exec(text);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}
