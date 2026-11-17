import { getProjects } from '../../src/i18n/projects';
import {
  expenseCategoryLabel,
  projectStatusLabel,
  growthStageLabel,
  taskPriorityLabel,
  taskStatusLabel,
  taskTypeLabel,
} from '../../src/utils/projectLabels';

describe('projects i18n', () => {
  it('keeps ar/fr/en at parity with no empty string', () => {
    const ar = getProjects('ar');
    const fr = getProjects('fr');
    const en = getProjects('en');
    const keys = Object.keys(ar).sort();
    expect(keys.length).toBeGreaterThan(40);
    expect(Object.keys(fr).sort()).toEqual(keys);
    expect(Object.keys(en).sort()).toEqual(keys);
    for (const key of keys as (keyof typeof ar)[]) {
      expect(String(ar[key]).length).toBeGreaterThan(0);
      expect(String(fr[key]).length).toBeGreaterThan(0);
      expect(String(en[key]).length).toBeGreaterThan(0);
    }
  });

  it('falls back to Arabic for an unknown locale', () => {
    expect(getProjects('xx' as any)).toEqual(getProjects('ar'));
  });

  it('localises the closed backend enums', () => {
    const en = getProjects('en');
    const ar = getProjects('ar');
    expect(taskTypeLabel('pest_control', en)).toBe('Pest control');
    expect(taskTypeLabel('pest_control', ar)).toBe('مكافحة آفات');
    expect(taskPriorityLabel('urgent', en)).toBe('Urgent');
    expect(taskStatusLabel('completed', en)).toBe('Completed');
    expect(taskStatusLabel('in_progress', ar)).toBe('قيد التنفيذ');
    expect(expenseCategoryLabel('labor', en)).toBe('Labor');
    expect(expenseCategoryLabel('labor', ar)).toBe('أجرة عمل');
    expect(projectStatusLabel('harvested', en)).toBe('Harvested');
    expect(growthStageLabel('vegetative_growth', en)).toBe('Vegetative growth');
    expect(growthStageLabel('vegetative growth', en)).toBe('Vegetative growth');
    expect(growthStageLabel('vegetative-growth', en)).toBe('Vegetative growth');
    expect(growthStageLabel('flowering', ar)).toBe('الإزهار');
    expect(growthStageLabel('future_unknown_stage', en)).toBe(en.noStage);
  });

  it('never leaks an English token for an unknown enum value', () => {
    const en = getProjects('en');
    // Unknown values fall back to a localised generic label, not the raw token.
    expect(taskTypeLabel('weird_new_type', en)).toBe(en.typeGeneral);
    expect(taskPriorityLabel('weird', en)).toBe(en.priorityMedium);
    expect(expenseCategoryLabel('weird', en)).toBe(en.catOther);
  });
});
