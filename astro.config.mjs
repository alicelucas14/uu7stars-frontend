// ===== frontend/astro.config.mjs =====
// --- FINAL CLEANUP: Removed the now-redundant sitemap integration ---

import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// The sitemap integration has been removed because we are now generating our sitemaps
// dynamically via server endpoints in the `src/pages/` directory. This is the
// correct approach for an SSR application with dynamic content.

const SITE = 'https://uu7stars.com';

export default defineConfig({
  site: SITE,
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  trailingSlash: 'always',

  // The sitemap integration is no longer needed in this array.
  integrations: [],
});