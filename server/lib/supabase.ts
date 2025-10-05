import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Do not crash the dev server if Supabase variables are missing.
  // Export a null client and a flag so routes can handle absence gracefully.
  console.warn(
    '[warning] Supabase environment variables are not set. Supabase features will be disabled in this environment.'
  );
}

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;

// For server-side operations that need elevated permissions
export const supabaseAdmin = isSupabaseConfigured
  ? createClient(
      supabaseUrl as string,
      process.env.SUPABASE_SERVICE_ROLE_KEY || (supabaseAnonKey as string)
    )
  : null;

// Database connection info
export const databaseConfig = {
  connectionString: process.env.DATABASE_URL || null,
};
