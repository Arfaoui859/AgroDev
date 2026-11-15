import React, { useMemo, useState } from 'react';
import { rtlStyles } from '../../theme/rtl';
import { View, Text, ScrollView, StyleSheet, Linking } from 'react-native';
import { chipScrollRow, metaRowSm, screenStyles } from '../../theme/layout';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme/colors';
import { mutedCaption } from '../../theme/typographyStyles';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from '../../components/ui/Button';
import { ServiceHeader } from '../../components/ui/ServiceHeader';
import { CategoryPill } from '../../components/ui/CategoryPill';
import { VideoCard } from '../../components/ui/VideoCard';
import {
  LEARNING_VIDEOS,
  LearningVideo,
  VIDEO_CATEGORIES,
  VideoCategory,
  videoWatchUrl,
} from '../../data/agriculturalVideos';
import { videoCategoryLabel } from '../../utils/videoLabels';

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
        <VideoCard key={video.id} video={video} variant="full" onPress={() => openVideo(video)} />
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
  catScroll: chipScrollRow,
  sourceNote: metaRowSm,
  sourceText: mutedCaption,
});
