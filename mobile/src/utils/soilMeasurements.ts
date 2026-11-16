import { SoilTranslations } from '../i18n/soil';

/**
 * Declarative description of the soil measurements the detailed endpoint
 * accepts. Keeping it in one table means the form, the payload builder and the
 * validation all agree on the same field set — no measurement is silently
 * dropped or invented.
 *
 * Every field is optional; the server's report lists whatever is missing. The
 * `unit` here is only a display suffix, never a value.
 */
export type NumericSoilKey =
  | 'ph'
  | 'electricalConductivity'
  | 'moisture'
  | 'organicMatter'
  | 'nitrogen'
  | 'phosphorus'
  | 'potassium'
  | 'sandPercent'
  | 'siltPercent'
  | 'clayPercent'
  | 'calcium'
  | 'magnesium'
  | 'sulfur'
  | 'iron'
  | 'zinc'
  | 'manganese'
  | 'copper'
  | 'boron'
  | 'cec'
  | 'calciumCarbonateTotal'
  | 'calciumCarbonateActive'
  | 'sodium'
  | 'sodiumAdsorptionRatio'
  | 'exchangeableSodiumPercentage'
  | 'sampleDepth'
  | 'slopePercent'
  | 'waterElectricalConductivity'
  | 'waterPh';

export interface MeasurementDef {
  key: NumericSoilKey;
  labelKey: keyof SoilTranslations;
  helpKey: keyof SoilTranslations;
  /** Static display unit; omitted when the unit is user-chosen (EC, NPK). */
  unit?: string;
}

export const CORE_MEASUREMENTS: MeasurementDef[] = [
  { key: 'ph', labelKey: 'mPh', helpKey: 'helpPh' },
  { key: 'electricalConductivity', labelKey: 'mEc', helpKey: 'helpEc' },
  { key: 'moisture', labelKey: 'mMoisture', helpKey: 'helpMoisture', unit: '%' },
  { key: 'organicMatter', labelKey: 'mOm', helpKey: 'helpOm', unit: '%' },
];

export const NUTRIENT_MEASUREMENTS: MeasurementDef[] = [
  { key: 'nitrogen', labelKey: 'mN', helpKey: 'helpN' },
  { key: 'phosphorus', labelKey: 'mP', helpKey: 'helpP' },
  { key: 'potassium', labelKey: 'mK', helpKey: 'helpK' },
];

export const TEXTURE_MEASUREMENTS: MeasurementDef[] = [
  { key: 'sandPercent', labelKey: 'mSand', helpKey: 'helpTexture', unit: '%' },
  { key: 'siltPercent', labelKey: 'mSilt', helpKey: 'helpTexture', unit: '%' },
  { key: 'clayPercent', labelKey: 'mClay', helpKey: 'helpTexture', unit: '%' },
];

export const ADVANCED_MEASUREMENTS: MeasurementDef[] = [
  { key: 'calcium', labelKey: 'mCa', helpKey: 'helpCaMgS' },
  { key: 'magnesium', labelKey: 'mMg', helpKey: 'helpCaMgS' },
  { key: 'sulfur', labelKey: 'mS', helpKey: 'helpCaMgS' },
  { key: 'iron', labelKey: 'mFe', helpKey: 'helpMicro' },
  { key: 'zinc', labelKey: 'mZn', helpKey: 'helpMicro' },
  { key: 'manganese', labelKey: 'mMn', helpKey: 'helpMicro' },
  { key: 'copper', labelKey: 'mCu', helpKey: 'helpMicro' },
  { key: 'boron', labelKey: 'mB', helpKey: 'helpMicro' },
  { key: 'cec', labelKey: 'mCec', helpKey: 'helpCec' },
  { key: 'calciumCarbonateTotal', labelKey: 'mCaco3Total', helpKey: 'helpCaco3', unit: '%' },
  { key: 'calciumCarbonateActive', labelKey: 'mCaco3Active', helpKey: 'helpCaco3', unit: '%' },
  { key: 'sodium', labelKey: 'mNa', helpKey: 'helpSar' },
  { key: 'sodiumAdsorptionRatio', labelKey: 'mSar', helpKey: 'helpSar' },
  { key: 'exchangeableSodiumPercentage', labelKey: 'mEsp', helpKey: 'helpSar', unit: '%' },
  { key: 'sampleDepth', labelKey: 'sampleDepthLabel', helpKey: 'helpPh', unit: 'cm' },
  { key: 'slopePercent', labelKey: 'mSlope', helpKey: 'helpSlope', unit: '%' },
];

export const WATER_MEASUREMENTS: MeasurementDef[] = [
  { key: 'waterElectricalConductivity', labelKey: 'waterEcLabel', helpKey: 'helpWater' },
  { key: 'waterPh', labelKey: 'waterPhLabel', helpKey: 'helpWater' },
];

export const ALL_MEASUREMENTS: MeasurementDef[] = [
  ...CORE_MEASUREMENTS,
  ...NUTRIENT_MEASUREMENTS,
  ...TEXTURE_MEASUREMENTS,
  ...ADVANCED_MEASUREMENTS,
  ...WATER_MEASUREMENTS,
];

/** Parse an optional numeric input: '' -> undefined, invalid -> NaN sentinel. */
export function parseSoilNumber(raw: string): number | undefined | 'invalid' {
  const trimmed = raw.trim().replace(',', '.');
  if (!trimmed) return undefined;
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return 'invalid';
  return value;
}

/** Common EC units, offered as quick chips (free text is still allowed). */
export const EC_UNITS = ['dS/m', 'mS/cm', 'µS/cm', 'mmhos/cm'];
export const NUTRIENT_UNITS = ['mg/kg', 'ppm', 'meq/100g', '%'];
export const IRRIGATION_METHODS = ['drip', 'sprinkler', 'flood', 'furrow', 'none'];
