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
 * Accepts only the dedicated ADMIN_API_TOKEN. Never accept the Supabase
 * service-role key as an HTTP header: it grants full database/Auth privileges
 * and must remain server-side. The comparison is constant-time.
 */
export function verifyAdminToken(req: Request): boolean {
  const provided = req.header("x-admin-token") || "";
  if (!provided) return false;

  const expected = process.env.ADMIN_API_TOKEN;
  if (!expected) return false;
  return timingSafeEqualStr(provided, expected);
}
