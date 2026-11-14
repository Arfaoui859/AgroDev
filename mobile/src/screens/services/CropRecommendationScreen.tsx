import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { useLanguage } from '../../context/LanguageContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ServiceHeader } from '../../components/ui/ServiceHeader';
import { StateView } from '../../components/ui/StateView';
import { ProvenanceBadge } from '../../components/ui/ProvenanceBadge';
import { FormField } from '../../components/ui/FormField';
import { getCropRecommendations, getFieldCropRecommendations, FieldCropRecommendation } from '../../api/client';
import { addHistoryEntry } from '../../api/history';
import { provenanceLabel } from '../../utils/provenance';
import { cropCategory, cropLevel, cropName, cropSeason } from '../../utils/cropLabels';
import { anyContainsArabic } from '../../utils/text';
import { getSoil } from '../../i18n/soil';
import { ProvenanceMeta, SoilToCropContext } from '../../types';

export interface CropSelection {
  cropId: string;
  cropName: string;
  cropNameAr: string;
  suitabilityScore: number;
  farmId?: string;
  fieldId?: string;
  areaHectares?: number;
}

interface CropRecommendationScreenProps {
  onBack: () => void;
  /** Soil measurements + plot handed over from the soil screen, if any. */
  initialContext?: SoilToCropContext | null;
  /** Start a cultivation project for the chosen crop. */
  onSelectCrop?: (selection: CropSelection) => void;
}

interface UnifiedCrop {
  id: string;
  name: string;
  nameAr: string;
  category: string;
  season: string;
  waterNeed: string;
  suitabilityScore: number;
  reasonsAr: string;
  /** Present only on the plot (persisted-soil) path. */
  daysToMaturity: number | null;
}

/**
 * Crop suitability for a plot or from the user's own soil measurements.
 *
 * Two honest paths:
 *  - Plot path (`POST /api/ai-recommendations`): scores the plot's PERSISTED
 *    soil analysis. If the plot has none, the server answers 409 and we say so
 *    (never fabricating a result).
 *  - Measurements path (`POST /api/ai/crop-recommendation`): the deterministic
 *    rule-based engine over a reference table. Labelled `rule-based`.
 *
 * Either way the engine is rule-based, never a trained model, and no yield or
 * profit figure is shown.
 */
export const CropRecommendationScreen: React.FC<CropRecommendationScreenProps> = ({
  onBack,
  initialContext,
  onSelectCrop,
}) => {
  const { t, x, isRtl, isArabic, language } = useLanguage();
  const s9 = useMemo(() => getSoil(language), [language]);

  const [crops, setCrops] = useState<UnifiedCrop[]>([]);
  const [meta, setMeta] = useState<ProvenanceMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requiresSoil, setRequiresSoil] = useState(false);
  const [source, setSource] = useState<'plot' | 'measurements' | null>(null);

  // Manual-entry fallback (no soil context).
  const [ph, setPh] = useState('');
  const [salinity, setSalinity] = useState('');
  const [area, setArea] = useState('');
  const [filter, setFilter] = useState(initialContext?.targetCrop ?? '');

  const resultIsArabicOnly = !isArabic && anyContainsArabic(crops.map((c) => c.reasonsAr));

  const runFromPlot = useCallback(
    async (fieldId: string) => {
      setLoading(true);
      setError(null);
      setRequiresSoil(false);
      setCrops([]);
      const res = await getFieldCropRecommendations(fieldId);
      if (res.data) {
        setCrops(
          res.data.recommendations.map((r: FieldCropRecommendation) => ({
            id: r.cropId,
            name: r.cropName,
            nameAr: r.cropNameAr,
            category: '',
            season: r.plantingSeason,
            waterNeed: r.waterNeed,
            suitabilityScore: r.suitabilityScore,
            reasonsAr: r.reasons.join(' • '),
            daysToMaturity: r.daysToMaturity,
          })),
        );
        setMeta(res.data.meta);
        setSource('plot');
      } else {
        setRequiresSoil(res.requiresSoilData);
        setError(res.requiresSoilData ? null : res.error);
      }
      setLoading(false);
    },
    [],
  );

  const runFromMeasurements = useCallback(
    async (input: { ph?: number; salinity?: number; areaHectares?: number }) => {
      setLoading(true);
      setError(null);
      setRequiresSoil(false);
      setCrops([]);
      const res = await getCropRecommendations(input);
      if (res.data) {
        setCrops(
          res.data.crops.map((c) => ({
            id: c.id,
            name: c.name,
            nameAr: c.nameAr,
            category: c.category,
            season: c.season,
            waterNeed: c.waterRequirement,
            suitabilityScore: c.suitabilityScore,
            reasonsAr: c.keyTipsAr,
            daysToMaturity: c.growthCycleDays || null,
          })),
        );
        setMeta(res.data.meta);
        setSource('measurements');
        if (res.data.crops.length > 0) {
          const top = res.data.crops[0];
          void addHistoryEntry({
            type: 'crop',
            title: language === 'ar' ? top.nameAr : cropName(top.name, language),
            summary: x.cropHistorySummary
              .replace('{score}', String(top.suitabilityScore))
              .replace('{count}', String(res.data.crops.length)),
            badge: provenanceLabel(res.data.meta.provenance, language),
            badgeVariant: 'success',
          });
        }
      } else {
        setError(res.error);
      }
      setLoading(false);
    },
    [language, x.cropHistorySummary],
  );

  // Auto-run from the handed-over context: a plot reads its persisted soil, a
  // measurement set feeds the rule-based engine. No re-entry required.
  useEffect(() => {
    (async () => {
      if (initialContext?.fieldId) {
        await runFromPlot(initialContext.fieldId);
      } else if (initialContext?.soil && Object.keys(initialContext.soil).length > 0) {
        await runFromMeasurements({
          ph: initialContext.soil.ph,
          salinity: initialContext.soil.electricalConductivity,
          areaHectares: initialContext.soil.farmAreaHectares,
        });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleManual = () => {
    const parse = (raw: string): number | undefined => {
      const trimmed = raw.trim().replace(',', '.');
      if (!trimmed) return undefined;
      const n = Number(trimmed);
      return Number.isFinite(n) ? n : undefined;
    };
    if ([ph, salinity, area].some((raw) => raw.trim() !== '' && parse(raw) === undefined)) {
      setError(x.cropInvalidInput);
      return;
    }
    void runFromMeasurements({ ph: parse(ph), salinity: parse(salinity), areaHectares: parse(area) });
  };

  // Re-run whichever path produced the current view; retrying a failed plot
  // lookup with empty manual inputs would query the wrong engine.
  const retry = () => {
    if (initialContext?.fieldId) void runFromPlot(initialContext.fieldId);
    else if (initialContext?.soil && Object.keys(initialContext.soil).length > 0) {
      void runFromMeasurements({
        ph: initialContext.soil.ph,
        salinity: initialContext.soil.electricalConductivity,
        areaHectares: initialContext.soil.farmAreaHectares,
      });
    } else handleManual();
  };

  const visibleCrops = filter.trim()
    ? crops.filter((c) => {
        const q = filter.trim().toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.nameAr.includes(filter.trim()) ||
          cropName(c.name, language).toLowerCase().includes(q)
        );
      })
    : crops;

  const select = (crop: UnifiedCrop) => {
    onSelectCrop?.({
      cropId: crop.id,
      cropName: crop.name,
      cropNameAr: crop.nameAr,
      suitabilityScore: crop.suitabilityScore,
      farmId: initialContext?.farmId,
      fieldId: initialContext?.fieldId,
      areaHectares: initialContext?.soil?.farmAreaHectares,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ServiceHeader
        icon="sprout"
        iconColor={colors.crop}
        iconBg={colors.cropLight}
        title={t.cropRecommendName}
        subtitle={t.cropRecommendDesc}
      />

      {initialContext ? (
        <View style={[styles.reuseBanner, isRtl && styles.rtlRow]}>
          <MaterialCommunityIcons name="database-check-outline" size={18} color={colors.info} />
          <Text style={[styles.reuseText, isRtl && styles.rtlText]}>{s9.reuseDataNote}</Text>
        </View>
      ) : null}

      {!initialContext ? (
        <Card variant="elevated" style={styles.inputCard}>
          <Text style={[styles.inputHeading, isRtl && styles.rtlText]}>{s9.cropEvaluateOwn}</Text>
          <View style={[styles.inputRow, isRtl && styles.rtlRow]}>
            <View style={styles.halfField}>
              <FormField label={x.cropSoilPh} value={ph} onChangeText={setPh} placeholder="6.5 - 8.5" />
            </View>
            <View style={styles.halfField}>
              <FormField label={x.cropSalinity} value={salinity} onChangeText={setSalinity} placeholder="0 - 4" />
            </View>
          </View>
          <FormField label={x.cropArea} value={area} onChangeText={setArea} placeholder="1" suffix="ha" />
          <Text style={[styles.hint, isRtl && styles.rtlText]}>{x.cropInputsHint}</Text>
          <Button title={loading ? t.analyzing : x.cropCompute} onPress={handleManual} loading={loading} size="md" />
        </Card>
      ) : null}

      {loading ? (
        <Card variant="outlined">
          <StateView kind="loading" title={s9.reusingSoilData} compact />
        </Card>
      ) : null}

      {requiresSoil && !loading ? (
        <Card variant="outlined">
          <StateView kind="empty" title={x.stateEmpty} message={s9.cropRequiresSoil} compact />
        </Card>
      ) : null}

      {error && !loading ? (
        <Card variant="outlined">
          <StateView kind="error" title={x.stateError} message={error} onRetry={retry} retryLabel={x.retry} />
        </Card>
      ) : null}

      {!loading && crops.length > 0 ? (
        <>
          <View style={[styles.provBar, isRtl && styles.rtlRow]}>
            {meta ? <ProvenanceBadge meta={meta} detailed /> : null}
          </View>
          {source === 'plot' ? (
            <Text style={[styles.sectionNote, isRtl && styles.rtlText]}>{s9.cropFromPlotTitle}</Text>
          ) : null}
          {resultIsArabicOnly ? (
            <Text style={[styles.arabicNote, isRtl && styles.rtlText]}>{x.arabicOnlyNote}</Text>
          ) : null}

          <FormField
            label={s9.cropEvaluateOwn}
            value={filter}
            onChangeText={setFilter}
            placeholder={s9.cropEvaluateOwnPlaceholder}
            keyboard="default"
          />

          {visibleCrops.length === 0 ? (
            <Card variant="outlined">
              <StateView kind="empty" title={x.stateEmpty} message={s9.cropCompareHint} compact />
            </Card>
          ) : null}

          <View style={styles.cropsList}>
            {visibleCrops.map((crop, index) => (
              <Card key={`${crop.id}-${index}`} variant="elevated" style={styles.cropCard}>
                <View style={[styles.cropHeader, isRtl && styles.rtlRow]}>
                  <View style={styles.cropTitleBox}>
                    <Text style={[styles.cropNameAr, isRtl && styles.rtlText]}>
                      {language === 'ar' ? crop.nameAr : cropName(crop.name, language)}
                    </Text>
                    <Text style={[styles.cropCategory, isRtl && styles.rtlText]}>
                      {[cropCategory(crop.category, language), cropSeason(crop.season, language)]
                        .filter(Boolean)
                        .join(' • ')}
                    </Text>
                  </View>
                  <View style={styles.scoreBadge}>
                    <Text style={styles.scoreText}>{crop.suitabilityScore}%</Text>
                    <Text style={styles.scoreSub}>{x.cropSuitabilityShort}</Text>
                  </View>
                </View>

                <View style={[styles.metricsRow, isRtl && styles.rtlRow]}>
                  {crop.waterNeed ? (
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>{s9.cropWater}</Text>
                      <Badge label={cropLevel(crop.waterNeed, language)} variant="info" size="sm" />
                    </View>
                  ) : null}
                  {crop.daysToMaturity ? (
                    <>
                      <View style={styles.metricDivider} />
                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>{s9.cropDaysToMaturity}</Text>
                        <Text style={styles.metricValue}>
                          {crop.daysToMaturity} {s9.cropDaysUnit}
                        </Text>
                      </View>
                    </>
                  ) : null}
                </View>

                {crop.reasonsAr ? (
                  <View style={[styles.tipsBox, isRtl && styles.rtlRow]}>
                    <MaterialCommunityIcons name="lightbulb-on" size={16} color={colors.accent} />
                    <Text style={[styles.tipsText, isRtl && styles.rtlText]}>{crop.reasonsAr}</Text>
                  </View>
                ) : null}

                {onSelectCrop ? (
                  <Button
                    title={s9.cropSelectThis}
                    onPress={() => select(crop)}
                    size="md"
                    variant="secondary"
                    style={{ marginTop: spacing.sm }}
                  />
                ) : null}
              </Card>
            ))}
          </View>
        </>
      ) : null}

      <Button title={t.back} variant="outline" onPress={onBack} style={{ marginTop: spacing.lg, marginBottom: spacing.xl }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing['3xl'] },
  rtlRow: { flexDirection: 'row-reverse' },
  rtlText: { textAlign: 'right', writingDirection: 'rtl' },
  reuseBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.infoLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  reuseText: { flex: 1, fontSize: typography.fontSizes.xs, lineHeight: 20, color: colors.info },
  inputCard: { padding: spacing.md, marginBottom: spacing.md },
  inputHeading: { fontSize: typography.fontSizes.sm, lineHeight: 21, fontWeight: typography.fontWeights.bold, color: colors.text, marginBottom: spacing.sm },
  inputRow: { flexDirection: 'row', gap: spacing.sm },
  halfField: { flex: 1 },
  hint: { fontSize: typography.fontSizes.xs, color: colors.textMuted, lineHeight: 21, marginBottom: spacing.xs },
  provBar: { marginBottom: spacing.sm },
  sectionNote: { fontSize: typography.fontSizes.sm, lineHeight: 21, fontWeight: typography.fontWeights.semibold, color: colors.text, marginBottom: spacing.xs },
  arabicNote: { fontSize: typography.fontSizes.xs, color: colors.textMuted, fontStyle: 'italic', marginBottom: spacing.sm, lineHeight: 20 },
  cropsList: { gap: spacing.md, marginTop: spacing.sm },
  cropCard: { padding: spacing.md },
  cropHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  cropTitleBox: { flex: 1 },
  cropNameAr: { fontSize: typography.fontSizes.base, lineHeight: 24, fontWeight: typography.fontWeights.bold, color: colors.text },
  cropCategory: { fontSize: typography.fontSizes.xs, color: colors.textSecondary, marginTop: 2, lineHeight: 20 },
  scoreBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  scoreText: { fontSize: typography.fontSizes.base, lineHeight: 24, fontWeight: typography.fontWeights.bold, color: colors.primaryDark },
  scoreSub: { fontSize: typography.fontSizes.xs, color: colors.primaryDark, lineHeight: 20 },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginVertical: spacing.sm,
  },
  metricItem: { alignItems: 'center', gap: 2 },
  metricLabel: { fontSize: typography.fontSizes.xs, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  metricValue: { fontSize: typography.fontSizes.sm, lineHeight: 21, fontWeight: typography.fontWeights.bold, color: colors.primary },
  metricDivider: { width: 1, height: 24, backgroundColor: colors.border },
  tipsBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.accentLight,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginTop: 4,
  },
  tipsText: { flex: 1, fontSize: typography.fontSizes.xs, color: colors.accentDark, lineHeight: 21 },
});
