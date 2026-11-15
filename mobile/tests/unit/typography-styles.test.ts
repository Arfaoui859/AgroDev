import { mutedCaption, subtleCaption, subtitleMeta, titleBase, titleSm, titleLg, labelMedium, noteCaption } from '../../src/theme/typographyStyles';
import { colors, typography } from '../../src/theme/colors';

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
