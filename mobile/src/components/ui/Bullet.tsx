import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme/colors';
import { rtlStyles } from '../../theme/rtl';
import { useLanguage } from '../../context/LanguageContext';

type BulletVariant = 'dot' | 'icon' | 'glyph';

interface BulletProps {
  text: string;
  /** Marker: a filled `dot`, a `circle-medium` icon, or a `glyph` (•). */
  variant?: BulletVariant;
  /** Marker colour. Defaults to the primary brand colour. */
  color?: string;
}

const DEFAULTS: Record<BulletVariant, string> = {
  dot: colors.primary,
  icon: colors.primary,
  glyph: colors.primaryDark,
};

/**
 * A single list item with a leading marker, RTL-aware. Screens render these for
 * recommendations, causes and limitations; the marker style is the only thing
 * that varies, so it is the only thing this component parameterises.
 */
export const Bullet: React.FC<BulletProps> = ({ text, variant = 'dot', color }) => {
  const { isRtl } = useLanguage();
  const tint = color ?? DEFAULTS[variant];
  return (
    <View style={[styles.row, styles[`row_${variant}`], isRtl && rtlStyles.rtlRow]}>
      {variant === 'dot' ? (
        <View style={[styles.dot, { backgroundColor: tint }]} />
      ) : variant === 'icon' ? (
        <MaterialCommunityIcons name="circle-medium" size={16} color={tint} />
      ) : (
        <Text style={[styles.glyph, { color: tint }]}>•</Text>
      )}
      <Text style={[styles.text, variant === 'glyph' && styles.textLoose, isRtl && rtlStyles.rtlText]}>
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  row_dot: { alignItems: 'flex-start', gap: spacing.sm, marginBottom: 6 },
  row_icon: { alignItems: 'flex-start', gap: spacing.xs, marginBottom: spacing.xs },
  row_glyph: { gap: 6, marginBottom: 3 },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  glyph: { fontSize: typography.fontSizes.sm, lineHeight: typography.lineHeights.sm },
  text: { flex: 1, fontSize: typography.fontSizes.sm, color: colors.textSecondary, lineHeight: typography.lineHeights.xs },
  textLoose: { lineHeight: typography.lineHeights.sm },
});
