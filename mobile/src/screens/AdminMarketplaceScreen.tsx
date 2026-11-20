import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { apiRequest } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ScreenHeading } from '../components/ui/ScreenHeading';
import { colors, spacing, typography } from '../theme/colors';

type QueueTab = 'reports' | 'verifications' | 'promotions';
type QueueItem = { id: string; status?: string; created_at?: string; listing?: { title?: string; seller_id?: string; status?: string }; [key: string]: any };

const endpoint: Record<QueueTab, string> = {
  reports: '/api/agro-market/admin/moderation/reports',
  verifications: '/api/agro-market/admin/seller-verifications',
  promotions: '/api/agro-market/admin/promotions',
};

export const AdminMarketplaceScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { language, isRtl } = useLanguage();
  const { user } = useAuth();
  const ar = language === 'ar';
  const fr = language === 'fr';
  const [tab, setTab] = useState<QueueTab>('reports');
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const copy = {
    title: ar ? 'إدارة السوق' : fr ? 'Administration du marché' : 'Marketplace Admin',
    subtitle: ar ? 'مراجعة البلاغات والتوثيق والترقيات' : fr ? 'Modération, vérifications et promotions' : 'Review reports, seller verification and promotions',
    reports: ar ? 'البلاغات' : fr ? 'Signalements' : 'Reports',
    verifications: ar ? 'التوثيق' : fr ? 'Vérifications' : 'Verification',
    promotions: ar ? 'الترقيات' : fr ? 'Promotions' : 'Promotions',
    empty: ar ? 'لا توجد طلبات معلّقة' : fr ? 'Aucune demande en attente' : 'No pending items',
    reload: ar ? 'تحديث' : fr ? 'Actualiser' : 'Refresh',
    reviewing: ar ? 'قيد المراجعة' : fr ? 'En cours' : 'Reviewing',
    resolve: ar ? 'تمت المعالجة' : fr ? 'Résolu' : 'Resolve',
    dismiss: ar ? 'رفض البلاغ' : fr ? 'Ignorer' : 'Dismiss',
    approve: ar ? 'قبول' : fr ? 'Approuver' : 'Approve',
    reject: ar ? 'رفض' : fr ? 'Rejeter' : 'Reject',
    activate: ar ? 'تفعيل 30 يوم' : fr ? 'Activer 30 jours' : 'Activate 30 days',
    denied: ar ? 'هذا الحساب غير مخوّل لإدارة السوق.' : fr ? 'Ce compte ne dispose pas des droits administrateur.' : 'This account is not authorized to administer the marketplace.',
    failed: ar ? 'تعذّر تحميل البيانات أو تنفيذ العملية.' : fr ? 'Chargement ou opération impossible.' : 'Could not load data or complete the action.',
    note: ar ? 'تفعيل الترقية يبدأ فوراً ولمدة 30 يوماً.' : fr ? 'La promotion démarre immédiatement pour 30 jours.' : 'Promotion starts immediately and runs for 30 days.',
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await apiRequest<any>(endpoint[tab]);
    if (res.status === 403 || res.status === 401) {
      setItems([]);
      setError(copy.denied);
    } else if (res.error || !res.data?.success || !Array.isArray(res.data?.data)) {
      setItems([]);
      setError(res.error || copy.failed);
    } else {
      setItems(res.data.data);
    }
    setLoading(false);
  }, [tab, language]);

  useEffect(() => { void load(); }, [load]);

  const update = async (item: QueueItem, action: string) => {
    let body: Record<string, string> = {};
    let path = '';
    if (tab === 'reports') {
      path = endpoint.reports + '/' + encodeURIComponent(item.id);
      body = { status: action, admin_note: '' };
    } else if (tab === 'verifications') {
      path = endpoint.verifications + '/' + encodeURIComponent(item.id);
      body = { status: action, review_note: '' };
    } else {
      path = endpoint.promotions + '/' + encodeURIComponent(item.id);
      const starts = new Date();
      const ends = new Date(starts.getTime() + 30 * 24 * 60 * 60 * 1000);
      body = { status: action, starts_at: starts.toISOString(), ends_at: ends.toISOString() };
    }
    setBusyId(item.id);
    const res = await apiRequest<any>(path, { method: 'PATCH', body: JSON.stringify(body) });
    setBusyId(null);
    if (res.error || !res.data?.success) {
      Alert.alert(copy.failed);
      return;
    }
    setItems(current => current.filter(entry => entry.id !== item.id));
  };

  const titleFor = (item: QueueItem) =>
    item.listing?.title || item.business_name || item.seller_name || item.title ||
    (tab === 'verifications' ? item.registration_number : item.reason) || item.id;
  const detailFor = (item: QueueItem) => {
    if (tab === 'reports') return [item.reason, item.description, item.reporter_id].filter(Boolean).join(' · ');
    if (tab === 'verifications') return [item.business_name, item.seller_id, item.registration_number, ...(Array.isArray(item.evidence_urls) ? item.evidence_urls : [])].filter(Boolean).join(' · ');
    return [item.promotion_type, item.listing?.status, item.listing?.seller_id].filter(Boolean).join(' · ');
  };

  if (user?.role !== 'admin') {
    return <View style={styles.center}><MaterialCommunityIcons name="shield-lock-outline" size={42} color={colors.danger} /><Text style={styles.error}>{copy.denied}</Text><Button title={ar ? 'رجوع' : fr ? 'Retour' : 'Back'} onPress={onBack} /></View>;
  }

  return (
    <View style={styles.container}>
      <ScreenHeading title={copy.title} subtitle={copy.subtitle}
        leading={<Button title={ar ? 'رجوع' : fr ? 'Retour' : 'Back'} onPress={onBack} size="sm" variant="outline" fullWidth={false}
          icon={<MaterialCommunityIcons name={isRtl ? 'arrow-right' : 'arrow-left'} size={18} color={colors.text} />} />} />
      <View style={[styles.tabs, isRtl && styles.rtl]}>
        {(['reports', 'verifications', 'promotions'] as QueueTab[]).map(key => (
          <Button key={key} title={copy[key]} size="sm" variant={tab === key ? 'primary' : 'outline'} onPress={() => setTab(key)} style={styles.tabButton} />
        ))}
      </View>
      <View style={styles.toolbar}>
        <Text style={styles.count}>{items.length} {ar ? 'طلبات' : fr ? 'éléments' : 'pending'}</Text>
        <Button title={copy.reload} size="sm" variant="outline" onPress={() => void load()} loading={loading} />
      </View>
      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} /> : error ? <Card style={styles.notice}><Text style={styles.error}>{error}</Text></Card> : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {items.length === 0 ? <Card style={styles.empty}><MaterialCommunityIcons name="check-circle-outline" size={32} color={colors.success} /><Text style={styles.body}>{copy.empty}</Text></Card> : items.map(item => (
            <Card key={item.id} style={styles.item}>
              <Text style={styles.itemTitle}>{titleFor(item)}</Text>
              {!!detailFor(item) && <Text style={styles.detail} selectable>{detailFor(item)}</Text>}
              {!!item.created_at && <Text style={styles.date}>{new Date(item.created_at).toLocaleString()}</Text>}
              <View style={[styles.actions, isRtl && styles.rtl]}>
                {tab === 'reports' ? <>
                  <Button title={copy.reviewing} size="sm" variant="outline" loading={busyId === item.id} onPress={() => void update(item, 'reviewing')} />
                  <Button title={copy.resolve} size="sm" onPress={() => void update(item, 'resolved')} />
                  <Button title={copy.dismiss} size="sm" variant="danger" onPress={() => void update(item, 'dismissed')} />
                </> : tab === 'verifications' ? <>
                  <Button title={copy.approve} size="sm" onPress={() => void update(item, 'verified')} loading={busyId === item.id} />
                  <Button title={copy.reject} size="sm" variant="danger" onPress={() => void update(item, 'rejected')} />
                </> : <>
                  <Button title={copy.activate} size="sm" onPress={() => { Alert.alert(copy.promotions, copy.note, [{ text: ar ? 'إلغاء' : fr ? 'Annuler' : 'Cancel', style: 'cancel' }, { text: copy.activate, onPress: () => void update(item, 'active') }]); }} loading={busyId === item.id} />
                  <Button title={copy.reject} size="sm" variant="danger" onPress={() => void update(item, 'rejected')} />
                </>}
              </View>
            </Card>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.lg },
  tabs: { flexDirection: 'row', gap: spacing.xs, marginVertical: spacing.md },
  tabButton: { flex: 1 },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  count: { color: colors.textSecondary, fontSize: typography.fontSizes.sm, fontWeight: typography.fontWeights.semibold },
  list: { gap: spacing.sm, paddingBottom: spacing['2xl'] },
  item: { padding: spacing.md, gap: spacing.sm },
  itemTitle: { color: colors.text, fontSize: typography.fontSizes.base, fontWeight: typography.fontWeights.bold },
  detail: { color: colors.textSecondary, fontSize: typography.fontSizes.sm, lineHeight: 20 },
  date: { color: colors.textMuted, fontSize: typography.fontSizes.xs },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  rtl: { flexDirection: 'row-reverse' },
  empty: { padding: spacing.xl, alignItems: 'center', gap: spacing.sm },
  body: { color: colors.textSecondary, fontSize: typography.fontSizes.sm },
  notice: { padding: spacing.md, marginTop: spacing.md },
  error: { color: colors.danger, fontSize: typography.fontSizes.sm, textAlign: 'center' },
});
