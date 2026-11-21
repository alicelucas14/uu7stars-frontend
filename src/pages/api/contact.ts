// GET /api/contact/ gives the form its signed token. POST /api/contact/ - receives the contact form on the About page
// and passes it on to the admin (Admin > Messages).
// The browser only ever talks to this route (same origin); the API key lives on this server. Answers are small JSON
// objects the form turns into a message in the visitor's language: { ok: true } or { ok: false, code, field? }.
import type { APIRoute } from 'astro';
import { submitContact } from '../../services/api';
import { allow, checkFormToken, makeFormToken, visitorKey } from '../../lib/contactGuard';

export const prerender = false;

const MAX_BODY_BYTES = 12_000; // a 2000-character message in any language fits many times over
const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
const text = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');

// The form asks for its token when the page has loaded (not at render time), so a copy of the page kept by a CDN or the
// browser can never carry a stale one. The "too fast" clock starts here.
export const GET: APIRoute = () => json(200, { token: makeFormToken() });

export const POST: APIRoute = async ({ request, clientAddress }) => {
  // A plain HTML form on another site cannot send JSON without a CORS pre-flight (which this site never allows), so
  // requiring JSON also keeps other websites from posting through a visitor's browser.
  if (!(request.headers.get('content-type') || '').toLowerCase().startsWith('application/json')) return json(415, { ok: false, code: 'error' });
  if (Number(request.headers.get('content-length') || 0) > MAX_BODY_BYTES) return json(413, { ok: false, code: 'error' });

  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) return json(413, { ok: false, code: 'error' });
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object');
    body = parsed as Record<string, unknown>;
  } catch {
    return json(400, { ok: false, code: 'error' });
  }

  // Honeypot: a field people never see. Anything in it is a script: say "sent" and drop it, so it learns nothing.
  if (typeof body.website === 'string' && body.website.trim() !== '') return json(200, { ok: true });

  const token = checkFormToken(body.token);
  if (token === 'invalid' || token === 'expired') return json(400, { ok: false, code: 'reload' });
  if (token === 'too-fast') return json(429, { ok: false, code: 'wait' });

  const who = visitorKey(request, clientAddress);
  if (!allow(`contact:${who}`, 5, 15 * 60 * 1000) || !allow('contact:all', 300, 60 * 60 * 1000)) return json(429, { ok: false, code: 'busy' });

  const result = await submitContact({
    name: text(body.name, 200),
    email: text(body.email, 300),
    phone: text(body.phone, 60),
    userId: text(body.userId, 120),
    message: text(body.message, 4000),
    lang: body.lang === 'hi' ? 'hi' : 'en',
  });
  if (result.ok) return json(200, { ok: true });
  if (result.kind === 'invalid') return json(400, { ok: false, code: 'invalid', field: result.field });
  if (result.kind === 'busy') return json(429, { ok: false, code: 'busy' });
  return json(502, { ok: false, code: 'error' });
};

// Anything else on this address is not a page.
export const ALL: APIRoute = () => new Response(null, { status: 405, headers: { Allow: 'POST' } });
