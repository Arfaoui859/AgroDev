import React from 'react';
import { View, Text, TextInput, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme/colors';
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
}) => {
  const { isRtl } = useLanguage();
  return (
    <View style={[styles.group, style]}>
      <View style={[styles.labelRow, isRtl && styles.rtlRow]}>
        <Text style={[styles.label, isRtl && styles.rtlText]}>{label}</Text>
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      </View>
      <TextInput
        style={[styles.input, isRtl && styles.rtlText]}
        keyboardType={keyboard}
        inputMode={keyboard === 'default' ? 'text' : 'decimal'}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? '—'}
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={label}
      />
      {hint ? <Text style={[styles.hint, isRtl && styles.rtlText]}>{hint}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  group: { marginBottom: spacing.sm },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  rtlRow: { flexDirection: 'row-reverse' },
  rtlText: { textAlign: 'right', writingDirection: 'rtl' },
  label: { flex: 1, fontSize: typography.fontSizes.xs, fontWeight: typography.fontWeights.semibold, color: colors.text, lineHeight: 20 },
  suffix: { fontSize: typography.fontSizes.xs, color: colors.textMuted, lineHeight: 20 },
  input: {
    minHeight: 48,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSizes.sm,
    lineHeight: 21,
    color: colors.text,
  },
  hint: { fontSize: typography.fontSizes.xs, color: colors.textMuted, lineHeight: 20, marginTop: 3 },
});
