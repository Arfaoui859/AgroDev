/**
 * Unwrap a JSON API response into the shape a page actually renders.
 *
 * Several pages assign component state to the whole parsed body of an endpoint.
 * When that endpoint fails closed with `{ success: false, data: null, ... }`
 * (HTTP 503), the body object is truthy but is not the array or record the page
 * iterates, so the next `.map`/`.filter`/property access throws and the generic
 * error boundary renders "حدث خطأ غير متوقع". These helpers return a safe,
 * empty shape for a failed or unavailable response instead of the envelope, and
 * never turn a failure into fabricated content.
 */

export function payloadList<T>(response: Response, body: unknown): T[] {
  if (!response.ok) return [];
  if (Array.isArray(body)) return body as T[];
  const inner = (body as { data?: unknown } | null)?.data;
  return Array.isArray(inner) ? (inner as T[]) : [];
}

export function payloadObject<T>(response: Response, body: unknown): T | null {
  if (!response.ok) return null;
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  // Enveloped responses ({ success, data }) only yield the inner payload when
  // the call actually succeeded; otherwise the page keeps its empty state.
  if ("success" in record) {
    return record.success && record.data && typeof record.data === "object"
      ? (record.data as T)
      : null;
  }
  return record as T;
}
