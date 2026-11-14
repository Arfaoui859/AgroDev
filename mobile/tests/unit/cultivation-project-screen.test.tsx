import React from 'react';
import { render, screen, waitFor, userEvent } from '@testing-library/react-native';
import { LanguageProvider } from '../../src/context/LanguageContext';
import { CultivationProjectScreen } from '../../src/screens/services/CultivationProjectScreen';

const mockCreate = jest.fn();
const mockList = jest.fn();
const mockReports = jest.fn();
const mockReport = jest.fn();
const mockListings = jest.fn();

jest.mock('../../src/api/client', () => ({
  createCultivation: (...args: any[]) => mockCreate(...args),
  getCultivations: (...args: any[]) => mockList(...args),
  getSoilReports: (...args: any[]) => mockReports(...args),
  getSoilReport: (...args: any[]) => mockReport(...args),
  getMarketplaceListings: (...args: any[]) => mockListings(...args),
}));

const mockGetTaskState = jest.fn(async (_id: string) => ({}));
const mockSetTaskDone = jest.fn(async (_id: string, _task: string, _done: boolean) => ({}));
jest.mock('../../src/api/projectTasks', () => ({
  getTaskState: (...args: any[]) => mockGetTaskState(args[0]),
  setTaskDone: (...args: any[]) => mockSetTaskDone(args[0], args[1], args[2]),
}));

const selection = {
  cropId: 'c1',
  cropName: 'Olive',
  cropNameAr: 'زيتون',
  suitabilityScore: 82,
  farmId: '11111111-1111-1111-1111-111111111111',
  areaHectares: 2,
};

const renderScreen = (props: Partial<React.ComponentProps<typeof CultivationProjectScreen>> = {}) =>
  render(
    <LanguageProvider>
      <CultivationProjectScreen onBack={() => {}} selection={selection} {...props} />
    </LanguageProvider>,
  );

describe('CultivationProjectScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockList.mockResolvedValue({ data: [], error: null, meta: { provenance: 'database', isRealData: false } });
    mockReports.mockResolvedValue({ data: [], error: null, unavailable: false });
    mockListings.mockResolvedValue({
      data: { listings: [], meta: { provenance: 'unavailable', isRealData: false } },
      error: null,
      unavailable: true,
    });
  });

  it('confirms the chosen crop before creating the project', async () => {
    await renderScreen();
    // The crop name (Arabic) is shown for confirmation.
    expect(screen.getByText('زيتون')).toBeTruthy();
    // No project has been persisted yet.
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('persists the project and shows an honest generic checklist when no plot is linked', async () => {
    const user = userEvent.setup();
    mockCreate.mockResolvedValue({
      data: {
        id: 'cult-1',
        farm_id: selection.farmId,
        crop_name: 'زيتون',
        planting_date: '2026-01-01',
        area_hectares: 2,
        current_growth_stage: 'planned',
        status: 'active',
      },
      error: null,
    });

    await renderScreen();

    await user.press(screen.getByText('إنشاء المشروع'));

    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1), { timeout: 5000 });
    const payload = mockCreate.mock.calls[0][0];
    expect(payload.farm_id).toBe(selection.farmId);
    expect(payload.crop_name).toBe('زيتون');

    // Success card + the honest generic checklist (never an empty panel).
    await waitFor(() => expect(screen.getByText('تم إنشاء مشروعك الزراعي')).toBeTruthy(), { timeout: 5000 });
    expect(screen.getByText('جهّز التربة قبل الزراعة')).toBeTruthy();
  });

  it('surfaces the real server error instead of a false success', async () => {
    const user = userEvent.setup();
    mockCreate.mockResolvedValue({ data: null, error: 'مساحة الزراعة أكبر من المساحة المسجلة للمزرعة أو الحقل.' });

    await renderScreen();
    await user.press(screen.getByText('إنشاء المشروع'));

    await waitFor(
      () => expect(screen.getByText('مساحة الزراعة أكبر من المساحة المسجلة للمزرعة أو الحقل.')).toBeTruthy(),
      { timeout: 5000 },
    );
    expect(screen.queryByText('تم إنشاء مشروعك الزراعي')).toBeNull();
  });

  it('refuses to submit an invalid area', async () => {
    const user = userEvent.setup();
    await renderScreen({ selection: { ...selection, areaHectares: undefined } });

    const areaInput = screen.getByLabelText('المساحة (هكتار)');
    await user.clear(areaInput);
    await user.type(areaInput, '0');
    await user.press(screen.getByText('إنشاء المشروع'));

    await waitFor(() => expect(mockCreate).not.toHaveBeenCalled());
  });
});
