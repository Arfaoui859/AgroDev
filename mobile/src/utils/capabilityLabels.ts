import { Language } from '../i18n';

/**
 * `GET /api/ai/capabilities` returns a stable English `id` plus an English
 * `name` and an Arabic `nameAr` — there is no French label. Rendering `name`
 * for a French caller leaks English into an otherwise French UI, so we keep a
 * closed client-side map of the known capability ids. Anything not in the map
 * falls back to the server's own English `name`, so a new capability is still
 * shown (in English) rather than hidden.
 */

type Tri = { ar: string; fr: string; en: string };

const CAPABILITY_NAMES: Record<string, Tri> = {
  'soil-analysis': { ar: 'تحليل التربة', fr: 'Analyse du sol', en: 'Soil Analysis' },
  'lab-soil-models': {
    ar: 'نماذج تحليل التربة المخبرية',
    fr: 'Modèles de laboratoire du sol',
    en: 'Laboratory Soil Models',
  },
  'crop-recommendation': {
    ar: 'توصيات المحاصيل',
    fr: 'Recommandations de cultures',
    en: 'Smart Crop Recommendations',
  },
  'climate-crop-matcher': {
    ar: 'مطابقة المناخ للمحاصيل',
    fr: 'Adéquation climat-cultures',
    en: 'Climate Crop Matcher',
  },
  'plant-disease-detection': {
    ar: 'كشف أمراض النبات',
    fr: 'Détection des maladies des plantes',
    en: 'Plant Disease Detection',
  },
  'leaf-scan': { ar: 'فحص الأوراق', fr: 'Analyse des feuilles', en: 'Leaf Scan AI' },
  'pest-control': { ar: 'مكافحة الآفات', fr: 'Lutte antiparasitaire', en: 'Pest Control Recommender' },
  'weather-yield-planner': {
    ar: 'مخطط الطقس والمحاصيل',
    fr: 'Planificateur météo-cultures',
    en: 'Smart Weather Crop Planner',
  },
  'yield-predictor': { ar: 'توقّع الإنتاجية', fr: 'Prévision de rendement', en: 'Yield Predictor AI' },
  'irrigation-optimizer': {
    ar: 'تحسين الري',
    fr: 'Optimisation de l’irrigation',
    en: 'Smart Irrigation Optimizer',
  },
  'market-forecast': { ar: 'توقّع السوق', fr: 'Prévision du marché', en: 'Market Forecast AI' },
  'supply-demand': { ar: 'العرض والطلب', fr: 'Offre et demande', en: 'Supply Demand AI' },
  'smart-match': { ar: 'المطابقة الذكية', fr: 'Mise en relation intelligente', en: 'Smart Match AI' },
  'farming-tasks-planner': {
    ar: 'مخطط المهام الزراعية',
    fr: 'Planificateur de tâches agricoles',
    en: 'Farming Tasks Planner',
  },
  'agro-chat': { ar: 'المساعد الفلاحي', fr: 'Assistant agricole', en: 'Agro Chat AI' },
  'alert-notifier': { ar: 'منبّه التنبيهات', fr: 'Notifications d’alerte', en: 'Alert Notifier AI' },
};

/**
 * Localise a capability for display.
 *
 * Arabic prefers the server's own `nameAr` (it is authored for the product),
 * French uses the closed map, and anything else — including an unknown id —
 * falls back to the server's English `name`. An Arabic name is never shown to a
 * non-Arabic caller, so a French screen never mixes scripts.
 */
export function capabilityLabel(
  id: string | null | undefined,
  name: string | null | undefined,
  nameAr: string | null | undefined,
  lang: Language,
): string {
  if (lang === 'ar') return nameAr || CAPABILITY_NAMES[id ?? '']?.ar || name || id || '';
  if (lang === 'fr') return CAPABILITY_NAMES[id ?? '']?.fr || name || nameAr || id || '';
  return CAPABILITY_NAMES[id ?? '']?.en || name || id || '';
}
