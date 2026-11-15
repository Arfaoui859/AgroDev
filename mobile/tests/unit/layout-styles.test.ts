import {
  actionsRow, cardBottomRow, cardPad, flex1, gapMd, rowGapMd, rowGapSm, rowGapXs, rowWrapSm,
  screenStyles, selectedChip, spaceBetween, spaceBetweenTop, spaceBetweenXs, stackLg, stackMd, stackSm,
  stackTopSm, stackedCard,
} from '../../src/theme/layout';
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

  it('flex1 and the stack margins pin the shared rhythm tokens', () => {
    expect(flex1).toMatchObject({ flex: 1 });
    expect(stackSm).toMatchObject({ marginBottom: spacing.sm });
    expect(stackMd).toMatchObject({ marginBottom: spacing.md });
    expect(stackLg).toMatchObject({ marginBottom: spacing.lg });
  });

  it('selectedChip is the brand fill shared by chips, pills and the stepper', () => {
    expect(selectedChip).toMatchObject({ backgroundColor: colors.primary, borderColor: colors.primary });
  });

  it('row gap tokens pin the shared icon/label rows', () => {
    expect(rowGapXs).toMatchObject({ flexDirection: 'row', alignItems: 'center', gap: spacing.xs });
    expect(rowGapSm).toMatchObject({ flexDirection: 'row', alignItems: 'center', gap: spacing.sm });
    expect(rowGapMd).toMatchObject({ flexDirection: 'row', alignItems: 'center', gap: spacing.md });
    expect(rowWrapSm).toMatchObject({ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm });
    expect(actionsRow).toMatchObject({ flexDirection: 'row', gap: spacing.sm });
  });

  it('gapMd and stackTopSm pin the vertical rhythm helpers', () => {
    expect(gapMd).toMatchObject({ gap: spacing.md });
    expect(stackTopSm).toMatchObject({ marginTop: spacing.sm });
  });

  it('spaceBetweenXs is spaceBetween with the tight xs gap', () => {
    expect(spaceBetweenXs).toMatchObject({ ...spaceBetween, marginBottom: spacing.xs });
  });
});
