import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Chip } from '../../src/components/ui/Chip';
import { colors } from '../../src/theme/colors';

/**
 * Chip is the shared selectable text pill used by the irrigation, disease-part
 * and farm-region pickers. It replaced three identical local copies, so its
 * a11y contract (role + selected state) and its primary-fill when selected are
 * the behaviours those pickers depend on.
 */
describe('Chip', () => {
  it('exposes the label and role, and is not selected by default', async () => {
    await render(<Chip label="Blé" onPress={() => {}} />);
    const chip = screen.getByRole('button', { name: 'Blé' });
    expect(chip.props.accessibilityState.selected).toBe(false);
  });

  it('reports the selected state and fills with primary when selected', async () => {
    await render(<Chip label="Blé" selected onPress={() => {}} />);
    const chip = screen.getByRole('button', { name: 'Blé' });
    expect(chip.props.accessibilityState.selected).toBe(true);
    const style = Object.assign({}, ...[chip.props.style].flat().filter(Boolean));
    expect(style.backgroundColor).toBe(colors.primary);
  });

  it('fires onPress', async () => {
    const onPress = jest.fn();
    await render(<Chip label="Blé" onPress={onPress} />);
    fireEvent.press(screen.getByRole('button', { name: 'Blé' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
