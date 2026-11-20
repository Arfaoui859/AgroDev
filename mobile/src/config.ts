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

/** Public Supabase project (same project as the web application). */
export const SUPABASE_URL =
  firstNonEmpty(process.env.EXPO_PUBLIC_SUPABASE_URL) ?? 'https://jymrhhlwdbclctobhbsi.supabase.co';

/** Public Supabase anon key (RLS-protected; safe to ship in a client). */
// Keep this identical to the web client's fallback key in client/lib/supabase.ts.
// It is a public anon credential protected by Row Level Security; override it
// with EXPO_PUBLIC_SUPABASE_ANON_KEY if the project rotates its keys.
export const SUPABASE_ANON_KEY =
  firstNonEmpty(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5bXJoaGx3ZGJjbGN0b2JoYnNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MTM2NDYsImV4cCI6MjA3MDE4OTY0Nn0.l2VjAq1vZgkiAeL2EtAJp3iUWBHWbXPmQdNuNq197po';

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
