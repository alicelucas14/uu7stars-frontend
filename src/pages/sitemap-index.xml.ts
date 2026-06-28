// src/pages/sitemap-index.xml.ts
// Sitemap index for Astro (SSR endpoint)

import type { APIRoute } from 'astro';

const SITEMAPS = [
  'sitemap-static.xml',
  'sitemap-posts.xml',
  'sitemap-reviews.xml',
  'sitemap-promotions.xml',
  'sitemap-pages.xml',
];

export const GET: APIRoute = async ({ site }) => {
  // Ensure a clean base URL with no trailing slash
  const siteUrl = (site?.toString() ?? '').replace(/\/$/, '');

  const nowIso = new Date().toISOString();

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${SITEMAPS
  .map(
    (name) => `  <sitemap>
    <loc>${siteUrl}/${name}</loc>
    <lastmod>${nowIso}</lastmod>
  </sitemap>`
  )
  .join('\n')}
</sitemapindex>`.trim();

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      // Cache 1h; adjust to your deploy/CDN strategy
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
};
