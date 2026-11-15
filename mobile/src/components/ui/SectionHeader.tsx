import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { rtlStyles } from '../../theme/rtl';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme/colors';
import { flex1 } from '../../theme/layout';
import { subtitleMeta, titleBase } from '../../theme/typographyStyles';
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
    <View style={[styles.header, isRtl && rtlStyles.rtlRow]}>
      <View style={styles.textWrap}>
        <View style={[styles.titleRow, isRtl && rtlStyles.rtlRow]}>
          {icon ? <MaterialCommunityIcons name={icon} size={iconSize} color={colors.primary} /> : null}
          <Text style={[styles.title, isRtl && rtlStyles.rtlText]} numberOfLines={titleNumberOfLines}>
            {title}
          </Text>
        </View>
        {subtitle ? (
          <Text style={[styles.subtitle, isRtl && rtlStyles.rtlText]} numberOfLines={2}>
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
  textWrap: flex1,
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  title: titleBase,
  subtitle: subtitleMeta,
  linkButton: { minHeight: 48, justifyContent: 'center', paddingHorizontal: spacing.xs },
  linkText: {
    fontSize: typography.fontSizes.sm,
    lineHeight: typography.lineHeights.sm,
    color: colors.primary,
    fontWeight: typography.fontWeights.semibold,
  },
});
