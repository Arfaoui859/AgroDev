import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { rtlStyles } from '../../theme/rtl';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { useLanguage } from '../../context/LanguageContext';

interface IconChipProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  selected?: boolean;
  onPress: () => void;
  /** Glyph size; the disease crop picker uses 18, the role picker 16. */
  iconSize?: number;
}

/**
 * A selectable pill with a leading icon: ≥48dp, fully rounded, outlined, and
 * filled with the primary colour when selected (icon and label flip to the
 * inverse colour). The sign-up role picker and the disease crop picker built
 * this identical control; it lives here once.
 */
export const IconChip: React.FC<IconChipProps> = ({ icon, label, selected = false, onPress, iconSize = 16 }) => {
  const { isRtl } = useLanguage();
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={[styles.chip, isRtl && rtlStyles.rtlRow, selected && styles.chipSelected]}
    >
      <MaterialCommunityIcons
        name={icon}
        size={iconSize}
        color={selected ? colors.textInverse : colors.primary}
      />
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: {
    fontSize: typography.fontSizes.xs,
    lineHeight: typography.lineHeights.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  chipTextSelected: { color: colors.textInverse },
});
