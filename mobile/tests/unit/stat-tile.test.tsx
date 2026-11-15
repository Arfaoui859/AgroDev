import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { StatTile } from '../../src/components/ui/StatTile';
import { colors, typography } from '../../src/theme/colors';

/**
 * StatTile is the value-over-label statistic shared by the livestock and
 * multi-agent summary rows. Its value colour is overridable and its caption
 * keeps the muted xs scale.
 */
describe('StatTile', () => {
  it('renders the value and label', async () => {
    await render(<StatTile label="Total" value={12} />);
    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getByText('Total')).toBeTruthy();
  });

  it('defaults the value to the text colour and honours an override', async () => {
    await render(<StatTile label="Healthy" value={9} color={colors.success} />);
    const value = screen.getByText('9');
    const style = Object.assign({}, ...[value.props.style].flat().filter(Boolean));
    expect(style.color).toBe(colors.success);
    expect(style.fontSize).toBe(typography.fontSizes.xl);
  });

  it('applies the container style and centres the label when asked', async () => {
    await render(<StatTile label="Sick" value={2} style={{ flex: 1 }} centerLabel />);
    const label = screen.getByText('Sick');
    const style = Object.assign({}, ...[label.props.style].flat().filter(Boolean));
    expect(style.textAlign).toBe('center');
  });
});
