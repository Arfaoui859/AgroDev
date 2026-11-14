import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { LanguageProvider } from '../../src/context/LanguageContext';
import { AuthProvider } from '../../src/context/AuthContext';
import { ProfileScreen } from '../../src/screens/ProfileScreen';

jest.mock('../../src/api/client', () => ({
  apiRequest: jest.fn(async () => ({
    data: { profile: { role: 'farmer', full_name: 'Farmer Test' } },
    error: null,
    isOnline: true,
  })),
  getApiBaseUrl: () => 'http://localhost:5000',
}));

jest.mock('../../src/api/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(async () => ({
        data: {
          session: {
            user: { id: 'u1', email: 'farmer@example.tn', user_metadata: { role: 'farmer' } },
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

jest.mock('../../src/api/cache', () => ({
  clearCache: jest.fn(async () => undefined),
  setCacheNamespace: jest.fn(),
  namespaceUserId: jest.fn(() => null),
}));

const renderScreen = () =>
  render(
    <LanguageProvider>
      <AuthProvider>
        <ProfileScreen />
      </AuthProvider>
    </LanguageProvider>,
  );

describe('ProfileScreen', () => {
  it('shows the account role as an identity badge without an inline role switcher', async () => {
    await renderScreen();

    // The role is still surfaced (as a read-only identity badge)…
    expect(await screen.findByText('فلاح / مزارع')).toBeTruthy();
    // …but the "switch role" grid from the demo build is gone.
    expect(screen.queryByText('تفضيل الدور في الواجهة')).toBeNull();
    expect(screen.queryByText('بستاني')).toBeNull();
  });

  it('does not expose any role selector or persona button on Profile', async () => {
    await renderScreen();
    // The onboarding flow owns role selection; Profile must not duplicate it.
    expect(screen.queryByText('تخصيص التجربة (Persona)')).toBeNull();
    expect(screen.queryByText('اختر دورك')).toBeNull();
  });
});
