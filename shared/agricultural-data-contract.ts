import { z } from 'zod';

/**
 * Canonical, provenance-aware agricultural measurements.
 *
 * This contract is intentionally separate from specialist-service payloads:
 * adapters may unwrap values for legacy APIs, but must keep provenance beside
 * the request and must never upgrade farmer-entered values to verified data.
 */

export const MeasurementSourceSchema = z.enum([
  'farmer_entered',
  'laboratory',
  'sensor',
  'weather_provider',
  'market_provider',
  'expert_verified',
  'ai_derived',
]);

export const MeasurementVerificationSchema = z.enum([
  'unverified',
  'verified',
  'derived',
]);

export const MeasurementSchema = z.object({
  value: z.number().finite(),
  unit: z.string().trim().min(1).max(32),
  source: MeasurementSourceSchema,
  verification: MeasurementVerificationSchema,
  observed_at: z.string().datetime({ offset: true }),
  evidence_reference: z.string().trim().min(1).max(500).optional(),
  method: z.string().trim().min(1).max(120).optional(),
}).strict().superRefine((measurement, context) => {
  if (measurement.source === 'farmer_entered' && measurement.verification !== 'unverified') {
    context.addIssue({
      code: 'custom',
      path: ['verification'],
      message: 'Farmer-entered measurements must remain unverified until independently checked.',
    });
  }

  if (measurement.source === 'expert_verified' && measurement.verification !== 'verified') {
    context.addIssue({
      code: 'custom',
      path: ['verification'],
      message: 'Expert-verified measurements must carry verified status.',
    });
  }

  if (measurement.source === 'ai_derived' && measurement.verification !== 'derived') {
    context.addIssue({
      code: 'custom',
      path: ['verification'],
      message: 'AI-derived values must be marked derived, never verified.',
    });
  }

  if (
    ['laboratory', 'sensor', 'weather_provider', 'market_provider'].includes(measurement.source)
    && measurement.verification === 'verified'
    && !measurement.evidence_reference
  ) {
    context.addIssue({
      code: 'custom',
      path: ['evidence_reference'],
      message: 'Verified provider measurements require an evidence reference.',
    });
  }
});

export const AgriculturalMeasurementKeySchema = z.enum([
  'soil_ph',
  'soil_moisture',
  'organic_matter',
  'sand',
  'silt',
  'clay',
  'nitrogen',
  'phosphorus',
  'potassium',
  'salinity',
  'air_temperature',
  'annual_rainfall',
  'water_availability',
  'market_price',
  'available_capital',
  'farm_size',
  'farmer_experience_years',
  'risk_tolerance',
]);

export const FarmLocationSchema = z.object({
  country_code: z.string().length(2).default('TN'),
  governorate: z.string().trim().min(1).max(80).optional(),
  delegation: z.string().trim().min(1).max(80).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
}).strict().superRefine((location, context) => {
  if ((location.latitude === undefined) !== (location.longitude === undefined)) {
    context.addIssue({
      code: 'custom',
      path: ['longitude'],
      message: 'Latitude and longitude must be supplied together.',
    });
  }
});

export const FarmInputContractSchema = z.object({
  schema_version: z.literal('1.0.0'),
  farm_id: z.string().trim().min(1).max(128).optional(),
  field_id: z.string().trim().min(1).max(128).optional(),
  crop: z.string().trim().min(1).max(100).optional(),
  growth_stage: z.string().trim().min(1).max(100).optional(),
  location: FarmLocationSchema.optional(),
  measurements: z.record(AgriculturalMeasurementKeySchema, MeasurementSchema).default({}),
}).strict().superRefine((farm, context) => {
  const textureKeys = ['sand', 'silt', 'clay'] as const;
  const texture = textureKeys.map((key) => farm.measurements[key]?.value);
  if (texture.every((value) => value !== undefined)) {
    const total = texture.reduce((sum, value) => sum + (value ?? 0), 0);
    if (Math.abs(total - 100) > 1) {
      context.addIssue({
        code: 'custom',
        path: ['measurements'],
        message: 'Sand, silt and clay percentages must total 100% (±1%).',
      });
    }
  }
});

export type MeasurementSource = z.infer<typeof MeasurementSourceSchema>;
export type MeasurementVerification = z.infer<typeof MeasurementVerificationSchema>;
export type AgriculturalMeasurement = z.infer<typeof MeasurementSchema>;
export type AgriculturalMeasurementKey = z.infer<typeof AgriculturalMeasurementKeySchema>;
export type FarmInputContract = z.infer<typeof FarmInputContractSchema>;

const MEASUREMENT_RULES: Record<AgriculturalMeasurementKey, { min: number; max: number; units: string[] }> = {
  soil_ph: { min: 0, max: 14, units: ['pH'] },
  soil_moisture: { min: 0, max: 100, units: ['%', 'percent'] },
  organic_matter: { min: 0, max: 100, units: ['%', 'percent', 'g/kg'] },
  sand: { min: 0, max: 100, units: ['%', 'percent'] },
  silt: { min: 0, max: 100, units: ['%', 'percent'] },
  clay: { min: 0, max: 100, units: ['%', 'percent'] },
  nitrogen: { min: 0, max: 100000, units: ['mg/kg', 'ppm', 'kg/ha'] },
  phosphorus: { min: 0, max: 100000, units: ['mg/kg', 'ppm', 'kg/ha'] },
  potassium: { min: 0, max: 100000, units: ['mg/kg', 'ppm', 'kg/ha'] },
  salinity: { min: 0, max: 1000, units: ['dS/m', 'mS/cm'] },
  air_temperature: { min: -40, max: 65, units: ['°C', 'C'] },
  annual_rainfall: { min: 0, max: 10000, units: ['mm', 'mm/year'] },
  water_availability: { min: 0, max: 1, units: ['ratio'] },
  market_price: { min: 0, max: 100000000, units: ['TND/kg', 'TND/tonne', 'TND/ton', 'TND'] },
  available_capital: { min: 0, max: 100000000000, units: ['TND'] },
  farm_size: { min: 0, max: 1000000, units: ['ha', 'hectare', 'm²', 'acre'] },
  farmer_experience_years: { min: 0, max: 100, units: ['year', 'years', 'ans'] },
  risk_tolerance: { min: 0, max: 1, units: ['ratio'] },
};

/**
 * Apply semantic range/unit validation after structural Zod parsing.
 * No unit conversion is performed: callers must convert explicitly.
 */
export function validateFarmInputContract(input: unknown) {
  const parsed = FarmInputContractSchema.safeParse(input);
  if (!parsed.success) return parsed;

  const issues: Array<{ key: AgriculturalMeasurementKey; message: string }> = [];
  for (const [rawKey, measurement] of Object.entries(parsed.data.measurements)) {
    const key = rawKey as AgriculturalMeasurementKey;
    const rule = MEASUREMENT_RULES[key];
    if (measurement.value < rule.min || measurement.value > rule.max) {
      issues.push({ key, message: `Value must be between ${rule.min} and ${rule.max} ${measurement.unit}.` });
    }
    if (!rule.units.includes(measurement.unit)) {
      issues.push({ key, message: `Unsupported unit "${measurement.unit}". Expected: ${rule.units.join(', ')}.` });
    }
  }

  if (issues.length > 0) {
    return {
      success: false as const,
      error: {
        issues: issues.map((issue) => ({
          code: 'custom' as const,
          path: ['measurements', issue.key, 'value'],
          message: issue.message,
        })),
      },
    };
  }

  return parsed;
}

/**
 * Compatibility adapter for current specialist APIs.
 * It emits only explicitly supplied values and keeps full provenance separate.
 * It intentionally does not invent the other required crop-agent inputs.
 */
export function toLegacyAgentInputs(farm: FarmInputContract) {
  const measurements = farm.measurements;
  const soil: Record<string, number> = {};
  const soilMapping: Array<[AgriculturalMeasurementKey, string]> = [
    ['soil_ph', 'ph'],
    ['soil_moisture', 'moisture'],
    ['organic_matter', 'organic_matter'],
    ['sand', 'sand'],
    ['silt', 'silt'],
    ['clay', 'clay'],
    ['nitrogen', 'nitrogen'],
    ['phosphorus', 'phosphorus'],
    ['potassium', 'potassium'],
    ['salinity', 'salinity'],
  ];

  for (const [contractKey, serviceKey] of soilMapping) {
    const measurement = measurements[contractKey];
    if (measurement) soil[serviceKey] = measurement.value;
  }

  const crop: Record<string, number> = {};
  const cropMapping: Array<[AgriculturalMeasurementKey, string]> = [
    ['air_temperature', 'temperature'],
    ['annual_rainfall', 'annual_rainfall'],
    ['soil_ph', 'soil_ph'],
    ['water_availability', 'water_availability'],
    ['market_price', 'target_market_price'],
    ['farmer_experience_years', 'farmer_experience_years'],
    ['available_capital', 'available_capital'],
    ['farm_size', 'farm_size'],
    ['risk_tolerance', 'risk_tolerance'],
  ];

  for (const [contractKey, serviceKey] of cropMapping) {
    const measurement = measurements[contractKey];
    if (measurement) crop[serviceKey] = measurement.value;
  }

  const tool_inputs: Record<string, Record<string, unknown>> = {};
  if (Object.keys(soil).length > 0) tool_inputs['soil.analyze'] = { sensor_data: soil };
  if (Object.keys(crop).length > 0) tool_inputs['crop.recommend'] = crop;

  return {
    tool_inputs,
    measurement_provenance: Object.fromEntries(
      Object.entries(measurements).map(([key, measurement]) => [key, {
        unit: measurement.unit,
        source: measurement.source,
        verification: measurement.verification,
        observed_at: measurement.observed_at,
        evidence_reference: measurement.evidence_reference,
        method: measurement.method,
      }]),
    ),
    farm_context: {
      farm_id: farm.farm_id,
      field_id: farm.field_id,
      crop: farm.crop,
      growth_stage: farm.growth_stage,
      location: farm.location,
    },
  };
}
