import { Language } from '../i18n';

/**
 * The pest-control service (agrogrowth-ai/pest_control) returns a stable English
 * pest slug (`aphids`, `spider_mites`, …), an Arabic `pest_name_ar`, and an
 * Arabic `category`. Those name/category values are a closed vocabulary defined
 * in the service's `pest_disease_database`, so we translate them client-side for
 * fr/en callers. The identification itself is never invented — it is the exact
 * pest the service matched, only relabelled.
 */

type Tri = { ar: string; fr: string; en: string };

const PEST_NAMES: Record<string, Tri> = {
  aphids: { ar: 'المن', fr: 'Pucerons', en: 'Aphids' },
  spider_mites: { ar: 'العنكبوت الأحمر', fr: 'Tétranyques', en: 'Spider mites' },
  whiteflies: { ar: 'الذبابة البيضاء', fr: 'Aleurodes', en: 'Whiteflies' },
  powdery_mildew: { ar: 'البياض الدقيقي', fr: 'Oïdium', en: 'Powdery mildew' },
  late_blight: { ar: 'اللفحة المتأخرة', fr: 'Mildiou', en: 'Late blight' },
  bacterial_wilt: { ar: 'الذبول البكتيري', fr: 'Flétrissement bactérien', en: 'Bacterial wilt' },
};

const PEST_CATEGORIES: Record<string, Tri> = {
  حشرات: { ar: 'حشرات', fr: 'Insectes', en: 'Insects' },
  عنكبوتيات: { ar: 'عنكبوتيات', fr: 'Acariens', en: 'Mites' },
  'أمراض فطرية': { ar: 'أمراض فطرية', fr: 'Maladies fongiques', en: 'Fungal diseases' },
  'أمراض بكتيرية': { ar: 'أمراض بكتيرية', fr: 'Maladies bactériennes', en: 'Bacterial diseases' },
  'غير محدد': { ar: 'غير محدد', fr: 'Non précisé', en: 'Unspecified' },
};

function pick(map: Record<string, Tri>, value: string | null | undefined, lang: Language): string {
  if (!value) return '';
  const entry = map[value];
  if (!entry) return value;
  return entry[lang];
}

/**
 * Prefer the Arabic name only for Arabic; otherwise use the translated slug.
 * Falls back to the server's Arabic name if the slug is unknown, so a match is
 * never hidden.
 */
export function pestName(
  slug: string | null | undefined,
  nameAr: string | null | undefined,
  lang: Language,
): string {
  if (lang === 'ar') return nameAr || (slug ? PEST_NAMES[slug]?.ar ?? slug : '');
  if (slug && PEST_NAMES[slug]) return PEST_NAMES[slug][lang];
  return nameAr || slug || '';
}

export function pestCategory(value: string | null | undefined, lang: Language): string {
  return pick(PEST_CATEGORIES, value, lang);
}
