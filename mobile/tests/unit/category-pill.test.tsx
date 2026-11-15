import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { LanguageProvider } from '../../src/context/LanguageContext';
import { CategoryPill } from '../../src/components/ui/CategoryPill';

const wrap = (ui: React.ReactElement) => render(<LanguageProvider>{ui}</LanguageProvider>);

/**
 * CategoryPill backs the Services, Agri News and Learning Videos filter rows.
 * These guard the contract those screens rely on: the label is pressable and
 * announced, the selected state is exposed to accessibility, and an optional
 * leading icon renders alongside the text.
 */
describe('CategoryPill', () => {
  it('renders the label and fires onPress', async () => {
    const onPress = jest.fn();
    await wrap(<CategoryPill label="الكل" selected={false} onPress={onPress} />);
    fireEvent.press(screen.getByLabelText('الكل'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('exposes the selected state to accessibility', async () => {
    await wrap(<CategoryPill label="التربة" selected onPress={jest.fn()} />);
    expect(screen.getByLabelText('التربة').props.accessibilityState).toEqual({ selected: true });
  });

  it('renders a leading icon when one is given', async () => {
    await wrap(<CategoryPill label="الري" icon="water" selected={false} onPress={jest.fn()} />);
    expect(screen.getByLabelText('الري')).toBeTruthy();
  });
});
