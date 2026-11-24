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

/** Share of letters that are Devanagari (0-1). Latin brand names inside Hindi text are fine. */
function devanagariShare(text: string): number {
  const letters = Array.from(text).filter((c) => /\p{L}/u.test(c));
  if (!letters.length) return 0;
  return letters.filter((c) => c >= 'ऀ' && c <= 'ॿ').length / letters.length;
}

/**
 * True when every given Hindi text is really written in Hindi (not an English placeholder).
 * The admin API marks some finished Hindi reviews as "not translated"; this lets us trust the
 * text itself. The first text (the title) is required; empty extras are ignored.
 */
export function isRealHindi(title: string | undefined, ...rest: (string | undefined)[]): boolean {
  if (!title?.trim() || devanagariShare(title) < 0.6) return false;
  return rest.every((t) => !t?.trim() || devanagariShare(t) >= 0.6);
}

/** Review language info with 'hi' marked indexable when the Hindi text is real Hindi. */
export function withRealHindi<T extends LangInfo & { title: { hi?: string }; excerpt?: { hi?: string }; body?: { hi?: string } }>(doc: T): LangInfo {
  const hasHi = !doc.availableLangs || doc.availableLangs.includes('hi');
  if (!hasHi || !isRealHindi(doc.title?.hi, doc.excerpt?.hi, doc.body?.hi)) return doc;
  const base = doc.indexableLangs ?? doc.availableLangs ?? ['en'];
  return { ...doc, indexableLangs: base.includes('hi') ? base : [...base, 'hi'] };
}
