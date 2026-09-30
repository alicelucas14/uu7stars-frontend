// ===== frontend/src/pages/sitemap-reviews.xml.ts =====
// EN + HI entries, reciprocal hreflang (+ x-default). Never 500s on API hiccups.
// No <lastmod>: the list API exposes no real update date, and "now" is not meaningful.

import type { APIRoute } from 'astro';
import { getReviews } from '../services/api';
import { buildUrlset, mergeLocales, tryList, xmlResponse, type SitemapItem } from '../lib/sitemap';

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = site?.toString().replace(/\/$/, '') ?? '';

  const [en, hi] = await Promise.all([
    tryList(() => getReviews('en')),
    tryList(() => getReviews('hi')),
  ]);

  const items: SitemapItem[] = mergeLocales(en, hi)
    .filter((m) => m.en || m.hi)
    .map((m) => ({
      path: `/reviews/${encodeURIComponent(m.slug.trim())}/`,
      en: m.en,
      hi: m.hi,
    }));

  return xmlResponse(buildUrlset(siteUrl, items));
};
