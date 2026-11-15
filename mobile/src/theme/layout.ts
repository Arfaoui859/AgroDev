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
