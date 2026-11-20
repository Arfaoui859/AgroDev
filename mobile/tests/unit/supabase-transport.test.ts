import { supabaseFetch } from '../../src/api/supabase';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../../src/config';

const originalFetch = global.fetch;

function okResponse(url: string): Response {
  return {
    ok: true,
    status: 200,
    url,
    redirected: false,
    clone: () => ({ text: async () => '{}' }),
  } as unknown as Response;
}

describe('Supabase native transport', () => {
  beforeEach(() => {
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;
      return okResponse(url);
    }) as jest.Mock;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('sends the anon key in both header and URL for string endpoints', async () => {
    await supabaseFetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });

    const [input, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(new URL(String(input)).searchParams.get('apikey')).toBe(SUPABASE_ANON_KEY);
    expect((init.headers as Record<string, string>).apikey).toBe(SUPABASE_ANON_KEY);
  });

  it('adds the key when the SDK passes a URL object', async () => {
    await supabaseFetch(new URL(`${SUPABASE_URL}/auth/v1/health`), { method: 'GET' });

    const [input] = (global.fetch as jest.Mock).mock.calls[0];
    expect(new URL(String(input)).searchParams.get('apikey')).toBe(SUPABASE_ANON_KEY);
  });

  it('preserves a Request while adding the URL fallback', async () => {
    const request = new Request(`${SUPABASE_URL}/auth/v1/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });

    await supabaseFetch(request);

    const [input] = (global.fetch as jest.Mock).mock.calls[0];
    expect(input).toBeInstanceOf(Request);
    expect(new URL((input as Request).url).searchParams.get('apikey')).toBe(SUPABASE_ANON_KEY);
    expect((input as Request).method).toBe('POST');
  });

  it('never leaks the Supabase key to a different origin', async () => {
    await supabaseFetch('https://example.com/auth/v1/token', { method: 'GET' });

    const [input] = (global.fetch as jest.Mock).mock.calls[0];
    expect(new URL(String(input)).searchParams.has('apikey')).toBe(false);
  });
});
