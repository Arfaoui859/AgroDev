import { Response } from "express";

/**
 * Send a JSON error for a caught exception, honouring the `status`/`expose`
 * convention used across the app (see DatabaseUnavailableError in lib/supabase).
 * Route handlers catch errors themselves, so they must not flatten a typed
 * 503/4xx into a generic 500. Only messages explicitly marked safe are
 * returned, so internal details never leak.
 */
export function sendCaughtError(
  res: Response,
  error: unknown,
  fallbackMessage: string,
  extra: Record<string, unknown> = {},
): void {
  const err = error as { status?: number; expose?: boolean; message?: string };
  const status = typeof err?.status === "number" ? err.status : 500;
  const message =
    err?.expose === true && typeof err.message === "string"
      ? err.message
      : fallbackMessage;
  res.status(status).json({ status: "error", message, ...extra });
}

/**
 * Return an error message safe to place in a JSON response body.
 *
 * Only errors that explicitly opt in (via `expose = true`, the convention used
 * by DatabaseUnavailableError) have their message returned. Everything else —
 * raw Supabase/Postgres failures, provider errors, TypeErrors — is replaced with
 * the caller's generic message, so internal schema/stack detail never reaches
 * the client. Handlers keep their `error` field, so the response shape the SPA
 * already reads is unchanged.
 */
export function safeErrorMessage(error: unknown, fallback = "Internal error"): string {
  const err = error as { expose?: boolean; message?: string };
  return err?.expose === true && typeof err.message === "string" ? err.message : fallback;
}

/**
 * Strip internal network topology from a transport-error message before it can
 * reach a client.
 *
 * Node/axios failure messages embed the resolved host — `getaddrinfo ENOTFOUND
 * ai-soil-analysis.internal`, `connect ECONNREFUSED 10.0.0.7:8001`, or a full
 * `http://host:port/path` — which discloses private service addresses. Replace
 * every URL, bare IPv4 address and `host:port` token with a placeholder and
 * collapse the DNS/refused prefixes to a coarse category, keeping the message
 * useful without leaking where the service lives.
 */
export function sanitizeNetworkMessage(message: string): string {
  let out = message;
  // Coarse categories for the common Node transport failures.
  if (/ENOTFOUND|EAI_AGAIN/i.test(out)) return "dns_resolution_failed";
  if (/ECONNREFUSED/i.test(out)) return "connection_refused";
  if (/ECONNRESET/i.test(out)) return "connection_reset";
  if (/ETIMEDOUT|ECONNABORTED/i.test(out)) return "timeout";
  // Otherwise scrub any remaining address-shaped tokens.
  out = out
    .replace(/https?:\/\/[^\s"')]+/gi, "<redacted-url>")
    .replace(/\b\d{1,3}(?:\.\d{1,3}){3}(?::\d+)?\b/g, "<redacted-address>")
    .replace(/\b[a-z0-9-]+(?:\.[a-z0-9-]+)+\.(?:internal|local|onrender\.com)\b(?::\d+)?/gi, "<redacted-address>");
  return out;
}
