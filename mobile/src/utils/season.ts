import { ExtraTranslations } from '../i18n/extra';

export type Season = 'winter' | 'spring' | 'summer' | 'autumn';

/**
 * Northern-hemisphere agricultural season for a calendar month (0 = January).
 * Tunisia is in the northern hemisphere, so this mapping applies directly.
 */
export function seasonForMonth(month: number): Season {
  if (month === 11 || month === 0 || month === 1) return 'winter';
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  return 'autumn';
}

const SEASON_KEYS: Record<Season, { name: keyof ExtraTranslations; tip: keyof ExtraTranslations }> = {
  winter: { name: 'seasonWinter', tip: 'seasonWinterTip' },
  spring: { name: 'seasonSpring', tip: 'seasonSpringTip' },
  summer: { name: 'seasonSummer', tip: 'seasonSummerTip' },
  autumn: { name: 'seasonAutumn', tip: 'seasonAutumnTip' },
};

export function seasonLabel(season: Season, x: ExtraTranslations): string {
  return x[SEASON_KEYS[season].name];
}

export function seasonTip(season: Season, x: ExtraTranslations): string {
  return x[SEASON_KEYS[season].tip];
}
