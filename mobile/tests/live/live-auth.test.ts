/**
 * Live Supabase auth smoke test — opt-in.
 *
 * Runs only when `LIVE_API_TESTS=1` and exercises the app's own Supabase client
 * against the real project. It proves the shipped anon key is valid and that the
 * sign-in / password-reset code paths reach the service — the failure mode it
 * guards against is a stale anon key ("Invalid API key"), which would break
 * authentication for every user while the rest of the app looked healthy.
 *
 * Run it with:
 *     LIVE_API_TESTS=1 npx jest tests/live/live-auth.test.ts
 *
 * @jest-environment node
 */
import { supabase } from '../../src/api/supabase';
import crossFetch from 'cross-fetch';

const LIVE = process.env.LIVE_API_TESTS === '1';
const maybe = LIVE ? describe : describe.skip;

maybe('live supabase auth (LIVE_API_TESTS=1)', () => {
  beforeAll(() => {
    (globalThis as any).fetch = crossFetch;
  });

  jest.setTimeout(60000);

  it('rejects bad credentials with a credential error, not a key error', async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: 'nobody@example.com',
      password: 'definitely-wrong-password',
    });
    expect(error).not.toBeNull();
    // A valid key yields a credential/confirmation error; a stale key yields
    // "Invalid API key". Fail loudly on the latter.
    expect(error?.message ?? '').not.toMatch(/invalid api key/i);
    expect(error?.message ?? '').toMatch(/invalid login credentials|email not confirmed|invalid/i);
  });

  it('accepts a password-reset request without a key error', async () => {
    const { error } = await supabase.auth.resetPasswordForEmail('nobody@example.com');
    expect(error).toBeNull();
  });
});
