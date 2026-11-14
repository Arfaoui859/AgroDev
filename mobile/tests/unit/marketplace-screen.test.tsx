import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { LanguageProvider } from '../../src/context/LanguageContext';
import { MarketplaceScreen } from '../../src/screens/MarketplaceScreen';

const mockGetMarketPrices = jest.fn();

jest.mock('../../src/api/client', () => ({
  getMarketPrices: (...args: any[]) => mockGetMarketPrices(...args),
}));

const renderScreen = () =>
  render(
    <LanguageProvider>
      <MarketplaceScreen />
    </LanguageProvider>,
  );

describe('MarketplaceScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows an honest empty state when the platform has no recorded prices', async () => {
    mockGetMarketPrices.mockResolvedValueOnce({
      data: { prices: [], meta: { provenance: 'unavailable', isRealData: false } },
      error: null,
      fromCache: false,
    });

    await renderScreen();

    await waitFor(() => expect(screen.getByText('لا توجد أسعار مسجّلة حالياً في قاعدة بيانات المنصة.')).toBeTruthy());
  });

  it('shows a distinct empty state when a search matches no recorded crop', async () => {
    mockGetMarketPrices.mockResolvedValueOnce({
      data: {
        prices: [
          {
            id: 'c1',
            cropName: 'Olive',
            cropNameAr: 'زيتون',
            pricePerKg: 3.2,
            previousPricePerKg: null,
            changePercent: null,
            trend: 'unknown',
            marketLocation: 'Sfax',
            marketLocationAr: 'Sfax',
            qualityGrade: '—',
            lastUpdated: '2026-11-10',
          },
        ],
        meta: { provenance: 'database', isRealData: false },
      },
      error: null,
      fromCache: false,
    });

    await renderScreen();
    await waitFor(() => expect(screen.getByText('زيتون')).toBeTruthy());

    fireEvent.changeText(screen.getByPlaceholderText('ابحث عن محصول (زيتون، قمح، طماطم...)'), 'zzz');
    await waitFor(() => expect(screen.getByText('لا يوجد محصول مطابق لبحثك.')).toBeTruthy());
  });

  it('never renders a fabricated trend for a stored record', async () => {
    mockGetMarketPrices.mockResolvedValueOnce({
      data: {
        prices: [
          {
            id: 'c1',
            cropName: 'Olive',
            cropNameAr: 'زيتون',
            pricePerKg: 3.2,
            previousPricePerKg: null,
            changePercent: null,
            trend: 'unknown',
            marketLocation: 'Sfax',
            marketLocationAr: 'Sfax',
            qualityGrade: '—',
            lastUpdated: '2026-11-10',
          },
        ],
        meta: { provenance: 'database', isRealData: false },
      },
      error: null,
      fromCache: false,
    });

    await renderScreen();
    await waitFor(() => expect(screen.getByText('زيتون')).toBeTruthy());

    // The backend supplies no changePercent, so no +/- percentage may appear.
    expect(screen.queryByText(/%/)).toBeNull();
  });
});
