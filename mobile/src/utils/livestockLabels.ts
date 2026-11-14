import { Language } from '../i18n';

/**
 * Livestock enums. The backend (`server/routes/livestock.ts`) constrains species,
 * gender, health and breeding status to fixed English slugs (SPECIES/SEX/HEALTH/
 * REPRO sets). The API returns those slugs verbatim, so an Arabic-first UI would
 * otherwise show English words. These are closed vocabularies — translating the
 * label invents nothing about the animal; breed is free text and stays verbatim.
 */

type Tri = { ar: string; fr: string; en: string };

const SPECIES: Record<string, Tri> = {
  cattle: { ar: 'أبقار', fr: 'Bovins', en: 'Cattle' },
  dairy_cattle: { ar: 'أبقار حلوب', fr: 'Bovins laitiers', en: 'Dairy cattle' },
  beef_cattle: { ar: 'أبقار لحوم', fr: 'Bovins à viande', en: 'Beef cattle' },
  sheep: { ar: 'أغنام', fr: 'Ovins', en: 'Sheep' },
  goat: { ar: 'ماعز', fr: 'Caprins', en: 'Goat' },
  poultry: { ar: 'دواجن', fr: 'Volailles', en: 'Poultry' },
  camel: { ar: 'إبل', fr: 'Camélidés', en: 'Camel' },
  other: { ar: 'أخرى', fr: 'Autres', en: 'Other' },
};

const GENDER: Record<string, Tri> = {
  male: { ar: 'ذكر', fr: 'Mâle', en: 'Male' },
  female: { ar: 'أنثى', fr: 'Femelle', en: 'Female' },
};

const HEALTH: Record<string, Tri> = {
  excellent: { ar: 'ممتازة', fr: 'Excellente', en: 'Excellent' },
  good: { ar: 'جيدة', fr: 'Bonne', en: 'Good' },
  fair: { ar: 'متوسطة', fr: 'Moyenne', en: 'Fair' },
  poor: { ar: 'ضعيفة', fr: 'Faible', en: 'Poor' },
  sick: { ar: 'مريضة', fr: 'Malade', en: 'Sick' },
  unknown: { ar: 'غير محددة', fr: 'Inconnue', en: 'Unknown' },
};

const BREEDING: Record<string, Tri> = {
  active: { ar: 'نشطة تناسلياً', fr: 'Active', en: 'Active' },
  pregnant: { ar: 'حامل', fr: 'Gestante', en: 'Pregnant' },
  nursing: { ar: 'مرضعة', fr: 'Allaitante', en: 'Nursing' },
  inactive: { ar: 'غير نشطة', fr: 'Inactive', en: 'Inactive' },
  unknown: { ar: 'غير محددة', fr: 'Inconnue', en: 'Unknown' },
};

function pick(map: Record<string, Tri>, value: string | null | undefined, lang: Language): string {
  if (!value) return '';
  const entry = map[value];
  if (!entry) return value;
  return entry[lang];
}

export const livestockSpecies = (v: string | null | undefined, l: Language) => pick(SPECIES, v, l);
export const livestockGender = (v: string | null | undefined, l: Language) => pick(GENDER, v, l);
export const livestockHealth = (v: string | null | undefined, l: Language) => pick(HEALTH, v, l);
export const livestockBreeding = (v: string | null | undefined, l: Language) => pick(BREEDING, v, l);
