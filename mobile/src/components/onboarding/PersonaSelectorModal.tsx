import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography, shadows } from '../../theme/colors';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { ExtraTranslations } from '../../i18n/extra';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface PersonaSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

interface Persona {
  role: UserRole;
  titleKey: keyof ExtraTranslations;
  subKey: keyof ExtraTranslations;
  badgeKey: keyof ExtraTranslations;
  icon: string;
  badgeVariant: 'primary' | 'success' | 'secondary' | 'accent' | 'warning' | 'info';
}

/**
 * Role-aware onboarding. The choice tunes the mobile experience (shortcuts,
 * tips, ordering) but never grants server-side privileges: the authoritative
 * role is assigned by the backend.
 */
const PERSONAS: Persona[] = [
  {
    role: 'gardener',
    titleKey: 'personaGardenerTitle',
    subKey: 'personaGardenerSub',
    badgeKey: 'personaGardenerBadge',
    icon: 'flower',
    badgeVariant: 'success',
  },
  {
    role: 'farmer',
    titleKey: 'personaFarmerTitle',
    subKey: 'personaFarmerSub',
    badgeKey: 'personaFarmerBadge',
    icon: 'tractor',
    badgeVariant: 'primary',
  },
  {
    role: 'agronomist',
    titleKey: 'personaAgronomistTitle',
    subKey: 'personaAgronomistSub',
    badgeKey: 'personaAgronomistBadge',
    icon: 'school',
    badgeVariant: 'accent',
  },
  {
    role: 'company',
    titleKey: 'personaCompanyTitle',
    subKey: 'personaCompanySub',
    badgeKey: 'personaCompanyBadge',
    icon: 'domain',
    badgeVariant: 'secondary',
  },
  {
    role: 'trader',
    titleKey: 'personaTraderTitle',
    subKey: 'personaTraderSub',
    badgeKey: 'personaTraderBadge',
    icon: 'chart-line',
    badgeVariant: 'info',
  },
  {
    role: 'inspector',
    titleKey: 'personaInspectorTitle',
    subKey: 'personaInspectorSub',
    badgeKey: 'personaInspectorBadge',
    icon: 'clipboard-check-outline',
    badgeVariant: 'warning',
  },
  {
    role: 'veterinarian',
    titleKey: 'personaVeterinarianTitle',
    subKey: 'personaVeterinarianSub',
    badgeKey: 'personaVeterinarianBadge',
    icon: 'stethoscope',
    badgeVariant: 'success',
  },
  {
    role: 'investor',
    titleKey: 'personaInvestorTitle',
    subKey: 'personaInvestorSub',
    badgeKey: 'personaInvestorBadge',
    icon: 'finance',
    badgeVariant: 'info',
  },
  {
    role: 'government',
    titleKey: 'personaGovernmentTitle',
    subKey: 'personaGovernmentSub',
    badgeKey: 'personaGovernmentBadge',
    icon: 'bank',
    badgeVariant: 'secondary',
  },
];

export const PersonaSelectorModal: React.FC<PersonaSelectorModalProps> = ({ visible, onClose }) => {
  const { x, isRtl } = useLanguage();
  const { user, updateRole, completeOnboarding } = useAuth();

  const handleSelect = async (role: UserRole) => {
    await updateRole(role);
    await completeOnboarding();
    onClose();
  };

  const handleSkip = async () => {
    await completeOnboarding();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleSkip}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={[styles.headerRow, isRtl && styles.rtlRow]}>
            <View style={styles.headerTextWrap}>
              <Text style={[styles.modalTitle, isRtl && styles.rtlText]}>{x.onboardingTitle}</Text>
              <Text style={[styles.modalSub, isRtl && styles.rtlText]}>{x.onboardingSubtitle}</Text>
            </View>
            <TouchableOpacity
              onPress={handleSkip}
              accessibilityRole="button"
              accessibilityLabel={x.close}
              style={styles.closeBtn}
            >
              <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.personaList} showsVerticalScrollIndicator={false}>
            {PERSONAS.map((p) => {
              const isSelected = user?.role === p.role;
              return (
                <TouchableOpacity
                  key={p.role}
                  activeOpacity={0.85}
                  onPress={() => handleSelect(p.role)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`${x[p.titleKey]}. ${x[p.subKey]}`}
                  style={[styles.personaCard, isSelected && styles.personaCardSelected]}
                >
                  <View style={[styles.cardTop, isRtl && styles.rtlRow]}>
                    <View style={[styles.iconWrap, isSelected ? styles.iconWrapSelected : styles.iconWrapNormal]}>
                      <MaterialCommunityIcons
                        name={p.icon as any}
                        size={24}
                        color={isSelected ? colors.textInverse : colors.primary}
                      />
                    </View>
                    <View style={styles.titleArea}>
                      <Text
                        style={[styles.personaTitle, isSelected && styles.personaTitleSelected, isRtl && styles.rtlText]}
                      >
                        {x[p.titleKey]}
                      </Text>
                    </View>
                    <Badge label={x[p.badgeKey]} variant={p.badgeVariant} size="sm" />
                  </View>
                  <Text style={[styles.personaDesc, isRtl && styles.rtlText]}>{x[p.subKey]}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Button title={x.onboardingSkip} variant="outline" size="md" onPress={handleSkip} style={{ marginTop: spacing.md }} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '85%',
  },
  rtlRow: { flexDirection: 'row-reverse' },
  rtlText: { textAlign: 'right', writingDirection: 'rtl' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerTextWrap: { flex: 1 },
  modalTitle: { fontSize: typography.fontSizes.lg, lineHeight: 27, fontWeight: typography.fontWeights.bold, color: colors.text },
  modalSub: { fontSize: typography.fontSizes.xs, color: colors.textSecondary, marginTop: 2, lineHeight: 20 },
  closeBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSubtle,
  },
  personaList: { marginVertical: spacing.xs },
  personaCard: {
    minHeight: 48,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  personaCardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 6 },
  iconWrap: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  iconWrapNormal: { backgroundColor: colors.primaryLight },
  iconWrapSelected: { backgroundColor: colors.primary },
  titleArea: { flex: 1 },
  personaTitle: { fontSize: typography.fontSizes.base, lineHeight: 24, fontWeight: typography.fontWeights.bold, color: colors.text },
  personaTitleSelected: { color: colors.primaryDark },
  personaDesc: { fontSize: typography.fontSizes.xs, color: colors.textSecondary, lineHeight: 20, marginTop: 2 },
});
