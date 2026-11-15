import { cardBottomRow, cardPad, screenStyles, spaceBetween, spaceBetweenTop, stackedCard } from '../../src/theme/layout';
import { colors, spacing } from '../../src/theme/colors';

/**
 * screenStyles is the shared screen shell and stackedCard is the standard
 * in-flow card used by the soil steps, service forms and result panels. They
 * replaced many identical inline definitions, so their key geometry is pinned.
 */
describe('layout styles', () => {
  it('screen shell fills the background with the standard content padding', () => {
    expect(screenStyles.container).toMatchObject({ flex: 1, backgroundColor: colors.background });
    expect(screenStyles.content).toMatchObject({ padding: spacing.lg, paddingBottom: spacing['3xl'] });
  });

  it('stackedCard is the tighter card pad with the standard gap', () => {
    expect(stackedCard).toMatchObject({ padding: spacing.md, marginBottom: spacing.md });
  });

  it('cardPad is the tight card pad without a gap', () => {
    expect(cardPad).toMatchObject({ padding: spacing.md });
  });

  it('spaceBetween and spaceBetweenTop pin the shared row geometry', () => {
    expect(spaceBetween).toMatchObject({ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' });
    expect(spaceBetweenTop).toMatchObject({ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' });
  });

  it('cardBottomRow adds the hairline rule above the card actions', () => {
    expect(cardBottomRow).toMatchObject({
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: colors.surfaceSubtle,
      paddingTop: spacing.xs,
      marginTop: spacing.xs,
    });
  });
});
