import { getMarketPrices, setApiBaseUrl } from '../../src/api/client';
import { localizeSoilGrade } from '../../src/utils/soilGrade';
import { getExtra } from '../../src/i18n/extra';

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

describe('getMarketPrices', () => {
  beforeEach(() => {
    setApiBaseUrl('http://test.local');
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('treats an honest "no prices recorded" 503 as an empty state, not a failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse(
        {
          status: 'unavailable',
          code: 'MARKET_DATA_NOT_AVAILABLE',
          dataAvailable: false,
          // Arabic-only server copy must never leak to fr/en users.
          message: 'لا توجد أسعار سوق مسجّلة حالياً.',
        },
        503,
      ),
    );

    const res = await getMarketPrices();
    expect(res.data?.prices).toEqual([]);
    expect(res.data?.meta.provenance).toBe('unavailable');
    expect(res.error).toBeNull();
  });

  it('still surfaces a genuine failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({ status: 'error', message: 'boom' }, 500),
    );

    const res = await getMarketPrices();
    expect(res.data?.prices).toEqual([]);
    expect(res.error).toBeTruthy();
  });
});

describe('localizeSoilGrade', () => {
  it('translates the closed Arabic fertility enum for each locale', () => {
    const ar = getExtra('ar');
    const fr = getExtra('fr');
    const en = getExtra('en');

    expect(localizeSoilGrade('عالية', ar)).toBe(ar.soilGradeHigh);
    expect(localizeSoilGrade('عالية', fr)).toBe('Élevée');
    expect(localizeSoilGrade('متوسطة', en)).toBe('Medium');
    expect(localizeSoilGrade('منخفضة', en)).toBe('Low');
    expect(localizeSoilGrade('ضعيفة', en)).toBe('Poor');
  });

  it('shows an unrecognised value verbatim rather than inventing a grade', () => {
    const en = getExtra('en');
    expect(localizeSoilGrade('غير معروف', en)).toBe('غير معروف');
  });
});
