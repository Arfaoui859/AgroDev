import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { rtlStyles } from '../../theme/rtl';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography, shadows } from '../../theme/colors';
import { stackLg } from '../../theme/layout';
import { useLanguage } from '../../context/LanguageContext';
import { SectionHeader } from '../ui/SectionHeader';
import { AICapability } from '../../types';

interface IntelligenceStripProps {
  capabilities: AICapability[];
  loading: boolean;
  error: string | null;
  /** Open the full capability matrix (the Multi-Agent / capabilities screen). */
  onOpenCapabilities: () => void;
  /** Navigate to the service that backs a capability, when one exists. */
  onOpenService: (serviceId: string) => void;
}

/**
 * A single, honest read of what the platform can actually do right now. Every
 * chip is driven by the gateway's own `/api/ai/capabilities` document — a
 * capability whose engine is `unavailable` is shown as unavailable rather than
 * hidden or dressed up. No number here is estimated.
 */
const CAPABILITY_ICON: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  'soil-analysis': 'flask-outline',
  'lab-soil-models': 'test-tube',
  'crop-recommendation': 'sprout-outline',
  'climate-crop-matcher': 'thermometer-lines',
  'plant-disease-detection': 'camera-iris',
  'leaf-scan': 'leaf',
  'pest-control': 'bug-outline',
  'weather-yield-planner': 'weather-partly-cloudy',
  'yield-predictor': 'chart-areaspline',
  'irrigation-optimizer': 'water-pump',
  'market-forecast': 'chart-line',
  'supply-demand': 'scale-balance',
  'smart-match': 'swap-horizontal-bold',
  'farming-tasks-planner': 'clipboard-list-outline',
  'agro-chat': 'robot-outline',
  'alert-notifier': 'bell-ring-outline',
};

/** Service id a capability maps to, so a tap opens the real screen. */
const CAPABILITY_SERVICE: Record<string, string> = {
  'soil-analysis': 'soil',
  'lab-soil-models': 'soil',
  'crop-recommendation': 'crops',
  'climate-crop-matcher': 'crops',
  'plant-disease-detection': 'live_scan',
  'leaf-scan': 'live_scan',
  'pest-control': 'pest',
  'weather-yield-planner': 'weather',
  'yield-predictor': 'weather',
  'irrigation-optimizer': 'irrigation',
  'market-forecast': 'marketplace',
  'supply-demand': 'marketplace',
  'smart-match': 'crops',
  'farming-tasks-planner': 'farms',
  'agro-chat': 'assistant',
  'alert-notifier': 'notifications',
};

export const IntelligenceStrip: React.FC<IntelligenceStripProps> = ({
  capabilities,
  loading,
  error,
  onOpenCapabilities,
  onOpenService,
}) => {
  const { t, x, isRtl } = useLanguage();

  // Keep the strip short and relevant: the capabilities that power the primary
  // services, in a stable order. Yield prediction is included so its honest
  // unavailable state is visible rather than silently hidden.
  const ORDER = [
    'soil-analysis',
    'crop-recommendation',
    'plant-disease-detection',
    'pest-control',
    'irrigation-optimizer',
    'market-forecast',
    'yield-predictor',
    'agro-chat',
    'weather-yield-planner',
  ];
  const byId = new Map(capabilities.map((c) => [c.id, c]));
  const shown = ORDER.map((id) => byId.get(id)).filter((c): c is AICapability => Boolean(c));

  return (
    <View style={styles.section}>
      <SectionHeader
        title={t.homeIntelTitle}
        subtitle={t.homeIntelSubtitle}
        actionLabel={t.viewAll}
        onAction={onOpenCapabilities}
        actionAccessibilityLabel={t.multiAgentAiName}
      />

      {loading ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.chip, styles.chipSkeleton]} />
          ))}
        </ScrollView>
      ) : error || shown.length === 0 ? (
        <View style={[styles.errorBox, isRtl && rtlStyles.rtlRow]}>
          <MaterialCommunityIcons name="cloud-off-outline" size={16} color={colors.textMuted} />
          <Text style={[styles.errorText, isRtl && rtlStyles.rtlText]}>{x.stateUnavailable}</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.row, isRtl && rtlStyles.rtlRow]}
        >
          {shown.map((cap) => {
            const available = cap.engine !== 'unavailable';
            const name = isRtl ? cap.nameAr || cap.name : cap.name;
            const serviceId = CAPABILITY_SERVICE[cap.id];
            return (
              <TouchableOpacity
                key={cap.id}
                activeOpacity={0.85}
                // An unavailable capability must not pretend its service works:
                // route to the honest capability matrix instead of a screen that
                // would only surface a 503.
                onPress={() => (available && serviceId ? onOpenService(serviceId) : onOpenCapabilities())}
                accessibilityRole="button"
                accessibilityLabel={`${name}. ${available ? t.homeIntelAvailable : t.homeIntelUnavailable}`}
                style={[styles.chip, isRtl && rtlStyles.rtlRow, available ? styles.chipOn : styles.chipOff]}
              >
                <MaterialCommunityIcons
                  name={CAPABILITY_ICON[cap.id] ?? 'brain'}
                  size={18}
                  color={available ? colors.primary : colors.textMuted}
                />
                <Text style={[styles.chipText, !available && styles.chipTextOff]} numberOfLines={1}>
                  {name}
                </Text>
                <View
                  style={[styles.dot, { backgroundColor: available ? colors.success : colors.textMuted }]}
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: stackLg,
  row: { gap: spacing.sm, paddingVertical: 2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    backgroundColor: colors.card,
    ...shadows.sm,
  },
  chipOn: { borderColor: colors.primaryLight },
  chipOff: { borderColor: colors.border, backgroundColor: colors.surfaceSubtle },
  chipSkeleton: { width: 132, borderColor: colors.border, backgroundColor: colors.surfaceSubtle },
  chipText: { fontSize: typography.fontSizes.xs, lineHeight: typography.lineHeights.xs, color: colors.text, fontWeight: typography.fontWeights.semibold, maxWidth: 150 },
  chipTextOff: { color: colors.textMuted, fontWeight: typography.fontWeights.medium },
  dot: { width: 8, height: 8, borderRadius: radius.full, marginLeft: 2 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorText: { flex: 1, fontSize: typography.fontSizes.xs, lineHeight: typography.lineHeights.xs, color: colors.textMuted },
});
