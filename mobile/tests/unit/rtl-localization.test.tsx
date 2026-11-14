import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { render, screen, waitFor, userEvent } from '@testing-library/react-native';
import { LanguageProvider, useLanguage } from '../../src/context/LanguageContext';
import { ServicesScreen } from '../../src/screens/ServicesScreen';

jest.mock('../../src/api/client', () => ({
  getAICapabilities: jest.fn(async () => ({ data: null, error: null })),
}));

// The persisted language survives between tests in the shared AsyncStorage mock.
beforeEach(async () => {
  await AsyncStorage.clear();
});

/** Exposes the active language/direction and a way to switch language. */
const Harness: React.FC = () => {
  const { language, isRtl, setLanguage } = useLanguage();
  return (
    <>
      <Text testID="lang">{language}</Text>
      <Text testID="rtl">{String(isRtl)}</Text>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="switch-fr" onPress={() => setLanguage('fr')}>
        <Text>fr</Text>
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="switch-en" onPress={() => setLanguage('en')}>
        <Text>en</Text>
      </TouchableOpacity>
      <ServicesScreen onSelectService={() => {}} />
    </>
  );
};

const renderHarness = () =>
  render(
    <LanguageProvider>
      <Harness />
    </LanguageProvider>,
  );

describe('Arabic-first RTL + fr/en localization', () => {
  it('starts in Arabic and RTL with Arabic copy', async () => {
    await renderHarness();
    await waitFor(() => expect(screen.getByTestId('lang').props.children).toBe('ar'));
    expect(screen.getByTestId('rtl').props.children).toBe('true');
    expect(screen.getByText('تحليل التربة والتسميد')).toBeTruthy();
  });

  it('switches to French: LTR direction and French copy', async () => {
    const user = userEvent.setup();
    await renderHarness();
    await waitFor(() => expect(screen.getByTestId('lang').props.children).toBe('ar'));

    await user.press(screen.getByLabelText('switch-fr'));

    await waitFor(() => expect(screen.getByTestId('lang').props.children).toBe('fr'));
    expect(screen.getByTestId('rtl').props.children).toBe('false');
    // The Arabic service title must be gone after switching locale.
    expect(screen.queryByText('تحليل التربة والتسميد')).toBeNull();
  });

  it('switches to English: LTR direction', async () => {
    const user = userEvent.setup();
    await renderHarness();
    await waitFor(() => expect(screen.getByTestId('lang').props.children).toBe('ar'));

    await user.press(screen.getByLabelText('switch-en'));

    await waitFor(() => expect(screen.getByTestId('lang').props.children).toBe('en'));
    expect(screen.getByTestId('rtl').props.children).toBe('false');
  });
});
