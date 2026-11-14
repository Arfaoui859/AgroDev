import { ExtraTranslations } from '../i18n/extra';

/**
 * The rule-based soil engine returns one of four fixed Arabic fertility grades
 * (`عالية`, `متوسطة`, `منخفضة`, `ضعيفة`). They are a closed enum, not free
 * prose, so translating the label is a faithful localisation — it does not
 * invent a result. Anything unrecognised is shown verbatim so we never
 * fabricate a grade.
 */
const GRADE_KEYS: Record<string, keyof ExtraTranslations> = {
  عالية: 'soilGradeHigh',
  متوسطة: 'soilGradeMedium',
  منخفضة: 'soilGradeLow',
  ضعيفة: 'soilGradePoor',
};

export function localizeSoilGrade(value: string, x: ExtraTranslations): string {
  const key = GRADE_KEYS[value?.trim()];
  return key ? x[key] : value;
}
