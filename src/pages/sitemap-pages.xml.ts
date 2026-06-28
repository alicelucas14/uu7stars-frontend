// ===== frontend/src/pages/sitemap-pages.xml.ts =====
import type { APIRoute } from 'astro';
import { getPagesList } from '../services/api';
import { createPath } from '../lib/paths';
import { locales } from '../i18n';

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = site?.toString().replace(/\/$/, '') ?? '';
  let pages = [];
  try {
    pages = await getPagesList('en');
  } catch (err) {
    console.error('Could not fetch custom pages for sitemap:', err);
  }

  const urlEntries = pages
    .map((page) => {
      const encodedSlug = encodeURIComponent((page.slug ?? '').trim());
      const path = `/${encodedSlug}/`;
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

      const lastmod = new Date(page.updatedAt || new Date()).toISOString();

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
