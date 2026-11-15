import React from 'react';
import { render, screen, waitFor, userEvent } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LanguageProvider } from '../../src/context/LanguageContext';
import { ProjectsScreen } from '../../src/screens/services/ProjectsScreen';

const mockGetCultivations = jest.fn();
const mockGetTasks = jest.fn();
const mockCreateTask = jest.fn();
const mockUpdateTask = jest.fn();
const mockGetSummary = jest.fn();
const mockCreateExpense = jest.fn();
const mockCreateRevenue = jest.fn();

jest.mock('../../src/api/client', () => ({
  getCultivations: (...args: any[]) => mockGetCultivations(...args),
  getProjectTasks: (...args: any[]) => mockGetTasks(...args),
  createProjectTask: (...args: any[]) => mockCreateTask(...args),
  updateProjectTask: (...args: any[]) => mockUpdateTask(...args),
  getProjectFinancialSummary: (...args: any[]) => mockGetSummary(...args),
  createProjectExpense: (...args: any[]) => mockCreateExpense(...args),
  createProjectRevenue: (...args: any[]) => mockCreateRevenue(...args),
}));

const project = {
  id: 'p1',
  farm_id: '11111111-1111-1111-1111-111111111111',
  section_id: null,
  crop_name: 'Olive',
  crop_variety: null,
  planting_date: '2026-10-01',
  expected_harvest_date: '2027-09-01',
  area_hectares: 2,
  current_growth_stage: 'vegetative',
  status: 'active',
  created_at: '2026-10-01T00:00:00Z',
};

const renderScreen = (props: Partial<React.ComponentProps<typeof ProjectsScreen>> = {}) =>
  render(
    <LanguageProvider>
      <ProjectsScreen onBack={() => {}} {...props} />
    </LanguageProvider>,
  );

describe('ProjectsScreen', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    // The default UI language is Arabic; seed English so the assertions can
    // match the authored English copy.
    await AsyncStorage.setItem('agrogrowth.language', 'en');
    mockGetCultivations.mockResolvedValue({
      data: [project],
      error: null,
      meta: { provenance: 'database', isRealData: false },
    });
    mockGetTasks.mockResolvedValue({
      data: [],
      error: null,
      roleBlocked: false,
      meta: { provenance: 'database', isRealData: false },
    });
    mockGetSummary.mockResolvedValue({
      data: { totalExpenses: 0, grossRevenue: 0, salesCosts: 0, totalRevenue: 0, netProfit: 0, categoryBreakdown: {}, expenseCount: 0, revenueCount: 0 },
      error: null,
      roleBlocked: false,
      meta: { provenance: 'database', isRealData: false },
    });
  });

  it('lists the persisted projects and shows the honest empty state when there are none', async () => {
    await renderScreen();
    await waitFor(() => expect(mockGetCultivations).toHaveBeenCalled());
    expect(await screen.findByText('Olive')).toBeTruthy();
    expect(screen.queryByText('No projects yet')).toBeNull();
  });

  it('renders an honest empty state with no invented projects', async () => {
    mockGetCultivations.mockResolvedValueOnce({ data: [], error: null, meta: { provenance: 'database', isRealData: false } });
    await renderScreen();
    expect(await screen.findByText('No projects yet')).toBeTruthy();
  });

  it('opens the server-backed tracker and finance panels for a selected project', async () => {
    const user = userEvent.setup();
    await renderScreen();
    const card = await screen.findByText('Olive');
    await user.press(card);
    await waitFor(() => expect(mockGetTasks).toHaveBeenCalledWith({ farmId: project.farm_id }));
    expect(mockGetSummary).toHaveBeenCalled();
    expect(await screen.findByText('Daily tracking')).toBeTruthy();
    expect(await screen.findByText('Financial result')).toBeTruthy();
  });

  it('explains a farmer-role restriction instead of showing a red failure', async () => {
    mockGetTasks.mockResolvedValueOnce({
      data: [],
      error: null,
      roleBlocked: true,
      meta: { provenance: 'unavailable', isRealData: false },
    });
    const user = userEvent.setup();
    await renderScreen();
    await user.press(await screen.findByText('Olive'));
    expect(await screen.findByText('Not available for this account')).toBeTruthy();
  });

  it('shows a retryable error state when the project list fails', async () => {
    mockGetCultivations.mockResolvedValueOnce({ data: [], error: 'boom', meta: { provenance: 'unavailable', isRealData: false } });
    await renderScreen();
    expect(await screen.findByText('boom')).toBeTruthy();
  });
});
