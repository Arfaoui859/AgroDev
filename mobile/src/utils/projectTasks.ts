import { SoilReport } from '../types';

export type ProjectTaskKind = 'measure' | 'prepare' | 'amend' | 'irrigation' | 'plant' | 'monitor' | 'retest' | 'general';

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
    const appendAction = (id: string, action: SoilReport['recommendations'][number]) => {
      const text = action.action?.trim();
      if (!text || seen.has(text)) return;
      seen.add(text);
      tasks.push({
        id,
        // The report schema does not classify action type. Keep it "general"
        // rather than guessing that an urgent action is fertilization etc.
        kind: 'general',
        text,
        generic: false,
        priority: action.priority === 'now' ? 'urgent' : action.priority === 'before_planting' ? 'high' : action.priority === 'during_season' ? 'medium' : 'low',
      });
    };

    [...report.recommendations]
      .sort((a, b) => priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority))
      .forEach((action, index) => appendAction(`rec-${index}`, action));

    report.targetCropPlan?.actions.forEach((action, index) => appendAction(`target-${index}`, action));

    report.followUpPlan.forEach((step, index) => {
      const text = step.whatToDo?.trim();
      if (!text || seen.has(text)) return;
      seen.add(text);
      tasks.push({ id: `follow-${index}`, kind: 'retest', text, generic: false, priority: 'low' });
    });

    report.twelveWeekCalendar.forEach((week) => {
      week.actions.forEach((action, index) => {
        const text = action.trim();
        if (!text || seen.has(text)) return;
        seen.add(text);
        tasks.push({
          id: `week-${week.week}-${index}`,
          kind: 'monitor',
          text,
          generic: false,
          priority: 'medium',
        });
      });
    });

    if (tasks.length > 0) return tasks;
  }

  // No persisted report: a minimal, honest generic sequence, explicitly
  // marked generic so it is not confused with analysis-derived advice.
  return [
    { id: 'generic-prepare', kind: 'prepare', text: '', generic: true, priority: 'high' },
    { id: 'generic-plant', kind: 'plant', text: '', generic: true, priority: 'high' },
    { id: 'generic-monitor', kind: 'monitor', text: '', generic: true, priority: 'medium' },
    { id: 'generic-retest', kind: 'retest', text: '', generic: true, priority: 'low' },
  ];
}
