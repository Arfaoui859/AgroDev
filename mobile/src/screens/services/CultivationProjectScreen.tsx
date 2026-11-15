import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { screenStyles, stackedCard } from '../../theme/layout';
import { rtlStyles } from '../../theme/rtl';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme/colors';
import { mutedCaption, titleBase } from '../../theme/typographyStyles';
import { useLanguage } from '../../context/LanguageContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ServiceHeader } from '../../components/ui/ServiceHeader';
import { StateView } from '../../components/ui/StateView';
import { ProvenanceBar } from '../../components/ui/ProvenanceBar';
import { FormField } from '../../components/ui/FormField';
import {
  createCultivation,
  getCultivations,
  getSoilReports,
  getSoilReport,
} from '../../api/client';
import { getTaskState, setTaskDone } from '../../api/projectTasks';
import { deriveProjectTasks, ProjectTask } from '../../utils/projectTasks';
import { cropName } from '../../utils/cropLabels';
import { getSoil } from '../../i18n/soil';
import { Cultivation, SoilReport, ProvenanceMeta } from '../../types';
import { CropSelection } from './CropRecommendationScreen';
import { MarketplaceMatch } from '../../components/soil/MarketplaceMatch';

interface CultivationProjectScreenProps {
  onBack: () => void;
  selection: CropSelection;
  farmName?: string;
  fieldName?: string;
}

/** Map a task kind to its localised generic label. */
function genericLabel(kind: ProjectTask['kind'], s9: ReturnType<typeof getSoil>): string {
  switch (kind) {
    case 'measure':
      return s9.taskDoMeasurement;
    case 'prepare':
      return s9.taskPrepareSoil;
    case 'amend':
      return s9.taskAmend;
    case 'irrigation':
      return s9.taskIrrigation;
    case 'plant':
      return s9.taskPlant;
    case 'monitor':
      return s9.taskMonitor;
    default:
      return s9.taskRetest;
  }
}

const todayIso = () => new Date().toISOString().slice(0, 10);

/**
 * Cultivation project — confirms the crop/farm/plot/date, persists it via the
 * existing `POST /api/assistant/actions/cultivations`, then shows a checklist
 * derived from the plot's persisted soil report (or an honest generic sequence).
 */
export const CultivationProjectScreen: React.FC<CultivationProjectScreenProps> = ({
  onBack,
  selection,
  farmName,
  fieldName,
}) => {
  const { t, x, isRtl, language } = useLanguage();
  const s9 = useMemo(() => getSoil(language), [language]);

  const [plantingDate, setPlantingDate] = useState(todayIso());
  const [area, setArea] = useState(
    selection.areaHectares ? String(selection.areaHectares) : '',
  );
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [created, setCreated] = useState<Cultivation | null>(null);

  const [projects, setProjects] = useState<Cultivation[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [projectsMeta, setProjectsMeta] = useState<ProvenanceMeta | null>(null);

  // Tasks + their local done-state for the created project.
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [taskState, setTaskState] = useState<Record<string, boolean>>({});
  const [reportLoaded, setReportLoaded] = useState(false);

  const loadProjects = useCallback(async () => {
    setLoadingProjects(true);
    const res = await getCultivations(selection.farmId);
    setProjects(res.data);
    setProjectsError(res.error);
    setProjectsMeta(res.meta);
    setLoadingProjects(false);
  }, [selection.farmId]);

  useEffect(() => {
    (async () => {
      await loadProjects();
    })();
  }, [loadProjects]);

  // Fetch the plot's latest persisted soil report to derive real tasks.
  useEffect(() => {
    let active = true;
    (async () => {
      if (!selection.fieldId) {
        // No plot: fall back to the honest generic sequence rather than an
        // empty checklist, which would look like the project has no steps.
        if (active) {
          setTasks(deriveProjectTasks(null));
          setReportLoaded(true);
        }
        return;
      }
      const list = await getSoilReports(20);
      const match = list.data.find((r) => r.fieldId === selection.fieldId);
      let report: SoilReport | null = null;
      if (match) {
        const full = await getSoilReport(match.analysisId);
        report = full.data?.report ?? null;
      }
      if (!active) return;
      setTasks(deriveProjectTasks(report));
      // Restore any ticks the user made on a previous visit to this project.
      if (created?.id) {
        setTaskState(await getTaskState(created.id));
      }
      setReportLoaded(true);
    })();
    return () => {
      active = false;
    };
  }, [selection.fieldId, created?.id]);

  const handleCreate = async () => {
    const parsedArea = Number(area.replace(',', '.'));
    if (!selection.farmId) {
      setCreateError(s9.farmRequired);
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(plantingDate.trim()) || Number.isNaN(Date.parse(plantingDate.trim()))) {
      setCreateError(s9.projectPlantingDatePlaceholder);
      return;
    }
    if (!Number.isFinite(parsedArea) || parsedArea <= 0) {
      setCreateError(s9.projectArea);
      return;
    }
    setCreating(true);
    setCreateError(null);
    const res = await createCultivation({
      farm_id: selection.farmId,
      section_id: selection.fieldId ?? null,
      crop_name: selection.cropNameAr || selection.cropName,
      planting_date: plantingDate.trim(),
      area_hectares: parsedArea,
    });
    if (res.data) {
      setCreated(res.data);
      void loadProjects();
    } else {
      setCreateError(res.error || s9.projectCreateFailed);
    }
    setCreating(false);
  };

  const toggleTask = async (task: ProjectTask) => {
    if (!created) return;
    const next = !taskState[task.id];
    const updated = await setTaskDone(created.id, task.id, next);
    setTaskState(updated);
  };

  const doneCount = tasks.filter((tk) => taskState[tk.id]).length;

  return (
    <ScrollView style={screenStyles.container} contentContainerStyle={screenStyles.content} showsVerticalScrollIndicator={false}>
      <ServiceHeader
        icon="sprout"
        iconColor={colors.crop}
        iconBg={colors.cropLight}
        title={s9.projectConfirmTitle}
        subtitle={s9.projectConfirmSubtitle}
      />

      {!created ? (
        <Card variant="elevated" style={styles.card}>
          <DetailRow label={s9.projectCrop} value={language === 'ar' ? selection.cropNameAr : cropName(selection.cropName, language)} isRtl={isRtl} />
          {farmName ? <DetailRow label={s9.projectFarm} value={farmName} isRtl={isRtl} /> : null}
          {fieldName ? <DetailRow label={s9.projectPlot} value={fieldName} isRtl={isRtl} /> : null}

          <FormField label={s9.projectArea} value={area} onChangeText={setArea} placeholder="1.5" suffix="ha" />
          <FormField
            label={s9.projectPlantingDate}
            value={plantingDate}
            onChangeText={setPlantingDate}
            placeholder={s9.projectPlantingDatePlaceholder}
            keyboard="default"
          />

          {createError ? (
            <StateView kind="error" title={x.stateError} message={createError} compact />
          ) : null}

          <Button
            title={creating ? s9.projectCreating : s9.projectCreate}
            onPress={handleCreate}
            loading={creating}
            style={{ marginTop: spacing.sm }}
          />
        </Card>
      ) : (
        <Card variant="elevated" style={styles.card}>
          <View style={[styles.successHead, isRtl && rtlStyles.rtlRow]}>
            <MaterialCommunityIcons name="check-circle" size={24} color={colors.success} />
            <Text style={[styles.successTitle, isRtl && rtlStyles.rtlText]}>{s9.projectCreatedTitle}</Text>
          </View>
          <Text style={[styles.successSub, isRtl && rtlStyles.rtlText]}>{s9.projectCreatedSubtitle}</Text>
          <View style={[styles.chipRow, isRtl && rtlStyles.rtlRow]}>
            <Badge label={created.crop_name} variant="primary" size="sm" />
            <Badge label={s9.projectStagePlanned} variant="info" size="sm" />
            {created.expected_harvest_date ? (
              <Badge label={`${s9.projectHarvest}: ${created.expected_harvest_date}`} variant="accent" size="sm" />
            ) : null}
          </View>
        </Card>
      )}

      {created && reportLoaded ? (
        <Card variant="elevated" style={styles.card}>
          <Text style={[styles.tasksTitle, isRtl && rtlStyles.rtlText]}>{s9.projectTasksTitle}</Text>
          <Text style={[styles.tasksSub, isRtl && rtlStyles.rtlText]}>{s9.projectTasksSubtitle}</Text>
          {tasks.length === 0 ? (
            <StateView kind="empty" message={s9.projectTasksSubtitle} compact />
          ) : (
            <View style={styles.taskList}>
              {tasks.map((task) => {
                const done = !!taskState[task.id];
                const label = task.generic ? genericLabel(task.kind, s9) : task.text;
                return (
                  <TouchableOpacity
                    key={task.id}
                    onPress={() => toggleTask(task)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: done }}
                    accessibilityLabel={label}
                    style={[styles.taskRow, isRtl && rtlStyles.rtlRow]}
                  >
                    <MaterialCommunityIcons
                      name={done ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                      size={22}
                      color={done ? colors.success : colors.textMuted}
                    />
                    <Text style={[styles.taskText, done && styles.taskTextDone, isRtl && rtlStyles.rtlText]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
          <Text style={[styles.progress, isRtl && rtlStyles.rtlText]}>
            {doneCount} / {tasks.length}
          </Text>
          <Text style={[styles.cycleNote, isRtl && rtlStyles.rtlText]}>{s9.projectCycleNote}</Text>
        </Card>
      ) : null}

      {created ? <MarketplaceMatch query={created.crop_name} /> : null}

      <Card variant="elevated" style={styles.card}>
        <Text style={[styles.tasksTitle, isRtl && rtlStyles.rtlText]}>{s9.projectMyProjects}</Text>
        {loadingProjects ? (
          <StateView kind="loading" title={s9.projectMyProjects} compact />
        ) : projectsError ? (
          <StateView kind="error" message={projectsError} compact />
        ) : projects.length === 0 ? (
          <StateView kind="empty" title={s9.projectNone} message={s9.projectNoneHint} compact />
        ) : (
          <View style={styles.taskList}>
            {projects.map((project) => (
              <View key={project.id} style={[styles.projectRow, isRtl && rtlStyles.rtlRow]}>
                <View style={styles.projectText}>
                  <Text style={[styles.projectName, isRtl && rtlStyles.rtlText]}>{project.crop_name}</Text>
                  <Text style={[styles.projectMeta, isRtl && rtlStyles.rtlText]}>
                    {project.planting_date ?? '—'} • {project.area_hectares} ha
                    {project.current_growth_stage ? ` • ${project.current_growth_stage}` : ''}
                  </Text>
                </View>
                <Badge label={project.status} variant="secondary" size="sm" />
              </View>
            ))}
          </View>
        )}
        {projectsMeta ? <ProvenanceBar meta={projectsMeta} style={{ marginTop: spacing.sm }} /> : null}
      </Card>

      <Button title={t.back} variant="outline" onPress={onBack} style={{ marginTop: spacing.md, marginBottom: spacing.xl }} />
    </ScrollView>
  );
};

const DetailRow: React.FC<{ label: string; value: string; isRtl: boolean }> = ({ label, value, isRtl }) => (
  <View style={[styles.detailRow, isRtl && rtlStyles.rtlRow]}>
    <Text style={[styles.detailLabel, isRtl && rtlStyles.rtlText]}>{label}</Text>
    <Text style={[styles.detailValue, isRtl && rtlStyles.rtlText]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: stackedCard,
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs, gap: spacing.sm },
  detailLabel: mutedCaption,
  detailValue: { flex: 1, fontSize: typography.fontSizes.sm, lineHeight: typography.lineHeights.sm, fontWeight: typography.fontWeights.semibold, color: colors.text },
  successHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  successTitle: { flex: 1, fontSize: typography.fontSizes.base, lineHeight: typography.lineHeights.base, fontWeight: typography.fontWeights.bold, color: colors.text },
  successSub: { fontSize: typography.fontSizes.xs, lineHeight: typography.lineHeights.xs, color: colors.textSecondary, marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tasksTitle: titleBase,
  tasksSub: { fontSize: typography.fontSizes.xs, lineHeight: typography.lineHeights.xs, color: colors.textSecondary, marginTop: 2, marginBottom: spacing.sm },
  taskList: { gap: spacing.xs },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48, paddingVertical: spacing.xs },
  taskText: { flex: 1, fontSize: typography.fontSizes.sm, lineHeight: typography.lineHeights.sm, color: colors.text },
  taskTextDone: { textDecorationLine: 'line-through', color: colors.textMuted },
  progress: { fontSize: typography.fontSizes.xs, color: colors.primaryDark, fontWeight: typography.fontWeights.bold, marginTop: spacing.sm, lineHeight: typography.lineHeights.xs },
  cycleNote: { fontSize: typography.fontSizes.xs, color: colors.textMuted, lineHeight: typography.lineHeights.xs, marginTop: 2 },
  projectRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  projectText: { flex: 1 },
  projectName: { fontSize: typography.fontSizes.sm, lineHeight: typography.lineHeights.sm, fontWeight: typography.fontWeights.semibold, color: colors.text },
  projectMeta: { fontSize: typography.fontSizes.xs, lineHeight: typography.lineHeights.xs, color: colors.textSecondary, marginTop: 2 },
});
