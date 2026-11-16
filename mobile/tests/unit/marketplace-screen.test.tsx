import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { LanguageProvider } from '../../src/context/LanguageContext';
import { MarketplaceScreen } from '../../src/screens/MarketplaceScreen';

const mockGetMarketPrices = jest.fn();
const mockGetMarketplaceListings = jest.fn();
const mockGetAICapabilities = jest.fn();

jest.mock('../../src/api/client', () => ({
  getMarketPrices: (...args: any[]) => mockGetMarketPrices(...args),
  getMarketplaceListings: (...args: any[]) => mockGetMarketplaceListings(...args),
  getAICapabilities: (...args: any[]) => mockGetAICapabilities(...args),
  capabilityMap: (payload: any) => {
    const map: Record<string, any> = {};
    for (const cap of payload?.capabilities ?? []) map[cap.id] = cap;
    return map;
  },
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
    mockGetMarketplaceListings.mockResolvedValue({ data: { listings: [], meta: { provenance: 'unavailable', isRealData: false } }, error: 'not connected', unavailable: true });
    mockGetAICapabilities.mockResolvedValue({
      data: {
        capabilities: [
          { id: 'market-forecast', name: 'Market Forecast', nameAr: 'توقّع السوق', engine: 'unavailable', provenance: 'n/a', provenanceAr: 'غير متاح' },
          { id: 'supply-demand', name: 'Supply Demand', nameAr: 'العرض والطلب', engine: 'unavailable', provenance: 'n/a', provenanceAr: 'غير متاح' },
        ],
      },
      error: null,
    });
  });

  it('recovers from a rejected market request instead of keeping the loading state forever', async () => {
    mockGetMarketPrices.mockRejectedValueOnce(new Error('network offline'));

    await renderScreen();

    await waitFor(() => expect(screen.getByText('network offline')).toBeTruthy());
  });

  it('keeps market prices visible when seller listings fail independently', async () => {
    mockGetMarketPrices.mockResolvedValueOnce({
      data: {
        prices: [
          {
            id: 'olive-independent',
            cropName: 'Olive',
            cropNameAr: 'زيتون',
            pricePerKg: 3.2,
            previousPricePerKg: null,
            changePercent: null,
            trend: 'unknown',
            marketLocation: 'Sfax',
            marketLocationAr: 'صفاقس',
            qualityGrade: '—',
            lastUpdated: '2026-11-16',
          },
        ],
        meta: { provenance: 'database', isRealData: false },
      },
      error: null,
      fromCache: false,
    });
    mockGetMarketplaceListings.mockRejectedValueOnce(new Error('seller store unavailable'));

    await renderScreen();

    await waitFor(() => expect(screen.getByText('زيتون')).toBeTruthy());
    expect(screen.getByText('العروض غير متاحة حالياً')).toBeTruthy();
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

  it('states clearly that buying and selling listings are not connected yet', async () => {
    mockGetMarketPrices.mockResolvedValueOnce({
      data: { prices: [], meta: { provenance: 'unavailable', isRealData: false } },
      error: null,
      fromCache: false,
    });
    mockGetMarketplaceListings.mockResolvedValueOnce({
      data: { listings: [], meta: { provenance: 'unavailable', isRealData: false } },
      error: 'MARKETPLACE_STORE_NOT_CONNECTED',
      unavailable: true,
    });

    await renderScreen();

    await waitFor(() => expect(screen.getByText('العروض غير متاحة حالياً')).toBeTruthy());
    expect(screen.getByText(/لم تُربط بعد بقاعدة بيانات البائعين/)).toBeTruthy();
  });

  it('surfaces forecast and supply/demand as unavailable instead of inventing them', async () => {
    mockGetMarketPrices.mockResolvedValueOnce({
      data: { prices: [], meta: { provenance: 'unavailable', isRealData: false } },
      error: null,
      fromCache: false,
    });

    await renderScreen();

    await waitFor(() => expect(screen.getByText('ذكاء السوق')).toBeTruthy());
    expect(screen.getByText('توقّع الأسعار')).toBeTruthy();
    expect(screen.getByText('العرض والطلب')).toBeTruthy();
    // Both capabilities are honestly unavailable in the capability document.
    expect(screen.getAllByText('غير مُهيّأ').length).toBe(2);
  });
});
