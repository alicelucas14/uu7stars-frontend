// frontend/src/pages/robots.txt.ts
// Dynamic robots.txt (SSR endpoint) for Astro

import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ site }) => {
  // In dev, `site` can be undefined. Use relative path fallback.
  const siteUrl = (site?.toString() ?? '').replace(/\/$/, '');
  const sitemapIndex = siteUrl ? `${siteUrl}/sitemap-index.xml` : '/sitemap-index.xml';

  const content = [
    'User-agent: *',
    'Allow: /',
    '',
    '# Block internal/admin/API surfaces',
    'Disallow: /api/',
    'Disallow: /adminorg/',
    '',
    '# Primary sitemap index',
    `Sitemap: ${sitemapIndex}`,
  ].join('\n');

  return new Response(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
};
