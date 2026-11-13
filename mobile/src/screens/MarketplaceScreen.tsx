import React, { useState, useEffect } from 'react';
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
import { colors, radius, spacing, typography, shadows } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { getMarketPrices } from '../api/client';
import { MarketPriceItem } from '../types';

export const MarketplaceScreen: React.FC = () => {
  const { t, isRtl } = useLanguage();
  const [prices, setPrices] = useState<MarketPriceItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGovernorate, setSelectedGovernorate] = useState<string>('all');

  const governorates = [
    { id: 'all', label: 'كافة الأسواق' },
    { id: 'tunis', label: 'تونس (بئر القصعة)' },
    { id: 'sfax', label: 'صفاقس' },
    { id: 'sahel', label: 'سوسة والساحل' },
    { id: 'beja', label: 'باجة والشمال' },
    { id: 'south', label: 'قبلي وتوزر' },
  ];

  const loadPrices = async () => {
    try {
      const data = await getMarketPrices();
      setPrices(data);
    } catch (e) {
      console.warn('Error loading market prices:', e);
    }
  };

  useEffect(() => {
    loadPrices();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPrices();
    setRefreshing(false);
  };

  const filteredPrices = prices.filter((item) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      item.cropNameAr.includes(searchQuery) ||
      item.cropName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
    >
      {/* Title & Subtitle */}
      <View style={styles.headerBox}>
        <Text style={[styles.mainTitle, isRtl && styles.rtlText]}>{t.marketTitle}</Text>
        <Text style={[styles.mainSub, isRtl && styles.rtlText]}>{t.marketSubtitle}</Text>
      </View>

      {/* Search Input Bar */}
      <View style={[styles.searchBar, isRtl && styles.rtlRow]}>
        <MaterialCommunityIcons name="magnify" size={22} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, isRtl && styles.rtlText]}
          placeholder={t.searchCrop}
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialCommunityIcons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Market Commodity Cards */}
      <View style={styles.priceList}>
        {filteredPrices.map((item) => {
          const isRising = item.trend === 'rising';
          const isFalling = item.trend === 'falling';

          return (
            <Card key={item.id} variant="elevated" style={styles.priceCard}>
              <View style={[styles.cardHeader, isRtl && styles.rtlRow]}>
                <View style={styles.cropInfo}>
                  <Text style={[styles.cropName, isRtl && styles.rtlText]}>{item.cropNameAr}</Text>
                  <Text style={[styles.marketLocation, isRtl && styles.rtlText]}>
                    <MaterialCommunityIcons name="map-marker" size={14} color={colors.textMuted} />{' '}
                    {item.marketLocationAr}
                  </Text>
                </View>

                {/* Price Display */}
                <View style={styles.priceDisplay}>
                  <Text style={styles.priceValue}>{item.pricePerKg.toFixed(2)}</Text>
                  <Text style={styles.currencyLabel}>{t.currencyPerKg}</Text>
                </View>
              </View>

              {/* Bottom Details Row */}
              <View style={[styles.cardBottomRow, isRtl && styles.rtlRow]}>
                <Badge label={item.qualityGrade} variant="secondary" size="sm" />

                {/* Trend Badge */}
                <View
                  style={[
                    styles.trendBadge,
                    {
                      backgroundColor: isRising
                        ? colors.successLight
                        : isFalling
                          ? colors.dangerLight
                          : colors.surfaceSubtle,
                    },
                    isRtl && styles.rtlRow,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={isRising ? 'trending-up' : isFalling ? 'trending-down' : 'trending-neutral'}
                    size={16}
                    color={isRising ? colors.success : isFalling ? colors.danger : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.trendText,
                      { color: isRising ? colors.success : isFalling ? colors.danger : colors.textSecondary },
                    ]}
                  >
                    {isRising ? t.rising : isFalling ? t.falling : t.stable}{' '}
                    {item.changePercent !== 0 ? `(${item.changePercent > 0 ? '+' : ''}${item.changePercent.toFixed(1)}%)` : ''}
                  </Text>
                </View>
              </View>
            </Card>
          );
        })}
      </View>

      {/* Advice Card for Farmers */}
      <Card variant="outlined" style={styles.tipCard}>
        <View style={[styles.tipRow, isRtl && styles.rtlRow]}>
          <MaterialCommunityIcons name="information" size={24} color={colors.secondary} />
          <View style={styles.tipTextContent}>
            <Text style={[styles.tipTitle, isRtl && styles.rtlText]}>نصيحة تسويقية للفلاحين</Text>
            <Text style={[styles.tipBody, isRtl && styles.rtlText]}>
              الأسعار الواردة أعلاه تعكس متوسط أسعار الجملة اليومية في الأسواق التونسية. يمكنك التواصل المباشر مع التجار المعتمدين لتنظيم عمليات الشحن والنقل عبر خدمة "الخدمات اللوجستية الذكية".
            </Text>
          </View>
        </View>
      </Card>
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
  mainTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  mainSub: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    marginTop: 3,
  },
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
  searchInput: {
    flex: 1,
    fontSize: typography.fontSizes.sm,
    color: colors.text,
    height: '100%',
  },
  priceList: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  priceCard: {
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cropInfo: {
    flex: 1,
  },
  cropName: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  marketLocation: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  priceDisplay: {
    alignItems: 'flex-end',
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.md,
  },
  priceValue: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.primaryDark,
  },
  currencyLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
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
  trendText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
  },
  tipCard: {
    backgroundColor: colors.secondaryLight,
    borderColor: colors.secondary,
    padding: spacing.md,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  tipTextContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.secondaryDark,
  },
  tipBody: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 18,
  },
});
