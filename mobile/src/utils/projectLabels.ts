import { ProjectTranslations } from '../i18n/projects';
import { FarmTaskPriority, FarmTaskStatus, FarmTaskType } from '../types';

/**
 * Closed label maps for the agricultural-projects module. The backend stores
 * stable English enum values (`farm_tasks.task_type`, `.priority`, `.status`,
 * `farm_expenses.category`); the UI must render a localised label for each so an
 * Arabic-first user never sees a raw English token. A closed map (rather than a
 * `t[key]` lookup) makes a missing translation a TypeScript error, not a silent
 * English leak.
 */

export const TASK_TYPE_ORDER: FarmTaskType[] = [
  'planting',
  'irrigation',
  'fertilization',
  'pest_control',
  'harvesting',
  'maintenance',
  'inspection',
  'general',
];

export function taskTypeLabel(type: string, p: ProjectTranslations): string {
  switch (type) {
    case 'planting':
      return p.typePlanting;
    case 'irrigation':
      return p.typeIrrigation;
    case 'fertilization':
      return p.typeFertilization;
    case 'pest_control':
      return p.typePestControl;
    case 'harvesting':
      return p.typeHarvesting;
    case 'maintenance':
      return p.typeMaintenance;
    case 'inspection':
      return p.typeInspection;
    default:
      return p.typeGeneral;
  }
}

export const TASK_PRIORITY_ORDER: FarmTaskPriority[] = ['low', 'medium', 'high', 'urgent'];

export function taskPriorityLabel(priority: string, p: ProjectTranslations): string {
  switch (priority) {
    case 'low':
      return p.priorityLow;
    case 'high':
      return p.priorityHigh;
    case 'urgent':
      return p.priorityUrgent;
    default:
      return p.priorityMedium;
  }
}

export function taskStatusLabel(status: string, p: ProjectTranslations): string {
  switch (status) {
    case 'completed':
      return p.taskCompleted;
    case 'in_progress':
      return p.taskInProgress;
    case 'cancelled':
      return p.taskCancelled;
    default:
      return p.taskPending;
  }
}

export const EXPENSE_CATEGORIES = [
  'seeds',
  'fertilizers',
  'pesticides',
  'labor',
  'equipment',
  'fuel',
  'maintenance',
  'utilities',
  'insurance',
  'other',
] as const;

export function expenseCategoryLabel(category: string, p: ProjectTranslations): string {
  switch (category) {
    case 'seeds':
      return p.catSeeds;
    case 'fertilizers':
      return p.catFertilizers;
    case 'pesticides':
      return p.catPesticides;
    case 'labor':
      return p.catLabor;
    case 'equipment':
      return p.catEquipment;
    case 'fuel':
      return p.catFuel;
    case 'maintenance':
      return p.catMaintenance;
    case 'utilities':
      return p.catUtilities;
    case 'insurance':
      return p.catInsurance;
    default:
      return p.catOther;
  }
}

/** Localised label for a cultivation project's lifecycle status. */
export function projectStatusLabel(status: string, p: ProjectTranslations): string {
  switch (status) {
    case 'harvested':
      return p.statusHarvested;
    case 'failed':
      return p.statusFailed;
    case 'planned':
      return p.statusPlanned;
    default:
      return p.statusActive;
  }
}

/** Language-aware order for enum pickers (kept explicit for clarity). */
export function taskTypeOptions(p: ProjectTranslations): { value: FarmTaskType; label: string }[] {
  return TASK_TYPE_ORDER.map((value) => ({ value, label: taskTypeLabel(value, p) }));
}

export function taskPriorityOptions(
  p: ProjectTranslations,
): { value: FarmTaskPriority; label: string }[] {
  return TASK_PRIORITY_ORDER.map((value) => ({ value, label: taskPriorityLabel(value, p) }));
}

export function expenseCategoryOptions(
  p: ProjectTranslations,
): { value: string; label: string }[] {
  return EXPENSE_CATEGORIES.map((value) => ({ value, label: expenseCategoryLabel(value, p) }));
}

/** True when the value is a status the app knows how to render. */
export function isKnownTaskStatus(status: string): status is FarmTaskStatus {
  return status === 'pending' || status === 'in_progress' || status === 'completed' || status === 'cancelled';
}
