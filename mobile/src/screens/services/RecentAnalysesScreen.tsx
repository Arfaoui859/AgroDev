import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Modal, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { useLanguage } from '../../context/LanguageContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StateView } from '../../components/ui/StateView';
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
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerBox}>
        <View style={[styles.titleRow, isRtl && styles.rtlRow]}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="history" size={26} color={colors.primary} />
          </View>
          <View style={styles.titleTextContainer}>
            <Text style={[styles.mainTitle, isRtl && styles.rtlText]}>{x.recentAnalysesTitle}</Text>
            <Text style={[styles.mainSub, isRtl && styles.rtlText]}>{x.recentAnalysesSubtitle}</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <Card variant="outlined">
          <StateView kind="loading" title={x.stateLoading} compact />
        </Card>
      ) : records.length === 0 ? (
        <Card variant="outlined">
          <StateView
            kind="empty"
            title={x.recentAnalysesEmptyTitle}
            message={x.recentAnalysesEmptyMsg}
            compact
          />
        </Card>
      ) : (
        <>
          <Text style={[styles.tapHint, isRtl && styles.rtlText]}>{x.recentAnalysesTapHint}</Text>
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
                <View style={[styles.cardTop, isRtl && styles.rtlRow]}>
                  <View style={styles.titleArea}>
                    <Text style={[styles.recordTitle, isRtl && styles.rtlText]}>{item.title}</Text>
                    <Text style={[styles.recordDate, isRtl && styles.rtlText]}>
                      <MaterialCommunityIcons name="clock-outline" size={12} color={colors.textMuted} />{' '}
                      {formatDateTime(item.date, language)}
                    </Text>
                  </View>
                  <Badge label={item.badge} variant={item.badgeVariant} size="sm" />
                </View>

                <Text style={[styles.recordSummary, isRtl && styles.rtlText]}>{item.summary}</Text>
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
            <View style={[styles.modalHeader, isRtl && styles.rtlRow]}>
              <Text style={[styles.modalTitle, isRtl && styles.rtlText]}>{detail?.title}</Text>
              <TouchableOpacity
                onPress={() => setDetail(null)}
                accessibilityRole="button"
                accessibilityLabel={x.close}
                style={styles.modalClose}
              >
                <MaterialCommunityIcons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalDate, isRtl && styles.rtlText]}>
              {detail ? formatDateTime(detail.date, language) : ''}
            </Text>
            {detail?.imageUri ? (
              <>
                <Text style={[styles.modalImageLabel, isRtl && styles.rtlText]}>
                  {x.recentAnalysesViewImage}
                </Text>
                <Image source={{ uri: detail.imageUri }} style={styles.modalImage} resizeMode="cover" />
              </>
            ) : null}
            <Text style={[styles.modalSummary, isRtl && styles.rtlText]}>{detail?.summary}</Text>
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  rtlRow: {
    flexDirection: 'row-reverse',
  },
  rtlText: { textAlign: 'right', writingDirection: 'rtl' },
  headerBox: {
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleTextContainer: {
    flex: 1,
  },
  mainTitle: {
    fontSize: typography.fontSizes.lg, lineHeight: 27,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  mainSub: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 20,
  },
  recordsList: {
    gap: spacing.sm,
  },
  tapHint: {
    fontSize: typography.fontSizes.xs,
    lineHeight: 20,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    fontSize: typography.fontSizes.lg, lineHeight: 27,
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
    lineHeight: 20,
    color: colors.textMuted,
    marginTop: 4,
  },
  modalImageLabel: {
    fontSize: typography.fontSizes.xs,
    lineHeight: 20,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: 4,
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: radius.md,
  },
  modalSummary: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
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
    fontSize: typography.fontSizes.sm, lineHeight: 21,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  recordDate: {
    fontSize: typography.fontSizes.xs,
    lineHeight: 20,
    color: colors.textMuted,
    marginTop: 2,
  },
  recordSummary: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    lineHeight: 20,
    marginVertical: spacing.xs,
  },
});
