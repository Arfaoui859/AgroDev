import { Language } from '../i18n';

/**
 * The backend's rule-based crop engine (server/services/ai/cropAdvisor.ts) emits
 * several values as *closed Arabic enums* — the crop id, category, season, water
 * need and risk level — plus an Arabic-only reasoning sentence. The crop id is a
 * stable English slug (`olive`, `date_palm`, …); the rest are fixed Arabic
 * vocabulary. We translate those closed enums client-side for fr/en callers.
 *
 * Free-form Arabic text (the per-crop `reasoning`) is NOT translated: it is left
 * as authored and the screen labels it as Arabic-only. Nothing here is inferred
 * or invented — every mapping is a straight label for a value the server sent.
 */

type Tri = { ar: string; fr: string; en: string };

const CROP_NAMES: Record<string, Tri> = {
  olive: { ar: 'الزيتون', fr: 'Olivier', en: 'Olive' },
  wheat: { ar: 'القمح الصلب', fr: 'Blé dur', en: 'Durum wheat' },
  barley: { ar: 'الشعير', fr: 'Orge', en: 'Barley' },
  tomato: { ar: 'الطماطم', fr: 'Tomate', en: 'Tomato' },
  potato: { ar: 'البطاطا', fr: 'Pomme de terre', en: 'Potato' },
  date_palm: { ar: 'النخيل', fr: 'Palmier-dattier', en: 'Date palm' },
  citrus: { ar: 'الحوامض', fr: 'Agrumes', en: 'Citrus' },
  chickpea: { ar: 'الحمص', fr: 'Pois chiche', en: 'Chickpea' },
  watermelon: { ar: 'البطيخ', fr: 'Pastèque', en: 'Watermelon' },
  alfalfa: { ar: 'الفصة', fr: 'Luzerne', en: 'Alfalfa' },
};

const CATEGORIES: Record<string, Tri> = {
  'أشجار مثمرة': { ar: 'أشجار مثمرة', fr: 'Arbres fruitiers', en: 'Fruit trees' },
  حبوب: { ar: 'حبوب', fr: 'Céréales', en: 'Cereals' },
  خضروات: { ar: 'خضروات', fr: 'Légumes', en: 'Vegetables' },
  بقوليات: { ar: 'بقوليات', fr: 'Légumineuses', en: 'Legumes' },
  أعلاف: { ar: 'أعلاف', fr: 'Fourrages', en: 'Forage' },
};

const SEASONS: Record<string, Tri> = {
  ربيع: { ar: 'ربيع', fr: 'Printemps', en: 'Spring' },
  صيف: { ar: 'صيف', fr: 'Été', en: 'Summer' },
  خريف: { ar: 'خريف', fr: 'Automne', en: 'Autumn' },
  شتاء: { ar: 'شتاء', fr: 'Hiver', en: 'Winter' },
};

// Shared by water need and risk level (منخفض/متوسط/مرتفع/عالٍ).
const LEVELS: Record<string, Tri> = {
  منخفض: { ar: 'منخفض', fr: 'Faible', en: 'Low' },
  متوسط: { ar: 'متوسط', fr: 'Moyen', en: 'Medium' },
  مرتفع: { ar: 'مرتفع', fr: 'Élevé', en: 'High' },
  عالٍ: { ar: 'عالٍ', fr: 'Élevé', en: 'High' },
};

function pick(map: Record<string, Tri>, value: string | null | undefined, lang: Language): string {
  if (!value) return '';
  const entry = map[value];
  if (!entry) return value;
  return entry[lang];
}

/** Localise a crop id/slug to a display name; unknown ids pass through. */
export function cropName(id: string | null | undefined, lang: Language): string {
  return pick(CROP_NAMES, id, lang);
}

export function cropCategory(value: string | null | undefined, lang: Language): string {
  return pick(CATEGORIES, value, lang);
}

/** `season` may be a comma/•-separated list of Arabic season words. */
export function cropSeason(value: string | null | undefined, lang: Language): string {
  if (!value) return '';
  if (lang === 'ar') return value;
  return value
    .split(/[،,•]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => SEASONS[part]?.[lang] ?? part)
    .join('، ');
}

export function cropLevel(value: string | null | undefined, lang: Language): string {
  return pick(LEVELS, value, lang);
}
