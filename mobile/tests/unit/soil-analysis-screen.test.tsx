import React from 'react';
import { render, screen, waitFor, userEvent } from '@testing-library/react-native';
import { LanguageProvider } from '../../src/context/LanguageContext';
import { SoilAnalysisScreen } from '../../src/screens/services/SoilAnalysisScreen';

const mockAnalyzeSoil = jest.fn();

jest.mock('../../src/api/client', () => ({
  analyzeSoil: (...args: any[]) => mockAnalyzeSoil(...args),
}));

jest.mock('../../src/api/history', () => ({
  addHistoryEntry: jest.fn(async () => undefined),
}));

const renderScreen = () =>
  render(
    <LanguageProvider>
      <SoilAnalysisScreen onBack={() => {}} />
    </LanguageProvider>,
  );

const ruleBasedResult = {
  data: {
    grade: 'جيدة',
    gradeScore: 78,
    fertilityLevel: 'عالية',
    interpretationAr: 'تربة متوازنة',
    recommendations: ['حافظ على التسميد المتوازن'],
    problems: [],
    missingMeasurements: ['الملوحة (EC)'],
    findings: [],
    meta: { provenance: 'rule-based', isRealData: false, source: 'rule-based-engine' },
  },
  error: null,
};

describe('SoilAnalysisScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not invent a pH when the form is submitted empty', async () => {
    const user = userEvent.setup();
    await renderScreen();

    await user.press(screen.getByText('تحليل خصوبة التربة'));

    // The fabricated-value bug sent ph: 7 here; nothing must be sent.
    expect(mockAnalyzeSoil).not.toHaveBeenCalled();
    await waitFor(
      () =>
        expect(
          screen.getByText(
            'أدخل قياساً واحداً على الأقل من نتائج التحليل المخبري. الحقول الفارغة تُعامل كقياسات ناقصة ولا تُخترع لها قيم.',
          ),
        ).toBeTruthy(),
      { timeout: 5000 },
    );
  });

  it('sends only the measurements the user actually entered', async () => {
    const user = userEvent.setup();
    mockAnalyzeSoil.mockResolvedValue(ruleBasedResult);

    await renderScreen();

    const inputs = screen.getAllByPlaceholderText('—');
    // First input is pH.
    await user.type(inputs[0], '6.8');
    await user.press(screen.getByText('تحليل خصوبة التربة'));

    await waitFor(() => expect(mockAnalyzeSoil).toHaveBeenCalledTimes(1), { timeout: 5000 });
    const sent = mockAnalyzeSoil.mock.calls[0][0];
    expect(sent.ph).toBe(6.8);
    expect(sent.nitrogen).toBeUndefined();
    expect(sent.phosphorus).toBeUndefined();
    expect(sent.potassium).toBeUndefined();
    expect(sent.organicMatter).toBeUndefined();
    expect(sent.moisture).toBeUndefined();
  });

  it('shows the rule-based provenance label on a result, never a model claim', async () => {
    const user = userEvent.setup();
    mockAnalyzeSoil.mockResolvedValue(ruleBasedResult);

    await renderScreen();

    await user.type(screen.getAllByPlaceholderText('—')[0], '7.1');
    await user.press(screen.getByText('تحليل خصوبة التربة'));

    await waitFor(() => expect(mockAnalyzeSoil).toHaveBeenCalledTimes(1), { timeout: 5000 });
    // provenanceLabel('rule-based', 'ar') renders the honest expert-rules wording.
    await waitFor(() => expect(screen.getByText('نظام إرشادي (قواعد)')).toBeTruthy(), { timeout: 5000 });
  });
});
