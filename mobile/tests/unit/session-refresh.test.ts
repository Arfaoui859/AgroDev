import { apiRequest, setApiBaseUrl } from '../../src/api/client';

// A session whose access token the gateway will reject once, then accept after
// a refresh. `refreshSession` must be invoked exactly once and the request
// retried with the refreshed token.
const mockRefreshSession = jest.fn<Promise<any>, []>(async () => {
  // A real Supabase refresh replaces the stored session, so the next
  // getSession() call returns the new token.
  mockCurrentToken = 'refreshed-token';
  return { data: { session: { access_token: mockCurrentToken } }, error: null };
});

let mockCurrentToken = 'stale-token';

jest.mock('../../src/api/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(async () => ({ data: { session: { access_token: mockCurrentToken } } })),
      refreshSession: () => mockRefreshSession(),
    },
  },
}));

const originalFetch = global.fetch;

function response(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

describe('apiRequest session refresh', () => {
  beforeEach(() => {
    setApiBaseUrl('http://test.local');
    mockCurrentToken = 'stale-token';
    mockRefreshSession.mockClear();
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('refreshes the session once and retries on a 401', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(response({ message: 'unauthorized' }, 401))
      .mockResolvedValueOnce(response({ ok: true }));

    const res = await apiRequest<{ ok: boolean }>('/api/farms');

    expect(mockRefreshSession).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(res.status).toBe(200);
    expect(res.data).toEqual({ ok: true });

    // The retry must carry the refreshed token, not the stale one.
    const [, retryInit] = (global.fetch as jest.Mock).mock.calls[1];
    const authHeader = new Headers((retryInit as RequestInit).headers).get('Authorization');
    expect(authHeader).toBe('Bearer refreshed-token');
  });

  it('does not refresh an anonymous request that gets a 401', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(response({ message: 'unauthorized' }, 401));

    const res = await apiRequest('/api/ping', { anonymous: true });

    expect(mockRefreshSession).not.toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(401);
  });

  it('surfaces the 401 when the refresh does not yield a session', async () => {
    mockRefreshSession.mockResolvedValueOnce({ data: { session: null }, error: new Error('expired') });
    (global.fetch as jest.Mock).mockResolvedValueOnce(response({ message: 'unauthorized' }, 401));

    const res = await apiRequest('/api/farms');

    expect(mockRefreshSession).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(401);
  });
});
