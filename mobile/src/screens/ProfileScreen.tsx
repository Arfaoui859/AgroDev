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
import { colors, radius, spacing, typography } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { UserRole } from '../types';
import { apiRequest, getApiBaseUrl } from '../api/client';
import { supabaseHost, isSupabaseConfigured } from '../api/supabase';
import { clearCache } from '../api/cache';
import { AuthModal } from '../components/auth/AuthModal';
import { PersonaSelectorModal } from '../components/onboarding/PersonaSelectorModal';

export const ProfileScreen: React.FC = () => {
  const { t, x, isRtl, isArabic, language, setLanguage } = useLanguage();
  const { user, isAuthenticated, updateRole, signOut } = useAuth();

  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);

/** Localised label for a role slug (falls back to the raw slug). */
  const roleLabel = (role: UserRole | undefined): string => {
    const found = roles.find((r) => r.role === role);
    return found ? found.label : t.roleFarmer;
  };

  const roles: { role: UserRole; label: string; icon: string }[] = [
    { role: 'gardener', label: t.roleGardener, icon: 'flower' },
    { role: 'farmer', label: t.roleFarmer, icon: 'tractor' },
    { role: 'agronomist', label: t.roleAgronomist, icon: 'school' },
    { role: 'veterinarian', label: t.roleVeterinarian, icon: 'stethoscope' },
    { role: 'trader', label: t.roleTrader, icon: 'cart' },
    { role: 'company', label: t.roleCompany, icon: 'domain' },
    { role: 'inspector', label: t.roleInspector, icon: 'clipboard-check' },
    { role: 'investor', label: t.roleInvestor, icon: 'chart-line' },
    { role: 'government', label: t.roleGovernment, icon: 'bank' },
    { role: 'admin', label: t.roleAdmin, icon: 'shield-crown' },
  ];

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionResult(null);

    const res = await apiRequest('/api/ping', { anonymous: true });
    setTestingConnection(false);

    if (res.isOnline) {
      setConnectionResult(x.profileServerReachable);
    } else {
      setConnectionResult(res.error || x.stateOffline);
    }
  };

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      await clearCache();
      setConnectionResult(x.profileCacheCleared);
    } finally {
      setClearingCache(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(t.logoutBtn, x.profileSignOutConfirm, [
      { text: x.cancel, style: 'cancel' },
      {
        text: t.logoutBtn,
        style: 'destructive',
        onPress: () => {
          void signOut();
        },
      },
    ]);
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
              {(isArabic ? user?.full_name_ar : user?.full_name) ||
                user?.full_name ||
                (isAuthenticated ? x.profileUserFallback : x.profileGuest)}
            </Text>
            <Text style={[styles.profileEmail, isRtl && styles.rtlText]}>
              {user?.email || (isAuthenticated ? '' : x.profileSignInPrompt)}
            </Text>
            <View style={[styles.badgeContainer, isRtl && styles.rtlRow]}>
              {isAuthenticated ? (
                <>
                  <Badge label={roleLabel(user?.role)} variant="primary" size="sm" />
                  {user?.governorate ? <Badge label={user.governorate} variant="secondary" size="sm" /> : null}
                </>
              ) : (
                <Badge label={x.profileNotSignedIn} variant="warning" size="sm" />
              )}
            </View>
          </View>
        </View>

        {/* Quick Account & Persona Actions */}
        <View style={[styles.quickAuthRow, isRtl && styles.rtlRow]}>
          <Button
            title={isAuthenticated ? x.profileSignedInAs : x.authSignIn}
            variant="outline"
            size="sm"
            onPress={() => setShowAuthModal(true)}
            style={{ flex: 1 }}
          />
          <Button
            title={x.profilePersonaButton}
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
              accessibilityRole="button"
              accessibilityState={{ selected: language === 'ar' }}
              accessibilityLabel={x.languageArabicLabel}
              style={[styles.langChoice, isRtl && styles.rtlRow, language === 'ar' && styles.langChoiceActive]}
            >
              <Text style={[styles.langChoiceText, language === 'ar' && styles.langChoiceTextActive]}>
                {x.languageArabicLabel}
              </Text>
              {language === 'ar' && (
                <MaterialCommunityIcons name="check" size={18} color={colors.primary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setLanguage('fr')}
              accessibilityRole="button"
              accessibilityState={{ selected: language === 'fr' }}
              accessibilityLabel={'Français'}
              style={[styles.langChoice, isRtl && styles.rtlRow, language === 'fr' && styles.langChoiceActive]}
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
              accessibilityRole="button"
              accessibilityState={{ selected: language === 'en' }}
              accessibilityLabel={'English'}
              style={[styles.langChoice, isRtl && styles.rtlRow, language === 'en' && styles.langChoiceActive]}
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
          <Badge label={x.profileLocalPreference} variant="accent" size="sm" />
        </View>
        <Text style={[styles.sectionNote, isRtl && styles.rtlText]}>{t.demoModeNotice}</Text>

        <View style={[styles.roleGrid, isRtl && styles.rtlRow]}>
          {roles.map((r) => {
            const isSelected = user?.role === r.role;
            return (
              <TouchableOpacity
                key={r.role}
                activeOpacity={0.8}
                onPress={() => updateRole(r.role)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={r.label}
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
            <View
              style={[
                styles.statusIndicatorOnline,
                { backgroundColor: connectionResult ? colors.success : colors.textMuted },
              ]}
            />
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
            <View
              style={[
                styles.statusIndicatorOnline,
                { backgroundColor: isSupabaseConfigured ? colors.success : colors.warning },
              ]}
            />
            <View style={styles.statusTextContainer}>
              <Text style={[styles.statusMainText, isRtl && styles.rtlText]}>
                Supabase PostgreSQL & Auth
              </Text>
              <Text style={[styles.statusSubText, isRtl && styles.rtlText]}>
                {isSupabaseConfigured ? supabaseHost : x.profileSupabaseUnconfigured}
              </Text>
            </View>
          </View>

          {connectionResult && (
            <View style={styles.connectionResultBox}>
              <Text style={styles.connectionResultText}>{connectionResult}</Text>
            </View>
          )}

          <Button
            title={x.profileTestConnection}
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
              <Text style={[styles.offlineSub, isRtl && styles.rtlText]}>{x.profileOfflineDesc}</Text>
            </View>
          </View>
          <Button
            title={clearingCache ? x.stateLoading : x.profileClearCache}
            variant="secondary"
            size="md"
            loading={clearingCache}
            onPress={handleClearCache}
            style={{ marginTop: spacing.sm }}
          />
        </Card>
      </View>

      {/* 6. Sign In / Sign Out Button */}
      <Button
        title={isAuthenticated ? t.logoutBtn : x.authSignIn}
        variant="danger"
        size="lg"
        onPress={isAuthenticated ? handleSignOut : () => setShowAuthModal(true)}
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
  rtlText: { textAlign: 'right', writingDirection: 'rtl' },
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
    fontSize: typography.fontSizes.lg, lineHeight: 27,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  profileEmail: {
    fontSize: typography.fontSizes.xs,
    lineHeight: 20,
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
    fontSize: typography.fontSizes.base, lineHeight: 24,
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
    lineHeight: 20,
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
    minHeight: 48,
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
    lineHeight: 21,
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
    minHeight: 48,
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
    lineHeight: 20,
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
    lineHeight: 21,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  statusSubText: {
    fontSize: typography.fontSizes.xs,
    lineHeight: 20,
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
    lineHeight: 20,
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
    fontSize: typography.fontSizes.sm, lineHeight: 21,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  offlineSub: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 20,
  },
});
