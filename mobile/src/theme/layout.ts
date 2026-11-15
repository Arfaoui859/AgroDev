import { StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing } from './colors';

/**
 * Shared screen shell.
 *
 * Every full-screen scrolling view used to declare its own identical
 * `container` (full-bleed background) and `content` (standard padding) pair.
 * They live here so a background or padding change lands in one place.
 */
export const screenStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing['3xl'] },
});

/**
 * The standard in-flow form/result card: the `Card` shell with a tighter
 * `spacing.md` pad and the `spacing.md` gap that separates stacked cards. The
 * soil steps, the service forms and the result panels all used this exact pair.
 */
export const stackedCard: ViewStyle = { padding: spacing.md, marginBottom: spacing.md };

/** The same `spacing.md` pad as `stackedCard` for a card that is not followed by a gap. */
export const cardPad: ViewStyle = { padding: spacing.md };

/** Row of items with equal space between them, vertically centred. */
export const spaceBetween: ViewStyle = { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' };

/** Row of items pushed to opposite ends, top-aligned (headers with a title block). */
export const spaceBetweenTop: ViewStyle = { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' };

/** Centred flex row. */
export const rowCenter: ViewStyle = { flexDirection: 'row', alignItems: 'center' };

/** Centred flex row with the small gap. */
export const rowCenterSm: ViewStyle = { flexDirection: 'row', alignItems: 'center', gap: spacing.sm };

/** Footer row of a list card: a hairline rule above the trailing actions. */
export const cardBottomRow: ViewStyle = {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderTopWidth: 1,
  borderTopColor: colors.surfaceSubtle,
  paddingTop: spacing.xs,
  marginTop: spacing.xs,
};

/** A child that should absorb the remaining space in its row/column. */
export const flex1: ViewStyle = { flex: 1 };

/** Standard vertical rhythm between stacked blocks. */
export const stackSm: ViewStyle = { marginBottom: spacing.sm };
export const stackMd: ViewStyle = { marginBottom: spacing.md };
export const stackLg: ViewStyle = { marginBottom: spacing.lg };

/** Selected-state fill shared by the chips, pills and stepper: brand background and border. */
export const selectedChip: ViewStyle = { backgroundColor: colors.primary, borderColor: colors.primary };
