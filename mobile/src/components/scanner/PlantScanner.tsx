import React, { useEffect, useRef, useState } from 'react';
import { rtlStyles } from '../../theme/rtl';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Animated,
  TextInput,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { titleLgFlex } from '../../theme/typographyStyles';
import { fillBackground, spaceBetween, stackMd } from '../../theme/layout';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ProvenanceBadge } from '../ui/ProvenanceBadge';
import { SectionHeader } from '../ui/SectionHeader';
import { Bullet } from '../ui/Bullet';
import { LimitationsNotice } from '../ui/LimitationsNotice';
import { prepareImageForUpload } from '../../utils/image';
import { anyContainsArabic } from '../../utils/text';
import { severityLabel } from '../../utils/severity';
import { DiseaseDiagnosisResult } from '../../types';
import { SaveDiagnosisToFarm } from '../projects/SaveDiagnosisToFarm';

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
  cropOptions: { id: string; label: string }[];
  selectedCrop: string;
  onSelectCrop: (id: string) => void;
  partOptions: { id: string; label: string }[];
  selectedPart: string;
  onSelectPart: (id: string) => void;
  cropTitle: string;
  partTitle: string;
}

/**
 * Native camera + gallery plant scanner.
 *
 * Flow: capture or pick -> review/retake -> upload the real bytes to the
 * gateway's image-diagnosis endpoint -> render the honest response (or an
 * honest "not configured" state). It never simulates a live AI scan and never
 * fabricates a diagnosis.
 */
export const PlantScanner: React.FC<PlantScannerProps> = ({ onSubmit, onClose, cropOptions, selectedCrop, onSelectCrop, partOptions, selectedPart, onSelectPart, cropTitle, partTitle }) => {
  const { x, isRtl, isArabic, language } = useLanguage();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<Phase>('capture');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [result, setResult] = useState<DiseaseDiagnosisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [symptomsInput, setSymptomsInput] = useState('');
  const [scanReady, setScanReady] = useState(false);
  const scanProgress = useRef(new Animated.Value(0)).current;

  // Decorative camera guidance only; diagnosis starts after photo submission.
  useEffect(() => {
    if (phase !== 'capture' || !permission?.granted) {
      setScanReady(false);
      return;
    }
    setScanReady(false);
    const readyTimer = setTimeout(() => setScanReady(true), 1600);
    scanProgress.setValue(0);
    const sweep = Animated.loop(
      Animated.sequence([
        Animated.timing(scanProgress, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(scanProgress, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    sweep.start();
    return () => {
      clearTimeout(readyTimer);
      sweep.stop();
    };
  }, [phase, permission?.granted, scanProgress]);

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
    try {
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
        setErrorMsg(null);
        setPhase('review');
      }
    } catch {
      setErrorMsg(x.scannerGalleryDenied);
    }
  };

  const handleConfirm = async () => {
    if (!imageUri || phase === 'analyzing') return;
    setPhase('analyzing');
    setErrorMsg(null);
    try {
      const image = await prepareImageForUpload(imageUri);
      const response = await onSubmit({ ...image, symptoms: symptomsInput.trim() || undefined });
      if (response.unavailable) {
        setErrorMsg(response.error || x.scannerUnavailableDesc);
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
    } catch {
      setErrorMsg(x.scannerAnalysisFailed);
      setPhase('error');
    }
  };

  const reset = () => {
    setImageUri(null);
    setResult(null);
    setErrorMsg(null);
    setSymptomsInput('');
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
          <View style={[styles.guidance, isRtl && rtlStyles.rtlRow]}>
            <MaterialCommunityIcons name="information-outline" size={16} color={colors.textInverse} />
            <Text style={styles.guidanceText}>{x.scannerGuidance}</Text>
          </View>
          <View pointerEvents="none" style={styles.scanGuide}>
            <View style={styles.scanFrame}>
              <View style={[styles.scanCorner, styles.scanTopLeft]} />
              <View style={[styles.scanCorner, styles.scanTopRight]} />
              <View style={[styles.scanCorner, styles.scanBottomLeft]} />
              <View style={[styles.scanCorner, styles.scanBottomRight]} />
              <View style={styles.scanCenter}>
                <MaterialCommunityIcons name="leaf" size={38} color={colors.textInverse} />
              </View>
              <Animated.View
                style={[
                  styles.scanLine,
                  { transform: [{ translateY: scanProgress.interpolate({ inputRange: [0, 1], outputRange: [0, 245] }) }] },
                ]}
              />
            </View>
            <View style={styles.scanTip}>
              <View style={styles.scanTipIcon}>
                <MaterialCommunityIcons name="leaf-circle" size={22} color={colors.textInverse} />
              </View>
              <Text style={styles.scanHint}>{x.scannerGuidance}</Text>
            </View>
            <Text style={styles.capturePrompt}>{scanReady ? x.scannerCapture : x.scannerGuidance}</Text>
          </View>
          {errorMsg ? (
            <View style={[styles.captureError, isRtl && rtlStyles.rtlRow]}>
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
          <View style={styles.contextSelectors}>
            <Text style={[styles.contextTitle, isRtl && rtlStyles.rtlText]}>{cropTitle}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.contextRow, isRtl && rtlStyles.rtlRow]}>
              {cropOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => onSelectCrop(option.id)}
                  accessibilityRole="button"
                  accessibilityLabel={option.label}
                  accessibilityState={{ selected: selectedCrop === option.id }}
                  style={[styles.contextChip, selectedCrop === option.id && styles.contextChipActive]}
                >
                  <Text style={[styles.contextChipText, selectedCrop === option.id && styles.contextChipTextActive]}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={[styles.contextTitle, isRtl && rtlStyles.rtlText]}>{partTitle}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.contextRow}>
              {partOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => onSelectPart(option.id)}
                  accessibilityRole="button"
                  accessibilityLabel={option.label}
                  accessibilityState={{ selected: selectedPart === option.id }}
                  style={[styles.contextChip, selectedPart === option.id && styles.contextChipActive]}
                >
                  <Text style={[styles.contextChipText, selectedPart === option.id && styles.contextChipTextActive]}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <View style={[styles.controls, isRtl && rtlStyles.rtlRow]}>
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
              disabled={capturing || !scanReady}
              accessibilityRole="button"
              accessibilityLabel={x.scannerCapture}
              accessibilityState={{ disabled: capturing || !scanReady, busy: capturing }}
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
          <Text style={styles.symptomsLabel}>{x.scannerSymptomsLabel}</Text>
          <TextInput
            style={[styles.symptomsInput, isRtl && rtlStyles.rtlText]}
            value={symptomsInput}
            onChangeText={setSymptomsInput}
            placeholder={x.scannerSymptomsPlaceholder}
            placeholderTextColor={colors.textMuted}
            multiline
            accessibilityLabel={x.scannerSymptomsLabel}
          />
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
        <View style={[styles.resultHeader, isRtl && rtlStyles.rtlRow]}>
          <Text style={[styles.resultTitle, isRtl && rtlStyles.rtlText]}>
            {language === 'ar' ? result?.diseaseNameAr : result?.diseaseName}
          </Text>
          <ProvenanceBadge meta={result?.meta ?? { provenance: 'unavailable', isRealData: false }} detailed />
        </View>

        {result?.confidence !== null && result?.confidence !== undefined ? (
          <View style={[styles.confidenceRow, isRtl && rtlStyles.rtlRow]}>
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

        {result?.descriptionAr ? <Text style={styles.resultDescription}>{result.descriptionAr}</Text> : null}
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

      {result?.imageUri ? <SaveDiagnosisToFarm result={result} /> : null}

      <LimitationsNotice
        title={x.diseaseLimitationsTitle}
        text={x.diseaseLimitationsText}
        style={{ marginBottom: spacing.lg }}
      />

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
}) => (
  <Card variant="flat" style={styles.section}>
    <SectionHeader title={title} icon={icon} iconSize={18} titleNumberOfLines={0} />
    {items.map((item, index) => (
      <Bullet key={index} text={item} />
    ))}
  </Card>
);

const styles = StyleSheet.create({
  flex: fillBackground,
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
  guidanceText: { color: colors.textInverse, fontSize: typography.fontSizes.sm, lineHeight: typography.lineHeights.sm },
  scanGuide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  scanFrame: {
    width: '78%',
    maxWidth: 320,
    aspectRatio: 0.82,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: radius.xl,
    backgroundColor: colors.scrimLight,
  },
  scanCorner: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderColor: colors.textInverse,
    borderWidth: 3,
  },
  scanTopLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: radius.md },
  scanTopRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: radius.md },
  scanBottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: radius.md },
  scanBottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: radius.md },
  scanCenter: {
    width: 68,
    height: 68,
    borderRadius: radius.full,
    backgroundColor: colors.scrimLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanHint: {
    flex: 1,
    color: colors.textInverse,
    fontSize: typography.fontSizes.xs,
    lineHeight: typography.lineHeights.xs,
    textAlign: 'left',
    textShadowColor: colors.scrim,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: '7%',
    width: '86%',
    height: 2,
    borderRadius: radius.full,
    backgroundColor: colors.onBrandSubtle,
    shadowColor: colors.onBrandSubtle,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 12,
    elevation: 8,
  },
  scanTip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: spacing.sm,
    maxWidth: 320,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.scrim,
  },
  scanTipIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.scrimLight,
  },
  contextSelectors: {
    width: '100%',
    gap: 4,
    paddingVertical: spacing.xs,
  },
  contextTitle: {
    color: colors.textInverse,
    fontSize: typography.fontSizes.xs,
    lineHeight: typography.lineHeights.xs,
    fontWeight: typography.fontWeights.semibold,
    marginTop: 2,
    textShadowColor: colors.scrim,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  contextRow: { flexDirection: 'row', gap: 6, paddingVertical: 3 },
  contextChip: {
    minHeight: 32,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.onBrandBorder,
    backgroundColor: colors.scrim,
    justifyContent: 'center',
  },
  contextChipActive: { backgroundColor: colors.primary, borderColor: colors.onBrandSubtle },
  contextChipText: { color: colors.textInverse, fontSize: typography.fontSizes.xs, lineHeight: typography.lineHeights.xs },
  contextChipTextActive: { fontWeight: typography.fontWeights.bold },
  resultDescription: {
    fontSize: typography.fontSizes.sm,
    lineHeight: typography.lineHeights.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  capturePrompt: {
    color: colors.textInverse,
    fontSize: typography.fontSizes.sm,
    lineHeight: typography.lineHeights.sm,
    fontWeight: typography.fontWeights.semibold,
    textAlign: 'center',
    marginTop: spacing.md,
    textShadowColor: colors.scrim,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
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
  captureErrorText: { color: colors.textInverse, fontSize: typography.fontSizes.xs, flexShrink: 1, lineHeight: typography.lineHeights.xs },
  errorClose: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', marginVertical: -14, marginHorizontal: -6 },
  controls: spaceBetween,
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
  preview: { flex: 1, backgroundColor: colors.imageBackdrop },
  reviewPanel: {
    padding: spacing.xl,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  reviewTitle: {
    fontSize: typography.fontSizes.lg, lineHeight: typography.lineHeights.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    textAlign: 'center',
  },
  reviewSub: {
    fontSize: typography.fontSizes.sm,
    lineHeight: typography.lineHeights.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  symptomsLabel: { fontSize: typography.fontSizes.xs, lineHeight: typography.lineHeights.xs, fontWeight: typography.fontWeights.semibold, color: colors.textSecondary, marginTop: spacing.md, marginBottom: spacing.xs },
  symptomsInput: { minHeight: 72, maxHeight: 120, backgroundColor: colors.surfaceSubtle, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, fontSize: typography.fontSizes.sm, lineHeight: typography.lineHeights.sm, color: colors.text, textAlignVertical: 'top' },
  analyzingThumb: {
    width: 160,
    height: 160,
    borderRadius: radius.lg,
  },
  analyzingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: typography.fontSizes.base,
    lineHeight: typography.lineHeights.base,
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
    fontSize: typography.fontSizes.lg, lineHeight: typography.lineHeights.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  permDesc: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.lineHeights.xs,
    marginBottom: spacing.xl,
  },
  errorThumb: { width: 120, height: 120, borderRadius: radius.lg, marginBottom: spacing.lg },
  resultContent: { padding: spacing.lg },
  resultImage: { width: '100%', height: 220, borderRadius: radius.lg, marginBottom: spacing.md },
  resultCard: stackMd,
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  resultTitle: titleLgFlex,
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  confidenceText: { fontSize: typography.fontSizes.sm, lineHeight: typography.lineHeights.sm, color: colors.text },
  noConfidence: {
    marginTop: spacing.sm,
    fontSize: typography.fontSizes.xs,
    lineHeight: typography.lineHeights.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  severity: { marginTop: spacing.xs, fontSize: typography.fontSizes.sm, lineHeight: typography.lineHeights.sm, color: colors.textSecondary },
  arabicNote: { marginTop: spacing.sm, fontSize: typography.fontSizes.xs, color: colors.textMuted, fontStyle: 'italic', lineHeight: typography.lineHeights.xs },
  section: stackMd,
});
