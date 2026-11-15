import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme/colors';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
}

/**
 * A selectable text pill: ≥48dp tall, fully rounded, outlined, and filled with
 * the primary colour when selected. The irrigation, disease-part and farm-region
 * pickers each built this identical control (style block plus markup), so it
 * lives here once. Icon-leading variants stay local to their screen.
 */
export const Chip: React.FC<ChipProps> = ({ label, selected = false, onPress }) => (
  <TouchableOpacity
    activeOpacity={0.85}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityState={{ selected }}
    accessibilityLabel={label}
    style={[styles.chip, selected && styles.chipSelected]}
  >
    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  chip: {
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: typography.fontSizes.xs, color: colors.textSecondary, lineHeight: typography.lineHeights.xs },
  chipTextSelected: { color: colors.textInverse, fontWeight: typography.fontWeights.bold },
});
