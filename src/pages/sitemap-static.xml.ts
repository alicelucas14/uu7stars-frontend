// ===== frontend/src/pages/sitemap-static.xml.ts =====
// EN + HI entries, reciprocal hreflang (+ x-default).
// No <lastmod>: these pages have no tracked content date, and "now" is not meaningful.

import type { APIRoute } from 'astro';
import { buildUrlset, xmlResponse, type SitemapItem } from '../lib/sitemap';

const STATIC_PATHS = [
  '/',
  '/faq/',
  '/promotions/',
  '/reviews/',
  '/blog/',
  '/privacy-policy/',
  '/terms-of-service/',
  '/responsible-gaming/',
];

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = site?.toString().replace(/\/$/, '') ?? '';
  const items: SitemapItem[] = STATIC_PATHS.map((path) => ({ path, en: true, hi: true }));
  return xmlResponse(buildUrlset(siteUrl, items), 86400);
};
