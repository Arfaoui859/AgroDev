/**
 * Live production smoke test — opt-in.
 *
 * `npm test` stays offline and green by default; this suite only runs when
 * `LIVE_API_TESTS=1` is set, and it talks to the REAL deployed gateway
 * (`https://agrodev-3.onrender.com`) through the app's own client code. It
 * proves the production integration end-to-end (base URL, auth header
 * plumbing, provenance mapping) rather than mocking fetch.
 *
 * Run it with:
 *     LIVE_API_TESTS=1 npx jest tests/live/production-smoke.test.ts
 *
 * @jest-environment node
 */
import { apiRequest, getApiBaseUrl, setApiBaseUrl, analyzeSoil } from '../../src/api/client';
// Real fetch for the node environment (jest-expo's jsdom fetch is a stub that
// returns no status). Importing it lets the app's own client code make genuine
// network calls against the deployed gateway.
import crossFetch from 'cross-fetch';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../src/config';

jest.mock('../../src/api/supabase', () => ({
  supabase: { auth: { getSession: jest.fn(async () => ({ data: { session: null } })) } },
}));

const LIVE = process.env.LIVE_API_TESTS === '1';
const maybe = LIVE ? describe : describe.skip;

maybe('live production gateway (LIVE_API_TESTS=1)', () => {
  beforeAll(() => {
    (globalThis as any).fetch = crossFetch;
    setApiBaseUrl('https://agrodev-3.onrender.com');
  });

  jest.setTimeout(60000);

  it('reaches the gateway health probe', async () => {
    const res = await apiRequest<any>('/api/ping', { anonymous: true });
    expect(res.status).toBe(200);
    expect(res.data).toBeTruthy();
  });

  it('reports the live AI capability matrix honestly', async () => {
    const res = await apiRequest<any>('/api/ai/capabilities', { anonymous: true });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data?.capabilities)).toBe(true);
    expect(typeof res.data?.summary?.total).toBe('number');
    // Every capability must declare a real engine, never a blank one.
    for (const cap of res.data.capabilities) {
      expect(typeof cap.engine).toBe('string');
      expect(cap.engine.length).toBeGreaterThan(0);
    }
  });

  it('labels a rule-based soil analysis as rule-based, never a model', async () => {
    const { data } = await analyzeSoil({ ph: 7.1, nitrogen: 40 });
    expect(data).not.toBeNull();
    expect(data?.meta.provenance).toBe('rule-based');
    expect(data?.meta.isRealData).toBe(false);
  });

  it('keeps the configured base URL pointing at the production gateway', () => {
    expect(getApiBaseUrl()).toBe('https://agrodev-3.onrender.com');
  });

  // Auth is the one integration that talks to Supabase directly (not the
  // gateway), so the shipped anon key must be valid against the live project.
  // An "Invalid API key" here means sign-in/sign-up would fail for every user.
  it('reaches the live Supabase auth service with the shipped anon key', async () => {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: SUPABASE_ANON_KEY },
    });
    expect(res.status).toBe(200);
  });
});
