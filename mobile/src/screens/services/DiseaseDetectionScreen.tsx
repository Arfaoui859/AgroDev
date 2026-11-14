import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { useLanguage } from '../../context/LanguageContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ServiceHeader } from '../../components/ui/ServiceHeader';
import { StateView } from '../../components/ui/StateView';
import { ProvenanceBadge } from '../../components/ui/ProvenanceBadge';
import { PlantScanner } from '../../components/scanner/PlantScanner';
import { diagnosePlantDisease } from '../../api/client';
import { prepareImageForUpload } from '../../utils/image';
import { addHistoryEntry } from '../../api/history';
import { provenanceLabel } from '../../utils/provenance';
import { severityLabel, severityVariant } from '../../utils/severity';
import { anyContainsArabic } from '../../utils/text';
import { DiseaseDiagnosisResult } from '../../types';

interface DiseaseDetectionScreenProps {
  onBack: () => void;
  startWithCamera?: boolean;
}

const CROP_CHOICES = [
  { id: 'olive', labelKey: 'cropOlive', icon: 'tree' },
  { id: 'tomato', labelKey: 'cropTomato', icon: 'food-apple' },
  { id: 'wheat', labelKey: 'cropWheat', icon: 'barley' },
  { id: 'citrus', labelKey: 'cropCitrus', icon: 'fruit-citrus' },
  { id: 'dates', labelKey: 'cropDates', icon: 'palm-tree' },
  { id: 'potato', labelKey: 'cropPotato', icon: 'circle-slice-8' },
] as const;

const PART_CHOICES = [
  { id: 'leaves', labelKey: 'partLeaves' },
  { id: 'fruit', labelKey: 'partFruit' },
  { id: 'stem', labelKey: 'partStem' },
  { id: 'root', labelKey: 'partRoot' },
] as const;

/**
 * Plant disease detection. The image bytes are uploaded to the gateway's real
 * image-diagnosis endpoint. When no approved vision model is configured the
 * gateway answers 503 and this screen shows that honestly — it never invents a
 * diagnosis or a confidence score.
 */
export const DiseaseDetectionScreen: React.FC<DiseaseDetectionScreenProps> = ({ onBack, startWithCamera = false }) => {
  const { t, x, isRtl, isArabic, language } = useLanguage();

  const [showScanner, setShowScanner] = useState(startWithCamera);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [selectedCrop, setSelectedCrop] = useState('olive');
  const [selectedPart, setSelectedPart] = useState('leaves');
  const [symptomsInput, setSymptomsInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiseaseDiagnosisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError(x.diseaseGalleryDenied);
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
    if (!picked.canceled && picked.assets[0]?.uri) {
      setImageUri(picked.assets[0].uri);
      setResult(null);
      setError(null);
      setUnavailable(false);
    }
  };

  // The vision model is instructed to answer in Arabic, so its free-text detail
  // can be Arabic even for fr/en callers. Detect that and label it honestly.
  const resultIsArabicOnly =
    !!result &&
    !isArabic &&
    anyContainsArabic([result.descriptionAr, ...result.symptoms, ...result.treatment, ...result.prevention]);

  const handleDiagnose = async () => {
    if (!imageUri) {
      setError(x.diseasePickFirst);
      return;
    }
    setLoading(true);
    setResult(null);
    setError(null);
    setUnavailable(false);

    const prepared = await prepareImageForUpload(imageUri);
    const res = await diagnosePlantDisease({
      imageUri: prepared.uri,
      mimeType: prepared.mimeType,
      fileName: prepared.fileName,
      cropType: selectedCrop,
      plantPart: selectedPart,
      symptoms: symptomsInput || undefined,
    });

    if (res.unavailable) {
      setUnavailable(true);
      setError(res.error);
    } else if (res.data) {
      setResult(res.data);
      // Persist the real diagnosis on the device so the history screen shows it.
      void addHistoryEntry({
        type: 'disease',
        title: (language === 'ar' ? res.data.diseaseNameAr : res.data.diseaseName) || res.data.diseaseNameAr,
        summary:
          res.data.confidence !== null
            ? `${x.diseaseConfidenceLabel} ${res.data.confidence}%`
            : x.diseaseNoConfidence,
        badge: provenanceLabel(res.data.meta.provenance, language),
        badgeVariant: res.data.severity === 'high' || res.data.severity === 'critical' ? 'danger' : 'warning',
        imageUri: res.data.imageUri,
      });
    } else {
      setError(res.error || x.stateError);
    }
    setLoading(false);
  };

  if (showScanner) {
    return (
      <PlantScanner
        onClose={() => {
          setShowScanner(false);
          if (startWithCamera && !imageUri) onBack();
        }}
        onSubmit={async ({ uri, mimeType, fileName, symptoms }) => {
          const res = await diagnosePlantDisease({
            imageUri: uri,
            mimeType,
            fileName,
            cropType: selectedCrop,
            plantPart: selectedPart,
            symptoms: symptoms || symptomsInput || undefined,
          });
          if (res.data) {
            setImageUri(uri);
            void addHistoryEntry({
              type: 'disease',
              title: (language === 'ar' ? res.data.diseaseNameAr : res.data.diseaseName) || res.data.diseaseNameAr,
              summary:
                res.data.confidence !== null
                  ? `${x.diseaseConfidenceLabel} ${res.data.confidence}%`
                  : x.diseaseNoConfidence,
              badge: provenanceLabel(res.data.meta.provenance, language),
              badgeVariant:
                res.data.severity === 'high' || res.data.severity === 'critical' ? 'danger' : 'warning',
              imageUri: res.data.imageUri,
            });
          }
          return res;
        }}
      />
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ServiceHeader
        icon="camera-iris"
        iconColor={colors.danger}
        iconBg={colors.dangerLight}
        title={t.diseaseDiagnosisName}
        subtitle={t.diseaseDiagnosisDesc}
      />

      <Card variant="elevated" style={styles.uploadCard}>
        <Text style={[styles.stepHeading, isRtl && styles.rtlText]}>{x.diseaseStepImage}</Text>

        {imageUri ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setImageUri(null);
                setResult(null);
                setUnavailable(false);
                setError(null);
              }}
              accessibilityRole="button"
              accessibilityLabel={x.scannerRetake}
              style={styles.removeImageBtn}
            >
              <MaterialCommunityIcons name="close" size={18} color={colors.textInverse} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.buttonsRow, isRtl && styles.rtlRow]}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setShowScanner(true)}
              accessibilityRole="button"
              accessibilityLabel={t.takePhoto}
              style={[styles.actionPickBtn, { backgroundColor: colors.primary }]}
            >
              <MaterialCommunityIcons name="camera" size={24} color={colors.textInverse} />
              <Text style={styles.actionPickText}>{t.takePhoto}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={pickFromGallery}
              accessibilityRole="button"
              accessibilityLabel={t.chooseGallery}
              style={[styles.actionPickBtn, styles.galleryBtn]}
            >
              <MaterialCommunityIcons name="image" size={24} color={colors.text} />
              <Text style={[styles.actionPickText, { color: colors.text }]}>{t.chooseGallery}</Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>

      <View style={styles.section}>
        <Text style={[styles.stepHeading, isRtl && styles.rtlText]}>{x.diseaseStepCrop}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.cropsScroll, isRtl && styles.rtlRow]}>
          {CROP_CHOICES.map((c) => {
            const selected = selectedCrop === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                activeOpacity={0.85}
                onPress={() => setSelectedCrop(c.id)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={x[c.labelKey]}
                style={[styles.cropChip, isRtl && styles.rtlRow, selected && styles.cropChipSelected]}
              >
                <MaterialCommunityIcons name={c.icon as any} size={18} color={selected ? colors.textInverse : colors.primary} />
                <Text style={[styles.cropChipText, selected && styles.cropChipTextSelected]}>{x[c.labelKey]}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={[styles.stepHeading, isRtl && styles.rtlText]}>{x.diseaseStepPart}</Text>
        <View style={[styles.partsRow, isRtl && styles.rtlRow]}>
          {PART_CHOICES.map((p) => {
            const selected = selectedPart === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                activeOpacity={0.85}
                onPress={() => setSelectedPart(p.id)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={x[p.labelKey]}
                style={[styles.partChip, selected && styles.partChipSelected]}
              >
                <Text style={[styles.partChipText, selected && styles.partChipTextSelected]}>{x[p.labelKey]}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.stepHeading, isRtl && styles.rtlText]}>{x.scannerSymptomsLabel}</Text>
        <TextInput
          style={[styles.symptomsInput, isRtl && styles.rtlText]}
          placeholder={x.scannerSymptomsPlaceholder}
          placeholderTextColor={colors.textMuted}
          value={symptomsInput}
          onChangeText={setSymptomsInput}
          multiline
        />
      </View>

      <Button
        title={loading ? t.analyzing : x.diseaseAnalyzeButton}
        onPress={handleDiagnose}
        loading={loading}
        variant="primary"
        size="lg"
        style={{ marginVertical: spacing.md }}
      />

      {unavailable ? (
        <Card variant="outlined" style={styles.resultCard}>
          <StateView
            kind="unavailable"
            title={x.scannerUnavailableTitle}
            message={error || x.scannerUnavailableDesc}
          />
        </Card>
      ) : null}

      {error && !unavailable ? (
        <Card variant="outlined" style={styles.resultCard}>
          <StateView kind="error" title={x.stateError} message={error} onRetry={handleDiagnose} retryLabel={x.retry} />
        </Card>
      ) : null}

      {result ? (
        <Card variant="elevated" style={styles.resultCard}>
          <View style={[styles.resultTopRow, isRtl && styles.rtlRow]}>
            <View style={styles.resultDiseaseHeader}>
              <Text style={[styles.diseaseTitleAr, isRtl && styles.rtlText]}>
                {language === 'ar' ? result.diseaseNameAr : result.diseaseName}
              </Text>
              <Text style={[styles.diseaseTitleEn, isRtl && styles.rtlText]}>
                {language === 'ar' ? result.diseaseName : result.diseaseNameAr}
              </Text>
            </View>
            {result.confidence !== null ? (
              <View style={styles.confidenceBadge}>
                <Text style={styles.confidenceNum}>{result.confidence}%</Text>
                <Text style={styles.confidenceLabel}>{x.diseaseConfidenceLabel}</Text>
              </View>
            ) : null}
          </View>

          <View style={[styles.badgesRow, isRtl && styles.rtlRow]}>
            <Badge
              label={`${x.scannerSeverityLabel}: ${severityLabel(result.severity, x)}`}
              variant={severityVariant(result.severity)}
              size="md"
            />
            <ProvenanceBadge meta={result.meta} />
          </View>

          {result.descriptionAr ? (
            <Text style={[styles.diseaseDesc, isRtl && styles.rtlText]}>{result.descriptionAr}</Text>
          ) : null}

          {resultIsArabicOnly ? (
            <Text style={[styles.arabicNote, isRtl && styles.rtlText]}>{x.arabicOnlyNote}</Text>
          ) : null}

          {result.symptoms.length ? (
            <Block title={x.diseaseSymptoms} isRtl={isRtl}>
              {result.symptoms.map((s, i) => (
                <Bullet key={i} text={s} color={colors.danger} isRtl={isRtl} />
              ))}
            </Block>
          ) : null}

          {result.treatment.length ? (
            <Block title={x.diseaseTreatment} isRtl={isRtl}>
              {result.treatment.map((s, i) => (
                <Bullet key={i} text={s} color={colors.primary} isRtl={isRtl} />
              ))}
            </Block>
          ) : null}

          {result.prevention.length ? (
            <Block title={x.diseasePrevention} isRtl={isRtl}>
              {result.prevention.map((s, i) => (
                <Bullet key={i} text={s} color={colors.secondary} isRtl={isRtl} />
              ))}
            </Block>
          ) : null}

          <View style={styles.limitations}>
            <Text style={styles.limitationsTitle}>{x.diseaseLimitationsTitle}</Text>
            <Text style={styles.limitationsText}>{x.diseaseLimitationsText}</Text>
          </View>
        </Card>
      ) : null}

      <Button title={t.back} variant="outline" onPress={onBack} style={{ marginTop: spacing.lg, marginBottom: spacing.xl }} />
    </ScrollView>
  );
};

const Block: React.FC<{ title: string; isRtl: boolean; children: React.ReactNode }> = ({ title, isRtl, children }) => (
  <View style={styles.detailBlock}>
    <Text style={[styles.blockTitle, isRtl && styles.rtlText]}>{title}</Text>
    {children}
  </View>
);

const Bullet: React.FC<{ text: string; color: string; isRtl: boolean }> = ({ text, color, isRtl }) => (
  <View style={[styles.bulletItem, isRtl && styles.rtlRow]}>
    <MaterialCommunityIcons name="circle-medium" size={16} color={color} />
    <Text style={[styles.bulletText, isRtl && styles.rtlText]}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing['3xl'] },
  rtlRow: { flexDirection: 'row-reverse' },
  rtlText: { textAlign: 'right', writingDirection: 'rtl' },
  uploadCard: { padding: spacing.md, marginBottom: spacing.md },
  stepHeading: { fontSize: typography.fontSizes.sm, lineHeight: 21, fontWeight: typography.fontWeights.bold, color: colors.text, marginBottom: spacing.sm },
  previewContainer: { position: 'relative', borderRadius: radius.md, overflow: 'hidden' },
  previewImage: { width: '100%', height: 220, borderRadius: radius.md },
  removeImageBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonsRow: { flexDirection: 'row', gap: spacing.sm },
  actionPickBtn: {
    flex: 1,
    minHeight: 84,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: spacing.sm,
  },
  galleryBtn: { backgroundColor: colors.surfaceSubtle, borderWidth: 1, borderColor: colors.border },
  actionPickText: { color: colors.textInverse, fontSize: typography.fontSizes.xs, fontWeight: typography.fontWeights.bold, textAlign: 'center', lineHeight: 20 },
  section: { marginBottom: spacing.md },
  cropsScroll: { gap: spacing.sm, paddingVertical: spacing.xs },
  cropChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  cropChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  cropChipText: { fontSize: typography.fontSizes.xs, color: colors.textSecondary, fontWeight: typography.fontWeights.medium, lineHeight: 20 },
  cropChipTextSelected: { color: colors.textInverse },
  partsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  partChip: {
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  partChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  partChipText: { fontSize: typography.fontSizes.xs, color: colors.textSecondary, lineHeight: 20 },
  partChipTextSelected: { color: colors.textInverse, fontWeight: typography.fontWeights.bold },
  symptomsInput: {
    minHeight: 80,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    fontSize: typography.fontSizes.sm, lineHeight: 21,
    color: colors.text,
    textAlignVertical: 'top',
  },
  resultCard: { padding: spacing.md },
  resultTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm },
  resultDiseaseHeader: { flex: 1 },
  diseaseTitleAr: { fontSize: typography.fontSizes.base, lineHeight: 24, fontWeight: typography.fontWeights.bold, color: colors.text },
  diseaseTitleEn: { fontSize: typography.fontSizes.xs, color: colors.textMuted, marginTop: 2, lineHeight: 20 },
  confidenceBadge: { backgroundColor: colors.primaryLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.md, alignItems: 'center' },
  confidenceNum: { fontSize: typography.fontSizes.base, lineHeight: 24, fontWeight: typography.fontWeights.bold, color: colors.primaryDark },
  confidenceLabel: { fontSize: typography.fontSizes.xs, color: colors.primaryDark, lineHeight: 20 },
  badgesRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' },
  arabicNote: { fontSize: typography.fontSizes.xs, color: colors.textMuted, fontStyle: 'italic', marginTop: spacing.sm, lineHeight: 20 },
  diseaseDesc: { fontSize: typography.fontSizes.sm, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 20 },
  detailBlock: { marginTop: spacing.md },
  blockTitle: { fontSize: typography.fontSizes.sm, lineHeight: 21, fontWeight: typography.fontWeights.bold, color: colors.text, marginBottom: spacing.xs },
  bulletItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginBottom: 4 },
  bulletText: { flex: 1, fontSize: typography.fontSizes.sm, color: colors.textSecondary, lineHeight: 20 },
  limitations: { backgroundColor: colors.surfaceSubtle, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md },
  limitationsTitle: { fontSize: typography.fontSizes.sm, lineHeight: 21, fontWeight: typography.fontWeights.bold, color: colors.text, marginBottom: 4 },
  limitationsText: { fontSize: typography.fontSizes.xs, color: colors.textSecondary, lineHeight: 21 },
});
