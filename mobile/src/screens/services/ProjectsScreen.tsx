import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { rtlStyles } from '../../theme/rtl';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme/colors';
import { chipScrollRow, screenStyles, spaceBetween, stackedCard } from '../../theme/layout';
import {
  cardHeading,
  mutedCaption,
  mutedCaptionTop,
  subtitleMetaSm,
  titleSmSemibold,
} from '../../theme/typographyStyles';
import { useLanguage } from '../../context/LanguageContext';
import { getProjects } from '../../i18n/projects';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { ServiceHeader } from '../../components/ui/ServiceHeader';
import { StateView } from '../../components/ui/StateView';
import { ProvenanceBar } from '../../components/ui/ProvenanceBar';
import { ProjectTracker } from '../../components/projects/ProjectTracker';
import { ProjectFinance } from '../../components/projects/ProjectFinance';
import { getCultivations } from '../../api/client';
import { Cultivation, ProvenanceMeta } from '../../types';
import { growthStageLabel, projectStatusLabel } from '../../utils/projectLabels';

interface ProjectsScreenProps {
  onBack: () => void;
  /** When provided, open this project directly (deep link from the cultivation flow). */
  initialProjectId?: string;
}

/**
 * "My Agricultural Projects" — the persistent home for everything the user has
 * actually planted. Projects come from the real `crop_cultivations` table
 * (`GET /api/assistant/cultivations`); each one opens a server-backed daily
 * tracker (`farm_tasks`) and the account financial result. Nothing here is
 * seeded: an empty account shows an honest empty state that points the user to
 * the soil → crop → project flow.
 */
export const ProjectsScreen: React.FC<ProjectsScreenProps> = ({ onBack, initialProjectId }) => {
  const { t, x, isRtl, language } = useLanguage();
  const p = useMemo(() => getProjects(language), [language]);

  const [projects, setProjects] = useState<Cultivation[]>([]);
  const [meta, setMeta] = useState<ProvenanceMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(initialProjectId ?? null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getCultivations();
    setProjects(res.data);
    setMeta(res.meta);
    setError(res.error);
    setLoading(false);
  }, []);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  const selected = projects.find((project) => project.id === selectedId) ?? null;

  return (
    <ScrollView
      style={screenStyles.container}
      contentContainerStyle={screenStyles.content}
      showsVerticalScrollIndicator={false}
    >
      <ServiceHeader
        icon="sprout-outline"
        iconColor={colors.crop}
        iconBg={colors.cropLight}
        title={p.title}
        subtitle={p.subtitle}
      />

      {loading ? (
        <StateView kind="loading" title={p.title} />
      ) : error ? (
        <StateView kind="error" message={error} onRetry={load} retryLabel={x.retry} />
      ) : projects.length === 0 ? (
        <StateView kind="empty" title={p.noProjects} message={p.noProjectsHint} />
      ) : (
        <>
          <Text style={[styles.sectionTitle, isRtl && rtlStyles.rtlText]}>{p.projectsHeading}</Text>
          <Text style={[styles.sectionHint, isRtl && rtlStyles.rtlText]}>{p.overviewHint}</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.projectStrip, isRtl && rtlStyles.rtlRow]}
          >
            {projects.map((project) => {
              const active = project.id === selectedId;
              return (
                <TouchableOpacity
                  key={project.id}
                  activeOpacity={0.85}
                  onPress={() => setSelectedId(active ? null : project.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`${project.crop_name}. ${p.openProject}`}
                  style={[styles.projectCard, active && styles.projectCardActive]}
                >
                  <View style={[styles.projectHead, isRtl && rtlStyles.rtlRow]}>
                    <Text style={[styles.projectCrop, isRtl && rtlStyles.rtlText]}>
                      {project.crop_name}
                    </Text>
                    <Badge label={projectStatusLabel(project.status, p)} variant="accent" size="sm" />
                  </View>
                  <Text style={[styles.projectMeta, isRtl && rtlStyles.rtlText]}>
                    {p.areaLabel}: {project.area_hectares} ha
                  </Text>
                  {project.planting_date ? (
                    <Text style={[styles.projectMeta, isRtl && rtlStyles.rtlText]}>
                      {p.plantedOn}: {project.planting_date}
                    </Text>
                  ) : null}
                  <Text style={[styles.projectMeta, isRtl && rtlStyles.rtlText]}>
                    {p.growthStage}: {growthStageLabel(project.current_growth_stage, p)}
                  </Text>
                  <View style={[styles.projectOpen, isRtl && rtlStyles.rtlRow]}>
                    <Text style={styles.projectOpenText}>
                      {active ? p.closeProject : p.openProject}
                    </Text>
                    <MaterialCommunityIcons
                      name={active ? 'chevron-up' : isRtl ? 'chevron-left' : 'chevron-right'}
                      size={16}
                      color={colors.primary}
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {meta ? <ProvenanceBar meta={meta} style={styles.provenance} /> : null}

          {selected ? (
            <View style={styles.detail}>
              <Card variant="elevated" style={styles.detailCard}>
                <View style={[styles.detailHead, isRtl && rtlStyles.rtlRow]}>
                  <MaterialCommunityIcons name="sprout" size={20} color={colors.crop} />
                  <Text style={[styles.detailTitle, isRtl && rtlStyles.rtlText]}>
                    {selected.crop_name}
                  </Text>
                </View>
                {selected.expected_harvest_date ? (
                  <Text style={[styles.detailMeta, isRtl && rtlStyles.rtlText]}>
                    {p.expectedHarvest}: {selected.expected_harvest_date}
                  </Text>
                ) : null}
              </Card>

              <ProjectTracker farmId={selected.farm_id} />
              <ProjectFinance farmId={selected.farm_id} cropName={selected.crop_name} />
            </View>
          ) : null}
        </>
      )}

      <Button
        title={t.back}
        variant="outline"
        onPress={onBack}
        style={{ marginTop: spacing.lg, marginBottom: spacing.xl }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  sectionTitle: cardHeading,
  sectionHint: { ...mutedCaptionTop, marginBottom: spacing.sm },
  projectStrip: { ...chipScrollRow, gap: spacing.sm, paddingVertical: spacing.xs },
  projectCard: {
    width: 220,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  projectCardActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  projectHead: { ...spaceBetween, marginBottom: spacing.xs },
  projectCrop: { ...titleSmSemibold, flex: 1 },
  projectMeta: { ...mutedCaption, marginTop: 2 },
  projectOpen: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm },
  projectOpenText: { ...subtitleMetaSm, color: colors.primary },
  provenance: { marginTop: spacing.sm },
  detail: { ...stackedCard, marginTop: spacing.lg },
  detailCard: { ...stackedCard },
  detailHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  detailTitle: cardHeading,
  detailMeta: { ...mutedCaptionTop, marginTop: 2 },
});
