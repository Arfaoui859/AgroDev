import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { rtlStyles } from '../../theme/rtl';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { radius } from '../../theme/colors';
import { flex1, rowGapMd, stackMd } from '../../theme/layout';
import { subtitleMeta, titleLg } from '../../theme/typographyStyles';
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
  headerBox: stackMd,
  titleRow: rowGapMd,
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleTextContainer: flex1,
  mainTitle: titleLg,
  mainSub: subtitleMeta,
});
