/**
 * Production configuration guards.
 *
 * These lock in the integration contract: the app ships with the deployed
 * Express gateway as its production default, the Supabase project is the
 * production one, and no privileged secret is ever embedded in the bundle.
 */
import {
  DEFAULT_API_BASE_URL,
  PRODUCTION_API_BASE_URL,
  resolveApiBaseUrl,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
} from '../../src/config';

describe('production configuration', () => {
  it('resolves the production gateway for a release build', () => {
    expect(PRODUCTION_API_BASE_URL).toBe('https://agrodev-3.onrender.com');
    expect(resolveApiBaseUrl({ dev: false, platform: 'ios' })).toBe('https://agrodev-3.onrender.com');
    expect(resolveApiBaseUrl({ dev: false, platform: 'android' })).toBe('https://agrodev-3.onrender.com');
  });

  it('uses the local dev server only in debug builds', () => {
    expect(resolveApiBaseUrl({ dev: true, platform: 'android' })).toBe('http://10.0.2.2:5000');
    expect(resolveApiBaseUrl({ dev: true, platform: 'ios' })).toBe('http://localhost:5000');
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
});
