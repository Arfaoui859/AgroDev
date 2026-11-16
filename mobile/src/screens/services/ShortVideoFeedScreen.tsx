import React, { useMemo, useState } from 'react';
import {
  FlatList,
  ImageBackground,
  Linking,
  ListRenderItemInfo,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../../context/LanguageContext';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { rtlStyles } from '../../theme/rtl';
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
import { videoCategoryLabel } from '../../utils/videoLabels';

interface ShortVideoFeedScreenProps {
  onBack: () => void;
  initialCategory?: VideoCategory | 'all';
}

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return minutes > 0 ? `${minutes}:${String(remainder).padStart(2, '0')}` : `0:${String(remainder).padStart(2, '0')}`;
};

/**
 * A vertical, swipe-first discovery feed built from the app's verified video
 * catalogue. The card is a preview, not an embedded player: playback opens the
 * original publisher video on YouTube. No fake likes, comments or view counts.
 */
export const ShortVideoFeedScreen: React.FC<ShortVideoFeedScreenProps> = ({
  onBack,
  initialCategory = 'all',
}) => {
  const { t, x, isRtl, language } = useLanguage();
  const { height } = useWindowDimensions();
  const [category, setCategory] = useState<VideoCategory | 'all'>(initialCategory);

  const videos = useMemo(() => {
    const filtered = category === 'all'
      ? LEARNING_VIDEOS
      : LEARNING_VIDEOS.filter((video) => video.category === category);
    const preferred = language === 'ar' ? 'ar' : 'en';
    return filtered.slice().sort((a, b) => Number(b.language === preferred) - Number(a.language === preferred));
  }, [category, language]);

  const openVideo = (video: LearningVideo) => {
    Linking.openURL(videoWatchUrl(video.id)).catch(() => undefined);
  };

  const renderVideo = ({ item, index }: ListRenderItemInfo<LearningVideo>) => (
    <View style={[styles.videoPage, { height: Math.max(380, height * 0.66) }]}>
      <ImageBackground
        source={{ uri: videoThumbnailUrl(item.id) }}
        style={styles.videoImage}
        imageStyle={styles.videoImageRadius}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.12)', 'rgba(0,0,0,0.88)']}
          locations={[0, 0.38, 1]}
          style={styles.videoShade}
        >
          <View style={[styles.topMeta, isRtl && rtlStyles.rtlRow]}>
            <View style={styles.sourcePill}>
              <MaterialCommunityIcons name="youtube" size={15} color="#FFFFFF" />
              <Text style={styles.sourcePillText}>YouTube</Text>
            </View>
            <Text style={styles.indexText}>{index + 1} / {videos.length}</Text>
          </View>

          <View style={styles.centerPlay}>
            <TouchableOpacity
              onPress={() => openVideo(item)}
              activeOpacity={0.86}
              accessibilityRole="button"
              accessibilityLabel={language === 'ar' ? 'شاهد الفيديو' : 'Watch video'}
              style={styles.playButton}
            >
              <MaterialCommunityIcons name="play" size={34} color={colors.brandDeep} />
            </TouchableOpacity>
          </View>

          <View style={styles.videoInfo}>
            <View style={[styles.creatorRow, isRtl && rtlStyles.rtlRow]}>
              <View style={styles.creatorAvatar}>
                <MaterialCommunityIcons name="sprout" size={17} color={colors.brandDeep} />
              </View>
              <Text style={styles.creatorName} numberOfLines={1}>{item.channel}</Text>
              <View style={styles.durationPill}>
                <MaterialCommunityIcons name="clock-outline" size={12} color="#FFFFFF" />
                <Text style={styles.durationText}>{formatDuration(item.durationSeconds)}</Text>
              </View>
            </View>
            <Text style={[styles.videoTitle, isRtl && rtlStyles.rtlText]} numberOfLines={3}>{item.title}</Text>
            <Text style={[styles.videoCategory, isRtl && rtlStyles.rtlText]}>
              {videoCategoryLabel(item.category, x)}
            </Text>
            <TouchableOpacity
              onPress={() => openVideo(item)}
              activeOpacity={0.88}
              style={[styles.watchButton, isRtl && rtlStyles.rtlRow]}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="play-circle" size={19} color={colors.brandDeep} />
              <Text style={styles.watchButtonText}>{language === 'ar' ? 'شاهد الفيديو كاملاً' : language === 'fr' ? 'Regarder la vidéo' : 'Watch full video'}</Text>
              <MaterialCommunityIcons name={isRtl ? 'arrow-left' : 'arrow-right'} size={17} color={colors.brandDeep} />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );

  return (
    <View style={styles.container}>
      <ServiceHeader
        icon="play-box-multiple-outline"
        iconColor={colors.danger}
        iconBg={colors.dangerLight}
        title={language === 'ar' ? 'اكتشف بالفيديو' : language === 'fr' ? 'Découvrir en vidéo' : 'Discover in video'}
        subtitle={language === 'ar' ? 'محتوى فلاحي مختار حسب اهتماماتك' : language === 'fr' ? 'Des vidéos agricoles sélectionnées par thème' : 'Curated agricultural videos by topic'}
      />

      <FlatList
        horizontal
        data={['all', ...VIDEO_CATEGORIES] as (VideoCategory | 'all')[]}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.categories, isRtl && rtlStyles.rtlRow]}
        renderItem={({ item }) => (
          <CategoryPill
            label={item === 'all' ? t.viewAll : videoCategoryLabel(item, x)}
            selected={category === item}
            onPress={() => setCategory(item)}
          />
        )}
      />

      {videos.length ? (
        <FlatList
          key={category}
          data={videos}
          keyExtractor={(item) => item.id}
          renderItem={renderVideo}
          pagingEnabled
          snapToAlignment="start"
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          viewabilityConfig={{ itemVisiblePercentThreshold: 70 }}
          contentContainerStyle={styles.feedContent}
          initialNumToRender={2}
          windowSize={3}
          removeClippedSubviews
        />
      ) : (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="video-off-outline" size={36} color={colors.textMuted} />
          <Text style={styles.emptyText}>{language === 'ar' ? 'ما فماش فيديوهات في التصنيف هذا حالياً.' : language === 'fr' ? 'Aucune vidéo dans cette catégorie pour le moment.' : 'No videos in this category yet.'}</Text>
        </View>
      )}

      <View style={[styles.footer, isRtl && rtlStyles.rtlRow]}>
        <MaterialCommunityIcons name="information-outline" size={14} color={colors.textMuted} />
        <Text style={styles.footerText}>
          {language === 'ar'
            ? 'الفيديوهات من قنواتها الأصلية. المشاهدة الكاملة تفتح على YouTube؛ ما فماش مشاهدات أو تفاعلات وهمية.'
            : language === 'fr'
              ? 'Vidéos des chaînes originales. La lecture complète s’ouvre sur YouTube.'
              : 'Videos stay with their original publishers. Full playback opens on YouTube.'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  categories: { gap: spacing.xs, paddingVertical: spacing.sm },
  feedContent: { paddingBottom: spacing.sm },
  videoPage: { width: '100%', paddingBottom: spacing.sm },
  videoImage: { flex: 1, justifyContent: 'space-between', backgroundColor: colors.brandDeep, borderRadius: radius.xl, overflow: 'hidden' },
  videoImageRadius: { borderRadius: radius.xl },
  videoShade: { flex: 1, justifyContent: 'space-between', padding: spacing.md },
  topMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sourcePill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.48)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.full },
  sourcePillText: { color: '#FFFFFF', fontSize: typography.fontSizes.xs, fontWeight: typography.fontWeights.semibold },
  indexText: { color: '#FFFFFF', fontSize: typography.fontSizes.xs, fontWeight: typography.fontWeights.semibold, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 9, paddingVertical: 6, borderRadius: radius.full },
  centerPlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  playButton: { width: 68, height: 68, borderRadius: 34, backgroundColor: 'rgba(255,255,255,0.94)', alignItems: 'center', justifyContent: 'center' },
  videoInfo: { gap: spacing.sm },
  creatorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  creatorAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  creatorName: { color: '#FFFFFF', fontSize: typography.fontSizes.sm, fontWeight: typography.fontWeights.semibold, flex: 1 },
  durationPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.42)', borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 5 },
  durationText: { color: '#FFFFFF', fontSize: typography.fontSizes.xs },
  videoTitle: { color: '#FFFFFF', fontSize: typography.fontSizes.lg, lineHeight: 27, fontWeight: typography.fontWeights.bold, textShadowColor: 'rgba(0,0,0,0.55)', textShadowRadius: 8 },
  videoCategory: { color: 'rgba(255,255,255,0.82)', fontSize: typography.fontSizes.sm },
  watchButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: '#FFFFFF', borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  watchButtonText: { color: colors.brandDeep, fontSize: typography.fontSizes.sm, fontWeight: typography.fontWeights.bold },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  emptyText: { color: colors.textSecondary, fontSize: typography.fontSizes.sm },
  footer: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs, paddingVertical: spacing.sm },
  footerText: { color: colors.textMuted, fontSize: typography.fontSizes.xs, lineHeight: 17, flex: 1 },
});
