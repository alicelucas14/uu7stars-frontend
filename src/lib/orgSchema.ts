// src/lib/orgSchema.ts
// Builds the JSON-LD "Organization" block printed on every page.
// The name, other names and support link are edited in Admin > Site Settings > "Organization Info for Google";
// the profile links (sameAs) come from the social links in the same settings.

export interface OrgSchemaSettings {
  schemaOrgName?: string;
  schemaAlternateNames?: string[];
  schemaSupportUrl?: string;
}

// Shown until the admin saves their own list (and if the API predates the setting).
export const DEFAULT_ALTERNATE_NAMES = ['UU7', 'Stars UU7', '777', 'Starsuu7 App'];

const isWebUrl = (value: unknown): value is string => {
  if (typeof value !== 'string') return false;
  try {
    const u = new URL(value.trim());
    return (u.protocol === 'http:' || u.protocol === 'https:') && !!u.hostname;
  } catch {
    return false;
  }
};

function cleanNames(value: unknown): string[] {
  if (!Array.isArray(value)) return DEFAULT_ALTERNATE_NAMES;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of value) {
    const name = typeof item === 'string' ? item.replace(/\s+/g, ' ').trim() : '';
    if (name && !seen.has(name.toLowerCase())) {
      seen.add(name.toLowerCase());
      out.push(name);
    }
  }
  return out;
}

export interface OrganizationInput {
  settings?: OrgSchemaSettings | null;
  /** Site name, used when no organization name is set. */
  brandName: string;
  /** Home page address with a trailing slash. */
  siteBase: string;
  logoUrl: string;
  sameAs?: string[];
  /** Telegram link (only if it is currently switched on), used when no support link is set. */
  telegramUrl?: string;
}

export function buildOrganizationLd({ settings, brandName, siteBase, logoUrl, sameAs = [], telegramUrl }: OrganizationInput) {
  const name = settings?.schemaOrgName?.trim() || brandName;
  const alternateName = cleanNames(settings?.schemaAlternateNames);
  const supportUrl = isWebUrl(settings?.schemaSupportUrl)
    ? settings!.schemaSupportUrl!.trim()
    : isWebUrl(telegramUrl)
      ? telegramUrl.trim()
      : `${siteBase}#support`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url: siteBase,
    logo: { '@type': 'ImageObject', url: logoUrl },
    ...(sameAs.length ? { sameAs } : {}),
    ...(alternateName.length ? { alternateName } : {}),
    contactPoint: [{ '@type': 'ContactPoint', contactType: 'customer support', availableLanguage: ['en'], url: supportUrl }]
  };
}
