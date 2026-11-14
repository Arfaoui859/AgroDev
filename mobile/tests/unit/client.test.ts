import { apiRequest, setApiBaseUrl, getApiBaseUrl, createFarm, createField } from '../../src/api/client';
import { readCache } from '../../src/api/cache';
import { setActiveLanguage } from '../../src/i18n';

// Mock the Supabase client so no network/session lookup happens.
jest.mock('../../src/api/supabase', () => ({
  supabase: { auth: { getSession: jest.fn(async () => ({ data: { session: null } })) } },
}));

const originalFetch = global.fetch;

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

describe('apiRequest', () => {
  beforeEach(() => {
    setApiBaseUrl('http://test.local');
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('parses a JSON success response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse({ message: 'pong' }));
    const res = await apiRequest<{ message: string }>('/api/ping', { anonymous: true });
    expect(res.data).toEqual({ message: 'pong' });
    expect(res.status).toBe(200);
    expect(res.isOnline).toBe(true);
    expect(res.fromCache).toBe(false);
  });

  it('never leaks an Arabic-only server error to fr/en callers', async () => {
    setActiveLanguage('fr');
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({ error: 'يجب تحديد خط العرض وخط الطول بشكل صحيح' }, 400),
    );
    const res = await apiRequest('/api/weather/coordinates');
    expect(res.status).toBe(400);
    expect(res.error).toBe('Échec du chargement');
    expect(res.error).not.toMatch(/[\u0600-\u06FF]/);
  });

  it('keeps the Arabic server error for Arabic callers', async () => {
    setActiveLanguage('ar');
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({ error: 'يجب تحديد خط العرض وخط الطول بشكل صحيح' }, 400),
    );
    const res = await apiRequest('/api/weather/coordinates');
    expect(res.error).toBe('يجب تحديد خط العرض وخط الطول بشكل صحيح');
  });

  it('keeps an English server error unchanged', async () => {
    setActiveLanguage('fr');
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({ message: 'service down' }, 503),
    );
    const res = await apiRequest('/api/x');
    expect(res.error).toBe('service down');
    setActiveLanguage('ar');
  });

  it('surfaces an HTTP error without throwing', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({ message: 'service down' }, 503),
    );
    const res = await apiRequest('/api/ai/images/detect-disease', { method: 'POST' });
    expect(res.data).toBeNull();
    expect(res.status).toBe(503);
    expect(res.error).toBe('service down');
  });

  it('falls back to the cache when the network fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse({ items: [1, 2, 3] }));
    await apiRequest('/api/market/all', { cacheKey: 'market:test' });
    expect(await readCache('market:test')).not.toBeNull();

    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('offline'));
    const res = await apiRequest('/api/market/all', { cacheKey: 'market:test' });
    expect(res.fromCache).toBe(true);
    expect(res.isOnline).toBe(false);
    expect(res.data).toEqual({ items: [1, 2, 3] });
  });

  it('reports an error (no cache) when offline without a cached copy', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('offline'));
    const res = await apiRequest('/api/weather/coordinates', { cacheKey: 'weather:none' });
    expect(res.data).toBeNull();
    expect(res.isOnline).toBe(false);
    expect(res.error).toBeTruthy();
  });

  it('normalises the base URL', () => {
    setApiBaseUrl('http://host:5000/');
    expect(getApiBaseUrl()).toBe('http://host:5000');
  });

  it('creates a farm with the region key the backend validates', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({ success: true, data: { id: 'f1', name: 'مزرعة النخيل', size_hectares: 12, location: { region: 'قبلي وتوزر' } } }),
    );
    const { data } = await createFarm({ name: 'مزرعة النخيل', region: 'قبلي وتوزر', size_hectares: 12 });
    expect(data?.id).toBe('f1');
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('http://test.local/api/farms');
    const body = JSON.parse((init as RequestInit).body as string);
    // The handler rejects anything without `region`; `location` would fail.
    expect(body.region).toBe('قبلي وتوزر');
    expect(body).not.toHaveProperty('location');
  });

  it('creates a field under a farm and surfaces the persisted row', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({ status: 'success', data: { id: 'fl1', farm_id: 'f1', name: 'قطعة الشمال', size_hectares: 4.5 } }),
    );
    const { data } = await createField({ farm_id: 'f1', name: 'قطعة الشمال', size_hectares: 4.5, soil_type: 'طينية' });
    expect(data?.id).toBe('fl1');
    expect(data?.farm_id).toBe('f1');
  });
});
