// Production startup wrapper.
// The built SSR server (dist/server/entry.mjs) only reads process.env directly —
// it never loads a .env file. This wrapper loads .env first (falling back to
// parsing .htaccess SetEnv lines, same pattern as the adminorg backend) so
// secrets like BACKEND_API_KEY can live in .env instead of committed files.
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '.env');
const htaccessPath = path.resolve(__dirname, '.htaccess');

if (existsSync(envPath)) {
  const dotenv = await import('dotenv');
  dotenv.config({ path: envPath, quiet: true });
}

try {
  if (existsSync(htaccessPath)) {
    const htaccessContent = readFileSync(htaccessPath, 'utf8');
    for (const line of htaccessContent.split(/\r?\n/)) {
      const match = line.trim().match(/^SetEnv\s+([A-Za-z0-9_]+)\s+(.+)$/i);
      if (!match) continue;
      const key = match[1];
      let val = match[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  }
} catch (error) {
  console.error('Warning: failed to parse .htaccess for env fallback:', error.message);
}

await import('./dist/server/entry.mjs');
