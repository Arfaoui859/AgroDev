import React from 'react';
import { render, screen, waitFor, userEvent } from '@testing-library/react-native';
import { LanguageProvider } from '../../src/context/LanguageContext';
import { SoilAnalysisScreen } from '../../src/screens/services/SoilAnalysisScreen';

const mockAnalyzeSoil = jest.fn();
const mockAnalyzeSoilDetailed = jest.fn();
const mockGetFarms = jest.fn();

jest.mock('../../src/api/client', () => ({
  analyzeSoil: (...args: any[]) => mockAnalyzeSoil(...args),
  analyzeSoilDetailed: (...args: any[]) => mockAnalyzeSoilDetailed(...args),
  getFarms: (...args: any[]) => mockGetFarms(...args),
  getFields: jest.fn(async () => ({ data: [], error: null })),
  createFarm: jest.fn(),
  createField: jest.fn(),
}));

jest.mock('../../src/api/history', () => ({
  addHistoryEntry: jest.fn(async () => undefined),
}));

jest.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true }),
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

const sampleReport = {
  schemaVersion: '2.0',
  reportLanguage: 'ar',
  executiveSummary: 'ملخص تنفيذي مبني على القياسات المدخلة.',
  dataQuality: {
    providedMeasurements: [{ name: 'pH', value: 7.1, unit: 'unitless', source: 'user-entered-unverified' }],
    missingMeasurements: ['الملوحة'],
    limitations: [],
    consistencyChecks: [],
  },
  indicatorTable: [],
  soilCharacterization: { texture: { classification: 'غير محددة', basis: 'لم تُدخل تركيبة' }, chemical: [], physical: [] },
  findings: [],
  rankedConstraints: [],
  strengths: [],
  constraints: [],
  cropSuitability: { candidates: [], avoid: [], caveats: [] },
  targetCropPlan: null,
  fertilizationPlan: { stages: [], organicOptions: [], withheldDosesReason: 'لا تتوفر كل المدخلات.' },
  waterAndIrrigation: { limitations: [] },
  twelveWeekCalendar: [],
  riskAlerts: [],
  recommendations: [],
  followUpPlan: [],
  additionalInformationNeeded: [],
  professionalReview: { needed: true, reason: 'يُستحسن مراجعة مهندس زراعي.', bringToAgronomist: [] },
  disclaimers: ['توصية آلية.'],
  confidence: { level: 'moderate', reasons: [] },
};

describe('SoilAnalysisScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetFarms.mockResolvedValue({ data: [{ id: 'f1', name: 'مزرعة الاختبار', size_hectares: 3, location: { region: 'القيروان' } }], error: null });
  });

  it('never submits an empty measurement set (no invented pH)', async () => {
    const user = userEvent.setup();
    mockAnalyzeSoilDetailed.mockResolvedValue({ data: null, error: null, unavailable: true });
    mockAnalyzeSoil.mockResolvedValue(ruleBasedResult);

    await renderScreen();
    // Select the farm, advance to measurements.
    await user.press(await screen.findByText('مزرعة الاختبار'));
    await user.press(screen.getByText('التالي'));
    await user.press(screen.getByText('تحليل خصوبة التربة'));

    expect(mockAnalyzeSoilDetailed).not.toHaveBeenCalled();
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

  it('sends only the measurements the user entered to the detailed endpoint', async () => {
    const user = userEvent.setup();
    mockAnalyzeSoilDetailed.mockResolvedValue({
      data: {
        report: sampleReport,
        meta: { provenance: 'llm', isRealData: false, source: 'ai-advisory' },
        persisted: true,
      },
      error: null,
      unavailable: false,
    });

    await renderScreen();
    await user.press(await screen.findByText('مزرعة الاختبار'));
    await user.press(screen.getByText('التالي'));

    await user.type(screen.getAllByPlaceholderText('—')[0], '7.1');
    await user.press(screen.getByText('تحليل خصوبة التربة'));

    await waitFor(() => expect(mockAnalyzeSoilDetailed).toHaveBeenCalledTimes(1), { timeout: 5000 });
    const sent = mockAnalyzeSoilDetailed.mock.calls[0][0];
    expect(sent.ph).toBe(7.1);
    expect(sent.nitrogen).toBeUndefined();
    expect(sent.moisture).toBeUndefined();
    expect(mockAnalyzeSoil).not.toHaveBeenCalled();
  });

  it('falls back to the rule-based engine, labelled honestly, when the advisory is unavailable', async () => {
    const user = userEvent.setup();
    mockAnalyzeSoilDetailed.mockResolvedValue({ data: null, error: null, unavailable: true });
    mockAnalyzeSoil.mockResolvedValue(ruleBasedResult);

    await renderScreen();
    await user.press(await screen.findByText('مزرعة الاختبار'));
    await user.press(screen.getByText('التالي'));
    await user.type(screen.getAllByPlaceholderText('—')[0], '6.8');
    await user.press(screen.getByText('تحليل خصوبة التربة'));

    await waitFor(() => expect(mockAnalyzeSoil).toHaveBeenCalledTimes(1), { timeout: 5000 });
    await waitFor(() => expect(screen.getByText('نظام إرشادي (قواعد)')).toBeTruthy(), { timeout: 5000 });
  });

  it('surfaces a validation error from the detailed endpoint instead of silently degrading', async () => {
    const user = userEvent.setup();
    mockAnalyzeSoilDetailed.mockResolvedValue({
      data: null,
      error: 'pH must be between 0 and 14',
      unavailable: false,
    });

    await renderScreen();
    await user.press(await screen.findByText('مزرعة الاختبار'));
    await user.press(screen.getByText('التالي'));
    await user.type(screen.getAllByPlaceholderText('—')[0], '7.1');
    await user.press(screen.getByText('تحليل خصوبة التربة'));

    await waitFor(() => expect(screen.getByText('pH must be between 0 and 14')).toBeTruthy(), { timeout: 5000 });
    expect(mockAnalyzeSoil).not.toHaveBeenCalled();
  });
});
