import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography, shadows } from '../../theme/colors';
import { useLanguage } from '../../context/LanguageContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { SavedAnalysis } from '../../types';

interface RecentAnalysesScreenProps {
  onBack: () => void;
  onSelectAnalysis?: (analysis: SavedAnalysis) => void;
}

export const RecentAnalysesScreen: React.FC<RecentAnalysesScreenProps> = ({
  onBack,
  onSelectAnalysis,
}) => {
  const { t, isRtl } = useLanguage();

  const savedRecords: SavedAnalysis[] = [
    {
      id: 'rec-1',
      type: 'disease',
      title: 'فحص أوراق الزيتون - عين الطاووس',
      date: 'اليوم، 10:15 ص',
      summary: 'تم اكتشاف إصابة فطرية متوسطة على صنف الشملالي. المعالجة الفورية الموصى بها: رش بمركبات النحاس 50%.',
      badge: 'فحص بالصورة',
      badgeVariant: 'warning',
    },
    {
      id: 'rec-2',
      type: 'soil',
      title: 'تحليل خصوبة حقل باجة (قطعة 4)',
      date: 'أمس، 16:30 م',
      summary: 'النتيجة: ممتاز (88/100). نسبة المادة العضوية 2.4% ودرجة الحموضة pH 7.2. ملائم لزراعة القمح الصلب.',
      badge: 'تحليل تربة',
      badgeVariant: 'success',
    },
    {
      id: 'rec-3',
      type: 'disease',
      title: 'فحص شتلات الطماطم - اللفحة المبكرة',
      date: 'منذ 3 أيام',
      summary: 'بقع بنية جافة متحدة المركز. تم تطبيق العزل وتقليم الأوراق المصابة.',
      badge: 'فحص بالصورة',
      badgeVariant: 'danger',
    },
    {
      id: 'rec-4',
      type: 'crop',
      title: 'دراسة جدوى المحاصيل - هنشر الساحل',
      date: 'الأسبوع الماضي',
      summary: 'أعلى المحاصيل ربحية المقترحة: اللوز التونسي والزيتون الشملالي بعائد متوقع 4800 د.ت/هكتار.',
      badge: 'توصية محاصيل',
      badgeVariant: 'primary',
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerBox}>
        <View style={[styles.titleRow, isRtl && styles.rtlRow]}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="history" size={26} color={colors.primary} />
          </View>
          <View style={styles.titleTextContainer}>
            <Text style={[styles.mainTitle, isRtl && styles.rtlText]}>
              سجل الفحوصات والتحاليل السابقة
            </Text>
            <Text style={[styles.mainSub, isRtl && styles.rtlText]}>
              مراجعة نتائج التشخيص الزراعي وخطط العلاج المحفوظة لحقولك
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.recordsList}>
        {savedRecords.map((item) => (
          <Card
            key={item.id}
            variant="elevated"
            onPress={() => onSelectAnalysis?.(item)}
            style={styles.recordCard}
          >
            <View style={[styles.cardTop, isRtl && styles.rtlRow]}>
              <View style={styles.titleArea}>
                <Text style={[styles.recordTitle, isRtl && styles.rtlText]}>{item.title}</Text>
                <Text style={[styles.recordDate, isRtl && styles.rtlText]}>
                  <MaterialCommunityIcons name="clock-outline" size={12} color={colors.textMuted} />{' '}
                  {item.date}
                </Text>
              </View>
              <Badge label={item.badge} variant={item.badgeVariant} size="sm" />
            </View>

            <Text style={[styles.recordSummary, isRtl && styles.rtlText]}>{item.summary}</Text>

            <View style={[styles.cardFooter, isRtl && styles.rtlRow]}>
              <Text style={styles.detailsLink}>عرض تفاصيل الفحص وتوصيات العلاج</Text>
              <MaterialCommunityIcons
                name={isRtl ? 'chevron-left' : 'chevron-right'}
                size={18}
                color={colors.primary}
              />
            </View>
          </Card>
        ))}
      </View>

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
    backgroundColor: colors.primaryLight,
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
  recordsList: {
    gap: spacing.sm,
  },
  recordCard: {
    padding: spacing.md,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  titleArea: {
    flex: 1,
  },
  recordTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  recordDate: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  recordSummary: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    lineHeight: 18,
    marginVertical: spacing.xs,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.surfaceSubtle,
    paddingTop: spacing.xs,
    marginTop: 4,
    gap: 4,
  },
  detailsLink: {
    fontSize: typography.fontSizes.xs,
    color: colors.primary,
    fontWeight: typography.fontWeights.semibold,
  },
});
