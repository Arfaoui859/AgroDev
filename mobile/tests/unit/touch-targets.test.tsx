import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { LanguageProvider } from '../../src/context/LanguageContext';
import { Button } from '../../src/components/ui/Button';

/**
 * Mobile accessibility floor: every primary interactive control must offer a
 * touch target of at least 48dp. These guard the Button size variants, which
 * previously rendered at 36dp (`sm`) and 44dp (`md`).
 */
describe('touch targets', () => {
  const renderButton = (size: 'sm' | 'md' | 'lg') =>
    render(
      <LanguageProvider>
        <Button title="Action" onPress={() => {}} size={size} />
      </LanguageProvider>,
    );

  it.each(['sm', 'md', 'lg'] as const)('renders the %s button at >= 48dp', async (size) => {
    await renderButton(size);
    const style = screen.getByRole('button').props.style;
    expect(style.minHeight).toBeGreaterThanOrEqual(48);
  });
});
