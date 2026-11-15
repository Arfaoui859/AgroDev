import { TextStyle } from 'react-native';
import { colors, radius, spacing, typography } from './colors';

/**
 * The standard ≥48dp bordered text input. The auth modal, the farm form and the
 * generic service form each declared this exact style; it lives here so a border,
 * radius or font change lands in one place. Fields that need extra geometry
 * spread it and override.
 */
export const formInput: TextStyle = {
  height: 48,
  backgroundColor: colors.surfaceSubtle,
  borderRadius: radius.md,
  borderWidth: 1,
  borderColor: colors.border,
  paddingHorizontal: spacing.md,
  fontSize: typography.fontSizes.sm,
  lineHeight: typography.lineHeights.sm,
  color: colors.text,
};
