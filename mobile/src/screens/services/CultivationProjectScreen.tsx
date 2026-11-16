import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { flex1, gapXs, rowGapSm, screenStyles, sectionHeadRow, spaceBetween, stackedCard } from '../../theme/layout';
import { rtlStyles } from '../../theme/rtl';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme/colors';
import { mutedCaption, mutedCaptionTop, subtitleMeta, subtitleMetaSm, titleBase, titleBaseFlex, titleSmSemibold } from '../../theme/typographyStyles';
import { useLanguage } from '../../context/LanguageContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Chip } from '../../components/ui/Chip';
import { ServiceHeader } from '../../components/ui/ServiceHeader';
import { StateView } from '../../components/ui/StateView';
import { ProvenanceBar } from '../../components/ui/ProvenanceBar';
import { FormField } from '../../components/ui/FormField';
import {
  createCultivation,
  createProjectTask,
  getCultivations,
  getFarms,
  getProjectTasks,
  getSoilReports,
  getSoilReport,
} from '../../api/client';
import { deriveProjectTasks, ProjectTask } from '../../utils/projectTasks';
import { cropName } from '../../utils/cropLabels';
import { getSoil } from '../../i18n/soil';
import { getProjects } from '../../i18n/projects';
import { growthStageLabel, projectStatusLabel } from '../../utils/projectLabels';
import { Cultivation, Farm, SoilReport, ProvenanceMeta } from '../../types';
import { CropSelection } from './CropRecommendationScreen';
import { MarketplaceMatch } from '../../components/soil/MarketplaceMatch';
import { ProjectTracker } from '../../components/projects/ProjectTracker';

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
  const p = useMemo(() => getProjects(language), [language]);

  const [plantingDate, setPlantingDate] = useState(todayIso());
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(selection.farmId ?? null);
  const [farmsLoading, setFarmsLoading] = useState(!selection.farmId);
  const [farmsError, setFarmsError] = useState<string | null>(null);
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
  const [reportLoaded, setReportLoaded] = useState(false);
  const [taskSetupReady, setTaskSetupReady] = useState(false);

  useEffect(() => {
    if (selection.farmId) return;
    let active = true;
    (async () => {
      setFarmsLoading(true);
      try {
        const result = await getFarms();
        if (!active) return;
        setFarms(result.data);
        setSelectedFarmId((current) => current ?? result.data[0]?.id ?? null);
        setFarmsError(result.error);
      } catch {
        if (active) setFarmsError(s9.farmRequired);
      } finally {
        if (active) setFarmsLoading(false);
      }
    })();
    return () => { active = false; };
  }, [selection.farmId, s9.farmRequired]);

  const loadProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const res = await getCultivations(selection.farmId ?? selectedFarmId);
      setProjects(res.data);
      setProjectsError(res.error);
      setProjectsMeta(res.meta);
    } catch {
      setProjectsError(x.stateError);
    } finally {
      setLoadingProjects(false);
    }
  }, [selection.farmId, selectedFarmId, x.stateError]);

  useEffect(() => {
    (async () => {
      await loadProjects();
    })();
  }, [loadProjects]);

  // Fetch the plot's latest persisted soil report to derive project tasks.
  // If the report service is unavailable, keep the project usable with the
  // transparent generic task sequence rather than leaving the checklist stuck.
  useEffect(() => {
    let active = true;
    (async () => {
      if (!selection.fieldId) {
        if (active) {
          setTasks(deriveProjectTasks(null));
          setReportLoaded(true);
        }
        return;
      }
      try {
        const list = await getSoilReports(20);
        const match = list.data.find((r) => r.fieldId === selection.fieldId);
        let report: SoilReport | null = null;
        if (match) {
          const full = await getSoilReport(match.analysisId);
          report = full.data?.report ?? null;
        }
        if (!active) return;
        setTasks(deriveProjectTasks(report));
      } catch {
        if (!active) return;
        setTasks(deriveProjectTasks(null));
      } finally {
        if (active) setReportLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [selection.fieldId, created?.id]);

  // Turn the soil report's actionable recommendations into real, server-persisted
  // project tasks. The project tracker then reads and updates the same farm_tasks
  // rows across devices instead of keeping completion ticks only on this phone.
  useEffect(() => {
    if (!created || !reportLoaded) return;
    let active = true;
    (async () => {
      setTaskSetupReady(false);
      try {
        const existing = await getProjectTasks({
          farmId: created.farm_id,
          cultivationId: created.id,
        });
        if (existing.roleBlocked || existing.error) return;

        const existingTitles = new Set(existing.data.map((task) => task.title.trim().toLocaleLowerCase()));
        const taskTypes: Record<ProjectTask['kind'], 'inspection' | 'maintenance' | 'fertilization' | 'irrigation' | 'planting'> = {
          measure: 'inspection',
          prepare: 'maintenance',
          amend: 'fertilization',
          irrigation: 'irrigation',
          plant: 'planting',
          monitor: 'inspection',
          retest: 'inspection',
        };

        for (const task of tasks) {
          const title = (task.generic ? genericLabel(task.kind, s9) : task.text).trim();
          if (!title || existingTitles.has(title.toLocaleLowerCase())) continue;
          const saved = await createProjectTask({
            farm_id: created.farm_id,
            cultivation_id: created.id,
            title,
            task_type: taskTypes[task.kind],
            priority: task.priority,
            description: task.generic
              ? 'General cultivation lifecycle task.'
              : 'Generated from the selected plot soil analysis recommendations.',
          });
          if (saved.roleBlocked || saved.error || !saved.data) break;
          existingTitles.add(title.toLocaleLowerCase());
        }
      } catch {
        // Project creation remains successful; ProjectTracker exposes its own
        // persisted-task availability/error state and can be retried there.
      } finally {
        if (active) setTaskSetupReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [created?.id, created?.farm_id, reportLoaded, tasks, s9]);

  const handleCreate = async () => {
    const parsedArea = Number(area.replace(',', '.'));
    const farmId = selection.farmId ?? selectedFarmId;
    if (!farmId) {
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
    try {
      const res = await createCultivation({
        farm_id: farmId,
        section_id: selection.farmId === farmId ? selection.fieldId ?? null : null,
        crop_name: selection.cropName || selection.cropNameAr,
        planting_date: plantingDate.trim(),
        area_hectares: parsedArea,
      });
      if (res.data) {
        setReportLoaded(false);
        setTaskSetupReady(false);
        setCreated(res.data);
        void loadProjects();
      } else {
        setCreateError(res.error || s9.projectCreateFailed);
      }
    } catch {
      setCreateError(s9.projectCreateFailed);
    } finally {
      setCreating(false);
    }
  };


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
          {!selection.farmId ? (
            <View style={styles.farmPicker}>
              <Text style={[styles.detailLabel, isRtl && rtlStyles.rtlText]}>{s9.projectFarm}</Text>
              {farmsLoading ? <StateView kind="loading" title={s9.projectFarm} compact /> : farms.length ? (
                <View style={styles.chipRow}>
                  {farms.map((farm) => <Chip key={farm.id} label={farm.name} selected={farm.id === selectedFarmId} onPress={() => setSelectedFarmId(farm.id)} />)}
                </View>
              ) : <StateView kind="empty" message={farmsError || s9.farmRequired} compact />}
            </View>
          ) : null}
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
            disabled={creating || farmsLoading || (!selection.farmId && !selectedFarmId)}
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
        taskSetupReady ? (
          <ProjectTracker farmId={created.farm_id} cultivationId={created.id} />
        ) : (
          <StateView kind="loading" title={s9.projectTasksTitle} compact />
        )
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
                    {' • '}{growthStageLabel(project.current_growth_stage, p)}
                  </Text>
                </View>
                <Badge label={projectStatusLabel(project.status, p)} variant="secondary" size="sm" />
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
  farmPicker: { marginVertical: spacing.sm, gap: spacing.xs },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs, gap: spacing.sm },
  detailLabel: mutedCaption,
  detailValue: { flex: 1, fontSize: typography.fontSizes.sm, lineHeight: typography.lineHeights.sm, fontWeight: typography.fontWeights.semibold, color: colors.text },
  successHead: sectionHeadRow,
  successTitle: titleBaseFlex,
  successSub: { fontSize: typography.fontSizes.xs, lineHeight: typography.lineHeights.xs, color: colors.textSecondary, marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tasksTitle: titleBase,
  tasksSub: subtitleMetaSm,
  taskList: gapXs,
  taskRow: { ...rowGapSm, minHeight: 48, paddingVertical: spacing.xs },
  taskText: { flex: 1, fontSize: typography.fontSizes.sm, lineHeight: typography.lineHeights.sm, color: colors.text },
  taskTextDone: { textDecorationLine: 'line-through', color: colors.textMuted },
  progress: { fontSize: typography.fontSizes.xs, color: colors.primaryDark, fontWeight: typography.fontWeights.bold, marginTop: spacing.sm, lineHeight: typography.lineHeights.xs },
  cycleNote: mutedCaptionTop,
  projectRow: { ...spaceBetween, gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  projectText: flex1,
  projectName: titleSmSemibold,
  projectMeta: subtitleMeta,
});
