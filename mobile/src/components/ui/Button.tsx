import React from 'react';
import { rtlStyles } from '../../theme/rtl';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { useLanguage } from '../../context/LanguageContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'lg',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  fullWidth = true,
}) => {
  const { isRtl } = useLanguage();
  const getButtonStyles = (): ViewStyle => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: colors.secondaryLight,
          borderColor: colors.secondary,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: colors.borderStrong,
        };
      case 'danger':
        return {
          backgroundColor: colors.danger,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
        };
      case 'primary':
      default:
        return {
          backgroundColor: colors.primary,
        };
    }
  };

  const getTextColor = (): string => {
    if (disabled) return colors.textMuted;
    switch (variant) {
      case 'secondary':
        return colors.secondaryDark;
      case 'outline':
        return colors.text;
      case 'ghost':
        return colors.primary;
      case 'danger':
      case 'primary':
      default:
        return colors.textInverse;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={[
        styles.base,
        size === 'lg' ? styles.sizeLg : size === 'sm' ? styles.sizeSm : styles.sizeMd,
        fullWidth && styles.fullWidth,
        getButtonStyles(),
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <View style={[styles.content, isRtl && rtlStyles.rtlRow]}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text
            style={[
              styles.text,
              { color: getTextColor() },
              size === 'lg' ? styles.textLg : size === 'sm' ? styles.textSm : styles.textMd,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  // Every button meets the 48dp minimum touch target. `sm` keeps a lighter
  // visual weight through padding/typography, not by shrinking the tappable
  // area below the accessibility minimum.
  sizeSm: {
    minHeight: 48,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  sizeMd: {
    minHeight: 48,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  sizeLg: {
    minHeight: 52, // Mobile accessibility standard (>= 48)
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginHorizontal: spacing.sm,
  },
  text: {
    fontWeight: typography.fontWeights.bold,
    textAlign: 'center',
  },
  textSm: {
    fontSize: typography.fontSizes.xs,
    lineHeight: typography.lineHeights.xs,
  },
  textMd: {
    fontSize: typography.fontSizes.sm,
    lineHeight: typography.lineHeights.sm,
  },
  textLg: {
    fontSize: typography.fontSizes.base,
    lineHeight: typography.lineHeights.base,
  },
  disabled: {
    opacity: 0.5,
    backgroundColor: colors.surfaceSubtle,
  },
});
