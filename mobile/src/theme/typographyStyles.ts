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
