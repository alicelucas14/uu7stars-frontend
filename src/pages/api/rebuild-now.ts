import type { APIRoute } from 'astro';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { timingSafeEqual } from 'node:crypto';

const execPromise = promisify(exec);

// Get the secret token from your environment variables
const REBUILD_SECRET = import.meta.env.REBUILD_SECRET_TOKEN;

let rebuildInProgress = false;

function secretsMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // Buffers must be equal length for timingSafeEqual; mismatched length is
  // already a mismatch, but still compare against something to avoid a
  // length-based timing signal.
  if (bufA.length !== bufB.length) {
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export const GET: APIRoute = async ({ request }) => {
  if (!REBUILD_SECRET) {
    console.error("REBUILD_SECRET_TOKEN is not set in the environment.");
    return new Response('Server not configured for rebuilds.', { status: 500 });
  }

  // Get the secret from the request URL (e.g., /api/rebuild-now?secret=YOUR_TOKEN)
  const url = new URL(request.url);
  const secret = url.searchParams.get('secret');

  // 1. Check if the secret token is valid
  if (!secret || !secretsMatch(secret, REBUILD_SECRET)) {
    return new Response('Invalid secret token.', { status: 401 });
  }

  if (rebuildInProgress) {
    return new Response('A rebuild is already in progress.', { status: 429 });
  }

  // 2. Run the build command
  rebuildInProgress = true;
  try {
    console.log("Rebuild request received. Starting `npm run build`...");

    // Execute the build command from the root of your Astro project
    const { stdout, stderr } = await execPromise('npm run build', {
      // Set the working directory to the project root
      cwd: process.cwd(),
    });

    console.log("Astro build successful.");
    console.log("STDOUT:", stdout);
    if (stderr) {
      console.warn("STDERR:", stderr);
    }

    // 3. Send a success response (no build output in the body - it can
    // reveal local file paths/internals to anyone holding the secret)
    return new Response(JSON.stringify({
      message: 'Build triggered successfully.',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error during rebuild:", error);
    // 4. Send an error response (details go to the server log, not the client)
    return new Response(JSON.stringify({ message: 'Build failed.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  } finally {
    rebuildInProgress = false;
  }
};