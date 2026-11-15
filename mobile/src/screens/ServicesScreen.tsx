import React, { useState } from 'react';
import { rtlStyles } from '../theme/rtl';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { gapMd, screenStyles } from '../theme/layout';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography, shadows } from '../theme/colors';
import { IconTile } from '../components/ui/IconTile';
import { useLanguage } from '../context/LanguageContext';
import { Badge } from '../components/ui/Badge';
import { ScreenHeading } from '../components/ui/ScreenHeading';
import { SearchBar } from '../components/ui/SearchBar';
import { CategoryPill } from '../components/ui/CategoryPill';
import { StateCard } from '../components/ui/StateCard';

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
      style={screenStyles.container}
      contentContainerStyle={screenStyles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Title & Subtitle */}
      <ScreenHeading title={t.servicesTitle} subtitle={t.servicesSubtitle} />

      {/* Search Input Bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder={t.searchServices}
        clearLabel={x.clearSearch}
      />

      {/* Horizontal Category Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.categoryScroll, isRtl && rtlStyles.rtlRow]}
      >
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <CategoryPill
              key={cat.id}
              label={cat.label}
              icon={cat.icon as any}
              selected={isActive}
              onPress={() => setActiveCategory(cat.id)}
            />
          );
        })}
      </ScrollView>

      {/* Service Cards Grid */}
      <View style={styles.serviceList}>
        {filteredServices.length === 0 ? (
          <StateCard kind="empty" title={x.stateEmpty} message={x.servicesNoMatch} compact />
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
            <View style={[styles.cardTopRow, isRtl && rtlStyles.rtlRow]}>
              <IconTile icon={svc.icon as any} bg={svc.bgColor} color={svc.color} size={28} />
              <Badge label={svc.badge} variant={svc.badgeVariant} size="sm" />
            </View>

            <Text style={[styles.serviceTitle, isRtl && rtlStyles.rtlText]}>{svc.title}</Text>
            <Text style={[styles.serviceDesc, isRtl && rtlStyles.rtlText]}>{svc.desc}</Text>

            <View style={[styles.cardFooter, isRtl && rtlStyles.rtlRow]}>
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
  categoryScroll: {
    gap: spacing.xs,
    paddingBottom: spacing.md,
  },
  serviceList: gapMd,
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
  serviceTitle: {
    fontSize: typography.fontSizes.base, lineHeight: typography.lineHeights.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  serviceDesc: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    lineHeight: typography.lineHeights.xs,
    marginBottom: spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceSubtle,
    paddingTop: spacing.xs,
  },
  launchText: {
    fontSize: typography.fontSizes.xs,
    lineHeight: typography.lineHeights.xs,
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
  },
});
