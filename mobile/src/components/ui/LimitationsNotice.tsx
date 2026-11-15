import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { rtlStyles } from '../../theme/rtl';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { noteCaption } from '../../theme/typographyStyles';
import { useLanguage } from '../../context/LanguageContext';

interface LimitationsNoticeProps {
  title: string;
  text: string;
  /** Extra spacing, since callers place it in a card or directly in a scroll. */
  style?: StyleProp<ViewStyle>;
}

/**
 * The "limits of use" callout shown under image-based results (plant scanner
 * and disease detection). It states plainly that the result is indicative and
 * must be confirmed, so the same treatment is used wherever a result is shown.
 */
export const LimitationsNotice: React.FC<LimitationsNoticeProps> = ({ title, text, style }) => {
  const { isRtl } = useLanguage();
  return (
    <View style={[styles.box, style]}>
      <Text style={[styles.title, isRtl && rtlStyles.rtlText]}>{title}</Text>
      <Text style={[styles.text, isRtl && rtlStyles.rtlText]}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  title: {
    fontSize: typography.fontSizes.sm,
    lineHeight: typography.lineHeights.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  text: noteCaption,
});
