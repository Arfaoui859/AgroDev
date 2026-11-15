import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, typography } from '../../theme/colors';
import { useLanguage } from '../../context/LanguageContext';

interface ScreenHeadingProps {
  title: string;
  subtitle?: string;
  /** Optional leading node (e.g. an avatar or icon badge). */
  leading?: React.ReactNode;
  /** Layout overrides for the wrapping row (e.g. to remove the bottom margin). */
  style?: ViewStyle;
}

/**
 * The title block at the top of a tab root screen (Services, Marketplace,
 * Assistant). The app header shows only the brand for tab roots, so each tab
 * carries its own heading; this component keeps that heading identical across
 * all of them and RTL-correct.
 */
export const ScreenHeading: React.FC<ScreenHeadingProps> = ({ title, subtitle, leading, style }) => {
  const { isRtl } = useLanguage();
  return (
    <View style={[styles.headerBox, isRtl && styles.rtlRow, style]}>
      {leading}
      <View style={styles.textWrap}>
        <Text style={[styles.title, isRtl && styles.rtlText]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, isRtl && styles.rtlText]}>{subtitle}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  textWrap: { flex: 1 },
  title: {
    fontSize: typography.fontSizes.xl,
    lineHeight: 30,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.fontSizes.sm,
    lineHeight: 21,
    color: colors.textSecondary,
    marginTop: 3,
  },
  rtlRow: { flexDirection: 'row-reverse' },
  rtlText: { textAlign: 'right', writingDirection: 'rtl' },
});
