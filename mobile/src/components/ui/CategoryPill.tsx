import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { rtlStyles } from '../../theme/rtl';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme/colors';
import { selectedChip } from '../../theme/layout';
import { labelMedium, textOnPrimary } from '../../theme/typographyStyles';
import { useLanguage } from '../../context/LanguageContext';

interface CategoryPillProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Optional leading icon (Services' category filter uses one). */
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
}

/**
 * A single rounded, ≥48dp category filter pill. Shared by the Services,
 * Agri News and Learning Videos horizontal filters so their selected state,
 * icon slot and accessibility semantics stay identical.
 */
export const CategoryPill: React.FC<CategoryPillProps> = ({ label, selected, onPress, icon }) => {
  const { isRtl } = useLanguage();
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={[styles.pill, isRtl && rtlStyles.rtlRow, selected && styles.pillSelected]}
    >
      {icon ? (
        <MaterialCommunityIcons
          name={icon}
          size={16}
          color={selected ? colors.textInverse : colors.textSecondary}
        />
      ) : null}
      <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  pillSelected: selectedChip,
  text: labelMedium,
  textSelected: textOnPrimary,
});
