import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { screenStyles } from '../../theme/layout';
import { rtlStyles } from '../../theme/rtl';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ServiceHeader } from '../../components/ui/ServiceHeader';
import { ProvenanceBar } from '../../components/ui/ProvenanceBar';
import { Bullet } from '../../components/ui/Bullet';
import { Stepper } from '../../components/ui/Stepper';
import { StateCard } from '../../components/ui/StateCard';
import { PlotStep } from '../../components/soil/PlotStep';
import { MeasurementsStep, MeasurementsValues } from '../../components/soil/MeasurementsStep';
import { SoilReportView } from '../../components/soil/SoilReportView';
import { useFarmsFields } from '../../hooks/useFarmsFields';
import { analyzeSoil, analyzeSoilDetailed } from '../../api/client';
import { addHistoryEntry } from '../../api/history';
import { provenanceLabel } from '../../utils/provenance';
import { localizeSoilGrade } from '../../utils/soilGrade';
import { soilParamLabel } from '../../utils/soilLabels';
import { anyContainsArabic } from '../../utils/text';
import { buildSoilInput, toRuleBasedInput } from '../../utils/soilInput';
import { getSoil } from '../../i18n/soil';
import { SoilAnalysisResult, SoilDetailedResult, SoilToCropContext, Farm, Field } from '../../types';

interface SoilAnalysisScreenProps {
  onBack: () => void;
  /** Hand the plot + measurements to the crop screen without re-entry. */
  onFindCrops?: (context: SoilToCropContext) => void;
}

const defaultValues: MeasurementsValues = {
  values: {},
  ecUnit: '',
  waterEcUnit: '',
  nutrientUnit: '',
  nutrientMethod: '',
  ecMethod: '',
  irrigationMethod: '',
  targetCrop: '',
  samplingDate: '',
};

/**
 * Soil analysis — a three-step flow: choose the plot, enter measurements, read
 * the report.
 *
 * The report comes from the gateway's professional endpoint
 * (`POST /api/soil-analysis/analyze`), which is an LLM advisory over the
 * user-entered (unverified) measurements and is labelled as such. When that
 * service is unavailable the screen falls back to the deterministic rule-based
 * engine and says so — it never presents one as the other, and blank fields are
 * never filled with invented values.
 */
export const SoilAnalysisScreen: React.FC<SoilAnalysisScreenProps> = ({ onBack, onFindCrops }) => {
  const { t, x, isRtl, isArabic, language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const s9 = useMemo(() => getSoil(language), [language]);
  const loader = useFarmsFields();

  const [step, setStep] = useState(0);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [measurements, setMeasurements] = useState<MeasurementsValues>(defaultValues);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<SoilDetailedResult | null>(null);
  const [ruleResult, setRuleResult] = useState<SoilAnalysisResult | null>(null);

  const steps = [
    { key: 'plot', label: s9.step1Short },
    { key: 'measure', label: s9.step2Short },
    { key: 'report', label: s9.step3Short },
  ];

  const ruleResultIsArabicOnly =
    !!ruleResult &&
    !isArabic &&
    anyContainsArabic([
      ruleResult.interpretationAr,
      ...ruleResult.problems,
      ...ruleResult.recommendations,
      ...ruleResult.findings.map((f) => f.messageAr),
    ]);

  const regionLabel = useMemo(() => {
    if (!selectedFarm) return undefined;
    const loc = selectedFarm.location;
    if (typeof loc === 'string') return loc;
    return loc?.region;
  }, [selectedFarm]);

  const buildContext = (): SoilToCropContext => ({
    fieldId: selectedField?.id,
    farmId: selectedFarm?.id,
    farmName: selectedFarm?.name,
    fieldName: selectedField?.name,
    soil: buildSoilInput(measurements, {
      fieldId: selectedField?.id,
      region: regionLabel,
      farmAreaHectares: selectedField?.size_hectares,
    }).input,
    targetCrop: measurements.targetCrop.trim() || undefined,
  });

  const handleAnalyze = async () => {
    const { input, hasInvalid, measurementCount } = buildSoilInput(measurements, {
      fieldId: selectedField?.id,
      region: regionLabel,
      farmAreaHectares: selectedField?.size_hectares,
    });

    if (hasInvalid) {
      setError(s9.invalidNumbers);
      return;
    }
    if (measurementCount === 0) {
      setError(x.soilNeedOneMeasurement);
      return;
    }
    if (input.electricalConductivity !== undefined && !input.electricalConductivityUnit) {
      setError(s9.ecUnitRequired);
      return;
    }
    const texture = [input.sandPercent, input.siltPercent, input.clayPercent];
    if (texture.some((v) => v !== undefined) && texture.some((v) => v === undefined)) {
      setError(s9.textureTogether);
      return;
    }

    setLoading(true);
    setError(null);
    setReport(null);
    setRuleResult(null);

    // Preferred path: the professional advisory report (persisted when a plot
    // is selected). Only available to a signed-in caller.
    if (isAuthenticated) {
      const detailed = await analyzeSoilDetailed(input);
      if (detailed.data) {
        setReport(detailed.data);
        void addHistoryEntry({
          type: 'soil',
          title: selectedField ? `${s9.reportReportOf}: ${selectedField.name}` : t.soilAnalysisName,
          summary: detailed.data.report.executiveSummary.slice(0, 120),
          badge: provenanceLabel(detailed.data.meta.provenance, language),
          badgeVariant: 'primary',
        });
        setStep(2);
        setLoading(false);
        return;
      }
      if (!detailed.unavailable) {
        // A real failure (validation/schema) — surface it rather than silently
        // degrading, so the user can correct their input.
        setError(detailed.error || x.stateError);
        setLoading(false);
        return;
      }
      // unavailable -> fall through to the rule-based engine.
    }

    const fallback = await analyzeSoil(toRuleBasedInput(input));
    if (fallback.data) {
      setRuleResult(fallback.data);
      void addHistoryEntry({
        type: 'soil',
        title: t.soilAnalysisName,
        summary: fallback.data.fertilityLevel,
        badge: provenanceLabel(fallback.data.meta.provenance, language),
        badgeVariant: 'primary',
      });
      setStep(2);
    } else {
      setError(fallback.error || x.stateError);
    }
    setLoading(false);
  };

  const canContinueFromPlot = !!selectedField || !!selectedFarm;

  return (
    <ScrollView style={screenStyles.container} contentContainerStyle={screenStyles.content} showsVerticalScrollIndicator={false}>
      <ServiceHeader
        icon="flask-outline"
        iconColor={colors.soil}
        iconBg={colors.soilLight}
        title={t.soilAnalysisName}
        subtitle={t.soilAnalysisDesc}
      />

      <Stepper steps={steps} activeIndex={step} onSelect={(i) => i < step && setStep(i)} />

      {step === 0 ? (
        <>
          <PlotStep
            selectedFarm={selectedFarm}
            selectedField={selectedField}
            onSelectFarm={setSelectedFarm}
            onSelectField={setSelectedField}
            loader={loader}
          />
          <Button title={s9.next} onPress={() => setStep(1)} disabled={!canContinueFromPlot} />
        </>
      ) : null}

      {step === 1 ? (
        <>
          <MeasurementsStep initial={measurements} onChange={setMeasurements} />
          <Text style={[styles.blankNote, isRtl && rtlStyles.rtlText]}>{x.soilBlankNote}</Text>

          {error ? (
            <StateCard cardStyle={styles.formCard} kind="error" title={x.stateError} message={error} onRetry={handleAnalyze} retryLabel={x.retry} />
          ) : null}

          <Button
            title={loading ? t.analyzing : x.soilAnalyzeButton}
            onPress={handleAnalyze}
            loading={loading}
            style={{ marginTop: spacing.sm }}
          />
          <Button title={s9.previous} variant="outline" onPress={() => setStep(0)} style={{ marginTop: spacing.sm }} />
        </>
      ) : null}

      {step === 2 && loading ? (
        <StateCard cardStyle={styles.formCard} kind="loading" title={x.stateLoading} compact />
      ) : null}

      {step === 2 && report ? (
        <View style={styles.resultContainer}>
          <Card variant="elevated" style={styles.gradeCard}>
            <View style={[styles.resultHeader, isRtl && rtlStyles.rtlRow]}>
              <MaterialCommunityIcons name="file-document-check-outline" size={22} color={colors.primary} />
              <Text style={[styles.resultHeading, isRtl && rtlStyles.rtlText]}>
                {selectedField ? `${s9.reportReportOf}: ${selectedField.name}` : s9.reportTitle}
              </Text>
            </View>
            <ProvenanceBar meta={report.meta} detailed style={styles.provWrap} />
            <Text style={[styles.persistNote, isRtl && rtlStyles.rtlText]}>
              {report.persisted ? s9.reportPersistedNote : s9.reportNotPersistedNote}
            </Text>
          </Card>

          <Text style={[styles.arabicNote, isRtl && rtlStyles.rtlText]}>{s9.reportLanguageNote}</Text>

          <SoilReportView report={report.report} />

          {onFindCrops ? (
            <>
              <Button
                title={s9.findCropsCta}
                onPress={() => onFindCrops(buildContext())}
                icon={<MaterialCommunityIcons name="sprout" size={18} color={colors.primaryForeground} />}
                style={{ marginBottom: spacing.sm }}
              />
              <Text style={[styles.ctaSub, isRtl && rtlStyles.rtlText]}>{s9.findCropsCtaSub}</Text>
            </>
          ) : null}
        </View>
      ) : null}

      {step === 2 && ruleResult ? (
        <View style={styles.resultContainer}>
          <View style={[styles.resultHeader, isRtl && rtlStyles.rtlRow]}>
            <MaterialCommunityIcons name="check-decagram" size={24} color={colors.primary} />
            <Text style={[styles.resultHeading, isRtl && rtlStyles.rtlText]}>{t.resultTitle}</Text>
            <Badge label={localizeSoilGrade(ruleResult.fertilityLevel, x)} variant="success" size="md" />
          </View>

          <Card variant="elevated" style={styles.gradeCard}>
            <View style={[styles.gradeRow, isRtl && rtlStyles.rtlRow]}>
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreNumber}>{ruleResult.gradeScore}</Text>
                <Text style={styles.scoreMax}>/100</Text>
              </View>
              <View style={styles.gradeDetails}>
                <Text style={[styles.gradeTitle, isRtl && rtlStyles.rtlText]}>
                  {x.soilFertilityScore}: {localizeSoilGrade(ruleResult.fertilityLevel, x)}
                </Text>
                <Text style={[styles.gradeDesc, isRtl && rtlStyles.rtlText]}>{ruleResult.interpretationAr}</Text>
              </View>
            </View>
            <ProvenanceBar meta={ruleResult.meta} detailed style={styles.provWrap} />
          </Card>

          {ruleResultIsArabicOnly ? (
            <Text style={[styles.arabicNote, isRtl && rtlStyles.rtlText]}>{x.arabicOnlyNote}</Text>
          ) : null}

          {ruleResult.problems.length ? (
            <SubSection title={x.soilProblems} isRtl={isRtl}>
              {ruleResult.problems.map((p, i) => (
                <Bullet key={i} text={p} color={colors.warning} />
              ))}
            </SubSection>
          ) : null}

          {ruleResult.missingMeasurements.length ? (
            <SubSection title={x.soilMissingMeasurements} isRtl={isRtl}>
              {ruleResult.missingMeasurements.map((p, i) => (
                <Bullet key={i} text={p} color={colors.textMuted} />
              ))}
            </SubSection>
          ) : null}

          {ruleResult.findings.length ? (
            <SubSection title={x.soilFindings} isRtl={isRtl}>
              {ruleResult.findings.map((f, idx) => (
                <Card key={idx} variant="outlined" style={styles.findingCard}>
                  <View style={[styles.findingHeader, isRtl && rtlStyles.rtlRow]}>
                    <Text style={styles.findingParam}>{soilParamLabel(f.parameter, f.labelAr, language)}</Text>
                    {f.value !== null ? <Badge label={String(f.value)} variant="secondary" size="sm" /> : null}
                  </View>
                  <Text style={[styles.findingText, isRtl && rtlStyles.rtlText]}>{f.messageAr}</Text>
                </Card>
              ))}
            </SubSection>
          ) : null}

          {ruleResult.recommendations.length ? (
            <SubSection title={x.soilRecommendations} isRtl={isRtl}>
              {ruleResult.recommendations.map((r, i) => (
                <Bullet key={i} text={r} color={colors.primary} />
              ))}
            </SubSection>
          ) : null}

          {onFindCrops ? (
            <>
              <Button
                title={s9.findCropsCta}
                onPress={() => onFindCrops(buildContext())}
                icon={<MaterialCommunityIcons name="sprout" size={18} color={colors.primaryForeground} />}
                style={{ marginTop: spacing.md, marginBottom: spacing.sm }}
              />
              <Text style={[styles.ctaSub, isRtl && rtlStyles.rtlText]}>{s9.findCropsCtaSub}</Text>
            </>
          ) : null}
        </View>
      ) : null}

      {step === 2 ? (
        <Button title={s9.previous} variant="outline" onPress={() => setStep(1)} style={{ marginTop: spacing.md }} />
      ) : null}

      <Button title={t.back} variant="outline" onPress={onBack} style={{ marginTop: spacing.lg, marginBottom: spacing.xl }} />
    </ScrollView>
  );
};

const SubSection: React.FC<{ title: string; isRtl: boolean; children: React.ReactNode }> = ({ title, isRtl, children }) => (
  <View style={styles.subSection}>
    <Text style={[styles.subSectionTitle, isRtl && rtlStyles.rtlText]}>{title}</Text>
    {children}
  </View>
);

const styles = StyleSheet.create({
  arabicNote: { fontSize: typography.fontSizes.xs, color: colors.textMuted, fontStyle: 'italic', marginBottom: spacing.md, lineHeight: typography.lineHeights.xs },
  formCard: { padding: spacing.md, marginBottom: spacing.lg },
  blankNote: { fontSize: typography.fontSizes.xs, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.sm, lineHeight: typography.lineHeights.sm },
  resultContainer: { gap: spacing.md },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  resultHeading: { flex: 1, fontSize: typography.fontSizes.base, lineHeight: typography.lineHeights.base, fontWeight: typography.fontWeights.bold, color: colors.text },
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
  scoreNumber: { fontSize: typography.fontSizes.xl, lineHeight: typography.lineHeights.xl, fontWeight: typography.fontWeights.bold, color: colors.primaryDark },
  scoreMax: { fontSize: typography.fontSizes.xs, color: colors.primaryDark, lineHeight: typography.lineHeights.xs },
  gradeDetails: { flex: 1 },
  gradeTitle: { fontSize: typography.fontSizes.base, lineHeight: typography.lineHeights.base, fontWeight: typography.fontWeights.bold, color: colors.text },
  gradeDesc: { fontSize: typography.fontSizes.xs, color: colors.textSecondary, marginTop: 2, lineHeight: typography.lineHeights.sm },
  provWrap: { marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  persistNote: { fontSize: typography.fontSizes.xs, color: colors.textSecondary, marginTop: spacing.xs, lineHeight: typography.lineHeights.xs },
  ctaSub: { fontSize: typography.fontSizes.xs, color: colors.textMuted, lineHeight: typography.lineHeights.xs, marginBottom: spacing.sm },
  subSection: { marginTop: spacing.sm },
  subSectionTitle: { fontSize: typography.fontSizes.sm, lineHeight: typography.lineHeights.sm, fontWeight: typography.fontWeights.bold, color: colors.text, marginBottom: spacing.xs },
  findingCard: { padding: spacing.md, marginBottom: spacing.xs },
  findingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  findingParam: { fontSize: typography.fontSizes.sm, lineHeight: typography.lineHeights.sm, fontWeight: typography.fontWeights.bold, color: colors.text },
  findingText: { fontSize: typography.fontSizes.xs, color: colors.textSecondary, lineHeight: typography.lineHeights.sm },
});
