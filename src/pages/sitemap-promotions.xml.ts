// ===== frontend/src/pages/sitemap-promotions.xml.ts =====
// EN + HI entries, reciprocal hreflang (+ x-default).
// No <lastmod>: the list API exposes no real update date, and "now" is not meaningful.

import type { APIRoute } from 'astro';
import { getPromotions } from '../services/api';
import { buildUrlset, mergeLocales, tryList, xmlResponse, type SitemapItem } from '../lib/sitemap';

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = site?.toString().replace(/\/$/, '') ?? '';

  const [en, hi] = await Promise.all([
    tryList(() => getPromotions('en')),
    tryList(() => getPromotions('hi')),
  ]);

  const items: SitemapItem[] = mergeLocales(en, hi)
    .filter((m) => m.en || m.hi)
    .map((m) => ({
      path: `/promotions/${encodeURIComponent(m.slug.trim())}/`,
      en: m.en,
      hi: m.hi,
    }));

  return xmlResponse(buildUrlset(siteUrl, items));
};
