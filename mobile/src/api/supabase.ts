import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../config';
import { secureStorageAdapter } from './secureStorage';

/**
 * Supabase client for the mobile app.
 *
 * Sessions are persisted in the OS secure store (chunked, see secureStorage.ts)
 * and refreshed automatically. `detectSessionInUrl` is off because React Native
 * has no browser URL to parse.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: secureStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/** Host of the configured Supabase project, for diagnostics (never a secret). */
export const supabaseHost = (() => {
  try {
    return new URL(SUPABASE_URL).host;
  } catch {
    return SUPABASE_URL;
  }
})();
