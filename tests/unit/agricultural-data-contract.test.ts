import {
  toLegacyAgentInputs,
  validateFarmInputContract,
  type FarmInputContract,
} from '../../shared/agricultural-data-contract';

const timestamp = '2026-11-11T20:00:00+01:00';

function measurement(value: number, unit: string, source: 'farmer_entered' | 'laboratory' | 'sensor' | 'weather_provider' | 'market_provider' | 'expert_verified' | 'ai_derived' = 'farmer_entered') {
  return {
    value,
    unit,
    source,
    verification: source === 'expert_verified' ? 'verified' : source === 'ai_derived' ? 'derived' : 'unverified',
    observed_at: timestamp,
    ...(source === 'laboratory' || source === 'sensor' || source === 'weather_provider' || source === 'market_provider'
      ? { evidence_reference: 'evidence:sample-001' }
      : {}),
  };
}

function farm(measurements: Record<string, ReturnType<typeof measurement>>): FarmInputContract {
  return {
    schema_version: '1.0.0',
    farm_id: 'farm-123',
    location: { country_code: 'TN', governorate: 'Siliana' },
    measurements,
  } as FarmInputContract;
}

describe('provenance-aware agricultural data contract', () => {
  it('accepts explicitly supplied farmer measurements as unverified', () => {
    const result = validateFarmInputContract(farm({
      soil_ph: measurement(6.5, 'pH'),
      soil_moisture: measurement(45, '%'),
    }));

    expect(result.success).toBe(true);
  });

  it('rejects farmer-entered values marked verified', () => {
    const result = validateFarmInputContract(farm({
      soil_ph: { ...measurement(6.5, 'pH'), verification: 'verified' },
    }));

    expect(result.success).toBe(false);
  });

  it('requires evidence for verified provider measurements', () => {
    const result = validateFarmInputContract(farm({
      soil_ph: {
        ...measurement(6.5, 'pH', 'laboratory'),
        verification: 'verified',
        evidence_reference: undefined,
      },
    }));

    expect(result.success).toBe(false);
  });

  it('rejects physically implausible ranges and unsupported units', () => {
    const result = validateFarmInputContract(farm({
      soil_ph: measurement(16, 'pH'),
      soil_moisture: measurement(45, 'litres'),
    }));

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues).toHaveLength(2);
  });

  it('checks texture percentages when all three are supplied', () => {
    const valid = validateFarmInputContract(farm({
      sand: measurement(40, '%'),
      silt: measurement(40, '%'),
      clay: measurement(20, '%'),
    }));
    const invalid = validateFarmInputContract(farm({
      sand: measurement(40, '%'),
      silt: measurement(35, '%'),
      clay: measurement(20, '%'),
    }));

    expect(valid.success).toBe(true);
    expect(invalid.success).toBe(false);
  });

  it('does not infer missing measurements and keeps provenance outside legacy tool payloads', () => {
    const parsed = validateFarmInputContract(farm({
      soil_ph: measurement(6.5, 'pH'),
      annual_rainfall: measurement(450, 'mm/year', 'weather_provider'),
    }));
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const adapted = toLegacyAgentInputs(parsed.data);
    expect(adapted.tool_inputs['soil.analyze']).toEqual({
      sensor_data: { ph: 6.5 },
    });
    expect(adapted.tool_inputs['crop.recommend']).toEqual({
      annual_rainfall: 450,
      soil_ph: 6.5,
    });
    expect(adapted.tool_inputs['crop.recommend']).not.toHaveProperty('temperature');
    expect(adapted.measurement_provenance.soil_ph).toMatchObject({
      source: 'farmer_entered',
      verification: 'unverified',
      unit: 'pH',
    });
  });
});
