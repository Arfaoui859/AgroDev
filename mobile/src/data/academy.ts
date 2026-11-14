import { VideoCategory } from './agriculturalVideos';
import { ExtraTranslations } from '../i18n/extra';

/**
 * AgroGrowth Academy — the topical index that links each learning theme to the
 * real content or service that covers it. Every entry points at something the
 * platform genuinely has: a curated video category (real YouTube content) or an
 * existing service screen. Nothing here is a decorative button.
 */
export interface AcademyTopic {
  id: string;
  /** Localised title key. */
  titleKey: keyof ExtraTranslations;
  /** Localised one-line description key. */
  descKey: keyof ExtraTranslations;
  icon: string;
  /** Accent colour token from the theme. */
  tint: 'primary' | 'secondary' | 'accent' | 'water' | 'soil' | 'crop' | 'danger';
  /** Where the topic leads. Exactly one of these is set. */
  videoCategory?: VideoCategory;
  serviceId?: string;
  tab?: string;
}

export const ACADEMY_TOPICS: AcademyTopic[] = [
  {
    id: 'planting',
    titleKey: 'academyPlanting',
    descKey: 'academyPlantingDesc',
    icon: 'seed-outline',
    tint: 'crop',
    serviceId: 'crops',
  },
  {
    id: 'soil',
    titleKey: 'academySoil',
    descKey: 'academySoilDesc',
    icon: 'flask-outline',
    tint: 'soil',
    serviceId: 'soil',
  },
  {
    id: 'irrigation',
    titleKey: 'academyIrrigation',
    descKey: 'academyIrrigationDesc',
    icon: 'water-pump',
    tint: 'water',
    videoCategory: 'irrigation',
  },
  {
    id: 'fertilisation',
    titleKey: 'academyFertilisation',
    descKey: 'academyFertilisationDesc',
    icon: 'compost',
    tint: 'accent',
    videoCategory: 'composting',
  },
  {
    id: 'diseases',
    titleKey: 'academyDiseases',
    descKey: 'academyDiseasesDesc',
    icon: 'camera-iris',
    tint: 'danger',
    serviceId: 'live_scan',
  },
  {
    id: 'pest',
    titleKey: 'academyPest',
    descKey: 'academyPestDesc',
    icon: 'bug-outline',
    tint: 'danger',
    serviceId: 'pest',
  },
  {
    id: 'pruning',
    titleKey: 'academyPruning',
    descKey: 'academyPruningDesc',
    icon: 'content-cut',
    tint: 'primary',
    videoCategory: 'pruning',
  },
  {
    id: 'harvest',
    titleKey: 'academyHarvest',
    descKey: 'academyHarvestDesc',
    icon: 'basket-outline',
    tint: 'secondary',
    videoCategory: 'harvest',
  },
  {
    id: 'livestock',
    titleKey: 'academyLivestock',
    descKey: 'academyLivestockDesc',
    icon: 'cow',
    tint: 'accent',
    serviceId: 'livestock',
  },
  {
    id: 'technology',
    titleKey: 'academyTechnology',
    descKey: 'academyTechnologyDesc',
    icon: 'robot-happy-outline',
    tint: 'primary',
    serviceId: 'multi_agent',
  },
];
