import { SoilDetailedInput } from '../types';
import { MeasurementsValues } from '../components/soil/MeasurementsStep';
import { ALL_MEASUREMENTS, parseSoilNumber } from './soilMeasurements';

export interface BuildResult {
  input: SoilDetailedInput;
  /** True when any field held non-numeric text. */
  hasInvalid: boolean;
  /** Count of real numeric measurements the user supplied. */
  measurementCount: number;
}

/**
 * Turn the raw form text into the exact payload the detailed endpoint accepts.
 * Blank fields are omitted entirely (never defaulted) so the server reports them
 * as missing. EC and water-EC units are attached only when their value is
 * present, matching the server's validation.
 */
export function buildSoilInput(
  values: MeasurementsValues,
  extras: { fieldId?: string; region?: string; farmAreaHectares?: number } = {},
): BuildResult {
  const input: SoilDetailedInput = {};
  let hasInvalid = false;
  let measurementCount = 0;

  for (const def of ALL_MEASUREMENTS) {
    const raw = values.values[def.key];
    const parsed = parseSoilNumber(raw ?? '');
    if (parsed === 'invalid') {
      hasInvalid = true;
      continue;
    }
    if (parsed !== undefined) {
      (input as Record<string, number>)[def.key] = parsed;
      measurementCount += 1;
    }
  }

  if (input.electricalConductivity !== undefined && values.ecUnit.trim()) {
    input.electricalConductivityUnit = values.ecUnit.trim();
  }
  if (input.waterElectricalConductivity !== undefined && values.waterEcUnit.trim()) {
    input.waterElectricalConductivityUnit = values.waterEcUnit.trim();
  }
  if (values.nutrientUnit.trim()) input.nutrientUnit = values.nutrientUnit.trim();
  if (values.nutrientMethod.trim()) input.nutrientMethod = values.nutrientMethod.trim();
  if (values.ecMethod.trim()) input.electricalConductivityMethod = values.ecMethod.trim();
  if (values.irrigationMethod.trim()) input.irrigationMethod = values.irrigationMethod.trim();
  if (values.targetCrop.trim()) input.targetCrop = values.targetCrop.trim();
  if (values.samplingDate.trim()) input.samplingDate = values.samplingDate.trim();

  if (extras.fieldId) input.fieldId = extras.fieldId;
  if (extras.region) input.region = extras.region;
  if (typeof extras.farmAreaHectares === 'number') input.farmAreaHectares = extras.farmAreaHectares;

  return { input, hasInvalid, measurementCount };
}

/**
 * The rule-based fallback endpoint takes a smaller input shape. We forward only
 * the overlapping measurements so the fallback scores exactly what the user
 * entered (never more).
 */
export function toRuleBasedInput(input: SoilDetailedInput): {
  fieldId?: string;
  location?: string;
  ph?: number;
  moisture?: number;
  nitrogen?: number;
  phosphorus?: number;
  potassium?: number;
  organicMatter?: number;
  salinity?: number;
  temperature?: number;
  soilTexture?: string;
} {
  return {
    fieldId: input.fieldId,
    location: input.location,
    ph: input.ph,
    moisture: input.moisture,
    nitrogen: input.nitrogen,
    phosphorus: input.phosphorus,
    potassium: input.potassium,
    organicMatter: input.organicMatter,
    salinity: input.electricalConductivity,
    temperature: (input as Record<string, number | undefined>).temperature,
    soilTexture: input.soilTexture,
  };
}
