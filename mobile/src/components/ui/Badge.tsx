import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, typography } from '../../theme/colors';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'soil' | 'disease';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'primary', size = 'sm' }) => {
  const getColors = () => {
    switch (variant) {
      case 'success':
        return { bg: colors.successLight, text: colors.success };
      case 'warning':
        return { bg: colors.warningLight, text: colors.warning };
      case 'danger':
      case 'disease':
        return { bg: colors.dangerLight, text: colors.danger };
      case 'secondary':
        return { bg: colors.secondaryLight, text: colors.secondaryDark };
      case 'accent':
      case 'soil':
        return { bg: colors.accentLight, text: colors.accentDark };
      case 'info':
        return { bg: colors.infoLight, text: colors.info };
      case 'primary':
      default:
        return { bg: colors.primaryLight, text: colors.primaryDark };
    }
  };

  const { bg, text } = getColors();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bg },
        size === 'sm' ? styles.badgeSm : styles.badgeMd,
      ]}
    >
      <Text style={[styles.text, { color: text }, size === 'sm' ? styles.textSm : styles.textMd]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeMd: {
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  text: {
    fontWeight: typography.fontWeights.semibold,
  },
  textSm: {
    fontSize: typography.fontSizes.xs,
  },
  textMd: {
    fontSize: typography.fontSizes.sm,
  },
});
