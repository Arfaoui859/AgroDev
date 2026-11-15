import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { IconChip } from '../../src/components/ui/IconChip';
import { LanguageProvider } from '../../src/context/LanguageContext';
import { colors } from '../../src/theme/colors';

const wrap = (ui: React.ReactElement) => render(<LanguageProvider>{ui}</LanguageProvider>);

/**
 * IconChip is the shared icon-leading selectable pill used by the sign-up role
 * picker and the disease crop picker. Both depended on the same a11y contract
 * and the primary fill when selected.
 */
describe('IconChip', () => {
  it('exposes the label and role with the selected state', async () => {
    await wrap(<IconChip icon="sprout" label="Agriculteur" selected onPress={() => {}} />);
    const chip = screen.getByRole('button', { name: 'Agriculteur' });
    expect(chip.props.accessibilityState.selected).toBe(true);
  });

  it('fills with primary when selected', async () => {
    await wrap(<IconChip icon="sprout" label="Agriculteur" selected onPress={() => {}} />);
    const chip = screen.getByRole('button', { name: 'Agriculteur' });
    const style = Object.assign({}, ...[chip.props.style].flat().filter(Boolean));
    expect(style.backgroundColor).toBe(colors.primary);
  });

  it('fires onPress', async () => {
    const onPress = jest.fn();
    await wrap(<IconChip icon="sprout" label="Agriculteur" onPress={onPress} />);
    fireEvent.press(screen.getByRole('button', { name: 'Agriculteur' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
