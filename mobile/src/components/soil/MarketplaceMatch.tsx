import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { rtlStyles } from '../../theme/rtl';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme/colors';
import { subtitleMeta, subtitleMetaSm, titleBaseFlex, titleSmSemibold } from '../../theme/typographyStyles';
import { flex1, gapXs, stackedCard } from '../../theme/layout';
import { useLanguage } from '../../context/LanguageContext';
import { Card } from '../ui/Card';
import { StateView } from '../ui/StateView';
import { ProvenanceBar } from '../ui/ProvenanceBar';
import { getMarketplaceListings } from '../../api/client';
import { getSoil } from '../../i18n/soil';
import { MarketplaceListing, ProvenanceMeta } from '../../types';

interface MarketplaceMatchProps {
  /** Free-text query, e.g. the chosen crop name. */
  query: string;
}

/**
 * "Matching products" for a crop. Reads real seller listings from
 * `GET /api/marketplace/listings`; until the store is connected the gateway
 * fails closed with 503 and we render an honest empty state — no product or
 * price is ever invented.
 */
export const MarketplaceMatch: React.FC<MarketplaceMatchProps> = ({ query }) => {
  const { language, isRtl } = useLanguage();
  const s9 = useMemo(() => getSoil(language), [language]);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [meta, setMeta] = useState<ProvenanceMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const res = await getMarketplaceListings({ q: query });
      if (!active) return;
      setListings(res.data.listings);
      setMeta(res.data.meta);
      setUnavailable(res.unavailable);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [query]);

  return (
    <Card variant="elevated" style={styles.card}>
      <View style={[styles.head, isRtl && rtlStyles.rtlRow]}>
        <MaterialCommunityIcons name="storefront-outline" size={18} color={colors.primaryDark} />
        <Text style={[styles.title, isRtl && rtlStyles.rtlText]}>{s9.marketMatchTitle}</Text>
      </View>
      <Text style={[styles.sub, isRtl && rtlStyles.rtlText]}>{s9.marketMatchSubtitle}</Text>

      {loading ? (
        <StateView kind="loading" compact />
      ) : unavailable ? (
        <StateView kind="unavailable" message={s9.marketMatchUnavailable} compact />
      ) : listings.length === 0 ? (
        <StateView kind="empty" message={s9.marketMatchEmpty} compact />
      ) : (
        <View style={styles.list}>
          {listings.map((item) => (
            <View key={item.id} style={[styles.row, isRtl && rtlStyles.rtlRow]}>
              <View style={styles.rowText}>
                <Text style={[styles.itemTitle, isRtl && rtlStyles.rtlText]}>{item.title}</Text>
                <Text style={[styles.itemMeta, isRtl && rtlStyles.rtlText]}>
                  {[
                    item.price != null ? `${s9.marketPriceLabel}: ${item.price} ${item.currency ?? ''}` : null,
                    item.sellerName ? `${s9.marketSellerLabel}: ${item.sellerName}` : null,
                    item.location ? `${s9.marketLocationLabel}: ${item.location}` : null,
                  ]
                    .filter(Boolean)
                    .join(' • ')}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {meta ? <ProvenanceBar meta={meta} style={{ marginTop: spacing.sm }} /> : null}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: stackedCard,
  head: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: titleBaseFlex,
  sub: subtitleMetaSm,
  list: gapXs,
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  rowText: flex1,
  itemTitle: titleSmSemibold,
  itemMeta: subtitleMeta,
});
