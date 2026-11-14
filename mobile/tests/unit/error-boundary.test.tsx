import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { LanguageProvider } from '../../src/context/LanguageContext';
import { ErrorBoundary } from '../../src/components/ui/ErrorBoundary';
import { getExtra } from '../../src/i18n/extra';

// A child whose crash can be switched off, so retry has something healthy to
// remount. `crash` is read on every render.
const Boom: React.FC<{ crash: () => boolean }> = ({ crash }) => {
  if (crash()) throw new Error('kaboom');
  return <Text>safe content</Text>;
};

let consoleError: jest.SpyInstance;
let consoleWarn: jest.SpyInstance;
beforeEach(() => {
  consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  consoleError.mockRestore();
  consoleWarn.mockRestore();
});

const tree = (language: 'ar' | 'en' | 'fr', crash: () => boolean) => (
  <LanguageProvider>
    <ErrorBoundary language={language}>
      <Boom crash={crash} />
    </ErrorBoundary>
  </LanguageProvider>
);

describe('ErrorBoundary', () => {
  it('renders children when nothing throws', async () => {
    const { findByText } = await render(tree('en', () => false));
    expect(await findByText('safe content')).toBeTruthy();
  });

  it('shows the localised fallback and never the raw error', async () => {
    const { findByText, queryByText } = await render(tree('en', () => true));
    expect(await findByText(getExtra('en').crashTitle)).toBeTruthy();
    expect(queryByText(/kaboom/)).toBeNull();
  });

  it('remounts a healthy subtree after retry', async () => {
    let shouldCrash = true;
    const { findByText, getByLabelText } = await render(tree('en', () => shouldCrash));
    expect(await findByText(getExtra('en').crashTitle)).toBeTruthy();

    // The failure was transient: the next render succeeds.
    shouldCrash = false;
    fireEvent.press(getByLabelText('Retry'));
    expect(await findByText('safe content')).toBeTruthy();
  });

  it('uses the Arabic copy for an Arabic language prop', async () => {
    const { findByText } = await render(tree('ar', () => true));
    expect(await findByText(getExtra('ar').crashTitle)).toBeTruthy();
  });
});
