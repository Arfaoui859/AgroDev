import React from 'react';
import { render, screen, waitFor, userEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { LanguageProvider } from '../../src/context/LanguageContext';
import { AuthProvider } from '../../src/context/AuthContext';
import { FarmManagementScreen } from '../../src/screens/services/FarmManagementScreen';

const mockGetFarms = jest.fn();
const mockGetFields = jest.fn();
const mockCreateFarm = jest.fn();
const mockCreateField = jest.fn();

jest.mock('../../src/api/client', () => ({
  getFarms: (...args: any[]) => mockGetFarms(...args),
  getFields: (...args: any[]) => mockGetFields(...args),
  createFarm: (...args: any[]) => mockCreateFarm(...args),
  createField: (...args: any[]) => mockCreateField(...args),
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

const renderScreen = () =>
  render(
    <LanguageProvider>
      <AuthProvider>
        <FarmManagementScreen onBack={() => {}} />
      </AuthProvider>
    </LanguageProvider>,
  );

describe('FarmManagementScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('guides a new user to register a farm when none exists (no fabricated farm)', async () => {
    mockGetFarms.mockResolvedValue({ data: [], error: null, fromCache: false });
    mockGetFields.mockResolvedValue({ data: [], error: null, fromCache: false });

    await renderScreen();

    await waitFor(() => expect(screen.getByText('لا توجد مزرعة مسجّلة في حسابك')).toBeTruthy(), {
      timeout: 5000,
    });
  });

  it('creates a farm with the region the backend validates and adds it to the list', async () => {
    const user = userEvent.setup();
    mockGetFarms.mockResolvedValue({ data: [], error: null, fromCache: false });
    mockGetFields.mockResolvedValue({ data: [], error: null, fromCache: false });
    mockCreateFarm.mockResolvedValue({
      data: { id: 'f1', name: 'مزرعة النخيل', location: { region: 'قبلي وتوزر' }, size_hectares: 12 },
      error: null,
    });

    await renderScreen();
    await waitFor(() => expect(screen.getByText('+ تسجيل مزرعة جديدة')).toBeTruthy(), { timeout: 5000 });

    await user.press(screen.getByText('+ تسجيل مزرعة جديدة'));
    await waitFor(() => expect(screen.getByPlaceholderText('اسم المزرعة')).toBeTruthy(), { timeout: 5000 });

    await user.type(screen.getByPlaceholderText('اسم المزرعة'), 'مزرعة النخيل');
    await user.press(screen.getByText('قبلي وتوزر'));
    await user.type(screen.getByPlaceholderText('4.5'), '12');
    await user.press(screen.getByText('حفظ المزرعة في قاعدة البيانات'));

    await waitFor(() => expect(mockCreateFarm).toHaveBeenCalledTimes(1), { timeout: 5000 });
    // The backend (server/routes/field-management.ts) validates `region`, not `location`.
    expect(mockCreateFarm).toHaveBeenCalledWith({
      name: 'مزرعة النخيل',
      region: 'قبلي وتوزر',
      size_hectares: 12,
      soil_type: 'طينية خصبة',
    });
    await waitFor(() => expect(screen.getByText('مزرعة النخيل')).toBeTruthy(), { timeout: 5000 });
  });

  it('labels the persisted farm as a stored record, never as live data', async () => {
    mockGetFarms.mockResolvedValue({
      data: [
        {
          id: 'f1',
          name: 'مزرعة النخيل',
          name_ar: 'مزرعة النخيل',
          location: { region: 'قبلي وتوزر' },
          size_hectares: 12,
        },
      ],
      error: null,
      fromCache: false,
      meta: { provenance: 'database', isRealData: true, source: 'supabase.farms' },
    });
    mockGetFields.mockResolvedValue({ data: [], error: null, fromCache: false });

    await renderScreen();

    await waitFor(() => expect(screen.getByText('مزرعة النخيل')).toBeTruthy(), { timeout: 5000 });
    expect(screen.getByText('سجل مخزّن بالمنصة')).toBeTruthy();
  });

  it('does not call the API when required farm fields are missing', async () => {
    const user = userEvent.setup();
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockGetFarms.mockResolvedValue({ data: [], error: null, fromCache: false });
    mockGetFields.mockResolvedValue({ data: [], error: null, fromCache: false });

    await renderScreen();
    await waitFor(() => expect(screen.getByText('+ تسجيل مزرعة جديدة')).toBeTruthy(), { timeout: 5000 });

    await user.press(screen.getByText('+ تسجيل مزرعة جديدة'));
    await waitFor(
      () => expect(screen.getByText('حفظ المزرعة في قاعدة البيانات')).toBeTruthy(),
      { timeout: 5000 },
    );
    await user.press(screen.getByText('حفظ المزرعة في قاعدة البيانات'));

    await waitFor(() => expect(alertSpy).toHaveBeenCalled(), { timeout: 5000 });
    expect(mockCreateFarm).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });
});
