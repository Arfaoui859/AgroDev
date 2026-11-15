import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { rtlStyles } from '../../theme/rtl';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography } from '../../theme/colors';
import { badgePill } from '../../theme/layout';
import { mutedCaptionTop } from '../../theme/typographyStyles';
import { useLanguage } from '../../context/LanguageContext';
import { ProvenanceMeta } from '../../types';
import { provenanceLabel } from '../../utils/provenance';

interface ProvenanceBadgeProps {
  meta: ProvenanceMeta;
  /** Show the source/disclaimer line under the badge. */
  detailed?: boolean;
}

/**
 * Renders exactly where a result came from. This is the mobile counterpart of
 * the platform's data-provenance convention: a rule-based answer is never shown
 * as model inference, and an unavailable service is never shown as a result.
 */
export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({ meta, detailed = false }) => {
  const { language, isRtl } = useLanguage();

  const iconByKind: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
    'live-observation': 'satellite-variant',
    database: 'database',
    'trained-model': 'brain',
    llm: 'robot',
    'vision-model': 'camera-iris',
    'rule-based': 'script-text-outline',
    unavailable: 'cloud-off-outline',
  };

  const paletteByKind: Record<string, { bg: string; fg: string }> = {
    'live-observation': { bg: colors.successLight, fg: colors.success },
    database: { bg: colors.infoLight, fg: colors.info },
    'trained-model': { bg: colors.primaryLight, fg: colors.primaryDark },
    llm: { bg: colors.primaryLight, fg: colors.primaryDark },
    'vision-model': { bg: colors.primaryLight, fg: colors.primaryDark },
    'rule-based': { bg: colors.accentLight, fg: colors.accentDark },
    unavailable: { bg: colors.surfaceSubtle, fg: colors.textMuted },
  };

  const icon = iconByKind[meta.provenance] ?? iconByKind.unavailable;
  const palette = paletteByKind[meta.provenance] ?? paletteByKind.unavailable;
  const label = provenanceLabel(meta.provenance, language);

  return (
    <View style={[styles.wrapper, isRtl && styles.rtlWrapper]}>
      <View style={[styles.badge, isRtl && rtlStyles.rtlRow, { backgroundColor: palette.bg }]}>
        <MaterialCommunityIcons name={icon} size={13} color={palette.fg} />
        <Text style={[styles.label, { color: palette.fg }]}>{label}</Text>
      </View>
      {detailed && meta.source ? <Text style={[styles.source, isRtl && rtlStyles.rtlText]}>{meta.source}</Text> : null}
      {detailed && meta.disclaimer ? (
        <Text style={[styles.disclaimer, isRtl && rtlStyles.rtlText]}>{meta.disclaimer}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'flex-start',
  },
  rtlWrapper: {
    alignItems: 'flex-end',
  },
  badge: badgePill,
  label: {
    fontSize: typography.fontSizes.xs,
    lineHeight: typography.lineHeights.xs,
    fontWeight: typography.fontWeights.semibold,
  },
  source: {
    fontSize: typography.fontSizes.xs,
    lineHeight: typography.lineHeights.xs,
    color: colors.textMuted,
    marginTop: 3,
  },
  disclaimer: mutedCaptionTop,
});
