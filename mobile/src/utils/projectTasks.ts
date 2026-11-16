import { SoilReport } from '../types';

export type ProjectTaskKind = 'measure' | 'prepare' | 'amend' | 'irrigation' | 'plant' | 'monitor' | 'retest';

export interface ProjectTask {
  /** Stable id so the task can be de-duplicated when persisted for a project. */
  id: string;
  kind: ProjectTaskKind;
  /** Server-authored text (Arabic) or a localised generic label. */
  text: string;
  /** True when the text is a localised generic label, not report content. */
  generic: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

/**
 * Derive an ordered checklist for a cultivation project.
 *
 * When the plot has a persisted soil report, its own recommendations drive the
 * list (priority order), so the tasks reflect the actual analysis rather than
 * boilerplate. Without a report we fall back to a minimal, clearly-labelled
 * generic sequence (prepare → plant → monitor → retest) — never presented as
 * analysis-derived.
 */
export function deriveProjectTasks(report: SoilReport | null): ProjectTask[] {
  if (report) {
    const tasks: ProjectTask[] = [];
    const priorityOrder = ['now', 'before_planting', 'during_season', 'follow_up'];
    const seen = new Set<string>();
    const ordered = [...report.recommendations].sort(
      (a, b) => priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority),
    );
    ordered.forEach((action, index) => {
      const text = action.action?.trim();
      if (!text || seen.has(text)) return;
      seen.add(text);
      tasks.push({
        id: `rec-${index}`,
        kind: kindFromPriority(action.priority),
        text,
        generic: false,
        priority: action.priority === 'now' ? 'urgent' : action.priority === 'before_planting' ? 'high' : action.priority === 'during_season' ? 'medium' : 'low',
      });
    });
    report.followUpPlan.forEach((step, index) => {
      const text = step.whatToDo?.trim();
      if (!text || seen.has(text)) return;
      seen.add(text);
      tasks.push({ id: `follow-${index}`, kind: 'retest', text, generic: false, priority: 'low' });
    });
    if (tasks.length > 0) return tasks;
  }
  // No report: a minimal, honest generic sequence. `generic: true` lets the UI
  // label these as general guidance rather than analysis-derived.
  return [
    { id: 'generic-prepare', kind: 'prepare', text: '', generic: true, priority: 'high' },
    { id: 'generic-plant', kind: 'plant', text: '', generic: true, priority: 'high' },
    { id: 'generic-monitor', kind: 'monitor', text: '', generic: true, priority: 'medium' },
    { id: 'generic-retest', kind: 'retest', text: '', generic: true, priority: 'low' },
  ];
}

function kindFromPriority(priority: string): ProjectTaskKind {
  switch (priority) {
    case 'before_planting':
      return 'prepare';
    case 'during_season':
      return 'monitor';
    case 'follow_up':
      return 'retest';
    default:
      return 'amend';
  }
}
