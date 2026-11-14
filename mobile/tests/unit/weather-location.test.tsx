import React from 'react';
import { render, screen, waitFor, userEvent } from '@testing-library/react-native';
import { LanguageProvider } from '../../src/context/LanguageContext';
import { WeatherDetailScreen } from '../../src/screens/services/WeatherDetailScreen';

const mockGetWeather = jest.fn();

jest.mock('../../src/api/client', () => ({
  getWeather: (...args: any[]) => mockGetWeather(...args),
}));

const mockRequestForegroundPermissions = jest.fn();
const mockGetCurrentPosition = jest.fn();
jest.mock('expo-location', () => ({
  Accuracy: { Balanced: 3 },
  requestForegroundPermissionsAsync: () => mockRequestForegroundPermissions(),
  getCurrentPositionAsync: () => mockGetCurrentPosition(),
}));

jest.mock('../../src/hooks/useConnectivity', () => ({
  useConnectivity: () => ({ isOnline: true }),
}));

const weatherData = {
  temperature: 24,
  humidity: 55,
  rainfall_mm: 0,
  wind_speed: 12,
  condition_ar: 'صافٍ',
  icon: 'sunny',
  governorate: 'Tunis',
  advice_ar: 'x',
  advice_fr: 'x',
  advice_en: 'x',
  forecast: [],
  meta: { provenance: 'live-observation' as const, isRealData: true },
};

const renderScreen = () =>
  render(
    <LanguageProvider>
      <WeatherDetailScreen onBack={jest.fn()} />
    </LanguageProvider>,
  );

describe('WeatherDetailScreen location flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetWeather.mockResolvedValue({ data: weatherData, error: null, fromCache: false });
    mockRequestForegroundPermissions.mockResolvedValue({ status: 'granted' });
    mockGetCurrentPosition.mockResolvedValue({ coords: { latitude: 36.5, longitude: 10.2 } });
  });

  it('requests the real observation for the device coordinates when granted', async () => {
    const user = userEvent.setup();
    await renderScreen();

    // Initial governorate load happens on mount.
    await waitFor(() => expect(mockGetWeather).toHaveBeenCalledTimes(1));

    await user.press(screen.getByTestId('weather-use-location'));

    await waitFor(() =>
      expect(mockGetWeather).toHaveBeenCalledWith(36.5, 10.2, 'موقعي الحالي'),
    );
    expect(mockGetCurrentPosition).toHaveBeenCalledTimes(1);
  });

  it('shows an honest notice and does not query when permission is denied', async () => {
    const user = userEvent.setup();
    mockRequestForegroundPermissions.mockResolvedValue({ status: 'denied' });
    await renderScreen();
    await waitFor(() => expect(mockGetWeather).toHaveBeenCalledTimes(1));

    await user.press(screen.getByTestId('weather-use-location'));

    await waitFor(() =>
      expect(screen.getByText('تم رفض إذن الموقع. اختر ولاية من القائمة.')).toBeTruthy(),
    );
    expect(mockGetCurrentPosition).not.toHaveBeenCalled();
    expect(mockGetWeather).toHaveBeenCalledTimes(1);
  });

  it('surfaces a failure notice when position lookup throws', async () => {
    const user = userEvent.setup();
    mockGetCurrentPosition.mockRejectedValue(new Error('no fix'));
    await renderScreen();
    await waitFor(() => expect(mockGetWeather).toHaveBeenCalledTimes(1));

    await user.press(screen.getByTestId('weather-use-location'));

    await waitFor(() =>
      expect(screen.getByText('تعذّر تحديد الموقع. اختر ولاية من القائمة.')).toBeTruthy(),
    );
  });
});
