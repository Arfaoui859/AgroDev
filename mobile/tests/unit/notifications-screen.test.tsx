import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { LanguageProvider } from '../../src/context/LanguageContext';
import { AuthProvider } from '../../src/context/AuthContext';
import { NotificationsScreen } from '../../src/screens/NotificationsScreen';

const mockGetNotifications = jest.fn();

jest.mock('../../src/api/client', () => ({
  getNotifications: (...args: any[]) => mockGetNotifications(...args),
  markNotificationRead: jest.fn(async () => ({ ok: true, error: null })),
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

const renderScreen = () =>
  render(
    <LanguageProvider>
      <AuthProvider>
        <NotificationsScreen onBack={() => {}} />
      </AuthProvider>
    </LanguageProvider>,
  );

describe('NotificationsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the caller\'s own persisted notifications', async () => {
    mockGetNotifications.mockResolvedValueOnce({
      data: [
        {
          id: 'n1',
          type: 'alert',
          title: 'تنبيه ري',
          message: 'راقب رطوبة حقل الزيتون',
          priority: 'high',
          readAt: null,
          createdAt: '2026-11-13T08:00:00.000Z',
          isStarred: false,
        },
      ],
      error: null,
      unavailable: false,
      meta: { provenance: 'database', isRealData: true, source: 'supabase.notifications' },
    });

    await renderScreen();

    await waitFor(() => expect(screen.getByText('تنبيه ري')).toBeTruthy());
    // Persisted rows must be labelled as stored records, never as live data.
    expect(screen.getByText('سجل مخزّن بالمنصة')).toBeTruthy();
  });

  it('shows an honest unavailable state when the store is not connected (503)', async () => {
    mockGetNotifications.mockResolvedValueOnce({
      data: [],
      error: 'الإشعارات غير متاحة',
      unavailable: true,
    });

    await renderScreen();

    await waitFor(() => expect(screen.getByText('هذه الخدمة غير متاحة حالياً')).toBeTruthy());
  });

  it('shows a genuine error state (not an empty list) when the fetch fails', async () => {
    mockGetNotifications.mockResolvedValueOnce({
      data: [],
      error: 'HTTP 500',
      unavailable: false,
    });

    await renderScreen();

    await waitFor(() => expect(screen.getByText('تعذّر تحميل البيانات')).toBeTruthy());
  });

  it('shows an honest empty state when there are no notifications', async () => {
    mockGetNotifications.mockResolvedValueOnce({ data: [], error: null, unavailable: false });

    await renderScreen();

    await waitFor(() => expect(screen.getByText('لا توجد إشعارات جديدة')).toBeTruthy());
  });
});
