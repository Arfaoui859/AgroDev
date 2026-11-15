import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { rtlStyles } from '../../theme/rtl';
import { colors, radius, spacing } from '../../theme/colors';
import { chipActiveFill, rowWrapSm } from '../../theme/layout';
import { subtleCaption, textAccentSemibold } from '../../theme/typographyStyles';
import { useLanguage } from '../../context/LanguageContext';

interface ChipSelectProps {
  options: { value: string; label: string }[];
  selected: string | null;
  onSelect: (value: string) => void;
  /** Allow clearing the selection. */
  clearable?: boolean;
}

/** A horizontal wrap of selectable chips, each a ≥48dp touch target. */
export const ChipSelect: React.FC<ChipSelectProps> = ({ options, selected, onSelect, clearable }) => {
  const { isRtl } = useLanguage();
  return (
    <View style={[styles.wrap, isRtl && rtlStyles.rtlRow]}>
      {options.map((opt) => {
        const isActive = opt.value === selected;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onSelect(isActive && clearable ? '' : opt.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={opt.label}
            style={[styles.chip, isActive && styles.chipActive]}
          >
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: rowWrapSm,
  chip: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
  },
  chipActive: chipActiveFill,
  chipText: subtleCaption,
  chipTextActive: textAccentSemibold,
});
