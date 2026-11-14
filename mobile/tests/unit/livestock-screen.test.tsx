import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { LanguageProvider } from '../../src/context/LanguageContext';
import { AuthProvider } from '../../src/context/AuthContext';
import { LivestockScreen } from '../../src/screens/services/LivestockScreen';

const mockGetAnimals = jest.fn();

jest.mock('../../src/api/client', () => ({
  getAnimals: (...args: any[]) => mockGetAnimals(...args),
  apiRequest: jest.fn(async () => ({ data: { profile: { role: 'farmer' } }, error: null })),
}));

jest.mock('../../src/api/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(async () => ({
        data: { session: { user: { id: 'u1', email: 'farmer@example.tn', user_metadata: {} }, access_token: 't' } },
      })),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: jest.fn() } } }),
      signOut: jest.fn(async () => ({ error: null })),
    },
  },
  isSupabaseConfigured: true,
  supabaseHost: 'example.supabase.co',
}));

const renderScreen = () =>
  render(
    <LanguageProvider>
      <AuthProvider>
        <LivestockScreen onBack={() => {}} />
      </AuthProvider>
    </LanguageProvider>,
  );

describe('LivestockScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders persisted animals with their real health status', async () => {
    mockGetAnimals.mockResolvedValueOnce({
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
      error: null,
      unavailable: false,
      fromCache: false,
      meta: { provenance: 'database', isRealData: true, source: 'supabase.livestock_animals' },
    });

    await renderScreen();

    await waitFor(() => expect(screen.getByText('TN-001')).toBeTruthy(), { timeout: 5000 });
    expect(screen.getByText('جيدة')).toBeTruthy();
    // A persisted herd is shown as stored records, not as a prediction.
    expect(screen.getByText('سجل مخزّن بالمنصة')).toBeTruthy();
  });

  it('shows an honest unavailable state (not an invented herd) when the table is missing', async () => {
    mockGetAnimals.mockResolvedValueOnce({
      data: [],
      error: 'جداول الثروة الحيوانية غير موجودة.',
      unavailable: true,
      fromCache: false,
    });

    await renderScreen();

    await waitFor(
      () => expect(screen.getByText('جدول الثروة الحيوانية غير مهيّأ على الخادم')).toBeTruthy(),
      { timeout: 5000 },
    );
  });
});
