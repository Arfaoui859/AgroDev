import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { rtlStyles } from '../../theme/rtl';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { useLanguage } from '../../context/LanguageContext';

export interface Step {
  key: string;
  label: string;
}

interface StepperProps {
  steps: Step[];
  activeIndex: number;
  /** Allow tapping back to a completed step. */
  onSelect?: (index: number) => void;
}

/**
 * RTL-aware progress stepper for the plot → measurements → report flow. Keeps
 * the user oriented without adding a heavyweight navigation dependency.
 */
export const Stepper: React.FC<StepperProps> = ({ steps, activeIndex, onSelect }) => {
  const { isRtl } = useLanguage();
  return (
    <View style={[styles.row, isRtl && rtlStyles.rtlRow]}>
      {steps.map((step, index) => {
        const isDone = index < activeIndex;
        const isActive = index === activeIndex;
        const tappable = isDone && !!onSelect;
        return (
          <React.Fragment key={step.key}>
            {index > 0 ? <View style={[styles.connector, (isDone || isActive) && styles.connectorActive]} /> : null}
            <TouchableOpacity
              activeOpacity={tappable ? 0.7 : 1}
              disabled={!tappable}
              onPress={() => onSelect?.(index)}
              accessibilityRole="button"
              accessibilityLabel={step.label}
              accessibilityState={{ selected: isActive }}
              style={styles.step}
            >
              <View style={[styles.circle, isActive && styles.circleActive, isDone && styles.circleDone]}>
                <Text
                  style={[
                    styles.circleText,
                    isActive && styles.circleTextOnPrimary,
                    isDone && styles.circleTextDone,
                  ]}
                >
                  {index + 1}
                </Text>
              </View>
              <Text
                style={[styles.label, isActive && styles.labelActive, isRtl && styles.rtlText]}
                numberOfLines={1}
              >
                {step.label}
              </Text>
            </TouchableOpacity>
          </React.Fragment>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  step: { alignItems: 'center', minHeight: 48, minWidth: 48, justifyContent: 'center', flex: 1 },
  circle: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  circleDone: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  circleText: { fontSize: typography.fontSizes.xs, lineHeight: typography.lineHeights.xs, fontWeight: typography.fontWeights.bold, color: colors.textMuted },
  circleTextOnPrimary: { color: colors.primaryForeground },
  circleTextDone: { color: colors.primaryDark },
  label: { fontSize: typography.fontSizes.xs, lineHeight: typography.lineHeights.xs, color: colors.textMuted, marginTop: 2 },
  labelActive: { color: colors.primaryDark, fontWeight: typography.fontWeights.semibold },
  rtlText: { textAlign: 'center' },
  connector: { height: 2, flex: 0.4, backgroundColor: colors.border },
  connectorActive: { backgroundColor: colors.primary },
});
