import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography, shadows } from '../../theme/colors';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface PersonaSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PersonaSelectorModal: React.FC<PersonaSelectorModalProps> = ({
  visible,
  onClose,
}) => {
  const { t, isRtl } = useLanguage();
  const { user, switchRole } = useAuth();

  const personas: Array<{
    role: UserRole;
    titleAr: string;
    titleEn: string;
    subAr: string;
    icon: string;
    badge: string;
    badgeVariant: 'primary' | 'success' | 'secondary' | 'accent' | 'warning' | 'info';
  }> = [
    {
      role: 'gardener',
      titleAr: 'زراعة منزلية وحدائق',
      titleEn: 'Home Grower / Gardening',
      subAr: 'رعاية نباتات الحديقة المنزلية، فحص الأوراق السريع، وجداول السقي البسيطة.',
      icon: 'flower',
      badge: 'مبتدئ وعائلي',
      badgeVariant: 'success',
    },
    {
      role: 'farmer',
      titleAr: 'فلاح ومزارع محترف',
      titleEn: 'Professional Farmer',
      subAr: 'إدارة الحقول، تسميد التربة، الطقس الزراعي الحي، وجدولة الري بالتنقيط.',
      icon: 'tractor',
      badge: 'الوضع الأساسي',
      badgeVariant: 'primary',
    },
    {
      role: 'agronomist',
      titleAr: 'مهندس وخبير زراعي',
      titleEn: 'Agronomist & Specialist',
      subAr: 'تحاليل التربة المخبرية الدقيقة، خطط العلاج الكيميائي والبيولوجي، وإرشاد الفلاحين.',
      icon: 'school',
      badge: 'متقدم وخبير',
      badgeVariant: 'accent',
    },
    {
      role: 'company',
      titleAr: 'شركات وتعاونيات فلاحية',
      titleEn: 'Agri-Business & Co-op',
      subAr: 'إدارة إنتاج مزارع كبرى، تتبع سلاسل التوريد، ومراقبة المخزون والجودة.',
      icon: 'domain',
      badge: 'إدارة وتخطيط',
      badgeVariant: 'secondary',
    },
    {
      role: 'trader',
      titleAr: 'تاجر ومستثمر زراعي',
      titleEn: 'Trader & Agri-Investor',
      subAr: 'مؤشرات أسعار أسواق الجملة، توقعات الطلب والمواسم، ودراسات الربحية.',
      icon: 'chart-line',
      badge: 'تجارة واستثمار',
      badgeVariant: 'info',
    },
    {
      role: 'inspector',
      titleAr: 'مراقب جودة ومؤسسات',
      titleEn: 'Field Inspector / Gov',
      subAr: 'تقارير السلامة النباتية، رقابة الجودة، والبيانات الإحصائية الرسمية.',
      icon: 'clipboard-check-outline',
      badge: 'رقابة ومطابقة',
      badgeVariant: 'warning',
    },
  ];

  const handleSelect = (role: UserRole) => {
    switchRole(role);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={[styles.headerRow, isRtl && styles.rtlRow]}>
            <View style={styles.headerTextWrap}>
              <Text style={[styles.modalTitle, isRtl && styles.rtlText]}>
                اختر نوع استخدامك للمنصة
              </Text>
              <Text style={[styles.modalSub, isRtl && styles.rtlText]}>
                نخصص لك واجهة التطبيق والخدمات الأكثر ملاءمة لأهدافك
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.personaList} showsVerticalScrollIndicator={false}>
            {personas.map((p) => {
              const isSelected = user?.role === p.role;
              return (
                <TouchableOpacity
                  key={p.role}
                  activeOpacity={0.85}
                  onPress={() => handleSelect(p.role)}
                  style={[styles.personaCard, isSelected && styles.personaCardSelected]}
                >
                  <View style={[styles.cardTop, isRtl && styles.rtlRow]}>
                    <View
                      style={[
                        styles.iconWrap,
                        isSelected ? styles.iconWrapSelected : styles.iconWrapNormal,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={p.icon as any}
                        size={26}
                        color={isSelected ? colors.textInverse : colors.primary}
                      />
                    </View>
                    <View style={styles.titleArea}>
                      <Text
                        style={[
                          styles.personaTitle,
                          isSelected && styles.personaTitleSelected,
                          isRtl && styles.rtlText,
                        ]}
                      >
                        {p.titleAr}
                      </Text>
                      <Text style={[styles.personaTitleEn, isRtl && styles.rtlText]}>
                        {p.titleEn}
                      </Text>
                    </View>
                    <Badge label={p.badge} variant={p.badgeVariant} size="sm" />
                  </View>

                  <Text style={[styles.personaDesc, isRtl && styles.rtlText]}>{p.subAr}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Button
            title="متابعة بالوضع الحالي"
            variant="outline"
            size="md"
            onPress={onClose}
            style={{ marginTop: spacing.md }}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '85%',
  },
  rtlRow: {
    flexDirection: 'row-reverse',
  },
  rtlText: {
    textAlign: 'right',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerTextWrap: {
    flex: 1,
  },
  modalTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  modalSub: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSubtle,
  },
  personaList: {
    marginVertical: spacing.xs,
  },
  personaCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  personaCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 6,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapNormal: {
    backgroundColor: colors.primaryLight,
  },
  iconWrapSelected: {
    backgroundColor: colors.primary,
  },
  titleArea: {
    flex: 1,
  },
  personaTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  personaTitleSelected: {
    color: colors.primaryDark,
  },
  personaTitleEn: {
    fontSize: 11,
    color: colors.textMuted,
  },
  personaDesc: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
});
