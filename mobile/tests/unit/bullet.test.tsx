import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { LanguageProvider } from '../../src/context/LanguageContext';
import { Bullet } from '../../src/components/ui/Bullet';

const wrap = (ui: React.ReactElement) => render(<LanguageProvider>{ui}</LanguageProvider>);

/**
 * Bullet is the shared list item for recommendations, causes and limitations.
 * The marker varies (dot / icon / glyph) but the text must always render, since
 * these bullets carry the honest advice the screens are built around.
 */
describe('Bullet', () => {
  it('renders the text for every marker variant', async () => {
    await wrap(
      <>
        <Bullet text="نصّ نقطي" />
        <Bullet variant="icon" text="نصّ بالأيقونة" />
        <Bullet variant="glyph" text="نصّ رمزي" />
      </>,
    );
    expect(screen.getByText('نصّ نقطي')).toBeTruthy();
    expect(screen.getByText('نصّ بالأيقونة')).toBeTruthy();
    expect(screen.getByText('نصّ رمزي')).toBeTruthy();
  });
});
