// ===== src/services/api.ts =====
// --- UPDATED: Added an interface and fetch function for blog comments ---

import { cached } from '../lib/apiCache';

// --- Interfaces ---
export type Lang = 'en' | 'hi';
export interface Game { _id: string; gameId: string; name: string; category: string; provider: string; image: string; isNew: boolean; isHot: boolean; schemaMarkup?: string; }
export interface Promotion { _id: string; slug: string; updatedAt?: string; translated?: boolean; title: string; subtitle?: string; description: string; details?: string[]; imageUrl: string; ctaLink?: string; ctaText?: string; badgeText?: string; badgeColor?: string; }
export interface ReviewListItem { _id: string; slug: string; updatedAt?: string; translated?: boolean; title: string; excerpt: string; gameName: string; rating: number; image: string; }
export interface Review { _id: string; slug: string; updatedAt?: string; availableLangs?: Lang[]; indexableLangs?: Lang[]; title: { en: string; hi: string }; excerpt: { en: string; hi: string }; body: { en: string; hi: string }; gameName: string; developer: string; rating: number; image: string; pros: { en: string[]; hi: string[] }; cons: { en: string[]; hi: string[] }; isPublished: boolean; metaTitle?: string; metaDescription?: string; schemaMarkup?: string; }
export interface BlogPostListItem { _id: string; slug: string; updatedAt?: string; translated?: boolean; title: string; excerpt: string; author: string; image: string; tags: string[]; publishedAt: string; focusKeyword?: string; canonicalUrl?: string; robotsIndex?: boolean; robotsFollow?: boolean; openGraphTitle?: { en: string; hi: string }; openGraphDescription?: { en: string; hi: string }; openGraphImage?: string; twitterTitle?: { en: string; hi: string }; twitterDescription?: { en: string; hi: string }; }
export interface BlogPost { _id: string; slug: string; updatedAt?: string; availableLangs?: Lang[]; indexableLangs?: Lang[]; title: { en: string; hi: string }; excerpt: { en: string; hi: string }; body: { en: string; hi: string }; author: string; image: string; tags: string[]; publishedAt: string; focusKeyword?: string; canonicalUrl?: string; robotsIndex?: boolean; robotsFollow?: boolean; openGraphTitle?: { en: string; hi: string }; openGraphDescription?: { en: string; hi: string }; openGraphImage?: string; twitterTitle?: { en: string; hi: string }; twitterDescription?: { en: string; hi: string }; schemaMarkup?: string; }
export interface SiteSettings { siteName: string; logoUrl: string; apkDownloadLink: string; qrCodeImageUrl: string; telegramUrl: string; whatsappUrl: string; instagramUrl: string; facebookUrl: string; youtubeUrl: string; twitterUrl: string; liveChatUrl: string; googleAnalyticsId?: string; googleSearchConsoleVerification?: string; ahrefsVerification?: string; customHeaderScripts?: string; customFooterScripts?: string; showPopupBanner?: boolean; popupBannerImageUrl?: string; popupBannerLink?: string; }
export interface Comment { _id: string; reviewId: string; username: string; rating: number; text: string; createdAt: string; }
export interface PopupBanner { _id: string; title: string; imageUrl: string; linkUrl?: string; }

export interface PageListItem {
    _id: string;
    slug: string;
    title: string;
    updatedAt: string;
    robotsIndex?: boolean;
    translated?: boolean;
}

export interface Page {
    _id: string;
    slug: string;
    title: { en: string; hi: string };
    body: { en: string; hi: string };
    metaTitle?: { en: string; hi: string };
    metaDescription?: { en: string; hi: string };
    focusKeyword?: string;
    canonicalUrl?: string;
    robotsIndex?: boolean;
    robotsFollow?: boolean;
    openGraphTitle?: { en: string; hi: string };
    openGraphDescription?: { en: string; hi: string };
    openGraphImage?: string;
    twitterTitle?: { en: string; hi: string };
    twitterDescription?: { en: string; hi: string };
    createdAt: string;
    updatedAt: string;
    schemaMarkup?: string;
    availableLangs?: Lang[];
    indexableLangs?: Lang[];
}

// --- NEW INTERFACE for a single blog comment ---
export interface BlogComment {
  _id: string;
  postId: string;
  username: string;
  text: string;
  createdAt: string;
}

// --- NEW INTERFACE for a popup banner ---
export interface PopupBanner {
    _id: string;
    title: string;
    imageUrl: string;
    linkUrl?: string;
}

// --- Base API Configuration ---
const API_BASE_URL = import.meta.env.PUBLIC_API_BASE_URL;
// Optional internal address for this server's own calls (e.g. http://127.0.0.1:5000). It skips the public
// DNS/TLS/nginx hop. PUBLIC_API_BASE_URL must stay the public address: it is also used to build image URLs
// that visitors' browsers load. Unset = server-side calls use the public address, as before.
const API_FETCH_URL: string | undefined = import.meta.env.API_INTERNAL_URL || API_BASE_URL;
const BACKEND_API_KEY = import.meta.env.BACKEND_API_KEY;

// --- Generic Fetch Function ---
export class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) { super(message); this.name = 'ApiError'; this.status = status; }
}
const FETCH_TIMEOUT_MS = 8000;
async function fetchData<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!API_FETCH_URL) { throw new Error('API connection failed: The PUBLIC_API_BASE_URL environment variable is not set.'); }
    const url = `${API_FETCH_URL}${endpoint}`;
    try {
        const res = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', 'x-api-key': BACKEND_API_KEY || '', ...(options.headers || {}), }, cache: 'no-cache', signal: options.signal ?? AbortSignal.timeout(FETCH_TIMEOUT_MS), });
        if (!res.ok) { const text = await res.text().catch(() => ''); throw new ApiError(`[API ${res.status}] ${url}${text ? ` → ${text}` : ''}`, res.status); }
        return res.json() as Promise<T>;
    } catch (error) {
        if (error instanceof ApiError) { throw error; }
        let errorMessage = 'An unknown network error occurred.';
        if (error instanceof Error) { errorMessage = error.message; if (error.cause) { console.error('Network Error Cause:', (error.cause as Error).message); } }
        throw new Error(`Network request failed for ${url}. Is the API server running and accessible? Original error: ${errorMessage}`);
    }
}

// Collections that many components request on every page render (and that rarely change) go through
// a short in-process cache; see lib/apiCache.ts. Single items and comments are always fetched live.
const LIST_TTL_MS = 60_000;
const fetchList = <T>(endpoint: string): Promise<T> => cached<T>(endpoint, LIST_TTL_MS, () => fetchData<T>(endpoint));

// Astro decodes route params with decodeURI, which leaves "%26" (&), "%3F" (?) etc. encoded.
// Decode once more so encodeURIComponent below doesn't double-encode them ("%2526" -> 404).
export function decodeSlug(slug: string): string {
    try { return decodeURIComponent(slug); } catch { return slug; }
}
const slugPath = (slug: string) => encodeURIComponent(decodeSlug(slug));

// --- API Service Functions ---
export async function getSettings(): Promise<SiteSettings | null> { try { return await fetchList<SiteSettings>('/frontend-api/settings'); } catch (err) { console.warn('Could not fetch site settings, using fallback values.', err); return null; } }
export async function getGames(lang: 'en' | 'hi' = 'en'): Promise<Game[]> { return fetchList<Game[]>(`/frontend-api/games?lang=${lang}`); }
export async function getPromotions(lang: 'en' | 'hi' = 'en'): Promise<Promotion[]> { return fetchList<Promotion[]>(`/frontend-api/promotions?lang=${lang}`); }
export async function getBlogPosts(lang: 'en' | 'hi' = 'en'): Promise<BlogPostListItem[]> { return fetchList<BlogPostListItem[]>(`/frontend-api/blog?lang=${lang}`); }
export async function getBlogPostBySlug(slug: string, lang: 'en' | 'hi' = 'en'): Promise<BlogPost | null> {
    try {
        return await fetchData<BlogPost>(`/frontend-api/blog/${slugPath(slug)}?lang=${lang}`);
    } catch (err) {
        if (err instanceof ApiError && err.status === 404) { return null; }
        console.warn(`Could not fetch blog post for slug: ${slug}`, err);
        throw err;
    }
}
export async function getReviews(lang: 'en' | 'hi' = 'en'): Promise<ReviewListItem[]> { return fetchList<ReviewListItem[]>(`/frontend-api/reviews?lang=${lang}`); }
export async function getReviewBySlug(slug: string, lang: 'en' | 'hi' = 'en'): Promise<Review | null> {
    try {
        return await fetchData<Review>(`/frontend-api/reviews/${slugPath(slug)}?lang=${lang}`);
    } catch (err) {
        if (err instanceof ApiError && err.status === 404) { return null; }
        console.warn(`Could not fetch review for slug: ${slug}`, err);
        throw err;
    }
}

// Comments change when a visitor posts, so they are only de-duplicated within a render (desktop and
// mobile layouts both ask) - never served stale. They also need a timeout: without one a hung
// comments endpoint stalls the whole page.
const COMMENTS_TTL_MS = 5_000;
const COMMENTS_TIMEOUT_MS = 3_000; // optional content: fail fast, the page renders without comments
async function fetchComments<T>(path: string): Promise<T> {
  const res = await fetch(`${API_FETCH_URL}${path}`, { signal: AbortSignal.timeout(COMMENTS_TIMEOUT_MS) });
  if (!res.ok) { throw new Error(`Failed to fetch comments with status: ${res.status}`); }
  return res.json() as Promise<T>;
}

export async function getCommentsForReview(reviewId: string): Promise<Comment[]> {
  if (!reviewId) return [];
  try {
    return await cached(`comments:review:${reviewId}`, COMMENTS_TTL_MS, () => fetchComments<Comment[]>(`/api/frontend/comments/${reviewId}`), 0);
  } catch (err) {
    console.error(`Failed to fetch comments for review ${reviewId}:`, err);
    return [];
  }
}

// --- NEW FUNCTION to fetch blog comments ---
export async function getCommentsForBlogPost(postId: string): Promise<BlogComment[]> {
  if (!postId) return [];
  try {
    return await cached(`comments:blog:${postId}`, COMMENTS_TTL_MS, () => fetchComments<BlogComment[]>(`/api/frontend/blog-comments/${postId}`), 0);
  } catch (err) {
    console.error(`Failed to fetch comments for blog post ${postId}:`, err);
    return []; // Return an empty array on error to prevent the page from crashing.
  }
}

// --- NEW FUNCTIONS to fetch custom pages ---
export async function getPagesList(lang: 'en' | 'hi' = 'en'): Promise<PageListItem[]> {
    return fetchList<PageListItem[]>(`/frontend-api/pages?lang=${lang}`);
}

export async function getPageBySlug(slug: string, lang: 'en' | 'hi' = 'en'): Promise<Page | null> {
    try {
        return await fetchData<Page>(`/frontend-api/pages/${slugPath(slug)}?lang=${lang}`);
    } catch (err) {
        if (err instanceof ApiError && err.status === 404) { return null; }
        console.warn(`Could not fetch custom page for slug: ${slug}`, err);
        throw err;
    }
}

// --- Retired-slug lookup (for 301 redirects). Returns the current slug, or null if the slug was never used. ---
export type SlugRedirectType = 'blog' | 'reviews' | 'promotions' | 'pages';
export async function resolveSlugRedirect(type: SlugRedirectType, slug: string): Promise<string | null> {
    try {
        const res = await fetchData<{ slug?: string }>(`/frontend-api/slug-redirect/${type}/${slugPath(slug)}`);
        return res.slug || null;
    } catch (err) {
        if (err instanceof ApiError && err.status === 404) { return null; }
        throw err;
    }
}

// --- NEW FUNCTION to fetch popup banners ---
export async function getPopupBanners(lang: 'en' | 'hi' = 'en'): Promise<PopupBanner[]> {
    try {
        return await fetchList<PopupBanner[]>(`/frontend-api/popup-banners?lang=${lang}`);
    } catch (err) {
        console.warn('Could not fetch popup banners, using empty fallback.', err);
        return [];
    }
}