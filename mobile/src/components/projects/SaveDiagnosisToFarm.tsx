import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { rowWrapSm, stackTopSm, stackedCard } from '../../theme/layout';
import { rtlStyles } from '../../theme/rtl';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme/colors';
import { mutedCaptionTop, titleSmSemibold } from '../../theme/typographyStyles';
import { useLanguage } from '../../context/LanguageContext';
import { getProjects } from '../../i18n/projects';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { getCultivations, getFarms, saveDiseaseDetection } from '../../api/client';
import { prepareImageForUpload } from '../../utils/image';
import { Cultivation, Farm, DiseaseDiagnosisResult } from '../../types';

interface SaveDiagnosisToFarmProps {
  result: DiseaseDiagnosisResult;
}

/**
 * Persist a real diagnosis (plus its evidence image) into the platform's farm
 * record via `POST /api/assistant/actions/disease-detections`. This is opt-in
 * and additive: the local history entry is already written by the caller, so a
 * failure here only means the server-side farm record was not updated.
 *
 * The endpoint requires a farm the user owns, so the picker is honest about the
 * no-farm case and never pretends a save happened.
 */
export const SaveDiagnosisToFarm: React.FC<SaveDiagnosisToFarmProps> = ({ result }) => {
  const { language, isRtl } = useLanguage();
  const p = getProjects(language);

  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [cultivations, setCultivations] = useState<Cultivation[]>([]);
  const [selectedCultivationId, setSelectedCultivationId] = useState<string | null>(null);
  const [loadingFarms, setLoadingFarms] = useState(true);
  const [loadingCultivations, setLoadingCultivations] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFarms = useCallback(async () => {
    setLoadingFarms(true);
    try {
      const res = await getFarms();
      setFarms(res.data);
      setSelectedFarmId((current) => current ?? res.data[0]?.id ?? null);
    } catch {
      setError(p.noFarmToSave);
    } finally {
      setLoadingFarms(false);
    }
  }, [p.noFarmToSave]);

  useEffect(() => {
    (async () => {
      await loadFarms();
    })();
  }, [loadFarms]);

  const loadCultivations = useCallback(async () => {
    if (!selectedFarmId) {
      setCultivations([]);
      setSelectedCultivationId(null);
      return;
    }
    setLoadingCultivations(true);
    try {
      const res = await getCultivations(selectedFarmId);
      setCultivations(res.data);
      setSelectedCultivationId((current) => res.data.some((item) => item.id === current) ? current : null);
    } catch {
      setCultivations([]);
      setSelectedCultivationId(null);
    } finally {
      setLoadingCultivations(false);
    }
  }, [selectedFarmId]);

  useEffect(() => {
    void loadCultivations();
  }, [loadCultivations]);

  const handleSave = async () => {
    if (!selectedFarmId || !result.imageUri) return;
    setSaving(true);
    setError(null);
    try {
      const prepared = await prepareImageForUpload(result.imageUri);
      const res = await saveDiseaseDetection({
        imageUri: prepared.uri,
        mimeType: prepared.mimeType,
        fileName: prepared.fileName,
        farmId: selectedFarmId,
        cultivationId: selectedCultivationId,
        plantType: result.plantType || undefined,
        analysisResult: {
          description: result.descriptionAr,
          symptoms: result.symptoms,
          confidence: result.confidence,
          treatment_plan: {
            immediate_treatment: result.treatment,
            prevention_measures: result.prevention,
          },
        },
        primaryDisease: result.diseaseName,
        severityLevel: result.severity,
        confidence: result.confidence,
      });
      if (res.data) setSaved(true);
      else setError(res.error || p.diagnosisSaveFailed);
    } catch {
      setError(p.diagnosisSaveFailed);
    } finally {
      setSaving(false);
    }
  };

  // The visual diagnosis is not field-verified; saving is only a record action.
  const provenanceNote = p.diagnosisNotFieldVerified;

  return (
    <Card variant="outlined" style={styles.card}>
      <View style={styles.headRow}>
        <MaterialCommunityIcons name="content-save-outline" size={20} color={colors.primary} />
        <Text style={[styles.title, isRtl && rtlStyles.rtlText]}>{p.saveDiagnosisHeading}</Text>
      </View>

      {saved ? (
        <Text style={[styles.savedText, isRtl && rtlStyles.rtlText]}>{p.diagnosisSaved}</Text>
      ) : loadingFarms ? (
        <Text style={[styles.note, isRtl && rtlStyles.rtlText]}>{p.savingDiagnosis}</Text>
      ) : farms.length === 0 ? (
        <Text style={[styles.note, isRtl && rtlStyles.rtlText]}>{p.noFarmToSave}</Text>
      ) : (
        <>
          <Text style={[styles.label, isRtl && rtlStyles.rtlText]}>{p.chooseFarmToSave}</Text>
          <View style={[rowWrapSm, stackTopSm]}>
            {farms.map((farm) => (
              <Chip
                key={farm.id}
                label={farm.name}
                selected={farm.id === selectedFarmId}
                onPress={() => setSelectedFarmId(farm.id)}
              />
            ))}
          </View>
          {cultivations.length > 0 ? (
            <>
              <Text style={[styles.label, isRtl && rtlStyles.rtlText]}>{p.linkDiagnosisToProject}</Text>
              <View style={[rowWrapSm, stackTopSm]}>
                <Chip label={p.noProjectLink} selected={!selectedCultivationId} onPress={() => setSelectedCultivationId(null)} />
                {cultivations.map((cultivation) => (
                  <Chip key={cultivation.id} label={cultivation.crop_name} selected={cultivation.id === selectedCultivationId} onPress={() => setSelectedCultivationId(cultivation.id)} />
                ))}
              </View>
            </>
          ) : loadingCultivations ? <Text style={[styles.note, isRtl && rtlStyles.rtlText]}>{p.savingDiagnosis}</Text> : null}
          {error ? <Text style={[styles.error, isRtl && rtlStyles.rtlText]}>{error}</Text> : null}
          <Button
            title={saving ? p.savingDiagnosis : p.saveDiagnosisToFarm}
            variant="outline"
            icon={<MaterialCommunityIcons name="content-save-outline" size={18} color={colors.primary} />}
            loading={saving}
            disabled={saving || !result.imageUri}
            onPress={handleSave}
            style={styles.button}
          />
        </>
      )}

      <Text style={[styles.provenance, isRtl && rtlStyles.rtlText]}>{provenanceNote}</Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { ...stackedCard, borderColor: colors.primaryLight },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { ...titleSmSemibold, flex: 1 },
  label: { ...mutedCaptionTop, marginTop: spacing.sm },
  note: { ...mutedCaptionTop, marginTop: spacing.sm },
  savedText: { marginTop: spacing.sm, color: colors.primaryDark, fontWeight: '600' },
  error: { marginTop: spacing.sm, color: colors.danger },
  button: { marginTop: spacing.sm },
  provenance: {
    ...mutedCaptionTop,
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
