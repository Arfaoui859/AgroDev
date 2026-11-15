import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { IconTile } from '../../src/components/ui/IconTile';

/**
 * IconTile is the shared 46×46 tinted icon square used by the Home season and
 * academy cards and the Services list. It renders no text, so the guard is the
 * fixed square geometry (which the card layouts rely on) and the tint it is
 * handed.
 */
describe('IconTile', () => {
  it('renders a 46x46 tile with the given background tint', async () => {
    const { toJSON } = await render(<IconTile icon="sprout" color="#16a34a" bg="#dcfce7" />);
    const tree = toJSON() as any;
    const style = Array.isArray(tree.props.style)
      ? Object.assign({}, ...tree.props.style.filter(Boolean))
      : tree.props.style;
    expect(style.width).toBe(46);
    expect(style.height).toBe(46);
    expect(style.backgroundColor).toBe('#dcfce7');
  });

  it('forwards an overriding style', async () => {
    const { toJSON } = await render(
      <IconTile icon="water" color="#0ea5e9" bg="#e0f2fe" style={{ width: 52, height: 52 }} />,
    );
    const tree = toJSON() as any;
    const style = Array.isArray(tree.props.style)
      ? Object.assign({}, ...tree.props.style.filter(Boolean))
      : tree.props.style;
    expect(style.width).toBe(52);
  });
});
