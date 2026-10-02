import type { Lang } from '../services/api';

interface LangInfo {
  availableLangs?: Lang[];
  indexableLangs?: Lang[];
  canonicalUrl?: string;
}

function isOffSite(url: string | undefined, site: URL | undefined): boolean {
  if (!url || !site) return false;
  try {
    return new URL(url, site).host !== site.host;
  } catch {
    return false;
  }
}

/**
 * Languages worth advertising in hreflang: real translations that are indexable (no "[HI]"
 * placeholder text), and for English only if its canonical is this site - a post whose CMS
 * canonical points at another domain is not a valid hreflang target. undefined = every locale.
 */
export function hreflangLangs(doc: LangInfo, site: URL | undefined): Lang[] | undefined {
  const langs = doc.indexableLangs ?? doc.availableLangs;
  if (!langs) return undefined;
  return isOffSite(doc.canonicalUrl, site) ? langs.filter((l) => l !== 'en') : langs;
}

/** False when this language version exists but is only a placeholder, so it should be noindex. */
export function langIsIndexable(doc: LangInfo, lang: Lang): boolean {
  return doc.indexableLangs ? doc.indexableLangs.includes(lang) : true;
}
