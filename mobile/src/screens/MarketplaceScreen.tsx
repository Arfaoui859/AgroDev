import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { StateView } from '../components/ui/StateView';
import { ProvenanceBadge } from '../components/ui/ProvenanceBadge';
import { getMarketPrices } from '../api/client';
import { MarketPriceItem, ProvenanceMeta } from '../types';

/**
 * Market prices read from the platform's stored `market_prices` records.
 * These are platform records, not an independently verified market feed, so the
 * provenance badge says so and no trend is shown when the backend does not
 * provide one (changePercent is null).
 */
export const MarketplaceScreen: React.FC = () => {
  const { t, x, isRtl, language } = useLanguage();
  const [prices, setPrices] = useState<MarketPriceItem[]>([]);
  // Default to an honest "stored, not verified" label; the load replaces it with
  // the backend's own provenance. Never default to `isRealData: true`.
  const [meta, setMeta] = useState<ProvenanceMeta>({ provenance: 'database', isRealData: false });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  const loadPrices = useCallback(async () => {
    const res = await getMarketPrices();
    setPrices(res.data?.prices ?? []);
    if (res.data?.meta) setMeta(res.data.meta);
    setError(res.error);
    setFromCache(res.fromCache);
  }, []);

  React.useEffect(() => {
    (async () => {
      await loadPrices();
      setLoading(false);
    })();
  }, [loadPrices]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPrices();
    setRefreshing(false);
  };

  const filteredPrices = prices.filter((item) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return item.cropNameAr.toLowerCase().includes(q) || item.cropName.toLowerCase().includes(q);
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
    >
      <View style={styles.headerBox}>
        <Text style={[styles.mainTitle, isRtl && styles.rtlText]}>{t.marketTitle}</Text>
        <Text style={[styles.mainSub, isRtl && styles.rtlText]}>{t.marketSubtitle}</Text>
      </View>

      <View style={[styles.searchBar, isRtl && styles.rtlRow]}>
        <MaterialCommunityIcons name="magnify" size={22} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, isRtl && styles.rtlText]}
          placeholder={t.searchCrop}
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 ? (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            accessibilityRole="button"
            accessibilityLabel={x.clearSearch}
            style={styles.iconButton}
          >
            <MaterialCommunityIcons name="close-circle" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <Card variant="outlined">
          <StateView kind="loading" title={x.stateLoading} compact />
        </Card>
      ) : error && prices.length === 0 ? (
        <Card variant="outlined">
          <StateView kind="error" title={x.stateError} message={error} onRetry={loadPrices} retryLabel={x.retry} />
        </Card>
      ) : prices.length === 0 ? (
        <Card variant="outlined">
          <StateView
            kind="empty"
            title={x.stateEmpty}
            message={x.marketNoPrices}
            onRetry={loadPrices}
            retryLabel={x.retry}
          />
        </Card>
      ) : (
        <>
          <View style={[styles.provBar, isRtl && styles.rtlRow]}>
            <ProvenanceBadge meta={meta} detailed />
            {fromCache ? <Text style={styles.cachedTag}>{x.cachedNotice}</Text> : null}
          </View>

          <View style={styles.priceList}>
            {filteredPrices.length === 0 ? (
              <Card variant="outlined">
                <StateView kind="empty" title={x.stateEmpty} message={x.marketNoMatch} compact />
              </Card>
            ) : (
              filteredPrices.map((item) => (
              <Card key={item.id} variant="elevated" style={styles.priceCard}>
                <View style={[styles.cardHeader, isRtl && styles.rtlRow]}>
                  <View style={styles.cropInfo}>
                    <Text style={[styles.cropName, isRtl && styles.rtlText]}>
                      {language === 'ar' ? item.cropNameAr : item.cropName}
                    </Text>
                    {item.marketLocation && item.marketLocation !== '—' ? (
                      <View style={[styles.locationRow, isRtl && styles.rtlRow]}>
                        <MaterialCommunityIcons name="map-marker" size={13} color={colors.textMuted} />
                        <Text style={styles.marketLocation}>{item.marketLocation}</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.priceDisplay}>
                    <Text style={styles.priceValue}>{item.pricePerKg.toFixed(2)}</Text>
                    <Text style={styles.currencyLabel}>{t.currencyPerKg}</Text>
                  </View>
                </View>

                <View style={[styles.cardBottomRow, isRtl && styles.rtlRow]}>
                  {item.qualityGrade && item.qualityGrade !== '—' ? (
                    <Badge label={item.qualityGrade} variant="secondary" size="sm" />
                  ) : (
                    <View />
                  )}

                  {item.changePercent !== null ? (
                    <View
                      style={[
                        styles.trendBadge,
                        {
                          backgroundColor:
                            item.changePercent > 0
                              ? colors.successLight
                              : item.changePercent < 0
                                ? colors.dangerLight
                                : colors.surfaceSubtle,
                        },
                        isRtl && styles.rtlRow,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={item.changePercent > 0 ? 'trending-up' : item.changePercent < 0 ? 'trending-down' : 'trending-neutral'}
                        size={16}
                        color={item.changePercent > 0 ? colors.success : item.changePercent < 0 ? colors.danger : colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.trendText,
                          {
                            color:
                              item.changePercent > 0 ? colors.success : item.changePercent < 0 ? colors.danger : colors.textSecondary,
                          },
                        ]}
                      >
                        {`${item.changePercent > 0 ? '+' : ''}${item.changePercent.toFixed(1)}%`}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.noTrend}>{item.lastUpdated ? item.lastUpdated : '—'}</Text>
                  )}
                </View>
              </Card>
              ))
            )}
          </View>
        </>
      )}

      <Card variant="outlined" style={styles.tipCard}>
        <View style={[styles.tipRow, isRtl && styles.rtlRow]}>
          <MaterialCommunityIcons name="information" size={22} color={colors.secondary} />
          <View style={styles.tipTextContent}>
            <Text style={[styles.tipTitle, isRtl && styles.rtlText]}>{x.marketAboutTitle}</Text>
            <Text style={[styles.tipBody, isRtl && styles.rtlText]}>{x.marketAboutBody}</Text>
          </View>
        </View>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing['3xl'] },
  rtlRow: { flexDirection: 'row-reverse' },
  rtlText: { textAlign: 'right', writingDirection: 'rtl' },
  headerBox: { marginBottom: spacing.md },
  mainTitle: { fontSize: typography.fontSizes.xl, lineHeight: 30, fontWeight: typography.fontWeights.bold, color: colors.text },
  mainSub: { fontSize: typography.fontSizes.sm, lineHeight: 21, color: colors.textSecondary, marginTop: 3 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 48,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInput: { flex: 1, fontSize: typography.fontSizes.sm, lineHeight: 21, color: colors.text, height: '100%' },
  iconButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  provBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm, flexWrap: 'wrap' },
  cachedTag: { fontSize: typography.fontSizes.xs, color: colors.textMuted, fontStyle: 'italic', lineHeight: 20 },
  priceList: { gap: spacing.sm, marginBottom: spacing.lg },
  priceCard: { padding: spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  cropInfo: { flex: 1 },
  cropName: { fontSize: typography.fontSizes.base, lineHeight: 24, fontWeight: typography.fontWeights.bold, color: colors.text },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  marketLocation: { fontSize: typography.fontSizes.xs, color: colors.textSecondary, lineHeight: 20 },
  priceDisplay: {
    alignItems: 'flex-end',
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.md,
  },
  priceValue: { fontSize: typography.fontSizes.lg, lineHeight: 27, fontWeight: typography.fontWeights.bold, color: colors.primaryDark },
  currencyLabel: { fontSize: typography.fontSizes.xs, color: colors.textSecondary, fontWeight: typography.fontWeights.medium, lineHeight: 20 },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.surfaceSubtle,
    paddingTop: spacing.xs,
    marginTop: 4,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  trendText: { fontSize: typography.fontSizes.xs, fontWeight: typography.fontWeights.semibold, lineHeight: 20 },
  noTrend: { fontSize: typography.fontSizes.xs, color: colors.textMuted, lineHeight: 20 },
  tipCard: { backgroundColor: colors.secondaryLight, borderColor: colors.secondary, padding: spacing.md },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  tipTextContent: { flex: 1 },
  tipTitle: { fontSize: typography.fontSizes.sm, lineHeight: 21, fontWeight: typography.fontWeights.bold, color: colors.secondaryDark },
  tipBody: { fontSize: typography.fontSizes.xs, color: colors.textSecondary, marginTop: 3, lineHeight: 21 },
});
