import { deriveProjectTasks } from '../../src/utils/projectTasks';
import { SoilReport } from '../../src/types';

const emptyReport = (overrides: Partial<SoilReport> = {}): SoilReport => ({
  recommendations: [],
  fertilizationPlan: {
    status: 'guidance_only',
    stages: [],
    organicOptions: [],
    withheldDosesReason: 'Lab values required',
  },
  waterAndIrrigation: {
    status: 'not_assessed',
    method: '',
    frequency: '',
    amount: '',
    waterQuality: '',
    salinityAndLeaching: '',
    drainage: '',
    limitations: [],
  },
  riskAlerts: [],
  followUpPlan: [],
  twelveWeekCalendar: [],
  ...({} as SoilReport),
  ...overrides,
});

describe('deriveProjectTasks', () => {
  it('labels the fallback lifecycle as generic when no report exists', () => {
    const tasks = deriveProjectTasks(null);
    expect(tasks).toHaveLength(4);
    expect(tasks.every((task) => task.generic)).toBe(true);
    expect(tasks.some((task) => task.text.length > 0)).toBe(false);
  });

  it('preserves the report rationale, method, timing and evidence', () => {
    const report = emptyReport({
      recommendations: [{
        priority: 'before_planting',
        action: 'Prepare the seedbed',
        reason: 'Compaction was observed',
        howTo: 'Loosen the topsoil without working it when wet',
        when: 'Before transplanting',
        verification: 'Check that water infiltrates evenly',
        evidence: 'Field observation',
        quantity: null,
      }],
    });
    const tasks = deriveProjectTasks(report);
    expect(tasks[0]).toMatchObject({
      text: 'Prepare the seedbed',
      generic: false,
      reason: 'Compaction was observed',
      howTo: 'Loosen the topsoil without working it when wet',
      when: 'Before transplanting',
      verification: 'Check that water infiltrates evenly',
      evidence: 'Field observation',
      quantity: null,
    });
  });

  it('does not invent fertilizer rates when the report withholds doses', () => {
    const report = emptyReport({
      fertilizationPlan: {
        status: 'guidance_only',
        stages: [{
          stage: 'Pre-plant',
          strategy: 'Use only after confirming laboratory nutrient levels',
          productExamples: ['Compost'],
          rate: null,
          timing: 'Before planting',
          basis: 'No validated NPK lab values',
          verification: 'Re-test soil',
        }],
        organicOptions: [],
        withheldDosesReason: 'No validated NPK lab values',
      },
    });
    const tasks = deriveProjectTasks(report);
    expect(tasks[0].quantity).toBeNull();
    expect(tasks[0].reason).toBe('No validated NPK lab values');
  });
});
