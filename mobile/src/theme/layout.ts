import { StyleSheet } from 'react-native';
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
