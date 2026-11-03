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
