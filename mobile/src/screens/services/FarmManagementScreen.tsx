import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography, shadows } from '../../theme/colors';
import { useLanguage } from '../../context/LanguageContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { getFarms, getFields, apiRequest } from '../../api/client';
import { Farm, Field } from '../../types';

interface FarmManagementScreenProps {
  onBack: () => void;
}

export const FarmManagementScreen: React.FC<FarmManagementScreenProps> = ({ onBack }) => {
  const { t, isRtl } = useLanguage();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Field Form States
  const [fieldName, setFieldName] = useState('');
  const [fieldArea, setFieldArea] = useState('');
  const [fieldSoil, setFieldSoil] = useState('طينية خصبة');
  const [fieldCrop, setFieldCrop] = useState('زيتون شملالي');
  const [saving, setSaving] = useState(false);

  const loadFarmData = async () => {
    setLoading(true);
    try {
      const [farmsData, fieldsData] = await Promise.all([getFarms(), getFields()]);
      setFarms(farmsData);
      setFields(fieldsData);
    } catch (e) {
      console.warn('Error loading farms:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFarmData();
  }, []);

  const handleAddField = async () => {
    if (!fieldName.trim() || !fieldArea.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال اسم الحقل والمساحة بالهكتار.');
      return;
    }

    setSaving(true);
    try {
      const farmId = farms[0]?.id || 'farm-1';
      const newFieldData = {
        farm_id: farmId,
        name: fieldName,
        size_hectares: parseFloat(fieldArea) || 5.0,
        soil_type: fieldSoil,
        current_crop: fieldCrop,
      };

      await apiRequest('/api/fields', {
        method: 'POST',
        body: JSON.stringify(newFieldData),
      });

      // Add to local state
      const addedField: Field = {
        id: `field-${Date.now()}`,
        farm_id: farmId,
        name: fieldName,
        name_ar: fieldName,
        size_hectares: parseFloat(fieldArea) || 5.0,
        soil_type: fieldSoil,
        current_crop: fieldCrop,
        planting_date: new Date().toISOString().split('T')[0],
      };

      setFields((prev) => [addedField, ...prev]);
      setShowAddModal(false);
      setFieldName('');
      setFieldArea('');
      Alert.alert('نجاح', 'تمت إضافة الحقل الجديد بنجاح إلى سجلك الزراعي!');
    } catch (e) {
      console.warn('Error creating field:', e);
      Alert.alert('خطأ', 'تعذر حفظ الحقل.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Info */}
      <View style={styles.headerBox}>
        <View style={[styles.titleRow, isRtl && styles.rtlRow]}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="map-marker-radius" size={26} color={colors.primary} />
          </View>
          <View style={styles.titleTextContainer}>
            <Text style={[styles.mainTitle, isRtl && styles.rtlText]}>{t.farmManagementName}</Text>
            <Text style={[styles.mainSub, isRtl && styles.rtlText]}>
              متابعة قطع الأراضي، مساحاتها، المحاصيل المغروسة، وتواريخ الحصاد
            </Text>
          </View>
        </View>
      </View>

      {/* Farm Overview Card */}
      {farms.length > 0 && (
        <Card variant="elevated" style={styles.farmSummaryCard}>
          <View style={[styles.farmHeader, isRtl && styles.rtlRow]}>
            <View style={styles.farmHeaderInfo}>
              <Text style={[styles.farmName, isRtl && styles.rtlText]}>{farms[0].name_ar || farms[0].name}</Text>
              <Text style={[styles.farmLocation, isRtl && styles.rtlText]}>
                <MaterialCommunityIcons name="map-marker" size={14} color={colors.primary} />{' '}
                {typeof farms[0].location === 'string' ? farms[0].location : 'تونس'}
              </Text>
            </View>
            <Badge label={`${farms[0].size_hectares} هكتار`} variant="primary" size="md" />
          </View>

          <View style={[styles.farmStatsRow, isRtl && styles.rtlRow]}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{fields.length}</Text>
              <Text style={styles.statLabel}>عدد الحقول</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statVal}>
                {fields.reduce((acc, f) => acc + (f.size_hectares || 0), 0).toFixed(1)}
              </Text>
              <Text style={styles.statLabel}>إجمالي المساحة المستغلة</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statVal}>100%</Text>
              <Text style={styles.statLabel}>جاهزية التربة</Text>
            </View>
          </View>
        </Card>
      )}

      {/* Add Field Button */}
      <Button
        title={showAddModal ? 'إلغاء الإضافة' : '+ تسجيل حقل / قطعة أرض جديدة'}
        variant={showAddModal ? 'outline' : 'primary'}
        size="md"
        onPress={() => setShowAddModal(!showAddModal)}
        style={{ marginBottom: spacing.md }}
      />

      {/* Add Field Form Modal/Card */}
      {showAddModal && (
        <Card variant="outlined" style={styles.addFormCard}>
          <Text style={[styles.formTitle, isRtl && styles.rtlText]}>بيانات الحقل الجديد</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, isRtl && styles.rtlText]}>اسم الحقل أو القطعة</Text>
            <TextInput
              style={[styles.input, isRtl && styles.rtlText]}
              placeholder="مثال: قطعة الزيتون الشمالية"
              placeholderTextColor={colors.textMuted}
              value={fieldName}
              onChangeText={setFieldName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, isRtl && styles.rtlText]}>المساحة (بالهكتار)</Text>
            <TextInput
              style={[styles.input, isRtl && styles.rtlText]}
              placeholder="مثال: 4.5"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={fieldArea}
              onChangeText={setFieldArea}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, isRtl && styles.rtlText]}>المحصول المزروع</Text>
            <TextInput
              style={[styles.input, isRtl && styles.rtlText]}
              placeholder="مثال: زيتون شملالي، قمح، طماطم..."
              placeholderTextColor={colors.textMuted}
              value={fieldCrop}
              onChangeText={setFieldCrop}
            />
          </View>

          <Button
            title={saving ? 'جاري الحفظ...' : 'حفظ الحقل في قاعدة البيانات'}
            onPress={handleAddField}
            loading={saving}
            size="md"
            style={{ marginTop: spacing.sm }}
          />
        </Card>
      )}

      {/* Fields List */}
      <View style={styles.fieldsSection}>
        <Text style={[styles.sectionTitle, isRtl && styles.rtlText]}>حقول وقطع المزرعة</Text>

        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          fields.map((field) => (
            <Card key={field.id} variant="elevated" style={styles.fieldCard}>
              <View style={[styles.fieldHeader, isRtl && styles.rtlRow]}>
                <View style={styles.fieldInfo}>
                  <Text style={[styles.fieldName, isRtl && styles.rtlText]}>{field.name_ar || field.name}</Text>
                  <Text style={[styles.fieldCrop, isRtl && styles.rtlText]}>
                    المحصول الحالي: <Text style={styles.cropHighlight}>{field.current_crop || 'غير محدد'}</Text>
                  </Text>
                </View>
                <Badge label={`${field.size_hectares} هكتار`} variant="secondary" size="md" />
              </View>

              <View style={[styles.fieldFooter, isRtl && styles.rtlRow]}>
                <View style={[styles.footerMeta, isRtl && styles.rtlRow]}>
                  <MaterialCommunityIcons name="layers-triple" size={16} color={colors.soil} />
                  <Text style={styles.footerText}>نوع التربة: {field.soil_type}</Text>
                </View>
                {field.planting_date && (
                  <View style={[styles.footerMeta, isRtl && styles.rtlRow]}>
                    <MaterialCommunityIcons name="calendar-check" size={16} color={colors.primary} />
                    <Text style={styles.footerText}>تاريخ الغراسة: {field.planting_date}</Text>
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
  rtlText: {
    textAlign: 'right',
  },
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
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  mainSub: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  farmSummaryCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  farmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  farmHeaderInfo: {
    flex: 1,
  },
  farmName: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  farmLocation: {
    fontSize: typography.fontSizes.xs,
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
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.primaryDark,
  },
  statLabel: {
    fontSize: 10,
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
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  inputGroup: {
    marginBottom: spacing.sm,
  },
  inputLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text,
    marginBottom: 4,
  },
  input: {
    height: 44,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSizes.sm,
    color: colors.text,
  },
  fieldsSection: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
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
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  fieldCrop: {
    fontSize: typography.fontSizes.xs,
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
    fontSize: 10,
    color: colors.textSecondary,
  },
});
