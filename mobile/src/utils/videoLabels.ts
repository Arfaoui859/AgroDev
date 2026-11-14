import { ExtraTranslations } from '../i18n/extra';
import { VideoCategory, VideoLanguage } from '../data/agriculturalVideos';

/**
 * Localised labels for the curated learning videos. Video titles and channel
 * names are the publisher's own words and are NEVER translated — only the
 * category chip, the duration unit and the spoken-language tag are localised.
 */
const CATEGORY_KEYS: Record<VideoCategory, keyof ExtraTranslations> = {
  pruning: 'videoCatPruning',
  irrigation: 'videoCatIrrigation',
  'soil-prep': 'videoCatSoilPrep',
  composting: 'videoCatComposting',
  'plant-protection': 'videoCatPlantProtection',
  'vegetable-growing': 'videoCatVegetableGrowing',
  livestock: 'videoCatLivestock',
  greenhouse: 'videoCatGreenhouse',
  harvest: 'videoCatHarvest',
};

export function videoCategoryLabel(category: VideoCategory, x: ExtraTranslations): string {
  return x[CATEGORY_KEYS[category]] ?? category;
}

export function videoLanguageLabel(language: VideoLanguage, x: ExtraTranslations): string {
  return language === 'ar' ? x.videoLanguageArabic : x.videoLanguageEnglish;
}

/** Format a duration in seconds as "m min" style, locale-aware unit. */
export function formatVideoDuration(seconds: number, x: ExtraTranslations): string {
  const safe = Number.isFinite(seconds) && seconds > 0 ? Math.round(seconds) : 0;
  const minutes = Math.max(1, Math.round(safe / 60));
  return `${minutes} ${x.videoDurationMinutes}`;
}
