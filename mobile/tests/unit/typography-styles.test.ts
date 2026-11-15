import {
  accentCaption, cardHeading, labelMedium, mutedCaption, mutedCaptionTop, noteCaption, sectionHeading,
  subtleCaption, subtitleMeta, subtitleMetaBase, textAccentSemibold, textOnPrimary, titleBase, titleBaseAccent,
  centerText, fieldLabel, labelSemibold, linkCaption, linkText, mutedCaptionSm, primaryBoldText,
  subtitleMetaSm, textAccent, xsSemibold, titleBaseCenter, titleBaseFlex, titleLgFlex, titleLg, titleSm, titleSmSemibold, titleXl, typeSm, typeXs, xsNote,
} from '../../src/theme/typographyStyles';
import { colors, spacing, typography } from '../../src/theme/colors';

/**
 * These three caption constants replaced dozens of identical inline definitions
 * across screens. They must keep the xs type scale with a matching line height
 * (Arabic needs it) and only differ by colour / top gap.
 */
describe('caption styles', () => {
  it('all use the xs scale with a line height', () => {
    for (const s of [mutedCaption, subtleCaption, subtitleMeta]) {
      expect(s.fontSize).toBe(typography.fontSizes.xs);
      expect(s.lineHeight).toBe(typography.lineHeights.xs);
    }
  });

  it('muted vs secondary colour', () => {
    expect(mutedCaption.color).toBe(colors.textMuted);
    expect(subtleCaption.color).toBe(colors.textSecondary);
    expect(subtitleMeta.color).toBe(colors.textSecondary);
  });

  it('subtitleMeta is subtleCaption plus a 2px top gap', () => {
    expect(subtitleMeta.marginTop).toBe(2);
    expect(subtleCaption.marginTop).toBeUndefined();
  });
});

describe('title styles', () => {
  it('bold, text-coloured, one per scale with matching line height', () => {
    expect(titleBase).toMatchObject({ fontSize: typography.fontSizes.base, lineHeight: typography.lineHeights.base, fontWeight: typography.fontWeights.bold, color: colors.text });
    expect(titleSm).toMatchObject({ fontSize: typography.fontSizes.sm, lineHeight: typography.lineHeights.sm, fontWeight: typography.fontWeights.bold, color: colors.text });
    expect(titleLg).toMatchObject({ fontSize: typography.fontSizes.lg, lineHeight: typography.lineHeights.lg, fontWeight: typography.fontWeights.bold, color: colors.text });
  });
});

describe('additional caption styles', () => {
  it('labelMedium is the medium-weight secondary xs label', () => {
    expect(labelMedium).toMatchObject({
      fontSize: typography.fontSizes.xs,
      lineHeight: typography.lineHeights.xs,
      color: colors.textSecondary,
      fontWeight: typography.fontWeights.medium,
    });
  });

  it('noteCaption is the secondary xs note on the small line height', () => {
    expect(noteCaption).toMatchObject({
      fontSize: typography.fontSizes.xs,
      lineHeight: typography.lineHeights.sm,
      color: colors.textSecondary,
    });
  });
});

describe('title variants', () => {
  it('titleBaseFlex extends titleBase with flex: 1', () => {
    expect(titleBaseFlex).toMatchObject({ ...titleBase, flex: 1 });
  });
  it('titleBaseAccent is titleBase in primaryDark', () => {
    expect(titleBaseAccent).toMatchObject({ ...titleBase, color: colors.primaryDark });
  });
  it('accentCaption is the xs primaryDark caption', () => {
    expect(accentCaption).toMatchObject({ fontSize: typography.fontSizes.xs, lineHeight: typography.lineHeights.xs, color: colors.primaryDark });
  });
  it('titleSmSemibold is the sm semibold text title', () => {
    expect(titleSmSemibold).toMatchObject({ fontSize: typography.fontSizes.sm, lineHeight: typography.lineHeights.sm, fontWeight: typography.fontWeights.semibold, color: colors.text });
  });
});
describe('added polish tokens', () => {
  it('typeXs / typeSm are the bare scale steps', () => {
    expect(typeXs).toMatchObject({ fontSize: typography.fontSizes.xs, lineHeight: typography.lineHeights.xs });
    expect(typeSm).toMatchObject({ fontSize: typography.fontSizes.sm, lineHeight: typography.lineHeights.sm });
  });

  it('titleXl is the bold xl heading', () => {
    expect(titleXl).toMatchObject({
      fontSize: typography.fontSizes.xl,
      lineHeight: typography.lineHeights.xl,
      fontWeight: typography.fontWeights.bold,
      color: colors.text,
    });
  });

  it('titleBaseCenter is titleBase centred', () => {
    expect(titleBaseCenter).toMatchObject({ ...titleBase, textAlign: 'center' });
  });

  it('textOnPrimary / textAccentSemibold pin the two accent text colours', () => {
    expect(textOnPrimary).toMatchObject({ color: colors.textInverse, fontWeight: typography.fontWeights.bold });
    expect(textAccentSemibold).toMatchObject({ color: colors.primaryDark, fontWeight: typography.fontWeights.semibold });
  });

  it('cardHeading / sectionHeading are titleSm with the xs / sm gap', () => {
    expect(cardHeading).toMatchObject({ ...titleSm, marginBottom: spacing.xs });
    expect(sectionHeading).toMatchObject({ ...titleSm, marginBottom: spacing.sm });
  });

  it('mutedCaptionTop is mutedCaption with a 2px top gap', () => {
    expect(mutedCaptionTop).toMatchObject({ ...mutedCaption, marginTop: 2 });
  });
});
describe('card sub-line tokens', () => {
  it('xsNote is the secondary xs note with the 2px optical top gap', () => {
    expect(xsNote).toMatchObject({
      fontSize: typography.fontSizes.xs,
      lineHeight: typography.lineHeights.xs,
      color: colors.textSecondary,
      marginTop: 2,
    });
  });
  it('subtitleMetaBase is the sm subtitle with a top gap and the md block gap', () => {
    expect(subtitleMetaBase).toMatchObject({
      fontSize: typography.fontSizes.sm,
      lineHeight: typography.lineHeights.sm,
      color: colors.textSecondary,
      marginTop: 2,
      marginBottom: spacing.md,
    });
  });
});
describe('link, label and accent tokens', () => {
  it('labelSemibold / fieldLabel pin the field labels', () => {
    expect(labelSemibold).toMatchObject({
      fontSize: typography.fontSizes.xs,
      lineHeight: typography.lineHeights.xs,
      fontWeight: typography.fontWeights.semibold,
      color: colors.text,
    });
    expect(fieldLabel).toMatchObject({ ...labelSemibold, marginBottom: spacing.xs });
  });
  it('linkText / linkCaption are the sm and xs brand links', () => {
    expect(linkText).toMatchObject({ fontSize: typography.fontSizes.sm, color: colors.primary, fontWeight: typography.fontWeights.semibold });
    expect(linkCaption).toMatchObject({ fontSize: typography.fontSizes.xs, color: colors.primary, fontWeight: typography.fontWeights.semibold });
  });
  it('primaryBoldText / textAccent / centerText / titleLgFlex', () => {
    expect(primaryBoldText).toMatchObject({ color: colors.primary, fontWeight: typography.fontWeights.bold });
    expect(textAccent).toMatchObject({ color: colors.primaryDark });
    expect(centerText).toMatchObject({ textAlign: 'center' });
    expect(titleLgFlex).toMatchObject({ ...titleLg, flex: 1 });
  });
  it('mutedCaptionSm is mutedCaption with the sm gap above it', () => {
    expect(mutedCaptionSm).toMatchObject({ ...mutedCaption, marginTop: spacing.sm });
  });
});
describe('xsSemibold', () => {
  it('is xs semibold text with no colour of its own', () => {
    expect(xsSemibold).toEqual({
      fontSize: typography.fontSizes.xs,
      lineHeight: typography.lineHeights.xs,
      fontWeight: typography.fontWeights.semibold,
    });
  });
});
describe('subtitleMetaSm', () => {
  it('is subtitleMetaBase with the tighter sm gap beneath it', () => {
    expect(subtitleMetaSm).toMatchObject({ ...subtitleMetaBase, marginBottom: spacing.sm });
  });
});
