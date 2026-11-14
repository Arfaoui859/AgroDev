import { DataProvenance } from '../types';

/**
 * Localised, human-readable label for a data-provenance kind.
 *
 * Kept in one place so the badge component and the analysis history agree on
 * the exact wording — a rule-based result must never be labelled like a trained
 * model, in any language.
 */
const LABELS: Record<DataProvenance, { ar: string; fr: string; en: string }> = {
  'live-observation': { ar: 'بيانات حية', fr: 'Données en direct', en: 'Live data' },
  database: { ar: 'سجل مخزّن بالمنصة', fr: 'Enregistrement stocké', en: 'Stored record' },
  'trained-model': { ar: 'نموذج مدرّب', fr: 'Modèle entraîné', en: 'Trained model' },
  llm: { ar: 'ذكاء توليدي (LLM)', fr: 'IA générative', en: 'Generative AI' },
  'vision-model': { ar: 'نموذج رؤية', fr: 'Modèle de vision', en: 'Vision model' },
  'rule-based': { ar: 'نظام إرشادي (قواعد)', fr: 'Système expert', en: 'Expert rules' },
  unavailable: { ar: 'غير متاح', fr: 'Indisponible', en: 'Unavailable' },
};

export function provenanceLabel(provenance: DataProvenance, language: string): string {
  const entry = LABELS[provenance] ?? LABELS.unavailable;
  if (language === 'fr') return entry.fr;
  if (language === 'en') return entry.en;
  return entry.ar;
}
