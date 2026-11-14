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
import { getCropRecommendations } from '../../api/client';
import { addHistoryEntry } from '../../api/history';
import { provenanceLabel } from '../../utils/provenance';
import { cropCategory, cropLevel, cropName, cropSeason } from '../../utils/cropLabels';
import { anyContainsArabic } from '../../utils/text';
import { CropRecommendationResult } from '../../types';

interface CropRecommendationScreenProps {
  onBack: () => void;
}

/**
 * Crop suitability. Recommendations come from the backend's rule-based crop
 * engine over a reference table (labelled `rule-based`, not a trained model).
 * The engine only scores parameters the caller actually supplies, so the form
 * sends only the fields the user filled in.
 */
export const CropRecommendationScreen: React.FC<CropRecommendationScreenProps> = ({ onBack }) => {
  const { t, x, isRtl, isArabic, language } = useLanguage();
  const [ph, setPh] = useState('');
  const [temperature, setTemperature] = useState('');
  const [rainfall, setRainfall] = useState('');
  const [salinity, setSalinity] = useState('');
  const [area, setArea] = useState('');
  const [data, setData] = useState<CropRecommendationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The rule-based crop engine returns Arabic free-text key tips. Flag that for
  // fr/en callers so the Arabic-only note appears only when the text is Arabic.
  const resultIsArabicOnly =
    !!data && !isArabic && anyContainsArabic(data.crops.map((c) => c.keyTipsAr));

  const loadCrops = React.useCallback(async () => {
    const parsed = {
      ph: parseOptional(ph),
      temperature: parseOptional(temperature),
      rainfall: parseOptional(rainfall),
      salinity: parseOptional(salinity),
      areaHectares: parseOptional(area),
    };
    if (
      [ph, temperature, rainfall, salinity, area].some(
        (raw) => raw.trim() !== '' && parseOptional(raw) === undefined,
      )
    ) {
      setError(x.cropInvalidInput);
      return;
    }

    setLoading(true);
    setError(null);
    const res = await getCropRecommendations(parsed);
    setData(res.data);
    setError(res.error);
    if (res.data && res.data.crops.length > 0) {
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
    setLoading(false);
  }, [ph, temperature, rainfall, salinity, area, language, x.cropInvalidInput, x.cropHistorySummary]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ServiceHeader
        icon="sprout"
        iconColor={colors.crop}
        iconBg={colors.cropLight}
        title={t.cropRecommendName}
        subtitle={t.cropRecommendDesc}
      />

      <Card variant="elevated" style={styles.inputCard}>
        <View style={[styles.inputRow, isRtl && styles.rtlRow]}>
          <Field label={x.cropSoilPh} value={ph} onChangeText={setPh} placeholder="6.5 - 8.5" isRtl={isRtl} />
          <Field
            label={x.cropTemperature}
            value={temperature}
            onChangeText={setTemperature}
            placeholder="18 - 30"
            isRtl={isRtl}
          />
        </View>
        <View style={[styles.inputRow, isRtl && styles.rtlRow]}>
          <Field
            label={x.cropRainfall}
            value={rainfall}
            onChangeText={setRainfall}
            placeholder="300 - 600"
            isRtl={isRtl}
          />
          <Field label={x.cropSalinity} value={salinity} onChangeText={setSalinity} placeholder="0 - 4" isRtl={isRtl} />
        </View>
        <Field label={x.cropArea} value={area} onChangeText={setArea} placeholder="1" isRtl={isRtl} />
        <Text style={[styles.hint, isRtl && styles.rtlText]}>{x.cropInputsHint}</Text>
        <Button
          title={loading ? t.analyzing : x.cropCompute}
          onPress={loadCrops}
          loading={loading}
          variant="primary"
          style={{ marginTop: spacing.sm }}
        />
      </Card>

      {loading ? (
        <Card variant="outlined">
          <StateView kind="loading" title={x.stateLoading} compact />
        </Card>
      ) : null}

      {error && !loading ? (
        <Card variant="outlined">
          <StateView kind="error" title={x.stateError} message={error} onRetry={loadCrops} retryLabel={x.retry} />
        </Card>
      ) : null}

      {data && !loading && data.crops.length === 0 ? (
        <Card variant="outlined">
          <StateView kind="empty" title={x.stateEmpty} message={x.cropEmptyResult} compact />
        </Card>
      ) : null}

      {data && data.crops.length > 0 ? (
        <>
          <View style={[styles.provBar, isRtl && styles.rtlRow]}>
            <ProvenanceBadge meta={data.meta} detailed />
          </View>
          {resultIsArabicOnly ? (
            <Text style={[styles.arabicNote, isRtl && styles.rtlText]}>{x.arabicOnlyNote}</Text>
          ) : null}
          <View style={styles.cropsList}>
            {data.crops.map((crop, index) => (
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

                {crop.estimatedProfitTndPerHa > 0 ? (
                  <View style={[styles.metricsRow, isRtl && styles.rtlRow]}>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>{x.cropEstimatedProfit}</Text>
                      <Text style={styles.profitValue}>{crop.estimatedProfitTndPerHa} {x.currencyTnd}</Text>
                    </View>
                    {crop.waterRequirement ? (
                      <>
                        <View style={styles.metricDivider} />
                        <View style={styles.metricItem}>
                          <Text style={styles.metricLabel}>{x.cropWaterRequirement}</Text>
                          <Badge label={cropLevel(crop.waterRequirement, language)} variant="info" size="sm" />
                        </View>
                      </>
                    ) : null}
                  </View>
                ) : null}

                {crop.keyTipsAr ? (
                  <View style={[styles.tipsBox, isRtl && styles.rtlRow]}>
                    <MaterialCommunityIcons name="lightbulb-on" size={16} color={colors.accent} />
                    <Text style={[styles.tipsText, isRtl && styles.rtlText]}>{crop.keyTipsAr}</Text>
                  </View>
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

/** Parse an optional numeric field: '' -> undefined, invalid -> undefined. */
function parseOptional(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const value = Number(trimmed.replace(',', '.'));
  return Number.isFinite(value) ? value : undefined;
}

const Field: React.FC<{
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  isRtl: boolean;
}> = ({ label, value, onChangeText, placeholder, isRtl }) => (
  <View style={styles.field}>
    <Text style={[styles.fieldLabel, isRtl && styles.rtlText]}>{label}</Text>
    <TextInput
      style={[styles.fieldInput, isRtl && styles.rtlText]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      keyboardType="decimal-pad"
      inputMode="decimal"
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing['3xl'] },
  rtlRow: { flexDirection: 'row-reverse' },
  rtlText: { textAlign: 'right', writingDirection: 'rtl' },
  inputCard: { padding: spacing.md, marginBottom: spacing.md },
  inputRow: { flexDirection: 'row', gap: spacing.sm },
  field: { flex: 1, marginBottom: spacing.sm },
  fieldLabel: { fontSize: typography.fontSizes.xs, fontWeight: typography.fontWeights.semibold, color: colors.text, marginBottom: 4, lineHeight: 20 },
  fieldInput: {
    height: 48,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSizes.sm, lineHeight: 21,
    color: colors.text,
  },
  hint: { fontSize: typography.fontSizes.xs, color: colors.textMuted, lineHeight: 21, marginBottom: spacing.xs },
  provBar: { marginBottom: spacing.sm },
  arabicNote: { fontSize: typography.fontSizes.xs, color: colors.textMuted, fontStyle: 'italic', marginBottom: spacing.sm, lineHeight: 20 },
  cropsList: { gap: spacing.md },
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
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginVertical: spacing.sm,
  },
  metricItem: { flex: 1, alignItems: 'center', gap: 2 },
  metricLabel: { fontSize: typography.fontSizes.xs, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  profitValue: { fontSize: typography.fontSizes.sm, lineHeight: 21, fontWeight: typography.fontWeights.bold, color: colors.primary },
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
