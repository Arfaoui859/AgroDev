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
export function assertDbAvailable(): void {
  if (!supabase) throw new DatabaseUnavailableError();
}

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;

// For server-side operations that need elevated permissions
export const supabaseAdmin: SupabaseClient | null = isSupabaseConfigured
  ? createClient(
      supabaseUrl as string,
      process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey!,
    )
  : null;

// Database connection info
export const databaseConfig = {
  connectionString: process.env.DATABASE_URL || null,
};
