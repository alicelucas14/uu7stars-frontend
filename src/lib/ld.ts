/**
 * src/lib/ld.ts
 * Lightweight JSON-LD factory helpers for Starsuu7.
 *
 * All factories return plain JS objects you can pass to <SeoHead schemas={[ ... ]} />.
 *
 * Usage:
 *   import * as LD from '@/lib/ld';
 *   const schemas = [
 *     LD.makeOrganization({ name: 'Starsuu7', url: base, logo: '/logo.webp' }, base),
 *     LD.makeWebSite({ name: 'Starsuu7', url: base, hasSearch: true }, base),
 *     LD.makeWebPage({ name: pageTitle, description, url: canonical }, base),
 *     LD.makeMobileApp({ name: 'Starsuu7', downloadUrl, version, fileSize, dateModified }, base),
 *     LD.makeBreadcrumb([{ name: 'Home', item: '/' }, { name: 'FAQ', item: '/faq' }], base),
 *     LD.makeFAQ([{ q:'How to play Teen Patti?', a:'...' }])
 *   ];
 */

type MaybeDate = string | Date | undefined;

export type OrgInput = {
  name: string;
  url: string;          // absolute or relative
  logo?: string;        // absolute or relative
  sameAs?: string[];    // social profiles
  inLanguage?: string;  // e.g., 'en-IN'
};

export type WebSiteInput = {
  name: string;
  url: string;              // absolute or relative
  inLanguage?: string;
  hasSearch?: boolean;
  searchPath?: string;      // defaults to '/search?q={search_term_string}'
};

export type WebPageInput = {
  name: string;
  description?: string;
  url: string;              // absolute or relative
  inLanguage?: string;
  isPartOf?: { name: string; url: string };
};

export type MobileAppInput = {
  name: string;             // app name
  downloadUrl: string;      // absolute or relative
  version?: string;         // e.g. '1.0.0'
  fileSize?: string;        // e.g. '22.1 MB'
  dateModified?: MaybeDate; // ISO or parseable
  operatingSystem?: string; // default 'Android'
  category?: string;        // default 'GameApplication'
  image?: string;           // logo/cover
  offers?: {
    price?: string;         // '0'
    priceCurrency?: string; // 'INR'
    availability?: string;  // https://schema.org/InStock
  };
  publisher?: {
    name: string;
    url: string;
    logo?: string;
  };
  inLanguage?: string;
};

export type SoftwareAppInput = MobileAppInput & {
  // Optional variation for SoftwareApplication (non-mobile)
  applicationCategory?: string; // e.g. 'GameApplication'|'BusinessApplication'
};

export type FAQItem = { q: string; a: string };
export type BreadcrumbItem = { name: string; item: string };

export type ArticleInput = {
  headline: string;
  description?: string;
  url: string;
  image?: string | string[];
  author?: { name: string } | { name: string }[];
  publisher?: { name: string; logo?: string };
  datePublished?: MaybeDate;
  dateModified?: MaybeDate;
  inLanguage?: string;
};

const DEFAULT_LANG = 'en-IN';

/* ----------------------------- helpers ---------------------------------- */

function ensureAbsoluteUrl(urlOrPath?: string, base?: string): string | undefined {
  if (!urlOrPath) return undefined;
  try {
    // Already absolute
    if (/^https?:\/\//i.test(urlOrPath)) return urlOrPath;
    if (!base) return urlOrPath; // fallback to given
    return new URL(urlOrPath, base).toString();
  } catch {
    return urlOrPath;
  }
}

function toISO(d?: MaybeDate): string | undefined {
  if (!d) return undefined;
  try {
    const dt = typeof d === 'string' ? new Date(d) : d;
    return isNaN(dt.getTime()) ? undefined : dt.toISOString();
  } catch {
    return undefined;
  }
}

function stripHtml(s?: string): string | undefined {
  if (!s) return s;
  return s.replace(/<[^>]*>/g, '').trim();
}

/* ------------------------------ factories -------------------------------- */

/** Organization */
export function makeOrganization(input: OrgInput, base?: string) {
  const url = ensureAbsoluteUrl(input.url, base);
  const logo = ensureAbsoluteUrl(input.logo, base);
  const obj: any = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: input.name,
    url,
    inLanguage: input.inLanguage || DEFAULT_LANG
  };
  if (logo) obj.logo = { '@type': 'ImageObject', url: logo };
  if (input.sameAs?.length) obj.sameAs = input.sameAs;
  return obj;
}

/** WebSite (with optional SearchAction) */
export function makeWebSite(input: WebSiteInput, base?: string) {
  const url = ensureAbsoluteUrl(input.url, base);
  const obj: any = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: input.name,
    url,
    inLanguage: input.inLanguage || DEFAULT_LANG
  };
  if (input.hasSearch) {
    const searchTarget = ensureAbsoluteUrl(
      input.searchPath || '/search?q={search_term_string}',
      url
    );
    obj.potentialAction = {
      '@type': 'SearchAction',
      target: searchTarget,
      'query-input': 'required name=search_term_string'
    };
  }
  return obj;
}

/** WebPage */
export function makeWebPage(input: WebPageInput, base?: string) {
  const url = ensureAbsoluteUrl(input.url, base);
  const obj: any = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: input.name,
    url,
    inLanguage: input.inLanguage || DEFAULT_LANG
  };
  if (input.description) obj.description = stripHtml(input.description);
  if (input.isPartOf) {
    obj.isPartOf = {
      '@type': 'WebSite',
      name: input.isPartOf.name,
      url: ensureAbsoluteUrl(input.isPartOf.url, base)
    };
  }
  return obj;
}

/** MobileApplication (Android default) */
export function makeMobileApp(input: MobileAppInput, base?: string) {
  const downloadUrl = ensureAbsoluteUrl(input.downloadUrl, base);
  const image = ensureAbsoluteUrl(input.image, base);
  const publisherUrl = ensureAbsoluteUrl(input.publisher?.url, base);
  const publisherLogo = ensureAbsoluteUrl(input.publisher?.logo, base);

  const obj: any = {
    '@context': 'https://schema.org',
    '@type': 'MobileApplication',
    name: input.name,
    operatingSystem: input.operatingSystem || 'Android',
    applicationCategory: input.category || 'GameApplication',
    inLanguage: input.inLanguage || DEFAULT_LANG,
    url: ensureAbsoluteUrl('/', base),
    downloadUrl,
    softwareVersion: input.version,
    fileSize: input.fileSize,
    dateModified: toISO(input.dateModified)
  };
  if (image) obj.image = image;
  if (input.offers) {
    obj.offers = {
      '@type': 'Offer',
      price: input.offers.price ?? '0',
      priceCurrency: input.offers.priceCurrency ?? 'INR',
      availability: input.offers.availability ?? 'https://schema.org/InStock',
      url: downloadUrl
    };
  }
  if (input.publisher) {
    obj.publisher = {
      '@type': 'Organization',
      name: input.publisher.name,
      url: publisherUrl
    };
    if (publisherLogo) {
      obj.publisher.logo = { '@type': 'ImageObject', url: publisherLogo };
    }
  }
  return obj;
}

/** SoftwareApplication (generic app, non-mobile) */
export function makeSoftwareApplication(input: SoftwareAppInput, base?: string) {
  const downloadUrl = ensureAbsoluteUrl(input.downloadUrl, base);
  const image = ensureAbsoluteUrl(input.image, base);
  const obj: any = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: input.name,
    applicationCategory: input.applicationCategory || input.category || 'GameApplication',
    operatingSystem: input.operatingSystem || 'Android',
    inLanguage: input.inLanguage || DEFAULT_LANG,
    url: ensureAbsoluteUrl('/', base),
    downloadUrl,
    softwareVersion: input.version,
    fileSize: input.fileSize,
    dateModified: toISO(input.dateModified)
  };
  if (image) obj.image = image;
  return obj;
}

/** FAQPage items; embed array inside your page as a separate schema if you like */
export function makeFAQ(items: FAQItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: stripHtml(a) }
    }))
  };
}

/** BreadcrumbList */
export function makeBreadcrumb(items: BreadcrumbItem[], base?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: ensureAbsoluteUrl(it.item, base)
    }))
  };
}

/** Article (for blog/news pages if/when you add them) */
export function makeArticle(input: ArticleInput, base?: string) {
  const url = ensureAbsoluteUrl(input.url, base);
  const image = Array.isArray(input.image)
    ? input.image.map((i) => ensureAbsoluteUrl(i, base))
    : ensureAbsoluteUrl(input.image, base);
  const obj: any = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.headline,
    description: stripHtml(input.description),
    url,
    inLanguage: input.inLanguage || DEFAULT_LANG,
    datePublished: toISO(input.datePublished),
    dateModified: toISO(input.dateModified)
  };
  if (image) obj.image = image;
  if (input.author) obj.author = input.author;
  if (input.publisher) {
    obj.publisher = {
      '@type': 'Organization',
      name: input.publisher.name
    };
    if (input.publisher.logo) {
      obj.publisher.logo = {
        '@type': 'ImageObject',
        url: ensureAbsoluteUrl(input.publisher.logo, base)
      };
    }
  }
  return obj;
}
