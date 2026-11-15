import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { rtlStyles } from '../../theme/rtl';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme/colors';
import { titleBase } from '../../theme/typographyStyles';
import { stackedCard } from '../../theme/layout';
import { useLanguage } from '../../context/LanguageContext';
import { getSoil } from '../../i18n/soil';
import { Card } from '../ui/Card';
import { FormField } from '../ui/FormField';
import { ChipSelect } from '../ui/ChipSelect';
import {
  ADVANCED_MEASUREMENTS,
  CORE_MEASUREMENTS,
  EC_UNITS,
  IRRIGATION_METHODS,
  MeasurementDef,
  NUTRIENT_MEASUREMENTS,
  NUTRIENT_UNITS,
  TEXTURE_MEASUREMENTS,
  WATER_MEASUREMENTS,
} from '../../utils/soilMeasurements';

export interface MeasurementsValues {
  /** Raw text keyed by field, so blank stays distinguishable from 0. */
  values: Record<string, string>;
  ecUnit: string;
  waterEcUnit: string;
  nutrientUnit: string;
  nutrientMethod: string;
  ecMethod: string;
  irrigationMethod: string;
  targetCrop: string;
  samplingDate: string;
}

interface MeasurementsStepProps {
  initial?: Partial<MeasurementsValues>;
  onChange: (next: MeasurementsValues) => void;
}

const emptyValues: MeasurementsValues = {
  values: {},
  ecUnit: '',
  waterEcUnit: '',
  nutrientUnit: '',
  nutrientMethod: '',
  ecMethod: '',
  irrigationMethod: '',
  targetCrop: '',
  samplingDate: '',
};

/** Renders one measurement field with its unit suffix and help line. */
const MeasurementField: React.FC<{
  def: MeasurementDef;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}> = ({ def, values, onChange }) => {
  const { language, isRtl } = useLanguage();
  const s9 = getSoil(language);
  return (
    <FormField
      label={s9[def.labelKey]}
      value={values[def.key] ?? ''}
      onChangeText={(v) => onChange(def.key, v)}
      hint={s9[def.helpKey]}
      suffix={def.unit}
      style={isRtl ? styles.fieldRtl : undefined}
    />
  );
};

/**
 * Step 2 — the measurement form. Every field is optional and blank fields are
 * never defaulted; the server's report lists them as missing instead. Grouped so
 * a farmer can enter just the essentials and open the advanced block only if the
 * lab provided more.
 */
export const MeasurementsStep: React.FC<MeasurementsStepProps> = ({ initial, onChange }) => {
  const { language, isRtl } = useLanguage();
  const s9 = getSoil(language);
  const [state, setState] = useState<MeasurementsValues>({ ...emptyValues, ...initial });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const update = (patch: Partial<MeasurementsValues>) => {
    const next = { ...state, ...patch };
    setState(next);
    onChange(next);
  };

  const setValue = (key: string, value: string) => update({ values: { ...state.values, [key]: value } });

  const ecUnitOptions = EC_UNITS.map((u) => ({ value: u, label: u }));
  const nutrientUnitOptions = NUTRIENT_UNITS.map((u) => ({ value: u, label: u }));
  const irrigationOptions = IRRIGATION_METHODS.map((u) => ({
    value: u,
    label:
      u === 'drip'
        ? language === 'fr'
          ? 'Goutte'
          : language === 'en'
            ? 'Drip'
            : 'تنقيط'
        : u === 'sprinkler'
          ? language === 'fr'
            ? 'Aspersion'
            : language === 'en'
              ? 'Sprinkler'
              : 'رشّاش'
          : u === 'flood'
            ? language === 'fr'
              ? 'Submersion'
              : language === 'en'
                ? 'Flood'
                : 'غمر'
            : u === 'furrow'
              ? language === 'fr'
                ? 'Rigoles'
                : language === 'en'
                  ? 'Furrow'
                  : 'أخاديد'
              : language === 'fr'
                ? 'Aucune'
                : language === 'en'
                  ? 'None'
                  : 'بدون',
  }));

  return (
    <View>
      <Card variant="elevated" style={styles.card}>
        <Text style={[styles.heading, isRtl && rtlStyles.rtlText]}>{s9.measurementsHeading}</Text>
        <Text style={[styles.sub, isRtl && rtlStyles.rtlText]}>{s9.measurementsSubtitle}</Text>

        <Text style={[styles.groupTitle, isRtl && rtlStyles.rtlText]}>{s9.groupCore}</Text>
        {CORE_MEASUREMENTS.map((def) => (
          <MeasurementField key={def.key} def={def} values={state.values} onChange={setValue} />
        ))}

        {state.values.electricalConductivity?.trim() ? (
          <View style={styles.subBlock}>
            <Text style={[styles.label, isRtl && rtlStyles.rtlText]}>{s9.ecUnitLabel}</Text>
            <ChipSelect options={ecUnitOptions} selected={state.ecUnit} onSelect={(v) => update({ ecUnit: v })} />
            <View style={{ height: spacing.sm }} />
            <FormField label={s9.unitMethodLabel} value={state.ecMethod} onChangeText={(v) => update({ ecMethod: v })} placeholder="1:5, ECe…" keyboard="default" />
          </View>
        ) : null}

        <Text style={[styles.groupTitle, isRtl && rtlStyles.rtlText]}>{s9.groupNutrients}</Text>
        {NUTRIENT_MEASUREMENTS.map((def) => (
          <MeasurementField key={def.key} def={def} values={state.values} onChange={setValue} />
        ))}
        <View style={styles.subBlock}>
          <Text style={[styles.label, isRtl && rtlStyles.rtlText]}>{s9.unitMethodLabel}</Text>
          <ChipSelect options={nutrientUnitOptions} selected={state.nutrientUnit} onSelect={(v) => update({ nutrientUnit: v })} clearable />
          <View style={{ height: spacing.sm }} />
          <FormField label={s9.unitMethodLabel} value={state.nutrientMethod} onChangeText={(v) => update({ nutrientMethod: v })} hint={s9.nutrientUnitHint} keyboard="default" />
        </View>

        <Text style={[styles.groupTitle, isRtl && rtlStyles.rtlText]}>{s9.groupTexture}</Text>
        <Text style={[styles.groupHint, isRtl && rtlStyles.rtlText]}>{s9.textureHint}</Text>
        {TEXTURE_MEASUREMENTS.map((def) => (
          <MeasurementField key={def.key} def={def} values={state.values} onChange={setValue} />
        ))}

        <TouchableOpacity onPress={() => setShowAdvanced((v) => !v)} accessibilityRole="button" style={styles.toggle}>
          <MaterialCommunityIcons name={showAdvanced ? 'chevron-up' : 'chevron-down'} size={20} color={colors.primary} />
          <Text style={styles.toggleText}>{showAdvanced ? s9.hideAdvanced : s9.showAdvanced}</Text>
        </TouchableOpacity>

        {showAdvanced ? (
          <View>
            <Text style={[styles.groupTitle, isRtl && rtlStyles.rtlText]}>{s9.groupAdvanced}</Text>
            {ADVANCED_MEASUREMENTS.map((def) => (
              <MeasurementField key={def.key} def={def} values={state.values} onChange={setValue} />
            ))}

            <Text style={[styles.groupTitle, isRtl && rtlStyles.rtlText]}>{s9.groupWater}</Text>
            {WATER_MEASUREMENTS.map((def) => (
              <MeasurementField key={def.key} def={def} values={state.values} onChange={setValue} />
            ))}
            {state.values.waterElectricalConductivity?.trim() ? (
              <View style={styles.subBlock}>
                <Text style={[styles.label, isRtl && rtlStyles.rtlText]}>{s9.waterEcUnitLabel}</Text>
                <ChipSelect options={ecUnitOptions} selected={state.waterEcUnit} onSelect={(v) => update({ waterEcUnit: v })} />
              </View>
            ) : null}

            <Text style={[styles.groupTitle, isRtl && rtlStyles.rtlText]}>{s9.groupContext}</Text>
            <Text style={[styles.label, isRtl && rtlStyles.rtlText]}>{s9.irrigationMethodLabel}</Text>
            <ChipSelect options={irrigationOptions} selected={state.irrigationMethod} onSelect={(v) => update({ irrigationMethod: v })} clearable />
            <View style={{ height: spacing.sm }} />
            <FormField label={s9.samplingDateLabel} value={state.samplingDate} onChangeText={(v) => update({ samplingDate: v })} placeholder="YYYY-MM-DD" keyboard="default" />
            <FormField
              label={s9.targetCropLabel}
              value={state.targetCrop}
              onChangeText={(v) => update({ targetCrop: v })}
              hint={s9.targetCropHint}
              placeholder={s9.currentCropPlaceholder}
              keyboard="default"
            />
          </View>
        ) : null}

        <Text style={[styles.note, isRtl && rtlStyles.rtlText]}>{s9.optionalFieldNote}</Text>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  card: stackedCard,
  heading: titleBase,
  sub: { fontSize: typography.fontSizes.xs, lineHeight: typography.lineHeights.xs, color: colors.textSecondary, marginTop: 2, marginBottom: spacing.md },
  groupTitle: { fontSize: typography.fontSizes.sm, lineHeight: typography.lineHeights.sm, fontWeight: typography.fontWeights.bold, color: colors.primaryDark, marginTop: spacing.sm, marginBottom: spacing.xs },
  groupHint: { fontSize: typography.fontSizes.xs, lineHeight: typography.lineHeights.xs, color: colors.textMuted, marginBottom: spacing.xs },
  label: { fontSize: typography.fontSizes.xs, lineHeight: typography.lineHeights.xs, fontWeight: typography.fontWeights.semibold, color: colors.text, marginBottom: spacing.xs },
  fieldRtl: {},
  subBlock: { marginTop: spacing.xs },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 48, marginTop: spacing.sm },
  toggleText: { fontSize: typography.fontSizes.sm, lineHeight: typography.lineHeights.sm, color: colors.primary, fontWeight: typography.fontWeights.semibold },
  note: { fontSize: typography.fontSizes.xs, lineHeight: typography.lineHeights.xs, color: colors.textMuted, marginTop: spacing.sm },
});
