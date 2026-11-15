import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { cardPad, screenStyles, spaceBetweenTop, stackedCard } from '../../theme/layout';
import { rtlStyles } from '../../theme/rtl';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { mutedCaption, subtitleMeta, titleBase, titleSm } from '../../theme/typographyStyles';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ServiceHeader } from '../../components/ui/ServiceHeader';
import { StatTile } from '../../components/ui/StatTile';
import { ProvenanceBadge } from '../../components/ui/ProvenanceBadge';
import { StateCard } from '../../components/ui/StateCard';
import { getAnimals, LivestockAnimal } from '../../api/client';
import { ProvenanceMeta } from '../../types';
import { formatNumber } from '../../utils/date';
import { livestockBreeding, livestockHealth, livestockSpecies } from '../../utils/livestockLabels';

interface LivestockScreenProps {
  onBack: () => void;
}

const HEALTH_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
  excellent: 'success',
  good: 'success',
  fair: 'info',
  poor: 'warning',
  sick: 'danger',
  unknown: 'info',
};

/**
 * Livestock management. Renders the caller's own persisted animals
 * (`GET /api/animals`, tenant-scoped). When the livestock tables are not
 * provisioned the backend answers 503 and this screen shows that honestly
 * instead of inventing a herd.
 */
export const LivestockScreen: React.FC<LivestockScreenProps> = ({ onBack }) => {
  const { t, x, isRtl, language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [animals, setAnimals] = useState<LivestockAnimal[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [meta, setMeta] = useState<ProvenanceMeta>({ provenance: 'database', isRealData: false });

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setAnimals([]);
      return;
    }
    setLoading(true);
    setError(null);
    setUnavailable(false);
    const res = await getAnimals();
    setAnimals(res.data);
    setError(res.error);
    setUnavailable(res.unavailable);
    setMeta(res.meta ?? { provenance: 'database', isRealData: false });
    setLoading(false);
  }, [isAuthenticated]);

  React.useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const healthy = animals.filter((a) => a.healthStatus === 'excellent' || a.healthStatus === 'good').length;
  const sick = animals.filter((a) => a.healthStatus === 'sick' || a.healthStatus === 'poor').length;
  const totalValue = animals.reduce((sum, a) => sum + (a.currentValue ?? 0), 0);

  return (
    <ScrollView
      style={screenStyles.container}
      contentContainerStyle={screenStyles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
    >
      <ServiceHeader
        icon="cow"
        iconColor={colors.accent}
        iconBg={colors.accentLight}
        title={t.livestockName}
        subtitle={t.livestockDesc}
      />

      {!isAuthenticated ? (
        <StateCard kind="unavailable" title={x.loginRequired} message={x.livestockLoginRequired} />
      ) : loading && animals.length === 0 ? (
        <StateCard kind="loading" title={x.stateLoading} compact />
      ) : unavailable ? (
        <StateCard
          kind="unavailable"
          title={x.livestockUnavailable}
          message={error || x.livestockUnavailableDesc}
          onRetry={load}
          retryLabel={x.retry}
        />
      ) : error && animals.length === 0 ? (
        <StateCard kind="error" title={x.stateError} message={error} onRetry={load} retryLabel={x.retry} />
      ) : animals.length === 0 ? (
        <StateCard kind="empty" title={x.stateEmpty} message={x.livestockEmpty} compact />
      ) : (
        <>
          <Card variant="elevated" style={styles.summaryCard}>
            <View style={[styles.summaryHeader, isRtl && rtlStyles.rtlRow]}>
              <Text style={[styles.summaryTitle, isRtl && rtlStyles.rtlText]}>{x.livestockSummary}</Text>
              <ProvenanceBadge meta={meta} />
            </View>
            <View style={[styles.summaryRow, isRtl && rtlStyles.rtlRow]}>
              <StatTile style={styles.statTile} label={x.livestockTotal} value={String(animals.length)} color={colors.text} />
              <View style={styles.divider} />
              <StatTile style={styles.statTile} label={x.livestockHealthy} value={String(healthy)} color={colors.success} />
              <View style={styles.divider} />
              <StatTile style={styles.statTile} label={x.livestockSick} value={String(sick)} color={colors.danger} />
            </View>
            {totalValue > 0 ? (
              <Text style={[styles.totalValue, isRtl && rtlStyles.rtlText]}>
                {x.livestockValue}: {formatNumber(totalValue, language)} {x.currencyTnd}
              </Text>
            ) : null}
          </Card>

          <View style={styles.animalList}>
            {animals.map((animal) => (
              <Card key={animal.id} variant="elevated" style={styles.animalCard}>
                <View style={[styles.animalHeader, isRtl && rtlStyles.rtlRow]}>
                  <View style={styles.animalTitleArea}>
                    <Text style={[styles.animalTag, isRtl && rtlStyles.rtlText]}>
                      {animal.earTag || livestockSpecies(animal.species, language)}
                    </Text>
                    <Text style={[styles.animalMeta, isRtl && rtlStyles.rtlText]}>
                      {[livestockSpecies(animal.species, language), animal.breed]
                        .filter(Boolean)
                        .join(' • ')}
                    </Text>
                  </View>
                  <Badge
                    label={livestockHealth(animal.healthStatus, language)}
                    variant={HEALTH_VARIANT[animal.healthStatus] ?? 'info'}
                    size="sm"
                  />
                </View>

                <View style={[styles.animalMetrics, isRtl && rtlStyles.rtlRow]}>
                  {animal.age !== null ? (
                    <Metric label={x.livestockAge} value={`${animal.age}`} />
                  ) : null}
                  {animal.weight !== null ? (
                    <Metric label={x.livestockWeight} value={`${animal.weight} ${x.unitKg}`} />
                  ) : null}
                  {animal.breedingStatus && animal.breedingStatus !== 'unknown' ? (
                    <Metric
                      label={x.livestockBreeding}
                      value={livestockBreeding(animal.breedingStatus, language)}
                    />
                  ) : null}
                  {animal.currentValue !== null ? (
                    <Metric label={x.livestockValue} value={`${animal.currentValue} ${animal.currency}`} />
                  ) : null}
                </View>
              </Card>
            ))}
          </View>
        </>
      )}

      <Button title={t.back} variant="outline" onPress={onBack} style={{ marginTop: spacing.lg, marginBottom: spacing.xl }} />
    </ScrollView>
  );
};

const Metric: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.metricItem}>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={styles.metricValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  summaryCard: stackedCard,
  summaryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  summaryTitle: titleSm,
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  statTile: { flex: 1 },
  divider: { width: 1, height: 32, backgroundColor: colors.border },
  totalValue: { fontSize: typography.fontSizes.xs, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center', lineHeight: typography.lineHeights.xs },
  animalList: { gap: spacing.md },
  animalCard: cardPad,
  animalHeader: { ...spaceBetweenTop, marginBottom: spacing.sm },
  animalTitleArea: { flex: 1 },
  animalTag: titleBase,
  animalMeta: subtitleMeta,
  animalMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  metricItem: { alignItems: 'center', flex: 1 },
  metricLabel: mutedCaption,
  metricValue: { fontSize: typography.fontSizes.sm, lineHeight: typography.lineHeights.sm, fontWeight: typography.fontWeights.bold, color: colors.text, marginTop: 2 },
});
