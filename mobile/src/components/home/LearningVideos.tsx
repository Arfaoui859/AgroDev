import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography, shadows } from '../../theme/colors';
import { useLanguage } from '../../context/LanguageContext';
import { SectionHeader } from '../ui/SectionHeader';
import {
  LearningVideo,
  featuredVideos,
  videoThumbnailUrl,
  videoWatchUrl,
} from '../../data/agriculturalVideos';
import { formatVideoDuration, videoCategoryLabel, videoLanguageLabel } from '../../utils/videoLabels';

interface LearningVideosProps {
  onOpenAll?: () => void;
}

/**
 * A horizontally scrolling strip of curated agricultural video tutorials.
 *
 * These are real, publicly available YouTube videos (see
 * `src/data/agriculturalVideos.ts`). Titles and channel names are shown verbatim
 * — the platform does not re-host, transcode or claim ownership of the content.
 * Playback always opens on youtube.com so the platform's terms apply.
 */
export const LearningVideos: React.FC<LearningVideosProps> = ({ onOpenAll }) => {
  const { t, x, isRtl, language } = useLanguage();
  const videos = featuredVideos(language, 8);

  const openVideo = (video: LearningVideo) => {
    Linking.openURL(videoWatchUrl(video.id)).catch(() => {
      /* the OS link handler is the only failure path; nothing to recover */
    });
  };

  return (
    <View style={styles.section}>
      <SectionHeader
        title={t.homeLearningTitle}
        subtitle={t.homeLearningSubtitle}
        actionLabel={onOpenAll ? t.viewAll : undefined}
        onAction={onOpenAll}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.row, isRtl && styles.rtlRow]}
      >
        {videos.map((video) => (
          <TouchableOpacity
            key={video.id}
            activeOpacity={0.88}
            onPress={() => openVideo(video)}
            accessibilityRole="button"
            accessibilityLabel={`${video.title}. ${video.channel}. ${t.homeWatchVideo}`}
            accessibilityHint={t.homeLearningSource}
            style={styles.card}
          >
            <View style={styles.thumbWrap}>
              <Image
                source={{ uri: videoThumbnailUrl(video.id) }}
                style={styles.thumb}
                resizeMode="cover"
                accessibilityIgnoresInvertColors
              />
              <View style={styles.playOverlay}>
                <MaterialCommunityIcons name="play-circle" size={40} color={colors.textInverse} />
              </View>
              <View style={styles.durationPill}>
                <Text style={styles.durationText}>{formatVideoDuration(video.durationSeconds, x)}</Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <View style={[styles.tagRow, isRtl && styles.rtlRow]}>
                <View style={[styles.catTag, isRtl && styles.rtlRow]}>
                  <Text style={styles.catTagText}>{videoCategoryLabel(video.category, x)}</Text>
                </View>
                <Text style={styles.langTag}>{videoLanguageLabel(video.language, x)}</Text>
              </View>
              <Text style={[styles.videoTitle, isRtl && styles.rtlText]} numberOfLines={2}>
                {video.title}
              </Text>
              <Text style={[styles.channel, isRtl && styles.rtlText]} numberOfLines={1}>
                {video.channel}
              </Text>
              <View style={[styles.watchRow, isRtl && styles.rtlRow]}>
                <MaterialCommunityIcons name="youtube" size={16} color={colors.danger} />
                <Text style={styles.watchText}>{t.homeWatchVideo}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={[styles.sourceNote, isRtl && styles.rtlRow]}>
        <MaterialCommunityIcons name="information-outline" size={13} color={colors.textMuted} />
        <Text style={[styles.sourceText, isRtl && styles.rtlText]}>{t.homeLearningSource}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: { marginBottom: spacing.lg },
  row: { gap: spacing.md, paddingVertical: 2 },
  rtlRow: { flexDirection: 'row-reverse' },
  rtlText: { textAlign: 'right', writingDirection: 'rtl' },
  card: {
    width: 232,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.sm,
  },
  thumbWrap: { width: '100%', height: 130, backgroundColor: colors.surfaceSubtle },
  thumb: { width: '100%', height: '100%' },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.scrimLight,
  },
  durationPill: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: colors.scrimStrong,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  durationText: { color: colors.textInverse, fontSize: typography.fontSizes.xs, lineHeight: 18, fontWeight: typography.fontWeights.semibold },
  cardBody: { padding: spacing.md, gap: 4 },
  tagRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs },
  catTag: { backgroundColor: colors.primaryLight, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  catTagText: { fontSize: typography.fontSizes.xs, lineHeight: 18, color: colors.primaryDark, fontWeight: typography.fontWeights.semibold },
  langTag: { fontSize: typography.fontSizes.xs, lineHeight: 18, color: colors.textMuted },
  videoTitle: { fontSize: typography.fontSizes.sm, lineHeight: typography.lineHeights.sm, fontWeight: typography.fontWeights.bold, color: colors.text, minHeight: 42 },
  channel: { fontSize: typography.fontSizes.xs, lineHeight: typography.lineHeights.xs, color: colors.textSecondary },
  watchRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.xs },
  watchText: { fontSize: typography.fontSizes.xs, lineHeight: typography.lineHeights.xs, color: colors.danger, fontWeight: typography.fontWeights.semibold },
  sourceNote: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm },
  sourceText: { fontSize: typography.fontSizes.xs, lineHeight: typography.lineHeights.xs, color: colors.textMuted },
});
