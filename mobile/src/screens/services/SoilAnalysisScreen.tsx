import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { useLanguage } from '../../context/LanguageContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ServiceHeader } from '../../components/ui/ServiceHeader';
import { StateView } from '../../components/ui/StateView';
import { ProvenanceBadge } from '../../components/ui/ProvenanceBadge';
import { analyzeSoil } from '../../api/client';
import { addHistoryEntry } from '../../api/history';
import { provenanceLabel } from '../../utils/provenance';
import { localizeSoilGrade } from '../../utils/soilGrade';
import { soilParamLabel } from '../../utils/soilLabels';
import { anyContainsArabic } from '../../utils/text';
import { SoilAnalysisResult } from '../../types';

interface SoilAnalysisScreenProps {
  onBack: () => void;
}

/**
 * Soil analysis form. Results come from the backend's in-process rule-based
 * agronomic engine, which is labelled honestly. Blank fields are sent as
 * undefined so the engine reports them as missing measurements rather than the
 * app silently substituting invented values.
 */
export const SoilAnalysisScreen: React.FC<SoilAnalysisScreenProps> = ({ onBack }) => {
  const { t, x, isRtl, isArabic, language } = useLanguage();

  // Start empty: the engine scores only the measurements the caller actually
  // supplies. Pre-filling a plausible sample would present invented numbers as
  // the user's own lab results.
  const [ph, setPh] = useState('');
  const [nitrogen, setNitrogen] = useState('');
  const [phosphorus, setPhosphorus] = useState('');
  const [potassium, setPotassium] = useState('');
  const [organicMatter, setOrganicMatter] = useState('');
  const [moisture, setMoisture] = useState('');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SoilAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parse = (value: string): number | undefined => {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const num = Number(trimmed.replace(',', '.'));
    return Number.isFinite(num) ? num : undefined;
  };

  // The rule-based soil engine answers in Arabic free text (interpretation,
  // problems, recommendations). Flag that for fr/en callers so the Arabic-only
  // note is shown only when the result actually contains Arabic.
  const resultIsArabicOnly =
    !!result &&
    !isArabic &&
    anyContainsArabic([
      result.interpretationAr,
      ...result.problems,
      ...result.recommendations,
      ...result.findings.map((f) => f.messageAr),
    ]);

  const handleAnalyze = async () => {
    const parsed = {
      ph: parse(ph),
      nitrogen: parse(nitrogen),
      phosphorus: parse(phosphorus),
      potassium: parse(potassium),
      organicMatter: parse(organicMatter),
      moisture: parse(moisture),
    };

    // Reject non-numeric text the user typed, rather than silently dropping it.
    const invalid = [
      [ph, parsed.ph],
      [nitrogen, parsed.nitrogen],
      [phosphorus, parsed.phosphorus],
      [potassium, parsed.potassium],
      [organicMatter, parsed.organicMatter],
      [moisture, parsed.moisture],
    ].some(([raw, value]) => (raw as string).trim() !== '' && value === undefined);
    if (invalid) {
      setError(x.soilInvalidInput);
      return;
    }

    // Every field blank would produce a scoreless "weak soil" reading from
    // nothing; require at least one real measurement.
    if (Object.values(parsed).every((v) => v === undefined)) {
      setError(x.soilNeedOneMeasurement);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    const res = await analyzeSoil(parsed);
    if (res.data) {
      setResult(res.data);
      // Persist the real analysis on the device so the history screen shows it.
      void addHistoryEntry({
        type: 'soil',
        title: t.soilAnalysisName,
        summary: res.data.fertilityLevel,
        badge: provenanceLabel(res.data.meta.provenance, language),
        badgeVariant: 'primary',
      });
    } else {
      setError(res.error || x.stateError);
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ServiceHeader
        icon="flask-outline"
        iconColor={colors.soil}
        iconBg={colors.soilLight}
        title={t.soilAnalysisName}
        subtitle={t.soilAnalysisDesc}
      />

      <Card variant="elevated" style={styles.formCard}>
        <Text style={[styles.formHeading, isRtl && styles.rtlText]}>{x.soilFormHeading}</Text>

        <Input label={x.soilPhLabel} hint={x.soilPhHint} value={ph} onChange={setPh} isRtl={isRtl} keyboard="decimal-pad" />
        <View style={[styles.inputsRow, isRtl && styles.rtlRow]}>
          <HalfInput label={x.soilNitrogenLabel} value={nitrogen} onChange={setNitrogen} isRtl={isRtl} />
          <HalfInput label={x.soilPhosphorusLabel} value={phosphorus} onChange={setPhosphorus} isRtl={isRtl} />
        </View>
        <View style={[styles.inputsRow, isRtl && styles.rtlRow]}>
          <HalfInput label={x.soilPotassiumLabel} value={potassium} onChange={setPotassium} isRtl={isRtl} />
          <HalfInput label={x.soilOrganicMatterLabel} value={organicMatter} onChange={setOrganicMatter} isRtl={isRtl} keyboard="decimal-pad" />
        </View>
        <HalfInput label={x.soilMoistureLabel} value={moisture} onChange={setMoisture} isRtl={isRtl} />

        <Text style={[styles.blankNote, isRtl && styles.rtlText]}>{x.soilBlankNote}</Text>

        <Button
          title={loading ? t.analyzing : x.soilAnalyzeButton}
          onPress={handleAnalyze}
          loading={loading}
          style={{ marginTop: spacing.md }}
        />
      </Card>

      {loading ? (
        <Card variant="outlined" style={styles.formCard}>
          <StateView kind="loading" title={x.stateLoading} compact />
        </Card>
      ) : null}

      {error && !loading ? (
        <Card variant="outlined" style={styles.formCard}>
          <StateView kind="error" title={x.stateError} message={error} onRetry={handleAnalyze} retryLabel={x.retry} />
        </Card>
      ) : null}

      {result && !loading ? (
        <View style={styles.resultContainer}>
          <View style={[styles.resultHeader, isRtl && styles.rtlRow]}>
            <MaterialCommunityIcons name="check-decagram" size={24} color={colors.primary} />
            <Text style={[styles.resultHeading, isRtl && styles.rtlText]}>{t.resultTitle}</Text>
            <Badge label={localizeSoilGrade(result.fertilityLevel, x)} variant="success" size="md" />
          </View>

          <Card variant="elevated" style={styles.gradeCard}>
            <View style={[styles.gradeRow, isRtl && styles.rtlRow]}>
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreNumber}>{result.gradeScore}</Text>
                <Text style={styles.scoreMax}>/100</Text>
              </View>
              <View style={styles.gradeDetails}>
                <Text style={[styles.gradeTitle, isRtl && styles.rtlText]}>
                  {x.soilFertilityScore}: {localizeSoilGrade(result.fertilityLevel, x)}
                </Text>
                <Text style={[styles.gradeDesc, isRtl && styles.rtlText]}>{result.interpretationAr}</Text>
              </View>
            </View>
            <View style={styles.provWrap}>
              <ProvenanceBadge meta={result.meta} detailed />
            </View>
          </Card>

          {resultIsArabicOnly ? (
            <Text style={[styles.arabicNote, isRtl && styles.rtlText]}>{x.arabicOnlyNote}</Text>
          ) : null}

          {result.problems.length ? (
            <SubSection title={x.soilProblems} isRtl={isRtl}>
              {result.problems.map((p, i) => (
                <Bullet key={i} text={p} color={colors.warning} isRtl={isRtl} />
              ))}
            </SubSection>
          ) : null}

          {result.missingMeasurements.length ? (
            <SubSection title={x.soilMissingMeasurements} isRtl={isRtl}>
              {result.missingMeasurements.map((p, i) => (
                <Bullet key={i} text={p} color={colors.textMuted} isRtl={isRtl} />
              ))}
            </SubSection>
          ) : null}

          {result.findings.length ? (
            <SubSection title={x.soilFindings} isRtl={isRtl}>
              {result.findings.map((f, idx) => (
                <Card key={idx} variant="outlined" style={styles.findingCard}>
                  <View style={[styles.findingHeader, isRtl && styles.rtlRow]}>
                    <Text style={styles.findingParam}>{soilParamLabel(f.parameter, f.labelAr, language)}</Text>
                    {f.value !== null ? <Badge label={String(f.value)} variant="secondary" size="sm" /> : null}
                  </View>
                  <Text style={[styles.findingText, isRtl && styles.rtlText]}>{f.messageAr}</Text>
                </Card>
              ))}
            </SubSection>
          ) : null}

          {result.recommendations.length ? (
            <SubSection title={x.soilRecommendations} isRtl={isRtl}>
              {result.recommendations.map((r, i) => (
                <Bullet key={i} text={r} color={colors.primary} isRtl={isRtl} />
              ))}
            </SubSection>
          ) : null}
        </View>
      ) : null}

      <Button title={t.back} variant="outline" onPress={onBack} style={{ marginTop: spacing.lg, marginBottom: spacing.xl }} />
    </ScrollView>
  );
};

const Input: React.FC<{
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  isRtl: boolean;
  keyboard?: 'decimal-pad' | 'number-pad';
}> = ({ label, hint, value, onChange, isRtl, keyboard = 'number-pad' }) => (
  <View style={styles.inputGroup}>
    <View style={[styles.labelRow, isRtl && styles.rtlRow]}>
      <Text style={[styles.inputLabel, isRtl && styles.rtlText]}>{label}</Text>
      {hint ? <Text style={styles.inputHint}>{hint}</Text> : null}
    </View>
    <TextInput
      style={[styles.input, isRtl && styles.rtlText]}
      keyboardType={keyboard}
      value={value}
      onChangeText={onChange}
      placeholder="—"
      placeholderTextColor={colors.textMuted}
      accessibilityLabel={label}
    />
  </View>
);

const HalfInput: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  isRtl: boolean;
  keyboard?: 'decimal-pad' | 'number-pad';
}> = ({ label, value, onChange, isRtl, keyboard = 'number-pad' }) => (
  <View style={styles.halfInputGroup}>
    <Text style={[styles.inputLabel, isRtl && styles.rtlText]}>{label}</Text>
    <TextInput
      style={[styles.input, isRtl && styles.rtlText]}
      keyboardType={keyboard}
      value={value}
      onChangeText={onChange}
      placeholder="—"
      placeholderTextColor={colors.textMuted}
      accessibilityLabel={label}
    />
  </View>
);

const SubSection: React.FC<{ title: string; isRtl: boolean; children: React.ReactNode }> = ({ title, isRtl, children }) => (
  <View style={styles.subSection}>
    <Text style={[styles.subSectionTitle, isRtl && styles.rtlText]}>{title}</Text>
    {children}
  </View>
);

const Bullet: React.FC<{ text: string; color: string; isRtl: boolean }> = ({ text, color, isRtl }) => (
  <View style={[styles.bulletRow, isRtl && styles.rtlRow]}>
    <View style={[styles.bullet, { backgroundColor: color }]} />
    <Text style={[styles.bulletText, isRtl && styles.rtlText]}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing['3xl'] },
  rtlRow: { flexDirection: 'row-reverse' },
  rtlText: { textAlign: 'right', writingDirection: 'rtl' },
  arabicNote: { fontSize: typography.fontSizes.xs, color: colors.textMuted, fontStyle: 'italic', marginBottom: spacing.md, lineHeight: 20 },
  formCard: { padding: spacing.md, marginBottom: spacing.lg },
  formHeading: { fontSize: typography.fontSizes.sm, lineHeight: 21, fontWeight: typography.fontWeights.bold, color: colors.text, marginBottom: spacing.md },
  inputGroup: { marginBottom: spacing.sm },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  inputLabel: { fontSize: typography.fontSizes.xs, fontWeight: typography.fontWeights.semibold, color: colors.text, lineHeight: 20 },
  inputHint: { fontSize: typography.fontSizes.xs, color: colors.textMuted, lineHeight: 20 },
  blankNote: { fontSize: typography.fontSizes.xs, color: colors.textMuted, marginTop: spacing.sm, lineHeight: 21 },
  input: {
    height: 48,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSizes.sm, lineHeight: 21,
    color: colors.text,
  },
  inputsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  halfInputGroup: { flex: 1 },
  resultContainer: { gap: spacing.md },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  resultHeading: { flex: 1, fontSize: typography.fontSizes.base, lineHeight: 24, fontWeight: typography.fontWeights.bold, color: colors.text },
  gradeCard: { padding: spacing.md, backgroundColor: colors.card },
  gradeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  scoreCircle: {
    width: 60,
    height: 60,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: { fontSize: typography.fontSizes.xl, lineHeight: 30, fontWeight: typography.fontWeights.bold, color: colors.primaryDark },
  scoreMax: { fontSize: typography.fontSizes.xs, color: colors.primaryDark, lineHeight: 20 },
  gradeDetails: { flex: 1 },
  gradeTitle: { fontSize: typography.fontSizes.base, lineHeight: 24, fontWeight: typography.fontWeights.bold, color: colors.text },
  gradeDesc: { fontSize: typography.fontSizes.xs, color: colors.textSecondary, marginTop: 2, lineHeight: 21 },
  provWrap: { marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  subSection: { marginTop: spacing.sm },
  subSectionTitle: { fontSize: typography.fontSizes.sm, lineHeight: 21, fontWeight: typography.fontWeights.bold, color: colors.text, marginBottom: spacing.xs },
  findingCard: { padding: spacing.md, marginBottom: spacing.xs },
  findingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  findingParam: { fontSize: typography.fontSizes.sm, lineHeight: 21, fontWeight: typography.fontWeights.bold, color: colors.text },
  findingText: { fontSize: typography.fontSizes.xs, color: colors.textSecondary, lineHeight: 21 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  bulletText: { flex: 1, fontSize: typography.fontSizes.sm, color: colors.textSecondary, lineHeight: 20 },
});
