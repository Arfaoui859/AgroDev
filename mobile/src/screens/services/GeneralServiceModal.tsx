import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography, shadows } from '../../theme/colors';
import { useLanguage } from '../../context/LanguageContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

interface GeneralServiceModalProps {
  serviceId: string;
  onBack: () => void;
}

export const GeneralServiceModal: React.FC<GeneralServiceModalProps> = ({ serviceId, onBack }) => {
  const { t, isRtl } = useLanguage();

  if (serviceId === 'irrigation') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerBox}>
          <View style={[styles.titleRow, isRtl && styles.rtlRow]}>
            <View style={[styles.iconCircle, { backgroundColor: colors.waterLight }]}>
              <MaterialCommunityIcons name="water-pump" size={26} color={colors.water} />
            </View>
            <View style={styles.titleTextContainer}>
              <Text style={[styles.mainTitle, isRtl && styles.rtlText]}>{t.smartIrrigationName}</Text>
              <Text style={[styles.mainSub, isRtl && styles.rtlText]}>
                حساب الاحتياجات المائية وجدولة الري بالقطرة قطرة لترشيد المياه
              </Text>
            </View>
          </View>
        </View>

        <Card variant="elevated" style={styles.card}>
          <Text style={[styles.sectionHeading, isRtl && styles.rtlText]}>
            جدول الري الموصى به لليوم
          </Text>
          <View style={[styles.metricRow, isRtl && styles.rtlRow]}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>الكمية المستهدفة</Text>
              <Text style={styles.metricVal}>28 م³ / هكتار</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>وقت التشغيل الأمثل</Text>
              <Text style={styles.metricVal}>06:00 - 08:30 ص</Text>
            </View>
          </View>
          <Badge label="توفير مياه بنسبة 35%" variant="secondary" size="md" />
        </Card>

        <Card variant="outlined" style={styles.card}>
          <Text style={[styles.sectionHeading, isRtl && styles.rtlText]}>حساسات رطوبة التربة (IoT)</Text>
          <View style={[styles.sensorRow, isRtl && styles.rtlRow]}>
            <MaterialCommunityIcons name="gauge" size={24} color={colors.primary} />
            <View style={styles.sensorText}>
              <Text style={[styles.sensorName, isRtl && styles.rtlText]}>حساس قطعة الزيتون (عمق 30 سم)</Text>
              <Text style={[styles.sensorStatus, isRtl && styles.rtlText]}>الرطوبة الحالية: 54% (ممتاز)</Text>
            </View>
            <Badge label="متصل" variant="success" size="sm" />
          </View>
        </Card>

        <Button title={t.back} variant="outline" onPress={onBack} style={{ marginTop: spacing.lg }} />
      </ScrollView>
    );
  }

  if (serviceId === 'pest') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerBox}>
          <View style={[styles.titleRow, isRtl && styles.rtlRow]}>
            <View style={[styles.iconCircle, { backgroundColor: colors.dangerLight }]}>
              <MaterialCommunityIcons name="bug" size={26} color={colors.danger} />
            </View>
            <View style={styles.titleTextContainer}>
              <Text style={[styles.mainTitle, isRtl && styles.rtlText]}>{t.pestControlName}</Text>
              <Text style={[styles.mainSub, isRtl && styles.rtlText]}>
                دليل المكافحة المتكاملة للآفات الشائعة في تونس
              </Text>
            </View>
          </View>
        </View>

        <Card variant="elevated" style={styles.card}>
          <View style={[styles.pestHeader, isRtl && styles.rtlRow]}>
            <Text style={[styles.pestTitle, isRtl && styles.rtlText]}>ذبابة ثمار الزيتون (Bactrocera oleae)</Text>
            <Badge label="خطر متوسط" variant="warning" size="sm" />
          </View>
          <Text style={[styles.pestBody, isRtl && styles.rtlText]}>
            المكافحة البيولوجية: استخدام المصائد الغذائية الجاذبة (ديميثوات مخفف) وتقليم الأشجار لتحسين التهوية والحد من تكاثر الحشرة.
          </Text>
        </Card>

        <Card variant="elevated" style={styles.card}>
          <View style={[styles.pestHeader, isRtl && styles.rtlRow]}>
            <Text style={[styles.pestTitle, isRtl && styles.rtlText]}>عثة الطماطم (Tuta absoluta)</Text>
            <Badge label="نشاط ربيعي" variant="danger" size="sm" />
          </View>
          <Text style={[styles.pestBody, isRtl && styles.rtlText]}>
            المكافحة الموصى بها: تركيب مصائد فرمونية مائية، واستخدام بكتيريا العصوية التورنجية (Bacillus thuringiensis) كعلاج حيوي آمن.
          </Text>
        </Card>

        <Button title={t.back} variant="outline" onPress={onBack} style={{ marginTop: spacing.lg }} />
      </ScrollView>
    );
  }

  if (serviceId === 'livestock') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerBox}>
          <View style={[styles.titleRow, isRtl && styles.rtlRow]}>
            <View style={[styles.iconCircle, { backgroundColor: colors.accentLight }]}>
              <MaterialCommunityIcons name="cow" size={26} color={colors.accent} />
            </View>
            <View style={styles.titleTextContainer}>
              <Text style={[styles.mainTitle, isRtl && styles.rtlText]}>{t.livestockName}</Text>
              <Text style={[styles.mainSub, isRtl && styles.rtlText]}>
                متابعة قطعان الأغنام والأبقار وجداول التلقيح والتغذية
              </Text>
            </View>
          </View>
        </View>

        <Card variant="elevated" style={styles.card}>
          <Text style={[styles.sectionHeading, isRtl && styles.rtlText]}>إحصائيات القطيع</Text>
          <View style={[styles.metricRow, isRtl && styles.rtlRow]}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>سلالة الأغنام (البربري)</Text>
              <Text style={styles.metricVal}>48 رأس</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>الأبقار الحلوب</Text>
              <Text style={styles.metricVal}>12 رأس</Text>
            </View>
          </View>
          <Badge label="الحالة الصحية: ممتازة" variant="success" size="md" />
        </Card>

        <Card variant="outlined" style={styles.card}>
          <Text style={[styles.sectionHeading, isRtl && styles.rtlText]}>التلقيحات البيطرية القادمة</Text>
          <Text style={[styles.pestBody, isRtl && styles.rtlText]}>
            • التطعيم ضد التسمم المعوي (Clostridiosis) للأغنام - موعد مقترح: الأسبوع القادم.
          </Text>
        </Card>

        <Button title={t.back} variant="outline" onPress={onBack} style={{ marginTop: spacing.lg }} />
      </ScrollView>
    );
  }

  // Community / Expert Consultation
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerBox}>
        <View style={[styles.titleRow, isRtl && styles.rtlRow]}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
            <MaterialCommunityIcons name="account-group" size={26} color={colors.primary} />
          </View>
          <View style={styles.titleTextContainer}>
            <Text style={[styles.mainTitle, isRtl && styles.rtlText]}>
              {serviceId === 'expert' ? t.expertConsultationName : t.communityForumName}
            </Text>
            <Text style={[styles.mainSub, isRtl && styles.rtlText]}>
              شبكة الفلاحين والخبراء الزراعيين المعتمدين في مختلف ولايات تونس
            </Text>
          </View>
        </View>
      </View>

      <Card variant="elevated" style={styles.card}>
        <View style={[styles.expertRow, isRtl && styles.rtlRow]}>
          <View style={styles.expertAvatar}>
            <MaterialCommunityIcons name="doctor" size={28} color={colors.secondary} />
          </View>
          <View style={styles.expertInfo}>
            <Text style={[styles.expertName, isRtl && styles.rtlText]}>م. أحمد الرياحي</Text>
            <Text style={[styles.expertSpec, isRtl && styles.rtlText]}>مهندس زراعي - خبير أشجار الزيتون والحبوب</Text>
            <Badge label="متاح للاستشارة" variant="success" size="sm" />
          </View>
        </View>
        <Button
          title="طلب استشارة ميدانية أو هاتفية"
          size="md"
          variant="secondary"
          onPress={() => Alert.alert('طلب الاستشارة', 'تم إرسال طلب الاستشارة للمهندس الزراعي وسيتواصل معك قريباً.')}
          style={{ marginTop: spacing.sm }}
        />
      </Card>

      <Card variant="elevated" style={styles.card}>
        <View style={[styles.expertRow, isRtl && styles.rtlRow]}>
          <View style={styles.expertAvatar}>
            <MaterialCommunityIcons name="stethoscope" size={28} color={colors.accent} />
          </View>
          <View style={styles.expertInfo}>
            <Text style={[styles.expertName, isRtl && styles.rtlText]}>د. سميحة الورتاني</Text>
            <Text style={[styles.expertSpec, isRtl && styles.rtlText]}>طبيبة بيطرية - رعاية الأبقار والأغنام</Text>
            <Badge label="متواجدة حالياً" variant="info" size="sm" />
          </View>
        </View>
        <Button
          title="طلب استشارة بيطرية"
          size="md"
          variant="outline"
          onPress={() => Alert.alert('طلب الاستشارة', 'تم إرسال طلب الاستشارة للطبيبة البيطرية بنجاح.')}
          style={{ marginTop: spacing.sm }}
        />
      </Card>

      <Button title={t.back} variant="outline" onPress={onBack} style={{ marginTop: spacing.lg }} />
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
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionHeading: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
  metricVal: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
    marginTop: 2,
  },
  sensorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sensorText: {
    flex: 1,
  },
  sensorName: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text,
  },
  sensorStatus: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  pestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  pestTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    flex: 1,
  },
  pestBody: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 4,
  },
  expertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  expertAvatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expertInfo: {
    flex: 1,
  },
  expertName: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  expertSpec: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginVertical: 2,
  },
});
