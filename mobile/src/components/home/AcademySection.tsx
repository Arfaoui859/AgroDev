import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { rtlStyles } from '../../theme/rtl';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography, shadows } from '../../theme/colors';
import { gapMdTight, rowGapXs, stackLg } from '../../theme/layout';
import { titleSm } from '../../theme/typographyStyles';
import { useLanguage } from '../../context/LanguageContext';
import { SectionHeader } from '../ui/SectionHeader';
import { IconTile } from '../ui/IconTile';
import { ACADEMY_TOPICS, AcademyTopic } from '../../data/academy';

interface AcademySectionProps {
  /** Open a topic that maps to a video category (the learning catalogue). */
  onOpenVideos: (category?: string) => void;
  /** Open a topic that maps to an existing service screen. */
  onOpenService: (serviceId: string) => void;
}

const TINT: Record<AcademyTopic['tint'], { color: string; bg: string }> = {
  primary: { color: colors.primaryDark, bg: colors.primaryLight },
  secondary: { color: colors.secondary, bg: colors.secondaryLight },
  accent: { color: colors.accentDark, bg: colors.accentLight },
  water: { color: colors.water, bg: colors.waterLight },
  soil: { color: colors.soil, bg: colors.soilLight },
  crop: { color: colors.crop, bg: colors.cropLight },
  danger: { color: colors.danger, bg: colors.dangerLight },
};

/**
 * AgriVibe Academy — a topical index. Each tile leads to something that
 * genuinely exists: a curated video category or an existing service screen.
 * There are no decorative categories and no fabricated content.
 */
export const AcademySection: React.FC<AcademySectionProps> = ({ onOpenVideos, onOpenService }) => {
  const { x, isRtl } = useLanguage();

  const open = (topic: AcademyTopic) => {
    if (topic.videoCategory) return onOpenVideos(topic.videoCategory);
    if (topic.serviceId) return onOpenService(topic.serviceId);
  };

  return (
    <View style={styles.section}>
      <SectionHeader title={x.academyTitle} subtitle={x.academySubtitle} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.row, isRtl && rtlStyles.rtlRow]}
      >
        {ACADEMY_TOPICS.map((topic) => {
          const tint = TINT[topic.tint];
          const title = x[topic.titleKey];
          const desc = x[topic.descKey];
          const action = topic.videoCategory ? x.academyOpenVideos : x.academyOpenService;
          return (
            <TouchableOpacity
              key={topic.id}
              activeOpacity={0.85}
              onPress={() => open(topic)}
              accessibilityRole="button"
              accessibilityLabel={`${title}. ${desc}. ${action}`}
              style={styles.card}
            >
              <IconTile icon={topic.icon as any} bg={tint.bg} color={tint.color} />
              <Text style={[styles.cardTitle, isRtl && rtlStyles.rtlText]} numberOfLines={1}>
                {title}
              </Text>
              <Text style={[styles.cardDesc, isRtl && rtlStyles.rtlText]} numberOfLines={2}>
                {desc}
              </Text>
              <View style={[styles.actionRow, isRtl && rtlStyles.rtlRow]}>
                <MaterialCommunityIcons
                  name={topic.videoCategory ? 'play-circle-outline' : 'arrow-top-right'}
                  size={14}
                  color={colors.primary}
                />
                <Text style={styles.actionText}>{action}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  section: stackLg,
  row: gapMdTight,
  card: {
    width: 168,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 6,
    ...shadows.sm,
  },
  cardTitle: titleSm,
  cardDesc: { fontSize: typography.fontSizes.xs, lineHeight: 19, color: colors.textSecondary, minHeight: 38 },
  actionRow: { ...rowGapXs, marginTop: 2 },
  actionText: { fontSize: typography.fontSizes.xs, lineHeight: 18, color: colors.primary, fontWeight: typography.fontWeights.semibold },
});
