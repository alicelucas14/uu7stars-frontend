// Spam guards for the contact form on the About page (used by src/pages/api/contact.ts and AboutPage.astro).
//
//  - A signed "form token" is put in the page when it is rendered. The submit must carry it, and not too early (a person
//    needs a couple of seconds to fill a form) nor too late. It is signed with the server's API key, so it cannot be
//    made up; a bot has to load the page first, like a visitor.
//  - A small in-memory limiter per visitor address. It is a first line only (the address comes from proxy headers and
//    the counters reset on a restart); the backend keeps its own caps per email address and per hour as the backstop.
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const SECRET: string = import.meta.env.BACKEND_API_KEY || randomBytes(32).toString('hex'); // random = tokens die with the process
export const MIN_FILL_MS = 2_000;
export const MAX_FILL_MS = 2 * 60 * 60 * 1000;

const sign = (stamp: string) => createHmac('sha256', SECRET).update(`contact:${stamp}`).digest('hex').slice(0, 32);

export function makeFormToken(now = Date.now()): string {
  const stamp = String(now);
  return `${stamp}.${sign(stamp)}`;
}

export type TokenCheck = 'ok' | 'invalid' | 'too-fast' | 'expired';
export function checkFormToken(token: unknown, now = Date.now()): TokenCheck {
  if (typeof token !== 'string' || token.length > 80) return 'invalid';
  const [stamp, sig, extra] = token.split('.');
  if (!stamp || !sig || extra !== undefined || !/^\d{10,16}$/.test(stamp)) return 'invalid';
  const expected = Buffer.from(sign(stamp));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return 'invalid';
  const age = now - Number(stamp);
  if (age < MIN_FILL_MS) return 'too-fast';
  if (age > MAX_FILL_MS) return 'expired';
  return 'ok';
}

// --- limiter ---
const hits = new Map<string, number[]>();
let lastSweep = 0;
/** true = allowed (and counted); false = over the limit. */
export function allow(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  if (now - lastSweep > 60_000) { // drop stale keys so the map cannot grow without bound
    lastSweep = now;
    for (const [k, list] of hits) if (!list.length || now - list[list.length - 1] > 60 * 60 * 1000) hits.delete(k);
  }
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (list.length >= limit) { hits.set(key, list); return false; }
  list.push(now);
  hits.set(key, list);
  return true;
}

/** Best guess of the visitor's address behind our proxy (Cloudflare / nginx), for rate limiting only. */
export function visitorKey(request: Request, clientAddress?: string): string {
  const h = request.headers;
  const raw = h.get('cf-connecting-ip') || h.get('x-real-ip') || (h.get('x-forwarded-for') || '').split(',')[0] || clientAddress || 'unknown';
  return raw.trim().slice(0, 64) || 'unknown';
}
