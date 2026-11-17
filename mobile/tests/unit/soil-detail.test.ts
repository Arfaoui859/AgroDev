import { getSoil, soilTranslations } from '../../src/i18n/soil';
import { buildSoilInput, toRuleBasedInput } from '../../src/utils/soilInput';
import { deriveProjectTasks } from '../../src/utils/projectTasks';
import { MeasurementsValues } from '../../src/components/soil/MeasurementsStep';
import { SoilReport } from '../../src/types';

const baseValues = (overrides: Partial<MeasurementsValues> = {}): MeasurementsValues => ({
  values: {},
  ecUnit: '',
  waterEcUnit: '',
  nutrientUnit: '',
  nutrientMethod: '',
  ecMethod: '',
  irrigationMethod: '',
  targetCrop: '',
  samplingDate: '',
  drainage: '',
  previousCrop: '',
  currentCrop: '',
  season: '',
  notes: '',
  ...overrides,
});

describe('soil i18n parity', () => {
  it('declares the same key surface, with no empty strings, across ar/fr/en', () => {
    const keys = Object.keys(getSoil('ar')).sort();
    expect(keys.length).toBeGreaterThan(40);
    expect(Object.keys(getSoil('fr')).sort()).toEqual(keys);
    expect(Object.keys(getSoil('en')).sort()).toEqual(keys);
    for (const key of keys as (keyof typeof soilTranslations.ar)[]) {
      for (const lang of ['ar', 'fr', 'en'] as const) {
        expect(typeof soilTranslations[lang][key]).toBe('string');
        expect(String(soilTranslations[lang][key]).length).toBeGreaterThan(0);
      }
    }
  });
});

describe('buildSoilInput', () => {
  it('omits blank fields entirely (never defaults them)', () => {
    const { input, measurementCount } = buildSoilInput(baseValues({ values: { ph: '7.1' } }));
    expect(input.ph).toBe(7.1);
    expect(input.nitrogen).toBeUndefined();
    expect(input.moisture).toBeUndefined();
    expect(input.electricalConductivity).toBeUndefined();
    expect(measurementCount).toBe(1);
  });

  it('does not treat sample depth alone as a soil measurement', () => {
    const { input, measurementCount } = buildSoilInput(
      baseValues({ values: { sampleDepth: '30' } }),
    );
    expect(input.sampleDepth).toBe(30);
    expect(measurementCount).toBe(0);
  });

  it('flags non-numeric text instead of dropping it silently', () => {
    const { hasInvalid, measurementCount } = buildSoilInput(baseValues({ values: { ph: 'abc', nitrogen: '12' } }));
    expect(hasInvalid).toBe(true);
    expect(measurementCount).toBe(1);
  });

  it('accepts a decimal comma', () => {
    const { input } = buildSoilInput(baseValues({ values: { ph: '7,5' } }));
    expect(input.ph).toBe(7.5);
  });

  it('attaches the EC unit only when EC is present', () => {
    const withoutEc = buildSoilInput(baseValues({ ecUnit: 'dS/m' })).input;
    expect(withoutEc.electricalConductivityUnit).toBeUndefined();

    const withEc = buildSoilInput(baseValues({ values: { electricalConductivity: '1.2' }, ecUnit: 'dS/m' })).input;
    expect(withEc.electricalConductivity).toBe(1.2);
    expect(withEc.electricalConductivityUnit).toBe('dS/m');
  });

  it('carries plot context through to the payload', () => {
    const { input } = buildSoilInput(baseValues({ values: { ph: '6.5' } }), {
      fieldId: 'field-1',
      region: 'Kairouan',
      farmAreaHectares: 4.5,
    });
    expect(input.fieldId).toBe('field-1');
    expect(input.region).toBe('Kairouan');
    expect(input.farmAreaHectares).toBe(4.5);
  });
});

describe('toRuleBasedInput', () => {
  it('maps only the overlapping measurements for the fallback engine', () => {
    const mapped = toRuleBasedInput({
      ph: 7,
      moisture: 30,
      electricalConductivity: 2.1,
      nitrogen: 40,
      farmAreaHectares: 3,
    });
    expect(mapped.ph).toBe(7);
    expect(mapped.moisture).toBe(30);
    expect(mapped.salinity).toBe(2.1);
    expect(mapped.nitrogen).toBe(40);
    // A field the fallback does not understand must not leak through.
    expect((mapped as Record<string, unknown>).farmAreaHectares).toBeUndefined();
  });
});

describe('deriveProjectTasks', () => {
  const report = {
    recommendations: [
      { priority: 'during_season', action: 'راقب الحشرات', reason: '', howTo: '', verification: '', when: '' },
      { priority: 'now', action: 'أضف الجبس', reason: '', howTo: '', verification: '', when: '' },
    ],
    followUpPlan: [{ step: 1, when: 'بعد شهر', whatToDo: 'أعد أخذ العينة', whatToMeasure: 'EC', why: '' }],
  } as unknown as SoilReport;

  it('derives ordered tasks from a persisted report (priority first)', () => {
    const tasks = deriveProjectTasks(report);
    expect(tasks[0].text).toBe('أضف الجبس');
    expect(tasks[0].generic).toBe(false);
    expect(tasks.some((t) => t.text === 'أعد أخذ العينة')).toBe(true);
  });

  it('returns an honest generic sequence when there is no report', () => {
    const tasks = deriveProjectTasks(null);
    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks.every((t) => t.generic)).toBe(true);
  });
});
