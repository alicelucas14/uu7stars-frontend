import { decodeSlug, resolveSlugRedirect, type SlugRedirectType } from '../services/api';

/**
 * If `slug` is a retired slug of published content, return a 301 to its current URL; otherwise null
 * (caller then serves its normal 404). `buildPath` receives the URL-encoded current slug.
 */
export async function redirectForRetiredSlug(
  type: SlugRedirectType,
  slug: string | undefined,
  buildPath: (encodedSlug: string) => string
): Promise<Response | null> {
  if (!slug) return null;
  const current = await resolveSlugRedirect(type, slug);
  if (!current || current === decodeSlug(slug)) return null;
  return new Response(null, { status: 301, headers: { Location: buildPath(encodeURIComponent(current)) } });
}
