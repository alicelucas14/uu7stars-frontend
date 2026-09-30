import { defineMiddleware } from 'astro:middleware';

// Backend/API outages must surface as a retryable 503, not a 500 or a false 404,
// so search engines keep the URL indexed and retry later.
export const onRequest = defineMiddleware(async (_context, next) => {
  try {
    return await next();
  } catch (err) {
    console.error('Unhandled SSR error:', err);
    return new Response('Service temporarily unavailable. Please try again shortly.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Retry-After': '120', 'Cache-Control': 'no-store' },
    });
  }
});
