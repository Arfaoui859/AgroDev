import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { rtlStyles } from '../../theme/rtl';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { rowGapSm, rowGapXs } from '../../theme/layout';
import { titleLg } from '../../theme/typographyStyles';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { IconButton } from './IconButton';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  onOpenNotifications?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction,
  onOpenNotifications,
}) => {
  const { language, setLanguage, t, x, isRtl } = useLanguage();
  const { user } = useAuth();

  const toggleLanguage = () => {
    if (language === 'ar') setLanguage('fr');
    else if (language === 'fr') setLanguage('en');
    else setLanguage('ar');
  };

  const getRoleLabel = () => {
    if (!user) return '';
    switch (user.role) {
      case 'gardener':
        return t.roleGardener;
      case 'agronomist':
        return t.roleAgronomist;
      case 'veterinarian':
        return t.roleVeterinarian;
      case 'trader':
        return t.roleTrader;
      case 'company':
        return t.roleCompany;
      case 'inspector':
        return t.roleInspector;
      case 'investor':
        return t.roleInvestor;
      case 'government':
        return t.roleGovernment;
      case 'admin':
        return t.roleAdmin;
      case 'farmer':
      default:
        return t.roleFarmer;
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.content, isRtl && rtlStyles.rtlRow]}>
        {showBack ? (
          <IconButton
            icon={isRtl ? 'chevron-right' : 'chevron-left'}
            size={28}
            activeOpacity={0.7}
            onPress={() => onBack?.()}
            accessibilityLabel={t.back}
          />
        ) : (
          <View style={[styles.brandContainer, isRtl && rtlStyles.rtlRow]}>
            <View style={styles.logoBadge}>
              <MaterialCommunityIcons name="sprout" size={24} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.brandTitle}>{t.appName}</Text>
              <Text style={styles.roleSub}>{getRoleLabel()}</Text>
            </View>
          </View>
        )}

        {title && showBack && (
          <View style={styles.titleContainer}>
            <Text style={styles.screenTitle} numberOfLines={1}>
              {title}
            </Text>
            {subtitle && (
              <Text style={styles.screenSubtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>
        )}

        <View style={[styles.actionsContainer, isRtl && rtlStyles.rtlRow]}>
          {rightAction}

          {onOpenNotifications ? (
            <IconButton
              icon="bell-outline"
              onPress={onOpenNotifications}
              accessibilityLabel={x.notificationsTitle}
            />
          ) : null}

          {/* Language Toggle Pill */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={toggleLanguage}
            style={[styles.langPill, isRtl && rtlStyles.rtlRow]}
            accessibilityRole="button"
            accessibilityLabel={t.languageSelect}
            accessibilityHint={language === 'ar' ? 'Français' : language === 'fr' ? 'English' : 'العربية'}
          >
            <MaterialCommunityIcons name="translate" size={16} color={colors.primary} />
            <Text style={styles.langText}>
              {language === 'ar' ? 'العربية' : language === 'fr' ? 'FR' : 'EN'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  brandContainer: rowGapSm,
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: titleLg,
  roleSub: {
    fontSize: typography.fontSizes.xs,
    lineHeight: typography.lineHeights.xs,
    color: colors.primary,
    fontWeight: typography.fontWeights.semibold,
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  screenTitle: {
    fontSize: typography.fontSizes.base, lineHeight: typography.lineHeights.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    textAlign: 'center',
  },
  screenSubtitle: {
    fontSize: typography.fontSizes.xs,
    lineHeight: typography.lineHeights.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
  actionsContainer: rowGapXs,
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 48,
    minWidth: 48,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
  },
  langText: {
    fontSize: typography.fontSizes.xs,
    lineHeight: typography.lineHeights.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.primaryDark,
  },
});
