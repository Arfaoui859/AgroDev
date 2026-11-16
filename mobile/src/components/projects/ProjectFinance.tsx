import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { rtlStyles } from '../../theme/rtl';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme/colors';
import { rowGapSm, spaceBetween, stackSm, stackedCard } from '../../theme/layout';
import {
  cardHeading,
  labelSemibold,
  mutedCaption,
  mutedCaptionTop,
  titleBase,
} from '../../theme/typographyStyles';
import { useLanguage } from '../../context/LanguageContext';
import { getProjects } from '../../i18n/projects';
import { formatNumber } from '../../utils/date';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { FormField } from '../ui/FormField';
import { StateView } from '../ui/StateView';
import { ProvenanceBar } from '../ui/ProvenanceBar';
import {
  createProjectExpense,
  createProjectRevenue,
  getProjectFinancialSummary,
} from '../../api/client';
import { ProjectFinancialSummary, ProvenanceMeta } from '../../types';
import { expenseCategoryOptions } from '../../utils/projectLabels';

interface ProjectFinanceProps {
  farmId: string;
  cultivationId: string;
  cropName?: string;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

/** A labelled amount row for the financial summary. */
const AmountRow: React.FC<{ label: string; value: number; language: string; strong?: boolean; negative?: boolean }> = ({
  label,
  value,
  language,
  strong,
  negative,
}) => {
  const { isRtl } = useLanguage();
  return (
    <View style={[styles.amountRow, isRtl && rtlStyles.rtlRow]}>
      <Text style={[styles.amountLabel, isRtl && rtlStyles.rtlText]}>{label}</Text>
      <Text
        style={[
          styles.amountValue,
          strong && styles.amountStrong,
          negative && value < 0 && styles.amountNegative,
        ]}
      >
        {formatNumber(value, language)}
      </Text>
    </View>
  );
};

/**
 * Financial result for the signed-in user. The summary is computed server-side
 * (`GET /api/financial-summary`) from the persisted `farm_expenses` and
 * `farm_revenues` tables — the app never recomputes or estimates a profit. The
 * server aggregates the whole account, so the UI states that scope explicitly
 * rather than implying a per-project figure it cannot produce.
 */
export const ProjectFinance: React.FC<ProjectFinanceProps> = ({ farmId, cultivationId, cropName }) => {
  const { x, isRtl, language } = useLanguage();
  const p = useMemo(() => getProjects(language), [language]);

  const [summary, setSummary] = useState<ProjectFinancialSummary | null>(null);
  const [meta, setMeta] = useState<ProvenanceMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleBlocked, setRoleBlocked] = useState(false);

  const [mode, setMode] = useState<'none' | 'expense' | 'revenue'>('none');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayIso());
  const [category, setCategory] = useState('seeds');
  const [description, setDescription] = useState('');
  const [supplier, setSupplier] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [buyer, setBuyer] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProjectFinancialSummary(farmId, cultivationId);
      setSummary(res.data);
      setMeta(res.meta);
      setError(res.error);
      setRoleBlocked(res.roleBlocked);
    } catch {
      setError(p.saveFailed);
    } finally {
      setLoading(false);
    }
  }, [farmId, cultivationId, p.saveFailed]);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  const resetForm = () => {
    setAmount('');
    setDate(todayIso());
    setDescription('');
    setSupplier('');
    setQuantity('');
    setUnitPrice('');
    setBuyer('');
    setFormError(null);
    setMode('none');
  };

  const submit = async () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setFormError(p.invalidAmount);
      return;
    }
    const parsedDate = new Date(date + 'T00:00:00.000Z');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsedDate.valueOf()) || parsedDate.toISOString().slice(0, 10) !== date) {
      setFormError(p.invalidDate);
      return;
    }
    if (mode === 'revenue') {
      const parsedQuantity = quantity.trim() ? Number(quantity) : undefined;
      const parsedUnitPrice = unitPrice.trim() ? Number(unitPrice) : undefined;
      if ((parsedQuantity !== undefined && (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0)) ||
          (parsedUnitPrice !== undefined && (!Number.isFinite(parsedUnitPrice) || parsedUnitPrice <= 0))) {
        setFormError(p.invalidAmount);
        return;
      }
    }
    setSaving(true);
    setFormError(null);
    try {
      const res = mode === 'expense'
        ? await createProjectExpense({
            amount: value, date, category, farm_id: farmId, cultivation_id: cultivationId, cropRelated: cropName,
            description: description || undefined, supplier: supplier || undefined,
          })
        : await createProjectRevenue({
            amount: value, date, farm_id: farmId, cultivation_id: cultivationId, cropRelated: cropName,
            quantity: quantity ? Number(quantity) : undefined,
            unitPrice: unitPrice ? Number(unitPrice) : undefined,
            buyer: buyer || undefined, description: description || undefined,
          });
      if (res.roleBlocked) {
        setRoleBlocked(true);
        return;
      }
      if (res.error || !res.data) {
        setFormError(res.error || p.saveFailed);
        return;
      }
      setNotice(mode === 'expense' ? p.expenseCreated : p.revenueCreated);
      resetForm();
      await load();
    } catch {
      setFormError(p.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card variant="outlined" style={styles.card}>
      <Text style={[styles.headTitle, isRtl && rtlStyles.rtlText]}>{p.financeHeading}</Text>
      <Text style={[styles.scope, isRtl && rtlStyles.rtlText]}>{p.financeScopeNote}</Text>

      {roleBlocked ? (
        <StateView kind="unavailable" title={p.roleBlockedTitle} message={p.roleBlockedBody} compact />
      ) : loading ? (
        <StateView kind="loading" title={p.financeHeading} compact />
      ) : error ? (
        <StateView kind="error" message={error} onRetry={load} retryLabel={x.retry} compact />
      ) : !summary || (summary.expenseCount === 0 && summary.revenueCount === 0) ? (
        <StateView kind="empty" title={p.noFinanceData} compact />
      ) : (
        <View style={styles.summary}>
          <AmountRow label={p.totalExpenses} value={summary.totalExpenses} language={language} />
          <AmountRow label={p.grossRevenue} value={summary.grossRevenue} language={language} />
          {summary.salesCosts > 0 ? (
            <AmountRow label={p.salesCosts} value={summary.salesCosts} language={language} />
          ) : null}
          <AmountRow label={p.netProfit} value={summary.netProfit} language={language} strong negative />
        </View>
      )}

      {notice ? <Text style={[styles.notice, isRtl && rtlStyles.rtlText]}>{notice}</Text> : null}

      {!roleBlocked && !loading && !error ? (
        <>
          <View style={[styles.actions, isRtl && rtlStyles.rtlRow]}>
            <TouchableOpacity
              style={[styles.actionBtn, isRtl && rtlStyles.rtlRow]}
              onPress={() => {
                setNotice(null);
                setMode((m) => (m === 'expense' ? 'none' : 'expense'));
              }}
              accessibilityRole="button"
              accessibilityLabel={p.recordExpense}
            >
              <MaterialCommunityIcons name="cash-minus" size={18} color={colors.danger} />
              <Text style={styles.actionText}>{p.recordExpense}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, isRtl && rtlStyles.rtlRow]}
              onPress={() => {
                setNotice(null);
                setMode((m) => (m === 'revenue' ? 'none' : 'revenue'));
              }}
              accessibilityRole="button"
              accessibilityLabel={p.recordRevenue}
            >
              <MaterialCommunityIcons name="cash-plus" size={18} color={colors.success} />
              <Text style={styles.actionText}>{p.recordRevenue}</Text>
            </TouchableOpacity>
          </View>

          {mode !== 'none' ? (
            <View style={styles.form}>
              <FormField
                label={mode === 'expense' ? p.expenseAmount : p.revenueAmount}
                value={amount}
                onChangeText={setAmount}
              />
              <FormField label={p.expenseDate} value={date} onChangeText={setDate} keyboard="default" hint="YYYY-MM-DD" />
              {mode === 'expense' ? (
                <>
                  <Text style={[styles.pickerLabel, isRtl && rtlStyles.rtlText]}>{p.expenseCategory}</Text>
                  <View style={[styles.chipRow, isRtl && rtlStyles.rtlRow]}>
                    {expenseCategoryOptions(p).map((opt) => (
                      <Chip
                        key={opt.value}
                        label={opt.label}
                        selected={category === opt.value}
                        onPress={() => setCategory(opt.value)}
                      />
                    ))}
                  </View>
                  <FormField
                    label={p.expenseDescription}
                    value={description}
                    onChangeText={setDescription}
                    keyboard="default"
                  />
                  <FormField
                    label={p.expenseSupplier}
                    value={supplier}
                    onChangeText={setSupplier}
                    keyboard="default"
                  />
                </>
              ) : (
                <>
                  <FormField label={p.revenueQuantity} value={quantity} onChangeText={setQuantity} />
                  <FormField label={p.revenueUnitPrice} value={unitPrice} onChangeText={setUnitPrice} />
                  <FormField label={p.revenueBuyer} value={buyer} onChangeText={setBuyer} keyboard="default" />
                  <FormField
                    label={p.expenseDescription}
                    value={description}
                    onChangeText={setDescription}
                    keyboard="default"
                  />
                </>
              )}
              {formError ? (
                <Text style={[styles.formError, isRtl && rtlStyles.rtlText]}>{formError}</Text>
              ) : null}
              <View style={[styles.formActions, isRtl && rtlStyles.rtlRow]}>
                <Button
                  title={saving ? p.saving : mode === 'expense' ? p.saveExpense : p.saveRevenue}
                  onPress={submit}
                  loading={saving}
                  disabled={saving}
                />
                <Button title={p.cancel} variant="ghost" onPress={resetForm} disabled={saving} />
              </View>
            </View>
          ) : null}
        </>
      ) : null}

      {meta && !roleBlocked ? <ProvenanceBar meta={meta} style={styles.provenance} /> : null}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { ...stackedCard },
  headTitle: cardHeading,
  scope: { ...mutedCaptionTop, marginBottom: spacing.sm },
  summary: { ...stackSm, marginBottom: spacing.sm },
  amountRow: { ...spaceBetween },
  amountLabel: { ...mutedCaption, flex: 1 },
  amountValue: titleBase,
  amountStrong: { color: colors.primaryDark },
  amountNegative: { color: colors.danger },
  notice: { ...mutedCaptionTop, color: colors.success, marginBottom: spacing.xs },
  actions: { ...rowGapSm, marginTop: spacing.xs },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  actionText: labelSemibold,
  form: { ...stackSm, marginTop: spacing.md },
  pickerLabel: { ...labelSemibold, marginTop: spacing.sm, marginBottom: spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  formError: { ...mutedCaptionTop, color: colors.danger },
  formActions: { ...rowGapSm, marginTop: spacing.xs },
  provenance: { marginTop: spacing.sm },
});
