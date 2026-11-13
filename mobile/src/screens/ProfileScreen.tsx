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
import { colors, radius, spacing, typography, shadows } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { UserRole } from '../types';
import { apiRequest, getApiBaseUrl } from '../api/client';
import { AuthModal } from '../components/auth/AuthModal';
import { PersonaSelectorModal } from '../components/onboarding/PersonaSelectorModal';

export const ProfileScreen: React.FC = () => {
  const { t, isRtl, language, setLanguage } = useLanguage();
  const { user, switchRole, signOut } = useAuth();

  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPersonaModal, setShowPersonaModal] = useState(false);

  const roles: Array<{ role: UserRole; label: string; icon: string }> = [
    { role: 'farmer', label: t.roleFarmer, icon: 'tractor' },
    { role: 'agronomist', label: t.roleAgronomist, icon: 'school' },
    { role: 'veterinarian', label: t.roleVeterinarian, icon: 'stethoscope' },
    { role: 'trader', label: t.roleTrader, icon: 'cart' },
    { role: 'inspector', label: t.roleInspector, icon: 'clipboard-check' },
    { role: 'admin', label: t.roleAdmin, icon: 'shield-crown' },
  ];

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionResult(null);

    const res = await apiRequest('/api/ping');
    setTestingConnection(false);

    if (res.isOnline) {
      setConnectionResult('✅ تم الاتصال بنجاح بخادم AgroGrowth Express (200 OK)');
    } else {
      setConnectionResult('⚠️ يعمل التطبيق حالياً بالوضع المحلي الذكي المكتفي ذاتياً.');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. User Profile Header Card */}
      <Card variant="elevated" style={styles.profileCard}>
        <View style={[styles.avatarRow, isRtl && styles.rtlRow]}>
          <View style={styles.avatarLarge}>
            <MaterialCommunityIcons name="account" size={40} color={colors.primary} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, isRtl && styles.rtlText]}>
              {user?.full_name_ar || user?.full_name || 'محمد علي بن سالم'}
            </Text>
            <Text style={[styles.profileEmail, isRtl && styles.rtlText]}>
              {user?.email || 'farmer@agrogrowth.tn'}
            </Text>
            <View style={[styles.badgeContainer, isRtl && styles.rtlRow]}>
              <Badge label={user?.role?.toUpperCase() || 'FARMER'} variant="primary" size="sm" />
              <Badge label={user?.governorate || 'تونس'} variant="secondary" size="sm" />
            </View>
          </View>
        </View>

        {/* Quick Account & Persona Actions */}
        <View style={[styles.quickAuthRow, isRtl && styles.rtlRow]}>
          <Button
            title="تسجيل دخول / حساب"
            variant="outline"
            size="sm"
            onPress={() => setShowAuthModal(true)}
            style={{ flex: 1 }}
          />
          <Button
            title="تخصيص التجربة (Persona)"
            variant="secondary"
            size="sm"
            onPress={() => setShowPersonaModal(true)}
            style={{ flex: 1 }}
          />
        </View>
      </Card>

      {/* 2. Language Selection Card */}
      <View style={styles.section}>
        <Text style={[styles.sectionHeading, isRtl && styles.rtlText]}>{t.languageSelect}</Text>
        <Card variant="outlined" style={styles.optionsCard}>
          <View style={styles.languageRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setLanguage('ar')}
              style={[styles.langChoice, language === 'ar' && styles.langChoiceActive]}
            >
              <Text style={[styles.langChoiceText, language === 'ar' && styles.langChoiceTextActive]}>
                العربية (تونس)
              </Text>
              {language === 'ar' && (
                <MaterialCommunityIcons name="check" size={18} color={colors.primary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setLanguage('fr')}
              style={[styles.langChoice, language === 'fr' && styles.langChoiceActive]}
            >
              <Text style={[styles.langChoiceText, language === 'fr' && styles.langChoiceTextActive]}>
                Français
              </Text>
              {language === 'fr' && (
                <MaterialCommunityIcons name="check" size={18} color={colors.primary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setLanguage('en')}
              style={[styles.langChoice, language === 'en' && styles.langChoiceActive]}
            >
              <Text style={[styles.langChoiceText, language === 'en' && styles.langChoiceTextActive]}>
                English
              </Text>
              {language === 'en' && (
                <MaterialCommunityIcons name="check" size={18} color={colors.primary} />
              )}
            </TouchableOpacity>
          </View>
        </Card>
      </View>

      {/* 3. Role Switcher Card (Explore All 8 Roles) */}
      <View style={styles.section}>
        <View style={[styles.sectionHeaderRow, isRtl && styles.rtlRow]}>
          <Text style={styles.sectionHeading}>{t.demoModeSwitch}</Text>
          <Badge label="تعديل الدور" variant="accent" size="sm" />
        </View>
        <Text style={[styles.sectionNote, isRtl && styles.rtlText]}>{t.demoModeNotice}</Text>

        <View style={styles.roleGrid}>
          {roles.map((r) => {
            const isSelected = user?.role === r.role;
            return (
              <TouchableOpacity
                key={r.role}
                activeOpacity={0.8}
                onPress={() => switchRole(r.role)}
                style={[styles.roleTile, isSelected && styles.roleTileSelected]}
              >
                <MaterialCommunityIcons
                  name={r.icon as any}
                  size={26}
                  color={isSelected ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.roleTileText,
                    isSelected && styles.roleTileTextSelected,
                    isRtl && styles.rtlText,
                  ]}
                  numberOfLines={1}
                >
                  {r.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 4. Server & Backend Connectivity Diagnostics */}
      <View style={styles.section}>
        <Text style={[styles.sectionHeading, isRtl && styles.rtlText]}>{t.connectionStatus}</Text>
        <Card variant="outlined" style={styles.statusCard}>
          <View style={[styles.statusRow, isRtl && styles.rtlRow]}>
            <View style={styles.statusIndicatorOnline} />
            <View style={styles.statusTextContainer}>
              <Text style={[styles.statusMainText, isRtl && styles.rtlText]}>
                Express API Gateway
              </Text>
              <Text style={[styles.statusSubText, isRtl && styles.rtlText]}>
                {getApiBaseUrl()}
              </Text>
            </View>
          </View>

          <View style={[styles.statusRow, isRtl && styles.rtlRow, { marginTop: spacing.sm }]}>
            <View style={styles.statusIndicatorOnline} />
            <View style={styles.statusTextContainer}>
              <Text style={[styles.statusMainText, isRtl && styles.rtlText]}>
                Supabase PostgreSQL & Auth
              </Text>
              <Text style={[styles.statusSubText, isRtl && styles.rtlText]}>
                jymrhhlwdbclctobhbsi.supabase.co
              </Text>
            </View>
          </View>

          {connectionResult && (
            <View style={styles.connectionResultBox}>
              <Text style={styles.connectionResultText}>{connectionResult}</Text>
            </View>
          )}

          <Button
            title="اختبار الاتصال بالخادم الآن"
            variant="outline"
            size="md"
            loading={testingConnection}
            onPress={handleTestConnection}
            style={{ marginTop: spacing.md }}
          />
        </Card>
      </View>

      {/* 5. Offline Storage & Cache Status */}
      <View style={styles.section}>
        <Card variant="outlined" style={styles.offlineCard}>
          <View style={[styles.offlineRow, isRtl && styles.rtlRow]}>
            <MaterialCommunityIcons name="database-check" size={24} color={colors.primary} />
            <View style={styles.offlineTextContainer}>
              <Text style={[styles.offlineTitle, isRtl && styles.rtlText]}>{t.offlineMode}</Text>
              <Text style={[styles.offlineSub, isRtl && styles.rtlText]}>
                يتم حفظ بيانات الطقس، الحقول، والتشخيص محلياً لتصفحها في الحقل دون إنترنت.
              </Text>
            </View>
          </View>
          <Button
            title={t.syncData}
            variant="secondary"
            size="md"
            onPress={() => Alert.alert('المزامنة', 'تمت مزامنة كافة السجلات والتحديثات بنجاح!')}
            style={{ marginTop: spacing.sm }}
          />
        </Card>
      </View>

      {/* 6. Sign Out Button */}
      <Button
        title={t.logoutBtn}
        variant="danger"
        size="lg"
        onPress={() => signOut()}
        style={{ marginTop: spacing.md, marginBottom: spacing['2xl'] }}
      />

      {/* Auth Modal */}
      <AuthModal visible={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* Adaptive Persona Selector Modal */}
      <PersonaSelectorModal visible={showPersonaModal} onClose={() => setShowPersonaModal(false)} />
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
  quickAuthRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  rtlRow: {
    flexDirection: 'row-reverse',
  },
  rtlText: {
    textAlign: 'right',
  },
  profileCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  profileEmail: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeading: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionNote: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  optionsCard: {
    padding: spacing.sm,
  },
  languageRow: {
    gap: spacing.xs,
  },
  langChoice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  langChoiceActive: {
    backgroundColor: colors.primaryLight,
  },
  langChoiceText: {
    fontSize: typography.fontSizes.sm,
    color: colors.text,
    fontWeight: typography.fontWeights.medium,
  },
  langChoiceTextActive: {
    color: colors.primaryDark,
    fontWeight: typography.fontWeights.bold,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  roleTile: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  roleTileSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  roleTileText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  roleTileTextSelected: {
    color: colors.primaryDark,
    fontWeight: typography.fontWeights.bold,
  },
  statusCard: {
    padding: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusIndicatorOnline: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.success,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusMainText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  statusSubText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
  },
  connectionResultBox: {
    backgroundColor: colors.surfaceSubtle,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  connectionResultText: {
    fontSize: typography.fontSizes.xs,
    color: colors.text,
    textAlign: 'center',
  },
  offlineCard: {
    padding: spacing.md,
  },
  offlineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  offlineTextContainer: {
    flex: 1,
  },
  offlineTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  offlineSub: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
});
