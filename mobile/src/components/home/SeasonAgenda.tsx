import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { useLanguage } from '../../context/LanguageContext';
import { SectionHeader } from '../ui/SectionHeader';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Season, seasonForMonth, seasonLabel, seasonTip } from '../../utils/season';

const SEASON_ICON: Record<Season, keyof typeof MaterialCommunityIcons.glyphMap> = {
  winter: 'snowflake',
  spring: 'flower-tulip-outline',
  summer: 'white-balance-sunny',
  autumn: 'leaf-maple',
};

const SEASON_TINT: Record<Season, { color: string; bg: string }> = {
  winter: { color: colors.secondaryDark, bg: colors.secondaryLight },
  spring: { color: colors.primaryDark, bg: colors.primaryLight },
  summer: { color: colors.accentDark, bg: colors.accentLight },
  autumn: { color: colors.soil, bg: colors.soilLight },
};

/**
 * A generic, season-based farming reminder. This is indicative editorial
 * guidance for the northern-hemisphere (Tunisian) calendar — it is explicitly
 * NOT personalised to the user's farm and carries no AI or data claim, so the
 * "general guidance" badge keeps it honest.
 */
export const SeasonAgenda: React.FC = () => {
  const { t, x, isRtl } = useLanguage();
  const season = seasonForMonth(new Date().getMonth());
  const tint = SEASON_TINT[season];

  return (
    <View style={styles.section}>
      <SectionHeader
        title={t.homeSeasonTitle}
        trailing={<Badge label={t.homeSeasonGeneral} variant="accent" size="sm" />}
      />
      <Card variant="elevated" style={styles.card}>
        <View style={[styles.row, isRtl && styles.rtlRow]}>
          <View style={[styles.iconWrap, { backgroundColor: tint.bg }]}>
            <MaterialCommunityIcons name={SEASON_ICON[season]} size={26} color={tint.color} />
          </View>
          <View style={styles.textWrap}>
            <Text style={[styles.seasonName, isRtl && styles.rtlText]}>{seasonLabel(season, x)}</Text>
            <Text style={[styles.tip, isRtl && styles.rtlText]}>{seasonTip(season, x)}</Text>
          </View>
        </View>
        <Text style={[styles.note, isRtl && styles.rtlText]}>{t.homeSeasonSubtitle}</Text>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  section: { marginBottom: spacing.lg },
  card: { padding: spacing.md },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  rtlRow: { flexDirection: 'row-reverse' },
  rtlText: { textAlign: 'right', writingDirection: 'rtl' },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  seasonName: { fontSize: typography.fontSizes.base, lineHeight: typography.lineHeights.base, fontWeight: typography.fontWeights.bold, color: colors.text },
  tip: { fontSize: typography.fontSizes.xs, lineHeight: typography.lineHeights.sm, color: colors.textSecondary, marginTop: 2 },
  note: { fontSize: typography.fontSizes.xs, lineHeight: typography.lineHeights.xs, color: colors.textMuted, marginTop: spacing.sm },
});
