import { getLinkRedirects } from '../services/api';

/**
 * Same normalisation as normalizeFrom() in adminorg/lib/linkRedirects.js: decoded, lowercase, one slash
 * between segments, no trailing slash. "/Hi/Blog/Old-Post/" -> "/hi/blog/old-post"; the home page -> "".
 */
export function normalizePath(pathname: string): string {
  let s = pathname;
  try { s = decodeURIComponent(s); } catch { /* keep as is */ }
  s = s.toLowerCase().replace(/\/{2,}/g, '/');
  if (!s.startsWith('/')) s = `/${s}`;
  return s.replace(/\/+$/, '');
}

/**
 * If an admin-defined redirect exists for this address, return the 301/302; otherwise null (the caller keeps
 * its 404). Only call this for responses that are already a 404, so a redirect can never hide live content.
 */
export async function redirectForLink(url: URL): Promise<Response | null> {
  const key = normalizePath(url.pathname);
  if (!key) return null; // the home page is never redirected
  const rule = (await getLinkRedirects()).find((r) => r.from === key);
  if (!rule) return null;

  let location: string;
  if (/^https?:\/\//i.test(rule.to)) {
    location = new URL(rule.to).href;
  } else {
    const target = new URL(rule.to, url); // encodes spaces, Hindi etc. for the header
    if (normalizePath(target.pathname) === key) return null; // would redirect to itself
    location = target.pathname + target.search + target.hash;
  }
  return new Response(null, { status: rule.status === 302 ? 302 : 301, headers: { Location: location } });
}
