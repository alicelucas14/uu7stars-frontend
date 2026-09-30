// ===== frontend/src/pages/sitemap-pages.xml.ts =====
// EN + HI entries, reciprocal hreflang (+ x-default). lastmod = the page's real updatedAt.

import type { APIRoute } from 'astro';
import { getPagesList } from '../services/api';
import { buildUrlset, mergeLocales, tryList, xmlResponse, type SitemapItem } from '../lib/sitemap';

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = site?.toString().replace(/\/$/, '') ?? '';

  const [en, hi] = await Promise.all([
    tryList(() => getPagesList('en')),
    tryList(() => getPagesList('hi')),
  ]);

  const items: SitemapItem[] = mergeLocales(en, hi)
    .filter((m) => m.en || m.hi)
    .map((m) => ({
      path: `/${encodeURIComponent(m.slug.trim())}/`,
      lastmod: (m.enItem ?? m.hiItem)?.updatedAt,
      en: m.en,
      hi: m.hi,
    }));

  return xmlResponse(buildUrlset(siteUrl, items));
};
