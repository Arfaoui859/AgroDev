import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, typography } from '../../theme/colors';
import { centerText, mutedCaptionTop } from '../../theme/typographyStyles';

interface StatTileProps {
  label: string;
  value: string | number;
  /** Value colour; defaults to the primary text colour. */
  color?: string;
  /** Extra container style, e.g. `{ flex: 1 }` in a divided summary row. */
  style?: StyleProp<ViewStyle>;
  /** Centre the caption under the value (equal-width tiles). */
  centerLabel?: boolean;
}

/**
 * The stacked value-over-label statistic tile shown in the livestock and
 * multi-agent summary rows. Both screens rendered the identical control.
 */
export const StatTile: React.FC<StatTileProps> = ({ label, value, color, style, centerLabel = false }) => (
  <View style={[styles.tile, style]}>
    <Text style={[styles.value, { color: color ?? colors.text }]}>{value}</Text>
    <Text style={[styles.label, centerLabel && styles.labelCentered]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  tile: { alignItems: 'center' },
  value: {
    fontSize: typography.fontSizes.xl,
    lineHeight: typography.lineHeights.xl,
    fontWeight: typography.fontWeights.bold,
  },
  label: mutedCaptionTop,
  labelCentered: centerText,
});
