import React, { useState, useEffect } from 'react';
import { rtlStyles } from '../../theme/rtl';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
  Image,
  Pressable,
} from 'react-native';
import { cardBottomRow, cardPad, flex1, gapSm, rowGapXs, rowWrapSm, screenStyles, spaceBetween, spaceBetweenTopSm, stackSm, stackTopSm } from '../../theme/layout';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { fieldLabel, mutedCaptionTop, primaryBoldText, sectionHeading, subtitleMeta, subtleCaption, titleBase } from '../../theme/typographyStyles';
import { formInput } from '../../theme/formStyles';
import { useLanguage } from '../../context/LanguageContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Chip } from '../../components/ui/Chip';
import { analyzeFarmSatelliteNdvi, getFarms, getFields, createField, createFarm, saveFarmBoundaries } from '../../api/client';
import { Farm, FarmBoundary, Field, ProvenanceMeta, SatelliteNdviObservation } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { StateView } from '../../components/ui/StateView';
import { ProvenanceBar } from '../../components/ui/ProvenanceBar';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { ServiceHeader } from '../../components/ui/ServiceHeader';
import { StateCard } from '../../components/ui/StateCard';
import { GOVERNORATES } from '../../utils/governorates';
import * as Location from 'expo-location';

interface FarmManagementScreenProps {
  onBack: () => void;
}

export const FarmManagementScreen: React.FC<FarmManagementScreenProps> = ({ onBack }) => {
  const { t, x, isRtl, language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');
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
  const [boundaryPoints, setBoundaryPoints] = useState<{ latitude: number; longitude: number; accuracy?: number | null }[]>([]);
  const [savingBoundary, setSavingBoundary] = useState(false);
  const [satelliteLoading, setSatelliteLoading] = useState(false);
  const [satelliteObservations, setSatelliteObservations] = useState<SatelliteNdviObservation[]>([]);
  const [satelliteError, setSatelliteError] = useState<string | null>(null);
  const [satelliteProvider, setSatelliteProvider] = useState<string | undefined>(undefined);
  const selectedFarm = farms.find(farm => farm.id === selectedFarmId) ?? selectedFarm;

  const loadFarmData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const [farmsRes, fieldsRes] = await Promise.all([getFarms(), getFields()]);
    setFarms(farmsRes.data);
    setSelectedFarmId(current => farmsRes.data.some(farm => farm.id === current) ? current : farmsRes.data[0]?.id ?? '');
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
      const farmId = selectedFarm?.id;
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
      setSelectedFarmId((res.data as Farm).id);
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

  const recordBoundaryPoint = async () => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(x.notice, language === 'ar' ? 'يلزم السماح بالموقع لتسجيل نقاط حدود الأرض.' : language === 'fr' ? 'Autorisez la localisation pour enregistrer les limites.' : 'Location permission is required to record field boundary points.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.BestForNavigation });
      setBoundaryPoints(prev => [...prev, {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      }]);
    } catch (e) {
      Alert.alert(x.stateError, e instanceof Error ? e.message : 'Could not read GPS position.');
    }
  };

  const saveBoundary = async () => {
    const farm = selectedFarm;
    if (!farm) return;
    if (boundaryPoints.length < 3) {
      Alert.alert(x.notice, language === 'ar' ? 'سجّل 3 نقاط على الأقل حول محيط الأرض.' : language === 'fr' ? 'Enregistrez au moins 3 points autour de la parcelle.' : 'Record at least 3 perimeter points.');
      return;
    }
    const ring = boundaryPoints.map(p => [p.longitude, p.latitude]);
    ring.push([...ring[0]]);
    const geometry: FarmBoundary = { type: 'Polygon', coordinates: [ring] };
    setSavingBoundary(true);
    try {
      const result = await saveFarmBoundaries(farm.id, geometry);
      if (!result.data) throw new Error(result.error || 'BOUNDARY_SAVE_FAILED');
      setFarms(prev => prev.map(item => item.id === farm.id ? { ...item, boundaries: result.data } : item));
      setBoundaryPoints([]);
      setSatelliteObservations([]);
      Alert.alert(x.successTitle, language === 'ar' ? 'تم حفظ حدود الأرض.' : language === 'fr' ? 'Limites enregistrées.' : 'Farm boundary saved.');
    } catch (e) {
      Alert.alert(x.stateError, e instanceof Error ? e.message : 'Could not save farm boundary.');
    } finally {
      setSavingBoundary(false);
    }
  };

  const runSatelliteAnalysis = async () => {
    const farm = farms[0];
    if (!farm?.boundaries) {
      Alert.alert(x.notice, language === 'ar' ? 'احفظ حدود الأرض أولاً.' : language === 'fr' ? 'Enregistrez d’abord les limites.' : 'Save the farm boundary first.');
      return;
    }
    setSatelliteLoading(true);
    setSatelliteError(null);
    try {
      const result = await analyzeFarmSatelliteNdvi(farm.id, 90);
      if (result.error) throw new Error(result.error);
      setSatelliteObservations(result.data);
      setSatelliteProvider(result.provider);
    } catch (e) {
      setSatelliteError(e instanceof Error ? e.message : 'SATELLITE_ANALYSIS_FAILED');
    } finally {
      setSatelliteLoading(false);
    }
  };

  return (
    <ScrollView
      style={screenStyles.container}
      contentContainerStyle={screenStyles.content}
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
        <StateCard
          cardStyle={{ marginBottom: spacing.lg }}
          kind="unavailable"
          title={x.loginRequired}
          message={x.farmLoginToManage}
        />
      ) : null}

      {/* Farm Overview Card */}
      {isAuthenticated && selectedFarm && (
        <Card variant="elevated" style={styles.farmSummaryCard}>
          {farms.length > 1 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm }}>
              {farms.map(farm => (
                <Pressable key={farm.id} onPress={() => {
                  setSelectedFarmId(farm.id);
                  setBoundaryPoints([]);
                  setSatelliteObservations([]);
                  setSatelliteError(null);
                }} style={{
                  borderWidth: 1, borderColor: selectedFarm.id === farm.id ? colors.primary : colors.border,
                  backgroundColor: selectedFarm.id === farm.id ? colors.primaryLight : colors.surface,
                  borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
                }}>
                  <Text style={{ color: selectedFarm.id === farm.id ? colors.primaryDark : colors.text, fontSize: typography.fontSizes.sm }}>
                    {language === 'ar' ? farm.name_ar || farm.name : farm.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          <View style={[styles.farmHeader, isRtl && rtlStyles.rtlRow]}>
            <View style={styles.farmHeaderInfo}>
              <Text style={[styles.farmName, isRtl && rtlStyles.rtlText]}>
                {language === 'ar' ? farms[0].name_ar || farms[0].name : farms[0].name}
              </Text>
              <Text style={[styles.farmLocation, isRtl && rtlStyles.rtlText]}>
                <MaterialCommunityIcons name="map-marker" size={14} color={colors.primary} />{' '}
                {formatFarmLocation(farms[0].location)}
              </Text>
            </View>
            <Badge label={`${farms[0].size_hectares} ${x.farmSizeUnit}`} variant="primary" size="md" />
          </View>

          <ProvenanceBar meta={meta} style={styles.provBar} />

          <View style={{ gap: spacing.xs }}>
            <Button title={language === 'ar' ? 'تسجيل نقطة GPS' : language === 'fr' ? 'Enregistrer un point GPS' : 'Record GPS point'}
              onPress={recordBoundaryPoint} variant="outline" size="md" />
            <Button title={savingBoundary ? (language === 'ar' ? 'جارٍ الحفظ...' : 'Saving...') : (language === 'ar' ? 'حفظ الحدود' : language === 'fr' ? 'Enregistrer les limites' : 'Save boundary')}
              onPress={saveBoundary} disabled={boundaryPoints.length < 3 || savingBoundary} loading={savingBoundary} size="md" />
          </View>
          {farms[0].boundaries ? (
            <Image
              source={{ uri: getSatellitePreviewUrl(farms[0].boundaries) }}
              style={{ width: '100%', height: 190, borderRadius: radius.md, backgroundColor: colors.surfaceSubtle }}
              resizeMode="cover"
              accessibilityLabel={language === 'ar' ? 'صورة القمر الصناعي للأرض' : 'Satellite image of the farm'}
            />
          ) : (
            <View style={{ minHeight: 100, borderRadius: radius.md, backgroundColor: colors.surfaceSubtle, alignItems: 'center', justifyContent: 'center', padding: spacing.md }}>
              <MaterialCommunityIcons name="map-outline" size={30} color={colors.textMuted} />
              <Text style={[styles.footerText, isRtl && rtlStyles.rtlText, { textAlign: 'center' }]}>
                {language === 'ar' ? 'لا توجد حدود محفوظة بعد. امشِ حول الأرض وسجّل نقاط الزوايا.' : language === 'fr' ? 'Aucune limite enregistrée. Faites le tour de la parcelle et relevez les sommets.' : 'No saved boundary yet. Walk around the plot and record its corners.'}
              </Text>
            </View>
          )}
          <Text style={[styles.footerText, isRtl && rtlStyles.rtlText]}>
            {farms[0].boundaries ? 'Imagery © Esri and contributors' : ''}
            {boundaryPoints.length ? (language === 'ar' ? ` · نقاط مسجلة: ${boundaryPoints.length}` : ` · GPS points: ${boundaryPoints.length}`) : ''}
          </Text>
          <View style={[styles.farmStatsRow, isRtl && rtlStyles.rtlRow]}>
            <Button title={language === 'ar' ? 'تسجيل نقطة GPS' : language === 'fr' ? 'Enregistrer un point GPS' : 'Record GPS point'}
              onPress={recordBoundaryPoint} variant="outline" size="md" />
            <Button title={savingBoundary ? (language === 'ar' ? 'جارٍ الحفظ...' : 'Saving...') : (language === 'ar' ? 'حفظ الحدود' : language === 'fr' ? 'Enregistrer les limites' : 'Save boundary')}
              onPress={saveBoundary} disabled={boundaryPoints.length < 3 || savingBoundary} loading={savingBoundary} size="md" />
          </View>
          {farms[0].boundaries ? (
            <Button title={language === 'ar' ? 'تحليل الغطاء النباتي NDVI (90 يوم)' : language === 'fr' ? 'Analyser NDVI (90 jours)' : 'Analyze vegetation (NDVI · 90 days)'}
              onPress={runSatelliteAnalysis} loading={satelliteLoading} disabled={satelliteLoading} variant="secondary" size="md" />
          ) : null}
          {satelliteError ? (
            <StateCard kind="unavailable" title={language === 'ar' ? 'تحليل الأقمار الصناعية غير متاح' : language === 'fr' ? 'Analyse satellite indisponible' : 'Satellite analysis unavailable'}
              message={satelliteError} compact />
          ) : null}
          {satelliteObservations.length ? (
            <View style={{ gap: spacing.xs }}>
              <Text style={[styles.formTitle, isRtl && rtlStyles.rtlText]}>{language === 'ar' ? 'نتائج NDVI' : 'NDVI observations'}</Text>
              {satelliteObservations.slice(-3).map(item => (
                <View key={item.id} style={[styles.farmStatsRow, isRtl && rtlStyles.rtlRow]}>
                  <View style={styles.statBox}>
                    <Text style={styles.statVal}>{item.mean_value.toFixed(3)}</Text>
                    <Text style={styles.statLabel}>NDVI mean</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statVal}>{item.min_value.toFixed(2)}–{item.max_value.toFixed(2)}</Text>
                    <Text style={styles.statLabel}>{language === 'ar' ? 'الحد الأدنى – الأقصى' : 'Min – max'}</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statVal}>{item.sample_count}</Text>
                    <Text style={styles.statLabel}>{language === 'ar' ? 'عينات صالحة' : 'Valid samples'}</Text>
                  </View>
                </View>
              ))}
              <Text style={[styles.footerText, isRtl && rtlStyles.rtlText]}>
                {satelliteProvider || 'Copernicus Sentinel-2'} · 10 m · {language === 'ar' ? 'مؤشر اخضرار وليس تشخيص مرض أو قياس مردودية.' : 'Greenness index only; not disease diagnosis or yield measurement.'}
              </Text>
            </View>
          ) : null}
        </Card>
      ) : null}

      {/* First-run: no farm yet — guide the user to register one. Adding a
          field is impossible without a farm, so this must come first. */}
      {isAuthenticated && !loading && farms.length === 0 && (
        <StateCard
          cardStyle={{ marginBottom: spacing.md }}
          kind="empty"
          title={x.farmNoFarmYet}
          message={x.farmCreateHint}
        />
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
          <Text style={[styles.formTitle, isRtl && rtlStyles.rtlText]}>{x.farmAddFarm}</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, isRtl && rtlStyles.rtlText]}>{x.farmName}</Text>
            <TextInput
              style={[styles.input, isRtl && rtlStyles.rtlText]}
              placeholder={x.farmName}
              placeholderTextColor={colors.textMuted}
              value={farmName}
              onChangeText={setFarmName}
              accessibilityLabel={x.farmName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, isRtl && rtlStyles.rtlText]}>{x.farmRegion}</Text>
            <View style={[styles.chipWrap, isRtl && rtlStyles.rtlRow]}>
              {GOVERNORATES.map((g) => {
                const label = language === 'fr' ? g.labelFr : language === 'en' ? g.labelEn : g.label;
                const selected = farmRegion === label;
                return (
                  <Chip
                    key={g.id}
                    label={label}
                    selected={selected}
                    onPress={() => setFarmRegion(label)}
                  />
                );
              })}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, isRtl && rtlStyles.rtlText]}>{x.farmSize}</Text>
            <TextInput
              style={[styles.input, isRtl && rtlStyles.rtlText]}
              placeholder="4.5"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={farmSize}
              onChangeText={setFarmSize}
              accessibilityLabel={x.farmSize}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, isRtl && rtlStyles.rtlText]}>{x.farmSoilType}</Text>
            <TextInput
              style={[styles.input, isRtl && rtlStyles.rtlText]}
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
          <Text style={[styles.formTitle, isRtl && rtlStyles.rtlText]}>{x.farmAddField}</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, isRtl && rtlStyles.rtlText]}>{x.farmFieldName}</Text>
            <TextInput
              style={[styles.input, isRtl && rtlStyles.rtlText]}
              placeholder={x.farmFieldName}
              placeholderTextColor={colors.textMuted}
              value={fieldName}
              onChangeText={setFieldName}
              accessibilityLabel={x.farmFieldName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, isRtl && rtlStyles.rtlText]}>{x.farmFieldArea}</Text>
            <TextInput
              style={[styles.input, isRtl && rtlStyles.rtlText]}
              placeholder="4.5"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={fieldArea}
              onChangeText={setFieldArea}
              accessibilityLabel={x.farmFieldArea}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, isRtl && rtlStyles.rtlText]}>{x.farmSoilType}</Text>
            <TextInput
              style={[styles.input, isRtl && rtlStyles.rtlText]}
              placeholder={fieldSoil}
              placeholderTextColor={colors.textMuted}
              value={fieldSoil}
              onChangeText={setFieldSoil}
              accessibilityLabel={x.farmSoilType}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, isRtl && rtlStyles.rtlText]}>{x.farmCurrentCrop}</Text>
            <TextInput
              style={[styles.input, isRtl && rtlStyles.rtlText]}
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
          <StateView kind="loading" compact />
        ) : !isAuthenticated ? (
          <StateView kind="unavailable" title={x.loginRequired} message={x.farmLoginToManage} compact />
        ) : error ? (
          <StateView kind="error" title={x.stateError} message={error} onRetry={loadFarmData} retryLabel={x.retry} compact />
        ) : fields.length === 0 ? (
          <StateView kind="empty" title={x.farmEmpty} compact />
        ) : (
          fields.map((field) => (
            <Card key={field.id} variant="elevated" style={styles.fieldCard}>
              <View style={[styles.fieldHeader, isRtl && rtlStyles.rtlRow]}>
                <View style={styles.fieldInfo}>
                  <Text style={[styles.fieldName, isRtl && rtlStyles.rtlText]}>
                    {language === 'ar' ? field.name_ar || field.name : field.name}
                  </Text>
                  <Text style={[styles.fieldCrop, isRtl && rtlStyles.rtlText]}>
                    {x.farmCurrentCrop}: <Text style={styles.cropHighlight}>{field.current_crop || '—'}</Text>
                  </Text>
                </View>
                <Badge label={`${field.size_hectares} ${x.farmSizeUnit}`} variant="secondary" size="md" />
              </View>

              <View style={[styles.fieldFooter, isRtl && rtlStyles.rtlRow]}>
                <View style={[styles.footerMeta, isRtl && rtlStyles.rtlRow]}>
                  <MaterialCommunityIcons name="layers-triple" size={16} color={colors.soil} />
                  <Text style={styles.footerText}>{x.farmSoilType}: {field.soil_type}</Text>
                </View>
                {field.planting_date && (
                  <View style={[styles.footerMeta, isRtl && rtlStyles.rtlRow]}>
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
function getSatellitePreviewUrl(boundary?: FarmBoundary | null): string {
  const ring = boundary?.coordinates?.[0] ?? [];
  if (ring.length < 4) return '';
  const lons = ring.map(point => Number(point[0]));
  const lats = ring.map(point => Number(point[1]));
  let minLon = Math.min(...lons), maxLon = Math.max(...lons);
  let minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const lonPad = Math.max((maxLon - minLon) * 0.18, 0.001);
  const latPad = Math.max((maxLat - minLat) * 0.18, 0.001);
  minLon -= lonPad; maxLon += lonPad; minLat -= latPad; maxLat += latPad;
  const bbox = [minLon,minLat,maxLon,maxLat].join(',');
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${encodeURIComponent(bbox)}&bboxSR=4326&imageSR=4326&size=960,560&format=jpg&f=image`;
}

function formatFarmLocation(location: Farm['location']): string {
  if (!location) return '—';
  if (typeof location === 'string') return location;
  const region = location.region || (location as { name?: string }).name;
  return region ? String(region) : '—';
}

const styles = StyleSheet.create({
  farmSummaryCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  farmHeader: spaceBetween,
  provBar: stackTopSm,
  farmHeaderInfo: flex1,
  farmName: titleBase,
  farmLocation: subtitleMeta,
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
    fontSize: typography.fontSizes.base, lineHeight: typography.lineHeights.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.primaryDark,
  },
  statLabel: mutedCaptionTop,
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
  formTitle: sectionHeading,
  inputGroup: stackSm,
  inputLabel: fieldLabel,
  input: formInput,
  chipWrap: rowWrapSm,
  fieldsSection: gapSm,
  fieldCard: cardPad,
  fieldHeader: spaceBetweenTopSm,
  fieldInfo: flex1,
  fieldName: titleBase,
  fieldCrop: subtitleMeta,
  cropHighlight: primaryBoldText,
  fieldFooter: cardBottomRow,
  footerMeta: rowGapXs,
  footerText: subtleCaption,
});
