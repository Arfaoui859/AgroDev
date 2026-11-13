import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction,
}) => {
  const { language, setLanguage, t, isRtl } = useLanguage();
  const { user } = useAuth();

  const toggleLanguage = () => {
    if (language === 'ar') setLanguage('fr');
    else if (language === 'fr') setLanguage('en');
    else setLanguage('ar');
  };

  const getRoleLabel = () => {
    if (!user) return '';
    switch (user.role) {
      case 'agronomist':
        return t.roleAgronomist;
      case 'veterinarian':
        return t.roleVeterinarian;
      case 'trader':
        return t.roleTrader;
      case 'inspector':
        return t.roleInspector;
      case 'admin':
        return t.roleAdmin;
      case 'farmer':
      default:
        return t.roleFarmer;
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.content, isRtl && styles.rtlRow]}>
        {showBack ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onBack}
            style={styles.backButton}
          >
            <MaterialCommunityIcons
              name={isRtl ? 'chevron-right' : 'chevron-left'}
              size={28}
              color={colors.text}
            />
          </TouchableOpacity>
        ) : (
          <View style={[styles.brandContainer, isRtl && styles.rtlRow]}>
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

        <View style={[styles.actionsContainer, isRtl && styles.rtlRow]}>
          {rightAction}

          {/* Language Toggle Pill */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={toggleLanguage}
            style={styles.langPill}
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
  rtlRow: {
    flexDirection: 'row-reverse',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  roleSub: {
    fontSize: typography.fontSizes.xs,
    color: colors.primary,
    fontWeight: typography.fontWeights.semibold,
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  screenTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    textAlign: 'center',
  },
  screenSubtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSubtle,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  langText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.primaryDark,
  },
});
