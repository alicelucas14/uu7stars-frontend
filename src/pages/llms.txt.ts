// frontend/src/pages/llms.txt.ts
// llms.txt: a plain-text summary of the site for AI tools (https://llmstxt.org).
// Built from the live content on each request (cached 1h), so every link is a page that exists now.
// Only indexable pages are listed: noindex posts and posts whose canonical points elsewhere are left out.

import type { APIRoute } from 'astro';
import { getBlogPosts, getReviews, type BlogPostListItem, type ReviewListItem } from '../services/api';

const clean = (s: unknown, max: number): string => {
  const t = String(s ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[*_`#>\[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), 40))}…`;
};

const isSelf = (canonical: string | undefined, siteUrl: string, path: string): boolean => {
  if (!canonical) return true;
  try {
    const u = new URL(canonical, siteUrl);
    return u.host === new URL(siteUrl).host && u.pathname.replace(/\/+$/, '') === path.replace(/\/+$/, '');
  } catch {
    return true;
  }
};

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = (site?.toString() ?? 'https://uu7stars.com').replace(/\/$/, '');

  let posts: BlogPostListItem[];
  let reviews: ReviewListItem[];
  try {
    [posts, reviews] = await Promise.all([getBlogPosts('en'), getReviews('en')]);
  } catch (err) {
    console.error('llms.txt: content fetch failed', err);
    return new Response('Temporarily unavailable.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Retry-After': '300', 'Cache-Control': 'no-store' },
    });
  }

  const postLines = posts
    .filter((p) => p.slug && p.title && p.robotsIndex !== false)
    .filter((p) => isSelf(p.canonicalUrl, siteUrl, `/blog/${p.slug.trim()}/`))
    .map((p) => {
      const url = `${siteUrl}/blog/${encodeURIComponent(p.slug.trim())}/`;
      const note = clean(p.excerpt, 140);
      return `- [${clean(p.title, 120)}](${url})${note ? `: ${note}` : ''}`;
    });

  const reviewLines = reviews
    .filter((r) => r.slug && r.title)
    .map((r) => {
      const url = `${siteUrl}/reviews/${encodeURIComponent(r.slug.trim())}/`;
      const note = clean(r.excerpt, 140);
      return `- [${clean(r.title, 120)}](${url})${note ? `: ${note}` : ''}`;
    });

  const lines = [
    '# Starsuu7 (UU7)',
    '',
    '> Starsuu7, also known as UU7, is a mobile gaming app for India with Teen Patti, Rummy and other card and casino-style games. This is the official website: it hosts the official app download, answers to common questions, game guides and reviews. For players aged 18+ only. Services are not available in Assam, Arunachal Pradesh, Andhra Pradesh, Telangana, Odisha and Nagaland. Please play responsibly.',
    '',
    'The latest official version of the app is distributed only as an APK from this website. Copies on other APK sites are not maintained by us and may be outdated. The site is available in English and Hindi; Hindi pages live under /hi/.',
    '',
    '## Main pages',
    '',
    `- [Home](${siteUrl}/): Overview of Starsuu7 and the app`,
    `- [Download the Starsuu7 APK](${siteUrl}/download/): Official download page for the latest version`,
    `- [FAQ](${siteUrl}/faq/): Answers about the app, accounts, deposits, withdrawals and support`,
    `- [About](${siteUrl}/about/): About Starsuu7`,
    `- [Promotions](${siteUrl}/promotions/): Current offers`,
    `- [Reviews](${siteUrl}/reviews/): Game reviews`,
    `- [Blog](${siteUrl}/blog/): Game guides and articles`,
    '',
    '## Policies',
    '',
    `- [Responsible Gaming](${siteUrl}/responsible-gaming/): Player protection and responsible play`,
    `- [Privacy Policy](${siteUrl}/privacy-policy/)`,
    `- [Terms of Service](${siteUrl}/terms-of-service/)`,
    '',
    '## Hindi',
    '',
    `- [Hindi home](${siteUrl}/hi/): Hindi version of the site`,
    `- [Hindi FAQ](${siteUrl}/hi/faq/)`,
    `- [Hindi download page](${siteUrl}/hi/download/)`,
    '',
  ];

  if (postLines.length) lines.push('## Guides and articles', '', ...postLines, '');
  if (reviewLines.length) lines.push('## Game reviews', '', ...reviewLines, '');

  return new Response(`${lines.join('\n').trim()}\n`, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
};
