import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { rtlStyles } from '../../theme/rtl';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { useLanguage } from '../../context/LanguageContext';

type Kind = 'loading' | 'empty' | 'error' | 'offline' | 'unavailable';

interface StateViewProps {
  kind: Kind;
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  compact?: boolean;
}

const ICONS: Record<Kind, keyof typeof MaterialCommunityIcons.glyphMap> = {
  loading: 'loading',
  empty: 'inbox-outline',
  error: 'alert-circle-outline',
  offline: 'wifi-off',
  unavailable: 'cloud-off-outline',
};

const COLORS: Record<Kind, string> = {
  loading: colors.primary,
  empty: colors.textMuted,
  error: colors.danger,
  offline: colors.warning,
  unavailable: colors.textMuted,
};

/**
 * Uniform loading / empty / error / offline state. Every data-driven screen
 * renders one of these instead of leaving the user with a blank panel.
 */
export const StateView: React.FC<StateViewProps> = ({
  kind,
  title,
  message,
  onRetry,
  retryLabel,
  compact = false,
}) => {
  const { x, isRtl } = useLanguage();
  const tint = COLORS[kind];
  return (
    <View style={[styles.container, compact && styles.compact]}>
      {kind === 'loading' ? (
        <ActivityIndicator size={compact ? 'small' : 'large'} color={tint} />
      ) : (
        <View style={[styles.iconWrap, { backgroundColor: `${tint}18` }]}>
          <MaterialCommunityIcons name={ICONS[kind]} size={compact ? 26 : 40} color={tint} />
        </View>
      )}
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {onRetry && kind !== 'loading' ? (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel={retryLabel ?? x.retry}
          style={[styles.retryBtn, isRtl && rtlStyles.rtlRow]}
        >
          <MaterialCommunityIcons name="refresh" size={16} color={colors.textInverse} />
          <Text style={styles.retryText}>{retryLabel ?? x.retry}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.xl,
  },
  compact: {
    paddingVertical: spacing.lg,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSizes.base, lineHeight: typography.lineHeights.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  message: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.lineHeights.xs,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 48,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    marginTop: spacing.md,
  },
  retryText: {
    color: colors.textInverse,
    fontSize: typography.fontSizes.sm,
    lineHeight: typography.lineHeights.sm,
    fontWeight: typography.fontWeights.bold,
  },
});
