import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography, shadows } from '../../theme/colors';
import { useLanguage } from '../../context/LanguageContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { analyzeSoil } from '../../api/client';
import { SoilAnalysisResult } from '../../types';

interface SoilAnalysisScreenProps {
  onBack: () => void;
}

export const SoilAnalysisScreen: React.FC<SoilAnalysisScreenProps> = ({ onBack }) => {
  const { t, isRtl } = useLanguage();

  const [ph, setPh] = useState('7.2');
  const [nitrogen, setNitrogen] = useState('45');
  const [phosphorus, setPhosphorus] = useState('28');
  const [potassium, setPotassium] = useState('190');
  const [organicMatter, setOrganicMatter] = useState('2.4');
  const [moisture, setMoisture] = useState('32');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SoilAnalysisResult | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const res = await analyzeSoil({
        ph: parseFloat(ph) || 7.0,
        nitrogen: parseFloat(nitrogen) || 40,
        phosphorus: parseFloat(phosphorus) || 25,
        potassium: parseFloat(potassium) || 180,
        organicMatter: parseFloat(organicMatter) || 2.0,
        moisture: parseFloat(moisture) || 30,
      });
      setResult(res);
    } catch (e) {
      console.warn('Soil analysis error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Service Header Info */}
      <View style={styles.headerBox}>
        <View style={[styles.titleRow, isRtl && styles.rtlRow]}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="flask-outline" size={26} color={colors.soil} />
          </View>
          <View style={styles.titleTextContainer}>
            <Text style={[styles.mainTitle, isRtl && styles.rtlText]}>{t.soilAnalysisName}</Text>
            <Text style={[styles.mainSub, isRtl && styles.rtlText]}>{t.soilAnalysisDesc}</Text>
          </View>
        </View>
      </View>

      {/* Guided Input Form */}
      <Card variant="elevated" style={styles.formCard}>
        <Text style={[styles.formHeading, isRtl && styles.rtlText]}>
          أدخل بيانات عينة التربة (القيم الافتراضية مدرجة)
        </Text>

        {/* 1. pH Input */}
        <View style={styles.inputGroup}>
          <View style={[styles.labelRow, isRtl && styles.rtlRow]}>
            <Text style={styles.inputLabel}>درجة حموضة التربة (pH)</Text>
            <Text style={styles.inputHint}>المثالي: 6.5 - 7.8</Text>
          </View>
          <TextInput
            style={[styles.input, isRtl && styles.rtlText]}
            keyboardType="decimal-pad"
            value={ph}
            onChangeText={setPh}
            placeholder="مثال: 7.2"
          />
        </View>

        {/* 2. NPK Macronutrients Row */}
        <View style={[styles.inputsRow, isRtl && styles.rtlRow]}>
          <View style={styles.halfInputGroup}>
            <Text style={[styles.inputLabel, isRtl && styles.rtlText]}>الآزوت N (ملغ/كغ)</Text>
            <TextInput
              style={[styles.input, isRtl && styles.rtlText]}
              keyboardType="number-pad"
              value={nitrogen}
              onChangeText={setNitrogen}
              placeholder="45"
            />
          </View>
          <View style={styles.halfInputGroup}>
            <Text style={[styles.inputLabel, isRtl && styles.rtlText]}>الفسفور P (ملغ/كغ)</Text>
            <TextInput
              style={[styles.input, isRtl && styles.rtlText]}
              keyboardType="number-pad"
              value={phosphorus}
              onChangeText={setPhosphorus}
              placeholder="28"
            />
          </View>
        </View>

        {/* 3. Potassium & Organic Matter */}
        <View style={[styles.inputsRow, isRtl && styles.rtlRow]}>
          <View style={styles.halfInputGroup}>
            <Text style={[styles.inputLabel, isRtl && styles.rtlText]}>البوتاسيوم K (ملغ/كغ)</Text>
            <TextInput
              style={[styles.input, isRtl && styles.rtlText]}
              keyboardType="number-pad"
              value={potassium}
              onChangeText={setPotassium}
              placeholder="190"
            />
          </View>
          <View style={styles.halfInputGroup}>
            <Text style={[styles.inputLabel, isRtl && styles.rtlText]}>المادة العضوية (%)</Text>
            <TextInput
              style={[styles.input, isRtl && styles.rtlText]}
              keyboardType="decimal-pad"
              value={organicMatter}
              onChangeText={setOrganicMatter}
              placeholder="2.4"
            />
          </View>
        </View>

        <Button
          title={loading ? t.analyzing : 'تحليل خصوبة التربة الآن'}
          onPress={handleAnalyze}
          loading={loading}
          style={{ marginTop: spacing.md }}
        />
      </Card>

      {/* Results View */}
      {result && (
        <View style={styles.resultContainer}>
          <View style={[styles.resultHeader, isRtl && styles.rtlRow]}>
            <MaterialCommunityIcons name="check-decagram" size={24} color={colors.primary} />
            <Text style={styles.resultHeading}>{t.resultTitle}</Text>
            <Badge label={result.grade} variant="success" size="md" />
          </View>

          {/* Grade Card */}
          <Card variant="elevated" style={styles.gradeCard}>
            <View style={[styles.gradeRow, isRtl && styles.rtlRow]}>
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreNumber}>{result.gradeScore}</Text>
                <Text style={styles.scoreMax}>/100</Text>
              </View>
              <View style={styles.gradeDetails}>
                <Text style={[styles.gradeTitle, isRtl && styles.rtlText]}>
                  تقييم الخصوبة: {result.grade}
                </Text>
                <Text style={[styles.gradeDesc, isRtl && styles.rtlText]}>
                  {result.interpretationAr}
                </Text>
              </View>
            </View>
          </Card>

          {/* Suitable Crops */}
          <View style={styles.subSection}>
            <Text style={[styles.subSectionTitle, isRtl && styles.rtlText]}>
              المحاصيل الأكثر ملاءمة لهذه التربة
            </Text>
            <View style={styles.cropsGrid}>
              {result.suitableCrops.map((crop, idx) => (
                <View key={idx} style={[styles.cropCard, isRtl && styles.rtlRow]}>
                  <MaterialCommunityIcons name="sprout" size={20} color={colors.primary} />
                  <View style={styles.cropTextWrap}>
                    <Text style={[styles.cropName, isRtl && styles.rtlText]}>{crop.nameAr}</Text>
                    <Text style={[styles.cropProfit, isRtl && styles.rtlText]}>
                      المطابقة: {crop.compatibility} • ربحية {crop.profitability}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Tailored Fertilizer Plan */}
          <View style={styles.subSection}>
            <Text style={[styles.subSectionTitle, isRtl && styles.rtlText]}>
              برنامج التسميد الموصى به
            </Text>
            {result.fertilizerPlan.map((plan, idx) => (
              <Card key={idx} variant="outlined" style={styles.planCard}>
                <View style={[styles.planHeader, isRtl && styles.rtlRow]}>
                  <Text style={styles.planNutrient}>{plan.nutrientAr}</Text>
                  <Badge label={plan.quantity} variant="accent" size="sm" />
                </View>
                <Text style={[styles.planText, isRtl && styles.rtlText]}>
                  {plan.recommendationAr}
                </Text>
              </Card>
            ))}
          </View>
        </View>
      )}

      {/* Bottom Back Button */}
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
    backgroundColor: colors.soilLight,
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
  formCard: {
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  formHeading: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text,
  },
  inputHint: {
    fontSize: 10,
    color: colors.textMuted,
  },
  input: {
    height: 46,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSizes.sm,
    color: colors.text,
  },
  inputsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  halfInputGroup: {
    flex: 1,
  },
  resultContainer: {
    gap: spacing.md,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  resultHeading: {
    flex: 1,
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  gradeCard: {
    padding: spacing.md,
    backgroundColor: colors.card,
  },
  gradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  scoreCircle: {
    width: 60,
    height: 60,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.primaryDark,
  },
  scoreMax: {
    fontSize: 10,
    color: colors.primaryDark,
  },
  gradeDetails: {
    flex: 1,
  },
  gradeTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  gradeDesc: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  subSection: {
    marginTop: spacing.sm,
  },
  subSectionTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cropsGrid: {
    gap: spacing.xs,
  },
  cropCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cropTextWrap: {
    flex: 1,
  },
  cropName: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  cropProfit: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  planCard: {
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  planNutrient: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.accentDark,
  },
  planText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
