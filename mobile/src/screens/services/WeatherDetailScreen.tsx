import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography, shadows } from '../../theme/colors';
import { useLanguage } from '../../context/LanguageContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { getWeather } from '../../api/client';
import { WeatherData } from '../../types';

interface WeatherDetailScreenProps {
  onBack: () => void;
}

export const WeatherDetailScreen: React.FC<WeatherDetailScreenProps> = ({ onBack }) => {
  const { t, isRtl } = useLanguage();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedGovernorate, setSelectedGovernorate] = useState('tunis');

  const governorates = [
    { id: 'tunis', label: 'تونس الكبرى', lat: 36.8065, lon: 10.1815 },
    { id: 'kairouan', label: 'القيروان', lat: 35.6781, lon: 10.0963 },
    { id: 'beja', label: 'باجة والشمال', lat: 36.7256, lon: 9.1817 },
    { id: 'sousse', label: 'سوسة والساحل', lat: 35.8256, lon: 10.6369 },
    { id: 'sfax', label: 'صفاقس', lat: 34.7406, lon: 10.7603 },
    { id: 'kebili', label: 'قبلي وتوزر', lat: 33.7047, lon: 8.9694 },
  ];

  const loadWeather = async (govId: string) => {
    setLoading(true);
    const gov = governorates.find((g) => g.id === govId) || governorates[0];
    try {
      const data = await getWeather(gov.lat, gov.lon, gov.label);
      setWeather(data);
    } catch (e) {
      console.warn('Weather load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeather(selectedGovernorate);
  }, [selectedGovernorate]);

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
            <MaterialCommunityIcons name="weather-partly-cloudy" size={26} color={colors.secondary} />
          </View>
          <View style={styles.titleTextContainer}>
            <Text style={[styles.mainTitle, isRtl && styles.rtlText]}>
              {t.weatherIntelligenceName}
            </Text>
            <Text style={[styles.mainSub, isRtl && styles.rtlText]}>
              بيانات حية مباشرة من محطات الرصد الجوي التونسية (Open-Meteo)
            </Text>
          </View>
        </View>
      </View>

      {/* Governorate Selector Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.govScroll, isRtl && styles.rtlRow]}
      >
        {governorates.map((gov) => {
          const isSelected = selectedGovernorate === gov.id;
          return (
            <TouchableOpacity
              key={gov.id}
              activeOpacity={0.8}
              onPress={() => setSelectedGovernorate(gov.id)}
              style={[styles.govPill, isSelected && styles.govPillSelected]}
            >
              <Text style={[styles.govPillText, isSelected && styles.govPillTextSelected]}>
                {gov.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.secondary} />
          <Text style={styles.loadingText}>جاري جلب أحدث بيانات الرصد الجوي...</Text>
        </View>
      )}

      {/* Main Today Weather Card */}
      {weather && (
        <>
          <Card variant="elevated" style={styles.currentCard}>
            <View style={[styles.currentHeader, isRtl && styles.rtlRow]}>
              <View>
                <Text style={[styles.currentGov, isRtl && styles.rtlText]}>{weather.governorate}</Text>
                <Text style={[styles.currentCondition, isRtl && styles.rtlText]}>{weather.condition_ar}</Text>
              </View>
              <Badge label="بيانات حية" variant="info" size="sm" />
            </View>

            <View style={[styles.tempRow, isRtl && styles.rtlRow]}>
              <Text style={styles.tempLarge}>{weather.temperature}°</Text>
              <MaterialCommunityIcons name="weather-sunny" size={56} color={colors.accent} />
            </View>

            <View style={[styles.metricsGrid, isRtl && styles.rtlRow]}>
              <View style={styles.metricBox}>
                <MaterialCommunityIcons name="water-percent" size={20} color={colors.secondary} />
                <Text style={styles.metricVal}>{weather.humidity}%</Text>
                <Text style={styles.metricSub}>الرطوبة</Text>
              </View>
              <View style={styles.metricBox}>
                <MaterialCommunityIcons name="weather-rainy" size={20} color={colors.info} />
                <Text style={styles.metricVal}>{weather.precipitation_probability}%</Text>
                <Text style={styles.metricSub}>فرصة المطر</Text>
              </View>
              <View style={styles.metricBox}>
                <MaterialCommunityIcons name="weather-windy" size={20} color={colors.textSecondary} />
                <Text style={styles.metricVal}>{weather.wind_speed} كم/س</Text>
                <Text style={styles.metricSub}>سرعة الرياح</Text>
              </View>
            </View>

            {/* Farm Advice */}
            <View style={styles.adviceBanner}>
              <MaterialCommunityIcons name="lightbulb-on" size={18} color={colors.accent} />
              <Text style={[styles.adviceText, isRtl && styles.rtlText]}>{weather.advice_ar}</Text>
            </View>
          </Card>

          {/* 5-Day Forecast */}
          <View style={styles.forecastSection}>
            <Text style={[styles.forecastHeading, isRtl && styles.rtlText]}>
              توقعات الأيام القادمة
            </Text>
            {weather.forecast.map((day, idx) => (
              <Card key={idx} variant="outlined" style={styles.forecastCard}>
                <View style={[styles.forecastRow, isRtl && styles.rtlRow]}>
                  <Text style={[styles.dayText, isRtl && styles.rtlText]}>{day.day_ar}</Text>
                  <View style={[styles.forecastConditionRow, isRtl && styles.rtlRow]}>
                    <MaterialCommunityIcons
                      name={day.rain_chance > 30 ? 'weather-rainy' : 'weather-partly-cloudy'}
                      size={20}
                      color={day.rain_chance > 30 ? colors.info : colors.accent}
                    />
                    <Text style={styles.conditionSub}>{day.condition_ar}</Text>
                  </View>
                  <View style={styles.tempMinMax}>
                    <Text style={styles.tempMax}>{day.temp_max}°</Text>
                    <Text style={styles.tempMin}> / {day.temp_min}°</Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        </>
      )}

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
    backgroundColor: colors.secondaryLight,
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
  govScroll: {
    gap: spacing.xs,
    paddingBottom: spacing.md,
  },
  govPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  govPillSelected: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  govPillText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  govPillTextSelected: {
    color: colors.textInverse,
    fontWeight: typography.fontWeights.bold,
  },
  loadingBox: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
  },
  currentCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  currentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentGov: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  currentCondition: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: spacing.md,
  },
  tempLarge: {
    fontSize: 54,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  metricBox: {
    alignItems: 'center',
    gap: 2,
  },
  metricVal: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  metricSub: {
    fontSize: 10,
    color: colors.textMuted,
  },
  adviceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accentLight,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  adviceText: {
    flex: 1,
    fontSize: typography.fontSizes.xs,
    color: colors.accentDark,
    lineHeight: 18,
  },
  forecastSection: {
    gap: spacing.xs,
  },
  forecastHeading: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  forecastCard: {
    padding: spacing.md,
  },
  forecastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    width: 80,
  },
  forecastConditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  conditionSub: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
  },
  tempMinMax: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tempMax: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  tempMin: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
  },
});
