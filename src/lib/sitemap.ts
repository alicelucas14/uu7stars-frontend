// ===== src/lib/sitemap.ts =====
// Shared helpers for the content-type sitemaps.
// - one <url> per language version, each carrying the same reciprocal hreflang set
// - x-default always points at the English URL
// - <lastmod> is only emitted when a real content date exists

import { createPath } from './paths';

export interface SitemapItem {
  /** English path, e.g. "/blog/my-post/" */
  path: string;
  /** Real content date. Omit when unknown - never use "now". */
  lastmod?: string | Date | null;
  /** Which language versions are eligible for the sitemap. */
  en: boolean;
  hi: boolean;
}

export function toIso(d?: string | Date | null): string | undefined {
  if (!d) return undefined;
  const date = d instanceof Date ? d : new Date(d);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function urlEntry(siteUrl: string, item: SitemapItem, lang: 'en' | 'hi'): string {
  const loc = `${siteUrl}${createPath(item.path, lang)}`;
  const links: string[] = [];
  if (item.en) links.push(`<xhtml:link rel="alternate" hreflang="en" href="${siteUrl}${createPath(item.path, 'en')}" />`);
  if (item.hi) links.push(`<xhtml:link rel="alternate" hreflang="hi" href="${siteUrl}${createPath(item.path, 'hi')}" />`);
  if (item.en) links.push(`<xhtml:link rel="alternate" hreflang="x-default" href="${siteUrl}${createPath(item.path, 'en')}" />`);
  const lastmod = toIso(item.lastmod);
  return `
  <url>
    <loc>${loc}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}
    ${links.join('\n    ')}
  </url>`;
}

export function buildUrlset(siteUrl: string, items: SitemapItem[]): string {
  const entries = items
    .flatMap((item) => [
      item.en ? urlEntry(siteUrl, item, 'en') : '',
      item.hi ? urlEntry(siteUrl, item, 'hi') : '',
    ])
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${entries}
</urlset>`.trim();
}

export function xmlResponse(xml: string, maxAge = 3600): Response {
  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': `public, max-age=${maxAge}, s-maxage=${maxAge}`,
    },
  });
}

/** Fetch a list in one language; null means the API call failed. */
export async function tryList<T>(get: () => Promise<T[]>): Promise<T[] | null> {
  try {
    return await get();
  } catch (err) {
    console.error('Sitemap: list fetch failed', err);
    return null;
  }
}

/**
 * Fetch both language lists. If EITHER fails we cannot tell which URLs really exist, so return null
 * and let the caller answer 503 (search engines keep the previous sitemap and retry) instead of
 * publishing a guessed list.
 */
export async function bothLists<T>(
  getEn: () => Promise<T[]>,
  getHi: () => Promise<T[]>
): Promise<{ en: T[]; hi: T[] } | null> {
  const [en, hi] = await Promise.all([tryList(getEn), tryList(getHi)]);
  return en && hi ? { en, hi } : null;
}

export function unavailableResponse(): Response {
  return new Response('Sitemap temporarily unavailable.', {
    status: 503,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Retry-After': '300', 'Cache-Control': 'no-store' },
  });
}

export interface MergedItem<T> {
  slug: string;
  enItem?: T;
  hiItem?: T;
  en: boolean;
  hi: boolean;
}

/**
 * Merge EN and HI lists by slug. A language version is eligible only if it appears in that
 * language's list AND has real content: the API's `translated` flag (title + body present) when
 * available, otherwise a non-empty title. Empty placeholder translations are therefore excluded.
 */
export function mergeLocales<T extends { slug?: string; title?: unknown; translated?: boolean }>(
  en: T[],
  hi: T[]
): MergedItem<T>[] {
  const ready = (i?: T) =>
    !!i && (typeof i.translated === 'boolean' ? i.translated : String(i.title ?? '').trim().length > 0);

  const map = new Map<string, { slug: string; enItem?: T; hiItem?: T }>();
  for (const i of en) if (i?.slug) map.set(i.slug, { slug: i.slug, enItem: i });
  for (const i of hi) {
    if (!i?.slug) continue;
    const e = map.get(i.slug) ?? { slug: i.slug };
    e.hiItem = i;
    map.set(i.slug, e);
  }
  return Array.from(map.values()).map((e) => ({
    ...e,
    en: !!e.enItem && (typeof e.enItem.translated === 'boolean' ? e.enItem.translated : true),
    hi: ready(e.hiItem),
  }));
}
