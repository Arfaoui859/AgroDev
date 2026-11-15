import React from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { cardPad, flex1, gapMd, screenStyles, sectionHeadRow, stackedCard, summaryRow } from '../../theme/layout';
import { rtlStyles } from '../../theme/rtl';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { mutedCaption, noteCaption, titleSm } from '../../theme/typographyStyles';
import { useLanguage } from '../../context/LanguageContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatTile } from '../../components/ui/StatTile';
import { Badge } from '../../components/ui/Badge';
import { ServiceHeader } from '../../components/ui/ServiceHeader';
import { StateCard } from '../../components/ui/StateCard';
import { useAICapabilities } from '../../hooks/useAICapabilities';

interface MultiAgentAIScreenProps {
  onBack: () => void;
}

/**
 * AI capability explorer.
 *
 * Every card reflects `GET /api/ai/capabilities`, which is the backend's own
 * honest statement of which engine serves each capability. Nothing is invented:
 * a capability that needs an unconfigured model is shown as such instead of a
 * hard-coded "active" agent with a fictional port.
 */
export const MultiAgentAIScreen: React.FC<MultiAgentAIScreenProps> = ({ onBack }) => {
  const { t, x, isRtl, language } = useLanguage();
  const { data, loading, error, reload } = useAICapabilities();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  const engineMeta = (engine: string): { icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string; bg: string; label: string } => {
    switch (engine) {
      case 'llm':
        return { icon: 'robot', color: colors.primaryDark, bg: colors.primaryLight, label: x.aiEngineLlm };
      case 'vision-model':
        return { icon: 'camera-iris', color: colors.primaryDark, bg: colors.primaryLight, label: x.aiEngineVision };
      case 'trained-model':
      case 'microservice':
        return { icon: 'brain', color: colors.secondaryDark, bg: colors.secondaryLight, label: x.aiEngineTrained };
      case 'rule-based':
      case 'heuristic':
        return { icon: 'script-text-outline', color: colors.accentDark, bg: colors.accentLight, label: x.aiEngineRuleBased };
      default:
        return { icon: 'cloud-off-outline', color: colors.textMuted, bg: colors.surfaceSubtle, label: x.aiEngineUnavailable };
    }
  };

  const capabilities = data?.capabilities ?? [];

  return (
    <ScrollView
      style={screenStyles.container}
      contentContainerStyle={screenStyles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
    >
      <ServiceHeader
        icon="brain"
        iconColor={colors.primary}
        iconBg={colors.primaryLight}
        title={x.aiCapTitle}
        subtitle={x.aiCapSubtitle}
      />

      <Card variant="outlined" style={styles.preambleCard}>
        <View style={[styles.provRow, isRtl && rtlStyles.rtlRow]}>
          <MaterialCommunityIcons name="hub" size={16} color={colors.primaryDark} />
          <Text style={styles.preambleTitle}>{x.agentsInAction}</Text>
        </View>
        <Text style={[styles.preambleText, isRtl && rtlStyles.rtlText]}>{x.agentsPreamble}</Text>
      </Card>

      {data?.summary ? (
        <Card variant="elevated" style={styles.summaryCard}>
          <View style={[summaryRow, isRtl && rtlStyles.rtlRow]}>
            <StatTile label={x.aiSummaryTotal} value={data.summary.total} color={colors.text} />
            <StatTile label={x.aiSummaryAvailable} value={data.summary.available} color={colors.success} />
            <StatTile label={x.aiSummaryModelPowered} value={data.summary.modelPowered} color={colors.primary} />
          </View>
          {data.llm ? (
            <View style={[styles.llmRow, isRtl && rtlStyles.rtlRow]}>
              <MaterialCommunityIcons
                name={data.llm.credentialAvailable ? 'check-circle' : 'alert-circle'}
                size={16}
                color={data.llm.credentialAvailable ? colors.success : colors.warning}
              />
              <Text style={styles.llmText}>
                {data.llm.credentialAvailable
                  ? `${x.aiProviderConfigured}${data.llm.provider ? ` (${data.llm.provider})` : ''}`
                  : x.aiProviderNone}
              </Text>
            </View>
          ) : null}
        </Card>
      ) : null}

      {loading && capabilities.length === 0 ? (
        <StateCard kind="loading" title={x.stateLoading} compact />
      ) : error && capabilities.length === 0 ? (
        <StateCard kind="error" title={x.stateError} message={error} onRetry={reload} retryLabel={x.retry} />
      ) : null}

      <View style={styles.agentList}>
        {!loading && !error && capabilities.length === 0 ? (
          <StateCard kind="empty" title={x.stateEmpty} message={x.aiNoCapabilities} compact />
        ) : null}
        {capabilities.map((cap) => {
          const meta = engineMeta(cap.engine);
          const available = cap.available !== false && cap.engine !== 'unavailable';
          return (
            <Card key={cap.id} variant="elevated" style={styles.agentCard}>
              <View style={[styles.agentHeader, isRtl && rtlStyles.rtlRow]}>
                <View style={[styles.agentIconBox, { backgroundColor: meta.bg }]}>
                  <MaterialCommunityIcons name={meta.icon} size={22} color={meta.color} />
                </View>
                <View style={styles.agentTitleArea}>
                  <Text style={[styles.agentNameAr, isRtl && rtlStyles.rtlText]}>
                    {language === 'ar' ? cap.nameAr || cap.name : cap.name}
                  </Text>
                  {language !== 'ar' && cap.nameAr ? (
                    <Text style={[styles.agentNameEn, isRtl && rtlStyles.rtlText]}>{cap.nameAr}</Text>
                  ) : null}
                </View>
                <Badge
                  label={available ? x.aiAvailable : x.aiNotConfigured}
                  variant={available ? 'success' : 'warning'}
                  size="sm"
                />
              </View>

              <View style={styles.provenanceBox}>
                <View style={[styles.provRow, isRtl && rtlStyles.rtlRow]}>
                  <MaterialCommunityIcons name="shield-check" size={14} color={colors.primary} />
                  <Text style={styles.provTitle}>{x.aiEngineProvenanceTitle}</Text>
                </View>
                <Text style={[styles.provDetail, isRtl && rtlStyles.rtlText]}>
                  {language === 'ar' ? cap.provenanceAr || cap.provenance : cap.provenance}
                </Text>
                <Text style={styles.engineText}>{meta.label}</Text>
                {!available && cap.requiresConfiguration ? (
                  <Text style={styles.requirement}>{x.aiRequires}: {cap.requiresConfiguration}</Text>
                ) : null}
              </View>
            </Card>
          );
        })}
      </View>

      <Card variant="outlined" style={styles.noteCard}>
        <Text style={styles.noteText}>{x.aiNote}</Text>
      </Card>

      <Button title={t.back} variant="secondary" onPress={onBack} style={{ marginTop: spacing.lg, marginBottom: spacing.xl }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  summaryCard: stackedCard,
  llmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  llmText: { flex: 1, fontSize: typography.fontSizes.xs, color: colors.textSecondary, lineHeight: typography.lineHeights.sm },
  agentList: gapMd,
  agentCard: cardPad,
  agentHeader: sectionHeadRow,
  agentIconBox: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  agentTitleArea: flex1,
  agentNameAr: titleSm,
  agentNameEn: mutedCaption,
  provenanceBox: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  provRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 2 },
  provTitle: { fontSize: typography.fontSizes.xs, fontWeight: typography.fontWeights.bold, color: colors.primaryDark, lineHeight: typography.lineHeights.xs },
  provDetail: { fontSize: typography.fontSizes.xs, color: colors.text, lineHeight: typography.lineHeights.xs },
  engineText: { fontSize: typography.fontSizes.xs, color: colors.textMuted, marginTop: spacing.xs, lineHeight: typography.lineHeights.xs },
  requirement: { fontSize: typography.fontSizes.xs, color: colors.warning, marginTop: 2, lineHeight: typography.lineHeights.xs },
  preambleCard: { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md },
  preambleTitle: { fontSize: typography.fontSizes.sm, fontWeight: typography.fontWeights.bold, color: colors.primaryDark, lineHeight: typography.lineHeights.sm },
  preambleText: { fontSize: typography.fontSizes.xs, color: colors.textSecondary, lineHeight: typography.lineHeights.sm, marginTop: spacing.xs },
  noteCard: { backgroundColor: colors.primaryLight, borderColor: colors.primary, padding: spacing.md, marginTop: spacing.md },
  noteText: noteCaption,
});
