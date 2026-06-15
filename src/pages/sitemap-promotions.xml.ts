// ===== frontend/src/pages/sitemap-promotions.xml.ts =====
// Encode slugs and merge EN + HI so the sitemap isn't empty if promos are locale-only.

import type { APIRoute } from 'astro';
import { getPromotions } from '../services/api';
import { createPath } from '../lib/paths';
import { locales } from '../i18n';

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = site?.toString().replace(/\/$/, '') ?? '';

  // Fetch both locales to avoid an empty sitemap when promos exist only in HI (or EN).
  const [enPromos, hiPromos] = await Promise.all([
    getPromotions('en').catch(() => []),
    getPromotions('hi').catch(() => []),
  ]);

  // De-dupe by slug (prefer EN title when available, but slug is what matters here).
  const bySlug = new Map<string, { slug: string }>();
  for (const p of [...enPromos, ...hiPromos]) {
    if (p?.slug) bySlug.set(p.slug, { slug: p.slug });
  }

  const urlEntries = Array.from(bySlug.values())
    .map(({ slug }) => {
      const encodedSlug = encodeURIComponent(slug.trim());
      const path = `/promotions/${encodedSlug}/`;
      const loc = `${siteUrl}${createPath(path, 'en')}`;

      const alternates = locales
        .map(
          (lang) =>
            `<xhtml:link rel="alternate" hreflang="${lang}" href="${siteUrl}${createPath(
              path,
              lang
            )}" />`
        )
        .join('\n    ');

      // If your API exposes per-promo timestamps, wire them here. For now, we use "now".
      const lastmod = new Date().toISOString();

      return `
  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    ${alternates}
  </url>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urlEntries}
</urlset>`.trim();

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
};
