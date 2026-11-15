import React, { useState } from 'react';
import { rtlStyles } from '../theme/rtl';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { cardPad, flex1, screenStyles, stackLg } from '../theme/layout';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../theme/colors';
import { mutedCaption, subtitleMeta, titleSm } from '../theme/typographyStyles';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SectionHeader } from '../components/ui/SectionHeader';
import { UserRole } from '../types';
import { apiRequest, getApiBaseUrl } from '../api/client';
import { supabaseHost, isSupabaseConfigured } from '../api/supabase';
import { clearCache } from '../api/cache';
import { AuthModal } from '../components/auth/AuthModal';

export const ProfileScreen: React.FC = () => {
  const { t, x, isRtl, isArabic, language, setLanguage } = useLanguage();
  const { user, isAuthenticated, signOut } = useAuth();

  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);

  /** Localised label for a role slug (falls back to the raw slug). */
  const roleLabel = (role: UserRole | undefined): string => {
    const found = roles.find((r) => r.role === role);
    return found ? found.label : t.roleFarmer;
  };

  // Read-only identity list: the role is fixed by the server account and is
  // surfaced as a badge, never switched from the app.
  const roles: { role: UserRole; label: string }[] = [
    { role: 'gardener', label: t.roleGardener },
    { role: 'farmer', label: t.roleFarmer },
    { role: 'agronomist', label: t.roleAgronomist },
    { role: 'veterinarian', label: t.roleVeterinarian },
    { role: 'trader', label: t.roleTrader },
    { role: 'company', label: t.roleCompany },
    { role: 'inspector', label: t.roleInspector },
    { role: 'investor', label: t.roleInvestor },
    { role: 'government', label: t.roleGovernment },
    { role: 'admin', label: t.roleAdmin },
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
      style={screenStyles.container}
      contentContainerStyle={screenStyles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. User Profile Header Card */}
      <Card variant="elevated" style={styles.profileCard}>
        <View style={[styles.avatarRow, isRtl && rtlStyles.rtlRow]}>
          <View style={styles.avatarLarge}>
            <MaterialCommunityIcons name="account" size={40} color={colors.primary} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, isRtl && rtlStyles.rtlText]}>
              {(isArabic ? user?.full_name_ar : user?.full_name) ||
                user?.full_name ||
                (isAuthenticated ? x.profileUserFallback : x.profileGuest)}
            </Text>
            <Text style={[styles.profileEmail, isRtl && rtlStyles.rtlText]}>
              {user?.email || (isAuthenticated ? '' : x.profileSignInPrompt)}
            </Text>
            <View style={[styles.badgeContainer, isRtl && rtlStyles.rtlRow]}>
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

        {/* Signed-out users get a sign-in affordance. Signed-in users see their
            identity above and sign out from the primary action at the bottom,
            so the header never shows a redundant "manage account" button that
            would only re-open the sign-in form. */}
        {!isAuthenticated && (
          <View style={[styles.quickAuthRow, isRtl && rtlStyles.rtlRow]}>
            <Button
              title={x.authSignIn}
              variant="outline"
              size="sm"
              onPress={() => setShowAuthModal(true)}
              style={flex1}
            />
          </View>
        )}
      </Card>

      {/* 2. Language Selection Card */}
      <View style={styles.section}>
        <SectionHeader title={t.languageSelect} />
        <Card variant="outlined" style={styles.optionsCard}>
          <View style={styles.languageRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setLanguage('ar')}
              accessibilityRole="button"
              accessibilityState={{ selected: language === 'ar' }}
              accessibilityLabel={x.languageArabicLabel}
              style={[styles.langChoice, isRtl && rtlStyles.rtlRow, language === 'ar' && styles.langChoiceActive]}
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
              style={[styles.langChoice, isRtl && rtlStyles.rtlRow, language === 'fr' && styles.langChoiceActive]}
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
              style={[styles.langChoice, isRtl && rtlStyles.rtlRow, language === 'en' && styles.langChoiceActive]}
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

      {/* 3. Server & Backend Connectivity Diagnostics */}
      <View style={styles.section}>
        <SectionHeader title={t.connectionStatus} />
        <Card variant="outlined" style={styles.statusCard}>
          <View style={[styles.statusRow, isRtl && rtlStyles.rtlRow]}>
            <View
              style={[
                styles.statusIndicatorOnline,
                { backgroundColor: connectionResult ? colors.success : colors.textMuted },
              ]}
            />
            <View style={styles.statusTextContainer}>
              <Text style={[styles.statusMainText, isRtl && rtlStyles.rtlText]}>
                Express API Gateway
              </Text>
              <Text style={[styles.statusSubText, isRtl && rtlStyles.rtlText]}>
                {getApiBaseUrl()}
              </Text>
            </View>
          </View>

          <View style={[styles.statusRow, isRtl && rtlStyles.rtlRow, { marginTop: spacing.sm }]}>
            <View
              style={[
                styles.statusIndicatorOnline,
                { backgroundColor: isSupabaseConfigured ? colors.success : colors.warning },
              ]}
            />
            <View style={styles.statusTextContainer}>
              <Text style={[styles.statusMainText, isRtl && rtlStyles.rtlText]}>
                Supabase PostgreSQL & Auth
              </Text>
              <Text style={[styles.statusSubText, isRtl && rtlStyles.rtlText]}>
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
          <View style={[styles.offlineRow, isRtl && rtlStyles.rtlRow]}>
            <MaterialCommunityIcons name="database-check" size={24} color={colors.primary} />
            <View style={styles.offlineTextContainer}>
              <Text style={[styles.offlineTitle, isRtl && rtlStyles.rtlText]}>{t.offlineMode}</Text>
              <Text style={[styles.offlineSub, isRtl && rtlStyles.rtlText]}>{x.profileOfflineDesc}</Text>
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  quickAuthRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
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
  profileInfo: flex1,
  profileName: {
    fontSize: typography.fontSizes.lg, lineHeight: typography.lineHeights.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  profileEmail: subtitleMeta,
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  section: stackLg,
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
    lineHeight: typography.lineHeights.sm,
    color: colors.text,
    fontWeight: typography.fontWeights.medium,
  },
  langChoiceTextActive: {
    color: colors.primaryDark,
    fontWeight: typography.fontWeights.bold,
  },
  statusCard: cardPad,
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
  statusTextContainer: flex1,
  statusMainText: titleSm,
  statusSubText: mutedCaption,
  connectionResultBox: {
    backgroundColor: colors.surfaceSubtle,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  connectionResultText: {
    fontSize: typography.fontSizes.xs,
    lineHeight: typography.lineHeights.xs,
    color: colors.text,
    textAlign: 'center',
  },
  offlineCard: cardPad,
  offlineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  offlineTextContainer: flex1,
  offlineTitle: titleSm,
  offlineSub: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: typography.lineHeights.xs,
  },
});
