import { Platform } from 'react-native';

/**
 * Runtime configuration.
 *
 * All values are overridable at build time through `EXPO_PUBLIC_*` environment
 * variables (see `.env.example`). Defaults mirror the values the web client
 * ships with so the app works out of the box against the same backend.
 *
 * Only the Supabase anon key is embedded here. It is a *public* key that is
 * already shipped in the web bundle and is protected by Row Level Security, not
 * a secret. Never put a service-role key or an AI provider key in this file.
 *
 * Each `process.env.EXPO_PUBLIC_*` reference is written statically on purpose:
 * Metro only inlines static member accesses at build time, so a dynamic lookup
 * like `process.env[name]` would never be replaced and would fall back to the
 * defaults in a production bundle.
 */

function firstNonEmpty(...values: (string | undefined)[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  }
  return undefined;
}

function asNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const SUPABASE_PROJECT_REF = 'jymrhhlwdbclctobhbsi';
const EMBEDDED_SUPABASE_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co`;
// Public anon credential protected by Row Level Security; safe to ship.
const EMBEDDED_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5bXJoaGx3ZGJjbGN0b2JoYnNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MTM2NDYsImV4cCI6MjA3MDE4OTY0Nn0.l2VjAq1vZgkiAeL2EtAJp3iUWBHWbXPmQdNuNq197po';
// A rotated key is always issued later than the one bundled here. An older key
// still decodes and still names this project, but the server rejects it with
// "Invalid API key" — so `iat` is the only local signal that a key is stale.
const EMBEDDED_SUPABASE_KEY_IAT = 1754613646;

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function decodeBase64Url(value: string): string | null {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/').replace(/=+$/, '');
  let bits = 0;
  let buffer = 0;
  let output = '';
  for (const character of normalized) {
    const index = BASE64_ALPHABET.indexOf(character);
    if (index < 0) return null;
    buffer = (buffer << 6) | index;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
      buffer &= (1 << bits) - 1;
    }
  }
  return output;
}

/** Project ref of a canonical `https://<ref>.supabase.co` URL, or null. */
export function supabaseProjectRef(url: string): string | null {
  const match = /^https:\/\/([a-z0-9-]+)\.supabase\.co\/?$/i.exec(url.trim());
  return match ? match[1].toLowerCase() : null;
}

function anonKeyClaims(key: string): { ref: string; iat?: number; exp?: number } | null {
  const parts = key.split('.');
  if (parts.length !== 3) return null;
  const payload = decodeBase64Url(parts[1]);
  if (!payload) return null;
  try {
    const claims = JSON.parse(payload) as { role?: string; ref?: string; iat?: number; exp?: number };
    if (claims.role !== 'anon' || !claims.ref) return null;
    return { ref: claims.ref.toLowerCase(), iat: claims.iat, exp: claims.exp };
  } catch {
    return null;
  }
}

function isStaleKey(claims: { iat?: number; exp?: number }): boolean {
  if (typeof claims.exp === 'number' && claims.exp * 1000 <= Date.now()) return true;
  return typeof claims.iat === 'number' && claims.iat < EMBEDDED_SUPABASE_KEY_IAT;
}

/**
 * Accept an `EXPO_PUBLIC_*` override only when it is a coherent, current
 * Supabase pair. A malformed URL, a non-anon key (e.g. a service-role key), a
 * key issued for a different project, or a key older than the one bundled in
 * this build would make every auth request fail with "Invalid API key" while
 * the rest of the app looks healthy.
 */
export function resolveSupabaseConfig(
  urlOverride?: string,
  keyOverride?: string,
): { url: string; anonKey: string } {
  const candidateUrl = firstNonEmpty(urlOverride);
  const candidateKey = firstNonEmpty(keyOverride);
  const ref = candidateUrl ? supabaseProjectRef(candidateUrl) : null;
  const claims = candidateKey ? anonKeyClaims(candidateKey) : null;
  if (candidateUrl && candidateKey && ref && claims && claims.ref === ref && !isStaleKey(claims)) {
    return { url: candidateUrl.replace(/\/+$/, ''), anonKey: candidateKey };
  }
  return { url: EMBEDDED_SUPABASE_URL, anonKey: EMBEDDED_SUPABASE_ANON_KEY };
}

const supabaseConfig = resolveSupabaseConfig(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
);

/** Public Supabase project (same project as the web application). */
export const SUPABASE_URL = supabaseConfig.url;

/** Public Supabase anon key (RLS-protected; safe to ship in a client). */
// Keep this identical to the web client's fallback key in client/lib/supabase.ts.
export const SUPABASE_ANON_KEY = supabaseConfig.anonKey;

/** Deployed Express gateway (the app's only backend entry point). */
export const PRODUCTION_API_BASE_URL = 'https://agrodev-3.onrender.com';

/**
 * Default Express API base URL.
 *
 * The deployed Render gateway is the safe default in both Expo Go and
 * production. A physical Android device cannot reach the special Android
 * emulator address (10.0.2.2), and localhost on a phone points back to the
 * phone itself. Use EXPO_PUBLIC_API_BASE_URL explicitly when developing
 * against a local server:
 * - Android emulator: http://10.0.2.2:5000
 * - Physical device:  http://<computer-LAN-IP>:5000
 * - iOS simulator/web: http://localhost:5000
 *
 * EXPO_PUBLIC_API_BASE_URL always wins when set.
 */
export function resolveApiBaseUrl(opts: {
  dev: boolean;
  platform: string;
  override?: string;
}): string {
  const override = firstNonEmpty(opts.override);
  if (override) return override;
  // Do not infer that an Android development client is an emulator: Expo Go
  // commonly runs on a physical phone, where 10.0.2.2 is not reachable.
  // Local development servers must be opted into explicitly via the override.
  return PRODUCTION_API_BASE_URL;
}

export const DEFAULT_API_BASE_URL = resolveApiBaseUrl({
  dev: __DEV__,
  platform: Platform.OS,
  override: process.env.EXPO_PUBLIC_API_BASE_URL,
});

/**
 * Per-request network timeout in milliseconds.
 *
 * Defaults to 30s because the backend runs on Render, whose free instances spin
 * down when idle and can take tens of seconds to answer the first request after
 * waking. A 15s timeout would fail every cold start. Callers can still override.
 */
export const API_TIMEOUT_MS = asNumber(process.env.EXPO_PUBLIC_API_TIMEOUT_MS, 30000);

/** Offline cache lifetime for list/detail reads, in milliseconds (default 6h). */
export const CACHE_TTL_MS = asNumber(process.env.EXPO_PUBLIC_CACHE_TTL_MS, 6 * 60 * 60 * 1000);

/** Longest edge (px) an image is downscaled to before upload. */
export const IMAGE_MAX_EDGE = asNumber(process.env.EXPO_PUBLIC_IMAGE_MAX_EDGE, 1280);

/** JPEG quality used when re-encoding an image for upload. */
export const IMAGE_COMPRESS_QUALITY = asNumber(process.env.EXPO_PUBLIC_IMAGE_QUALITY, 0.75);

export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
