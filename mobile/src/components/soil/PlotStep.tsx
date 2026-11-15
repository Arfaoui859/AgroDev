import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StateCard } from '../ui/StateCard';
import { rtlStyles } from '../../theme/rtl';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { subtitleMeta, subtitleMetaBase, titleBase, titleSmSemibold } from '../../theme/typographyStyles';
import { chipActiveFill, flex1, stackedCard } from '../../theme/layout';
import { useLanguage } from '../../context/LanguageContext';
import { getSoil } from '../../i18n/soil';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { FormField } from '../ui/FormField';
import { ChipSelect } from '../ui/ChipSelect';
import { StateView } from '../ui/StateView';
import { GOVERNORATES } from '../../utils/governorates';
import { Farm, Field } from '../../types';
import { useFarmsFields } from '../../hooks/useFarmsFields';
import { createFarm, createField } from '../../api/client';

interface PlotStepProps {
  selectedFarm: Farm | null;
  selectedField: Field | null;
  onSelectFarm: (farm: Farm | null) => void;
  onSelectField: (field: Field | null) => void;
  /** Shared farm/field loader so the crop screen sees the same data. */
  loader: ReturnType<typeof useFarmsFields>;
}

const SOIL_TYPE_KEYS: { value: string; ar: string; fr: string; en: string }[] = [
  { value: 'clay', ar: 'طينية', fr: 'Argileuse', en: 'Clay' },
  { value: 'sandy', ar: 'رملية', fr: 'Sableuse', en: 'Sandy' },
  { value: 'loam', ar: 'طميية', fr: 'Limoneuse', en: 'Loam' },
  { value: 'calcareous', ar: 'كلسية', fr: 'Calcaire', en: 'Calcareous' },
  { value: 'saline', ar: 'ملحية', fr: 'Saline', en: 'Saline' },
];

/**
 * Step 1 — pick (or create) the farm and plot. Creating here means the soil
 * report can be persisted against the plot, which is what makes it reusable by
 * the crop screen later.
 */
export const PlotStep: React.FC<PlotStepProps> = ({
  selectedFarm,
  selectedField,
  onSelectFarm,
  onSelectField,
  loader,
}) => {
  const { language, isRtl } = useLanguage();
  const s9 = getSoil(language);
  const { farms, fields, loadingFarms, loadingFields, error, reloadFarms, loadFields } = loader;

  const [showFarmForm, setShowFarmForm] = useState(false);
  const [showFieldForm, setShowFieldForm] = useState(false);
  const [farmName, setFarmName] = useState('');
  const [farmRegion, setFarmRegion] = useState('');
  const [farmSize, setFarmSize] = useState('');
  const [fieldName, setFieldName] = useState('');
  const [fieldSize, setFieldSize] = useState('');
  const [fieldSoil, setFieldSoil] = useState('');
  const [fieldCrop, setFieldCrop] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const governorateOptions = GOVERNORATES.map((g) => ({
    value: g.id,
    label: language === 'fr' ? g.labelFr : language === 'en' ? g.labelEn : g.label,
  }));

  const soilTypeOptions = SOIL_TYPE_KEYS.map((s) => ({
    value: s.value,
    label: language === 'fr' ? s.fr : language === 'en' ? s.en : s.ar,
  }));

  const handleCreateFarm = async () => {
    const size = Number(farmSize.replace(',', '.'));
    if (!farmName.trim() || !farmRegion || !Number.isFinite(size) || size <= 0) {
      setFormError(s9.farmRequired);
      return;
    }
    setSaving(true);
    setFormError(null);
    const governorate = GOVERNORATES.find((g) => g.id === farmRegion);
    const regionLabel = governorate
      ? language === 'fr'
        ? governorate.labelFr
        : language === 'en'
          ? governorate.labelEn
          : governorate.label
      : farmRegion;
    const res = await createFarm({ name: farmName.trim(), region: regionLabel, size_hectares: size });
    if (res.data) {
      const list = await reloadFarms();
      const created = list.find((f) => f.id === res.data!.id) ?? res.data;
      onSelectFarm(created);
      onSelectField(null);
      setShowFarmForm(false);
      setFarmName('');
      setFarmRegion('');
      setFarmSize('');
    } else {
      setFormError(res.error || s9.createFarmFailed);
    }
    setSaving(false);
  };

  const handleCreateField = async () => {
    if (!selectedFarm) {
      setFormError(s9.farmRequired);
      return;
    }
    const size = Number(fieldSize.replace(',', '.'));
    if (!fieldName.trim() || !Number.isFinite(size) || size <= 0) {
      setFormError(s9.plotRequired);
      return;
    }
    if (!fieldSoil) {
      // The server requires a soil type when creating a plot; fail with a clear
      // message rather than a generic "invalid input" from the API.
      setFormError(s9.plotSoilTypeRequired);
      return;
    }
    setSaving(true);
    setFormError(null);
    const res = await createField({
      farm_id: selectedFarm.id,
      name: fieldName.trim(),
      size_hectares: size,
      soil_type: fieldSoil || undefined,
      current_crop: fieldCrop.trim() || undefined,
    });
    if (res.data) {
      const list = await loadFields(selectedFarm.id);
      const created = list.find((f) => f.id === res.data!.id) ?? res.data;
      onSelectField(created);
      setShowFieldForm(false);
      setFieldName('');
      setFieldSize('');
      setFieldSoil('');
      setFieldCrop('');
    } else {
      setFormError(res.error || s9.plotRequired);
    }
    setSaving(false);
  };

  return (
    <View>
      <Card variant="elevated" style={styles.card}>
        <Text style={[styles.heading, isRtl && rtlStyles.rtlText]}>{s9.plotHeading}</Text>
        <Text style={[styles.sub, isRtl && rtlStyles.rtlText]}>{s9.plotSubtitle}</Text>

        {loadingFarms ? (
          <StateView kind="loading" title={s9.chooseFarm} compact />
        ) : farms.length === 0 && !showFarmForm ? (
          <View style={styles.emptyBox}>
            <StateView kind="empty" title={s9.noFarmsYet} message={s9.chooseFarmHint} compact />
            <Button title={s9.createFirstFarm} onPress={() => setShowFarmForm(true)} size="md" icon={<MaterialCommunityIcons name="plus" size={18} color={colors.primaryForeground} />} />
          </View>
        ) : (
          <>
            <Text style={[styles.label, isRtl && rtlStyles.rtlText]}>{s9.chooseFarm}</Text>
            <View style={styles.list}>
              {farms.map((farm) => {
                const active = selectedFarm?.id === farm.id;
                return (
                  <TouchableOpacity
                    key={farm.id}
                    activeOpacity={0.85}
                    onPress={() => {
                      onSelectFarm(farm);
                      onSelectField(null);
                      void loadFields(farm.id);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={farm.name}
                    style={[styles.option, active && styles.optionActive]}
                  >
                    <MaterialCommunityIcons
                      name={active ? 'radiobox-marked' : 'radiobox-blank'}
                      size={20}
                      color={active ? colors.primary : colors.textMuted}
                    />
                    <View style={styles.optionText}>
                      <Text style={[styles.optionTitle, isRtl && rtlStyles.rtlText]}>{farm.name}</Text>
                      <Text style={[styles.optionSub, isRtl && rtlStyles.rtlText]}>
                        {typeof farm.location === 'string' ? farm.location : farm.location?.region ?? ''} • {farm.size_hectares} ha
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity onPress={() => setShowFarmForm((v) => !v)} accessibilityRole="button" style={styles.addLink}>
              <MaterialCommunityIcons name="plus-circle-outline" size={18} color={colors.primary} />
              <Text style={styles.addLinkText}>{s9.createFirstFarm}</Text>
            </TouchableOpacity>
          </>
        )}

        {showFarmForm ? (
          <View style={styles.inlineForm}>
            <FormField label={s9.farmName} value={farmName} onChangeText={setFarmName} placeholder={s9.farmName} keyboard="default" />
            <Text style={[styles.label, isRtl && rtlStyles.rtlText]}>{s9.farmRegion}</Text>
            <ChipSelect options={governorateOptions} selected={farmRegion} onSelect={setFarmRegion} />
            <View style={{ height: spacing.sm }} />
            <FormField label={s9.farmAreaHa} value={farmSize} onChangeText={setFarmSize} placeholder="4.5" suffix="ha" />
            <Button title={saving ? s9.creatingFarm : s9.createFirstFarm} onPress={handleCreateFarm} loading={saving} size="md" />
          </View>
        ) : null}
      </Card>

      {selectedFarm ? (
        <Card variant="elevated" style={styles.card}>
          {loadingFields ? (
            <StateView kind="loading" title={s9.choosePlot} compact />
          ) : fields.length === 0 && !showFieldForm ? (
            <View style={styles.emptyBox}>
              <StateView kind="empty" title={s9.noPlotsYet} message={s9.choosePlotHint} compact />
              <Button title={s9.createPlot} onPress={() => setShowFieldForm(true)} size="md" icon={<MaterialCommunityIcons name="plus" size={18} color={colors.primaryForeground} />} />
            </View>
          ) : (
            <>
              <Text style={[styles.label, isRtl && rtlStyles.rtlText]}>{s9.choosePlot}</Text>
              <View style={styles.list}>
                {fields.map((field) => {
                  const active = selectedField?.id === field.id;
                  return (
                    <TouchableOpacity
                      key={field.id}
                      activeOpacity={0.85}
                      onPress={() => onSelectField(field)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={field.name}
                      style={[styles.option, active && styles.optionActive]}
                    >
                      <MaterialCommunityIcons
                        name={active ? 'radiobox-marked' : 'radiobox-blank'}
                        size={20}
                        color={active ? colors.primary : colors.textMuted}
                      />
                      <View style={styles.optionText}>
                        <Text style={[styles.optionTitle, isRtl && rtlStyles.rtlText]}>{field.name}</Text>
                        <Text style={[styles.optionSub, isRtl && rtlStyles.rtlText]}>
                          {field.size_hectares} ha{field.soil_type ? ` • ${field.soil_type}` : ''}
                          {field.current_crop ? ` • ${field.current_crop}` : ''}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity onPress={() => setShowFieldForm((v) => !v)} accessibilityRole="button" style={styles.addLink}>
                <MaterialCommunityIcons name="plus-circle-outline" size={18} color={colors.primary} />
                <Text style={styles.addLinkText}>{s9.createPlot}</Text>
              </TouchableOpacity>
            </>
          )}

          {showFieldForm ? (
            <View style={styles.inlineForm}>
              <FormField label={s9.plotName} value={fieldName} onChangeText={setFieldName} placeholder={s9.plotNamePlaceholder} keyboard="default" />
              <FormField label={s9.plotAreaHa} value={fieldSize} onChangeText={setFieldSize} placeholder="1.5" suffix="ha" />
              <Text style={[styles.label, isRtl && rtlStyles.rtlText]}>{s9.plotSoilType}</Text>
              <ChipSelect options={soilTypeOptions} selected={fieldSoil} onSelect={setFieldSoil} clearable />
              <View style={{ height: spacing.sm }} />
              <FormField label={s9.currentCropLabel} value={fieldCrop} onChangeText={setFieldCrop} placeholder={s9.currentCropPlaceholder} keyboard="default" />
              <Button title={saving ? s9.creatingPlot : s9.createPlot} onPress={handleCreateField} loading={saving} size="md" />
            </View>
          ) : null}
        </Card>
      ) : null}

      {error || formError ? (
        <StateCard kind="error" message={formError || error || ''} compact />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: stackedCard,
  heading: titleBase,
  sub: subtitleMetaBase,
  label: { fontSize: typography.fontSizes.xs, lineHeight: typography.lineHeights.xs, fontWeight: typography.fontWeights.semibold, color: colors.text, marginBottom: spacing.xs },
  list: { gap: spacing.sm, marginBottom: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  optionActive: chipActiveFill,
  optionText: flex1,
  optionTitle: titleSmSemibold,
  optionSub: subtitleMeta,
  addLink: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 48 },
  addLinkText: { fontSize: typography.fontSizes.sm, lineHeight: typography.lineHeights.sm, color: colors.primary, fontWeight: typography.fontWeights.semibold },
  emptyBox: { gap: spacing.sm, paddingVertical: spacing.sm },
  inlineForm: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
});
