import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Support multiple env var names depending on runtime (Vite prefixes vars with VITE_ for client builds)
const supabaseUrl =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || null;
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || null;

if (!supabaseUrl || !supabaseAnonKey) {
  // Do not crash the dev server if Supabase variables are missing.
  // Export a null client and a flag so routes can handle absence gracefully.
  console.warn(
    "[warning] Supabase environment variables are not set. Supabase features will be disabled in this environment.",
  );
}

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Thrown by services when a write needs the database but no Supabase client is
 * configured. It carries status/expose so the global error handler answers 503
 * with a clear message instead of a leaked "Cannot read properties of null".
 */
export class DatabaseUnavailableError extends Error {
  status = 503;
  expose = true;
  constructor() {
    super(
      "Database is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY to enable persistence.",
    );
    this.name = "DatabaseUnavailableError";
  }
}

/** Throw DatabaseUnavailableError unless a Supabase client is available. */
export function assertDbAvailable(client: SupabaseClient | null = supabase): void {
  if (!client) throw new DatabaseUnavailableError();
}

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;

/**
 * A Supabase client that acts *as the calling user*.
 *
 * The module-level `supabase` client carries only the anon key, so PostgREST
 * evaluates RLS with `auth.uid()` = NULL: the per-user policies on farms,
 * farm_sections, soil_analyses and crop_recommendations then deny every row
 * (reads return 0 rows, writes raise a policy violation). Attaching the caller's
 * verified access token makes PostgREST evaluate those same policies as that
 * user, which is what the ownership rules were written for.
 *
 * Returns null when the project is unconfigured or no token was supplied, so
 * callers fall back to the anon client (demo/dev) rather than silently acting as
 * an arbitrary user.
 */
export function createScopedClient(
  accessToken: string | undefined | null,
): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey || !accessToken) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Build a caller-scoped client from a raw `Authorization` header value.
 * Returns null when the header is absent or malformed, so callers fall back to
 * the anon client instead of treating an unparsable header as an identity.
 */
export function scopedClientFromAuthHeader(
  authorization: string | undefined | null,
): SupabaseClient | null {
  const match = /^Bearer\s+(.+)$/i.exec(authorization || "");
  return createScopedClient(match ? match[1].trim() : null);
}

// Elevated server-side client. Never silently substitute the public anon key:
// doing so makes admin queries look like ordinary RLS-filtered queries and can
// misreport missing admin roles as 403 responses.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || null;

export const isSupabaseAdminConfigured = Boolean(supabaseUrl && supabaseServiceKey);

export const supabaseAdmin: SupabaseClient | null = isSupabaseAdminConfigured
  ? createClient(supabaseUrl as string, supabaseServiceKey as string, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

if (isSupabaseConfigured && !isSupabaseAdminConfigured) {
  console.warn(
    "[admin-auth] SUPABASE_SERVICE_ROLE_KEY is not configured; privileged database operations are disabled.",
  );
}

// Database connection info
export const databaseConfig = {
  connectionString: process.env.DATABASE_URL || null,
};
