// ===== src/env.d.ts =====

/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_API_BASE_URL: string;
  readonly BACKEND_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}