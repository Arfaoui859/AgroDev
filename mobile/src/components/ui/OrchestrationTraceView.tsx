import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { rtlStyles } from '../../theme/rtl';
import { rowGapXs, rowWrapSm } from '../../theme/layout';
import { mutedCaption, noteCaption, xsSemibold } from '../../theme/typographyStyles';
import { useLanguage } from '../../context/LanguageContext';
import { OrchestrationTrace, SpecialistStatus } from '../../types';

interface OrchestrationTraceViewProps {
  trace: OrchestrationTrace;
}

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

/** Status → colour + icon. Kept local so a status never renders without a tone. */
const STATUS_TONE: Record<SpecialistStatus, { color: string; bg: string; icon: IconName }> = {
  ok: { color: colors.success, bg: colors.successLight, icon: 'check-circle-outline' },
  insufficient_input: { color: colors.warning, bg: colors.warningLight, icon: 'help-circle-outline' },
  unavailable: { color: colors.textMuted, bg: colors.surfaceSubtle, icon: 'cloud-off-outline' },
  blocked: { color: colors.accentDark, bg: colors.accentLight, icon: 'lock-outline' },
  failed: { color: colors.danger, bg: colors.dangerLight, icon: 'alert-circle-outline' },
};

/** Confidence → short label key. */
const CONFIDENCE_KEY = {
  high: 'agentsConfidenceHigh',
  medium: 'agentsConfidenceMedium',
  low: 'agentsConfidenceLow',
  unknown: 'agentsConfidenceUnknown',
} as const;

/**
 * Renders the server's real multi-agent orchestration trace for one assistant
 * answer: the execution plan, how it was chosen, and each specialist's status,
 * source and findings. Every value comes from the gateway's response — nothing
 * is inferred client-side, and an agent that did not run is shown as such.
 */
export const OrchestrationTraceView: React.FC<OrchestrationTraceViewProps> = ({ trace }) => {
  const { x, isRtl } = useLanguage();
  const [open, setOpen] = React.useState(false);

  const statusLabel = (status: SpecialistStatus): string => {
    switch (status) {
      case 'ok':
        return x.agentsStatusOk;
      case 'insufficient_input':
        return x.agentsStatusInsufficient;
      case 'unavailable':
        return x.agentsStatusUnavailable;
      case 'blocked':
        return x.agentsStatusBlocked;
      default:
        return x.agentsStatusFailed;
    }
  };

  /** Map the server's `dataSource` token to an honest, localised label. */
  const sourceLabel = (source: string | null): string => {
    switch (source) {
      case 'rule-based':
      case 'heuristic':
        return x.agentsSourceRuleBased;
      case 'open-meteo':
        return x.agentsSourceOpenMeteo;
      case 'persisted-records':
      case 'database':
        return x.agentsSourceRecords;
      case 'rss-feeds':
        return x.agentsSourceRss;
      case 'trained-model-inference':
      case 'trained-model':
        return x.agentsSourceTrained;
      case 'llm':
        return x.agentsSourceLlm;
      default:
        return source ? source : x.agentsSourceNone;
    }
  };

  const durationMs = (() => {
    const start = Date.parse(trace.startedAt);
    const end = Date.parse(trace.finishedAt);
    if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
    return end - start;
  })();

  const okCount = trace.steps.filter((s) => s.status === 'ok').length;

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={[styles.headerRow, isRtl && rtlStyles.rtlRow]}
        activeOpacity={0.7}
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={open ? x.agentsHideTrace : x.agentsShowTrace}
      >
        <MaterialCommunityIcons name="hub" size={16} color={colors.primaryDark} />
        <Text style={[styles.headerTitle, isRtl && rtlStyles.rtlText]}>
          {x.agentsTraceTitle}
        </Text>
        <View style={[styles.countPill, isRtl && rtlStyles.rtlRow]}>
          <Text style={styles.countText}>
            {okCount}/{trace.steps.length}
          </Text>
        </View>
        <MaterialCommunityIcons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.textMuted}
        />
      </TouchableOpacity>

      {open ? (
        <View style={styles.body}>
          <Text style={[styles.subtitle, isRtl && rtlStyles.rtlText]}>{x.agentsTraceSubtitle}</Text>

          <View style={[styles.metaRow, isRtl && rtlStyles.rtlRow]}>
            <MaterialCommunityIcons name="account-cog-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>
              {trace.plannedBy === 'llm' ? x.agentsPlannedByLlm : x.agentsPlannedByKeywords}
            </Text>
          </View>
          <View style={[styles.metaRow, isRtl && rtlStyles.rtlRow]}>
            <MaterialCommunityIcons name="layers-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>
              {x.agentsConcurrency}: {trace.concurrency}
              {durationMs !== null ? `  •  ${x.agentsDuration}: ${durationMs}ms` : ''}
            </Text>
          </View>

          {/* Execution plan — the ordered, allow-listed specialist ids. */}
          <Text style={[styles.sectionLabel, isRtl && rtlStyles.rtlText]}>{x.agentsPlanTitle}</Text>
          <View style={[styles.planRow, isRtl && rtlStyles.rtlRow]}>
            {trace.plan.map((step, index) => (
              <React.Fragment key={step.id}>
                {index > 0 ? (
                  <MaterialCommunityIcons
                    name={isRtl ? 'chevron-left' : 'chevron-right'}
                    size={14}
                    color={colors.textMuted}
                  />
                ) : null}
                <View style={styles.planChip}>
                  <Text style={styles.planChipText}>{step.title}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          {/* Per-specialist result. */}
          <Text style={[styles.sectionLabel, isRtl && rtlStyles.rtlText]}>{x.agentsRunTitle}</Text>
          <View style={styles.stepsList}>
            {trace.steps.map((step) => {
              const tone = STATUS_TONE[step.status] ?? STATUS_TONE.unavailable;
              return (
                <View key={step.id} style={styles.stepCard}>
                  <View style={[styles.stepHead, isRtl && rtlStyles.rtlRow]}>
                    <View style={[styles.stepIcon, { backgroundColor: tone.bg }]}>
                      <MaterialCommunityIcons name={tone.icon} size={16} color={tone.color} />
                    </View>
                    <Text style={[styles.stepTitle, isRtl && rtlStyles.rtlText]} numberOfLines={1}>
                      {step.title}
                    </Text>
                    <View style={[styles.statusPill, { backgroundColor: tone.bg }]}>
                      <Text style={[styles.statusText, { color: tone.color }]}>{statusLabel(step.status)}</Text>
                    </View>
                  </View>

                  <View style={[styles.stepMetaRow, isRtl && rtlStyles.rtlRow]}>
                    <MaterialCommunityIcons name="source-branch" size={12} color={colors.textMuted} />
                    <Text style={styles.stepMeta}>{sourceLabel(step.dataSource)}</Text>
                    <Text style={styles.stepMeta}>• {x[CONFIDENCE_KEY[step.confidence]]}</Text>
                    {step.attempts > 1 ? (
                      <Text style={styles.stepMeta}>• {x.agentsStepAttempts}: {step.attempts}</Text>
                    ) : null}
                  </View>

                  {step.findings.length ? (
                    <View style={styles.findings}>
                      {step.findings.map((finding, i) => (
                        <View key={i} style={[styles.findingRow, isRtl && rtlStyles.rtlRow]}>
                          <Text style={styles.bullet}>•</Text>
                          <Text style={[styles.findingText, isRtl && rtlStyles.rtlText]}>{finding}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  {step.note ? (
                    <Text style={[styles.stepNote, isRtl && rtlStyles.rtlText]}>{step.note}</Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.xs,
  },
  headerRow: { ...rowGapXs, paddingVertical: 4 },
  headerTitle: { ...xsSemibold, color: colors.primaryDark, flexShrink: 1 },
  countPill: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
  },
  countText: { fontSize: typography.fontSizes.xs, lineHeight: typography.lineHeights.xs, color: colors.primaryDark, fontWeight: typography.fontWeights.bold },
  body: { marginTop: spacing.xs },
  subtitle: { ...mutedCaption, marginBottom: spacing.xs },
  metaRow: { ...rowGapXs, marginTop: 2 },
  metaText: { fontSize: typography.fontSizes.xs, color: colors.textSecondary, lineHeight: typography.lineHeights.xs },
  sectionLabel: {
    fontSize: typography.fontSizes.xs,
    lineHeight: typography.lineHeights.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  planRow: { ...rowWrapSm, alignItems: 'center' },
  planChip: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  planChipText: { fontSize: typography.fontSizes.xs, lineHeight: typography.lineHeights.xs, color: colors.textSecondary, fontWeight: typography.fontWeights.medium },
  stepsList: { gap: spacing.xs },
  stepCard: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  stepHead: rowGapXs,
  stepIcon: { width: 26, height: 26, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  stepTitle: { flex: 1, fontSize: typography.fontSizes.sm, lineHeight: typography.lineHeights.sm, fontWeight: typography.fontWeights.semibold, color: colors.text },
  statusPill: { borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 1 },
  statusText: { fontSize: typography.fontSizes.xs, lineHeight: typography.lineHeights.xs, fontWeight: typography.fontWeights.bold },
  stepMetaRow: { ...rowWrapSm, alignItems: 'center', marginTop: spacing.xs },
  stepMeta: { fontSize: typography.fontSizes.xs, lineHeight: typography.lineHeights.xs, color: colors.textMuted },
  findings: { marginTop: spacing.xs },
  findingRow: { ...rowGapXs, alignItems: 'flex-start' },
  bullet: { fontSize: typography.fontSizes.xs, color: colors.primary, lineHeight: typography.lineHeights.xs },
  findingText: { flex: 1, fontSize: typography.fontSizes.xs, color: colors.text, lineHeight: typography.lineHeights.xs },
  stepNote: { ...noteCaption, marginTop: spacing.xs },
});
