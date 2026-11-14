import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { LanguageProvider } from '../../src/context/LanguageContext';
import { AgriNewsScreen } from '../../src/screens/services/AgriNewsScreen';

const mockGetAgriNews = jest.fn();

jest.mock('../../src/api/client', () => ({
  getAgriNews: (...args: any[]) => mockGetAgriNews(...args),
}));

const renderScreen = () =>
  render(
    <LanguageProvider>
      <AgriNewsScreen onBack={() => {}} />
    </LanguageProvider>,
  );

describe('AgriNewsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders real headlines with publisher attribution', async () => {
    mockGetAgriNews.mockResolvedValueOnce({
      data: {
        articles: [
          {
            id: 'a1',
            title: 'موسم الزيتون يبدأ قريباً',
            link: 'https://example.tn/a',
            publishedAt: '2026-11-12T08:00:00.000Z',
            summary: 'ملخص الخبر',
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
        sources: [],
        categories: ['olive & huile'],
        generatedAt: '2026-11-13T00:00:00.000Z',
        meta: { provenance: 'live-observation', isRealData: true, source: 'rss-feeds' },
      },
      error: null,
      fromCache: false,
    });

    await renderScreen();

    await waitFor(() => expect(screen.getByText('موسم الزيتون يبدأ قريباً')).toBeTruthy(), { timeout: 5000 });
    expect(screen.getByText('La Presse de Tunisie')).toBeTruthy();
  });

  it('shows an honest empty state when no article matches (never fabricates)', async () => {
    mockGetAgriNews.mockResolvedValueOnce({
      data: {
        articles: [],
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 1,
        sources: [],
        categories: [],
        generatedAt: '2026-11-13T00:00:00.000Z',
        meta: { provenance: 'live-observation', isRealData: true, source: 'rss-feeds' },
      },
      error: null,
      fromCache: false,
    });

    await renderScreen();

    await waitFor(() => expect(screen.getByText('لا توجد أخبار مطابقة')).toBeTruthy(), { timeout: 5000 });
  });

  it('shows an error state when the feed aggregation fails', async () => {
    mockGetAgriNews.mockResolvedValueOnce({
      data: null,
      error: 'تعذّر جلب الأخبار الزراعية',
      fromCache: false,
    });

    await renderScreen();

    await waitFor(() => expect(screen.getByText('تعذّر تحميل البيانات')).toBeTruthy(), { timeout: 5000 });
  });
});
