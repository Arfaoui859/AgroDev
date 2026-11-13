import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography, shadows } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import {
  getWeather,
  getFarmAlerts,
  getTodayTasks,
} from '../api/client';
import { WeatherData, FarmAlert, FarmTask } from '../types';

interface HomeScreenProps {
  onNavigateToService: (serviceId: string) => void;
  onNavigateToTab: (tabKey: any) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToService,
  onNavigateToTab,
}) => {
  const { t, isRtl, isArabic } = useLanguage();
  const { user } = useAuth();

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [alerts, setAlerts] = useState<FarmAlert[]>([]);
  const [tasks, setTasks] = useState<FarmTask[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      const [w, a, ts] = await Promise.all([
        getWeather(),
        getFarmAlerts(),
        getTodayTasks(),
      ]);
      setWeather(w);
      setAlerts(a);
      setTasks(ts);
    } catch (e) {
      console.warn('Error loading home data:', e);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const toggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  const displayName = isArabic
    ? user?.full_name_ar || user?.full_name || 'الفلاح الكريم'
    : user?.full_name || 'Dear Farmer';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
    >
      {/* 1. Personalized Greeting Banner */}
      <View style={[styles.greetingCard, isRtl && styles.rtlRow]}>
        <View style={styles.greetingTextContainer}>
          <Text style={[styles.greetingTitle, isRtl && styles.rtlText]}>
            {t.greeting}، {displayName} 👋
          </Text>
          <Text style={[styles.greetingSub, isRtl && styles.rtlText]}>
            {t.welcomeSub} • {user?.governorate || 'تونس'}
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onNavigateToTab('profile')}
          style={styles.avatarButton}
        >
          <MaterialCommunityIcons name="account" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* 2. Weather Summary Card */}
      {weather && (
        <Card
          variant="elevated"
          onPress={() => onNavigateToService('weather')}
          style={styles.weatherCard}
        >
          <View style={[styles.weatherHeader, isRtl && styles.rtlRow]}>
            <View style={[styles.weatherMain, isRtl && styles.rtlRow]}>
              <MaterialCommunityIcons name="weather-partly-cloudy" size={38} color={colors.secondary} />
              <View style={styles.weatherTempContainer}>
                <Text style={styles.tempText}>{weather.temperature}°C</Text>
                <Text style={styles.conditionText}>{weather.condition_ar}</Text>
              </View>
            </View>
            <Badge label={weather.governorate} variant="secondary" size="md" />
          </View>

          {/* Key Weather Metrics */}
          <View style={[styles.weatherMetricsRow, isRtl && styles.rtlRow]}>
            <View style={styles.metricItem}>
              <MaterialCommunityIcons name="water-percent" size={18} color={colors.secondary} />
              <Text style={styles.metricLabel}>{weather.humidity}% رطوبة</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <MaterialCommunityIcons name="weather-rainy" size={18} color={colors.info} />
              <Text style={styles.metricLabel}>{weather.precipitation_probability}% أمطار</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <MaterialCommunityIcons name="weather-windy" size={18} color={colors.textSecondary} />
              <Text style={styles.metricLabel}>{weather.wind_speed} كم/س</Text>
            </View>
          </View>

          {/* Agricultural Advice Banner */}
          <View style={[styles.weatherAdviceBox, isRtl && styles.rtlRow]}>
            <MaterialCommunityIcons name="lightbulb-on" size={18} color={colors.accent} />
            <Text style={[styles.weatherAdviceText, isRtl && styles.rtlText]} numberOfLines={2}>
              {weather.advice_ar}
            </Text>
          </View>
        </Card>
      )}

      {/* 3. Urgent Alerts (if any) */}
      {alerts.length > 0 && (
        <View style={styles.sectionContainer}>
          <View style={[styles.sectionHeader, isRtl && styles.rtlRow]}>
            <View style={[styles.sectionTitleRow, isRtl && styles.rtlRow]}>
              <MaterialCommunityIcons name="alert-circle" size={20} color={colors.danger} />
              <Text style={styles.sectionTitle}>{t.urgentAlerts}</Text>
            </View>
            <Badge label={`${alerts.length}`} variant="danger" size="sm" />
          </View>

          {alerts.map((alert) => (
            <Card
              key={alert.id}
              variant="outlined"
              style={styles.alertCard}
              onPress={() => onNavigateToService('disease')}
            >
              <View style={[styles.alertRow, isRtl && styles.rtlRow]}>
                <View style={styles.alertIconBadge}>
                  <MaterialCommunityIcons
                    name={alert.type === 'weather' ? 'weather-lightning' : 'bug'}
                    size={22}
                    color={colors.danger}
                  />
                </View>
                <View style={styles.alertContent}>
                  <Text style={[styles.alertTitle, isRtl && styles.rtlText]}>{alert.titleAr}</Text>
                  <Text style={[styles.alertMessage, isRtl && styles.rtlText]}>{alert.messageAr}</Text>
                </View>
              </View>
              {alert.actionTextAr && (
                <View style={[styles.alertActionRow, isRtl && styles.rtlRow]}>
                  <Text style={styles.alertActionText}>{alert.actionTextAr}</Text>
                  <MaterialCommunityIcons
                    name={isRtl ? 'arrow-left' : 'arrow-right'}
                    size={16}
                    color={colors.primary}
                  />
                </View>
              )}
            </Card>
          ))}
        </View>
      )}

      {/* 4. Large 1-Tap Quick Actions */}
      <View style={styles.sectionContainer}>
        <View style={[styles.sectionHeader, isRtl && styles.rtlRow]}>
          <Text style={styles.sectionTitle}>{t.quickActions}</Text>
          <TouchableOpacity onPress={() => onNavigateToTab('services')}>
            <Text style={styles.viewAllText}>{t.viewAll}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickActionsGrid}>
          {/* Action 1: Live Plant Scanner (Primary Big Action) */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onNavigateToService('live_scan')}
            style={[styles.bigActionCard, { backgroundColor: colors.primary }]}
          >
            <View style={[styles.bigActionHeader, isRtl && styles.rtlRow]}>
              <View style={styles.bigActionIconWrapper}>
                <MaterialCommunityIcons name="camera-iris" size={32} color={colors.textInverse} />
              </View>
              <Badge label="كاميرا حية AI" variant="accent" size="sm" />
            </View>
            <Text style={[styles.bigActionTitle, isRtl && styles.rtlText]}>
              فحص فوري بالكاميرا (Live Scan)
            </Text>
            <Text style={[styles.bigActionSub, isRtl && styles.rtlText]}>
              وجّه الكاميرا نحو الورقة أو الثمرة للحصول على تشخيص فوري وعلاج موصى به
            </Text>
          </TouchableOpacity>

          {/* Action 2: Soil Analysis */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onNavigateToService('soil')}
            style={[styles.actionTile, { borderColor: colors.soil, borderTopWidth: 4 }]}
          >
            <View style={[styles.actionTileIcon, { backgroundColor: colors.soilLight }]}>
              <MaterialCommunityIcons name="flask-outline" size={24} color={colors.soil} />
            </View>
            <Text style={[styles.actionTileTitle, isRtl && styles.rtlText]}>{t.actionSoilTest}</Text>
            <Text style={[styles.actionTileSub, isRtl && styles.rtlText]} numberOfLines={2}>
              {t.actionSoilTestSub}
            </Text>
          </TouchableOpacity>

          {/* Action 3: Crop Recommender */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onNavigateToService('crops')}
            style={[styles.actionTile, { borderColor: colors.crop, borderTopWidth: 4 }]}
          >
            <View style={[styles.actionTileIcon, { backgroundColor: colors.cropLight }]}>
              <MaterialCommunityIcons name="sprout-outline" size={24} color={colors.crop} />
            </View>
            <Text style={[styles.actionTileTitle, isRtl && styles.rtlText]}>{t.actionCropRecommend}</Text>
            <Text style={[styles.actionTileSub, isRtl && styles.rtlText]} numberOfLines={2}>
              {t.actionCropRecommendSub}
            </Text>
          </TouchableOpacity>

          {/* Action 4: Market Prices */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onNavigateToTab('marketplace')}
            style={[styles.actionTile, { borderColor: colors.secondary, borderTopWidth: 4 }]}
          >
            <View style={[styles.actionTileIcon, { backgroundColor: colors.secondaryLight }]}>
              <MaterialCommunityIcons name="chart-line" size={24} color={colors.secondary} />
            </View>
            <Text style={[styles.actionTileTitle, isRtl && styles.rtlText]}>{t.actionMarketPrices}</Text>
            <Text style={[styles.actionTileSub, isRtl && styles.rtlText]} numberOfLines={2}>
              {t.actionMarketPricesSub}
            </Text>
          </TouchableOpacity>

          {/* Action 5: Smart Irrigation */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onNavigateToService('irrigation')}
            style={[styles.actionTile, { borderColor: colors.water, borderTopWidth: 4 }]}
          >
            <View style={[styles.actionTileIcon, { backgroundColor: colors.waterLight }]}>
              <MaterialCommunityIcons name="water-pump" size={24} color={colors.water} />
            </View>
            <Text style={[styles.actionTileTitle, isRtl && styles.rtlText]}>{t.actionIrrigation}</Text>
            <Text style={[styles.actionTileSub, isRtl && styles.rtlText]} numberOfLines={2}>
              {t.actionIrrigationSub}
            </Text>
          </TouchableOpacity>

          {/* Action 6: Multi-Agent AI System */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onNavigateToService('multi_agent')}
            style={[styles.actionTile, { borderColor: colors.primary, borderTopWidth: 4 }]}
          >
            <View style={[styles.actionTileIcon, { backgroundColor: colors.primaryLight }]}>
              <MaterialCommunityIcons name="robot-happy-outline" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.actionTileTitle, isRtl && styles.rtlText]}>الوكلاء الأذكياء الـ 8</Text>
            <Text style={[styles.actionTileSub, isRtl && styles.rtlText]} numberOfLines={2}>
              تنسيق متعدد التخصصات للري والتربة والأمراض
            </Text>
          </TouchableOpacity>

          {/* Action 7: Recent Analyses Log */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onNavigateToService('recent_analyses')}
            style={[styles.actionTile, { borderColor: colors.accent, borderTopWidth: 4 }]}
          >
            <View style={[styles.actionTileIcon, { backgroundColor: colors.accentLight }]}>
              <MaterialCommunityIcons name="history" size={24} color={colors.accent} />
            </View>
            <Text style={[styles.actionTileTitle, isRtl && styles.rtlText]}>سجل التحاليل</Text>
            <Text style={[styles.actionTileSub, isRtl && styles.rtlText]} numberOfLines={2}>
              مراجعة نتائج الفحوصات والتشخيصات السابقة
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 5. AI Assistant Entry Point Banner */}
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => onNavigateToTab('assistant')}
        style={styles.assistantBanner}
      >
        <View style={[styles.assistantBannerInner, isRtl && styles.rtlRow]}>
          <View style={styles.assistantIconCircle}>
            <MaterialCommunityIcons name="robot" size={28} color={colors.primary} />
          </View>
          <View style={styles.assistantTextContainer}>
            <Text style={[styles.assistantBannerTitle, isRtl && styles.rtlText]}>
              {t.askAssistant}
            </Text>
            <Text style={[styles.assistantBannerSub, isRtl && styles.rtlText]}>
              {t.assistantPrompt}
            </Text>
          </View>
          <MaterialCommunityIcons
            name={isRtl ? 'chevron-left' : 'chevron-right'}
            size={24}
            color={colors.primary}
          />
        </View>
      </TouchableOpacity>

      {/* 6. Today's Recommended Tasks */}
      <View style={styles.sectionContainer}>
        <View style={[styles.sectionHeader, isRtl && styles.rtlRow]}>
          <View style={[styles.sectionTitleRow, isRtl && styles.rtlRow]}>
            <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>{t.todaysTasks}</Text>
          </View>
          <Text style={styles.taskCountText}>
            {tasks.filter((t) => t.completed).length} / {tasks.length}
          </Text>
        </View>

        <Card variant="outlined" style={styles.tasksContainer}>
          {tasks.map((task) => (
            <TouchableOpacity
              key={task.id}
              activeOpacity={0.7}
              onPress={() => toggleTask(task.id)}
              style={[styles.taskItem, isRtl && styles.rtlRow]}
            >
              <MaterialCommunityIcons
                name={task.completed ? 'checkbox-marked' : 'checkbox-blank-outline'}
                size={24}
                color={task.completed ? colors.primary : colors.textMuted}
              />
              <View style={styles.taskDetails}>
                <Text
                  style={[
                    styles.taskTitle,
                    task.completed && styles.taskCompleted,
                    isRtl && styles.rtlText,
                  ]}
                >
                  {task.titleAr}
                </Text>
                <View style={[styles.taskMetaRow, isRtl && styles.rtlRow]}>
                  {task.cropNameAr && (
                    <Text style={styles.taskCropText}>{task.cropNameAr} • </Text>
                  )}
                  <Text style={styles.taskTimeText}>{task.dueDate}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </Card>
      </View>
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
  greetingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  greetingTextContainer: {
    flex: 1,
  },
  greetingTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  greetingSub: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherCard: {
    marginBottom: spacing.lg,
    backgroundColor: colors.card,
  },
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weatherMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  weatherTempContainer: {
    marginLeft: spacing.xs,
  },
  tempText: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  conditionText: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
  },
  weatherMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    marginVertical: spacing.md,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  metricDivider: {
    width: 1,
    height: 16,
    backgroundColor: colors.border,
  },
  weatherAdviceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accentLight,
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  weatherAdviceText: {
    flex: 1,
    fontSize: typography.fontSizes.xs,
    color: colors.accentDark,
    fontWeight: typography.fontWeights.medium,
  },
  sectionContainer: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  viewAllText: {
    fontSize: typography.fontSizes.sm,
    color: colors.primary,
    fontWeight: typography.fontWeights.semibold,
  },
  taskCountText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
  },
  alertCard: {
    borderColor: colors.dangerLight,
    backgroundColor: colors.card,
    marginBottom: spacing.sm,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  alertIconBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.danger,
  },
  alertMessage: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  alertActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  alertActionText: {
    fontSize: typography.fontSizes.xs,
    color: colors.primary,
    fontWeight: typography.fontWeights.semibold,
  },
  quickActionsGrid: {
    gap: spacing.sm,
  },
  bigActionCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  bigActionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  bigActionIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigActionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.textInverse,
  },
  bigActionSub: {
    fontSize: typography.fontSizes.xs,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
    lineHeight: 18,
  },
  actionTile: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  actionTileIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  actionTileTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  actionTileSub: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  assistantBanner: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  assistantBannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  assistantIconCircle: {
    width: 46,
    height: 46,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  assistantTextContainer: {
    flex: 1,
  },
  assistantBannerTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.primaryDark,
  },
  assistantBannerSub: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tasksContainer: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  taskDetails: {
    flex: 1,
  },
  taskTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.text,
  },
  taskCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  taskCropText: {
    fontSize: typography.fontSizes.xs,
    color: colors.primary,
    fontWeight: typography.fontWeights.semibold,
  },
  taskTimeText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
  },
});
