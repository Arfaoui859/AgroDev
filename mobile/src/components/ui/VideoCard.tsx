import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography, shadows } from '../../theme/colors';
import { mutedCaption, subtleCaption, titleSm } from '../../theme/typographyStyles';
import { rtlStyles } from '../../theme/rtl';
import { useLanguage } from '../../context/LanguageContext';
import { LearningVideo, videoThumbnailUrl } from '../../data/agriculturalVideos';
import { formatVideoDuration, videoCategoryLabel, videoLanguageLabel } from '../../utils/videoLabels';

type VideoCardVariant = 'strip' | 'full';

interface VideoCardProps {
  video: LearningVideo;
  /**
   * `strip` is the compact horizontal-scroll card on Home; `full` is the
   * full-width card in the Learning Videos catalogue. They share the thumbnail,
   * duration pill, category/language tags and YouTube attribution; only the
   * sizes and the second line differ.
   */
  variant?: VideoCardVariant;
  onPress: () => void;
}

/**
 * One curated agricultural video. Everything shown is a real, publicly
 * available YouTube video (see `src/data/agriculturalVideos.ts`): the title and
 * channel are shown verbatim, the thumbnail is YouTube's own, and playback
 * always opens on youtube.com. The platform does not re-host or claim the
 * content.
 */
export const VideoCard: React.FC<VideoCardProps> = ({ video, variant = 'full', onPress }) => {
  const { t, x, isRtl } = useLanguage();
  const strip = variant === 'strip';

  return (
    <TouchableOpacity
      activeOpacity={strip ? 0.88 : 0.9}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${video.title}. ${video.channel}. ${t.homeWatchVideo}`}
      accessibilityHint={t.homeLearningSource}
      style={[styles.card, strip ? styles.cardStrip : styles.cardFull]}
    >
      <View style={[styles.thumbWrap, strip ? styles.thumbStrip : styles.thumbFull]}>
        <Image
          source={{ uri: videoThumbnailUrl(video.id) }}
          style={styles.thumb}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
        <View style={styles.playOverlay}>
          <MaterialCommunityIcons name="play-circle" size={strip ? 40 : 44} color={colors.textInverse} />
        </View>
        <View style={[styles.durationPill, strip ? styles.durationPillStrip : styles.durationPillFull]}>
          <Text style={styles.durationText}>{formatVideoDuration(video.durationSeconds, x)}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={[styles.tagRow, isRtl && rtlStyles.rtlRow]}>
          <View style={[styles.catTag, isRtl && rtlStyles.rtlRow]}>
            <Text style={styles.catTagText}>{videoCategoryLabel(video.category, x)}</Text>
          </View>
          <Text style={styles.langTag}>{videoLanguageLabel(video.language, x)}</Text>
        </View>

        <Text
          style={[styles.videoTitle, strip && styles.videoTitleStrip, isRtl && rtlStyles.rtlText]}
          numberOfLines={strip ? 2 : 3}
        >
          {video.title}
        </Text>

        {strip ? (
          <>
            <Text style={[styles.channel, isRtl && rtlStyles.rtlText]} numberOfLines={1}>
              {video.channel}
            </Text>
            <View style={[styles.watchRow, isRtl && rtlStyles.rtlRow]}>
              <MaterialCommunityIcons name="youtube" size={16} color={colors.danger} />
              <Text style={styles.watchText}>{t.homeWatchVideo}</Text>
            </View>
          </>
        ) : (
          <View style={[styles.watchRow, isRtl && rtlStyles.rtlRow]}>
            <MaterialCommunityIcons name="youtube" size={16} color={colors.danger} />
            <Text style={styles.channelRow} numberOfLines={1}>
              {video.channel}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.sm,
  },
  cardStrip: { width: 232 },
  cardFull: { marginBottom: spacing.md },
  thumbWrap: { width: '100%', backgroundColor: colors.surfaceSubtle },
  thumbStrip: { height: 130 },
  thumbFull: { height: 180 },
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
    backgroundColor: colors.scrimStrong,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  durationPillStrip: { bottom: 6, right: 6 },
  durationPillFull: { bottom: 8, right: 8 },
  durationText: {
    color: colors.textInverse,
    fontSize: typography.fontSizes.xs,
    lineHeight: typography.lineHeights.xs,
    fontWeight: typography.fontWeights.semibold,
  },
  cardBody: { padding: spacing.md, gap: spacing.xs },
  tagRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs },
  catTag: { backgroundColor: colors.primaryLight, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  catTagText: { fontSize: typography.fontSizes.xs, lineHeight: typography.lineHeights.xs, color: colors.primaryDark, fontWeight: typography.fontWeights.semibold },
  langTag: mutedCaption,
  videoTitle: titleSm,
  videoTitleStrip: { minHeight: 42 },
  watchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  watchText: { fontSize: typography.fontSizes.xs, lineHeight: typography.lineHeights.xs, color: colors.danger, fontWeight: typography.fontWeights.semibold },
  channel: subtleCaption,
  channelRow: { flex: 1, fontSize: typography.fontSizes.xs, lineHeight: typography.lineHeights.xs, color: colors.textSecondary },
});
