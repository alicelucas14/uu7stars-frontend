// ===== frontend/src/pages/sitemap-static.xml.ts =====
// --- CORRECTED: Generates valid xhtml:link structure ---

import type { APIRoute } from 'astro';
import { locales } from '../i18n';
import { createPath } from '../lib/paths';

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

function generateUrlEntries(siteUrl: string): string {
  return STATIC_PATHS.map(path => {
    // For each static path, create ONE <url> entry.
    // The <loc> will point to the default language (English) version.
    const loc = `${siteUrl}${createPath(path, 'en')}`;

    // Inside this entry, list ALL language versions as alternates.
    const alternates = locales
      .map(lang => 
        `<xhtml:link rel="alternate" hreflang="${lang}" href="${siteUrl}${createPath(path, lang)}" />`
      )
      .join('\n    ');

    return `
  <url>
    <loc>${loc}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    ${alternates}
  </url>`;
  }).join('');
}

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = site?.toString().replace(/\/$/, '') ?? '';
  const urlEntries = generateUrlEntries(siteUrl);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urlEntries}
</urlset>`.trim();

  return new Response(xml, {
    status: 200,
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=86400' }
  });
};