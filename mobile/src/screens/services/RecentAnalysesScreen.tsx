import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Modal, Alert } from 'react-native';
import { screenStyles } from '../../theme/layout';
import { rtlStyles } from '../../theme/rtl';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { useLanguage } from '../../context/LanguageContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ServiceHeader } from '../../components/ui/ServiceHeader';
import { StateCard } from '../../components/ui/StateCard';
import { clearHistory, getHistory } from '../../api/history';
import { SavedAnalysis } from '../../types';
import { formatDateTime } from '../../utils/date';

interface RecentAnalysesScreenProps {
  onBack: () => void;
  onSelectAnalysis?: (analysis: SavedAnalysis) => void;
}

export const RecentAnalysesScreen: React.FC<RecentAnalysesScreenProps> = ({
  onBack,
  onSelectAnalysis,
}) => {
  const { t, x, isRtl, language } = useLanguage();
  const [records, setRecords] = useState<SavedAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<SavedAnalysis | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setRecords(await getHistory());
    setLoading(false);
  }, []);

  React.useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  const handleClear = () => {
    Alert.alert(x.recentAnalysesClear, x.recentAnalysesClearConfirm, [
      { text: x.cancel, style: 'cancel' },
      {
        text: x.recentAnalysesClear,
        style: 'destructive',
        onPress: async () => {
          await clearHistory();
          setRecords([]);
        },
      },
    ]);
  };

  const handleOpen = (item: SavedAnalysis) => {
    // A saved record stores only a summary, so the honest detail view shows the
    // stored summary plus any attached image. Re-running the producing service
    // is offered as an explicit action inside the sheet.
    setDetail(item);
  };

  return (
    <ScrollView
      style={screenStyles.container}
      contentContainerStyle={screenStyles.content}
      showsVerticalScrollIndicator={false}
    >
      <ServiceHeader
        icon="history"
        iconColor={colors.primary}
        iconBg={colors.primaryLight}
        title={x.recentAnalysesTitle}
        subtitle={x.recentAnalysesSubtitle}
      />

      {loading ? (
        <StateCard kind="loading" title={x.stateLoading} compact />
      ) : records.length === 0 ? (
        <StateCard kind="empty" title={x.recentAnalysesEmptyTitle} message={x.recentAnalysesEmptyMsg} compact />
      ) : (
        <>
          <Text style={[styles.tapHint, isRtl && rtlStyles.rtlText]}>{x.recentAnalysesTapHint}</Text>
          <View style={styles.recordsList}>
            {records.map((item) => (
              <Card
                key={item.id}
                variant="elevated"
                onPress={() => handleOpen(item)}
                style={styles.recordCard}
                accessibilityLabel={`${item.title} — ${item.badge}`}
                accessibilityHint={x.recentAnalysesTapHint}
              >
                <View style={[styles.cardTop, isRtl && rtlStyles.rtlRow]}>
                  <View style={styles.titleArea}>
                    <Text style={[styles.recordTitle, isRtl && rtlStyles.rtlText]}>{item.title}</Text>
                    <Text style={[styles.recordDate, isRtl && rtlStyles.rtlText]}>
                      <MaterialCommunityIcons name="clock-outline" size={12} color={colors.textMuted} />{' '}
                      {formatDateTime(item.date, language)}
                    </Text>
                  </View>
                  <Badge label={item.badge} variant={item.badgeVariant} size="sm" />
                </View>

                <Text style={[styles.recordSummary, isRtl && rtlStyles.rtlText]}>{item.summary}</Text>
              </Card>
            ))}
          </View>

          <Button
            title={x.recentAnalysesClear}
            variant="outline"
            onPress={handleClear}
            style={{ marginTop: spacing.md }}
          />
        </>
      )}

      <Button
        title={t.back}
        variant="outline"
        onPress={onBack}
        style={{ marginTop: spacing.lg, marginBottom: spacing.xl }}
      />

      <Modal
        visible={!!detail}
        transparent
        animationType="slide"
        onRequestClose={() => setDetail(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={[styles.modalHeader, isRtl && rtlStyles.rtlRow]}>
              <Text style={[styles.modalTitle, isRtl && rtlStyles.rtlText]}>{detail?.title}</Text>
              <TouchableOpacity
                onPress={() => setDetail(null)}
                accessibilityRole="button"
                accessibilityLabel={x.close}
                style={styles.modalClose}
              >
                <MaterialCommunityIcons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalDate, isRtl && rtlStyles.rtlText]}>
              {detail ? formatDateTime(detail.date, language) : ''}
            </Text>
            {detail?.imageUri ? (
              <>
                <Text style={[styles.modalImageLabel, isRtl && rtlStyles.rtlText]}>
                  {x.recentAnalysesViewImage}
                </Text>
                <Image source={{ uri: detail.imageUri }} style={styles.modalImage} resizeMode="cover" />
              </>
            ) : null}
            <Text style={[styles.modalSummary, isRtl && rtlStyles.rtlText]}>{detail?.summary}</Text>
            {onSelectAnalysis && detail ? (
              <Button
                title={x.recentAnalysesRunAgain}
                variant="primary"
                onPress={() => {
                  const current = detail;
                  setDetail(null);
                  onSelectAnalysis(current);
                }}
                style={{ marginTop: spacing.md }}
              />
            ) : null}
            <Button title={x.close} variant="outline" onPress={() => setDetail(null)} style={{ marginTop: spacing.sm }} />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  recordsList: {
    gap: spacing.sm,
  },
  tapHint: {
    fontSize: typography.fontSizes.xs,
    lineHeight: typography.lineHeights.xs,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalTitle: {
    flex: 1,
    fontSize: typography.fontSizes.lg, lineHeight: typography.lineHeights.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  modalClose: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSubtle,
  },
  modalDate: {
    fontSize: typography.fontSizes.xs,
    lineHeight: typography.lineHeights.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  modalImageLabel: {
    fontSize: typography.fontSizes.xs,
    lineHeight: typography.lineHeights.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: radius.md,
  },
  modalSummary: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: typography.lineHeights.xs,
    marginTop: spacing.md,
  },
  recordCard: {
    padding: spacing.md,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  titleArea: {
    flex: 1,
  },
  recordTitle: {
    fontSize: typography.fontSizes.sm, lineHeight: typography.lineHeights.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  recordDate: {
    fontSize: typography.fontSizes.xs,
    lineHeight: typography.lineHeights.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  recordSummary: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    lineHeight: typography.lineHeights.xs,
    marginVertical: spacing.xs,
  },
});
