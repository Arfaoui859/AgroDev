import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { rtlStyles } from '../../theme/rtl';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { hairlineRow, pillPadSm, spaceBetweenXs } from '../../theme/layout';
import { mutedCaption, mutedCaptionTop, subtitleMeta, xsSemibold } from '../../theme/typographyStyles';
import { useLanguage } from '../../context/LanguageContext';
import { getSoil, SoilTranslations } from '../../i18n/soil';
import { SoilReport, SoilReportAction } from '../../types';
import { SectionHeader } from '../ui/SectionHeader';
import { Bullet } from '../ui/Bullet';

/** A titled section that only renders when it has content. */
const Section: React.FC<{
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  children: React.ReactNode;
}> = ({ title, icon, children }) => (
  <View style={styles.section}>
    <SectionHeader title={title} icon={icon} iconSize={18} titleNumberOfLines={0} />
    {children}
  </View>
);

const Chip: React.FC<{ text: string; tone: 'neutral' | 'ok' | 'warn' | 'danger' | 'info' }> = ({ text, tone }) => {
  const tones: Record<string, { bg: string; fg: string }> = {
    neutral: { bg: colors.surfaceSubtle, fg: colors.textSecondary },
    ok: { bg: colors.successLight, fg: colors.success },
    warn: { bg: colors.warningLight, fg: colors.accentDark },
    danger: { bg: colors.dangerLight, fg: colors.danger },
    info: { bg: colors.infoLight, fg: colors.info },
  };
  const { bg, fg } = tones[tone];
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={[styles.chipText, { color: fg }]}>{text}</Text>
    </View>
  );
};

const severityTone = (s: string): 'neutral' | 'ok' | 'warn' | 'danger' | 'info' => {
  if (s === 'high') return 'danger';
  if (s === 'moderate') return 'warn';
  if (s === 'low') return 'ok';
  if (s === 'informational') return 'info';
  return 'neutral';
};

const severityLabel = (s: string, s9: SoilTranslations): string => {
  switch (s) {
    case 'informational':
      return s9.severityInformational;
    case 'low':
      return s9.severityLow;
    case 'moderate':
      return s9.severityModerate;
    case 'high':
      return s9.severityHigh;
    default:
      return s9.severityNotAssessed;
  }
};

const priorityLabel = (p: string, s9: SoilTranslations): string => {
  switch (p) {
    case 'now':
      return s9.priorityNow;
    case 'before_planting':
      return s9.priorityBeforePlanting;
    case 'during_season':
      return s9.priorityDuringSeason;
    default:
      return s9.priorityFollowUp;
  }
};

const stageLabel = (stage: string, s9: SoilTranslations): string => {
  switch (stage) {
    case 'basal':
      return s9.fertStageBasal;
    case 'establishment':
      return s9.fertStageEstablishment;
    case 'vegetative_growth':
      return s9.fertStageVegetative;
    case 'flowering_filling':
      return s9.fertStageFlowering;
    default:
      return stage;
  }
};

const ActionItem: React.FC<{ action: SoilReportAction }> = ({ action }) => {
  const { isRtl, language } = useLanguage();
  const s9 = getSoil(language);
  return (
    <View style={styles.actionItem}>
      <View style={[styles.actionHead, isRtl && rtlStyles.rtlRow]}>
        <Chip text={priorityLabel(action.priority, s9)} tone="info" />
        {action.when ? <Text style={[styles.actionWhen, isRtl && rtlStyles.rtlText]}>{action.when}</Text> : null}
      </View>
      <Text style={[styles.actionText, isRtl && rtlStyles.rtlText]}>{action.action}</Text>
      {action.reason ? <Text style={[styles.actionSub, isRtl && rtlStyles.rtlText]}>{action.reason}</Text> : null}
      {action.evidence ? <Text style={[styles.actionSub, isRtl && rtlStyles.rtlText]}>{s9.reportEvidence}: {action.evidence}</Text> : null}
      {action.howTo ? <Text style={[styles.actionSub, isRtl && rtlStyles.rtlText]}>{action.howTo}</Text> : null}
      {action.verification ? (
        <Text style={[styles.actionVerify, isRtl && rtlStyles.rtlText]}>{s9.reportVerification}: {action.verification}</Text>
      ) : null}
    </View>
  );
};

/**
 * Renders the professional soil report (schemaVersion 2.0) verbatim. Every
 * Arabic string the server authored is shown as-is (the report language is
 * declared), while the surrounding chrome is localised. Nothing is summarised,
 * reordered or invented — empty sections are simply omitted.
 */
export const SoilReportView: React.FC<{ report: SoilReport }> = ({ report }) => {
  const { language, isRtl } = useLanguage();
  const s9 = getSoil(language);
  const empty = <Text style={[styles.empty, isRtl && rtlStyles.rtlText]}>{s9.reportNoSection}</Text>;

  const confidenceKey: Record<string, string> = {
    low: s9.confidenceLow,
    moderate: s9.confidenceModerate,
    high: s9.confidenceHigh,
    not_assessed: s9.confidenceNotAssessed,
  };
  const feasibilityKey: Record<string, string> = {
    feasible: s9.feasibilityFeasible,
    feasible_with_correction: s9.feasibilityCorrection,
    not_recommended: s9.feasibilityNotRecommended,
    not_assessed: s9.feasibilityNotAssessed,
  };

  return (
    <View>
      <Section title={s9.reportExecutive} icon="text-box-outline">
        <Text style={[styles.body, isRtl && rtlStyles.rtlText]}>{report.executiveSummary}</Text>
        <View style={[styles.chipRow, isRtl && rtlStyles.rtlRow]}>
          <Chip
            text={`${s9.reportConfidence}: ${confidenceKey[report.confidence.level] ?? report.confidence.level}`}
            tone="info"
          />
        </View>
        {report.confidence.reasons.map((r, i) => (
          <Bullet variant="glyph" key={`conf-${i}`} text={r} />
        ))}
      </Section>

      <Section title={s9.reportDataQuality} icon="clipboard-check-outline">
        {report.dataQuality.providedMeasurements.length ? (
          <>
            <Text style={[styles.subHead, isRtl && rtlStyles.rtlText]}>{s9.reportProvided}</Text>
            {report.dataQuality.providedMeasurements.map((m, i) => (
              <Bullet variant="glyph" key={`prov-${i}`} text={`${m.name}: ${m.value} ${m.unit} (${m.source})`} />
            ))}
          </>
        ) : null}
        {report.dataQuality.missingMeasurements.length ? (
          <>
            <Text style={[styles.subHead, isRtl && rtlStyles.rtlText]}>{s9.reportMissing}</Text>
            <View style={[styles.chipRow, isRtl && rtlStyles.rtlRow]}>
              {report.dataQuality.missingMeasurements.map((m, i) => (
                <Chip key={`miss-${i}`} text={m} tone="warn" />
              ))}
            </View>
          </>
        ) : null}
        {report.dataQuality.limitations.length ? (
          <>
            <Text style={[styles.subHead, isRtl && rtlStyles.rtlText]}>{s9.reportLimitations}</Text>
            {report.dataQuality.limitations.map((m, i) => (
              <Bullet variant="glyph" key={`lim-${i}`} text={m} />
            ))}
          </>
        ) : null}
        {report.dataQuality.consistencyChecks.length ? (
          <>
            <Text style={[styles.subHead, isRtl && rtlStyles.rtlText]}>{s9.reportConsistency}</Text>
            {report.dataQuality.consistencyChecks.map((m, i) => (
              <Bullet variant="glyph" key={`con-${i}`} text={m} />
            ))}
          </>
        ) : null}
      </Section>

      {report.indicatorTable.length ? (
        <Section title={s9.reportIndicators} icon="table">
          {report.indicatorTable.map((row, i) => (
            <View key={`ind-${i}`} style={styles.tableRow}>
              <View style={[styles.tableHead, isRtl && rtlStyles.rtlRow]}>
                <Text style={[styles.tableParam, isRtl && rtlStyles.rtlText]}>{row.parameter}</Text>
                <Text style={styles.tableValue}>
                  {row.value} {row.unit}
                </Text>
              </View>
              <Text style={[styles.tableSub, isRtl && rtlStyles.rtlText]}>{row.classification}</Text>
              {row.cropEffect ? <Text style={[styles.tableSub, isRtl && rtlStyles.rtlText]}>{row.cropEffect}</Text> : null}
              {row.evidence ? <Text style={[styles.tableEvidence, isRtl && rtlStyles.rtlText]}>{row.evidence}</Text> : null}
            </View>
          ))}
        </Section>
      ) : null}

      <Section title={s9.reportTexture} icon="grain">
        <Text style={[styles.body, isRtl && rtlStyles.rtlText]}>
          {report.soilCharacterization.texture.classification} — {report.soilCharacterization.texture.basis}
        </Text>
        {report.soilCharacterization.chemical.map((c, i) => (
          <Bullet variant="glyph" key={`chem-${i}`} text={c} />
        ))}
        {report.soilCharacterization.physical.map((c, i) => (
          <Bullet variant="glyph" key={`phys-${i}`} text={c} />
        ))}
      </Section>

      {report.findings.length ? (
        <Section title={s9.reportFindings} icon="magnify">
          {report.findings.map((f, i) => (
            <View key={`find-${i}`} style={styles.findingRow}>
              <View style={[styles.actionHead, isRtl && rtlStyles.rtlRow]}>
                <Text style={[styles.findingParam, isRtl && rtlStyles.rtlText]}>
                  {f.parameter}: {f.observedValue} {f.unit}
                </Text>
                <Chip text={severityLabel(f.severity, s9)} tone={severityTone(f.severity)} />
              </View>
              <Text style={[styles.body, isRtl && rtlStyles.rtlText]}>{f.interpretation}</Text>
              {f.importance ? <Text style={[styles.tableSub, isRtl && rtlStyles.rtlText]}>{s9.reportImportance}: {f.importance}</Text> : null}
              {f.evidence ? <Text style={[styles.tableEvidence, isRtl && rtlStyles.rtlText]}>{s9.reportEvidence}: {f.evidence}</Text> : null}
            </View>
          ))}
        </Section>
      ) : null}

      {report.rankedConstraints.length ? (
        <Section title={s9.reportConstraints} icon="alert-outline">
          {report.rankedConstraints.map((c, i) => (
            <View key={`rank-${i}`} style={styles.findingRow}>
              <View style={[styles.actionHead, isRtl && rtlStyles.rtlRow]}>
                <Text style={[styles.findingParam, isRtl && rtlStyles.rtlText]}>
                  {c.rank}. {c.constraint}
                </Text>
                <Chip text={severityLabel(c.severity, s9)} tone={severityTone(c.severity)} />
              </View>
              {c.evidence ? <Text style={[styles.tableSub, isRtl && rtlStyles.rtlText]}>{c.evidence}</Text> : null}
              {c.cropImpact ? <Text style={[styles.body, isRtl && rtlStyles.rtlText]}>{c.cropImpact}</Text> : null}
              {c.whatToConfirm ? <Text style={[styles.tableEvidence, isRtl && rtlStyles.rtlText]}>{c.whatToConfirm}</Text> : null}
            </View>
          ))}
        </Section>
      ) : null}

      {report.strengths.length || report.constraints.length ? (
        <Section title={`${s9.reportStrengths} / ${s9.reportConstraints}`} icon="scale-balance">
          {report.strengths.map((s, i) => (
            <Bullet variant="glyph" key={`str-${i}`} text={s} />
          ))}
          {report.constraints.map((s, i) => (
            <Bullet variant="glyph" key={`cst-${i}`} text={s} />
          ))}
        </Section>
      ) : null}

      <Section title={s9.reportCropSuitability} icon="sprout-outline">
        {report.cropSuitability.candidates.length ? (
          report.cropSuitability.candidates.map((cand, i) => (
            <View key={`cand-${i}`} style={styles.findingRow}>
              <View style={[styles.actionHead, isRtl && rtlStyles.rtlRow]}>
                <Text style={[styles.findingParam, isRtl && rtlStyles.rtlText]}>{cand.crop}</Text>
                <Chip
                  text={
                    cand.status === 'possible'
                      ? s9.candidatePossible
                      : cand.status === 'possible_with_checks'
                        ? s9.candidateChecks
                        : s9.statusNotAssessed
                  }
                  tone={cand.status === 'possible' ? 'ok' : cand.status === 'possible_with_checks' ? 'warn' : 'neutral'}
                />
              </View>
              {cand.why_it_may_fit ? <Text style={[styles.body, isRtl && rtlStyles.rtlText]}>{cand.why_it_may_fit}</Text> : null}
              {cand.risk ? <Text style={[styles.tableSub, isRtl && rtlStyles.rtlText]}>{cand.risk}</Text> : null}
              {cand.sowingWindow ? <Text style={[styles.tableSub, isRtl && rtlStyles.rtlText]}>{cand.sowingWindow}</Text> : null}
              {cand.conditions_to_check.map((cond, j) => (
                <Bullet variant="glyph" key={`cond-${i}-${j}`} text={cond} />
              ))}
              {cand.limitations ? <Text style={[styles.tableEvidence, isRtl && rtlStyles.rtlText]}>{cand.limitations}</Text> : null}
            </View>
          ))
        ) : (
          empty
        )}
        {report.cropSuitability.avoid.length ? (
          <>
            <Text style={[styles.subHead, isRtl && rtlStyles.rtlText]}>{s9.reportCropAvoid}</Text>
            {report.cropSuitability.avoid.map((a, i) => (
              <Bullet variant="glyph" key={`avoid-${i}`} text={`${a.crop}: ${a.reason}`} />
            ))}
          </>
        ) : null}
        {report.cropSuitability.caveats.map((c, i) => (
          <Text key={`caveat-${i}`} style={[styles.tableEvidence, isRtl && rtlStyles.rtlText]}>
            {c}
          </Text>
        ))}
      </Section>

      {report.targetCropPlan && report.targetCropPlan.targetCrop ? (
        <Section title={s9.reportTargetPlan} icon="target">
          <View style={[styles.chipRow, isRtl && rtlStyles.rtlRow]}>
            <Chip text={report.targetCropPlan.targetCrop} tone="info" />
            <Chip
              text={feasibilityKey[report.targetCropPlan.feasibility] ?? report.targetCropPlan.feasibility}
              tone={
                report.targetCropPlan.feasibility === 'feasible'
                  ? 'ok'
                  : report.targetCropPlan.feasibility === 'not_recommended'
                    ? 'danger'
                    : 'warn'
              }
            />
          </View>
          {report.targetCropPlan.reasons.map((r, i) => (
            <Bullet variant="glyph" key={`tr-${i}`} text={r} />
          ))}
          {report.targetCropPlan.gaps.length ? (
            <>
              <Text style={[styles.subHead, isRtl && rtlStyles.rtlText]}>{s9.reportGaps}</Text>
              {report.targetCropPlan.gaps.map((g, i) => (
                <Bullet variant="glyph" key={`gap-${i}`} text={`${g.parameter}: ${g.current} → ${g.required} (${g.gap})`} />
              ))}
            </>
          ) : null}
          {report.targetCropPlan.firstAction ? (
            <Text style={[styles.body, isRtl && rtlStyles.rtlText]}>
              {s9.reportFirstAction}: {report.targetCropPlan.firstAction}
            </Text>
          ) : null}
          {report.targetCropPlan.retestWhen ? (
            <Text style={[styles.tableSub, isRtl && rtlStyles.rtlText]}>
              {s9.reportRetestWhen}: {report.targetCropPlan.retestWhen}
            </Text>
          ) : null}
          {report.targetCropPlan.actions.map((a, i) => (
            <ActionItem key={`ta-${i}`} action={a} />
          ))}
        </Section>
      ) : null}

      <Section title={s9.reportFertilization} icon="flask-outline">
        <Chip
          text={report.fertilizationPlan.status === 'guidance_only' ? s9.statusGuidanceOnly : s9.statusNotAssessed}
          tone={report.fertilizationPlan.status === 'guidance_only' ? 'info' : 'neutral'}
        />
        {report.fertilizationPlan.stages.map((stage, i) => (
          <View key={`fert-${i}`} style={styles.findingRow}>
            <Text style={[styles.findingParam, isRtl && rtlStyles.rtlText]}>{stageLabel(stage.stage, s9)}</Text>
            <Text style={[styles.body, isRtl && rtlStyles.rtlText]}>{stage.strategy}</Text>
            {stage.productExamples.length ? (
              <View style={[styles.chipRow, isRtl && rtlStyles.rtlRow]}>
                {stage.productExamples.map((p, j) => (
                  <Chip key={`prod-${i}-${j}`} text={p} tone="neutral" />
                ))}
              </View>
            ) : null}
            {stage.timing ? <Text style={[styles.tableSub, isRtl && rtlStyles.rtlText]}>{stage.timing}</Text> : null}
            {stage.basis ? <Text style={[styles.tableEvidence, isRtl && rtlStyles.rtlText]}>{s9.reportEvidence}: {stage.basis}</Text> : null}
            {stage.verification ? <Text style={[styles.tableSub, isRtl && rtlStyles.rtlText]}>{s9.reportVerification}: {stage.verification}</Text> : null}
          </View>
        ))}
        {report.fertilizationPlan.withheldDosesReason ? (
          <Text style={[styles.tableEvidence, isRtl && rtlStyles.rtlText]}>
            {report.fertilizationPlan.withheldDosesReason}
          </Text>
        ) : null}
        {report.fertilizationPlan.organicOptions.length ? (
          <>
            <Text style={[styles.subHead, isRtl && rtlStyles.rtlText]}>{s9.reportOrganicOptions}</Text>
            {report.fertilizationPlan.organicOptions.map((o, i) => (
              <Bullet variant="glyph" key={`org-${i}`} text={o} />
            ))}
          </>
        ) : null}
      </Section>

      <Section title={s9.reportWater} icon="water">
        <Chip
          text={report.waterAndIrrigation.status === 'guidance_only' ? s9.statusGuidanceOnly : s9.statusNotAssessed}
          tone={report.waterAndIrrigation.status === 'guidance_only' ? 'info' : 'neutral'}
        />
        {[
          report.waterAndIrrigation.method,
          report.waterAndIrrigation.frequency,
          report.waterAndIrrigation.amount,
          report.waterAndIrrigation.waterQuality,
          report.waterAndIrrigation.salinityAndLeaching,
          report.waterAndIrrigation.drainage,
        ]
          .filter(Boolean)
          .map((line, i) => (
            <Bullet variant="glyph" key={`water-${i}`} text={line} />
          ))}
        {report.waterAndIrrigation.limitations.map((l, i) => (
          <Text key={`wlim-${i}`} style={[styles.tableEvidence, isRtl && rtlStyles.rtlText]}>
            {l}
          </Text>
        ))}
      </Section>

      {report.twelveWeekCalendar.length ? (
        <Section title={s9.reportCalendar} icon="calendar-month-outline">
          {report.twelveWeekCalendar.map((w) => (
            <View key={`week-${w.week}`} style={styles.findingRow}>
              <Text style={[styles.findingParam, isRtl && rtlStyles.rtlText]}>
                {w.week}
              </Text>
              {w.actions.map((a, j) => (
                <Bullet variant="glyph" key={`wa-${w.week}-${j}`} text={a} />
              ))}
              {w.check ? <Text style={[styles.tableSub, isRtl && rtlStyles.rtlText]}>{w.check}</Text> : null}
            </View>
          ))}
        </Section>
      ) : null}

      {report.riskAlerts.length ? (
        <Section title={s9.reportRisks} icon="alert-circle-outline">
          {report.riskAlerts.map((risk, i) => (
            <View key={`risk-${i}`} style={styles.findingRow}>
              <View style={[styles.actionHead, isRtl && rtlStyles.rtlRow]}>
                <Text style={[styles.findingParam, isRtl && rtlStyles.rtlText]}>{risk.risk}</Text>
                <Chip text={severityLabel(risk.severity, s9)} tone={severityTone(risk.severity)} />
              </View>
              {risk.trigger ? <Text style={[styles.tableSub, isRtl && rtlStyles.rtlText]}>{risk.trigger}</Text> : null}
              {risk.symptomsToMonitor.map((s, j) => (
                <Bullet variant="glyph" key={`sym-${i}-${j}`} text={s} />
              ))}
              {risk.safeResponse ? <Text style={[styles.body, isRtl && rtlStyles.rtlText]}>{risk.safeResponse}</Text> : null}
            </View>
          ))}
        </Section>
      ) : null}

      {report.recommendations.length ? (
        <Section title={s9.reportRecommendations} icon="lightbulb-on-outline">
          {report.recommendations.map((a, i) => (
            <ActionItem key={`rec-${i}`} action={a} />
          ))}
        </Section>
      ) : null}

      {report.followUpPlan.length ? (
        <Section title={s9.reportFollowUp} icon="calendar-check-outline">
          {report.followUpPlan.map((f) => (
            <View key={`fu-${f.step}`} style={styles.findingRow}>
              <Text style={[styles.findingParam, isRtl && rtlStyles.rtlText]}>
                {f.step}. {f.when}
              </Text>
              <Text style={[styles.body, isRtl && rtlStyles.rtlText]}>{f.whatToDo}</Text>
              {f.whatToMeasure ? <Text style={[styles.tableSub, isRtl && rtlStyles.rtlText]}>{f.whatToMeasure}</Text> : null}
              {f.why ? <Text style={[styles.tableEvidence, isRtl && rtlStyles.rtlText]}>{f.why}</Text> : null}
            </View>
          ))}
        </Section>
      ) : null}

      {report.additionalInformationNeeded.length ? (
        <Section title={s9.reportExtraInfo} icon="information-outline">
          {report.additionalInformationNeeded.map((a, i) => (
            <Bullet variant="glyph" key={`info-${i}`} text={a} />
          ))}
        </Section>
      ) : null}

      <Section title={s9.reportReview} icon="account-tie-outline">
        <Text style={[styles.body, isRtl && rtlStyles.rtlText]}>{report.professionalReview.reason}</Text>
        {report.professionalReview.bringToAgronomist.map((b, i) => (
          <Bullet variant="glyph" key={`br-${i}`} text={b} />
        ))}
      </Section>

      {report.disclaimers.length ? (
        <Section title={s9.reportDisclaimers} icon="shield-alert-outline">
          {report.disclaimers.map((d, i) => (
            <Text key={`disc-${i}`} style={[styles.tableEvidence, isRtl && rtlStyles.rtlText]}>
              {d}
            </Text>
          ))}
        </Section>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  body: { fontSize: typography.fontSizes.sm, lineHeight: typography.lineHeights.sm, color: colors.text, marginBottom: spacing.xs },
  subHead: {
    fontSize: typography.fontSizes.xs,
    lineHeight: typography.lineHeights.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  empty: { fontSize: typography.fontSizes.sm, lineHeight: typography.lineHeights.sm, color: colors.textMuted },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.xs, marginBottom: spacing.xs },
  chip: { ...pillPadSm, borderRadius: radius.full },
  chipText: xsSemibold,
  tableRow: hairlineRow,
  tableHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tableParam: {
    flex: 1,
    fontSize: typography.fontSizes.sm,
    lineHeight: typography.lineHeights.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text,
  },
  tableValue: {
    fontSize: typography.fontSizes.sm,
    lineHeight: typography.lineHeights.sm,
    color: colors.primaryDark,
    fontWeight: typography.fontWeights.bold,
  },
  tableSub: subtitleMeta,
  tableEvidence: mutedCaptionTop,
  findingRow: hairlineRow,
  findingParam: {
    flex: 1,
    fontSize: typography.fontSizes.sm,
    lineHeight: typography.lineHeights.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  actionItem: { backgroundColor: colors.surfaceSubtle, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm },
  actionHead: spaceBetweenXs,
  actionWhen: mutedCaption,
  actionText: {
    fontSize: typography.fontSizes.sm,
    lineHeight: typography.lineHeights.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text,
  },
  actionSub: subtitleMeta,
  actionVerify: { fontSize: typography.fontSizes.xs, lineHeight: typography.lineHeights.xs, color: colors.info, marginTop: 3 },
});
