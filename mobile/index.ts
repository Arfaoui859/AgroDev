import 'react-native-url-polyfill/auto';

import { registerRootComponent } from 'expo';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './src/config';
import App from './App';

/**
 * React Native transport guard:
 * Supabase's JS client normally adds apikey itself. Some native fetch/Request
 * combinations can lose headers when a Request is reconstructed by a polyfill.
 * Enforce the public project key at the final fetch boundary for this project
 * only, while preserving every existing header (especially Authorization).
 */
const nativeFetch = globalThis.fetch.bind(globalThis);
const supabaseOrigin = new URL(SUPABASE_URL).origin;

globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
  let requestUrl = '';
  try {
    requestUrl =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : (input as Request).url;
    if (new URL(requestUrl).origin !== supabaseOrigin) {
      return nativeFetch(input, init);
    }
  } catch {
    return nativeFetch(input, init);
  }

  // Merge Request and init headers without Request instanceof checks:
  // React Native polyfills differ across runtimes.
  const headers = new Headers((input as Request).headers);
  new Headers(init?.headers).forEach((value, key) => headers.set(key, value));
  headers.set('apikey', SUPABASE_ANON_KEY);

  return nativeFetch(input, { ...init, headers });
}) as typeof fetch;

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately.
registerRootComponent(App);