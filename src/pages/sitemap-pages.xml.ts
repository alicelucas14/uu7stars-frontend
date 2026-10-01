// ===== frontend/src/pages/sitemap-pages.xml.ts =====
// EN + HI entries, reciprocal hreflang (+ x-default). lastmod = the page's real updatedAt.

import type { APIRoute } from 'astro';
import { getPagesList } from '../services/api';
import { buildUrlset, bothLists, mergeLocales, unavailableResponse, xmlResponse, type SitemapItem } from '../lib/sitemap';

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = site?.toString().replace(/\/$/, '') ?? '';

  const lists = await bothLists(() => getPagesList('en'), () => getPagesList('hi'));
  if (!lists) return unavailableResponse();
  const { en, hi } = lists;

  const items: SitemapItem[] = mergeLocales(en, hi)
    .filter((m) => (m.en || m.hi) && (m.enItem ?? m.hiItem)?.robotsIndex !== false) // noindex pages stay out
    .map((m) => ({
      path: `/${encodeURIComponent(m.slug.trim())}/`,
      lastmod: (m.enItem ?? m.hiItem)?.updatedAt,
      en: m.en,
      hi: m.hi,
    }));

  return xmlResponse(buildUrlset(siteUrl, items));
};
