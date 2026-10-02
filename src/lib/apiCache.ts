// In-process cache for read-only API collections (settings, blog/review/promotion lists, banners).
//
// A single page render asks for the same collection several times (3x the blog list, 3x settings,
// 2x banners on a blog post) and every call used to hit the backend, which loads the whole collection.
// This shares those calls and keeps results for a short time:
//   - fresh (< ttlMs):          served from memory
//   - stale (< MAX_STALE_MS):   served from memory while ONE background refresh runs, so visitors
//                               never wait on a refresh and a short API outage doesn't break pages
//   - missing / too old:        wait for the (shared) fetch
// Failures are never cached. Callers get a clone, so one page can't mutate what another page sees.

interface Entry {
  hasValue: boolean;
  value?: unknown;
  fetchedAt: number;
  inflight?: Promise<unknown>;
}

const DEFAULT_MAX_STALE_MS = 30 * 60_000;
const store = new Map<string, Entry>();

/** maxStaleMs: how old a value may be and still be served while it refreshes (0 = never serve stale). */
export function cached<T>(key: string, ttlMs: number, load: () => Promise<T>, maxStaleMs = DEFAULT_MAX_STALE_MS): Promise<T> {
  let entry = store.get(key);
  if (!entry) {
    entry = { hasValue: false, fetchedAt: 0 };
    store.set(key, entry);
  }
  const e = entry;
  const age = Date.now() - e.fetchedAt;
  if (e.hasValue && age < ttlMs) return Promise.resolve(structuredClone(e.value) as T);

  if (!e.inflight) {
    const p = load()
      .then((v) => {
        e.value = v;
        e.hasValue = true;
        e.fetchedAt = Date.now();
        return v;
      })
      .finally(() => {
        e.inflight = undefined;
      });
    p.catch(() => {}); // a failed background refresh must not surface as an unhandled rejection
    e.inflight = p;
  }

  if (e.hasValue && age < maxStaleMs) return Promise.resolve(structuredClone(e.value) as T);
  return (e.inflight as Promise<T>).then((v) => structuredClone(v));
}

/** Test helper. */
export function clearApiCache(): void {
  store.clear();
}
