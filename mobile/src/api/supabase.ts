import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../config';
import { secureStorageAdapter } from './secureStorage';

/**
 * Supabase-owned transport with temporary, secret-safe diagnostics.
 * Never log request headers, credentials, tokens, or query parameters.
 */
export const supabaseFetch: typeof fetch = async (input, init) => {
  const requestHeaders =
    typeof Request !== 'undefined' && input instanceof Request
      ? input.headers
      : undefined;
  const headers = new Headers(requestHeaders);

  new Headers(init?.headers).forEach((value, key) => {
    headers.set(key, value);
  });

  headers.set('apikey', SUPABASE_ANON_KEY);

  // React Native's native fetch bridge is more reliable with a plain object
  // than a WHATWG Headers instance. Passing Headers directly can silently
  // drop custom headers (including Supabase's required apikey header).
  const fetchHeaders: Record<string, string> = {};
  headers.forEach((value, key) => {
    fetchHeaders[key] = value;
  });

  // Supabase's fetch adapter may receive a string, URL, or Request depending
  // on the SDK/runtime path. Normalize all three; otherwise a URL/Request
  // object can bypass the query fallback even though the header is present.
  const rawUrl =
    typeof input === 'string'
      ? input
      : typeof URL !== 'undefined' && input instanceof URL
        ? input.toString()
        : input.url;
  let requestPath = '<unparseable-url>';
  try {
    requestPath = new URL(rawUrl).pathname;
  } catch {
    // Keep the URL itself out of logs in case it contains sensitive data.
  }

  const method = (init?.method || (typeof Request !== 'undefined' && input instanceof Request ? input.method : 'GET')).toUpperCase();
  console.info('[AGROVIBE-AUTH] request', {
    method,
    path: requestPath,
    apikeyPresent: headers.has('apikey'),
    apikeyLength: headers.get('apikey')?.length ?? 0,
    projectHost: (() => {
      try { return new URL(SUPABASE_URL).host; } catch { return '<invalid-url>'; }
    })(),
  });

  // Auth requests must never leave the login UI spinning forever when
  // Android's native network stack stalls. Keep the timeout local to this
  // transport so Supabase receives a normal AbortError and signIn can finish.
  const controller = new AbortController();
  const callerSignal = init?.signal;
  const abortFromCaller = () => controller.abort();
  if (callerSignal?.aborted) controller.abort();
  else callerSignal?.addEventListener('abort', abortFromCaller, { once: true });
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  // Some Android/React Native networking stacks have been observed to
  // omit custom headers before the request reaches Supabase's API gateway.
  // Supabase also accepts the public anon key as an `apikey` URL parameter.
  // Send both forms for string URLs so authentication still works if the
  // native bridge strips the header. Never log the URL or its query string.
  let fetchInput: RequestInfo | URL = input;
  try {
    const requestUrl = new URL(rawUrl);
    if (requestUrl.origin === new URL(SUPABASE_URL).origin) {
      requestUrl.searchParams.set('apikey', SUPABASE_ANON_KEY);
      const urlWithKey = requestUrl.toString();

      if (typeof input === 'string' || (typeof URL !== 'undefined' && input instanceof URL)) {
        fetchInput = urlWithKey;
      } else if (typeof Request !== 'undefined' && input instanceof Request) {
        // Preserve method, body, credentials, and request headers while
        // replacing only the URL. The headers are also passed as a plain
        // object below for React Native's native fetch bridge.
        fetchInput = new Request(urlWithKey, input);
      }
    }
  } catch {
    // Keep the original input; the request will report a normal URL error.
  }

  try {
    const response = await fetch(fetchInput, {
      ...init,
      headers: fetchHeaders,
      signal: controller.signal,
    });
    let responsePath = requestPath;
    try {
      responsePath = new URL(response.url || rawUrl).pathname;
    } catch {
      // Do not log an unparsed URL.
    }

    console.info('[AGROVIBE-AUTH] response', {
      method,
      path: requestPath,
      responsePath,
      status: response.status,
      ok: response.ok,
      redirected: response.redirected,
    });

    if (!response.ok) {
      try {
        const body = await response.clone().text();
        const safeBody = body
          .replace(/eyJ[A-Za-z0-9._-]{20,}/g, '<redacted-token>')
          .replace(/(apikey|authorization|access_token|refresh_token|password)["'\s:=]+[^,}"'\s]+/gi, '$1=<redacted>')
          .slice(0, 300);
        console.warn('[AGROVIBE-AUTH] error-body', {
          status: response.status,
          path: responsePath,
          body: safeBody,
        });
      } catch (diagnosticError) {
        console.warn('[AGROVIBE-AUTH] error-body-unavailable', {
          name: diagnosticError instanceof Error ? diagnosticError.name : 'UnknownError',
        });
      }
    }

    return response;
  } catch (error) {
    console.error('[AGROVIBE-AUTH] network-error', {
      method,
      path: requestPath,
      name: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message.slice(0, 180) : 'Request failed',
    });
    throw error;
  } finally {
    clearTimeout(timeoutId);
    callerSignal?.removeEventListener('abort', abortFromCaller);
  }
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
