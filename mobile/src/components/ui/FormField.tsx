import React from 'react';
import { View, Text, TextInput, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { rtlStyles } from '../../theme/rtl';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { labelSemibold, mutedCaption } from '../../theme/typographyStyles';
import { spaceBetweenXs, stackSm } from '../../theme/layout';
import { useLanguage } from '../../context/LanguageContext';

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  /** Optional helper explaining the unit and why the measurement matters. */
  hint?: string;
  keyboard?: 'default' | 'decimal-pad' | 'number-pad';
  style?: StyleProp<ViewStyle>;
  /** Trailing marker such as the unit ("%", "dS/m"). */
  suffix?: string;
  /** Expand for longer free-text context such as field notes. */
  multiline?: boolean;
}

/**
 * A single labelled input. Renders a ≥48dp touch target and pairs every
 * `fontSize` with a `lineHeight` for readable Arabic. Used by the soil and crop
 * forms so their spacing and RTL behaviour stay identical.
 */
export const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  hint,
  keyboard = 'decimal-pad',
  style,
  suffix,
  multiline = false,
}) => {
  const { isRtl } = useLanguage();
  return (
    <View style={[styles.group, style]}>
      <View style={[styles.labelRow, isRtl && rtlStyles.rtlRow]}>
        <Text style={[styles.label, isRtl && rtlStyles.rtlText]}>{label}</Text>
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      </View>
      <TextInput
        style={[styles.input, multiline && styles.multilineInput, isRtl && rtlStyles.rtlText]}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        keyboardType={keyboard}
        inputMode={keyboard === 'default' ? 'text' : 'decimal'}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? '—'}
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={label}
      />
      {hint ? <Text style={[styles.hint, isRtl && rtlStyles.rtlText]}>{hint}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  group: stackSm,
  labelRow: spaceBetweenXs,
  label: { ...labelSemibold, flex: 1 },
  suffix: mutedCaption,
  input: {
    minHeight: 48,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSizes.sm,
    lineHeight: typography.lineHeights.sm,
    color: colors.text,
  },
  multilineInput: { minHeight: 88, paddingTop: spacing.sm, paddingBottom: spacing.sm },
  hint: { fontSize: typography.fontSizes.xs, color: colors.textMuted, lineHeight: typography.lineHeights.xs, marginTop: 3 },
});
