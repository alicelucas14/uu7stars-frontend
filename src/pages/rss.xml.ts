import type { APIRoute } from 'astro';
import { getBlogPosts } from '../services/api';

export const GET: APIRoute = async ({ site }) => {
  const posts = await getBlogPosts();

  const siteUrl = site?.toString().replace(/\/$/, '') ?? '';
  const feedUrl = `${siteUrl}/rss.xml`;

  const items = posts.map((p) => {
    const url = `${siteUrl}/blog/${p.slug}`;
    const pub = new Date(p.publishedAt).toUTCString();
    // Basic HTML escape for description
    const desc = (p.excerpt || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    return `
      <item>
        <title><![CDATA[${p.title}]]></title>
        <link>${url}</link>
        <guid>${url}</guid>
        <pubDate>${pub}</pubDate>
        <description><![CDATA[${desc}]]></description>
      </item>
    `.trim();
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Starsuu7 Blog</title>
    <link>${siteUrl}/blog</link>
    <description>Teen Patti & Rummy tips, news, and updates from Starsuu7.</description>
    <language>en-IN</language>
    <atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${feedUrl}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`.trim();

  return new Response(xml, {
    status: 200,
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' }
  });
};
