import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { rtlStyles } from '../../theme/rtl';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { useLanguage } from '../../context/LanguageContext';

interface SearchBarProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  /** Clear-button accessibility label (shown when there is text and no submit). */
  clearLabel: string;
  /**
   * When provided, a trailing submit button is shown instead of the clear
   * button (e.g. Agri News). Fires on press and on the keyboard submit key.
   */
  onSubmit?: () => void;
  /** Accessibility label for the submit button; defaults to `placeholder`. */
  submitLabel?: string;
}

/**
 * The single search-field treatment used by Services, Marketplace and Agri
 * News: magnifier, RTL-aware text input, and either a clear button (once there
 * is text) or a trailing submit button. Centralising it keeps the field
 * identical and ≥48dp tall on every screen.
 */
export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder,
  clearLabel,
  onSubmit,
  submitLabel,
}) => {
  const { isRtl } = useLanguage();
  const showClear = !onSubmit && value.length > 0;
  return (
    <View style={[styles.bar, isRtl && rtlStyles.rtlRow]}>
      <MaterialCommunityIcons name="magnify" size={22} color={colors.textMuted} />
      <TextInput
        style={[styles.input, isRtl && rtlStyles.rtlText]}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        returnKeyType={onSubmit ? 'search' : 'done'}
        accessibilityLabel={placeholder}
      />
      {onSubmit ? (
        <TouchableOpacity
          onPress={onSubmit}
          accessibilityRole="button"
          accessibilityLabel={submitLabel ?? placeholder}
          style={styles.actionButton}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={20}
            color={colors.primary}
            style={isRtl ? undefined : styles.flipIcon}
          />
        </TouchableOpacity>
      ) : showClear ? (
        <TouchableOpacity
          onPress={() => onChangeText('')}
          accessibilityRole="button"
          accessibilityLabel={clearLabel}
          style={styles.actionButton}
        >
          <MaterialCommunityIcons name="close-circle" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 48,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSizes.sm,
    lineHeight: typography.lineHeights.sm,
    color: colors.text,
    height: '100%',
  },
  actionButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', marginRight: -spacing.sm },
  flipIcon: { transform: [{ scaleX: -1 }] },
});
