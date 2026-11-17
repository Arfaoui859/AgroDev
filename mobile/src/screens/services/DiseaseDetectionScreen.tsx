import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { actionsRow, cardPad, flex1, rowWrapSm, screenStyles, stackTopMd, stackedCard } from '../../theme/layout';
import { rtlStyles } from '../../theme/rtl';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { accentCaption, mutedCaptionTop, sectionHeading, titleBase, titleBaseAccent } from '../../theme/typographyStyles';
import { useLanguage } from '../../context/LanguageContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ServiceHeader } from '../../components/ui/ServiceHeader';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { LimitationsNotice } from '../../components/ui/LimitationsNotice';
import { ProvenanceBadge } from '../../components/ui/ProvenanceBadge';
import { Bullet } from '../../components/ui/Bullet';
import { StateCard } from '../../components/ui/StateCard';
import { PlantScanner } from '../../components/scanner/PlantScanner';
import { SaveDiagnosisToFarm } from '../../components/projects/SaveDiagnosisToFarm';
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

    try {
      const prepared = await prepareImageForUpload(imageUri);
      const res = await diagnosePlantDisease({
        imageUri: prepared.uri,
        mimeType: prepared.mimeType,
        fileName: prepared.fileName,
      });

      if (res.unavailable) {
        setUnavailable(true);
        setError(res.error);
      } else if (res.data) {
        setResult(res.data);
        void addHistoryEntry({
          type: 'disease',
          title: (language === 'ar' ? res.data.diseaseNameAr : res.data.diseaseName) || res.data.diseaseNameAr,
          summary: res.data.confidence !== null
            ? `${x.diseaseConfidenceLabel} ${res.data.confidence}%`
            : x.diseaseNoConfidence,
          badge: provenanceLabel(res.data.meta.provenance, language),
          badgeVariant: res.data.severity === 'high' || res.data.severity === 'critical' ? 'danger' : 'warning',
          imageUri: res.data.imageUri,
        });
      } else {
        setError(res.error || x.stateError);
      }
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message : String(cause);
      console.warn('[disease-screen] image analysis failed:', detail);
      setError(detail || x.stateError);
    } finally {
      setLoading(false);
    }
  };

  if (showScanner) {
    return (
      <PlantScanner
        onClose={() => {
          setShowScanner(false);
          if (startWithCamera && !imageUri) onBack();
        }}
        onSubmit={async ({ uri, mimeType, fileName }) => {
          try {
            const res = await diagnosePlantDisease({ imageUri: uri, mimeType, fileName });
            if (res.data) {
              setImageUri(uri);
              setResult(res.data);
              void addHistoryEntry({
                type: 'disease',
                title: (language === 'ar' ? res.data.diseaseNameAr : res.data.diseaseName) || res.data.diseaseNameAr,
                summary: res.data.confidence !== null
                  ? `${x.diseaseConfidenceLabel} ${res.data.confidence}%`
                  : x.diseaseNoConfidence,
                badge: provenanceLabel(res.data.meta.provenance, language),
                badgeVariant: res.data.severity === 'high' || res.data.severity === 'critical' ? 'danger' : 'warning',
                imageUri: res.data.imageUri,
              });
            }
            return res;
          } catch (cause) {
            const detail = cause instanceof Error ? cause.message : String(cause);
            console.warn('[disease-scanner] diagnosis callback failed:', detail);
            return { data: null, error: detail || x.stateError, unavailable: false };
          }
        }}
      />);
  }

  return (
    <ScrollView style={screenStyles.container} contentContainerStyle={screenStyles.content} showsVerticalScrollIndicator={false}>
      <ServiceHeader
        icon="camera-iris"
        iconColor={colors.danger}
        iconBg={colors.dangerLight}
        title={t.diseaseDiagnosisName}
        subtitle={t.diseaseDiagnosisDesc}
      />

      <Card variant="elevated" style={styles.uploadCard}>
        <Text style={[styles.stepHeading, isRtl && rtlStyles.rtlText]}>{x.diseaseStepImage}</Text>

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
          <View style={[styles.buttonsRow, isRtl && rtlStyles.rtlRow]}>
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

      <Button
        title={loading ? t.analyzing : x.diseaseAnalyzeButton}
        onPress={handleDiagnose}
        loading={loading}
        variant="primary"
        size="lg"
        style={{ marginVertical: spacing.md }}
      />

      {unavailable ? (
        <StateCard
          cardStyle={styles.resultCard}
          kind="unavailable"
          title={x.scannerUnavailableTitle}
          message={error || x.scannerUnavailableDesc}
        />
      ) : null}

      {error && !unavailable ? (
        <StateCard
          cardStyle={styles.resultCard}
          kind="error"
          title={x.stateError}
          message={error}
          onRetry={handleDiagnose}
          retryLabel={x.retry}
        />
      ) : null}

      {result ? (
        <Card variant="elevated" style={styles.resultCard}>
          <View style={[styles.resultTopRow, isRtl && rtlStyles.rtlRow]}>
            <View style={styles.resultDiseaseHeader}>
              <Text style={[styles.diseaseTitleAr, isRtl && rtlStyles.rtlText]}>
                {language === 'ar' ? result.diseaseNameAr : result.diseaseName}
              </Text>
              <Text style={[styles.diseaseTitleEn, isRtl && rtlStyles.rtlText]}>
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

          <View style={[styles.badgesRow, isRtl && rtlStyles.rtlRow]}>
            <Badge
              label={`${x.scannerSeverityLabel}: ${severityLabel(result.severity, x)}`}
              variant={severityVariant(result.severity)}
              size="md"
            />
            <ProvenanceBadge meta={result.meta} />
          </View>

          {result.descriptionAr ? (
            <Text style={[styles.diseaseDesc, isRtl && rtlStyles.rtlText]}>{result.descriptionAr}</Text>
          ) : null}

          {resultIsArabicOnly ? (
            <Text style={[styles.arabicNote, isRtl && rtlStyles.rtlText]}>{x.arabicOnlyNote}</Text>
          ) : null}

          {result.symptoms.length ? (
            <Block title={x.diseaseSymptoms}>
              {result.symptoms.map((s, i) => (
                <Bullet key={i} variant="icon" text={s} color={colors.danger} />
              ))}
            </Block>
          ) : null}

          {result.treatment.length ? (
            <Block title={x.diseaseTreatment}>
              {result.treatment.map((s, i) => (
                <Bullet key={i} variant="icon" text={s} color={colors.primary} />
              ))}
            </Block>
          ) : null}

          {result.prevention.length ? (
            <Block title={x.diseasePrevention}>
              {result.prevention.map((s, i) => (
                <Bullet key={i} variant="icon" text={s} color={colors.secondary} />
              ))}
            </Block>
          ) : null}

          <LimitationsNotice title={x.diseaseLimitationsTitle} text={x.diseaseLimitationsText} />
        </Card>
      ) : null}

      {result?.imageUri ? <SaveDiagnosisToFarm result={result} /> : null}

      <Button title={t.back} variant="outline" onPress={onBack} style={{ marginTop: spacing.lg, marginBottom: spacing.xl }} />
    </ScrollView>
  );
};

const Block: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <View style={styles.detailBlock}>
    <SectionHeader title={title} titleNumberOfLines={0} />
    {children}
  </View>
);

const styles = StyleSheet.create({
  uploadCard: stackedCard,
  stepHeading: sectionHeading,
  previewContainer: { position: 'relative', borderRadius: radius.md, overflow: 'hidden' },
  previewImage: { width: '100%', height: 220, borderRadius: radius.md },
  removeImageBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonsRow: actionsRow,
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
  actionPickText: { color: colors.textInverse, fontSize: typography.fontSizes.xs, fontWeight: typography.fontWeights.bold, textAlign: 'center', lineHeight: typography.lineHeights.xs },
  resultCard: cardPad,
  resultTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm },
  resultDiseaseHeader: flex1,
  diseaseTitleAr: titleBase,
  diseaseTitleEn: mutedCaptionTop,
  confidenceBadge: { backgroundColor: colors.primaryLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.md, alignItems: 'center' },
  confidenceNum: titleBaseAccent,
  confidenceLabel: accentCaption,
  badgesRow: { ...rowWrapSm, alignItems: 'center', marginTop: spacing.sm },
  arabicNote: { fontSize: typography.fontSizes.xs, color: colors.textMuted, fontStyle: 'italic', marginTop: spacing.sm, lineHeight: typography.lineHeights.xs },
  diseaseDesc: { fontSize: typography.fontSizes.sm, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: typography.lineHeights.xs },
  detailBlock: stackTopMd,
});
