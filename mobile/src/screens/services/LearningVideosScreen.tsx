import React, { useMemo, useState } from 'react';
import { rtlStyles } from '../../theme/rtl';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
} from 'react-native';
import { screenStyles } from '../../theme/layout';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography, shadows } from '../../theme/colors';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from '../../components/ui/Button';
import { ServiceHeader } from '../../components/ui/ServiceHeader';
import { CategoryPill } from '../../components/ui/CategoryPill';
import {
  LEARNING_VIDEOS,
  LearningVideo,
  VIDEO_CATEGORIES,
  VideoCategory,
  videoThumbnailUrl,
  videoWatchUrl,
} from '../../data/agriculturalVideos';
import { formatVideoDuration, videoCategoryLabel, videoLanguageLabel } from '../../utils/videoLabels';

interface LearningVideosScreenProps {
  onBack: () => void;
  /** Optional category to open pre-selected (used by the Academy tiles). */
  initialCategory?: VideoCategory | 'all';
}

/**
 * Full catalogue of the curated agricultural learning videos. Everything shown
 * here is a real, publicly available YouTube video (see
 * `src/data/agriculturalVideos.ts`); playback always opens on youtube.com. The
 * catalogue is a static editorial selection — it is not a live or personalised
 * feed and says so.
 */
export const LearningVideosScreen: React.FC<LearningVideosScreenProps> = ({ onBack, initialCategory = 'all' }) => {
  const { t, x, isRtl, language } = useLanguage();
  const [category, setCategory] = useState<VideoCategory | 'all'>(initialCategory);

  const visible = useMemo(() => {
    const filtered = category === 'all' ? LEARNING_VIDEOS : LEARNING_VIDEOS.filter((v) => v.category === category);
    // Show the caller's language first, then the rest.
    const preferred = language === 'ar' ? 'ar' : 'en';
    return filtered
      .slice()
      .sort((a, b) => Number(b.language === preferred) - Number(a.language === preferred));
  }, [category, language]);

  const openVideo = (video: LearningVideo) => {
    Linking.openURL(videoWatchUrl(video.id)).catch(() => {});
  };

  return (
    <ScrollView style={screenStyles.container} contentContainerStyle={screenStyles.content} showsVerticalScrollIndicator={false}>
      <ServiceHeader
        icon="play-box-multiple-outline"
        iconColor={colors.danger}
        iconBg={colors.dangerLight}
        title={t.homeLearningTitle}
        subtitle={t.homeLearningSubtitle}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.catScroll, isRtl && rtlStyles.rtlRow]}
      >
        <CategoryPill
          label={t.viewAll}
          selected={category === 'all'}
          onPress={() => setCategory('all')}
        />
        {VIDEO_CATEGORIES.map((cat) => (
          <CategoryPill
            key={cat}
            label={videoCategoryLabel(cat, x)}
            selected={category === cat}
            onPress={() => setCategory(cat)}
          />
        ))}
      </ScrollView>

      {visible.map((video) => (
        <TouchableOpacity
          key={video.id}
          activeOpacity={0.9}
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
              <MaterialCommunityIcons name="play-circle" size={44} color={colors.textInverse} />
            </View>
            <View style={styles.durationPill}>
              <Text style={styles.durationText}>{formatVideoDuration(video.durationSeconds, x)}</Text>
            </View>
          </View>
          <View style={styles.cardBody}>
            <View style={[styles.tagRow, isRtl && rtlStyles.rtlRow]}>
              <View style={styles.catTag}>
                <Text style={styles.catTagText}>{videoCategoryLabel(video.category, x)}</Text>
              </View>
              <Text style={styles.langTag}>{videoLanguageLabel(video.language, x)}</Text>
            </View>
            <Text style={[styles.videoTitle, isRtl && rtlStyles.rtlText]} numberOfLines={3}>
              {video.title}
            </Text>
            <View style={[styles.watchRow, isRtl && rtlStyles.rtlRow]}>
              <MaterialCommunityIcons name="youtube" size={16} color={colors.danger} />
              <Text style={styles.channel} numberOfLines={1}>
                {video.channel}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}

      <View style={[styles.sourceNote, isRtl && rtlStyles.rtlRow]}>
        <MaterialCommunityIcons name="information-outline" size={13} color={colors.textMuted} />
        <Text style={[styles.sourceText, isRtl && rtlStyles.rtlText]}>{t.homeLearningSource}</Text>
      </View>

      <Button title={t.back} variant="outline" onPress={onBack} style={{ marginTop: spacing.lg }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  catScroll: { gap: spacing.xs, paddingBottom: spacing.md },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  thumbWrap: { width: '100%', height: 180, backgroundColor: colors.surfaceSubtle },
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
    bottom: 8,
    right: 8,
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
  videoTitle: { fontSize: typography.fontSizes.sm, lineHeight: typography.lineHeights.sm, fontWeight: typography.fontWeights.bold, color: colors.text },
  watchRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  channel: { flex: 1, fontSize: typography.fontSizes.xs, lineHeight: typography.lineHeights.xs, color: colors.textSecondary },
  sourceNote: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm },
  sourceText: { fontSize: typography.fontSizes.xs, lineHeight: typography.lineHeights.xs, color: colors.textMuted },
});
