// ===== frontend/src/pages/sitemap-posts.xml.ts =====
// EN + HI entries, reciprocal hreflang (+ x-default). Excludes noindex posts,
// posts whose canonical points elsewhere, and empty Hindi translations.

import type { APIRoute } from 'astro';
import { getBlogPosts } from '../services/api';
import { buildUrlset, bothLists, mergeLocales, unavailableResponse, xmlResponse, type SitemapItem } from '../lib/sitemap';

function isSelfCanonical(canonical: string, siteUrl: string, path: string): boolean {
  try {
    const u = new URL(canonical, siteUrl);
    const s = new URL(siteUrl);
    return u.host === s.host && u.pathname.replace(/\/+$/, '') === path.replace(/\/+$/, '');
  } catch {
    return true; // unparsable value: don't drop the URL because of it
  }
}

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = site?.toString().replace(/\/$/, '') ?? '';

  const lists = await bothLists(() => getBlogPosts('en'), () => getBlogPosts('hi'));
  if (!lists) return unavailableResponse();
  const { en, hi } = lists;

  const items: SitemapItem[] = [];
  for (const m of mergeLocales(en, hi)) {
    const src = m.enItem ?? m.hiItem;
    if (!src) continue;
    if (src.robotsIndex === false) continue; // noindex

    const path = `/blog/${encodeURIComponent(m.slug.trim())}/`;
    // A CMS canonical pointing elsewhere makes the English page a non-canonical duplicate.
    // (The Hindi page ignores non-/hi/ canonicals and stays self-canonical.)
    const enOk = m.en && (!src.canonicalUrl || isSelfCanonical(src.canonicalUrl, siteUrl, path));

    if (!enOk && !m.hi) continue;
    items.push({ path, lastmod: src.updatedAt ?? src.publishedAt, en: enOk, hi: m.hi });
  }

  return xmlResponse(buildUrlset(siteUrl, items));
};
