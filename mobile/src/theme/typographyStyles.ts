import { TextStyle } from 'react-native';
import { colors, typography } from './colors';

/**
 * Shared caption styles.
 *
 * Screens repeated the same "small muted line" and "small secondary line"
 * definitions dozens of times. They live here so the type scale, colour and
 * Arabic line-height stay consistent; a caller can still spread one and override
 * (e.g. add a `marginTop`).
 */
const captionBase = {
  fontSize: typography.fontSizes.xs,
  lineHeight: typography.lineHeights.xs,
};

/** Faint metadata: units, timestamps, secondary labels. */
export const mutedCaption: TextStyle = { ...captionBase, color: colors.textMuted };

/** Standard secondary caption (descriptions, sub-labels). */
export const subtleCaption: TextStyle = { ...captionBase, color: colors.textSecondary };

/** Secondary caption with the common 2px top gap under a title. */
export const subtitleMeta: TextStyle = { ...subtleCaption, marginTop: 2 };

/** Section title on the base scale (bold, text colour). */
export const titleBase: TextStyle = {
  fontSize: typography.fontSizes.base,
  lineHeight: typography.lineHeights.base,
  fontWeight: typography.fontWeights.bold,
  color: colors.text,
};

/** Card/list title on the small scale (bold, text colour). */
export const titleSm: TextStyle = {
  fontSize: typography.fontSizes.sm,
  lineHeight: typography.lineHeights.sm,
  fontWeight: typography.fontWeights.bold,
  color: colors.text,
};

/** Brand/large heading on the large scale (bold, text colour). */
export const titleLg: TextStyle = {
  fontSize: typography.fontSizes.lg,
  lineHeight: typography.lineHeights.lg,
  fontWeight: typography.fontWeights.bold,
  color: colors.text,
};

/** Medium-weight secondary label (pills, tabs). */
export const labelMedium: TextStyle = {
  ...captionBase,
  color: colors.textSecondary,
  fontWeight: typography.fontWeights.medium,
};

/** Secondary note on the small line height (messages, inline notes). */
export const noteCaption: TextStyle = {
  fontSize: typography.fontSizes.xs,
  lineHeight: typography.lineHeights.sm,
  color: colors.textSecondary,
};
