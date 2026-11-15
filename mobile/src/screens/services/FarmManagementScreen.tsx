import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { useLanguage } from '../../context/LanguageContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { getFarms, getFields, createField, createFarm } from '../../api/client';
import { Farm, Field, ProvenanceMeta } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { StateView } from '../../components/ui/StateView';
import { ProvenanceBadge } from '../../components/ui/ProvenanceBadge';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { ServiceHeader } from '../../components/ui/ServiceHeader';
import { GOVERNORATES } from '../../utils/governorates';

interface FarmManagementScreenProps {
  onBack: () => void;
}

export const FarmManagementScreen: React.FC<FarmManagementScreenProps> = ({ onBack }) => {
  const { t, x, isRtl, language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<ProvenanceMeta>({ provenance: 'database', isRealData: false });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFarmModal, setShowFarmModal] = useState(false);

  // New Field Form States
  const [fieldName, setFieldName] = useState('');
  const [fieldArea, setFieldArea] = useState('');
  const [fieldSoil, setFieldSoil] = useState(x.farmDefaultSoil);
  const [fieldCrop, setFieldCrop] = useState(x.farmDefaultCrop);
  const [saving, setSaving] = useState(false);

  // New Farm Form States
  const [farmName, setFarmName] = useState('');
  const [farmRegion, setFarmRegion] = useState('');
  const [farmSize, setFarmSize] = useState('');
  const [farmSoil, setFarmSoil] = useState(x.farmDefaultSoil);
  const [savingFarm, setSavingFarm] = useState(false);

  const loadFarmData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const [farmsRes, fieldsRes] = await Promise.all([getFarms(), getFields()]);
    setFarms(farmsRes.data);
    setFields(fieldsRes.data);
    setError(farmsRes.error || fieldsRes.error);
    setMeta(farmsRes.meta ?? { provenance: 'database', isRealData: false });
    setLoading(false);
  }, []);

  useEffect(() => {
    (async () => {
      await loadFarmData();
    })();
  }, [loadFarmData]);

  const handleAddField = async () => {
    if (!fieldName.trim() || !fieldArea.trim()) {
      Alert.alert(x.notice, x.farmRequiredFields);
      return;
    }
    // Never coerce unparsable input to 0 ha: a zero-area field is a real value
    // that would misrepresent the plot the user believes they registered.
    const fieldAreaValue = parseFloat(fieldArea.replace(',', '.'));
    if (!Number.isFinite(fieldAreaValue) || fieldAreaValue <= 0) {
      Alert.alert(x.notice, x.farmInvalidArea);
      return;
    }

    setSaving(true);
    try {
      const farmId = farms[0]?.id;
      if (!farmId) {
        Alert.alert(x.notice, x.farmNoFarmYet);
        return;
      }
      const res = await createField({
        farm_id: farmId,
        name: fieldName,
        size_hectares: fieldAreaValue,
        soil_type: fieldSoil,
        current_crop: fieldCrop,
      });
      if (!res.data) {
        Alert.alert(x.stateError, res.error || x.farmError);
        return;
      }

      setFields((prev) => [res.data as Field, ...prev]);
      setShowAddModal(false);
      setFieldName('');
      setFieldArea('');
      Alert.alert(x.successTitle, x.farmSaved);
    } catch (e) {
      console.warn('Error creating field:', e);
      Alert.alert(x.stateError, x.farmError);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateFarm = async () => {
    if (!farmName.trim() || !farmRegion.trim() || !farmSize.trim()) {
      Alert.alert(x.notice, x.farmRequiredFields);
      return;
    }
    const farmSizeValue = parseFloat(farmSize.replace(',', '.'));
    if (!Number.isFinite(farmSizeValue) || farmSizeValue <= 0) {
      Alert.alert(x.notice, x.farmInvalidArea);
      return;
    }
    setSavingFarm(true);
    try {
      const res = await createFarm({
        name: farmName.trim(),
        region: farmRegion.trim(),
        size_hectares: farmSizeValue,
        soil_type: farmSoil,
      });
      if (!res.data) {
        Alert.alert(x.stateError, res.error || x.farmError);
        return;
      }
      setFarms((prev) => [res.data as Farm, ...prev]);
      setShowFarmModal(false);
      setFarmName('');
      setFarmRegion('');
      setFarmSize('');
      Alert.alert(x.successTitle, x.farmSaved);
    } catch (e) {
      console.warn('Error creating farm:', e);
      Alert.alert(x.stateError, x.farmError);
    } finally {
      setSavingFarm(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Info */}
      <ServiceHeader
        icon="map-marker-radius"
        iconColor={colors.primary}
        iconBg={colors.primaryLight}
        title={t.farmManagementName}
        subtitle={t.farmManagementDesc}
      />

      {!isAuthenticated ? (
        <Card variant="outlined" style={{ marginBottom: spacing.lg }}>
          <StateView
            kind="unavailable"
            title={x.loginRequired}
            message={x.farmLoginToManage}
          />
        </Card>
      ) : null}

      {/* Farm Overview Card */}
      {isAuthenticated && farms.length > 0 && (
        <Card variant="elevated" style={styles.farmSummaryCard}>
          <View style={[styles.farmHeader, isRtl && styles.rtlRow]}>
            <View style={styles.farmHeaderInfo}>
              <Text style={[styles.farmName, isRtl && styles.rtlText]}>
                {language === 'ar' ? farms[0].name_ar || farms[0].name : farms[0].name}
              </Text>
              <Text style={[styles.farmLocation, isRtl && styles.rtlText]}>
                <MaterialCommunityIcons name="map-marker" size={14} color={colors.primary} />{' '}
                {formatFarmLocation(farms[0].location)}
              </Text>
            </View>
            <Badge label={`${farms[0].size_hectares} ${x.farmSizeUnit}`} variant="primary" size="md" />
          </View>

          <View style={[styles.provBar, isRtl && styles.rtlRow]}>
            <ProvenanceBadge meta={meta} />
          </View>

          <View style={[styles.farmStatsRow, isRtl && styles.rtlRow]}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{fields.length}</Text>
              <Text style={styles.statLabel}>{x.farmFieldCount}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statVal}>
                {fields.reduce((acc, f) => acc + (f.size_hectares || 0), 0).toFixed(1)}
              </Text>
              <Text style={styles.statLabel}>{x.farmTotalArea}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statVal}>
                {new Set(fields.map((f) => (f.current_crop || '').trim()).filter(Boolean)).size}
              </Text>
              <Text style={styles.statLabel}>{x.farmCropCount}</Text>
            </View>
          </View>
        </Card>
      )}

      {/* First-run: no farm yet — guide the user to register one. Adding a
          field is impossible without a farm, so this must come first. */}
      {isAuthenticated && !loading && farms.length === 0 && (
        <Card variant="outlined" style={{ marginBottom: spacing.md }}>
          <StateView kind="empty" title={x.farmNoFarmYet} message={x.farmCreateHint} />
        </Card>
      )}

      {/* Add Farm / Add Field Button */}
      {isAuthenticated && (
        <Button
          title={
            farms.length === 0
              ? showFarmModal
                ? x.cancel
                : `+ ${x.farmAddFarm}`
              : showAddModal
                ? x.cancel
                : `+ ${x.farmAddField}`
          }
          variant={(farms.length === 0 ? showFarmModal : showAddModal) ? 'outline' : 'primary'}
          size="md"
          onPress={() => {
            if (farms.length === 0) {
              setShowFarmModal((v) => !v);
            } else {
              setShowAddModal((v) => !v);
            }
          }}
          style={{ marginBottom: spacing.md }}
        />
      )}

      {/* Add Farm Form */}
      {showFarmModal && farms.length === 0 && (
        <Card variant="outlined" style={styles.addFormCard}>
          <Text style={[styles.formTitle, isRtl && styles.rtlText]}>{x.farmAddFarm}</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, isRtl && styles.rtlText]}>{x.farmName}</Text>
            <TextInput
              style={[styles.input, isRtl && styles.rtlText]}
              placeholder={x.farmName}
              placeholderTextColor={colors.textMuted}
              value={farmName}
              onChangeText={setFarmName}
              accessibilityLabel={x.farmName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, isRtl && styles.rtlText]}>{x.farmRegion}</Text>
            <View style={[styles.chipWrap, isRtl && styles.rtlRow]}>
              {GOVERNORATES.map((g) => {
                const label = language === 'fr' ? g.labelFr : language === 'en' ? g.labelEn : g.label;
                const selected = farmRegion === label;
                return (
                  <TouchableOpacity
                    key={g.id}
                    activeOpacity={0.85}
                    onPress={() => setFarmRegion(label)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={label}
                    style={[styles.regionChip, selected && styles.regionChipSelected]}
                  >
                    <Text style={[styles.regionChipText, selected && styles.regionChipTextSelected]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, isRtl && styles.rtlText]}>{x.farmSize}</Text>
            <TextInput
              style={[styles.input, isRtl && styles.rtlText]}
              placeholder="4.5"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={farmSize}
              onChangeText={setFarmSize}
              accessibilityLabel={x.farmSize}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, isRtl && styles.rtlText]}>{x.farmSoilType}</Text>
            <TextInput
              style={[styles.input, isRtl && styles.rtlText]}
              placeholder={farmSoil}
              placeholderTextColor={colors.textMuted}
              value={farmSoil}
              onChangeText={setFarmSoil}
              accessibilityLabel={x.farmSoilType}
            />
          </View>

          <Button
            title={savingFarm ? x.stateLoading : x.farmSaveFarm}
            onPress={handleCreateFarm}
            loading={savingFarm}
            size="md"
            style={{ marginTop: spacing.sm }}
          />
        </Card>
      )}

      {/* Add Field Form Modal/Card */}
      {showAddModal && (
        <Card variant="outlined" style={styles.addFormCard}>
          <Text style={[styles.formTitle, isRtl && styles.rtlText]}>{x.farmAddField}</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, isRtl && styles.rtlText]}>{x.farmFieldName}</Text>
            <TextInput
              style={[styles.input, isRtl && styles.rtlText]}
              placeholder={x.farmFieldName}
              placeholderTextColor={colors.textMuted}
              value={fieldName}
              onChangeText={setFieldName}
              accessibilityLabel={x.farmFieldName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, isRtl && styles.rtlText]}>{x.farmFieldArea}</Text>
            <TextInput
              style={[styles.input, isRtl && styles.rtlText]}
              placeholder="4.5"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={fieldArea}
              onChangeText={setFieldArea}
              accessibilityLabel={x.farmFieldArea}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, isRtl && styles.rtlText]}>{x.farmSoilType}</Text>
            <TextInput
              style={[styles.input, isRtl && styles.rtlText]}
              placeholder={fieldSoil}
              placeholderTextColor={colors.textMuted}
              value={fieldSoil}
              onChangeText={setFieldSoil}
              accessibilityLabel={x.farmSoilType}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, isRtl && styles.rtlText]}>{x.farmCurrentCrop}</Text>
            <TextInput
              style={[styles.input, isRtl && styles.rtlText]}
              placeholder={fieldCrop}
              placeholderTextColor={colors.textMuted}
              value={fieldCrop}
              onChangeText={setFieldCrop}
              accessibilityLabel={x.farmCurrentCrop}
            />
          </View>

          <Button
            title={saving ? x.stateLoading : x.farmSaveFarm}
            onPress={handleAddField}
            loading={saving}
            size="md"
            style={{ marginTop: spacing.sm }}
          />
        </Card>
      )}

      {/* Fields List */}
      <View style={styles.fieldsSection}>
        <SectionHeader title={x.farmFieldsSection} icon="sprout" />

        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : !isAuthenticated ? (
          <StateView kind="unavailable" title={x.loginRequired} message={x.farmLoginToManage} compact />
        ) : error ? (
          <StateView kind="error" title={x.stateError} message={error} onRetry={loadFarmData} retryLabel={x.retry} compact />
        ) : fields.length === 0 ? (
          <StateView kind="empty" title={x.farmEmpty} compact />
        ) : (
          fields.map((field) => (
            <Card key={field.id} variant="elevated" style={styles.fieldCard}>
              <View style={[styles.fieldHeader, isRtl && styles.rtlRow]}>
                <View style={styles.fieldInfo}>
                  <Text style={[styles.fieldName, isRtl && styles.rtlText]}>
                    {language === 'ar' ? field.name_ar || field.name : field.name}
                  </Text>
                  <Text style={[styles.fieldCrop, isRtl && styles.rtlText]}>
                    {x.farmCurrentCrop}: <Text style={styles.cropHighlight}>{field.current_crop || '—'}</Text>
                  </Text>
                </View>
                <Badge label={`${field.size_hectares} ${x.farmSizeUnit}`} variant="secondary" size="md" />
              </View>

              <View style={[styles.fieldFooter, isRtl && styles.rtlRow]}>
                <View style={[styles.footerMeta, isRtl && styles.rtlRow]}>
                  <MaterialCommunityIcons name="layers-triple" size={16} color={colors.soil} />
                  <Text style={styles.footerText}>{x.farmSoilType}: {field.soil_type}</Text>
                </View>
                {field.planting_date && (
                  <View style={[styles.footerMeta, isRtl && styles.rtlRow]}>
                    <MaterialCommunityIcons name="calendar-check" size={16} color={colors.primary} />
                    <Text style={styles.footerText}>{field.planting_date}</Text>
                  </View>
                )}
              </View>
            </Card>
          ))
        )}
      </View>

      {/* Back Button */}
      <Button
        title={t.back}
        variant="outline"
        onPress={onBack}
        style={{ marginTop: spacing.lg, marginBottom: spacing.xl }}
      />
    </ScrollView>
  );
};

/** Render a farm's `location` which may be a string or a {region, country} object. */
function formatFarmLocation(location: Farm['location']): string {
  if (!location) return '—';
  if (typeof location === 'string') return location;
  const region = location.region || (location as { name?: string }).name;
  return region ? String(region) : '—';
}

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
  farmSummaryCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  farmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  provBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  farmHeaderInfo: {
    flex: 1,
  },
  farmName: {
    fontSize: typography.fontSizes.base, lineHeight: 24,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  farmLocation: {
    fontSize: typography.fontSizes.xs,
    lineHeight: 20,
    color: colors.textSecondary,
    marginTop: 2,
  },
  farmStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  statBox: {
    alignItems: 'center',
  },
  statVal: {
    fontSize: typography.fontSizes.base, lineHeight: 24,
    fontWeight: typography.fontWeights.bold,
    color: colors.primaryDark,
  },
  statLabel: {
    fontSize: typography.fontSizes.xs,
    lineHeight: 20,
    color: colors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  addFormCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.card,
  },
  formTitle: {
    fontSize: typography.fontSizes.sm, lineHeight: 21,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  inputGroup: {
    marginBottom: spacing.sm,
  },
  inputLabel: {
    fontSize: typography.fontSizes.xs,
    lineHeight: 20,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text,
    marginBottom: 4,
  },
  input: {
    height: 48,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSizes.sm, lineHeight: 21,
    color: colors.text,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  regionChip: {
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  regionChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  regionChipText: { fontSize: typography.fontSizes.xs, color: colors.textSecondary, lineHeight: 20 },
  regionChipTextSelected: { color: colors.textInverse, fontWeight: typography.fontWeights.bold },
  fieldsSection: {
    gap: spacing.sm,
  },
  fieldCard: {
    padding: spacing.md,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  fieldInfo: {
    flex: 1,
  },
  fieldName: {
    fontSize: typography.fontSizes.base, lineHeight: 24,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  fieldCrop: {
    fontSize: typography.fontSizes.xs,
    lineHeight: 20,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cropHighlight: {
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
  },
  fieldFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.surfaceSubtle,
    paddingTop: spacing.xs,
    marginTop: 4,
  },
  footerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: typography.fontSizes.xs,
    lineHeight: 20,
    color: colors.textSecondary,
  },
});
