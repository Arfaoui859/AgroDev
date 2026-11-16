import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getCultivations, getFarms } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Farm, Cultivation } from '../../types';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { rtlStyles } from '../../theme/rtl';
import { Card } from '../ui/Card';
import { SectionHeader } from '../ui/SectionHeader';

interface HomeFarmOverviewProps {
  onOpenFarms: () => void;
  onOpenProjects: () => void;
}

type OverviewState = {
  farms: Farm[];
  cultivations: Cultivation[];
  error: boolean;
};

export const HomeFarmOverview: React.FC<HomeFarmOverviewProps> = ({ onOpenFarms, onOpenProjects }) => {
  const { isAuthenticated } = useAuth();
  const { language, isRtl } = useLanguage();
  const [data, setData] = useState<OverviewState>({ farms: [], cultivations: [], error: false });
  const [loading, setLoading] = useState(true);

  const labels = language === 'ar'
    ? { title: 'نظرة على نشاطك', subtitle: 'ملخّص المزارع والمحاصيل المسجّلة', farms: 'مزارع', area: 'المساحة', crops: 'زراعات', harvest: 'أقرب جني', noHarvest: 'غير محدّد', openFarms: 'إدارة المزارع', openProjects: 'خطط الإنتاج', emptyTitle: 'ابدأ بإضافة مزرعتك', emptyBody: 'سجّل مزرعتك ومحاصيلك لتظهر هنا مؤشرات نشاطك الحقيقية.', retry: 'تعذّر تحميل بيانات المزرعة' }
    : language === 'fr'
      ? { title: 'Votre activité agricole', subtitle: 'Aperçu des exploitations et cultures enregistrées', farms: 'Fermes', area: 'Surface', crops: 'Cultures', harvest: 'Prochaine récolte', noHarvest: 'Non définie', openFarms: 'Gérer les fermes', openProjects: 'Plans de culture', emptyTitle: 'Ajoutez votre première ferme', emptyBody: 'Enregistrez vos fermes et cultures pour afficher vos indicateurs réels.', retry: 'Impossible de charger les données agricoles' }
      : { title: 'Your agricultural activity', subtitle: 'Overview of your registered farms and crops', farms: 'Farms', area: 'Area', crops: 'Cultivations', harvest: 'Next harvest', noHarvest: 'Not scheduled', openFarms: 'Manage farms', openProjects: 'Production plans', emptyTitle: 'Add your first farm', emptyBody: 'Register farms and crops to see your real activity metrics here.', retry: 'Could not load farm data' };

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setData({ farms: [], cultivations: [], error: false });
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [farmsResult, cropsResult] = await Promise.all([getFarms(), getCultivations()]);
      setData({
        farms: farmsResult.data,
        cultivations: cropsResult.data,
        error: Boolean(farmsResult.error || cropsResult.error),
      });
    } catch {
      setData((current) => ({ ...current, error: true }));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { void load(); }, [load]);

  if (!isAuthenticated) return null;

  const totalArea = data.farms.reduce((sum, farm) => sum + (Number.isFinite(Number(farm.size_hectares)) ? Number(farm.size_hectares) : 0), 0);
  const nextHarvest = data.cultivations
    .filter((item) => item.expected_harvest_date && new Date(item.expected_harvest_date).getTime() >= new Date(new Date().toDateString()).getTime())
    .sort((a, b) => new Date(a.expected_harvest_date as string).getTime() - new Date(b.expected_harvest_date as string).getTime())[0];
  const formatArea = new Intl.NumberFormat(language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-TN' : 'en', { maximumFractionDigits: 2 }).format(totalArea);
  const harvestDate = nextHarvest?.expected_harvest_date
    ? new Intl.DateTimeFormat(language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-TN' : 'en', { day: 'numeric', month: 'short' }).format(new Date(nextHarvest.expected_harvest_date))
    : labels.noHarvest;

  return (
    <View style={styles.section}>
      <SectionHeader title={labels.title} subtitle={labels.subtitle} />
      {loading ? (
        <View style={styles.loading}><ActivityIndicator color={colors.primary} /></View>
      ) : data.error && data.farms.length === 0 && data.cultivations.length === 0 ? (
        <Card variant="outlined" style={styles.empty}>
          <MaterialCommunityIcons name="cloud-alert-outline" size={24} color={colors.textMuted} />
          <Text style={[styles.emptyText, isRtl && rtlStyles.rtlText]}>{labels.retry}</Text>
          <TouchableOpacity onPress={() => void load()} accessibilityRole="button"><Text style={styles.link}>{language === 'ar' ? 'إعادة المحاولة' : language === 'fr' ? 'Réessayer' : 'Try again'}</Text></TouchableOpacity>
        </Card>
      ) : data.farms.length === 0 && data.cultivations.length === 0 ? (
        <Card variant="outlined" style={styles.empty}>
          <View style={styles.emptyIcon}><MaterialCommunityIcons name="sprout-outline" size={25} color={colors.primary} /></View>
          <Text style={[styles.emptyTitle, isRtl && rtlStyles.rtlText]}>{labels.emptyTitle}</Text>
          <Text style={[styles.emptyText, isRtl && rtlStyles.rtlText]}>{labels.emptyBody}</Text>
          <TouchableOpacity onPress={onOpenFarms} style={styles.primaryButton} accessibilityRole="button">
            <Text style={styles.buttonText}>{labels.openFarms}</Text>
            <MaterialCommunityIcons name={isRtl ? 'arrow-left' : 'arrow-right'} size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </Card>
      ) : (
        <>
          <View style={[styles.metrics, isRtl && rtlStyles.rtlRow]}>
            <Metric icon="map-marker-radius-outline" label={labels.farms} value={String(data.farms.length)} />
            <Metric icon="ruler-square" label={labels.area} value={formatArea} suffix="ha" />
            <Metric icon="sprout-outline" label={labels.crops} value={String(data.cultivations.length)} />
          </View>
          <Card variant="elevated" style={styles.harvestCard}>
            <View style={styles.harvestIcon}><MaterialCommunityIcons name="calendar-check-outline" size={21} color={colors.primary} /></View>
            <View style={styles.harvestText}>
              <Text style={[styles.harvestLabel, isRtl && rtlStyles.rtlText]}>{labels.harvest}</Text>
              <Text style={[styles.harvestCrop, isRtl && rtlStyles.rtlText]} numberOfLines={1}>{nextHarvest ? nextHarvest.crop_name : labels.noHarvest}</Text>
            </View>
            <Text style={styles.harvestDate}>{harvestDate}</Text>
          </Card>
          <View style={[styles.actions, isRtl && rtlStyles.rtlRow]}>
            <TouchableOpacity onPress={onOpenFarms} style={styles.secondaryButton} accessibilityRole="button">
              <MaterialCommunityIcons name="map-marker-radius-outline" size={17} color={colors.primary} />
              <Text style={styles.secondaryText}>{labels.openFarms}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onOpenProjects} style={styles.secondaryButton} accessibilityRole="button">
              <MaterialCommunityIcons name="clipboard-text-outline" size={17} color={colors.primary} />
              <Text style={styles.secondaryText}>{labels.openProjects}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const Metric: React.FC<{ icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; value: string; suffix?: string }> = ({ icon, label, value, suffix }) => (
  <Card variant="outlined" style={styles.metric}>
    <MaterialCommunityIcons name={icon} size={19} color={colors.primary} />
    <Text style={styles.metricValue}>{value}{suffix ? <Text style={styles.metricSuffix}> {suffix}</Text> : null}</Text>
    <Text style={styles.metricLabel} numberOfLines={1}>{label}</Text>
  </Card>
);

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  loading: { paddingVertical: spacing.xl, alignItems: 'center' },
  metrics: { flexDirection: 'row', gap: spacing.sm },
  metric: { flex: 1, minWidth: 0, padding: spacing.md, gap: spacing.xs },
  metricValue: { color: colors.text, fontSize: typography.fontSizes.xl, lineHeight: 28, fontWeight: typography.fontWeights.bold },
  metricSuffix: { color: colors.textMuted, fontSize: typography.fontSizes.xs, fontWeight: typography.fontWeights.medium },
  metricLabel: { color: colors.textSecondary, fontSize: typography.fontSizes.xs, fontWeight: typography.fontWeights.medium },
  harvestCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  harvestIcon: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  harvestText: { flex: 1, gap: 2 },
  harvestLabel: { color: colors.textMuted, fontSize: typography.fontSizes.xs },
  harvestCrop: { color: colors.text, fontSize: typography.fontSizes.sm, fontWeight: typography.fontWeights.bold },
  harvestDate: { color: colors.primaryDark, fontSize: typography.fontSizes.sm, fontWeight: typography.fontWeights.bold },
  actions: { flexDirection: 'row', gap: spacing.sm },
  secondaryButton: { flex: 1, minHeight: 44, borderRadius: radius.md, borderWidth: 1, borderColor: colors.primaryLight, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingHorizontal: spacing.sm },
  secondaryText: { color: colors.primaryDark, fontSize: typography.fontSizes.xs, fontWeight: typography.fontWeights.bold },
  empty: { padding: spacing.lg, alignItems: 'center', gap: spacing.sm },
  emptyIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: colors.text, fontSize: typography.fontSizes.base, fontWeight: typography.fontWeights.bold },
  emptyText: { color: colors.textSecondary, fontSize: typography.fontSizes.sm, lineHeight: 21, textAlign: 'center' },
  primaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, minHeight: 44, borderRadius: radius.full, paddingHorizontal: spacing.lg, backgroundColor: colors.primary, marginTop: spacing.xs },
  buttonText: { color: '#FFFFFF', fontSize: typography.fontSizes.sm, fontWeight: typography.fontWeights.bold },
  link: { color: colors.primary, fontSize: typography.fontSizes.sm, fontWeight: typography.fontWeights.bold },
});
