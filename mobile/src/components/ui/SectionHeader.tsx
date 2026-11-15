import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme/colors';
import { useLanguage } from '../../context/LanguageContext';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  /** Leading icon rendered before the title. */
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  /** Icon size; defaults to 20. */
  iconSize?: number;
  /** Trailing "see all" text action. */
  actionLabel?: string;
  onAction?: () => void;
  /** Trailing node (e.g. a Badge) rendered on the right instead of an action. */
  trailing?: React.ReactNode;
  /** Accessibility label for the action; defaults to the visible label. */
  actionAccessibilityLabel?: string;
  /** Max lines for the title; defaults to 1 (rows carry a trailing control). */
  titleNumberOfLines?: number;
}

/**
 * The single section-title treatment used across Home and the service screens:
 * an optional icon, a bold title, an optional one-line subtitle and either a
 * "see all" action or a trailing badge. Centralising it keeps every section
 * heading visually identical and RTL-correct.
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  icon,
  iconSize = 20,
  actionLabel,
  onAction,
  trailing,
  actionAccessibilityLabel,
  titleNumberOfLines = 1,
}) => {
  const { isRtl } = useLanguage();
  const showAction = !!actionLabel && !!onAction;

  return (
    <View style={[styles.header, isRtl && styles.rtlRow]}>
      <View style={styles.textWrap}>
        <View style={[styles.titleRow, isRtl && styles.rtlRow]}>
          {icon ? <MaterialCommunityIcons name={icon} size={iconSize} color={colors.primary} /> : null}
          <Text style={[styles.title, isRtl && styles.rtlText]} numberOfLines={titleNumberOfLines}>
            {title}
          </Text>
        </View>
        {subtitle ? (
          <Text style={[styles.subtitle, isRtl && styles.rtlText]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {trailing}

      {showAction ? (
        <TouchableOpacity
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionAccessibilityLabel ?? actionLabel}
          hitSlop={12}
          style={styles.linkButton}
        >
          <Text style={styles.linkText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  textWrap: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  title: {
    fontSize: typography.fontSizes.base,
    lineHeight: 24,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.fontSizes.xs,
    lineHeight: 20,
    color: colors.textSecondary,
    marginTop: 2,
  },
  linkButton: { minHeight: 48, justifyContent: 'center', paddingHorizontal: spacing.xs },
  linkText: {
    fontSize: typography.fontSizes.sm,
    lineHeight: 21,
    color: colors.primary,
    fontWeight: typography.fontWeights.semibold,
  },
  rtlRow: { flexDirection: 'row-reverse' },
  rtlText: { textAlign: 'right', writingDirection: 'rtl' },
});
