import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { IconButton } from '../../src/components/ui/IconButton';

/**
 * IconButton is the shared circular icon-only control. It carries no visible
 * text, so the accessible label is the only thing a screen reader announces;
 * losing it would make the header back/notifications buttons unusable.
 */
describe('IconButton', () => {
  it('exposes the accessibility label and fires onPress', async () => {
    const onPress = jest.fn();
    await render(<IconButton icon="bell-outline" onPress={onPress} accessibilityLabel="Notifications" />);

    const button = screen.getByLabelText('Notifications');
    fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('keeps the 48dp minimum touch target', async () => {
    await render(<IconButton icon="close" onPress={() => {}} accessibilityLabel="Close" />);
    const style = screen.getByLabelText('Close').props.style;
    const flat = Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style;
    expect(flat.width).toBeGreaterThanOrEqual(48);
    expect(flat.height).toBeGreaterThanOrEqual(48);
  });
});
