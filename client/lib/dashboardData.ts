/**
 * Helpers for the role dashboards.
 *
 * Several professional dashboards (agronomist, trader, veterinarian, investor,
 * inspector, government) are backed by routers that honestly answer HTTP 503
 * `DASHBOARD_DATA_SOURCE_NOT_CONNECTED` until a verified tenant-scoped data
 * source exists. Two defects followed from that contract:
 *
 *  1. The handlers did `setFarms(response.data)` where `data` is `null`, so the
 *     derived `.filter()`/`.map()` calls ran on `null` *before* the null guard
 *     and threw into the top-level error boundary — the user saw the generic
 *     "unexpected error" page instead of an honest message.
 *  2. A 503 was indistinguishable from a genuine network failure, so the screen
 *     showed a misleading red "failed to load".
 *
 * `asArray` keeps list state always iterable, and `detectUnavailable` lets a
 * screen render the real reason instead of guessing.
 */

/** Coerce a possibly-null API field into a safe array. */
export function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export interface UnavailableInfo {
  /** Human-readable reason supplied by the server. */
  reason: string;
  /** Machine code, e.g. DASHBOARD_DATA_SOURCE_NOT_CONNECTED. */
  code: string;
}

/**
 * Return the first honest "unavailable" signal among parsed payloads, or null.
 * Recognises the platform's `{ success: false, code, message }` envelope.
 */
export function detectUnavailable(payloads: unknown[]): UnavailableInfo | null {
  for (const payload of payloads) {
    if (payload && typeof payload === "object" && !Array.isArray(payload)) {
      const record = payload as Record<string, unknown>;
      if (record.success === false && typeof record.code === "string") {
        return {
          reason: typeof record.message === "string" ? record.message : "",
          code: record.code,
        };
      }
    }
  }
  return null;
}
