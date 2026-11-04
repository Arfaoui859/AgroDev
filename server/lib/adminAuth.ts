import crypto from "crypto";
import type { Request } from "express";

/**
 * Constant-time string comparison, so a wrong token cannot be recovered by
 * measuring how long the comparison takes.
 */
export function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Compare a buffer with itself to keep the timing roughly constant even
    // when the lengths differ.
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Verify the `x-admin-token` header against the configured admin secret.
 *
 * Accepts ADMIN_API_TOKEN (preferred: a dedicated secret that is safe to send as
 * a header) or, for backward compatibility, SUPABASE_SERVICE_ROLE_KEY. The
 * comparison is constant-time and every configured secret is checked without
 * short-circuiting, so neither the value nor which secret matched leaks through
 * timing.
 */
export function verifyAdminToken(req: Request): boolean {
  const provided = req.header("x-admin-token") || "";
  if (!provided) return false;

  const secrets = [process.env.ADMIN_API_TOKEN, process.env.SUPABASE_SERVICE_ROLE_KEY]
    .filter((s): s is string => typeof s === "string" && s.length > 0);

  let ok = false;
  for (const secret of secrets) {
    if (timingSafeEqualStr(provided, secret)) ok = true;
  }
  return ok;
}
