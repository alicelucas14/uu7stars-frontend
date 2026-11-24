// ===== frontend/src/pages/sitemap-reviews.xml.ts =====
// EN + HI entries, reciprocal hreflang (+ x-default). Never 500s on API hiccups.
// lastmod = the review's real updatedAt (omitted if the API doesn't provide it).

import type { APIRoute } from 'astro';
import { getReviews } from '../services/api';
import { isRealHindi } from '../lib/hreflang';
import { buildUrlset, bothLists, mergeLocales, unavailableResponse, xmlResponse, type SitemapItem } from '../lib/sitemap';

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = site?.toString().replace(/\/$/, '') ?? '';

  const lists = await bothLists(() => getReviews('en'), () => getReviews('hi'));
  if (!lists) return unavailableResponse();
  const { en, hi } = lists;

  const items: SitemapItem[] = mergeLocales(en, hi)
    .filter((m) => m.en || m.hi)
    .map((m) => ({
      path: `/reviews/${encodeURIComponent(m.slug.trim())}/`,
      lastmod: (m.enItem ?? m.hiItem)?.updatedAt,
      en: m.en,
      // The API flags finished Hindi reviews as untranslated; trust the Hindi text itself.
      hi: m.hi || isRealHindi(m.hiItem?.title, m.hiItem?.excerpt),
    }));

  return xmlResponse(buildUrlset(siteUrl, items));
};
