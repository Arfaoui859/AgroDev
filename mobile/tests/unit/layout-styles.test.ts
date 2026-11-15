import { screenStyles, stackedCard } from '../../src/theme/layout';
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
});
