// ===== src/i18n.ts =====
// --- FINALIZED: Enforces trailing slashes on all generated paths ---

export const defaultLocale = 'en';
export const locales = ['en', 'hi'] as const;
export type Locale = typeof locales[number];

/**
 * Ensures a path ends with a trailing slash.
 * Root path '/' is left as is.
 * @param path The path to check.
 * @returns The path with a trailing slash.
 */
function ensureTrailingSlash(path: string): string {
  if (path.length > 1 && !path.endsWith('/')) {
    return `${path}/`;
  }
  return path;
}

/**
 * Creates a language-aware path with a guaranteed trailing slash.
 * @param path The base path (e.g., '/faq' or '/faq/').
 * @param locale The target locale.
 * @returns The fully-qualified, language-aware path with a trailing slash (e.g., '/hi/faq/').
 */
export function createPath(path: string, locale: Locale): string {
  // Normalize base path to not have a leading slash for joining
  const basePath = path.startsWith('/') ? path.substring(1) : path;
  
  // Remove trailing slash for consistent joining
  const cleanBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;

  let finalPath: string;

  if (locale === defaultLocale) {
    finalPath = `/${cleanBasePath}`;
  } else {
    finalPath = `/${locale}/${cleanBasePath}`;
  }

  // Ensure trailing slash on all paths, including root for other languages (e.g., /hi/)
  return ensureTrailingSlash(finalPath);
}


/**
 * Strips the trailing slash from a path, unless it's the root path '/'.
 * @param path The path to strip.
 * @returns Path without a trailing slash.
 */
function stripTrailingSlash(path: string) {
  if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1);
  return path;
}

/**
 * Splits a pathname into its parts, handling leading slashes consistently.
 * @param pathname The URL pathname.
 * @returns An array of path segments.
 */
function splitPath(pathname: string) {
  const clean = stripTrailingSlash(pathname);
  return clean.startsWith('/') ? clean.split('/') : `/${clean}`.split('/');
}

/**
 * Extracts the locale from a URL pathname.
 * @param pathname The URL pathname.
 * @returns The detected locale or the default locale.
 */
export function getLocaleFromPath(pathname: string): Locale {
  const parts = splitPath(pathname);
  const maybe = parts[1];
  return (locales as readonly string[]).includes(maybe) ? (maybe as Locale) : defaultLocale;
}

/**
 * Gets the part of the path *after* the locale prefix.
 * @param pathname The URL pathname.
 * @returns The path without the locale prefix (e.g., '/blog/my-post').
 */
export function getPathWithoutLocale(pathname: string): string {
  const parts = splitPath(pathname);
  const current = getLocaleFromPath(pathname);
  const hasPrefix = parts[1] === current;

  let rest = '/';
  if (hasPrefix) {
    const remainder = parts.slice(2).join('/');
    rest = remainder ? `/${remainder}` : '/';
  } else {
    rest = parts.slice(1).join('/');
    rest = rest ? `/${rest}` : '/';
  }
  // This function should return the canonical non-slashed path for lookup
  return stripTrailingSlash(rest) || '/';
}

/**
 * Builds the correct, slash-terminated path for a given target locale.
 * @param target The target locale.
 * @param pathname The current page's pathname.
 * @returns The new path with the correct locale prefix and trailing slash.
 */
export function buildLocalePath(target: Locale, pathname: string): string {
  const rest = getPathWithoutLocale(pathname);
  return createPath(rest, target);
}

/**
 * A hook-like function to get i18n utilities within an Astro component.
 * @param Astro The global Astro object.
 * @returns An object with the current locale and a path builder function.
 */
export function useI18n(Astro: { url: URL }) {
  const pathname = Astro.url.pathname;
  const locale = getLocaleFromPath(pathname);

  return {
    locale,
    locales: locales as readonly Locale[],
    getLocalePath: (target: Locale) => buildLocalePath(target, pathname),
    getPathWithoutLocale, // Exposing this for Base.astro
  };
}