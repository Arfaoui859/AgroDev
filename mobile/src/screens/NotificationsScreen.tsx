import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { StateView } from '../components/ui/StateView';
import { ProvenanceBadge } from '../components/ui/ProvenanceBadge';
import { getNotifications, markNotificationRead } from '../api/client';
import { AppNotification, ProvenanceMeta } from '../types';
import { useConnectivity } from '../hooks/useConnectivity';
import { formatDateTime } from '../utils/date';
import { notificationPriorityLabel } from '../utils/notifications';

interface NotificationsScreenProps {
  onBack: () => void;
}

/**
 * Notifications are read from the platform's `notifications` table through the
 * gateway, which requires a verified session. When the store is not connected
 * the endpoint answers 503 and this screen says so instead of showing samples.
 */
export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onBack }) => {
  const { t, x, isRtl, language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { isOnline } = useConnectivity();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<ProvenanceMeta>({ provenance: 'database', isRealData: false });

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setError(null);
    const res = await getNotifications();
    setItems(res.data);
    setUnavailable(res.unavailable);
    setError(res.error);
    setMeta(res.meta ?? { provenance: 'database', isRealData: false });
    setLoading(false);
  }, [isAuthenticated]);

  React.useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const priorityVariant = (p: string) =>
    p === 'critical' || p === 'high' ? 'danger' : p === 'medium' ? 'warning' : 'secondary';

  const handleMarkRead = async (item: AppNotification) => {
    if (item.readAt) return;
    // Optimistically reflect the tap, then revert if the server rejects it.
    setItems((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n)),
    );
    const res = await markNotificationRead(item.id);
    if (!res.ok) {
      setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, readAt: null } : n)));
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
    >
      <View style={[styles.header, isRtl && styles.rtlRow]}>
        <MaterialCommunityIcons name="bell-outline" size={24} color={colors.primary} />
        <Text style={[styles.title, isRtl && styles.rtlText]}>{x.notificationsTitle}</Text>
      </View>

      {!isAuthenticated ? (
        <Card variant="outlined">
          <StateView kind="unavailable" title={x.loginRequired} message={x.loginRequiredDesc} />
        </Card>
      ) : loading ? (
        <Card variant="outlined">
          <StateView kind="loading" title={x.stateLoading} compact />
        </Card>
      ) : unavailable ? (
        <Card variant="outlined">
          <StateView kind="unavailable" title={x.stateUnavailable} message={error || undefined} />
        </Card>
      ) : error && items.length === 0 ? (
        <Card variant="outlined">
          <StateView
            kind={isOnline ? 'error' : 'offline'}
            title={isOnline ? x.stateError : x.stateOffline}
            message={error}
            onRetry={load}
            retryLabel={x.retry}
          />
        </Card>
      ) : items.length === 0 ? (
        <Card variant="outlined">
          <StateView kind="empty" title={x.notificationsEmpty} compact />
        </Card>
      ) : (
        <View style={styles.list}>
          <View style={[styles.provBar, isRtl && styles.rtlRow]}>
            <ProvenanceBadge meta={meta} />
          </View>
          {items.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={item.readAt ? 1 : 0.85}
              onPress={() => handleMarkRead(item)}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}. ${item.message}`}
              accessibilityState={{ disabled: Boolean(item.readAt) }}
              style={styles.notificationTouchable}
            >
              <Card variant="elevated" style={[styles.card, item.readAt ? null : styles.unreadCard]}>
                <View style={[styles.cardHeader, isRtl && styles.rtlRow]}>
                  <Text style={[styles.cardTitle, isRtl && styles.rtlText]}>{item.title}</Text>
                  <Badge label={notificationPriorityLabel(item.priority, x)} variant={priorityVariant(item.priority)} size="sm" />
                </View>
                <Text style={[styles.cardMessage, isRtl && styles.rtlText]}>{item.message}</Text>
                <View style={[styles.cardFooter, isRtl && styles.rtlRow]}>
                  {!item.readAt ? (
                    <View style={[styles.unreadDot, isRtl && styles.rtlRow]}>
                      <View style={styles.dot} />
                      <Text style={styles.unreadText}>{x.notificationUnread}</Text>
                    </View>
                  ) : (
                    <View />
                  )}
                  <Text style={styles.cardDate}>{formatDateTime(item.createdAt, language)}</Text>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Button title={t.back} variant="outline" onPress={onBack} style={{ marginTop: spacing.lg, marginBottom: spacing.xl }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing['3xl'] },
  rtlRow: { flexDirection: 'row-reverse' },
  rtlText: { textAlign: 'right', writingDirection: 'rtl' },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  title: { fontSize: typography.fontSizes.xl, lineHeight: 30, fontWeight: typography.fontWeights.bold, color: colors.text },
  list: { gap: spacing.sm },
  provBar: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  notificationTouchable: { minHeight: 48 },
  card: { padding: spacing.md },
  unreadCard: { borderColor: colors.primary, borderWidth: 1.5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm, marginBottom: 4 },
  cardTitle: { flex: 1, fontSize: typography.fontSizes.sm, lineHeight: 21, fontWeight: typography.fontWeights.bold, color: colors.text },
  cardMessage: { fontSize: typography.fontSizes.xs, color: colors.textSecondary, lineHeight: 21 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceSubtle,
  },
  unreadDot: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  unreadText: { fontSize: typography.fontSizes.xs, color: colors.primary, fontWeight: typography.fontWeights.semibold, lineHeight: 20 },
  cardDate: { fontSize: typography.fontSizes.xs, color: colors.textMuted, lineHeight: 20 },
});
