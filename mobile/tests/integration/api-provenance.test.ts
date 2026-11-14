import {
  analyzeSoil,
  chatWithAIAssistant,
  diagnosePlantDisease,
  getCropRecommendations,
  getIrrigationPlan,
  getMarketPrices,
  getWeather,
  getAnimals,
  getFarms,
  getFields,
  getNotifications,
  identifyPest,
  getAgriNews,
  setApiBaseUrl,
} from '../../src/api/client';

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

describe('AI/weather client provenance mapping (honest data labelling)', () => {
  beforeEach(() => {
    setApiBaseUrl('http://test.local');
    global.fetch = jest.fn();
  });
  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('labels soil analysis as rule-based, never as a model', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({
        dataSource: 'rule-based',
        isRealData: false,
        modelSource: 'rule-based-engine',
        fertility_level: 'خصوبة متوسطة',
        health_score: 62,
        overall_recommendations: ['أضف سماداً عضوياً'],
        missing_measurements: ['الزنك'],
        problems: [],
        findings: [{ parameter: 'ph', labelAr: 'الحموضة', value: 7.1, status: 'جيد', messageAr: 'مناسب' }],
        disclaimer: 'تحليل مبني على قواعد زراعية ثابتة.',
      }),
    );
    const { data } = await analyzeSoil({ ph: 7.1 });
    expect(data?.meta.provenance).toBe('rule-based');
    expect(data?.meta.isRealData).toBe(false);
    expect(data?.gradeScore).toBe(62);
    expect(data?.findings[0].labelAr).toBe('الحموضة');
  });

  it('maps crop recommendations and keeps rule-based provenance', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({
        dataSource: 'rule-based',
        isRealData: false,
        recommendations: [
          {
            crop: 'olive',
            name_ar: 'الزيتون',
            category: 'أشجار مثمرة',
            suitability_score: 0.82,
            water_need: 'منخفض',
            season: 'خريف',
            profit_analysis: { net_profit: 4200 },
            reasoning: ['يتحمل الملوحة'],
          },
        ],
      }),
    );
    const { data } = await getCropRecommendations({ ph: 7 });
    expect(data?.meta.provenance).toBe('rule-based');
    expect(data?.crops[0].nameAr).toBe('الزيتون');
    expect(data?.crops[0].suitabilityScore).toBe(82);
    expect(data?.crops[0].estimatedProfitTndPerHa).toBe(4200);
  });

  it('treats weather as a real live observation', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({
        current: { temperature: 27.4, humidity: 51, windSpeed: 12, description: 'صافٍ' },
        forecast: { daily: [{ date: '2026-11-14', maxTemp: 28, minTemp: 16, rainfall: 3 }] },
        location: { name: 'تونس' },
        agriculturalIndices: { cropStress: 'low' },
        source: { provider: 'open-meteo' },
      }),
    );
    const { data } = await getWeather();
    expect(data?.meta.provenance).toBe('live-observation');
    expect(data?.meta.isRealData).toBe(true);
    expect(data?.temperature).toBe(27);
    expect(data?.governorate).toBe('تونس');
    // Real rainfall in mm, straight from the provider.
    expect(data?.rainfall_mm).toBe(3);
    // We must never fabricate a "% chance of rain" the provider does not report.
    expect(data as unknown as Record<string, unknown>).not.toHaveProperty('precipitation_probability');
    expect(data?.forecast[0] as unknown as Record<string, unknown>).not.toHaveProperty('rain_chance');
  });

  it('replaces the provider Arabic coordinate placeholder with the localised governorate label', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({
        current: { temperature: 25, humidity: 40, windSpeed: 8, description: 'صافٍ' },
        forecast: { daily: [] },
        location: { name: 'موقع (36.81, 10.18)', lat: 36.81, lon: 10.18 },
        source: { provider: 'Open-Meteo' },
      }),
    );
    const { data } = await getWeather(36.81, 10.18, 'Grand Tunis');
    expect(data?.governorate).toBe('Grand Tunis');
  });

  it('keeps a real provider location name when the provider supplies one', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({
        current: { temperature: 25, humidity: 40, windSpeed: 8, description: 'صافٍ' },
        forecast: { daily: [] },
        location: { name: 'Bizerte, Bizerte', lat: 37.27, lon: 9.87 },
        source: { provider: 'Open-Meteo' },
      }),
    );
    const { data } = await getWeather(37.27, 9.87, 'Grand Tunis');
    expect(data?.governorate).toBe('Bizerte, Bizerte');
  });

  it('reports disease detection as unavailable on 503 instead of fabricating', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({ message: 'no vision model configured' }, 503),
    );
    const res = await diagnosePlantDisease({ imageUri: 'file:///tmp/leaf.jpg' });
    expect(res.unavailable).toBe(true);
    expect(res.data).toBeNull();
  });

  it('labels pest identification as rule-based with zero fabricated confidence', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({
        success: true,
        dataSource: 'rule-based',
        isRealData: false,
        data: {
          pest_identification: {
            identified_pest: 'aphid',
            pest_name_ar: 'المن',
            category: 'حشرات',
            identification_method: 'symptom_based',
            confidence_score: 0,
          },
          symptoms_used: ['أوراق ملتفة'],
        },
      }),
    );
    const { data } = await identifyPest(['أوراق ملتفة'], 'tomato');
    expect(data?.meta.provenance).toBe('rule-based');
    expect(data?.identifiedPest).toBe('aphid');
  });

  it('reports smart irrigation as unavailable when the service is not configured', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse({ message: 'down' }, 503));
    const res = await getIrrigationPlan({ cropType: 'olive' });
    expect(res.unavailable).toBe(true);
    expect(res.data).toBeNull();
  });

  it('maps the proxy "microservice" label to a trained model, not unavailable', async () => {
    // The gateway tags a genuinely trained microservice result with
    // dataSource:"microservice". It must surface as a trained model.
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({
        success: true,
        data: { schedule: [{ day: 1, liters: 400 }] },
        message: 'ok',
        dataSource: 'microservice',
        isRealData: true,
        modelSource: 'irrigation-model-v2',
      }),
    );
    const { data, unavailable } = await getIrrigationPlan({ cropType: 'olive' });
    expect(unavailable).toBe(false);
    expect(data?.meta.provenance).toBe('trained-model');
    expect(data?.meta.isRealData).toBe(true);
  });

  it('never invents climate inputs when the caller has no weather reading', async () => {
    // Omitting temperature/humidity must send them absent (not made-up 25/60),
    // so the service applies its own documented defaults rather than the app
    // presenting fabricated field values as observed.
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({ success: true, data: {}, dataSource: 'rule-based', isRealData: false }),
    );
    await getIrrigationPlan({ cropType: 'olive', growthStage: 'vegetative' });
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body).not.toHaveProperty('temperature');
    expect(body).not.toHaveProperty('humidity');
    expect(body.crop_type).toBe('olive');
  });

  it('forwards the real weather values it was given', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({ success: true, data: {}, dataSource: 'rule-based', isRealData: false }),
    );
    await getIrrigationPlan({ cropType: 'olive', temperature: 27, humidity: 45 });
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.temperature).toBe(27);
    expect(body.humidity).toBe(45);
  });

  it('marks a rule-based assistant answer honestly', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({ answer: 'اسقِ الزيتون كل 10 أيام', dataSource: 'rule-based', isRealData: false }),
    );
    const { data } = await chatWithAIAssistant('كيف أسقي الزيتون؟');
    expect(data?.reply).toContain('الزيتون');
    expect(data?.meta.provenance).toBe('rule-based');
  });

  it('marks a generative (LLM) assistant answer as llm', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({ answer: 'Réponse du modèle', dataSource: 'llm' }),
    );
    const { data } = await chatWithAIAssistant('question', 'fr');
    expect(data?.meta.provenance).toBe('llm');
  });

  it('keeps stored market records as NOT real data when the backend says so', async () => {
    // The gateway explicitly returns isRealData:false for market_prices because
    // they are unverified platform records. The client must not upgrade them to
    // "real" merely because they come from the database.
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({
        status: 'success',
        data: {
          marketOverview: [
            {
              crop: { id: 'c1', name: 'Olive', name_ar: 'زيتون' },
              cropId: 'c1',
              currentPrice: 8.5,
              averagePrice: 8.1,
              prices: [{ market_location: 'صفاقس', quality_grade: 'A', price_date: '2026-11-10' }],
            },
          ],
          dataSource: 'platform-database-unverified',
          isRealData: false,
          disclaimer: 'سجلات غير متحقق منها.',
        },
      }),
    );
    const { data } = await getMarketPrices();
    expect(data?.prices[0].cropNameAr).toBe('زيتون');
    expect(data?.meta.provenance).toBe('database');
    expect(data?.meta.isRealData).toBe(false);
    expect(data?.meta.disclaimer).toContain('غير متحقق');
  });

  it('renders an empty, honest market list when no prices are recorded (503)', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({ status: 'unavailable', dataAvailable: false }, 503),
    );
    const { data } = await getMarketPrices();
    expect(data?.prices).toEqual([]);
    expect(data?.meta.provenance).toBe('unavailable');
    expect(data?.meta.isRealData).toBe(false);
  });

  it('labels persisted livestock records as stored data (not a model)', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({
        success: true,
        data: [
          {
            id: 'a1',
            earTag: 'TN-001',
            species: 'sheep',
            breed: 'Barbarine',
            gender: 'female',
            age: 2,
            weight: 48,
            healthStatus: 'good',
            breedingStatus: 'active',
            currentValue: 700,
            currency: 'TND',
          },
        ],
        isRealData: true,
        provenance: { source: 'supabase.livestock_animals', persisted: true },
      }),
    );
    const { data, unavailable, meta } = await getAnimals();
    expect(unavailable).toBe(false);
    expect(data[0].earTag).toBe('TN-001');
    // A stored herd is a persisted platform record, never model inference.
    expect(meta.provenance).toBe('database');
    expect(meta.isRealData).toBe(true);
    expect(meta.source).toBe('supabase.livestock_animals');
  });

  it('reports livestock as unavailable (not empty) when the table is missing (503)', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({ success: false, code: 'LIVESTOCK_MIGRATION_REQUIRED' }, 503),
    );
    const { data, unavailable, meta } = await getAnimals();
    expect(unavailable).toBe(true);
    expect(data).toEqual([]);
    expect(meta.provenance).toBe('unavailable');
    expect(meta.isRealData).toBe(false);
  });

  it('labels persisted farms as stored platform records', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({
        status: 'success',
        data: [{ id: 'f1', name: 'مزرعة', name_ar: 'مزرعة', size_hectares: 4, location: 'Tunis' }],
        provenance: { source: 'supabase.farms', persisted: true },
      }),
    );
    const { data, meta } = await getFarms();
    expect(data[0].id).toBe('f1');
    expect(meta.provenance).toBe('database');
    expect(meta.isRealData).toBe(true);
  });

  it('labels persisted fields as stored platform records', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({
        status: 'success',
        data: [{ id: 'fl1', name: 'حقل', size_hectares: 2, current_crop: 'wheat' }],
      }),
    );
    const { data, meta } = await getFields();
    expect(data[0].id).toBe('fl1');
    // No explicit source → still a stored read, never upgraded to "live".
    expect(meta.provenance).toBe('database');
    expect(meta.isRealData).toBe(true);
  });

  it('labels the caller\'s persisted notifications as stored records', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({
        success: true,
        data: [
          {
            id: 'n1',
            type: 'info',
            title: 'تنبيه',
            message: 'نص',
            priority: 'high',
            read_at: null,
            created_at: '2026-11-13T10:00:00.000Z',
            is_starred: false,
          },
        ],
        source: 'supabase.notifications',
        isRealData: true,
      }),
    );
    const { data, meta, unavailable } = await getNotifications();
    expect(unavailable).toBe(false);
    expect(data[0].id).toBe('n1');
    expect(meta.provenance).toBe('database');
    expect(meta.isRealData).toBe(true);
  });

  it('marks notifications unavailable (not empty) when the store is down', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({ message: 'down' }, 503),
    );
    const { data, unavailable, meta } = await getNotifications();
    expect(unavailable).toBe(true);
    expect(data).toEqual([]);
    expect(meta.provenance).toBe('unavailable');
  });

  it('labels agri news as a real live feed with publisher attribution', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({
        articles: [
          {
            id: 'a1',
            title: 'موسم الزيتون يبدأ',
            link: 'https://example.tn/article',
            publishedAt: '2026-11-12T08:00:00.000Z',
            summary: 'ملخص',
            sourceId: 'la-presse',
            sourceName: 'La Presse de Tunisie',
            sourceUrl: 'https://www.lapresse.tn',
            language: 'fr',
            categories: ['olive & huile'],
            author: null,
          },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
        sources: [
          { id: 'la-presse', name: 'La Presse de Tunisie', language: 'fr', kind: 'direct', available: true, itemCount: 1 },
          { id: 'mosaique-fm', name: 'Mosaïque FM', language: 'ar', kind: 'direct', available: false, itemCount: 0, error: 'timeout' },
        ],
        categories: ['olive & huile'],
        generatedAt: '2026-11-13T00:00:00.000Z',
        isRealData: true,
        dataSource: 'rss-feeds',
      }),
    );
    const { data } = await getAgriNews({ language: 'ar' });
    expect(data?.meta.provenance).toBe('live-observation');
    expect(data?.meta.isRealData).toBe(true);
    expect(data?.articles[0].sourceName).toBe('La Presse de Tunisie');
    expect(data?.articles[0].link).toContain('example.tn');
    // A down source is reported, never silently replaced with fabricated items.
    expect(data?.sources.filter((s) => !s.available)).toHaveLength(1);
  });

  it('returns null data (honest failure) when the news endpoint errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse({ message: 'boom' }, 502));
    const { data, error } = await getAgriNews();
    expect(data).toBeNull();
    expect(error).toBeTruthy();
  });
});
