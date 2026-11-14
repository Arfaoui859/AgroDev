import React from 'react';
import { View, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { colors, radius, shadows, spacing } from '../../theme/colors';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'elevated' | 'outlined' | 'flat';
  /** Screen-reader label. Only meaningful when `onPress` makes the card a button. */
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  variant = 'elevated',
  accessibilityLabel,
  accessibilityHint,
}) => {
  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'outlined':
        return {
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'flat':
        return {
          backgroundColor: colors.surfaceSubtle,
        };
      case 'elevated':
      default:
        return {
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          ...shadows.sm,
        };
    }
  };

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        style={[styles.card, getVariantStyles(), style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.card, getVariantStyles(), style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    minHeight: 48,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginVertical: spacing.xs,
  },
});
