// ===== src/services/api.ts =====
// --- UPDATED: Added an interface and fetch function for blog comments ---

// --- Interfaces ---
export interface Game { _id: string; gameId: string; name: string; category: string; provider: string; image: string; isNew: boolean; isHot: boolean; }
export interface Promotion { _id: string; slug: string; title: string; subtitle?: string; description: string; details?: string[]; imageUrl: string; ctaLink?: string; ctaText?: string; badgeText?: string; badgeColor?: string; }
export interface ReviewListItem { _id: string; slug: string; title: string; excerpt: string; gameName: string; rating: number; image: string; }
export interface Review { _id: string; slug: string; title: { en: string; hi: string }; excerpt: { en: string; hi: string }; body: { en: string; hi: string }; gameName: string; developer: string; rating: number; image: string; pros: { en: string[]; hi: string[] }; cons: { en: string[]; hi: string[] }; isPublished: boolean; metaTitle?: string; metaDescription?: string; }
export interface BlogPostListItem { _id: string; slug: string; title: string; excerpt: string; author: string; image: string; tags: string[]; publishedAt: string; focusKeyword?: string; canonicalUrl?: string; robotsIndex?: boolean; robotsFollow?: boolean; openGraphTitle?: { en: string; hi: string }; openGraphDescription?: { en: string; hi: string }; openGraphImage?: string; twitterTitle?: { en: string; hi: string }; twitterDescription?: { en: string; hi: string }; }
export interface BlogPost { _id: string; slug: string; title: { en: string; hi: string }; excerpt: { en: string; hi: string }; body: { en: string; hi: string }; author: string; image: string; tags: string[]; publishedAt: string; focusKeyword?: string; canonicalUrl?: string; robotsIndex?: boolean; robotsFollow?: boolean; openGraphTitle?: { en: string; hi: string }; openGraphDescription?: { en: string; hi: string }; openGraphImage?: string; twitterTitle?: { en: string; hi: string }; twitterDescription?: { en: string; hi: string }; }
export interface SiteSettings { siteName: string; logoUrl: string; apkDownloadLink: string; qrCodeImageUrl: string; telegramUrl: string; whatsappUrl: string; instagramUrl: string; facebookUrl: string; youtubeUrl: string; twitterUrl: string; liveChatUrl: string; }
export interface Comment { _id: string; reviewId: string; username: string; rating: number; text: string; createdAt: string; }

export interface PageListItem {
    _id: string;
    slug: string;
    title: string;
    updatedAt: string;
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
}

// --- NEW INTERFACE for a single blog comment ---
export interface BlogComment {
  _id: string;
  postId: string;
  username: string;
  text: string;
  createdAt: string;
}

// --- Base API Configuration ---
const API_BASE_URL = import.meta.env.PUBLIC_API_BASE_URL;
const BACKEND_API_KEY = import.meta.env.BACKEND_API_KEY;

// --- Generic Fetch Function ---
async function fetchData<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!API_BASE_URL) { throw new Error('API connection failed: The PUBLIC_API_BASE_URL environment variable is not set.'); }
    const url = `${API_BASE_URL}${endpoint}`;
    try {
        const res = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', 'x-api-key': BACKEND_API_KEY || '', ...(options.headers || {}), }, cache: 'no-cache', });
        if (!res.ok) { const text = await res.text().catch(() => ''); throw new Error(`[API ${res.status}] ${url}${text ? ` → ${text}` : ''}`); }
        return res.json() as Promise<T>;
    } catch (error) {
        let errorMessage = 'An unknown network error occurred.';
        if (error instanceof Error) { errorMessage = error.message; if (error.cause) { console.error('Network Error Cause:', (error.cause as Error).message); } }
        throw new Error(`Network request failed for ${url}. Is the API server running and accessible? Original error: ${errorMessage}`);
    }
}

// --- API Service Functions ---
export async function getSettings(): Promise<SiteSettings | null> { try { return await fetchData<SiteSettings>('/frontend-api/settings'); } catch (err) { console.warn('Could not fetch site settings, using fallback values.', err); return null; } }
export async function getGames(lang: 'en' | 'hi' = 'en'): Promise<Game[]> { return fetchData<Game[]>(`/frontend-api/games?lang=${lang}`); }
export async function getPromotions(lang: 'en' | 'hi' = 'en'): Promise<Promotion[]> { return fetchData<Promotion[]>(`/frontend-api/promotions?lang=${lang}`); }
export async function getBlogPosts(lang: 'en' | 'hi' = 'en'): Promise<BlogPostListItem[]> { return fetchData<BlogPostListItem[]>(`/frontend-api/blog?lang=${lang}`); }
export async function getBlogPostBySlug(slug: string, lang: 'en' | 'hi' = 'en'): Promise<BlogPost | null> { return fetchData<BlogPost>(`/frontend-api/blog/${encodeURIComponent(slug)}?lang=${lang}`); }
export async function getReviews(lang: 'en' | 'hi' = 'en'): Promise<ReviewListItem[]> { return fetchData<ReviewListItem[]>(`/frontend-api/reviews?lang=${lang}`); }
export async function getReviewBySlug(slug: string, lang: 'en' | 'hi' = 'en'): Promise<Review | null> { return fetchData<Review>(`/frontend-api/reviews/${encodeURIComponent(slug)}?lang=${lang}`); }

export async function getCommentsForReview(reviewId: string): Promise<Comment[]> {
  if (!reviewId) return [];
  try {
    const res = await fetch(`${API_BASE_URL}/api/frontend/comments/${reviewId}`);
    if (!res.ok) { throw new Error(`Failed to fetch comments with status: ${res.status}`); }
    return res.json();
  } catch (err) {
    console.error(`Failed to fetch comments for review ${reviewId}:`, err);
    return [];
  }
}

// --- NEW FUNCTION to fetch blog comments ---
export async function getCommentsForBlogPost(postId: string): Promise<BlogComment[]> {
  if (!postId) return [];
  try {
    const res = await fetch(`${API_BASE_URL}/api/frontend/blog-comments/${postId}`);
    if (!res.ok) {
        throw new Error(`Failed to fetch blog comments with status: ${res.status}`);
    }
    return res.json();
  } catch (err) {
    console.error(`Failed to fetch comments for blog post ${postId}:`, err);
    return []; // Return an empty array on error to prevent the page from crashing.
  }
}

// --- NEW FUNCTIONS to fetch custom pages ---
export async function getPagesList(lang: 'en' | 'hi' = 'en'): Promise<PageListItem[]> {
    return fetchData<PageListItem[]>(`/frontend-api/pages?lang=${lang}`);
}

export async function getPageBySlug(slug: string, lang: 'en' | 'hi' = 'en'): Promise<Page | null> {
    try {
        return await fetchData<Page>(`/frontend-api/pages/${encodeURIComponent(slug)}?lang=${lang}`);
    } catch (err) {
        console.warn(`Could not fetch custom page for slug: ${slug}`, err);
        return null;
    }
}