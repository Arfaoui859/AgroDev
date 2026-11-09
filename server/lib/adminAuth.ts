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
 * Accepts only ADMIN_API_TOKEN. The Supabase service-role key is never an
 * HTTP credential: exposing it to callers would grant broad database access.
 * The comparison is constant-time.
 */
export function verifyAdminToken(req: Request): boolean {
  const provided = req.header("x-admin-token") || "";
  if (!provided) return false;

  const secret = process.env.ADMIN_API_TOKEN;
  if (!secret) return false;
  return timingSafeEqualStr(provided, secret);
}
