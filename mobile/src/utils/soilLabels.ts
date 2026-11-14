import { Language } from '../i18n';

/**
 * The rule-based soil engine (server/services/ai/knowledgeEngine.ts) returns each
 * finding with a stable English `parameter` key and an Arabic `labelAr`. The key
 * set is closed (ph, nitrogen, phosphorus, potassium, organicMatter, moisture,
 * salinity), so we translate the *label* for fr/en callers. The finding's
 * `messageAr` sentence stays Arabic (it is free prose) and the screen labels it
 * as such. The value/status the engine computed is never altered.
 */

type Tri = { ar: string; fr: string; en: string };

const PARAM_LABELS: Record<string, Tri> = {
  ph: { ar: 'درجة الحموضة (pH)', fr: 'pH', en: 'pH' },
  nitrogen: { ar: 'الآزوت (N)', fr: 'Azote (N)', en: 'Nitrogen (N)' },
  phosphorus: { ar: 'الفوسفور (P)', fr: 'Phosphore (P)', en: 'Phosphorus (P)' },
  potassium: { ar: 'البوتاسيوم (K)', fr: 'Potassium (K)', en: 'Potassium (K)' },
  organicMatter: { ar: 'المادة العضوية', fr: 'Matière organique', en: 'Organic matter' },
  moisture: { ar: 'رطوبة التربة', fr: 'Humidité du sol', en: 'Soil moisture' },
  salinity: { ar: 'الملوحة (EC)', fr: 'Salinité (EC)', en: 'Salinity (EC)' },
};

export function soilParamLabel(
  parameter: string | null | undefined,
  labelAr: string | null | undefined,
  lang: Language,
): string {
  if (lang === 'ar') return labelAr || (parameter ? PARAM_LABELS[parameter]?.ar ?? parameter : '');
  if (parameter && PARAM_LABELS[parameter]) return PARAM_LABELS[parameter][lang];
  return labelAr || parameter || '';
}
