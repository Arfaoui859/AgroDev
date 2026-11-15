import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, spacing, typography } from '../../theme/colors';
import { rtlStyles } from '../../theme/rtl';
import { useLanguage } from '../../context/LanguageContext';
import { ProvenanceMeta } from '../../types';
import { ProvenanceBadge } from './ProvenanceBadge';

interface ProvenanceBarProps {
  meta: ProvenanceMeta;
  /** Show the source/disclaimer line under the badge. */
  detailed?: boolean;
  /** Show the "served from the offline cache" note next to the badge. */
  cached?: boolean;
  /** Outer spacing, e.g. `{ marginBottom: spacing.sm }`. */
  style?: StyleProp<ViewStyle>;
}

/**
 * The standard provenance row: a `ProvenanceBadge` plus, when the payload came
 * from the offline cache, the honest "from cache" note. Screens that surface a
 * server result use this so the provenance contract is rendered the same way
 * everywhere instead of being re-assembled per screen.
 */
export const ProvenanceBar: React.FC<ProvenanceBarProps> = ({ meta, detailed = false, cached = false, style }) => {
  const { x, isRtl } = useLanguage();
  return (
    <View style={[styles.bar, isRtl && rtlStyles.rtlRow, style]}>
      <ProvenanceBadge meta={meta} detailed={detailed} />
      {cached ? <Text style={[styles.cachedTag, isRtl && rtlStyles.rtlText]}>{x.cachedNotice}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  cachedTag: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
    lineHeight: typography.lineHeights.xs,
  },
});
