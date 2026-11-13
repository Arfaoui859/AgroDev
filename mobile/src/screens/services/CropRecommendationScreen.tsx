import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography, shadows } from '../../theme/colors';
import { useLanguage } from '../../context/LanguageContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { getCropRecommendations } from '../../api/client';
import { CropRecommendationResult } from '../../types';

interface CropRecommendationScreenProps {
  onBack: () => void;
}

export const CropRecommendationScreen: React.FC<CropRecommendationScreenProps> = ({ onBack }) => {
  const { t, isRtl } = useLanguage();
  const [data, setData] = useState<CropRecommendationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState('all');

  const loadCrops = async () => {
    setLoading(true);
    try {
      const res = await getCropRecommendations();
      setData(res);
    } catch (e) {
      console.warn('Crop rec error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCrops();
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Info */}
      <View style={styles.headerBox}>
        <View style={[styles.titleRow, isRtl && styles.rtlRow]}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="sprout" size={26} color={colors.crop} />
          </View>
          <View style={styles.titleTextContainer}>
            <Text style={[styles.mainTitle, isRtl && styles.rtlText]}>
              {t.cropRecommendName}
            </Text>
            <Text style={[styles.mainSub, isRtl && styles.rtlText]}>
              {t.cropRecommendDesc}
            </Text>
          </View>
        </View>
      </View>

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>جاري مطابقة المحاصيل مع مناخ منطقتك...</Text>
        </View>
      )}

      {/* Recommended Crops Cards */}
      {data && (
        <View style={styles.cropsList}>
          {data.crops.map((crop) => (
            <Card key={crop.id} variant="elevated" style={styles.cropCard}>
              <View style={[styles.cropHeader, isRtl && styles.rtlRow]}>
                <View style={styles.cropTitleBox}>
                  <Text style={[styles.cropNameAr, isRtl && styles.rtlText]}>{crop.nameAr}</Text>
                  <Text style={[styles.cropCategory, isRtl && styles.rtlText]}>
                    {crop.category} • {crop.season}
                  </Text>
                </View>
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreText}>{crop.suitabilityScore}%</Text>
                  <Text style={styles.scoreSub}>ملاءمة</Text>
                </View>
              </View>

              {/* Metrics Grid */}
              <View style={[styles.metricsRow, isRtl && styles.rtlRow]}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>العائد التقديري للهكتار</Text>
                  <Text style={styles.profitValue}>{crop.estimatedProfitTndPerHa} د.ت</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>الاحتياج المائي</Text>
                  <Badge
                    label={crop.waterRequirement}
                    variant={crop.waterRequirement === 'منخفض' ? 'success' : crop.waterRequirement === 'متوسط' ? 'info' : 'warning'}
                    size="sm"
                  />
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>دورة النمو</Text>
                  <Text style={styles.metricValue}>{crop.growthCycleDays} يوم</Text>
                </View>
              </View>

              {/* Expert Tips */}
              <View style={styles.tipsBox}>
                <MaterialCommunityIcons name="lightbulb-on" size={16} color={colors.accent} />
                <Text style={[styles.tipsText, isRtl && styles.rtlText]}>{crop.keyTipsAr}</Text>
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* Back Button */}
      <Button
        title={t.back}
        variant="outline"
        onPress={onBack}
        style={{ marginTop: spacing.lg, marginBottom: spacing.xl }}
      />
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.cropLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleTextContainer: {
    flex: 1,
  },
  mainTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  mainSub: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  loadingBox: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
  },
  cropsList: {
    gap: spacing.md,
  },
  cropCard: {
    padding: spacing.md,
  },
  cropHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  cropTitleBox: {
    flex: 1,
  },
  cropNameAr: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  cropCategory: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  scoreBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  scoreText: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.primaryDark,
  },
  scoreSub: {
    fontSize: 9,
    color: colors.primaryDark,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginVertical: spacing.sm,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  metricLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
  },
  profitValue: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
  },
  metricValue: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  tipsBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.accentLight,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginTop: 4,
  },
  tipsText: {
    flex: 1,
    fontSize: typography.fontSizes.xs,
    color: colors.accentDark,
    lineHeight: 18,
  },
});
