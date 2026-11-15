import { TextStyle } from 'react-native';
import { colors, spacing, typography } from './colors';

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

/** xs note with the 2px optical top gap (card sub-lines). */
export const xsNote: TextStyle = {
  fontSize: typography.fontSizes.xs,
  lineHeight: typography.lineHeights.xs,
  color: colors.textSecondary,
  marginTop: 2,
};

/** sm subtitle with the 2px optical top gap, above the md block gap. */
export const subtitleMetaBase: TextStyle = {
  fontSize: typography.fontSizes.sm,
  lineHeight: typography.lineHeights.sm,
  color: colors.textSecondary,
  marginTop: 2,
  marginBottom: spacing.md,
};

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

/** `titleBase` in a flex row where the title shares width with trailing content. */
export const titleBaseFlex: TextStyle = { ...titleBase, flex: 1 };

/** Base-scale bold heading in the primary-dark accent (score banners). */
export const titleBaseAccent: TextStyle = { ...titleBase, color: colors.primaryDark };

/** xs accent caption (score/confidence sub-labels). */
export const accentCaption: TextStyle = {
  fontSize: typography.fontSizes.xs,
  lineHeight: typography.lineHeights.xs,
  color: colors.primaryDark,
};

/** Small semibold list/option title. */
export const titleSmSemibold: TextStyle = {
  fontSize: typography.fontSizes.sm,
  lineHeight: typography.lineHeights.sm,
  fontWeight: typography.fontWeights.semibold,
  color: colors.text,
};

/** Faint metadata caption with the common 2px top gap under a title. */
export const mutedCaptionTop: TextStyle = { ...mutedCaption, marginTop: 2 };

/** Bare xs type scale (size + line height) for controls that set their own colour. */
export const typeXs: TextStyle = {
  fontSize: typography.fontSizes.xs,
  lineHeight: typography.lineHeights.xs,
};

/** Bare sm type scale (size + line height) for controls that set their own colour. */
export const typeSm: TextStyle = {
  fontSize: typography.fontSizes.sm,
  lineHeight: typography.lineHeights.sm,
};

/** Display heading on the xl scale (bold, text colour). */
export const titleXl: TextStyle = {
  fontSize: typography.fontSizes.xl,
  lineHeight: typography.lineHeights.xl,
  fontWeight: typography.fontWeights.bold,
  color: colors.text,
};

/** `titleBase` centred (header bars, error panels). */
export const titleBaseCenter: TextStyle = { ...titleBase, textAlign: 'center' };

/** Bold inverse text for a brand-filled surface. */
export const textOnPrimary: TextStyle = { color: colors.textInverse, fontWeight: typography.fontWeights.bold };

/** Semibold text in the primary-dark accent. */
export const textAccentSemibold: TextStyle = { color: colors.primaryDark, fontWeight: typography.fontWeights.semibold };

/** Card sub-heading: `titleSm` with the small gap beneath it. */
export const cardHeading: TextStyle = { ...titleSm, marginBottom: spacing.xs };

/** Section heading: `titleSm` with the standard gap beneath it. */
export const sectionHeading: TextStyle = { ...titleSm, marginBottom: spacing.sm };

/** `titleLg` taking the free space in a row. */
export const titleLgFlex: TextStyle = { ...titleLg, flex: 1 };

/** `subtitleMetaBase` with the tighter sm gap beneath it. */
export const subtitleMetaSm: TextStyle = { ...subtitleMetaBase, marginBottom: spacing.sm };

/** xs semibold text in the inherited colour. */
export const xsSemibold: TextStyle = {
  fontSize: typography.fontSizes.xs,
  lineHeight: typography.lineHeights.xs,
  fontWeight: typography.fontWeights.semibold,
};

/** Centred text. */
export const centerText: TextStyle = { textAlign: 'center' };

/** xs semibold label in the body text colour. */
export const labelSemibold: TextStyle = {
  fontSize: typography.fontSizes.xs,
  lineHeight: typography.lineHeights.xs,
  fontWeight: typography.fontWeights.semibold,
  color: colors.text,
};

/** Field label: `labelSemibold` with the tight gap beneath it. */
export const fieldLabel: TextStyle = { ...labelSemibold, marginBottom: spacing.xs };

/** Semibold sm link in the brand colour. */
export const linkText: TextStyle = {
  fontSize: typography.fontSizes.sm,
  lineHeight: typography.lineHeights.sm,
  color: colors.primary,
  fontWeight: typography.fontWeights.semibold,
};

/** Semibold xs link in the brand colour. */
export const linkCaption: TextStyle = {
  fontSize: typography.fontSizes.xs,
  lineHeight: typography.lineHeights.xs,
  color: colors.primary,
  fontWeight: typography.fontWeights.semibold,
};

/** Bold brand-coloured text (tabs, inline links). */
export const primaryBoldText: TextStyle = { color: colors.primary, fontWeight: typography.fontWeights.bold };

/** Dark brand accent text. */
export const textAccent: TextStyle = { color: colors.primaryDark };

/** `mutedCaption` with the standard gap above it. */
export const mutedCaptionSm: TextStyle = { ...mutedCaption, marginTop: spacing.sm };
