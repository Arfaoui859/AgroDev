import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { LanguageProvider } from '../../src/context/LanguageContext';
import { AuthProvider } from '../../src/context/AuthContext';
import { HomeScreen } from '../../src/screens/HomeScreen';

const mockGetWeather = jest.fn();
const mockPingServer = jest.fn();
const mockGetNotifications = jest.fn();
const mockGetAICapabilities = jest.fn();
const mockGetAgriNews = jest.fn();

jest.mock('../../src/api/client', () => ({
  getWeather: (...args: any[]) => mockGetWeather(...args),
  pingServer: (...args: any[]) => mockPingServer(...args),
  getNotifications: (...args: any[]) => mockGetNotifications(...args),
  getAICapabilities: (...args: any[]) => mockGetAICapabilities(...args),
  getAgriNews: (...args: any[]) => mockGetAgriNews(...args),
  capabilityMap: (payload: any) => {
    const map: Record<string, any> = {};
    for (const cap of payload?.capabilities ?? []) map[cap.id] = cap;
    return map;
  },
  apiRequest: jest.fn(async () => ({ data: { profile: { role: 'farmer' } }, error: null })),
}));

jest.mock('../../src/api/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(async () => ({
        data: {
          session: {
            user: { id: 'u1', email: 'farmer@example.tn', user_metadata: {} },
            access_token: 't',
          },
        },
      })),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: jest.fn() } } }),
      signOut: jest.fn(async () => ({ error: null })),
    },
  },
  isSupabaseConfigured: true,
  supabaseHost: 'example.supabase.co',
}));

jest.mock('../../src/hooks/useConnectivity', () => ({
  useConnectivity: () => ({ isOnline: true }),
}));

const liveWeather = {
  data: {
    temperature: 24,
    humidity: 55,
    rainfall_mm: 0,
    wind_speed: 12,
    condition_ar: 'صافٍ',
    icon: 'sunny',
    governorate: 'Tunis',
    advice_ar: 'نصيحة',
    advice_fr: 'conseil',
    advice_en: 'advice',
    forecast: [],
    meta: { provenance: 'live-observation', isRealData: true },
  },
  error: null,
  fromCache: false,
};

const renderScreen = () =>
  render(
    <LanguageProvider>
      <AuthProvider>
        <HomeScreen
          onNavigateToService={() => {}}
          onNavigateToTab={() => {}}
          onOpenNotifications={() => {}}
        />
      </AuthProvider>
    </LanguageProvider>,
  );

describe('HomeScreen urgent-alert panel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetWeather.mockResolvedValue(liveWeather);
    mockPingServer.mockResolvedValue({ ok: true, message: 'pong' });
    mockGetAICapabilities.mockResolvedValue({
      data: {
        capabilities: [
          {
            id: 'soil-analysis',
            name: 'Soil Analysis',
            nameAr: 'تحليل التربة',
            engine: 'rule-based',
            provenance: 'Rule-based engine',
            provenanceAr: 'محرك قواعد',
          },
          {
            id: 'irrigation-optimizer',
            name: 'Smart Irrigation Optimizer',
            nameAr: 'الري الذكي',
            engine: 'unavailable',
            provenance: 'Unavailable',
            provenanceAr: 'غير متاح',
          },
        ],
      },
      error: null,
    });
    mockGetAgriNews.mockResolvedValue({ data: { articles: [], sources: [], categories: [] }, error: null });
  });

  it('keeps notification results visible when the independent weather request fails', async () => {
    mockGetWeather.mockRejectedValueOnce(new Error('weather unavailable'));
    mockGetNotifications.mockResolvedValueOnce({
      data: [
        {
          id: 'n-weather-independent',
          type: 'alert',
          title: 'تنبيه مستقل عن الطقس',
          message: 'راجع حالة الحقل',
          priority: 'high',
          readAt: null,
          createdAt: '2026-11-16T08:00:00.000Z',
          isStarred: false,
        },
      ],
      error: null,
      unavailable: false,
    });

    await renderScreen();

    await waitFor(() => expect(screen.getByText('تنبيه مستقل عن الطقس')).toBeTruthy());
    expect(screen.getByText('الطقس غير متاح حالياً')).toBeTruthy();
  });

  it('shows an honest empty state when there are genuinely no urgent alerts', async () => {
    mockGetNotifications.mockResolvedValueOnce({ data: [], error: null, unavailable: false });

    await renderScreen();

    await waitFor(() => expect(screen.getByText('لا توجد تنبيهات عاجلة اليوم')).toBeTruthy());
  });

  it('shows an unavailable state (not "no alerts") when the store is disconnected', async () => {
    mockGetNotifications.mockResolvedValueOnce({
      data: [],
      error: 'الإشعارات غير متاحة',
      unavailable: true,
    });

    await renderScreen();

    await waitFor(() =>
      expect(
        screen.getByText('تعذّر تحميل التنبيهات؛ مخزن التنبيهات غير متاح حالياً.'),
      ).toBeTruthy(),
    );
  });

  it('shows a genuine error state when the alert fetch fails', async () => {
    mockGetNotifications.mockResolvedValueOnce({
      data: [],
      error: 'HTTP 500',
      unavailable: false,
    });

    await renderScreen();

    await waitFor(() => expect(screen.getByText('تعذّر تحميل البيانات')).toBeTruthy());
  });

  it('renders urgent alerts from the caller\'s own persisted notifications', async () => {
    mockGetNotifications.mockResolvedValueOnce({
      data: [
        {
          id: 'n1',
          type: 'alert',
          title: 'تنبيه عاجل',
          message: 'ري مطلوب',
          priority: 'critical',
          readAt: null,
          createdAt: '2026-11-13T08:00:00.000Z',
          isStarred: false,
        },
      ],
      error: null,
      unavailable: false,
    });

    await renderScreen();

    await waitFor(() => expect(screen.getByText('تنبيه عاجل')).toBeTruthy());
  });

  it('features a real curated agricultural video on the home dashboard', async () => {
    mockGetNotifications.mockResolvedValueOnce({ data: [], error: null, unavailable: false });

    await renderScreen();

    await waitFor(() =>
      expect(screen.getByText('تقليم شجرة الزيتون خطوة بخطوة 🫒')).toBeTruthy(),
    );
  });

  it('exposes the agricultural-projects module from the role-aware home tiles', async () => {
    mockGetNotifications.mockResolvedValueOnce({ data: [], error: null, unavailable: false });

    await renderScreen();

    // The farmer profile promotes `projects` into the visible four tiles, so an
    // Arabic-first farmer reaches their own plantings in one tap from Home.
    await waitFor(() =>
      expect(screen.getByText('مشاريعي الزراعية')).toBeTruthy(),
    );
  });
});
