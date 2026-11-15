import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { rtlStyles } from '../../theme/rtl';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { useLanguage } from '../../context/LanguageContext';

interface ServiceHeaderProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle?: string;
}

/** Consistent RTL-aware header used by every service screen. */
export const ServiceHeader: React.FC<ServiceHeaderProps> = ({
  icon,
  iconColor,
  iconBg,
  title,
  subtitle,
}) => {
  const { isRtl } = useLanguage();
  return (
    <View style={styles.headerBox}>
      <View style={[styles.titleRow, isRtl && rtlStyles.rtlRow]}>
        <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
          <MaterialCommunityIcons name={icon} size={26} color={iconColor} />
        </View>
        <View style={styles.titleTextContainer}>
          <Text style={[styles.mainTitle, isRtl && rtlStyles.rtlText]}>{title}</Text>
          {subtitle ? <Text style={[styles.mainSub, isRtl && rtlStyles.rtlText]}>{subtitle}</Text> : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerBox: { marginBottom: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleTextContainer: { flex: 1 },
  mainTitle: { fontSize: typography.fontSizes.lg, lineHeight: typography.lineHeights.lg, fontWeight: typography.fontWeights.bold, color: colors.text },
  mainSub: { fontSize: typography.fontSizes.xs, color: colors.textSecondary, marginTop: 2, lineHeight: typography.lineHeights.sm },
});
