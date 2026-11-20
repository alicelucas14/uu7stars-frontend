import { defineMiddleware } from 'astro:middleware';
import { redirectForLink } from './lib/linkRedirect';

// Never worth a redirect lookup: build assets and our own API endpoints.
const NO_REDIRECT_PREFIXES = ['/_astro/', '/api/'];

// Backend/API outages must surface as a retryable 503, not a 500 or a false 404,
// so search engines keep the URL indexed and retry later.
export const onRequest = defineMiddleware(async (context, next) => {
  try {
    const response = await next();

    // An address that is a 404 may have an admin-defined redirect (admin "Redirects" screen, or a post sent
    // to a link). Only 404s are looked up, so a redirect can never hide live content.
    if (response.status === 404 && (context.request.method === 'GET' || context.request.method === 'HEAD')
      && !NO_REDIRECT_PREFIXES.some((p) => context.url.pathname.startsWith(p))) {
      try {
        const moved = await redirectForLink(context.url);
        if (moved) return moved;
      } catch (err) {
        console.warn('Redirect lookup failed, serving the 404:', err); // a lookup problem must leave the 404 as it was
      }
    }
    return response;
  } catch (err) {
    console.error('Unhandled SSR error:', err);
    return new Response('Service temporarily unavailable. Please try again shortly.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Retry-After': '120', 'Cache-Control': 'no-store' },
    });
  }
});
