import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, radius, spacing, typography, shadows } from '../../theme/colors';
import { useLanguage } from '../../context/LanguageContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { diagnosePlantDisease } from '../../api/client';
import { DiseaseDiagnosisResult } from '../../types';
import { LivePlantScanner } from '../../components/scanner/LivePlantScanner';

interface DiseaseDetectionScreenProps {
  onBack: () => void;
  startWithCamera?: boolean;
}

export const DiseaseDetectionScreen: React.FC<DiseaseDetectionScreenProps> = ({
  onBack,
  startWithCamera = false,
}) => {
  const { t, isRtl } = useLanguage();

  const [showLiveScanner, setShowLiveScanner] = useState<boolean>(startWithCamera);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<string>('olive');
  const [selectedPart, setSelectedPart] = useState<string>('leaves');
  const [symptomsInput, setSymptomsInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<DiseaseDiagnosisResult | null>(null);

  const cropChoices = [
    { id: 'olive', label: 'شجر الزيتون', icon: 'tree' },
    { id: 'tomato', label: 'الطماطم', icon: 'food-apple' },
    { id: 'wheat', label: 'القمح والحبوب', icon: 'barley' },
    { id: 'citrus', label: 'القوارص', icon: 'fruit-citrus' },
    { id: 'dates', label: 'النخيل والتمور', icon: 'palm-tree' },
    { id: 'potato', label: 'البطاطا', icon: 'circle-slice-8' },
  ];

  const partChoices = [
    { id: 'leaves', label: 'الأوراق' },
    { id: 'fruit', label: 'الثمار' },
    { id: 'stem', label: 'الساق والأغصان' },
    { id: 'root', label: 'الجذور' },
  ];

  const handlePickImage = async (useCamera = false) => {
    try {
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('الإذن مطلوب', 'يرجى السماح بالوصول للكاميرا لالتقاط صورة النبات.');
          return;
        }
        const res = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
        if (!res.canceled && res.assets && res.assets.length > 0) {
          setImageUri(res.assets[0].uri);
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('الإذن مطلوب', 'يرجى السماح بالوصول لمعرض الصور.');
          return;
        }
        const res = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
        if (!res.canceled && res.assets && res.assets.length > 0) {
          setImageUri(res.assets[0].uri);
        }
      }
    } catch (e) {
      console.warn('Image picker error:', e);
    }
  };

  const handleDiagnose = async () => {
    setLoading(true);
    setResult(null);

    try {
      const diag = await diagnosePlantDisease({
        imageUri: imageUri || undefined,
        cropType: selectedCrop,
        plantPart: selectedPart,
        symptoms: symptomsInput || undefined,
      });
      setResult(diag);
    } catch (e) {
      console.warn('Diagnosis error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (showLiveScanner) {
    return (
      <LivePlantScanner
        onImageSelected={(uri) => {
          setImageUri(uri);
          setShowLiveScanner(false);
        }}
        onCancel={() => {
          setShowLiveScanner(false);
          if (startWithCamera && !imageUri) {
            onBack();
          }
        }}
      />
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Info */}
      <View style={styles.headerBox}>
        <View style={[styles.titleRow, isRtl && styles.rtlRow]}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="camera-iris" size={26} color={colors.danger} />
          </View>
          <View style={styles.titleTextContainer}>
            <Text style={[styles.mainTitle, isRtl && styles.rtlText]}>
              {t.diseaseDiagnosisName}
            </Text>
            <Text style={[styles.mainSub, isRtl && styles.rtlText]}>
              {t.diseaseDiagnosisDesc}
            </Text>
          </View>
        </View>
      </View>

      {/* Step 1: Image Capture Box */}
      <Card variant="elevated" style={styles.uploadCard}>
        <Text style={[styles.stepHeading, isRtl && styles.rtlText]}>
          1. التقاط أو اختيار صورة الورقة المصابة
        </Text>

        {imageUri ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setImageUri(null)}
              style={styles.removeImageBtn}
            >
              <MaterialCommunityIcons name="close" size={18} color={colors.textInverse} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.buttonsRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowLiveScanner(true)}
              style={[styles.actionPickBtn, { backgroundColor: colors.primary }]}
            >
              <MaterialCommunityIcons name="camera" size={24} color={colors.textInverse} />
              <Text style={styles.actionPickText}>{t.takePhoto}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handlePickImage(false)}
              style={[styles.actionPickBtn, { backgroundColor: colors.surfaceSubtle, borderWidth: 1, borderColor: colors.border }]}
            >
              <MaterialCommunityIcons name="image" size={24} color={colors.text} />
              <Text style={[styles.actionPickText, { color: colors.text }]}>{t.chooseGallery}</Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>

      {/* Step 2: Select Crop */}
      <View style={styles.section}>
        <Text style={[styles.stepHeading, isRtl && styles.rtlText]}>2. اختر نوع المحصول</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.cropsScroll, isRtl && styles.rtlRow]}
        >
          {cropChoices.map((c) => {
            const isSelected = selectedCrop === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                activeOpacity={0.8}
                onPress={() => setSelectedCrop(c.id)}
                style={[styles.cropChip, isSelected && styles.cropChipSelected]}
              >
                <MaterialCommunityIcons
                  name={c.icon as any}
                  size={18}
                  color={isSelected ? colors.textInverse : colors.primary}
                />
                <Text style={[styles.cropChipText, isSelected && styles.cropChipTextSelected]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Step 3: Select Plant Part */}
      <View style={styles.section}>
        <Text style={[styles.stepHeading, isRtl && styles.rtlText]}>3. الجزء المصاب</Text>
        <View style={[styles.partsRow, isRtl && styles.rtlRow]}>
          {partChoices.map((p) => {
            const isSelected = selectedPart === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                activeOpacity={0.8}
                onPress={() => setSelectedPart(p.id)}
                style={[styles.partChip, isSelected && styles.partChipSelected]}
              >
                <Text style={[styles.partChipText, isSelected && styles.partChipTextSelected]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Step 4: Optional Symptoms Note */}
      <View style={styles.section}>
        <Text style={[styles.stepHeading, isRtl && styles.rtlText]}>4. ملاحظات أو أعراض إضافية (اختياري)</Text>
        <TextInput
          style={[styles.symptomsInput, isRtl && styles.rtlText]}
          placeholder="مثال: بقع صفراء دائرية، جفاف الأطراف، تساقط سريع للأوراق..."
          placeholderTextColor={colors.textMuted}
          value={symptomsInput}
          onChangeText={setSymptomsInput}
        />
      </View>

      {/* Submit Button */}
      <Button
        title={loading ? t.analyzing : 'تشخيص المرض بالذكاء الاصطناعي'}
        onPress={handleDiagnose}
        loading={loading}
        variant="primary"
        size="lg"
        style={{ marginVertical: spacing.md }}
      />

      {/* Diagnosis Results Card */}
      {result && (
        <Card variant="elevated" style={styles.resultCard}>
          <View style={[styles.resultTopRow, isRtl && styles.rtlRow]}>
            <View style={styles.resultDiseaseHeader}>
              <Text style={[styles.diseaseTitleAr, isRtl && styles.rtlText]}>
                {result.diseaseNameAr}
              </Text>
              <Text style={[styles.diseaseTitleEn, isRtl && styles.rtlText]}>
                {result.diseaseName}
              </Text>
            </View>
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceNum}>{result.confidence}%</Text>
              <Text style={styles.confidenceLabel}>دقة التشخيص</Text>
            </View>
          </View>

          <View style={[styles.badgesRow, isRtl && styles.rtlRow]}>
            <Badge
              label={result.urgency === 'high' ? 'عاجل جداً' : 'متوسط الإلحاح'}
              variant={result.urgency === 'high' ? 'danger' : 'warning'}
              size="md"
            />
            <Badge label={t.provenanceReal} variant="primary" size="md" />
          </View>

          <Text style={[styles.diseaseDesc, isRtl && styles.rtlText]}>
            {result.descriptionAr}
          </Text>

          {/* Observed Symptoms */}
          <View style={styles.detailBlock}>
            <Text style={[styles.blockTitle, isRtl && styles.rtlText]}>الأعراض المكتشفة:</Text>
            {result.symptoms.map((s, idx) => (
              <View key={idx} style={[styles.bulletItem, isRtl && styles.rtlRow]}>
                <MaterialCommunityIcons name="circle-medium" size={16} color={colors.danger} />
                <Text style={[styles.bulletText, isRtl && styles.rtlText]}>{s}</Text>
              </View>
            ))}
          </View>

          {/* Treatment Steps */}
          <View style={styles.treatmentBlock}>
            <Text style={[styles.blockTitle, isRtl && styles.rtlText, { color: colors.primaryDark }]}>
              خطة العلاج والمكافحة الفورية:
            </Text>
            {result.treatment.map((tItem, idx) => (
              <View key={idx} style={[styles.bulletItem, isRtl && styles.rtlRow]}>
                <MaterialCommunityIcons name="check-circle" size={16} color={colors.primary} />
                <Text style={[styles.bulletText, isRtl && styles.rtlText]}>{tItem}</Text>
              </View>
            ))}
          </View>

          {/* Prevention Steps */}
          <View style={styles.preventionBlock}>
            <Text style={[styles.blockTitle, isRtl && styles.rtlText, { color: colors.secondaryDark }]}>
              إجراءات الوقاية طويلة الأمد:
            </Text>
            {result.prevention.map((pItem, idx) => (
              <View key={idx} style={[styles.bulletItem, isRtl && styles.rtlRow]}>
                <MaterialCommunityIcons name="shield-check" size={16} color={colors.secondary} />
                <Text style={[styles.bulletText, isRtl && styles.rtlText]}>{pItem}</Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* Back Button */}
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  rtlRow: {
    flexDirection: 'row-reverse',
  },
  rtlText: {
    textAlign: 'right',
  },
  headerBox: {
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleTextContainer: {
    flex: 1,
  },
  mainTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  mainSub: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  uploadCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  stepHeading: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  previewContainer: {
    position: 'relative',
    height: 200,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionPickBtn: {
    flex: 1,
    height: 52,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  actionPickText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textInverse,
  },
  section: {
    marginBottom: spacing.md,
  },
  cropsScroll: {
    gap: spacing.xs,
  },
  cropChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cropChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  cropChipText: {
    fontSize: typography.fontSizes.xs,
    color: colors.text,
    fontWeight: typography.fontWeights.medium,
  },
  cropChipTextSelected: {
    color: colors.textInverse,
    fontWeight: typography.fontWeights.bold,
  },
  partsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  partChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  partChipSelected: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  partChipText: {
    fontSize: typography.fontSizes.xs,
    color: colors.text,
  },
  partChipTextSelected: {
    color: colors.textInverse,
    fontWeight: typography.fontWeights.bold,
  },
  symptomsInput: {
    height: 46,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSizes.sm,
    color: colors.text,
  },
  resultCard: {
    padding: spacing.md,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  resultTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  resultDiseaseHeader: {
    flex: 1,
  },
  diseaseTitleAr: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.danger,
  },
  diseaseTitleEn: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
    marginTop: 2,
    fontStyle: 'italic',
  },
  confidenceBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  confidenceNum: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.primaryDark,
  },
  confidenceLabel: {
    fontSize: 9,
    color: colors.primaryDark,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  diseaseDesc: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  detailBlock: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  treatmentBlock: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  preventionBlock: {
    backgroundColor: colors.secondaryLight,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  blockTitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    marginBottom: 4,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    marginVertical: 2,
  },
  bulletText: {
    flex: 1,
    fontSize: typography.fontSizes.xs,
    color: colors.text,
    lineHeight: 16,
  },
});
