import React, { useCallback, useState } from 'react';
import { rtlStyles } from '../theme/rtl';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { badgePill, cardBottomRow, cardPad, flex1, screenStyles, spaceBetween, spaceBetweenSm, stackSm, stackTopMd } from '../theme/layout';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../theme/colors';
import { labelSemibold, mutedCaption, subtleCaption, titleBase, xsSemibold } from '../theme/typographyStyles';
import { useLanguage } from '../context/LanguageContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ScreenHeading } from '../components/ui/ScreenHeading';
import { SearchBar } from '../components/ui/SearchBar';
import { ProvenanceBar } from '../components/ui/ProvenanceBar';
import { StateCard } from '../components/ui/StateCard';
import { getMarketPrices, getMarketplaceListings } from '../api/client';
import { AICapability, MarketplaceListing, MarketPriceItem, ProvenanceMeta } from '../types';
import { useAICapabilities } from '../hooks/useAICapabilities';

/**
 * Market prices read from the platform's stored `market_prices` records.
 * These are platform records, not an independently verified market feed, so the
 * provenance badge says so and no trend is shown when the backend does not
 * provide one (changePercent is null).
 */
export const MarketplaceScreen: React.FC = () => {
  const { t, x, isRtl, language } = useLanguage();
  const { byId: capabilities } = useAICapabilities();
  const [prices, setPrices] = useState<MarketPriceItem[]>([]);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [listingsUnavailable, setListingsUnavailable] = useState(false);
  // Default to an honest "stored, not verified" label; the load replaces it with
  // the backend's own provenance. Never default to `isRealData: true`.
  const [meta, setMeta] = useState<ProvenanceMeta>({ provenance: 'database', isRealData: false });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  const loadPrices = useCallback(async () => {
    try {
      const [res, listingRes] = await Promise.all([getMarketPrices(), getMarketplaceListings()]);
      setPrices(res.data?.prices ?? []);
      if (res.data?.meta) setMeta(res.data.meta);
      setError(res.error);
      setFromCache(res.fromCache);
      setListings(listingRes.data.listings);
      setListingsUnavailable(listingRes.unavailable);
    } catch (cause) {
      // A rejected request must not leave the screen in a permanent spinner.
      // Keep the market data empty and distinguish the unavailable listings store.
      setError(cause instanceof Error ? cause.message : 'Marketplace request failed');
      setListings([]);
      setListingsUnavailable(true);
    }
  }, []);

  React.useEffect(() => {
    (async () => {
      try {
        await loadPrices();
      } finally {
        setLoading(false);
      }
    })();
  }, [loadPrices]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadPrices();
    } finally {
      setRefreshing(false);
    }
  };

  const filteredPrices = prices.filter((item) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return item.cropNameAr.toLowerCase().includes(q) || item.cropName.toLowerCase().includes(q);
  });

  return (
    <ScrollView
      style={screenStyles.container}
      contentContainerStyle={screenStyles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
    >
      <ScreenHeading title={t.marketTitle} subtitle={t.marketSubtitle} />

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder={t.searchCrop}
        clearLabel={x.clearSearch}
      />

      {loading ? (
        <StateCard kind="loading" title={x.stateLoading} compact />
      ) : error && prices.length === 0 ? (
        <StateCard
          kind="error"
          title={x.stateError}
          message={error}
          onRetry={loadPrices}
          retryLabel={x.retry}
        />
      ) : prices.length === 0 ? (
        <StateCard
          kind="empty"
          title={x.stateEmpty}
          message={x.marketNoPrices}
          onRetry={loadPrices}
          retryLabel={x.retry}
        />
      ) : (
        <>
          <ProvenanceBar meta={meta} detailed cached={fromCache} style={styles.provBar} />

          <View style={styles.priceList}>
            {filteredPrices.length === 0 ? (
              <StateCard kind="empty" title={x.stateEmpty} message={x.marketNoMatch} compact />
            ) : (
              filteredPrices.map((item) => (
              <Card key={item.id} variant="elevated" style={styles.priceCard}>
                <View style={[styles.cardHeader, isRtl && rtlStyles.rtlRow]}>
                  <View style={styles.cropInfo}>
                    <Text style={[styles.cropName, isRtl && rtlStyles.rtlText]}>
                      {language === 'ar' ? item.cropNameAr : item.cropName}
                    </Text>
                    {item.marketLocation && item.marketLocation !== '—' ? (
                      <View style={[styles.locationRow, isRtl && rtlStyles.rtlRow]}>
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

                <View style={[cardBottomRow, isRtl && rtlStyles.rtlRow]}>
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
                        isRtl && rtlStyles.rtlRow,
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

      <Card variant="outlined" style={styles.listingsCard}>
        <View style={[styles.listingsHeading, isRtl && rtlStyles.rtlRow]}>
          <MaterialCommunityIcons name="storefront-outline" size={21} color={colors.primary} />
          <Text style={[styles.listingsTitle, isRtl && rtlStyles.rtlText]}>{x.marketListingsTitle}</Text>
        </View>
        {listingsUnavailable ? (
          <StateCard kind="unavailable" title={x.marketListingsUnavailable} message={x.marketListingsBody} compact />
        ) : listings.length === 0 ? (
          <StateCard kind="empty" title={x.stateEmpty} message={x.marketNoMatch} compact />
        ) : (
          <View style={styles.listingRows}>
            {listings.map((listing) => (
              <View key={listing.id} style={[styles.listingRow, isRtl && rtlStyles.rtlRow]}>
                <View style={styles.listingText}>
                  <Text style={[styles.listingName, isRtl && rtlStyles.rtlText]}>{listing.title}</Text>
                  <Text style={[styles.listingMeta, isRtl && rtlStyles.rtlText]}>
                    {[listing.category, listing.sellerName, listing.location].filter(Boolean).join(' • ')}
                  </Text>
                </View>
                {listing.price != null ? (
                  <Text style={styles.listingPrice}>{listing.price.toFixed(2) + ' ' + (listing.currency || 'TND') + (listing.unit ? ' / ' + listing.unit : '')}</Text>
                ) : null}
              </View>
            ))}
          </View>
        )}
      </Card>

      {/* Market intelligence — honest availability of forecast & supply/demand */}
      <Card variant="outlined" style={styles.intelCard}>
        <View style={[styles.tipRow, isRtl && rtlStyles.rtlRow]}>
          <MaterialCommunityIcons name="chart-timeline-variant" size={22} color={colors.primary} />
          <View style={styles.tipTextContent}>
            <Text style={[styles.tipTitle, isRtl && rtlStyles.rtlText]}>{x.marketIntelTitle}</Text>
            <Text style={[styles.tipBody, isRtl && rtlStyles.rtlText]}>{x.marketIntelNote}</Text>
          </View>
        </View>
        <View style={{ marginTop: spacing.sm, gap: spacing.xs }}>
          <MarketIntelRow label={x.marketIntelForecast} capability={capabilities['market-forecast']} x={x} isRtl={isRtl} />
          <MarketIntelRow label={x.marketIntelSupplyDemand} capability={capabilities['supply-demand']} x={x} isRtl={isRtl} />
        </View>
      </Card>

      <Card variant="outlined" style={styles.tipCard}>
        <View style={[styles.tipRow, isRtl && rtlStyles.rtlRow]}>
          <MaterialCommunityIcons name="information" size={22} color={colors.secondary} />
          <View style={styles.tipTextContent}>
            <Text style={[styles.tipTitle, isRtl && rtlStyles.rtlText]}>{x.marketAboutTitle}</Text>
            <Text style={[styles.tipBody, isRtl && rtlStyles.rtlText]}>{x.marketAboutBody}</Text>
          </View>
        </View>
      </Card>
    </ScrollView>
  );
};

const MarketIntelRow: React.FC<{
  label: string;
  capability?: AICapability;
  x: ReturnType<typeof useLanguage>['x'];
  isRtl: boolean;
}> = ({ label, capability, x, isRtl }) => {
  const available = Boolean(capability) && capability!.engine !== 'unavailable' && capability!.available !== false;
  return (
    <View style={[styles.intelRow, isRtl && rtlStyles.rtlRow]}>
      <View style={[styles.intelLeft, isRtl && rtlStyles.rtlRow]}>
        <MaterialCommunityIcons
          name={available ? 'check-circle' : 'minus-circle-outline'}
          size={16}
          color={available ? colors.success : colors.textMuted}
        />
        <Text style={[styles.intelLabel, isRtl && rtlStyles.rtlText]}>{label}</Text>
      </View>
      <Text style={[styles.intelState, { color: available ? colors.success : colors.textMuted }]}>
        {available ? x.aiAvailable : x.aiNotConfigured}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  intelCard: stackTopMd,
  intelRow: { ...spaceBetween, gap: spacing.sm },
  intelLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  intelLabel: labelSemibold,
  intelState: xsSemibold,
  provBar: stackSm,
  listingsCard: { marginBottom: spacing.lg, padding: spacing.md },
  listingsHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  listingsTitle: { ...titleBase, color: colors.text },
  listingRows: { gap: spacing.sm },
  listingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.border },
  listingText: { flex: 1, gap: 2 },
  listingName: { ...labelSemibold, color: colors.text },
  listingMeta: subtleCaption,
  listingPrice: { ...labelSemibold, color: colors.primaryDark, textAlign: 'right' },
  priceList: { gap: spacing.sm, marginBottom: spacing.lg },
  priceCard: cardPad,
  cardHeader: spaceBetweenSm,
  cropInfo: flex1,
  cropName: titleBase,
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  marketLocation: subtleCaption,
  priceDisplay: {
    alignItems: 'flex-end',
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.md,
  },
  priceValue: { fontSize: typography.fontSizes.lg, lineHeight: typography.lineHeights.lg, fontWeight: typography.fontWeights.bold, color: colors.primaryDark },
  currencyLabel: { fontSize: typography.fontSizes.xs, color: colors.textSecondary, fontWeight: typography.fontWeights.medium, lineHeight: typography.lineHeights.xs },
  trendBadge: badgePill,
  trendText: labelSemibold,
  noTrend: mutedCaption,
  tipCard: { backgroundColor: colors.secondaryLight, borderColor: colors.secondary, padding: spacing.md },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  tipTextContent: flex1,
  tipTitle: { fontSize: typography.fontSizes.sm, lineHeight: typography.lineHeights.sm, fontWeight: typography.fontWeights.bold, color: colors.secondaryDark },
  tipBody: { fontSize: typography.fontSizes.xs, color: colors.textSecondary, marginTop: 3, lineHeight: typography.lineHeights.sm },
});
