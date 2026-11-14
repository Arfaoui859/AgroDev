import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { StateView } from '../../src/components/ui/StateView';
import { LanguageProvider } from '../../src/context/LanguageContext';

const renderView = (ui: React.ReactElement) => render(<LanguageProvider>{ui}</LanguageProvider>);

describe('StateView', () => {
  it('renders a loading spinner with its title', async () => {
    await renderView(<StateView kind="loading" title="جارٍ التحميل" />);
    expect(screen.getByText('جارٍ التحميل')).toBeTruthy();
  });

  it('renders an offline state with a working retry action', async () => {
    const onRetry = jest.fn();
    await renderView(<StateView kind="offline" title="أنت غير متصل" onRetry={onRetry} />);
    fireEvent.press(screen.getByText('إعادة المحاولة'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('hides the retry button while loading', async () => {
    await renderView(<StateView kind="loading" onRetry={jest.fn()} />);
    expect(screen.queryByText('إعادة المحاولة')).toBeNull();
  });

  it('honours a caller-supplied retry label over the default', async () => {
    await renderView(<StateView kind="error" onRetry={jest.fn()} retryLabel="أعد" />);
    expect(screen.getByText('أعد')).toBeTruthy();
  });
});
