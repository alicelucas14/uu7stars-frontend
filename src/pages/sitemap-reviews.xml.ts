// ===== frontend/src/pages/sitemap-reviews.xml.ts =====
// Robust: merges EN+HI reviews, encodes slugs, and never 500s on API hiccups.

import type { APIRoute } from 'astro';
import { getReviews } from '../services/api';
import { createPath } from '../lib/paths';
import { locales } from '../i18n';

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = site?.toString().replace(/\/$/, '') ?? '';

  // Fetch both locales; never throw — fall back to [] so the route still returns 200.
  const [enReviews, hiReviews] = await Promise.all([
    getReviews('en').catch(() => []),
    getReviews('hi').catch(() => []),
  ]);

  // De-dupe by slug in case sets differ across locales.
  const bySlug = new Map<string, { slug: string }>();
  for (const r of [...enReviews, ...hiReviews]) {
    if (r?.slug) bySlug.set(r.slug, { slug: r.slug });
  }

  const urlEntries = Array.from(bySlug.values())
    .map(({ slug }) => {
      const encodedSlug = encodeURIComponent(slug.trim());
      const path = `/reviews/${encodedSlug}/`;
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

      // If you track per-post lastmod, wire it here. Using "now" is acceptable.
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
