import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { LanguageProvider } from '../../src/context/LanguageContext';
import { AuthProvider } from '../../src/context/AuthContext';
import { HomeScreen } from '../../src/screens/HomeScreen';

const mockGetWeather = jest.fn();
const mockPingServer = jest.fn();
const mockGetNotifications = jest.fn();

jest.mock('../../src/api/client', () => ({
  getWeather: (...args: any[]) => mockGetWeather(...args),
  pingServer: (...args: any[]) => mockPingServer(...args),
  getNotifications: (...args: any[]) => mockGetNotifications(...args),
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
});
