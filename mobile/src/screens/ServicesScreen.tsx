import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography, shadows } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { StateView } from '../components/ui/StateView';

interface ServicesScreenProps {
  onSelectService: (serviceId: string) => void;
}

export const ServicesScreen: React.FC<ServicesScreenProps> = ({ onSelectService }) => {
  const { t, x, isRtl } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: t.viewAll, icon: 'apps' },
    { id: 'soil', label: t.catSoilAndCrops, icon: 'sprout' },
    { id: 'health', label: t.catHealthAndProtection, icon: 'shield-bug' },
    { id: 'water', label: t.catWaterAndClimate, icon: 'water-pump' },
    { id: 'finance', label: t.catOperationsAndFinance, icon: 'calculator' },
    { id: 'community', label: t.catCommunityAndAdvice, icon: 'account-group' },
  ];

  const services = [
    // 1. Soil & Crops
    {
      id: 'soil',
      title: t.soilAnalysisName,
      desc: t.soilAnalysisDesc,
      icon: 'flask-round-bottom',
      color: colors.soil,
      bgColor: colors.soilLight,
      category: 'soil',
      badge: x.svcBadgeSoil,
      badgeVariant: 'accent' as const,
    },
    {
      id: 'crops',
      title: t.cropRecommendName,
      desc: t.cropRecommendDesc,
      icon: 'sprout',
      color: colors.crop,
      bgColor: colors.cropLight,
      category: 'soil',
      badge: x.svcBadgeCrops,
      badgeVariant: 'success' as const,
    },
    // 2. Health & Plant Protection
    {
      id: 'disease',
      title: t.diseaseDiagnosisName,
      desc: t.diseaseDiagnosisDesc,
      icon: 'camera-iris',
      color: colors.danger,
      bgColor: colors.dangerLight,
      category: 'health',
      badge: x.svcBadgeDisease,
      badgeVariant: 'danger' as const,
    },
    {
      id: 'pest',
      title: t.pestControlName,
      desc: t.pestControlDesc,
      icon: 'bug',
      color: colors.danger,
      bgColor: colors.dangerLight,
      category: 'health',
      badge: x.svcBadgePest,
      badgeVariant: 'warning' as const,
    },
    // 3. Water & Climate
    {
      id: 'irrigation',
      title: t.smartIrrigationName,
      desc: t.smartIrrigationDesc,
      icon: 'water-pump',
      color: colors.water,
      bgColor: colors.waterLight,
      category: 'water',
      badge: x.svcBadgeIrrigation,
      badgeVariant: 'secondary' as const,
    },
    {
      id: 'weather',
      title: t.weatherIntelligenceName,
      desc: t.weatherIntelligenceDesc,
      icon: 'weather-partly-cloudy',
      color: colors.secondary,
      bgColor: colors.secondaryLight,
      category: 'water',
      badge: x.svcBadgeWeather,
      badgeVariant: 'info' as const,
    },
    // 4. Operations & Finance
    {
      id: 'farms',
      title: t.farmManagementName,
      desc: t.farmManagementDesc,
      icon: 'map-marker-radius',
      color: colors.primary,
      bgColor: colors.primaryLight,
      category: 'finance',
      badge: x.svcBadgeFarms,
      badgeVariant: 'primary' as const,
    },
    {
      id: 'livestock',
      title: t.livestockName,
      desc: t.livestockDesc,
      icon: 'cow',
      color: colors.accent,
      bgColor: colors.accentLight,
      category: 'finance',
      badge: x.svcBadgeLivestock,
      badgeVariant: 'accent' as const,
    },
    // 5. Community & Advisory
    {
      id: 'community',
      title: t.communityForumName,
      desc: t.communityForumDesc,
      icon: 'forum',
      color: colors.primary,
      bgColor: colors.primaryLight,
      category: 'community',
      badge: x.svcBadgeCommunity,
      badgeVariant: 'primary' as const,
    },
    {
      id: 'expert',
      title: t.expertConsultationName,
      desc: t.expertConsultationDesc,
      icon: 'stethoscope',
      color: colors.secondaryDark,
      bgColor: colors.secondaryLight,
      category: 'community',
      badge: x.svcBadgeExpert,
      badgeVariant: 'secondary' as const,
    },
    // 6. Advanced AI Architecture & History
    {
      id: 'multi_agent',
      title: t.multiAgentAiName,
      desc: t.multiAgentAiDesc,
      icon: 'robot-happy',
      color: colors.primary,
      bgColor: colors.primaryLight,
      category: 'community',
      badge: x.svcBadgeMultiAgent,
      badgeVariant: 'accent' as const,
    },
    {
      id: 'agri_news',
      title: t.agriNewsName,
      desc: t.agriNewsDesc,
      icon: 'newspaper-variant-outline',
      color: colors.secondary,
      bgColor: colors.secondaryLight,
      category: 'community',
      badge: x.svcBadgeNews,
      badgeVariant: 'info' as const,
    },
    {
      id: 'learning',
      title: t.homeLearningTitle,
      desc: t.homeLearningSubtitle,
      icon: 'play-box-multiple-outline',
      color: colors.danger,
      bgColor: colors.dangerLight,
      category: 'community',
      badge: x.svcBadgeLearning,
      badgeVariant: 'danger' as const,
    },
    {
      id: 'recent_analyses',
      title: x.recentAnalysesTitle,
      desc: x.recentAnalysesDesc,
      icon: 'history',
      color: colors.secondary,
      bgColor: colors.secondaryLight,
      category: 'health',
      badge: x.svcBadgeHistory,
      badgeVariant: 'info' as const,
    },
  ];

  const filteredServices = services.filter((svc) => {
    const matchesCategory = activeCategory === 'all' || svc.category === activeCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      svc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      svc.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Title & Subtitle */}
      <View style={styles.headerBox}>
        <Text style={[styles.mainTitle, isRtl && styles.rtlText]}>{t.servicesTitle}</Text>
        <Text style={[styles.mainSub, isRtl && styles.rtlText]}>{t.servicesSubtitle}</Text>
      </View>

      {/* Search Input Bar */}
      <View style={[styles.searchBar, isRtl && styles.rtlRow]}>
        <MaterialCommunityIcons name="magnify" size={22} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, isRtl && styles.rtlText]}
          placeholder={t.searchServices}
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          accessibilityLabel={t.searchServices}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            accessibilityRole="button"
            accessibilityLabel={x.clearSearch}
            style={styles.iconButton}
          >
            <MaterialCommunityIcons name="close-circle" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Horizontal Category Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.categoryScroll, isRtl && styles.rtlRow]}
      >
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              activeOpacity={0.8}
              onPress={() => setActiveCategory(cat.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={cat.label}
              style={[styles.catPill, isRtl && styles.rtlRow, isActive && styles.catPillActive]}
            >
              <MaterialCommunityIcons
                name={cat.icon as any}
                size={16}
                color={isActive ? colors.textInverse : colors.textSecondary}
              />
              <Text style={[styles.catPillText, isActive && styles.catPillTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Service Cards Grid */}
      <View style={styles.serviceList}>
        {filteredServices.length === 0 ? (
          <Card variant="outlined">
            <StateView kind="empty" title={x.stateEmpty} message={x.servicesNoMatch} compact />
          </Card>
        ) : (
          filteredServices.map((svc) => (
            <TouchableOpacity
              key={svc.id}
              activeOpacity={0.85}
              onPress={() => onSelectService(svc.id)}
              accessibilityRole="button"
              accessibilityLabel={`${svc.title}. ${svc.desc}`}
              style={styles.serviceCard}
            >
            <View style={[styles.cardTopRow, isRtl && styles.rtlRow]}>
              <View style={[styles.serviceIconContainer, { backgroundColor: svc.bgColor }]}>
                <MaterialCommunityIcons name={svc.icon as any} size={28} color={svc.color} />
              </View>
              <Badge label={svc.badge} variant={svc.badgeVariant} size="sm" />
            </View>

            <Text style={[styles.serviceTitle, isRtl && styles.rtlText]}>{svc.title}</Text>
            <Text style={[styles.serviceDesc, isRtl && styles.rtlText]}>{svc.desc}</Text>

            <View style={[styles.cardFooter, isRtl && styles.rtlRow]}>
              <Text style={styles.launchText}>{x.servicesLaunch}</Text>
              <MaterialCommunityIcons
                name={isRtl ? 'arrow-left' : 'arrow-right'}
                size={18}
                color={colors.primary}
              />
            </View>
            </TouchableOpacity>
          ))
        )}
      </View>
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
  rtlText: { textAlign: 'right', writingDirection: 'rtl' },
  headerBox: {
    marginBottom: spacing.md,
  },
  mainTitle: {
    fontSize: typography.fontSizes.xl, lineHeight: 30,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  mainSub: {
    fontSize: typography.fontSizes.sm,
    lineHeight: 21,
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
    fontSize: typography.fontSizes.sm, lineHeight: 21,
    color: colors.text,
    height: '100%',
  },
  iconButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryScroll: {
    gap: spacing.xs,
    paddingBottom: spacing.md,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catPillText: {
    fontSize: typography.fontSizes.xs,
    lineHeight: 20,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  catPillTextActive: {
    color: colors.textInverse,
    fontWeight: typography.fontWeights.bold,
  },
  serviceList: {
    gap: spacing.md,
  },
  serviceCard: {
    minHeight: 48,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  serviceIconContainer: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceTitle: {
    fontSize: typography.fontSizes.base, lineHeight: 24,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    marginBottom: 4,
  },
  serviceDesc: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceSubtle,
    paddingTop: spacing.xs,
  },
  launchText: {
    fontSize: typography.fontSizes.xs,
    lineHeight: 20,
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
  },
});
