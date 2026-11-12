/**
 * Lazy route loading with one deployment-aware retry.
 *
 * A Vite SPA names its route chunks with a content hash. After a new deployment
 * an already-open tab still references the old hashes, so a lazy `import()`
 * fails with a chunk-load error and React surfaces the generic ErrorBoundary
 * page ("حدث خطأ غير متوقع") even though nothing is wrong with the app. The
 * standard remedy is a single full reload, which fetches the new index.html and
 * its current hashes. A short session guard prevents a reload loop when the
 * network is genuinely down (then we surface the real error instead).
 */
import React from "react";

export const CHUNK_RELOAD_KEY = "agrogrowth_chunk_reload_at";

const CHUNK_ERROR_PATTERNS = [
  /Loading chunk \d+ failed/i,
  /Loading CSS chunk \d+ failed/i,
  /Failed to fetch dynamically imported module/i,
  /Importing a module script failed/i,
  /error loading dynamically imported module/i,
  /Unable to preload CSS/i,
];

export function isChunkLoadError(error: unknown): boolean {
  if (!error) return false;
  const message = error instanceof Error ? error.message : String(error);
  return CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

/** Reload at most once per window, so a persistent failure cannot loop. */
export function shouldReloadForChunkError(
  lastReloadAt: number | null,
  now: number,
  windowMs = 10_000,
): boolean {
  if (lastReloadAt === null || Number.isNaN(lastReloadAt)) return true;
  return now - lastReloadAt > windowMs;
}

export function lazyWithRetry<T extends React.ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
): React.LazyExoticComponent<T> {
  return React.lazy(() =>
    factory().catch((error: unknown) => {
      if (isChunkLoadError(error) && typeof window !== "undefined") {
        let lastReloadAt: number | null = null;
        try {
          const raw = window.sessionStorage.getItem(CHUNK_RELOAD_KEY);
          lastReloadAt = raw === null ? null : Number(raw);
        } catch {
          lastReloadAt = null;
        }
        if (shouldReloadForChunkError(lastReloadAt, Date.now())) {
          try {
            window.sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
          } catch {
            /* sessionStorage unavailable: still reload once, unguarded */
          }
          window.location.reload();
          // Keep the boundary in its fallback while the page reloads.
          return new Promise<never>(() => {});
        }
      }
      throw error;
    }),
  );
}
