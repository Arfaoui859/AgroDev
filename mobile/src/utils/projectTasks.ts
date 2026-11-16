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
  /** Supporting detail from the persisted soil report; never generated locally. */
  reason?: string;
  howTo?: string;
  when?: string;
  verification?: string;
  evidence?: string;
  /** Numeric rate is retained only when the report supplies it. */
  quantity?: number | null;
}

/**
 * Derive an ordered, evidence-aware cultivation checklist.
 *
 * A persisted report is the source of crop-specific recommendations. We keep
 * the report's rationale, method, timing, verification and evidence attached
 * to each task so the tracker can explain the work, not just show a short title.
 * Without a report we return a small generic sequence and never imply it was
 * tailored from measurements.
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
        kind: 'general',
        text,
        generic: false,
        priority: action.priority === 'now' ? 'urgent' : action.priority === 'before_planting' ? 'high' : action.priority === 'during_season' ? 'medium' : 'low',
        reason: action.reason,
        howTo: action.howTo,
        when: action.when,
        verification: action.verification,
        evidence: action.evidence,
        quantity: action.quantity,
      });
    };

    [...report.recommendations]
      .sort((a, b) => priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority))
      .forEach((action, index) => appendAction(`rec-${index}`, action));

    report.targetCropPlan?.actions.forEach((action, index) => appendAction(`target-${index}`, action));

    if (report.targetCropPlan?.firstAction?.trim() && !seen.has(report.targetCropPlan.firstAction.trim())) {
      const text = report.targetCropPlan.firstAction.trim();
      seen.add(text);
      tasks.push({
        id: 'target-first-action',
        kind: 'prepare',
        text,
        generic: false,
        priority: 'high',
        reason: report.targetCropPlan.reasons.join('; '),
        when: 'Before planting or before the next crop decision',
        verification: report.targetCropPlan.retestWhen,
      });
    }

    if (report.targetCropPlan?.gaps.length) {
      const gapText = report.targetCropPlan.gaps
        .map((gap) => `${gap.parameter}: ${gap.current} → ${gap.required}`)
        .join('; ');
      if (gapText && !seen.has(gapText)) {
        seen.add(gapText);
        tasks.push({
          id: 'target-crop-gaps',
          kind: 'measure',
          text: `Confirm target-crop constraints: ${gapText}`,
          generic: false,
          priority: 'high',
          reason: report.targetCropPlan.gaps.map((gap) => gap.evidence).filter(Boolean).join('; '),
          when: 'Before committing to planting',
          verification: 'Confirm each required value with a field or laboratory measurement',
        });
      }
    }

    if (report.dataQuality.missingMeasurements.length) {
      const missing = report.dataQuality.missingMeasurements.join(', ');
      if (!seen.has(missing)) {
        seen.add(missing);
        tasks.push({
          id: 'missing-soil-measurements',
          kind: 'measure',
          text: `Collect missing soil measurements: ${missing}`,
          generic: false,
          priority: 'high',
          reason: 'The report lists these measurements as missing',
          when: 'Before final fertilizer or crop suitability decisions',
          verification: 'Attach a laboratory result or a documented field measurement',
        });
      }
    }

    if (report.fertilizationPlan.stages.length === 0 && report.fertilizationPlan.withheldDosesReason?.trim()) {
      tasks.push({
        id: 'fertilizer-dose-withheld',
        kind: 'amend',
        text: 'Do not apply a calculated fertilizer dose yet',
        generic: false,
        priority: 'high',
        reason: report.fertilizationPlan.withheldDosesReason,
        when: 'Before applying mineral fertilizer',
        verification: 'Obtain the missing laboratory nutrient values and confirm the nutrient units and extraction method',
        evidence: 'The soil report explicitly withheld dose calculations',
        quantity: null,
      });
    }

    report.fertilizationPlan.stages.forEach((stage, index) => {
      const text = [stage.stage, stage.strategy].filter(Boolean).join(': ').trim();
      if (!text || seen.has(text)) return;
      seen.add(text);
      tasks.push({
        id: `fertilizer-${index}`,
        kind: 'amend',
        text,
        generic: false,
        priority: index === 0 ? 'high' : 'medium',
        reason: stage.basis,
        howTo: stage.productExamples.length ? stage.productExamples.join(', ') : undefined,
        when: stage.timing,
        verification: stage.verification,
        evidence: stage.basis,
        quantity: stage.rate,
      });
    });

    if (report.waterAndIrrigation.status !== 'not_assessed') {
      const irrigationText = report.waterAndIrrigation.method?.trim();
      if (irrigationText && !seen.has(irrigationText)) {
        seen.add(irrigationText);
        tasks.push({
          id: 'water-irrigation',
          kind: 'irrigation',
          text: irrigationText,
          generic: false,
          priority: 'medium',
          reason: report.waterAndIrrigation.frequency,
          howTo: report.waterAndIrrigation.amount,
          when: report.waterAndIrrigation.frequency,
          verification: report.waterAndIrrigation.waterQuality,
          evidence: report.waterAndIrrigation.limitations.join('; '),
        });
      }
    }

    report.riskAlerts.forEach((risk, index) => {
      const text = risk.risk?.trim();
      if (!text || seen.has(text)) return;
      seen.add(text);
      tasks.push({
        id: `risk-${index}`,
        kind: 'monitor',
        text,
        generic: false,
        priority: risk.severity === 'high' ? 'high' : risk.severity === 'moderate' ? 'medium' : 'low',
        reason: risk.trigger,
        howTo: risk.safeResponse,
        when: risk.symptomsToMonitor.join(', '),
        verification: risk.symptomsToMonitor.join(', '),
      });
    });

    report.followUpPlan.forEach((step, index) => {
      const text = step.whatToDo?.trim();
      if (!text || seen.has(text)) return;
      seen.add(text);
      tasks.push({
        id: `follow-${index}`,
        kind: 'retest',
        text,
        generic: false,
        priority: 'low',
        reason: step.why,
        howTo: step.whatToMeasure,
        when: step.when,
        verification: step.whatToMeasure,
      });
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
          when: `Week ${week.week}`,
          verification: week.check,
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
