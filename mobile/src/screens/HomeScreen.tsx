import React, { useCallback, useState } from 'react';
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
import { StateView } from '../components/ui/StateView';
import { ProvenanceBadge } from '../components/ui/ProvenanceBadge';
import { getWeather, pingServer, getNotifications } from '../api/client';
import { AppNotification, WeatherData } from '../types';
import { useConnectivity } from '../hooks/useConnectivity';
import { useAICapabilities } from '../hooks/useAICapabilities';
import { weatherConditionLabel, weatherIconName } from '../utils/weather';
import { governorateFromName, governorateLabel } from '../utils/governorates';
import { IntelligenceStrip } from '../components/home/IntelligenceStrip';
import { LearningVideos } from '../components/home/LearningVideos';
import { HomeNewsPreview } from '../components/home/HomeNewsPreview';
import { SeasonAgenda } from '../components/home/SeasonAgenda';

interface HomeScreenProps {
  onNavigateToService: (serviceId: string) => void;
  onNavigateToTab: (tabKey: string) => void;
  /** Opens the notifications screen (the alerts panel's "view all" target). */
  onOpenNotifications: () => void;
}

/**
 * Home dashboard. Weather is the only live external feed here (Open-Meteo via
 * the gateway) and is labelled as such. Urgent alerts come from the caller's own
 * persisted notifications (`GET /api/notifications`, requires a verified
 * session); when there is no session or nothing is urgent the panel says so
 * honestly instead of inventing alerts.
 */
export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateToService, onNavigateToTab, onOpenNotifications }) => {
  const { t, x, isRtl, isArabic, language } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const { isOnline } = useConnectivity();
  const { data: capabilities, loading: capsLoading, error: capsError } = useAICapabilities();

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [weatherFromCache, setWeatherFromCache] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [serverOk, setServerOk] = useState<boolean | null>(null);
  const [alerts, setAlerts] = useState<AppNotification[]>([]);
  const [alertsError, setAlertsError] = useState<string | null>(null);
  const [alertsUnavailable, setAlertsUnavailable] = useState(false);

  // Resolve the weather location from the signed-in user's governorate, so the
  // dashboard is relevant to their region instead of always showing Tunis.
  const governorate = governorateFromName(user?.governorate);
  const { lat, lon } = governorate;

  const loadDashboardData = useCallback(async () => {
    const [w, ping] = await Promise.all([
      getWeather(lat, lon, governorateLabel(governorate, language)),
      pingServer(),
    ]);
    setWeather(w.data);
    setWeatherError(w.error);
    setWeatherFromCache(w.fromCache);
    setServerOk(ping.ok);
    if (isAuthenticated) {
      const notif = await getNotifications();
      setAlerts(
        notif.data.filter(
          (n) => !n.readAt && (n.priority === 'critical' || n.priority === 'high'),
        ),
      );
      // A genuine fetch failure or an unavailable store must not be shown as
      // "no urgent alerts" — those are different truths.
      setAlertsError(notif.unavailable ? null : notif.error);
      setAlertsUnavailable(notif.unavailable);
    } else {
      setAlerts([]);
      setAlertsError(null);
      setAlertsUnavailable(false);
    }
  }, [lat, lon, language, governorate, isAuthenticated]);

  React.useEffect(() => {
    (async () => {
      await loadDashboardData();
      setLoading(false);
    })();
  }, [loadDashboardData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const displayName = isArabic
    ? user?.full_name_ar || user?.full_name || x.homeGuest
    : user?.full_name || x.homeGuest;

  // Role-aware shortcuts. The role only reorders/replaces the quick actions so
  // the most relevant tools are one tap away; every service stays reachable
  // from the Services tab. The role is a UI preference (see AuthContext), never
  // a server privilege.
  const role = user?.role ?? 'farmer';
  const heroByRole: Record<string, { serviceId: string; badge: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }> = {
    gardener: { serviceId: 'live_scan', badge: 'AI', icon: 'camera-iris' },
    farmer: { serviceId: 'live_scan', badge: 'AI', icon: 'camera-iris' },
    agronomist: { serviceId: 'soil', badge: x.heroBadgeAnalyze, icon: 'flask-outline' },
    veterinarian: { serviceId: 'livestock', badge: x.heroBadgeLivestock, icon: 'cow' },
    trader: { serviceId: 'marketplace' as string, badge: x.heroBadgeMarkets, icon: 'chart-line' },
    company: { serviceId: 'farms', badge: x.heroBadgeManage, icon: 'map-marker-radius' },
    inspector: { serviceId: 'live_scan', badge: x.heroBadgeInspect, icon: 'clipboard-check-outline' },
    investor: { serviceId: 'marketplace' as string, badge: x.heroBadgeIndicators, icon: 'chart-line' },
    government: { serviceId: 'agri_news', badge: x.heroBadgeNews, icon: 'newspaper-variant-outline' },
    admin: { serviceId: 'multi_agent', badge: 'AI', icon: 'robot-happy-outline' },
  };
  const hero = heroByRole[role] ?? heroByRole.farmer;
  const heroIsTab = hero.serviceId === 'marketplace';
  const heroAction = {
    serviceId: hero.serviceId,
    badge: hero.badge,
    icon: hero.icon,
    color: colors.primary,
    title: t.actionScanDisease,
    sub: t.actionScanDiseaseSub,
  };
  if (heroIsTab) {
    heroAction.title = t.actionMarketPrices;
    heroAction.sub = t.actionMarketPricesSub;
  } else if (hero.serviceId === 'soil') {
    heroAction.title = t.actionSoilTest;
    heroAction.sub = t.actionSoilTestSub;
  } else if (hero.serviceId === 'livestock') {
    heroAction.title = t.livestockName;
    heroAction.sub = t.livestockDesc;
  } else if (hero.serviceId === 'farms') {
    heroAction.title = t.farmManagementName;
    heroAction.sub = t.farmManagementDesc;
  } else if (hero.serviceId === 'agri_news') {
    heroAction.title = t.agriNewsName;
    heroAction.sub = t.agriNewsDesc;
  } else if (hero.serviceId === 'multi_agent') {
    heroAction.title = t.multiAgentAiName;
    heroAction.sub = t.multiAgentAiDesc;
  }

  type Tile = {
    serviceId: string;
    tab?: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    color: string;
    bg: string;
    title: string;
    sub: string;
  };
  const allTiles: Tile[] = [
    { serviceId: 'soil', icon: 'flask-outline', color: colors.soil, bg: colors.soilLight, title: t.actionSoilTest, sub: t.actionSoilTestSub },
    { serviceId: 'crops', icon: 'sprout-outline', color: colors.crop, bg: colors.cropLight, title: t.actionCropRecommend, sub: t.actionCropRecommendSub },
    { serviceId: 'marketplace', tab: 'marketplace', icon: 'chart-line', color: colors.secondary, bg: colors.secondaryLight, title: t.actionMarketPrices, sub: t.actionMarketPricesSub },
    { serviceId: 'irrigation', icon: 'water-pump', color: colors.water, bg: colors.waterLight, title: t.actionIrrigation, sub: t.actionIrrigationSub },
    { serviceId: 'pest', icon: 'bug-outline', color: colors.danger, bg: colors.dangerLight, title: t.pestControlName, sub: t.pestControlDesc },
    { serviceId: 'multi_agent', icon: 'robot-happy-outline', color: colors.primary, bg: colors.primaryLight, title: t.multiAgentAiName, sub: t.multiAgentAiDesc },
    { serviceId: 'weather', icon: 'weather-partly-cloudy', color: colors.secondary, bg: colors.secondaryLight, title: t.weatherIntelligenceName, sub: t.weatherIntelligenceDesc },
    { serviceId: 'farms', icon: 'map-marker-radius', color: colors.primary, bg: colors.primaryLight, title: t.farmManagementName, sub: t.farmManagementDesc },
    { serviceId: 'livestock', icon: 'cow', color: colors.accent, bg: colors.accentLight, title: t.livestockName, sub: t.livestockDesc },
    { serviceId: 'agri_news', icon: 'newspaper-variant-outline', color: colors.secondary, bg: colors.secondaryLight, title: t.agriNewsName, sub: t.agriNewsDesc },
    { serviceId: 'live_scan', icon: 'camera-iris', color: colors.danger, bg: colors.dangerLight, title: t.actionScanDisease, sub: t.actionScanDiseaseSub },
  ];
  // Drop the tile already promoted to the hero card, then reorder the rest so
  // each role sees its most relevant tools in the four visible slots. Every
  // service stays reachable from the Services tab; the role only changes order.
  const roleTileOrder: Record<string, string[]> = {
    gardener: ['live_scan', 'crops', 'pest', 'weather', 'soil', 'irrigation', 'marketplace', 'agri_news', 'farms', 'livestock', 'multi_agent'],
    farmer: ['live_scan', 'soil', 'crops', 'irrigation', 'pest', 'marketplace', 'weather', 'farms', 'livestock', 'agri_news', 'multi_agent'],
    agronomist: ['soil', 'crops', 'live_scan', 'pest', 'irrigation', 'weather', 'multi_agent', 'farms', 'livestock', 'agri_news', 'marketplace'],
    veterinarian: ['livestock', 'live_scan', 'farms', 'weather', 'marketplace', 'agri_news', 'soil', 'crops', 'irrigation', 'pest', 'multi_agent'],
    trader: ['marketplace', 'crops', 'agri_news', 'weather', 'soil', 'farms', 'livestock', 'live_scan', 'pest', 'irrigation', 'multi_agent'],
    company: ['farms', 'soil', 'crops', 'marketplace', 'irrigation', 'weather', 'livestock', 'live_scan', 'pest', 'agri_news', 'multi_agent'],
    inspector: ['live_scan', 'farms', 'crops', 'soil', 'pest', 'livestock', 'weather', 'marketplace', 'agri_news', 'irrigation', 'multi_agent'],
    investor: ['marketplace', 'agri_news', 'farms', 'weather', 'crops', 'soil', 'multi_agent', 'irrigation', 'livestock', 'live_scan', 'pest'],
    government: ['agri_news', 'marketplace', 'weather', 'farms', 'crops', 'soil', 'multi_agent', 'livestock', 'live_scan', 'pest', 'irrigation'],
    admin: ['multi_agent', 'agri_news', 'farms', 'marketplace', 'weather', 'soil', 'crops', 'livestock', 'live_scan', 'pest', 'irrigation'],
  };
  const order = roleTileOrder[role] ?? roleTileOrder.farmer;
  const remaining = allTiles
    .filter((tile) => tile.serviceId !== hero.serviceId)
    .slice()
    .sort((a, b) => {
      const ia = order.indexOf(a.serviceId);
      const ib = order.indexOf(b.serviceId);
      return (ia === -1 ? Number.MAX_SAFE_INTEGER : ia) - (ib === -1 ? Number.MAX_SAFE_INTEGER : ib);
    });
  const tileRows: Tile[][] = [];
  for (let i = 0; i < Math.min(remaining.length, 4); i += 2) {
    tileRows.push(remaining.slice(i, i + 2));
  }

  // Capability chips map to the service screen that backs them; a few live on
  // tabs (marketplace/assistant) or the notifications overlay.
  const openCapabilityService = (serviceId: string) => {
    if (serviceId === 'marketplace') return onNavigateToTab('marketplace');
    if (serviceId === 'assistant') return onNavigateToTab('assistant');
    if (serviceId === 'notifications') return onOpenNotifications();
    return onNavigateToService(serviceId);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
      }
    >
      {/* Greeting */}
      <View style={[styles.greetingCard, isRtl && styles.rtlRow]}>
        <View style={styles.greetingTextContainer}>
          <Text style={[styles.greetingTitle, isRtl && styles.rtlText]}>
            {t.greeting}{x.listSeparator}{displayName} 👋
          </Text>
          <Text style={[styles.greetingSub, isRtl && styles.rtlText]}>
            {t.welcomeSub}
            {user?.governorate ? ` • ${user.governorate}` : ''}
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onNavigateToTab('profile')}
          accessibilityRole="button"
          accessibilityLabel={t.profileTitle}
          style={styles.avatarButton}
        >
          <MaterialCommunityIcons name="account" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {!isOnline ? (
        <View style={[styles.offlineBanner, isRtl && styles.rtlRow]}>
          <MaterialCommunityIcons name="wifi-off" size={16} color={colors.warning} />
          <Text style={styles.offlineText}>{x.offlineBanner}</Text>
        </View>
      ) : null}

      {/* Available agricultural intelligence — server-declared capability state */}
      <IntelligenceStrip
        capabilities={capabilities?.capabilities ?? []}
        loading={capsLoading}
        error={capsError}
        onOpenCapabilities={() => onNavigateToService('multi_agent')}
        onOpenService={openCapabilityService}
      />

      {/* Weather — live observation */}
      {loading ? (
        <Card variant="elevated" style={styles.weatherCard}>
          <StateView kind="loading" title={x.stateLoading} compact />
        </Card>
      ) : weather ? (
        <Card
          variant="elevated"
          onPress={() => onNavigateToService('weather')}
          style={styles.weatherCard}
          accessibilityLabel={`${t.weatherTitle}: ${weather.temperature}°C ${weather.governorate}`}
          accessibilityHint={x.weatherOpenDetail}
        >
          <View style={[styles.weatherHeader, isRtl && styles.rtlRow]}>
            <View style={[styles.weatherMain, isRtl && styles.rtlRow]}>
              <MaterialCommunityIcons
                name={weatherIconName(weather.icon) as keyof typeof MaterialCommunityIcons.glyphMap}
                size={38}
                color={colors.secondary}
              />
              <View style={styles.weatherTempContainer}>
                <Text style={styles.tempText}>{weather.temperature}°C</Text>
                <Text style={styles.conditionText}>{weatherConditionLabel(weather.icon, language, weather.condition_ar)}</Text>
              </View>
            </View>
            <Badge label={weather.governorate} variant="secondary" size="md" />
          </View>

          <View style={[styles.weatherMetricsRow, isRtl && styles.rtlRow]}>
            <View style={[styles.metricItem, isRtl && styles.rtlRow]}>
              <MaterialCommunityIcons name="water-percent" size={18} color={colors.secondary} />
              <Text style={styles.metricLabel}>{weather.humidity}% {x.metricHumidity}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={[styles.metricItem, isRtl && styles.rtlRow]}>
              <MaterialCommunityIcons name="weather-windy" size={18} color={colors.textSecondary} />
              <Text style={styles.metricLabel}>{weather.wind_speed} {x.metricWind}</Text>
            </View>
          </View>

          <View style={[styles.weatherAdviceBox, isRtl && styles.rtlRow]}>
            <MaterialCommunityIcons name="lightbulb-on" size={18} color={colors.accent} />
            <Text style={[styles.weatherAdviceText, isRtl && styles.rtlText]} numberOfLines={3}>
              {language === 'ar' ? weather.advice_ar : language === 'fr' ? weather.advice_fr : weather.advice_en}
            </Text>
          </View>

          <View style={[styles.provRow, isRtl && styles.rtlRow]}>
            <ProvenanceBadge meta={weather.meta} />
            {weatherFromCache ? <Text style={styles.cachedTag}>{x.cachedNotice}</Text> : null}
          </View>
        </Card>
      ) : (
        <Card variant="elevated" style={styles.weatherCard}>
          <StateView
            kind={isOnline ? 'error' : 'offline'}
            title={x.homeWeatherUnavailable}
            message={weatherError || undefined}
            onRetry={loadDashboardData}
            retryLabel={x.retry}
          />
        </Card>
      )}

      {/* Quick actions */}
      <View style={styles.sectionContainer}>
        <View style={[styles.sectionHeader, isRtl && styles.rtlRow]}>
          <Text style={styles.sectionTitle}>{t.quickActions}</Text>
          <TouchableOpacity
            onPress={() => onNavigateToTab('services')}
            accessibilityRole="button"
            accessibilityLabel={t.viewAll}
            hitSlop={12}
            style={styles.linkButton}
          >
            <Text style={styles.viewAllText}>{t.viewAll}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => (heroIsTab ? onNavigateToTab(hero.serviceId) : onNavigateToService(hero.serviceId))}
            accessibilityRole="button"
            accessibilityLabel={`${heroAction.title}. ${heroAction.sub}`}
            style={[styles.bigActionCard, { backgroundColor: heroAction.color }]}
          >
            <View style={[styles.bigActionHeader, isRtl && styles.rtlRow]}>
              <View style={styles.bigActionIconWrapper}>
                <MaterialCommunityIcons name={heroAction.icon} size={30} color={colors.textInverse} />
              </View>
              <Badge label={heroAction.badge} variant="accent" size="sm" />
            </View>
            <Text style={[styles.bigActionTitle, isRtl && styles.rtlText]}>{heroAction.title}</Text>
            <Text style={[styles.bigActionSub, isRtl && styles.rtlText]}>{heroAction.sub}</Text>
          </TouchableOpacity>

          {tileRows.map((row, rowIndex) => (
            <View key={rowIndex} style={[styles.tilesRow, isRtl && styles.rtlRow]}>
              {row.map((tile) => (
                <ActionTile
                  key={tile.serviceId}
                  icon={tile.icon}
                  color={tile.color}
                  bg={tile.bg}
                  title={tile.title}
                  sub={tile.sub}
                  onPress={() => tile.tab ? onNavigateToTab(tile.tab) : onNavigateToService(tile.serviceId)}
                  isRtl={isRtl}
                />
              ))}
            </View>
          ))}
        </View>
      </View>

      {/* Assistant entry */}
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => onNavigateToTab('assistant')}
        accessibilityRole="button"
        accessibilityLabel={`${t.askAssistant}. ${t.assistantPrompt}`}
        style={styles.assistantBanner}
      >
        <View style={[styles.assistantBannerInner, isRtl && styles.rtlRow]}>
          <View style={styles.assistantIconCircle}>
            <MaterialCommunityIcons name="robot" size={28} color={colors.primary} />
          </View>
          <View style={styles.assistantTextContainer}>
            <Text style={[styles.assistantBannerTitle, isRtl && styles.rtlText]}>{t.askAssistant}</Text>
            <Text style={[styles.assistantBannerSub, isRtl && styles.rtlText]}>{t.assistantPrompt}</Text>
          </View>
          <MaterialCommunityIcons
            name={isRtl ? 'chevron-left' : 'chevron-right'}
            size={24}
            color={colors.primary}
          />
        </View>
      </TouchableOpacity>

      {/* Curated agricultural learning videos (real YouTube content) */}
      <LearningVideos onOpenAll={() => onNavigateToService('learning')} />

      {/* Latest real agricultural headlines */}
      <HomeNewsPreview onOpenAll={() => onNavigateToService('agri_news')} />

      {/* Seasonal agenda — general, indicative guidance */}
      <SeasonAgenda />

      {/* Urgent alerts — from the caller's own persisted notifications */}
      <View style={styles.sectionContainer}>
        <View style={[styles.sectionHeader, isRtl && styles.rtlRow]}>
          <View style={[styles.sectionTitleRow, isRtl && styles.rtlRow]}>
            <MaterialCommunityIcons name="bell-outline" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>{t.urgentAlerts}</Text>
          </View>
          {alerts.length > 0 ? (
            <TouchableOpacity
              onPress={onOpenNotifications}
              accessibilityRole="button"
              accessibilityLabel={t.viewAll}
              hitSlop={12}
              style={styles.linkButton}
            >
              <Text style={styles.viewAllText}>{t.viewAll}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {alertsUnavailable ? (
          <Card variant="outlined" style={styles.alertsContainer}>
            <StateView
              kind="unavailable"
              title={x.stateUnavailable}
              message={x.homeAlertsUnavailable}
              compact
            />
          </Card>
        ) : alertsError && alerts.length === 0 ? (
          <Card variant="outlined" style={styles.alertsContainer}>
            <StateView
              kind={isOnline ? 'error' : 'offline'}
              title={isOnline ? x.stateError : x.stateOffline}
              message={alertsError}
              onRetry={loadDashboardData}
              retryLabel={x.retry}
              compact
            />
          </Card>
        ) : alerts.length === 0 ? (
          <Card variant="outlined" style={styles.alertsContainer}>
            <StateView
              kind="empty"
              title={x.homeNoAlerts}
              message={isAuthenticated ? undefined : x.loginRequiredDesc}
              compact
            />
          </Card>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {alerts.slice(0, 3).map((alert) => (
              <Card key={alert.id} variant="elevated" style={styles.alertCard}>
                <View style={[styles.alertRow, isRtl && styles.rtlRow]}>
                  <View
                    style={[
                      styles.alertIconWrap,
                      { backgroundColor: alert.priority === 'critical' ? colors.dangerLight : colors.warningLight },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={alert.priority === 'critical' ? 'alert-octagon' : 'alert'}
                      size={18}
                      color={alert.priority === 'critical' ? colors.danger : colors.warning}
                    />
                  </View>
                  <View style={styles.alertTextWrap}>
                    <Text style={[styles.alertTitle, isRtl && styles.rtlText]} numberOfLines={1}>
                      {alert.title}
                    </Text>
                    <Text style={[styles.alertMessage, isRtl && styles.rtlText]} numberOfLines={2}>
                      {alert.message}
                    </Text>
                  </View>
                  <Badge
                    label={alert.priority === 'critical' ? x.priorityCritical : x.priorityHigh}
                    variant={alert.priority === 'critical' ? 'danger' : 'warning'}
                    size="sm"
                  />
                </View>
              </Card>
            ))}
          </View>
        )}
      </View>

      {serverOk === false ? (
        <View style={[styles.connectionFooter, isRtl && styles.rtlRow]}>
          <MaterialCommunityIcons name="server-off" size={14} color={colors.textMuted} />
          <Text style={styles.connectionFooterText}>{t.serverOffline}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
};

const ActionTile: React.FC<{
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  bg: string;
  title: string;
  sub: string;
  onPress: () => void;
  isRtl: boolean;
}> = ({ icon, color, bg, title, sub, onPress, isRtl }) => (
  <TouchableOpacity
    activeOpacity={0.85}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={`${title}. ${sub}`}
    style={[styles.actionTile, { borderTopColor: color }]}
  >
    <View style={[styles.actionTileIcon, { backgroundColor: bg }]}>
      <MaterialCommunityIcons name={icon} size={22} color={color} />
    </View>
    <Text style={[styles.actionTileTitle, isRtl && styles.rtlText]} numberOfLines={1}>
      {title}
    </Text>
    <Text style={[styles.actionTileSub, isRtl && styles.rtlText]} numberOfLines={2}>
      {sub}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing['3xl'] },
  rtlRow: { flexDirection: 'row-reverse' },
  rtlText: { textAlign: 'right', writingDirection: 'rtl' },
  greetingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  greetingTextContainer: { flex: 1 },
  greetingTitle: { fontSize: typography.fontSizes.xl, lineHeight: 30, fontWeight: typography.fontWeights.bold, color: colors.text },
  greetingSub: { fontSize: typography.fontSizes.sm, lineHeight: 21, color: colors.textSecondary, marginTop: 2 },
  avatarButton: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.warningLight,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  offlineText: { flex: 1, fontSize: typography.fontSizes.xs, color: colors.warning, lineHeight: 20 },
  weatherCard: { marginBottom: spacing.lg, backgroundColor: colors.card },
  weatherHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weatherMain: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  weatherTempContainer: { marginLeft: spacing.xs },
  tempText: { fontSize: typography.fontSizes['2xl'], fontWeight: typography.fontWeights.bold, color: colors.text, lineHeight: 34 },
  conditionText: { fontSize: typography.fontSizes.sm, lineHeight: 21, color: colors.textSecondary },
  weatherMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    marginVertical: spacing.md,
  },
  metricItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metricLabel: { fontSize: typography.fontSizes.xs, color: colors.textSecondary, fontWeight: typography.fontWeights.medium, lineHeight: 20 },
  metricDivider: { width: 1, height: 16, backgroundColor: colors.border },
  weatherAdviceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accentLight,
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  weatherAdviceText: { flex: 1, fontSize: typography.fontSizes.xs, color: colors.accentDark, fontWeight: typography.fontWeights.medium, lineHeight: 20 },
  provRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' },
  cachedTag: { fontSize: typography.fontSizes.xs, color: colors.textMuted, fontStyle: 'italic', lineHeight: 20 },
  sectionContainer: { marginBottom: spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  sectionTitle: { fontSize: typography.fontSizes.base, lineHeight: 24, fontWeight: typography.fontWeights.bold, color: colors.text },
  linkButton: { minHeight: 48, justifyContent: 'center', paddingHorizontal: spacing.xs },
  viewAllText: { fontSize: typography.fontSizes.sm, lineHeight: 21, color: colors.primary, fontWeight: typography.fontWeights.semibold },
  quickActionsGrid: { gap: spacing.sm },
  tilesRow: { flexDirection: 'row', gap: spacing.sm },
  bigActionCard: { minHeight: 48, borderRadius: radius.lg, padding: spacing.lg, ...shadows.md },
  bigActionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  bigActionIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigActionTitle: { fontSize: typography.fontSizes.lg, lineHeight: 27, fontWeight: typography.fontWeights.bold, color: colors.textInverse },
  bigActionSub: { fontSize: typography.fontSizes.xs, color: 'rgba(255,255,255,0.9)', marginTop: 4, lineHeight: 21 },
  actionTile: {
    flex: 1,
    minHeight: 48,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopWidth: 3,
    ...shadows.sm,
  },
  actionTileIcon: { width: 38, height: 38, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  actionTileTitle: { fontSize: typography.fontSizes.sm, lineHeight: 21, fontWeight: typography.fontWeights.bold, color: colors.text },
  actionTileSub: { fontSize: typography.fontSizes.xs, color: colors.textSecondary, marginTop: 2, lineHeight: 20 },
  assistantBanner: {
    minHeight: 48,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  assistantBannerInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  assistantIconCircle: {
    width: 46,
    height: 46,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  assistantTextContainer: { flex: 1 },
  assistantBannerTitle: { fontSize: typography.fontSizes.base, lineHeight: 24, fontWeight: typography.fontWeights.bold, color: colors.primaryDark },
  assistantBannerSub: { fontSize: typography.fontSizes.xs, color: colors.textSecondary, marginTop: 2, lineHeight: 20 },
  alertsContainer: { paddingVertical: spacing.xs },
  alertCard: { padding: spacing.sm },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  alertIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTextWrap: { flex: 1 },
  alertTitle: {
    fontSize: typography.fontSizes.sm, lineHeight: 21,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  alertMessage: { fontSize: typography.fontSizes.xs, color: colors.textSecondary, marginTop: 2, lineHeight: 20 },
  connectionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: spacing.sm,
  },
  connectionFooterText: { fontSize: typography.fontSizes.xs, color: colors.textMuted, lineHeight: 20 },
});
