import React, { useState, useEffect } from 'react';
import { rtlStyles } from '../../theme/rtl';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { useLanguage } from '../../context/LanguageContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { getWeather } from '../../api/client';
import { WeatherData } from '../../types';
import { StateView } from '../../components/ui/StateView';
import { ProvenanceBar } from '../../components/ui/ProvenanceBar';
import { ServiceHeader } from '../../components/ui/ServiceHeader';
import { useConnectivity } from '../../hooks/useConnectivity';
import { GOVERNORATES, governorateLabel } from '../../utils/governorates';
import { weatherConditionLabel, weatherIconName, weatherIconTone } from '../../utils/weather';

interface WeatherDetailScreenProps {
  onBack: () => void;
}

export const WeatherDetailScreen: React.FC<WeatherDetailScreenProps> = ({ onBack }) => {
  const { t, x, isRtl, language } = useLanguage();
  const { isOnline } = useConnectivity();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [selectedGovernorate, setSelectedGovernorate] = useState('tunis');
  const [coords, setCoords] = useState<{ lat: number; lon: number; label: string } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);

  const loadWeather = React.useCallback(
    async (govId: string) => {
      setLoading(true);
      setError(null);
      const gov = GOVERNORATES.find((g) => g.id === govId) || GOVERNORATES[0];
      const res = await getWeather(gov.lat, gov.lon, governorateLabel(gov, language));
      setWeather(res.data);
      setError(res.error);
      setFromCache(res.fromCache);
      setLoading(false);
    },
    [language],
  );

  // Real device coordinates replace the governorate reference point when the
  // user grants location access. The gateway resolves the actual Open-Meteo
  // observation for the exact lat/lon; nothing here is estimated.
  const loadMyLocation = React.useCallback(async () => {
    setLocating(true);
    setLocationNotice(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationNotice(x.weatherLocationDenied);
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      setCoords({ lat, lon, label: x.weatherMyLocationLabel });
      setLoading(true);
      setError(null);
      const res = await getWeather(lat, lon, x.weatherMyLocationLabel);
      setWeather(res.data);
      setError(res.error);
      setFromCache(res.fromCache);
      setLoading(false);
    } catch {
      setLocationNotice(x.weatherLocationFailed);
    } finally {
      setLocating(false);
    }
  }, [x]);

  useEffect(() => {
    (async () => {
      await loadWeather(selectedGovernorate);
    })();
  }, [selectedGovernorate, loadWeather]);

  // Choosing an explicit governorate abandons the device-location override so
  // the pill selection and the displayed data stay consistent.
  const handleSelectGovernorate = (govId: string) => {
    setCoords(null);
    setLocationNotice(null);
    setSelectedGovernorate(govId);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Info */}
      <ServiceHeader
        icon="weather-partly-cloudy"
        iconColor={colors.secondary}
        iconBg={colors.secondaryLight}
        title={t.weatherIntelligenceName}
        subtitle={x.weatherSubtitle}
      />

      {/* Governorate Selector Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.govScroll, isRtl && rtlStyles.rtlRow]}
      >
        {GOVERNORATES.map((gov) => {
          const isSelected = selectedGovernorate === gov.id;
          return (
            <TouchableOpacity
              key={gov.id}
              activeOpacity={0.8}
              onPress={() => handleSelectGovernorate(gov.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={governorateLabel(gov, language)}
              style={[styles.govPill, isSelected && styles.govPillSelected]}
            >
              <Text style={[styles.govPillText, isSelected && styles.govPillTextSelected]}>
                {governorateLabel(gov, language)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={loadMyLocation}
        disabled={locating}
        accessibilityRole="button"
        accessibilityLabel={x.weatherUseMyLocation}
        accessibilityState={{ disabled: locating, busy: locating }}
        testID="weather-use-location"
        style={[styles.locationBtn, isRtl && rtlStyles.rtlRow, locating && styles.locationBtnDisabled]}
      >
        <MaterialCommunityIcons
          name={coords ? 'crosshairs-gps' : 'crosshairs'}
          size={18}
          color={colors.secondary}
        />
        <Text style={styles.locationBtnText}>
          {locating ? x.weatherLocating : x.weatherUseMyLocation}
        </Text>
      </TouchableOpacity>

      {locationNotice ? (
        <Text style={[styles.locationNotice, isRtl && rtlStyles.rtlText]}>{locationNotice}</Text>
      ) : null}

      {loading && <StateView kind="loading" message={x.weatherLoading} />}

      {!loading && !weather ? (
        <Card variant="outlined">
          <StateView
            kind={isOnline ? 'error' : 'offline'}
            title={isOnline ? x.stateError : x.stateOffline}
            message={error || undefined}
            onRetry={() => loadWeather(selectedGovernorate)}
            retryLabel={x.retry}
          />
        </Card>
      ) : null}

      {/* Main Today Weather Card */}
      {weather && (
        <>
          <Card variant="elevated" style={styles.currentCard}>
            <View style={[styles.currentHeader, isRtl && rtlStyles.rtlRow]}>
              <View>
                <Text style={[styles.currentGov, isRtl && rtlStyles.rtlText]}>{weather.governorate}</Text>
                <Text style={[styles.currentCondition, isRtl && rtlStyles.rtlText]}>
                {weatherConditionLabel(weather.icon, language, weather.condition_ar)}
              </Text>
              </View>
              <Badge label={x.weatherLiveBadge} variant="info" size="sm" />
            </View>

            <View style={[styles.tempRow, isRtl && rtlStyles.rtlRow]}>
              <Text style={styles.tempLarge}>{weather.temperature}°</Text>
              <MaterialCommunityIcons
                name={weatherIcon(weather.icon)}
                size={56}
                color={weatherIconColor(weather.icon)}
              />
            </View>

            <View style={[styles.metricsGrid, isRtl && rtlStyles.rtlRow]}>
              <View style={styles.metricBox}>
                <MaterialCommunityIcons name="water-percent" size={20} color={colors.secondary} />
                <Text style={styles.metricVal}>{weather.humidity}%</Text>
                <Text style={styles.metricSub}>{x.weatherHumidity}</Text>
              </View>
              <View style={styles.metricBox}>
                <MaterialCommunityIcons name="weather-rainy" size={20} color={colors.info} />
                <Text style={styles.metricVal}>{weather.rainfall_mm} {x.unitMm}</Text>
                <Text style={styles.metricSub}>{x.weatherRainToday}</Text>
              </View>
              <View style={styles.metricBox}>
                <MaterialCommunityIcons name="weather-windy" size={20} color={colors.textSecondary} />
                <Text style={styles.metricVal}>{weather.wind_speed} {x.unitKmh}</Text>
                <Text style={styles.metricSub}>{x.weatherWindSpeed}</Text>
              </View>
            </View>

            {/* Farm Advice */}
            <View style={[styles.adviceBanner, isRtl && rtlStyles.rtlRow]}>
              <MaterialCommunityIcons name="lightbulb-on" size={18} color={colors.accent} />
              <Text style={[styles.adviceText, isRtl && rtlStyles.rtlText]}>
                {language === 'ar' ? weather.advice_ar : language === 'fr' ? weather.advice_fr : weather.advice_en}
              </Text>
            </View>
          </Card>

          <ProvenanceBar meta={weather.meta} detailed cached={fromCache} style={styles.provRow} />

          {/* 5-Day Forecast */}
          <View style={styles.forecastSection}>
            <Text style={[styles.forecastHeading, isRtl && rtlStyles.rtlText]}>{x.weatherForecast}</Text>
            {weather.forecast.length === 0 ? (
              <Card variant="outlined">
                <StateView kind="empty" title={x.stateEmpty} message={x.weatherForecastEmpty} compact />
              </Card>
            ) : (
              weather.forecast.map((day, idx) => (
                <Card key={idx} variant="outlined" style={styles.forecastCard}>
                  <View style={[styles.forecastRow, isRtl && rtlStyles.rtlRow]}>
                    <Text style={[styles.dayText, isRtl && rtlStyles.rtlText]}>{formatDay(day.date, language)}</Text>
                    <View style={[styles.forecastConditionRow, isRtl && rtlStyles.rtlRow]}>
                      <MaterialCommunityIcons
                        name={weatherIcon(day.icon)}
                        size={20}
                        color={weatherIconColor(day.icon)}
                      />
                      <Text style={styles.conditionSub}>
                        {typeof day.rainfall === 'number' && day.rainfall > 0
                          ? `${day.rainfall} ${x.unitMm}`
                          : weatherConditionLabel(day.icon, language, day.condition_ar)}
                      </Text>
                    </View>
                    <View style={[styles.tempMinMax, isRtl && rtlStyles.rtlRow]}>
                      <Text style={styles.tempMax}>{day.temp_max}°</Text>
                      <Text style={styles.tempMin}> / {day.temp_min}°</Text>
                    </View>
                  </View>
                </Card>
              ))
            )}
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

const DAY_NAMES: Record<string, string[]> = {
  ar: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
  fr: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};

function formatDay(dateStr: string, language: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  const days = DAY_NAMES[language] || DAY_NAMES.ar;
  return days[date.getDay()] || dateStr;
}

/** Map the provider's machine icon key to a MaterialCommunityIcons glyph. */
function weatherIcon(icon: string | undefined): keyof typeof MaterialCommunityIcons.glyphMap {
  return weatherIconName(icon) as keyof typeof MaterialCommunityIcons.glyphMap;
}

/** Colour the glyph to match the condition rather than always showing sun. */
function weatherIconColor(icon: string | undefined): string {
  switch (weatherIconTone(icon)) {
    case 'accent':
      return colors.accent;
    case 'info':
      return colors.info;
    case 'secondary':
      return colors.secondary;
    default:
      return colors.textSecondary;
  }
}

const styles = StyleSheet.create({
  provRow: { marginTop: spacing.sm },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.secondary,
    backgroundColor: colors.card,
    marginBottom: spacing.sm,
  },
  locationBtnDisabled: { opacity: 0.6 },
  locationBtnText: {
    fontSize: typography.fontSizes.sm,
    lineHeight: typography.lineHeights.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.secondary,
  },
  locationNotice: {
    fontSize: typography.fontSizes.xs,
    lineHeight: typography.lineHeights.xs,
    color: colors.warning,
    marginBottom: spacing.sm,
  },
  govScroll: {
    gap: spacing.xs,
    paddingBottom: spacing.md,
  },
  govPill: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 14,
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
    lineHeight: typography.lineHeights.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  govPillTextSelected: {
    color: colors.textInverse,
    fontWeight: typography.fontWeights.bold,
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
    fontSize: typography.fontSizes.base, lineHeight: typography.lineHeights.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  currentCondition: {
    fontSize: typography.fontSizes.xs,
    lineHeight: typography.lineHeights.xs,
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
    fontSize: typography.fontSizes.display,
    lineHeight: typography.lineHeights.display,
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
    fontSize: typography.fontSizes.sm, lineHeight: typography.lineHeights.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  metricSub: {
    fontSize: typography.fontSizes.xs,
    lineHeight: typography.lineHeights.xs,
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
    lineHeight: typography.lineHeights.xs,
  },
  forecastSection: {
    gap: spacing.xs,
  },
  forecastHeading: {
    fontSize: typography.fontSizes.sm, lineHeight: typography.lineHeights.sm,
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
    lineHeight: typography.lineHeights.sm,
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
    lineHeight: typography.lineHeights.xs,
    color: colors.textSecondary,
  },
  tempMinMax: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tempMax: {
    fontSize: typography.fontSizes.sm, lineHeight: typography.lineHeights.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  tempMin: {
    fontSize: typography.fontSizes.xs,
    lineHeight: typography.lineHeights.xs,
    color: colors.textMuted,
  },
});
