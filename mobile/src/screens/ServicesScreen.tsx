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

interface ServicesScreenProps {
  onSelectService: (serviceId: string) => void;
}

export const ServicesScreen: React.FC<ServicesScreenProps> = ({ onSelectService }) => {
  const { t, isRtl } = useLanguage();
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
      badge: 'تسميد علمي',
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
      badge: 'ربحية أعلى',
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
      badge: 'فحص بالصورة',
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
      badge: 'مكافحة متكاملة',
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
      badge: 'توفير المياه',
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
      badge: 'محطات تونسية',
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
      badge: 'خرائط الحقول',
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
      badge: 'أغنام وأبقار',
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
      badge: 'مجتمع الفلاحين',
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
      badge: 'مهندسون وبياطرة',
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
      badge: '8 وكلاء متخصصين',
      badgeVariant: 'accent' as const,
    },
    {
      id: 'recent_analyses',
      title: 'سجل التحاليل السابقة',
      desc: 'مراجعة كافة نتائج تشخيص الأمراض وتحاليل التربة المحفوظة مع توصياتها وتاريخ إجرائها.',
      icon: 'history',
      color: colors.secondary,
      bgColor: colors.secondaryLight,
      category: 'health',
      badge: 'سجل مؤرخ',
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
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialCommunityIcons name="close-circle" size={18} color={colors.textMuted} />
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
              style={[styles.catPill, isActive && styles.catPillActive]}
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
        {filteredServices.map((svc) => (
          <TouchableOpacity
            key={svc.id}
            activeOpacity={0.85}
            onPress={() => onSelectService(svc.id)}
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
              <Text style={styles.launchText}>ابدأ الاستخدام</Text>
              <MaterialCommunityIcons
                name={isRtl ? 'arrow-left' : 'arrow-right'}
                size={18}
                color={colors.primary}
              />
            </View>
          </TouchableOpacity>
        ))}
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
  categoryScroll: {
    gap: spacing.xs,
    paddingBottom: spacing.md,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
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
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    marginBottom: 4,
  },
  serviceDesc: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    lineHeight: 18,
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
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
  },
});
