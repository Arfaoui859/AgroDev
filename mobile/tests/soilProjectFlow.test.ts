import { buildSoilInput } from '../src/utils/soilInput';
import { deriveProjectTasks } from '../src/utils/projectTasks';
import type { MeasurementsValues } from '../src/components/soil/MeasurementsStep';
import type { SoilReport } from '../src/types';

const emptyMeasurements: MeasurementsValues = {
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
};

describe('soil analysis context and project handoff', () => {
  it('sends measured slope and optional field history without inventing blank values', () => {
    const result = buildSoilInput(
      {
        ...emptyMeasurements,
        values: { ph: '6.7', slopePercent: '4.5' },
        currentCrop: 'olive',
        previousCrop: 'legumes',
        season: 'autumn 2026',
        drainage: 'moderate',
        notes: 'North plot sample',
      },
      { fieldId: 'field-1', region: 'Siliana', farmAreaHectares: 2 },
    );

    expect(result.hasInvalid).toBe(false);
    expect(result.measurementCount).toBe(2);
    expect(result.input).toMatchObject({
      ph: 6.7,
      slopePercent: 4.5,
      currentCrop: 'olive',
      previousCrop: 'legumes',
      season: 'autumn 2026',
      drainage: 'moderate',
      notes: 'North plot sample',
      fieldId: 'field-1',
      region: 'Siliana',
      farmAreaHectares: 2,
    });
    expect(result.input.nitrogen).toBeUndefined();
    expect(result.input.targetCrop).toBeUndefined();
  });

  it('keeps analysis-derived project actions ordered and carries urgency into project tasks', () => {
    const report = {
      recommendations: [
        { priority: 'follow_up', action: 'Retest soil after amendment' },
        { priority: 'now', action: 'Check soil salinity' },
        { priority: 'before_planting', action: 'Prepare the seedbed' },
      ],
      followUpPlan: [
        { step: 1, when: 'After 2 weeks', whatToDo: 'Retest soil after amendment' },
        { step: 2, when: 'After 4 weeks', whatToDo: 'Inspect crop establishment' },
      ],
    } as unknown as SoilReport;

    const tasks = deriveProjectTasks(report);

    expect(tasks.map((task) => task.text)).toEqual([
      'Check soil salinity',
      'Prepare the seedbed',
      'Retest soil after amendment',
      'Inspect crop establishment',
    ]);
    expect(tasks.map((task) => task.priority)).toEqual(['urgent', 'high', 'low', 'low']);
    expect(tasks.every((task) => !task.generic)).toBe(true);
  });
});
