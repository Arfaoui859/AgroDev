import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { LanguageProvider } from '../../src/context/LanguageContext';
import { LimitationsNotice } from '../../src/components/ui/LimitationsNotice';

const wrap = (ui: React.ReactElement) => render(<LanguageProvider>{ui}</LanguageProvider>);

/**
 * LimitationsNotice is the honesty callout under image-based results. It must
 * render both the title and the full body text — never one without the other —
 * so the "indicative, confirm before treating" caveat is always visible.
 */
describe('LimitationsNotice', () => {
  it('renders the title and the body text', async () => {
    await wrap(<LimitationsNotice title="حدود الاستخدام" text="النتيجة إرشادية." />);
    expect(screen.getByText('حدود الاستخدام')).toBeTruthy();
    expect(screen.getByText('النتيجة إرشادية.')).toBeTruthy();
  });
});
