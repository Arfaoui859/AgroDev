import React from 'react';
import { rtlStyles } from '../../theme/rtl';
import { View, Text, ScrollView, StyleSheet, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme/colors';
import { metaRowSm, stackLg } from '../../theme/layout';
import { mutedCaption } from '../../theme/typographyStyles';
import { useLanguage } from '../../context/LanguageContext';
import { SectionHeader } from '../ui/SectionHeader';
import { VideoCard } from '../ui/VideoCard';
import { LearningVideo, featuredVideos, videoWatchUrl } from '../../data/agriculturalVideos';

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
  const { t, isRtl, language } = useLanguage();
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
        contentContainerStyle={[styles.row, isRtl && rtlStyles.rtlRow]}
      >
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} variant="strip" onPress={() => openVideo(video)} />
        ))}
      </ScrollView>

      <View style={[styles.sourceNote, isRtl && rtlStyles.rtlRow]}>
        <MaterialCommunityIcons name="information-outline" size={13} color={colors.textMuted} />
        <Text style={[styles.sourceText, isRtl && rtlStyles.rtlText]}>{t.homeLearningSource}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: stackLg,
  row: { gap: spacing.md, paddingVertical: 2 },
  sourceNote: metaRowSm,
  sourceText: mutedCaption,
});
