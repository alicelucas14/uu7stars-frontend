// ===== frontend/src/pages/sitemap-promotions.xml.ts =====
// EN + HI entries, reciprocal hreflang (+ x-default).
// lastmod = the promotion's real updatedAt (omitted if the API doesn't provide it).

import type { APIRoute } from 'astro';
import { getPromotions } from '../services/api';
import { buildUrlset, bothLists, mergeLocales, unavailableResponse, xmlResponse, type SitemapItem } from '../lib/sitemap';

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = site?.toString().replace(/\/$/, '') ?? '';

  const lists = await bothLists(() => getPromotions('en'), () => getPromotions('hi'));
  if (!lists) return unavailableResponse();
  const { en, hi } = lists;

  const items: SitemapItem[] = mergeLocales(en, hi)
    .filter((m) => m.en || m.hi)
    .map((m) => ({
      path: `/promotions/${encodeURIComponent(m.slug.trim())}/`,
      lastmod: (m.enItem ?? m.hiItem)?.updatedAt,
      en: m.en,
      hi: m.hi,
    }));

  return xmlResponse(buildUrlset(siteUrl, items));
};
