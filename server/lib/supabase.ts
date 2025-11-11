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
