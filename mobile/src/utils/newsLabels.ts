import { Language } from '../i18n';

/**
 * The news service (server/services/news/tunisianAgriNews.ts) derives a coarse
 * category from the article text and emits a *French* slug (its `DERIVED_CATEGORIES`
 * facet list). Those slugs are shown to every locale, so Arabic callers would see
 * French words. We translate the closed facet list client-side; French is the
 * authored language and passes through unchanged. Article titles/summaries are
 * never translated — they are the publisher's own words and stay verbatim.
 */

type Tri = { ar: string; fr: string; en: string };

const CATEGORY_LABELS: Record<string, Tri> = {
  'céréales': { ar: 'حبوب', fr: 'céréales', en: 'Cereals' },
  'olive & huile': { ar: 'زيتون وزيت', fr: 'olive & huile', en: 'Olive & oil' },
  'maraîchage': { ar: 'خضروات', fr: 'maraîchage', en: 'Vegetables' },
  'arboriculture': { ar: 'أشجار مثمرة', fr: 'arboriculture', en: 'Fruit growing' },
  'élevage': { ar: 'تربية المواشي', fr: 'élevage', en: 'Livestock' },
  'pêche': { ar: 'صيد بحري', fr: 'pêche', en: 'Fishing' },
  'irrigation & eau': { ar: 'الري والمياه', fr: 'irrigation & eau', en: 'Irrigation & water' },
  'marché & export': { ar: 'السوق والتصدير', fr: 'marché & export', en: 'Market & export' },
  'climat': { ar: 'المناخ', fr: 'climat', en: 'Climate' },
  'agriculture': { ar: 'فلاحة عامة', fr: 'agriculture', en: 'Agriculture' },
};

export function newsCategoryLabel(value: string | null | undefined, lang: Language): string {
  if (!value) return '';
  const entry = CATEGORY_LABELS[value];
  if (!entry) return value;
  return entry[lang];
}
