import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ProvenanceBadge } from '../ui/ProvenanceBadge';
import { SectionHeader } from '../ui/SectionHeader';
import { prepareImageForUpload } from '../../utils/image';
import { anyContainsArabic } from '../../utils/text';
import { severityLabel } from '../../utils/severity';
import { DiseaseDiagnosisResult } from '../../types';

type Phase = 'capture' | 'review' | 'analyzing' | 'result' | 'unavailable' | 'error';

interface PlantScannerProps {
  /** Called with the prepared image URI + optional extra context. */
  onSubmit: (image: {
    uri: string;
    mimeType: string;
    fileName: string;
    symptoms?: string;
  }) => Promise<{ data: DiseaseDiagnosisResult | null; error: string | null; unavailable: boolean }>;
  onClose: () => void;
}

/**
 * Native camera + gallery plant scanner.
 *
 * Flow: capture or pick -> review/retake -> upload the real bytes to the
 * gateway's image-diagnosis endpoint -> render the honest response (or an
 * honest "not configured" state). It never simulates a live AI scan and never
 * fabricates a diagnosis.
 */
export const PlantScanner: React.FC<PlantScannerProps> = ({ onSubmit, onClose }) => {
  const { x, isRtl, isArabic, language } = useLanguage();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<Phase>('capture');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [result, setResult] = useState<DiseaseDiagnosisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);

  const handleCapture = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85, skipProcessing: false });
      if (photo?.uri) {
        setImageUri(photo.uri);
        setPhase('review');
      }
    } catch (error: any) {
      setErrorMsg(error?.message || x.scannerCaptureFailed);
      setPhase('error');
    } finally {
      setCapturing(false);
    }
  };

  const handlePickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setErrorMsg(x.scannerGalleryDenied);
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
      allowsEditing: false,
    });
    if (!picked.canceled && picked.assets[0]?.uri) {
      setImageUri(picked.assets[0].uri);
      setPhase('review');
    }
  };

  const handleConfirm = async () => {
    if (!imageUri) return;
    setPhase('analyzing');
    const image = await prepareImageForUpload(imageUri);
    const response = await onSubmit({ ...image });
    if (response.unavailable) {
      setErrorMsg(response.error);
      setPhase('unavailable');
      return;
    }
    if (!response.data) {
      setErrorMsg(response.error || x.scannerAnalysisFailed);
      setPhase('error');
      return;
    }
    setResult(response.data);
    setPhase('result');
  };

  const reset = () => {
    setImageUri(null);
    setResult(null);
    setErrorMsg(null);
    setPhase('capture');
  };

  // The vision model is instructed to answer in Arabic, so its free text can be
  // Arabic even for fr/en callers. Flag that rather than implying translation.
  const resultIsArabicOnly =
    !!result &&
    !isArabic &&
    anyContainsArabic([result.descriptionAr, ...result.symptoms, ...result.treatment, ...result.prevention]);

  // ------------------------------- Capture ---------------------------------
  if (phase === 'capture') {
    if (!permission) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }
    if (!permission.granted) {
      return (
        <View style={styles.center}>
          <View style={styles.permIcon}>
            <MaterialCommunityIcons name="camera-off" size={40} color={colors.warning} />
          </View>
          <Text style={styles.permTitle}>{x.scannerPermissionTitle}</Text>
          <Text style={styles.permDesc}>{x.scannerPermissionDesc}</Text>
          <Button title={x.scannerGrant} onPress={requestPermission} variant="primary" />
          <View style={{ height: spacing.md }} />
          <Button title={x.scannerFromGallery} onPress={handlePickFromGallery} variant="outline" />
          <View style={{ height: spacing.sm }} />
          <Button title={x.close} onPress={onClose} variant="ghost" />
        </View>
      );
    }
    return (
      <View style={styles.flex}>
        <CameraView ref={cameraRef} style={styles.flex} facing="back" />
        <View style={styles.overlay}>
          <View style={[styles.guidance, isRtl && styles.rtlRow]}>
            <MaterialCommunityIcons name="information-outline" size={16} color={colors.textInverse} />
            <Text style={styles.guidanceText}>{x.scannerGuidance}</Text>
          </View>
          {errorMsg ? (
            <View style={[styles.captureError, isRtl && styles.rtlRow]}>
              <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.textInverse} />
              <Text style={styles.captureErrorText}>{errorMsg}</Text>
              <TouchableOpacity
                onPress={() => setErrorMsg(null)}
                accessibilityRole="button"
                accessibilityLabel={x.close}
                style={styles.errorClose}
              >
                <MaterialCommunityIcons name="close" size={16} color={colors.textInverse} />
              </TouchableOpacity>
            </View>
          ) : null}
          <View style={[styles.controls, isRtl && styles.rtlRow]}>
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={x.close}
              style={styles.sideBtn}
            >
              <MaterialCommunityIcons name="close" size={26} color={colors.textInverse} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCapture}
              disabled={capturing}
              accessibilityRole="button"
              accessibilityLabel={x.scannerCapture}
              accessibilityState={{ disabled: capturing, busy: capturing }}
              style={styles.shutter}
            >
              {capturing ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <MaterialCommunityIcons name="camera" size={30} color={colors.textInverse} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handlePickFromGallery}
              accessibilityRole="button"
              accessibilityLabel={x.scannerFromGallery}
              style={styles.sideBtn}
              testID="scanner-gallery"
            >
              <MaterialCommunityIcons name="image-multiple" size={24} color={colors.textInverse} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ------------------------------- Review ----------------------------------
  if (phase === 'review' && imageUri) {
    return (
      <View style={styles.flex}>
        <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="contain" />
        <View style={styles.reviewPanel}>
          <Text style={styles.reviewTitle}>{x.scannerReview}</Text>
          <Text style={styles.reviewSub}>{x.scannerReviewSub}</Text>
          <View style={{ height: spacing.md }} />
          <Button title={x.scannerConfirm} onPress={handleConfirm} variant="primary" fullWidth />
          <View style={{ height: spacing.sm }} />
          <Button title={x.scannerRetake} onPress={reset} variant="outline" fullWidth />
        </View>
      </View>
    );
  }

  // ------------------------------ Analyzing --------------------------------
  if (phase === 'analyzing') {
    return (
      <View style={styles.center}>
        {imageUri ? <Image source={{ uri: imageUri }} style={styles.analyzingThumb} /> : null}
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.lg }} />
        <Text style={styles.analyzingText}>{x.scannerAnalyzing}</Text>
      </View>
    );
  }

  // ------------------------- Unavailable / Error ---------------------------
  if (phase === 'unavailable' || phase === 'error') {
    return (
      <View style={styles.center}>
        <View style={styles.permIcon}>
          <MaterialCommunityIcons
            name={phase === 'unavailable' ? 'cloud-off-outline' : 'alert-circle-outline'}
            size={40}
            color={phase === 'unavailable' ? colors.textMuted : colors.danger}
          />
        </View>
        <Text style={styles.permTitle}>
          {phase === 'unavailable' ? x.scannerUnavailableTitle : x.stateError}
        </Text>
        <Text style={styles.permDesc}>
          {phase === 'unavailable' ? x.scannerUnavailableDesc : errorMsg}
        </Text>
        {imageUri ? <Image source={{ uri: imageUri }} style={styles.errorThumb} /> : null}
        <Button title={x.retry} onPress={reset} variant="primary" />
        <View style={{ height: spacing.sm }} />
        <Button title={x.close} onPress={onClose} variant="ghost" />
      </View>
    );
  }

  // -------------------------------- Result ---------------------------------
  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.resultContent}>
      {imageUri ? <Image source={{ uri: imageUri }} style={styles.resultImage} resizeMode="cover" /> : null}

      <Card variant="elevated" style={styles.resultCard}>
        <View style={[styles.resultHeader, isRtl && styles.rtlRow]}>
          <Text style={[styles.resultTitle, isRtl && styles.rtlText]}>
            {language === 'ar' ? result?.diseaseNameAr : result?.diseaseName}
          </Text>
          <ProvenanceBadge meta={result?.meta ?? { provenance: 'unavailable', isRealData: false }} detailed />
        </View>

        {result?.confidence !== null && result?.confidence !== undefined ? (
          <View style={[styles.confidenceRow, isRtl && styles.rtlRow]}>
            <MaterialCommunityIcons name="gauge" size={16} color={colors.primary} />
            <Text style={styles.confidenceText}>
              {`${x.diseaseConfidenceLabel}: ${result.confidence}%`}
            </Text>
          </View>
        ) : (
          <Text style={styles.noConfidence}>{x.scannerNoConfidenceLong}</Text>
        )}

        {result?.severity && result.severity !== 'unknown' ? (
          <Text style={styles.severity}>{`${x.scannerSeverityLabel}: ${severityLabel(result.severity, x)}`}</Text>
        ) : null}

        {resultIsArabicOnly ? <Text style={styles.arabicNote}>{x.arabicOnlyNote}</Text> : null}
      </Card>

      {result?.symptoms?.length ? (
        <Section icon="alert-outline" title={x.diseaseSymptoms} items={result.symptoms} />
      ) : null}
      {result?.treatment?.length ? (
        <Section icon="medical-bag" title={x.scannerSectionTreatment} items={result.treatment} />
      ) : null}
      {result?.prevention?.length ? (
        <Section icon="shield-check-outline" title={x.scannerSectionPrevention} items={result.prevention} />
      ) : null}

      <View style={styles.limitations}>
        <Text style={styles.limitationsTitle}>{x.diseaseLimitationsTitle}</Text>
        <Text style={styles.limitationsText}>{x.diseaseLimitationsText}</Text>
      </View>

      <Button title={x.close} onPress={onClose} variant="primary" fullWidth />
      <View style={{ height: spacing.sm }} />
      <Button title={x.scannerScanAnother} onPress={reset} variant="outline" fullWidth />
      <View style={{ height: spacing['2xl'] }} />
    </ScrollView>
  );
};

const Section: React.FC<{ icon: keyof typeof MaterialCommunityIcons.glyphMap; title: string; items: string[] }> = ({
  icon,
  title,
  items,
}) => {
  const { isRtl } = useLanguage();
  return (
    <Card variant="flat" style={styles.section}>
      <SectionHeader title={title} icon={icon} iconSize={18} titleNumberOfLines={0} />
      {items.map((item, index) => (
        <View key={index} style={[styles.bulletRow, isRtl && styles.rtlRow]}>
          <View style={styles.bullet} />
          <Text style={[styles.bulletText, isRtl && styles.rtlText]}>{item}</Text>
        </View>
      ))}
    </Card>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.lg,
  },
  guidance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    backgroundColor: colors.scrim,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  guidanceText: { color: colors.textInverse, fontSize: typography.fontSizes.sm, lineHeight: 21 },
  captureError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    backgroundColor: colors.dangerScrim,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    maxWidth: '92%',
  },
  captureErrorText: { color: colors.textInverse, fontSize: typography.fontSizes.xs, flexShrink: 1, lineHeight: 20 },
  errorClose: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', marginVertical: -14, marginHorizontal: -6 },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sideBtn: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.scrimLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutter: {
    width: 78,
    height: 78,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.onBrandSubtle,
  },
  preview: { flex: 1, backgroundColor: '#000' },
  reviewPanel: {
    padding: spacing.xl,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  reviewTitle: {
    fontSize: typography.fontSizes.lg, lineHeight: 27,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    textAlign: 'center',
  },
  reviewSub: {
    fontSize: typography.fontSizes.sm,
    lineHeight: 21,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  analyzingThumb: {
    width: 160,
    height: 160,
    borderRadius: radius.lg,
  },
  analyzingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: typography.fontSizes.base,
    lineHeight: 24,
  },
  permIcon: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  permTitle: {
    fontSize: typography.fontSizes.lg, lineHeight: 27,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  permDesc: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  errorThumb: { width: 120, height: 120, borderRadius: radius.lg, marginBottom: spacing.lg },
  resultContent: { padding: spacing.lg },
  resultImage: { width: '100%', height: 220, borderRadius: radius.lg, marginBottom: spacing.md },
  resultCard: { marginBottom: spacing.md },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  resultTitle: {
    flex: 1,
    fontSize: typography.fontSizes.lg, lineHeight: 27,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  rtlText: { textAlign: 'right', writingDirection: 'rtl' },
  rtlRow: { flexDirection: 'row-reverse' },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  confidenceText: { fontSize: typography.fontSizes.sm, lineHeight: 21, color: colors.text },
  noConfidence: {
    marginTop: spacing.sm,
    fontSize: typography.fontSizes.xs,
    lineHeight: 20,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  severity: { marginTop: 4, fontSize: typography.fontSizes.sm, lineHeight: 21, color: colors.textSecondary },
  arabicNote: { marginTop: spacing.sm, fontSize: typography.fontSizes.xs, color: colors.textMuted, fontStyle: 'italic', lineHeight: 20 },
  section: { marginBottom: spacing.md },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 7,
  },
  bulletText: { flex: 1, fontSize: typography.fontSizes.sm, color: colors.textSecondary, lineHeight: 20 },
  limitations: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  limitationsTitle: {
    fontSize: typography.fontSizes.sm,
    lineHeight: 21,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    marginBottom: 4,
  },
  limitationsText: { fontSize: typography.fontSizes.xs, color: colors.textSecondary, lineHeight: 21 },
});
