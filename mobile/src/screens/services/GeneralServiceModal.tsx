import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput } from 'react-native';
import { screenStyles } from '../../theme/layout';
import { rtlStyles } from '../../theme/rtl';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { formInput } from '../../theme/formStyles';
import { useLanguage } from '../../context/LanguageContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Chip } from '../../components/ui/Chip';
import { ServiceHeader } from '../../components/ui/ServiceHeader';
import { StateView } from '../../components/ui/StateView';
import { ProvenanceBar } from '../../components/ui/ProvenanceBar';
import { StateCard } from '../../components/ui/StateCard';
import { identifyPest, getIrrigationPlan, getWeather } from '../../api/client';
import { pestCategory, pestName } from '../../utils/pestLabels';
import { PestIdentification, IrrigationResult } from '../../types';
import { ExtraTranslations } from '../../i18n/extra';
import { useAuth } from '../../context/AuthContext';
import { governorateFromName, governorateLabel } from '../../utils/governorates';

interface GeneralServiceModalProps {
  serviceId: string;
  onBack: () => void;
}

/**
 * Router for secondary services. Irrigation and pest control are wired to real
 * gateway endpoints (failing closed to an honest 503 state). Expert
 * consultation and community map to `/api/collaboration/*` endpoints that the
 * backend deliberately disables (503, fixture-backed) until verified
 * persistence is connected, so they render an explicit "not available" state
 * instead of fabricated sample data.
 */
export const GeneralServiceModal: React.FC<GeneralServiceModalProps> = ({ serviceId, onBack }) => {
  const { t, x } = useLanguage();

  if (serviceId === 'irrigation') return <IrrigationService onBack={onBack} />;
  if (serviceId === 'pest') return <PestService onBack={onBack} />;

  const meta: Record<string, { icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string; bg: string; title: string; note: string }> = {
    expert: {
      icon: 'stethoscope',
      color: colors.secondaryDark,
      bg: colors.secondaryLight,
      title: t.expertConsultationName,
      note: x.expertDisabledNote,
    },
    community: {
      icon: 'account-group',
      color: colors.primary,
      bg: colors.primaryLight,
      title: t.communityForumName,
      note: x.communityDisabledNote,
    },
  };

  const info = meta[serviceId] ?? {
    icon: 'tools' as const,
    color: colors.textMuted,
    bg: colors.surfaceSubtle,
    title: t.servicesTitle,
    note: x.svcNotWiredNote,
  };

  return (
    <ScrollView style={screenStyles.container} contentContainerStyle={screenStyles.content}>
      <ServiceHeader icon={info.icon} iconColor={info.color} iconBg={info.bg} title={info.title} />
      <StateCard kind="unavailable" title={x.svcUnavailableTitle} message={info.note} />
      <Button title={t.back} variant="outline" onPress={onBack} style={{ marginTop: spacing.lg }} />
    </ScrollView>
  );
};

// ---------------------------------------------------------------------------

const CROPS: { value: string; labelKey: keyof ExtraTranslations }[] = [
  { value: 'wheat', labelKey: 'cropWheat' },
  { value: 'olive', labelKey: 'cropOlive' },
  { value: 'tomato', labelKey: 'cropTomato' },
  { value: 'citrus', labelKey: 'cropCitrus' },
  { value: 'dates', labelKey: 'cropDates' },
  { value: 'potato', labelKey: 'cropPotato' },
];
const STAGES: { value: string; labelKey: keyof ExtraTranslations }[] = [
  { value: 'vegetative', labelKey: 'stageVegetative' },
  { value: 'flowering', labelKey: 'stageFlowering' },
  { value: 'fruiting', labelKey: 'stageFruiting' },
  { value: 'maturity', labelKey: 'stageMaturity' },
];

const IrrigationService: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { t, x, isRtl, language } = useLanguage();
  const { user } = useAuth();
  const [crop, setCrop] = useState('olive');
  const [stage, setStage] = useState('vegetative');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IrrigationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [climateUsed, setClimateUsed] = useState(false);

  const compute = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    setUnavailable(false);
    setClimateUsed(false);

    // Fetch the live Open-Meteo reading for the user's governorate and forward
    // it as the irrigation model's climate inputs. When the weather feed is
    // unreachable the inputs are omitted (never invented) and the note is not
    // shown, so the service's own documented defaults apply.
    const governorate = governorateFromName(user?.governorate);
    const weather = await getWeather(
      governorate.lat,
      governorate.lon,
      governorateLabel(governorate, language),
    );
    const temperature = weather.data?.temperature;
    const humidity = weather.data?.humidity;
    const hasClimate = typeof temperature === 'number' && typeof humidity === 'number';

    const res = await getIrrigationPlan({
      cropType: crop,
      growthStage: stage,
      days: 7,
      temperature: hasClimate ? temperature : undefined,
      humidity: hasClimate ? humidity : undefined,
    });
    if (res.unavailable) {
      setUnavailable(true);
      setError(res.error);
    } else if (res.data) {
      setResult(res.data);
      setClimateUsed(hasClimate);
    } else {
      setError(res.error || x.stateError);
    }
    setLoading(false);
  };

  return (
    <ScrollView style={screenStyles.container} contentContainerStyle={screenStyles.content}>
      <ServiceHeader
        icon="water-pump"
        iconColor={colors.water}
        iconBg={colors.waterLight}
        title={t.smartIrrigationName}
        subtitle={t.smartIrrigationDesc}
      />

      <Card variant="elevated" style={styles.card}>
        <Text style={[styles.label, isRtl && rtlStyles.rtlText]}>{x.irrigationCrop}</Text>
        <View style={[styles.chipsRow, isRtl && rtlStyles.rtlRow]}>
          {CROPS.map((c) => (
            <Chip key={c.value} label={x[c.labelKey]} selected={crop === c.value} onPress={() => setCrop(c.value)} />
          ))}
        </View>
        <Text style={[styles.label, { marginTop: spacing.md }, isRtl && rtlStyles.rtlText]}>{x.irrigationStage}</Text>
        <View style={[styles.chipsRow, isRtl && rtlStyles.rtlRow]}>
          {STAGES.map((st) => (
            <Chip key={st.value} label={x[st.labelKey]} selected={stage === st.value} onPress={() => setStage(st.value)} />
          ))}
        </View>
        <Button title={loading ? t.analyzing : x.irrigationCompute} onPress={compute} loading={loading} style={{ marginTop: spacing.md }} />
      </Card>

      {loading ? (
        <StateCard kind="loading" title={x.stateLoading} compact />
      ) : null}

      {unavailable ? (
        <StateCard
          kind="unavailable"
          title={x.irrigationUnavailableTitle}
          message={x.irrigationUnavailable}
        />
      ) : null}

      {error && !unavailable ? (
        <StateCard kind="error" title={x.stateError} message={error} onRetry={compute} retryLabel={x.retry} />
      ) : null}

      {result ? (
        <Card variant="elevated" style={styles.card}>
          <ProvenanceBar meta={result.meta} detailed style={styles.provRow} />
          {climateUsed ? (
            <View style={[styles.climateNote, isRtl && rtlStyles.rtlRow]}>
              <MaterialCommunityIcons name="weather-partly-cloudy" size={14} color={colors.secondary} />
              <Text style={[styles.hint, isRtl && rtlStyles.rtlText]}>{x.irrigationWeatherSource}</Text>
            </View>
          ) : null}
          <IrrigationResultView data={result.data} isRtl={isRtl} />
        </Card>
      ) : null}

      <Button title={t.back} variant="outline" onPress={onBack} style={{ marginTop: spacing.lg }} />
    </ScrollView>
  );
};

const PestService: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { t, x, isRtl, language } = useLanguage();
  const [symptoms, setSymptoms] = useState('');
  const [crop, setCrop] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PestIdentification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  const identify = async () => {
    const list = symptoms
      .split(/[,،\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!list.length) {
      setError(x.pestSymptomPlaceholder);
      return;
    }
    setLoading(true);
    setResult(null);
    setError(null);
    setUnavailable(false);
    const res = await identifyPest(list, crop || undefined);
    if (res.unavailable) {
      setUnavailable(true);
      setError(res.error);
    } else if (res.data) {
      setResult(res.data);
    } else {
      setError(res.error || x.pestNoResult);
    }
    setLoading(false);
  };

  return (
    <ScrollView style={screenStyles.container} contentContainerStyle={screenStyles.content}>
      <ServiceHeader
        icon="bug"
        iconColor={colors.danger}
        iconBg={colors.dangerLight}
        title={t.pestControlName}
        subtitle={t.pestControlDesc}
      />

      <Card variant="elevated" style={styles.card}>
        <Text style={[styles.label, isRtl && rtlStyles.rtlText]}>{x.pestSymptomInput}</Text>
        <TextInput
          style={[styles.textArea, isRtl && rtlStyles.rtlText]}
          placeholder={x.pestSymptomPlaceholder}
          placeholderTextColor={colors.textMuted}
          value={symptoms}
          onChangeText={setSymptoms}
          multiline
          accessibilityLabel={x.pestSymptomInput}
        />
        <Text style={[styles.hint, isRtl && rtlStyles.rtlText]}>{x.pestSeparatorHint}</Text>
        <Text style={[styles.label, { marginTop: spacing.md }, isRtl && rtlStyles.rtlText]}>{x.pestCropOptional}</Text>
        <TextInput
          style={[styles.input, isRtl && rtlStyles.rtlText]}
          placeholder={x.pestCropPlaceholder}
          placeholderTextColor={colors.textMuted}
          value={crop}
          onChangeText={setCrop}
          autoCapitalize="none"
          accessibilityLabel={x.pestCropOptional}
        />
        <Button title={loading ? t.analyzing : x.pestIdentify} onPress={identify} loading={loading} style={{ marginTop: spacing.md }} />
      </Card>

      {loading ? (
        <StateCard kind="loading" title={x.stateLoading} compact />
      ) : null}

      {unavailable ? (
        <StateCard kind="unavailable" title={x.pestUnavailableTitle} message={error || x.stateUnavailable} />
      ) : null}

      {error && !unavailable ? (
        <StateCard
          kind="error"
          title={x.stateError}
          message={error}
          onRetry={identify}
          retryLabel={x.retry}
        />
      ) : null}

      {result ? (
        <Card variant="elevated" style={styles.card}>
          <ProvenanceBar meta={result.meta} detailed style={styles.provRow} />
          {result.identifiedPest ? (
            <>
              <Text style={[styles.resultTitle, isRtl && rtlStyles.rtlText]}>
                {pestName(result.identifiedPest, result.pestNameAr, language)}
              </Text>
              {result.category ? (
                <Badge label={pestCategory(result.category, language)} variant="danger" size="sm" />
              ) : null}
              <Text style={[styles.hint, { marginTop: spacing.sm }, isRtl && rtlStyles.rtlText]}>
                {x.pestMethodPrefix}: {result.method} — {x.pestSymptomsUsed}: {result.symptomsUsed.join(x.listSeparator)}
              </Text>
              <Text style={[styles.hint, isRtl && rtlStyles.rtlText]}>{x.pestNoConfidenceNote}</Text>
            </>
          ) : (
            <StateView kind="empty" title={x.pestNoResult} compact />
          )}
        </Card>
      ) : null}

      <Button title={t.back} variant="outline" onPress={onBack} style={{ marginTop: spacing.lg }} />
    </ScrollView>
  );
};

const IrrigationResultView: React.FC<{ data: Record<string, unknown> | null; isRtl: boolean }> = ({ data, isRtl }) => {
  const { x } = useLanguage();
  if (!data) {
    return <Text style={[styles.hint, isRtl && rtlStyles.rtlText]}>{x.irrigationNoDetails}</Text>;
  }

  const num = (key: string): number | null => {
    const value = data[key];
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  };
  const recommendations = Array.isArray(data.recommendations)
    ? (data.recommendations as unknown[]).filter((r): r is string => typeof r === 'string')
    : [];

  const metrics: { label: string; value: string }[] = [];
  const daily = num('daily_requirement_mm');
  const weekly = num('weekly_requirement_mm');
  const et0 = num('et0_reference');
  const kc = num('crop_coefficient');
  const efficiency = num('water_use_efficiency');
  if (daily !== null) metrics.push({ label: x.metricDailyRequirement, value: `${daily.toFixed(1)} ${x.unitMm}` });
  if (weekly !== null) metrics.push({ label: x.metricWeeklyRequirement, value: `${weekly.toFixed(1)} ${x.unitMm}` });
  if (et0 !== null) metrics.push({ label: x.metricEt0, value: `${et0.toFixed(2)} ${x.unitMm}` });
  if (kc !== null) metrics.push({ label: x.metricCropCoefficient, value: kc.toFixed(2) });
  if (efficiency !== null) metrics.push({ label: x.metricWaterEfficiency, value: `${Math.round(efficiency * 100)}%` });

  if (!metrics.length && !recommendations.length) {
    return (
      <Text style={[styles.hint, isRtl && rtlStyles.rtlText]}>{x.irrigationRawUnknown}</Text>
    );
  }

  return (
    <View>
      {metrics.length ? (
        <View style={[styles.metricsGrid, isRtl && rtlStyles.rtlRow]}>
          {metrics.map((m) => (
            <View key={m.label} style={styles.metricBox}>
              <Text style={styles.metricBoxLabel}>{m.label}</Text>
              <Text style={styles.metricBoxValue}>{m.value}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {recommendations.length ? (
        <View style={{ marginTop: spacing.sm }}>
          <Text style={[styles.label, isRtl && rtlStyles.rtlText]}>{x.irrigationRecommendations}</Text>
          {recommendations.map((rec, i) => (
            <View key={i} style={[styles.bulletRow, isRtl && rtlStyles.rtlRow]}>
              <MaterialCommunityIcons name="circle-medium" size={16} color={colors.water} />
              <Text style={[styles.hint, { flex: 1 }, isRtl && rtlStyles.rtlText]}>{rec}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { padding: spacing.md, marginBottom: spacing.md },
  label: { fontSize: typography.fontSizes.xs, fontWeight: typography.fontWeights.semibold, color: colors.text, marginBottom: 6, lineHeight: typography.lineHeights.xs },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  textArea: {
    minHeight: 88,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    fontSize: typography.fontSizes.sm,
    lineHeight: typography.lineHeights.sm,
    color: colors.text,
    textAlignVertical: 'top',
  },
  input: formInput,
  hint: { fontSize: typography.fontSizes.xs, color: colors.textMuted, lineHeight: typography.lineHeights.sm, marginTop: 6 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  metricBox: {
    flexGrow: 1,
    flexBasis: '45%',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: 2,
  },
  metricBoxLabel: { fontSize: typography.fontSizes.xs, color: colors.textMuted, lineHeight: typography.lineHeights.xs },
  metricBoxValue: { fontSize: typography.fontSizes.base, lineHeight: typography.lineHeights.base, fontWeight: typography.fontWeights.bold, color: colors.water },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs, marginTop: 2 },
  provRow: { marginBottom: spacing.sm },
  climateNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.secondaryLight,
  },
  resultTitle: { fontSize: typography.fontSizes.base, lineHeight: typography.lineHeights.base, fontWeight: typography.fontWeights.bold, color: colors.text, marginBottom: spacing.xs },
});
