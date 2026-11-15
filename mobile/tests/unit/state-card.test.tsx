import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { LanguageProvider } from '../../src/context/LanguageContext';
import { StateCard } from '../../src/components/ui/StateCard';

const wrap = (ui: React.ReactElement) => render(<LanguageProvider>{ui}</LanguageProvider>);

/**
 * StateCard is the card-framed loading/empty/error panel used by the data-driven
 * screens. It must forward the state props to StateView (title, message, retry
 * action) so wrapping a panel in a card never drops the honest copy or the
 * retry affordance.
 */
describe('StateCard', () => {
  it('renders the state title and message', async () => {
    await wrap(<StateCard kind="empty" title="لا توجد بيانات" message="جرّب لاحقاً" />);
    expect(screen.getByText('لا توجد بيانات')).toBeTruthy();
    expect(screen.getByText('جرّب لاحقاً')).toBeTruthy();
  });

  it('renders a retry action when onRetry is given', async () => {
    const onRetry = jest.fn();
    await wrap(<StateCard kind="error" title="خطأ" message="تعذر الاتصال" onRetry={onRetry} retryLabel="إعادة المحاولة" />);
    expect(screen.getByText('إعادة المحاولة')).toBeTruthy();
  });
});
