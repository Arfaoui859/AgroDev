import React from 'react';
import { render, screen, waitFor, userEvent } from '@testing-library/react-native';
import { LanguageProvider } from '../../src/context/LanguageContext';
import { CropRecommendationScreen } from '../../src/screens/services/CropRecommendationScreen';

const mockGetField = jest.fn();
const mockGetCrop = jest.fn();

jest.mock('../../src/api/client', () => ({
  getFieldCropRecommendations: (...args: any[]) => mockGetField(...args),
  getCropRecommendations: (...args: any[]) => mockGetCrop(...args),
}));

jest.mock('../../src/api/history', () => ({ addHistoryEntry: jest.fn(async () => undefined) }));

const renderScreen = (props: Partial<React.ComponentProps<typeof CropRecommendationScreen>> = {}) =>
  render(
    <LanguageProvider>
      <CropRecommendationScreen onBack={() => {}} {...props} />
    </LanguageProvider>,
  );

describe('CropRecommendationScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('auto-runs the plot path from a handed-over context and never asks the user to re-enter soil', async () => {
    mockGetField.mockResolvedValue({
      data: {
        recommendations: [
          {
            cropId: 'c1',
            cropName: 'Olive',
            cropNameAr: 'زيتون',
            suitabilityScore: 82,
            reasons: ['مناسب للتربة'],
            waterNeed: 'low',
            plantingSeason: 'autumn',
            daysToMaturity: 365,
            recommendations: '',
          },
        ],
        meta: { provenance: 'rule-based', isRealData: false, source: 'rule-based-engine' },
      },
      error: null,
      requiresSoilData: false,
    });

    await renderScreen({ initialContext: { fieldId: 'field-1', soil: { ph: 7 } } });

    await waitFor(() => expect(mockGetField).toHaveBeenCalledWith('field-1'), { timeout: 5000 });
    // The manual-entry card is absent when a context is provided.
    expect(screen.queryByText('احسب الأنسب لمزرعتك')).toBeNull();
    await waitFor(() => expect(screen.getByText('زيتون')).toBeTruthy(), { timeout: 5000 });
    expect(mockGetCrop).not.toHaveBeenCalled();
  });

  it('shows an honest "saved analysis required" state on a 409 instead of inventing a result', async () => {
    mockGetField.mockResolvedValue({ data: null, error: 'يلزم تحليل تربة محفوظ لهذه القطعة قبل التوصيات.', requiresSoilData: true });

    await renderScreen({ initialContext: { fieldId: 'field-2', soil: {} } });

    await waitFor(() => expect(mockGetField).toHaveBeenCalledTimes(1), { timeout: 5000 });
    await waitFor(
      () =>
        expect(
          screen.getByText(
            'لا يوجد تحليل تربة محفوظ لهذه القطعة بعد. أنجز تحليل التربة أولاً لتظهر التوصيات المرتبطة بالقطعة.',
          ),
        ).toBeTruthy(),
      { timeout: 5000 },
    );
  });

  it('offers manual measurement entry when no context is provided', async () => {
    const user = userEvent.setup();
    mockGetCrop.mockResolvedValue({
      data: {
        crops: [
          {
            id: 'c1',
            name: 'Wheat',
            nameAr: 'قمح',
            category: 'cereal',
            suitabilityScore: 70,
            season: 'winter',
            waterRequirement: 'medium',
            estimatedProfitTndPerHa: 0,
            growthCycleDays: 120,
            keyTipsAr: 'أفضل زراعته في الخريف',
          },
        ],
        meta: { provenance: 'rule-based', isRealData: false, source: 'rule-based-engine' },
      },
      error: null,
    });

    await renderScreen();
    // The manual card is present.
    expect(screen.getByText('قيّم محصولاً تريد زراعته')).toBeTruthy();
    await user.press(screen.getByText('احسب المحاصيل المناسبة'));
    await waitFor(() => expect(mockGetCrop).toHaveBeenCalledTimes(1), { timeout: 5000 });
    await waitFor(() => expect(screen.getByText('قمح')).toBeTruthy(), { timeout: 5000 });
  });
});
