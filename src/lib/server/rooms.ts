import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // zonder I, O, 0, 1
export function newRoomId() {
  const b = randomBytes(6);
  return Array.from(b, (x) => ALPHABET[x % ALPHABET.length]).join('');
}
export function newId() {
  return randomBytes(9).toString('base64url');
}
export function normalizeRoomId(raw: string) {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function hashPin(roomId: string, pin: string) {
  const salt = randomBytes(8).toString('hex');
  const h = scryptSync(`${roomId}:${pin}`, salt, 32).toString('hex');
  return `${salt}:${h}`;
}
export function verifyPin(roomId: string, pin: string, stored: string) {
  const [salt, h] = stored.split(':');
  if (!salt || !h) return false;
  const a = Buffer.from(h, 'hex');
  const b = scryptSync(`${roomId}:${pin}`, salt, 32);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Simpele in-memory rem tegen het raden van pincodes (best effort, per server-instance).
const fails = new Map<string, { n: number; first: number }>();
export function tooManyFails(roomId: string) {
  const f = fails.get(roomId);
  if (!f) return false;
  if (Date.now() - f.first > 10 * 60_000) {
    fails.delete(roomId);
    return false;
  }
  return f.n >= 10;
}
export function registerFail(roomId: string) {
  const f = fails.get(roomId);
  if (!f || Date.now() - f.first > 10 * 60_000) fails.set(roomId, { n: 1, first: Date.now() });
  else f.n++;
}
export function clearFails(roomId: string) {
  fails.delete(roomId);
}

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}
