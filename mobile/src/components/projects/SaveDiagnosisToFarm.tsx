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
import { getFarms, saveDiseaseDetection } from '../../api/client';
import { prepareImageForUpload } from '../../utils/image';
import { Farm, DiseaseDiagnosisResult } from '../../types';

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
  const [loadingFarms, setLoadingFarms] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFarms = useCallback(async () => {
    setLoadingFarms(true);
    const res = await getFarms();
    setFarms(res.data);
    setSelectedFarmId((current) => current ?? res.data[0]?.id ?? null);
    setLoadingFarms(false);
  }, []);

  useEffect(() => {
    (async () => {
      await loadFarms();
    })();
  }, [loadFarms]);

  const handleSave = async () => {
    if (!selectedFarmId || !result.imageUri) return;
    setSaving(true);
    setError(null);
    const prepared = await prepareImageForUpload(result.imageUri);
    const res = await saveDiseaseDetection({
      imageUri: prepared.uri,
      mimeType: prepared.mimeType,
      fileName: prepared.fileName,
      farmId: selectedFarmId,
      plantType: result.diseaseName || undefined,
      primaryDisease: result.diseaseName,
      severityLevel: result.severity,
      confidence: result.confidence,
    });
    if (res.data) {
      setSaved(true);
    } else {
      setError(res.error || p.diagnosisSaveFailed);
    }
    setSaving(false);
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
