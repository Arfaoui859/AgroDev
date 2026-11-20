import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../config';
import { secureStorageAdapter } from './secureStorage';

/**
 * Use a fetch implementation owned by this Supabase client.
 *
 * Supabase captures its fetch implementation when createClient() runs. A
 * global.fetch wrapper installed later by the Expo entrypoint is therefore
 * too late and may never see Auth requests. Inject the apikey here, at the
 * transport actually used by supabase-js, while preserving Authorization and
 * every other caller-supplied header.
 */
const supabaseFetch: typeof fetch = (input, init) => {
  const requestHeaders =
    typeof Request !== 'undefined' && input instanceof Request
      ? input.headers
      : undefined;
  const headers = new Headers(requestHeaders);

  new Headers(init?.headers).forEach((value, key) => {
    headers.set(key, value);
  });

  headers.set('apikey', SUPABASE_ANON_KEY);

  return fetch(input, { ...init, headers });
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: {
    headers: { apikey: SUPABASE_ANON_KEY },
    fetch: supabaseFetch,
  },
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
