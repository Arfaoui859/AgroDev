import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../config';
import { secureStorageAdapter } from './secureStorage';

/**
 * Supabase JS already attaches the project API key to Auth and REST requests.
 * Keep the native client on the platform fetch implementation: wrapping fetch
 * and inspecting `input instanceof Request` is not reliable across React
 * Native runtimes, where the global Request constructor may be unavailable or
 * implemented differently. That wrapper could throw before the request ever
 * reaches Supabase and be misreported as a connection failure.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  // Set the header explicitly as well as the constructor key. This guarantees
  // every Auth/PostgREST request carries apikey in native builds, even if a
  // fetch/polyfill layer bypasses the SDK's default header injection.
  global: { headers: { apikey: SUPABASE_ANON_KEY } },
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
