import React from 'react';
import { Alert } from 'react-native';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { LanguageProvider } from '../../src/context/LanguageContext';
import { RecentAnalysesScreen } from '../../src/screens/services/RecentAnalysesScreen';

const mockGetHistory = jest.fn();
const mockClearHistory = jest.fn();

jest.mock('../../src/api/history', () => ({
  getHistory: (...args: any[]) => mockGetHistory(...args),
  clearHistory: (...args: any[]) => mockClearHistory(...args),
}));

const RECORD = {
  id: 'h_1',
  type: 'soil' as const,
  title: 'تحليل التربة',
  date: '2026-11-12T09:00:00.000Z',
  summary: 'خصوبة متوسطة',
  badge: 'قواعد زراعية',
  badgeVariant: 'primary' as const,
};

const renderScreen = (props: Partial<React.ComponentProps<typeof RecentAnalysesScreen>> = {}) =>
  render(
    <LanguageProvider>
      <RecentAnalysesScreen onBack={jest.fn()} {...props} />
    </LanguageProvider>,
  );

describe('RecentAnalysesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows the honest empty state when nothing was recorded on the device', async () => {
    mockGetHistory.mockResolvedValueOnce([]);
    await renderScreen();
    await waitFor(() => expect(screen.getByText('لا يوجد سجل بعد')).toBeTruthy());
  });

  it('renders stored device-local records', async () => {
    mockGetHistory.mockResolvedValueOnce([RECORD]);
    await renderScreen();
    await waitFor(() => expect(screen.getByText('تحليل التربة')).toBeTruthy());
    expect(screen.getByText('خصوبة متوسطة')).toBeTruthy();
  });

  it('opens a detail sheet with a re-run action when a record is tapped', async () => {
    mockGetHistory.mockResolvedValueOnce([RECORD]);
    const onSelectAnalysis = jest.fn();
    await renderScreen({ onSelectAnalysis });

    await waitFor(() => expect(screen.getByText('تحليل التربة')).toBeTruthy());
    fireEvent.press(screen.getByText('تحليل التربة'));

    const runAgain = await screen.findByText('إعادة إجراء التحليل');
    fireEvent.press(runAgain);
    expect(onSelectAnalysis).toHaveBeenCalledWith(RECORD);
  });

  it('clears the device-local history after confirmation', async () => {
    mockGetHistory.mockResolvedValueOnce([RECORD]);
    mockClearHistory.mockResolvedValueOnce(undefined);
    const alertSpy = jest.spyOn(Alert, 'alert');

    await renderScreen();
    await waitFor(() => expect(screen.getByText('تحليل التربة')).toBeTruthy());

    fireEvent.press(screen.getByText('مسح السجل'));
    expect(alertSpy).toHaveBeenCalled();

    // Invoke the destructive button handler the dialog was configured with.
    const buttons = alertSpy.mock.calls[0][2] as any[];
    const destructive = buttons.find((b) => b.style === 'destructive');
    await destructive.onPress();

    await waitFor(() => expect(mockClearHistory).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByText('لا يوجد سجل بعد')).toBeTruthy());

    alertSpy.mockRestore();
  });
});
