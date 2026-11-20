/**
 * Production configuration guards.
 *
 * These lock in the integration contract: Expo Go and release builds use the
 * reachable deployed gateway unless a developer explicitly overrides it,
 * the Supabase project is the production one, and no privileged secret is
 * embedded in the bundle.
 */
import {
  DEFAULT_API_BASE_URL,
  PRODUCTION_API_BASE_URL,
  resolveApiBaseUrl,
  resolveSupabaseConfig,
  supabaseProjectRef,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
} from '../../src/config';

function jwt(payload: Record<string, unknown>): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${encoded}.signature`;
}

const VALID_URL = 'https://jymrhhlwdbclctobhbsi.supabase.co';
const VALID_KEY = jwt({ role: 'anon', ref: 'jymrhhlwdbclctobhbsi' });

describe('production configuration', () => {
  it('uses the deployed gateway by default in both development and release builds', () => {
    expect(PRODUCTION_API_BASE_URL).toBe('https://agrodev-3.onrender.com');
    expect(resolveApiBaseUrl({ dev: false, platform: 'ios' })).toBe('https://agrodev-3.onrender.com');
    expect(resolveApiBaseUrl({ dev: false, platform: 'android' })).toBe('https://agrodev-3.onrender.com');
  });

  it('does not assume an Android development client is an emulator', () => {
    expect(resolveApiBaseUrl({ dev: true, platform: 'android' })).toBe('https://agrodev-3.onrender.com');
    expect(resolveApiBaseUrl({ dev: true, platform: 'ios' })).toBe('https://agrodev-3.onrender.com');
  });

  it('lets an explicit override win in any build', () => {
    expect(resolveApiBaseUrl({ dev: false, platform: 'ios', override: 'https://example.test' })).toBe(
      'https://example.test',
    );
    expect(resolveApiBaseUrl({ dev: true, platform: 'android', override: '  http://192.168.1.9:5000 ' })).toBe(
      'http://192.168.1.9:5000',
    );
  });

  it('exposes a resolved default at module load', () => {
    expect(typeof DEFAULT_API_BASE_URL).toBe('string');
    expect(DEFAULT_API_BASE_URL.length).toBeGreaterThan(0);
  });

  it('points at the production Supabase project', () => {
    expect(SUPABASE_URL).toBe('https://jymrhhlwdbclctobhbsi.supabase.co');
  });

  it('embeds only a public anon key (role=anon, not service_role)', () => {
    const payload = JSON.parse(
      Buffer.from(SUPABASE_ANON_KEY.split('.')[1], 'base64').toString('utf8'),
    );
    expect(payload.role).toBe('anon');
    expect(payload.ref).toBe('jymrhhlwdbclctobhbsi');
  });

  it('never embeds privileged secrets in the bundle', () => {
    const bundleSources = [SUPABASE_URL, SUPABASE_ANON_KEY, PRODUCTION_API_BASE_URL].join('\n');
    expect(bundleSources).not.toMatch(/service_role/i);
    expect(bundleSources).not.toMatch(/postgres(ql)?:\/\//i);
    expect(bundleSources).not.toMatch(/DATABASE_URL/);
  });

  it('accepts a coherent Supabase override pair', () => {
    expect(resolveSupabaseConfig(VALID_URL, VALID_KEY)).toEqual({ url: VALID_URL, anonKey: VALID_KEY });
    expect(resolveSupabaseConfig(`  ${VALID_URL}/  `, ` ${VALID_KEY} `)).toEqual({
      url: VALID_URL,
      anonKey: VALID_KEY,
    });
  });

  it('ignores a malformed Supabase URL override', () => {
    // A literal "value" (the Render env-var defect pattern) must never be used.
    expect(resolveSupabaseConfig('value', VALID_KEY)).toEqual({
      url: VALID_URL,
      anonKey: SUPABASE_ANON_KEY,
    });
    expect(resolveSupabaseConfig('http://jymrhhlwdbclctobhbsi.supabase.co', VALID_KEY).url).toBe(
      VALID_URL,
    );
  });

  it('rejects an override key older than the bundled one', () => {
    // A rotated key still decodes and names this project, so `ref` alone cannot
    // catch it; the server answers 401 "Invalid API key" for it.
    const staleKey =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5bXJoaGx3ZGJjbGN0b2JoYnNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQwMjc2NzEsImV4cCI6MjA0OTYwMzY3MX0.aAGN3jLnpCjNOw7-J3Lp4iQBbwMT9X6kMzgRgQtYz7E';
    expect(resolveSupabaseConfig(VALID_URL, staleKey)).toEqual({
      url: VALID_URL,
      anonKey: SUPABASE_ANON_KEY,
    });
  });

  it('accepts a rotated key issued after the bundled one', () => {
    const rotated = jwt({ role: 'anon', ref: 'jymrhhlwdbclctobhbsi', iat: 1900000000 });
    expect(resolveSupabaseConfig(VALID_URL, rotated)).toEqual({ url: VALID_URL, anonKey: rotated });
  });

  it('ignores a malformed or mismatched anon key override', () => {
    expect(resolveSupabaseConfig(VALID_URL, 'value').anonKey).toBe(SUPABASE_ANON_KEY);
    const otherProject = jwt({ role: 'anon', ref: 'otherownprojectref' });
    expect(resolveSupabaseConfig(VALID_URL, otherProject).anonKey).toBe(SUPABASE_ANON_KEY);
    const serviceRole = jwt({ role: 'service_role', ref: 'jymrhhlwdbclctobhbsi' });
    expect(resolveSupabaseConfig(VALID_URL, serviceRole).anonKey).toBe(SUPABASE_ANON_KEY);
  });

  it('parses only canonical Supabase project hosts', () => {
    expect(supabaseProjectRef(VALID_URL)).toBe('jymrhhlwdbclctobhbsi');
    expect(supabaseProjectRef('https://jymrhhlwdbclctobhbsi.supabase.co/')).toBe(
      'jymrhhlwdbclctobhbsi',
    );
    expect(supabaseProjectRef('https://jymrhhlwdbclctobhbsi.supabase.co/auth/v1')).toBeNull();
    expect(supabaseProjectRef('value')).toBeNull();
    expect(supabaseProjectRef('http://jymrhhlwdbclctobhbsi.supabase.co')).toBeNull();
  });
});
