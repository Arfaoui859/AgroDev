import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { LanguageProvider } from '../../src/context/LanguageContext';
import { SearchBar } from '../../src/components/ui/SearchBar';

const wrap = (ui: React.ReactElement) => render(<LanguageProvider>{ui}</LanguageProvider>);

/**
 * SearchBar is the shared search-field used by Services, Marketplace and Agri
 * News. These guard the two behaviours the screens depend on: the clear button
 * appears only once there is text (and empties the field), and the submit
 * variant replaces it with a pressable arrow.
 */
describe('SearchBar', () => {
  it('hides the clear button while the field is empty', async () => {
    await wrap(
      <SearchBar value="" onChangeText={jest.fn()} placeholder="ابحث" clearLabel="مسح" />,
    );
    expect(screen.queryByLabelText('مسح')).toBeNull();
  });

  it('shows the clear button with text and empties the field on press', async () => {
    const onChangeText = jest.fn();
    await wrap(
      <SearchBar value="قمح" onChangeText={onChangeText} placeholder="ابحث" clearLabel="مسح" />,
    );
    fireEvent.press(screen.getByLabelText('مسح'));
    expect(onChangeText).toHaveBeenCalledWith('');
  });

  it('shows a submit button instead of clear when onSubmit is given', async () => {
    const onSubmit = jest.fn();
    await wrap(
      <SearchBar
        value="قمح"
        onChangeText={jest.fn()}
        placeholder="ابحث"
        clearLabel="مسح"
        onSubmit={onSubmit}
        submitLabel="بحث"
      />,
    );
    expect(screen.queryByLabelText('مسح')).toBeNull();
    fireEvent.press(screen.getByLabelText('بحث'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
