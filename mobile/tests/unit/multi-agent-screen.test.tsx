import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { LanguageProvider } from '../../src/context/LanguageContext';
import { MultiAgentAIScreen } from '../../src/screens/services/MultiAgentAIScreen';

const mockGetAICapabilities = jest.fn();

jest.mock('../../src/api/client', () => ({
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
      <MultiAgentAIScreen onBack={() => {}} />
    </LanguageProvider>,
  );

describe('MultiAgentAIScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows an honest empty state when the server declares no capabilities', async () => {
    mockGetAICapabilities.mockResolvedValueOnce({ data: { capabilities: [] }, error: null, fromCache: false });

    await renderScreen();

    await waitFor(() =>
      expect(
        screen.getByText('لم يعلن الخادم عن أي قدرة ذكاء اصطناعي متاحة حالياً. لن يعرض التطبيق أي قدرة وهمية.'),
      ).toBeTruthy(),
    );
  });

  it('renders the real engine provenance the server declares for each capability', async () => {
    mockGetAICapabilities.mockResolvedValueOnce({
      data: {
        capabilities: [
          {
            id: 'soil-analysis',
            name: 'Soil Analysis',
            nameAr: 'تحليل التربة',
            available: true,
            engine: 'rule-based',
            provenance: 'Rule-based agronomic engine (not a trained model).',
            provenanceAr: 'محرك قواعد زراعية وليس نموذجاً مدرّباً.',
            isRealData: false,
          },
        ],
      },
      error: null,
      fromCache: false,
    });

    await renderScreen();

    await waitFor(() => expect(screen.getByText('تحليل التربة')).toBeTruthy());
    expect(screen.getByText('محرك قواعد زراعية وليس نموذجاً مدرّباً.')).toBeTruthy();
  });

  it('shows a retryable error state when capability discovery fails', async () => {
    mockGetAICapabilities.mockResolvedValueOnce({ data: null, error: 'الخدمة غير متاحة حالياً على الخادم', fromCache: false });

    await renderScreen();

    await waitFor(() => expect(screen.getByText('تعذّر تحميل البيانات')).toBeTruthy());
    expect(screen.getByText('إعادة المحاولة')).toBeTruthy();
  });
});
