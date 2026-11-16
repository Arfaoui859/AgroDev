import React, { useCallback, useState } from 'react';
import { rtlStyles } from '../theme/rtl';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { actionsRow, flex1, gapSm, rowGapMd, rowGapSm, rowGapXs, screenStyles, spaceBetweenSm, stackLg } from '../theme/layout';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, typography, shadows, gradients } from '../theme/colors';
import { linkCaption, mutedCaption, subtitleMeta, titleBaseAccent, titleSm } from '../theme/typographyStyles';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getProjects } from '../i18n/projects';
import { Card } from '../components/ui/Card';
import { BrandMark } from '../components/ui/BrandMark';
import { Badge } from '../components/ui/Badge';
import { SectionHeader } from '../components/ui/SectionHeader';
import { ProvenanceBar } from '../components/ui/ProvenanceBar';
import { StateCard } from '../components/ui/StateCard';
import { getWeather, pingServer, getNotifications } from '../api/client';
import { AppNotification, WeatherData } from '../types';
import { useConnectivity } from '../hooks/useConnectivity';
import { useAICapabilities } from '../hooks/useAICapabilities';
import { weatherConditionLabel, weatherIconName } from '../utils/weather';
import { governorateFromName, governorateLabel } from '../utils/governorates';
import { formatDate } from '../utils/date';
import { IntelligenceStrip } from '../components/home/IntelligenceStrip';
import { LearningVideos } from '../components/home/LearningVideos';
import { HomeNewsPreview } from '../components/home/HomeNewsPreview';
import { SeasonAgenda } from '../components/home/SeasonAgenda';
import { AcademySection } from '../components/home/AcademySection';
import { HomeCommunityPreview } from '../components/home/HomeCommunityPreview';
import { HomeFarmOverview } from '../components/home/HomeFarmOverview';

interface HomeScreenProps {
  onNavigateToService: (serviceId: string) => void;
  onNavigateToTab: (tabKey: string) => void;
  /** Opens the notifications screen (the alerts panel's "view all" target). */
  onOpenNotifications: () => void;
  /** Opens the learning catalogue, optionally pre-filtered by video category. */
  onOpenLearning?: (category?: string) => void;
}

/**
 * Home dashboard. Weather is the live external feed here (WeatherAPI through
 * the gateway, with cache provenance shown by the weather detail screen).
 * Urgent alerts come from the caller's own
 * persisted notifications (`GET /api/notifications`, requires a verified
 * session); when there is no session or nothing is urgent the panel says so
 * honestly instead of inventing alerts.
 */
export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateToService, onNavigateToTab, onOpenNotifications, onOpenLearning }) => {
  const { t, x, isRtl, isArabic, language } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const projects = getProjects(language);
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
  const [farmOverviewRefreshKey, setFarmOverviewRefreshKey] = useState(0);

  // Resolve the weather location from the signed-in user's governorate, so the
  // dashboard is relevant to their region instead of always showing Tunis.
  const governorate = governorateFromName(user?.governorate);
  const { lat, lon } = governorate;

  const loadDashboardData = useCallback(async () => {
    // Load independent dashboard sources independently: a weather outage must
    // not hide notification results (or make an empty alert list look genuine).
    try {
      const w = await getWeather(lat, lon, governorateLabel(governorate, language));
      setWeather(w.data);
      setWeatherError(w.error);
      setWeatherFromCache(w.fromCache);
    } catch {
      setWeather(null);
      setWeatherError(x.stateOffline);
      setWeatherFromCache(false);
    }

    try {
      const ping = await pingServer();
      setServerOk(ping.ok);
    } catch {
      setServerOk(false);
    }

    if (isAuthenticated) {
      try {
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
      } catch {
        setAlerts([]);
        setAlertsError(x.stateOffline);
        setAlertsUnavailable(false);
      }
    } else {
      setAlerts([]);
      setAlertsError(null);
      setAlertsUnavailable(false);
    }
  }, [lat, lon, language, governorate, isAuthenticated, x.stateOffline]);

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        await loadDashboardData();
      } catch {
        if (active) {
          setServerOk(false);
          setWeatherError(x.stateOffline);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [loadDashboardData, x.stateOffline]);

  const onRefresh = async () => {
    setRefreshing(true);
    setFarmOverviewRefreshKey((current) => current + 1);
    try {
      await loadDashboardData();
    } finally {
      setRefreshing(false);
    }
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
    { serviceId: 'projects', icon: 'clipboard-text-clock-outline', color: colors.crop, bg: colors.cropLight, title: projects.tileTitle, sub: projects.tileDesc },
    { serviceId: 'livestock', icon: 'cow', color: colors.accent, bg: colors.accentLight, title: t.livestockName, sub: t.livestockDesc },
    { serviceId: 'agri_news', icon: 'newspaper-variant-outline', color: colors.secondary, bg: colors.secondaryLight, title: t.agriNewsName, sub: t.agriNewsDesc },
    { serviceId: 'live_scan', icon: 'camera-iris', color: colors.danger, bg: colors.dangerLight, title: t.actionScanDisease, sub: t.actionScanDiseaseSub },
  ];
  // Drop the tile already promoted to the hero card, then reorder the rest so
  // each role sees its most relevant tools in the four visible slots. Every
  // service stays reachable from the Services tab; the role only changes order.
  const roleTileOrder: Record<string, string[]> = {
    gardener: ['live_scan', 'crops', 'projects', 'pest', 'weather', 'soil', 'irrigation', 'marketplace', 'agri_news', 'farms', 'livestock', 'multi_agent'],
    farmer: ['live_scan', 'soil', 'crops', 'projects', 'irrigation', 'pest', 'marketplace', 'weather', 'farms', 'livestock', 'agri_news', 'multi_agent'],
    agronomist: ['soil', 'crops', 'live_scan', 'pest', 'irrigation', 'weather', 'multi_agent', 'farms', 'livestock', 'agri_news', 'marketplace'],
    veterinarian: ['livestock', 'live_scan', 'farms', 'weather', 'marketplace', 'agri_news', 'soil', 'crops', 'irrigation', 'pest', 'multi_agent'],
    trader: ['marketplace', 'crops', 'agri_news', 'weather', 'soil', 'farms', 'livestock', 'live_scan', 'pest', 'irrigation', 'multi_agent'],
    company: ['farms', 'projects', 'soil', 'crops', 'marketplace', 'irrigation', 'weather', 'livestock', 'live_scan', 'pest', 'agri_news', 'multi_agent'],
    inspector: ['live_scan', 'farms', 'projects', 'crops', 'soil', 'pest', 'livestock', 'weather', 'marketplace', 'agri_news', 'irrigation', 'multi_agent'],
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
      style={screenStyles.container}
      contentContainerStyle={[screenStyles.content, styles.content]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
      }
    >
      {/* Hero — gradient welcome surface with the live weather summary */}
      <View style={styles.heroShadow}>
        <LinearGradient colors={[colors.brandDeep, colors.brandDeepLight, colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={[styles.heroTopRow, isRtl && rtlStyles.rtlRow]}>
            <View style={styles.heroTextWrap}>
              <View style={[styles.heroBrandRow, isRtl && rtlStyles.rtlRow]}>
                <BrandMark size={30} />
                <View style={styles.heroBrandText}>
                  <Text style={styles.heroBrandName}>{t.appName}</Text>
                  <Text style={styles.heroBrandTagline}>{t.tagline}</Text>
                </View>
              </View>
              <Text style={styles.heroDate}>{formatDate(new Date().toISOString(), language)}</Text>
              <Text style={[styles.heroTitle, isRtl && rtlStyles.rtlText]}>
                {t.greeting}{x.listSeparator}{displayName} 👋
              </Text>
              <Text style={[styles.heroSub, isRtl && rtlStyles.rtlText]}>
                {t.welcomeSub}
                {user?.governorate ? ` • ${user.governorate}` : ''}
              </Text>
            </View>
            <View style={styles.heroActions}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onOpenNotifications}
                accessibilityRole="button"
                accessibilityLabel={t.urgentAlerts}
                style={styles.heroIconButton}
              >
                <MaterialCommunityIcons name="bell-outline" size={21} color={colors.textInverse} />
                {alerts.length > 0 ? <View style={styles.heroNotificationDot} /> : null}
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onNavigateToTab('profile')}
                accessibilityRole="button"
                accessibilityLabel={t.profileTitle}
                style={styles.heroAvatar}
              >
                <MaterialCommunityIcons name="account" size={23} color={colors.textInverse} />
              </TouchableOpacity>
            </View>
          </View>

          {loading ? null : weather ? (
            <View style={[styles.heroWeatherRow, isRtl && rtlStyles.rtlRow]}>
              <MaterialCommunityIcons
                name={weatherIconName(weather.icon) as keyof typeof MaterialCommunityIcons.glyphMap}
                size={30}
                color={colors.textInverse}
              />
              <Text style={styles.heroTemp}>{weather.temperature}°</Text>
              <Text style={styles.heroCondition} numberOfLines={1}>
                {weatherConditionLabel(weather.icon, language, weather.condition_ar)}
              </Text>
              <View style={styles.heroWeatherSpacer} />
              <View style={[styles.heroChip, isRtl && rtlStyles.rtlRow]}>
                <MaterialCommunityIcons name="water-percent" size={14} color={colors.onBrandMuted} />
                <Text style={styles.heroChipText}>{weather.humidity}%</Text>
              </View>
              <View style={[styles.heroChip, isRtl && rtlStyles.rtlRow]}>
                <MaterialCommunityIcons name="weather-windy" size={14} color={colors.onBrandMuted} />
                <Text style={styles.heroChipText}>{weather.wind_speed}</Text>
              </View>
            </View>
          ) : null}
        </LinearGradient>
      </View>

      {!isOnline ? (
        <View style={[styles.offlineBanner, isRtl && rtlStyles.rtlRow]}>
          <MaterialCommunityIcons name="wifi-off" size={16} color={colors.warning} />
          <Text style={styles.offlineText}>{x.offlineBanner}</Text>
        </View>
      ) : null}

      {/* Quick actions */}
      <View style={styles.sectionContainer}>
        <SectionHeader
          title={t.quickActions}
          actionLabel={t.viewAll}
          onAction={() => onNavigateToTab('services')}
        />

        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => (heroIsTab ? onNavigateToTab(hero.serviceId) : onNavigateToService(hero.serviceId))}
            accessibilityRole="button"
            accessibilityLabel={`${heroAction.title}. ${heroAction.sub}`}
            style={styles.bigActionShadow}
          >
            <LinearGradient
              colors={gradients.hero}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bigActionCard}
            >
              <View style={[styles.bigActionHeader, isRtl && rtlStyles.rtlRow]}>
                <View style={styles.bigActionIconWrapper}>
                  <MaterialCommunityIcons name={heroAction.icon} size={30} color={colors.textInverse} />
                </View>
                <Badge label={heroAction.badge} variant="accent" size="sm" />
              </View>
              <Text style={[styles.bigActionTitle, isRtl && rtlStyles.rtlText]}>{heroAction.title}</Text>
              <Text style={[styles.bigActionSub, isRtl && rtlStyles.rtlText]}>{heroAction.sub}</Text>
            </LinearGradient>
          </TouchableOpacity>

          {tileRows.map((row, rowIndex) => (
            <View key={rowIndex} style={[styles.tilesRow, isRtl && rtlStyles.rtlRow]}>
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


      {/* Real, account-scoped farm and crop activity — no demo metrics. */}
      <HomeFarmOverview
        onOpenFarms={() => onNavigateToService('farms')}
        onOpenProjects={() => onNavigateToService('projects')}
        refreshKey={farmOverviewRefreshKey}
      />

      {/* Available agricultural intelligence — server-declared capability state */}
      <IntelligenceStrip
        capabilities={capabilities?.capabilities ?? []}
        loading={capsLoading}
        error={capsError}
        onOpenCapabilities={() => onNavigateToService('multi_agent')}
        onOpenService={openCapabilityService}
      />

      {/* Weather — live observation. The temperature itself is in the hero, so
          this card carries the actionable advice and its provenance instead of
          repeating the same numbers. */}
      {loading ? (
        <StateCard
          variant="elevated"
          cardStyle={styles.weatherCard}
          kind="loading"
          title={x.stateLoading}
          compact
        />
      ) : weather ? (
        <Card
          variant="elevated"
          onPress={() => onNavigateToService('weather')}
          style={styles.weatherCard}
          accessibilityLabel={`${t.weatherTitle}: ${weather.temperature}°C ${weather.governorate}`}
          accessibilityHint={x.weatherOpenDetail}
        >
          <View style={[styles.weatherHeader, isRtl && rtlStyles.rtlRow]}>
            <View style={[styles.weatherMain, isRtl && rtlStyles.rtlRow]}>
              <MaterialCommunityIcons name="lightbulb-on" size={20} color={colors.accent} />
              <Text style={styles.weatherAdviceTitle}>{x.homeWeatherAdviceTitle}</Text>
            </View>
            <Badge label={weather.governorate} variant="secondary" size="sm" />
          </View>

          <Text style={[styles.weatherAdviceBody, isRtl && rtlStyles.rtlText]} numberOfLines={4}>
            {language === 'ar' ? weather.advice_ar : language === 'fr' ? weather.advice_fr : weather.advice_en}
          </Text>

          <View style={[styles.provRow, isRtl && rtlStyles.rtlRow]}>
            <ProvenanceBar meta={weather.meta} cached={weatherFromCache} />
            <View style={styles.weatherMoreSpacer} />
            <Text style={styles.weatherMoreText}>{x.weatherOpenDetail}</Text>
            <MaterialCommunityIcons
              name={isRtl ? 'chevron-left' : 'chevron-right'}
              size={16}
              color={colors.primary}
            />
          </View>
        </Card>
      ) : (
        <StateCard
          variant="elevated"
          cardStyle={styles.weatherCard}
          kind={isOnline ? 'error' : 'offline'}
          title={x.homeWeatherUnavailable}
          message={weatherError || undefined}
          onRetry={loadDashboardData}
          retryLabel={x.retry}
        />
      )}

      {/* Assistant entry */}
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => onNavigateToTab('assistant')}
        accessibilityRole="button"
        accessibilityLabel={`${t.askAssistant}. ${t.assistantPrompt}`}
        style={styles.assistantBanner}
      >
        <View style={[styles.assistantBannerInner, isRtl && rtlStyles.rtlRow]}>
          <View style={styles.assistantIconCircle}>
            <MaterialCommunityIcons name="robot" size={28} color={colors.primary} />
          </View>
          <View style={styles.assistantTextContainer}>
            <Text style={[styles.assistantBannerTitle, isRtl && rtlStyles.rtlText]}>{t.askAssistant}</Text>
            <Text style={[styles.assistantBannerSub, isRtl && rtlStyles.rtlText]}>{t.assistantPrompt}</Text>
          </View>
          <MaterialCommunityIcons
            name={isRtl ? 'chevron-left' : 'chevron-right'}
            size={24}
            color={colors.primary}
          />
        </View>
      </TouchableOpacity>

      {/* Featured real agricultural learning video, followed by more curated tutorials */}
      <LearningVideos onOpenAll={() => onNavigateToService('learning')} />

      {/* Recent member discussions; only authenticated, persisted posts are shown */}
      <HomeCommunityPreview
        onOpenCommunity={() => onNavigateToService('community')}
        onOpenProfile={() => onNavigateToTab('profile')}
      />

      {/* Academy topics route to real video categories or existing service screens */}
      <AcademySection
        onOpenVideos={(category) =>
          onOpenLearning ? onOpenLearning(category) : onNavigateToService('learning')
        }
        onOpenService={openCapabilityService}
      />

      {/* Latest real agricultural headlines */}
      <HomeNewsPreview onOpenAll={() => onNavigateToService('agri_news')} />

      {/* Seasonal agenda — general, indicative guidance */}
      <SeasonAgenda />

      {/* Urgent alerts — from the caller's own persisted notifications */}
      <View style={styles.sectionContainer}>
        <SectionHeader
          title={t.urgentAlerts}
          icon="bell-outline"
          actionLabel={alerts.length > 0 ? t.viewAll : undefined}
          onAction={onOpenNotifications}
        />

        {alertsUnavailable ? (
          <StateCard
            cardStyle={styles.alertsContainer}
            kind="unavailable"
            title={x.stateUnavailable}
            message={x.homeAlertsUnavailable}
            compact
          />
        ) : alertsError && alerts.length === 0 ? (
          <StateCard
            cardStyle={styles.alertsContainer}
            kind={isOnline ? 'error' : 'offline'}
            title={isOnline ? x.stateError : x.stateOffline}
            message={alertsError}
            onRetry={loadDashboardData}
            retryLabel={x.retry}
            compact
          />
        ) : alerts.length === 0 ? (
          <StateCard
            cardStyle={styles.alertsContainer}
            kind="empty"
            title={x.homeNoAlerts}
            message={isAuthenticated ? undefined : x.loginRequiredDesc}
            compact
          />
        ) : (
          <View style={{ gap: spacing.sm }}>
            {alerts.slice(0, 3).map((alert) => (
              <Card key={alert.id} variant="elevated" style={styles.alertCard}>
                <View style={[styles.alertRow, isRtl && rtlStyles.rtlRow]}>
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
                    <Text style={[styles.alertTitle, isRtl && rtlStyles.rtlText]} numberOfLines={1}>
                      {alert.title}
                    </Text>
                    <Text style={[styles.alertMessage, isRtl && rtlStyles.rtlText]} numberOfLines={2}>
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
        <View style={[styles.connectionFooter, isRtl && rtlStyles.rtlRow]}>
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
    <Text style={[styles.actionTileTitle, isRtl && rtlStyles.rtlText]} numberOfLines={1}>
      {title}
    </Text>
    <Text style={[styles.actionTileSub, isRtl && rtlStyles.rtlText]} numberOfLines={2}>
      {sub}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  // Premium brand hero: a deep green gradient anchors the welcome and live
  // weather summary while translucent surfaces preserve text contrast.
  content: { paddingBottom: spacing['3xl'], gap: spacing.md },
  heroShadow: {
    borderRadius: 28,
    marginBottom: spacing.sm,
    ...shadows.lg,
  },
  hero: {
    minHeight: 190,
    borderRadius: 28,
    padding: spacing.lg,
    paddingVertical: spacing.xl,
    borderWidth: 1,
    borderColor: colors.onBrandBorder,
    overflow: 'hidden',
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  heroTextWrap: flex1,
  heroBrandRow: { ...rowGapSm, marginBottom: spacing.xs },
  heroBrandText: { flexShrink: 1 },
  heroBrandName: { fontSize: typography.fontSizes.base, lineHeight: typography.lineHeights.base, fontWeight: typography.fontWeights.bold, color: colors.textInverse },
  heroBrandTagline: { fontSize: typography.fontSizes.xs, lineHeight: typography.lineHeights.xs, color: colors.onBrandFaint, marginTop: 1 },
  heroDate: { fontSize: typography.fontSizes.xs, lineHeight: typography.lineHeights.xs, color: colors.onBrandFaint, fontWeight: typography.fontWeights.medium, textTransform: 'capitalize' },
  heroTitle: { fontSize: typography.fontSizes['2xl'], lineHeight: 36, fontWeight: typography.fontWeights.bold, color: colors.textInverse, marginTop: spacing.xs, letterSpacing: -0.4 },
  heroSub: { fontSize: typography.fontSizes.sm, lineHeight: 21, color: colors.onBrandMuted, marginTop: spacing.xs },
  heroActions: { flexDirection: 'column', alignItems: 'center', gap: spacing.sm },
  heroIconButton: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    backgroundColor: colors.onBrandSurface,
    borderWidth: 1,
    borderColor: colors.onBrandBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroNotificationDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.warning,
    borderWidth: 1,
    borderColor: colors.brandDeep,
  },
  heroAvatar: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    backgroundColor: colors.onBrandSurface,
    borderWidth: 1,
    borderColor: colors.onBrandBorder,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  heroWeatherRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.onBrandBorder,
  },
  heroTemp: { fontSize: typography.fontSizes['2xl'], lineHeight: 34, fontWeight: typography.fontWeights.bold, color: colors.textInverse },
  heroCondition: { flexShrink: 1, fontSize: typography.fontSizes.sm, lineHeight: typography.lineHeights.sm, color: colors.onBrandMuted, fontWeight: typography.fontWeights.medium },
  heroWeatherSpacer: flex1,
  heroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.onBrandSurface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  heroChipText: { fontSize: typography.fontSizes.xs, lineHeight: typography.lineHeights.xs, color: colors.textInverse, fontWeight: typography.fontWeights.semibold },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.warningLight,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  offlineText: { flex: 1, fontSize: typography.fontSizes.xs, color: colors.warning, lineHeight: typography.lineHeights.xs },
  weatherCard: { marginBottom: spacing.md, backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  weatherHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  weatherMain: { ...rowGapXs, flexShrink: 1 },
  weatherAdviceTitle: { fontSize: typography.fontSizes.sm, lineHeight: typography.lineHeights.sm, fontWeight: typography.fontWeights.bold, color: colors.accentDark },
  weatherAdviceBody: { fontSize: typography.fontSizes.sm, lineHeight: typography.lineHeights.sm, color: colors.text, marginTop: spacing.sm },
  weatherMoreSpacer: flex1,
  weatherMoreText: linkCaption,
  provRow: { ...rowGapSm, marginTop: spacing.md, flexWrap: 'wrap' },
  sectionContainer: { ...stackLg, marginBottom: spacing.sm },
  quickActionsGrid: gapSm,
  tilesRow: actionsRow,
  bigActionShadow: { borderRadius: 24, ...shadows.md },
  bigActionCard: { minHeight: 164, borderRadius: 24, padding: spacing.lg, justifyContent: 'space-between' },
  bigActionHeader: spaceBetweenSm,
  bigActionIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.onBrandSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigActionTitle: { fontSize: typography.fontSizes.lg, lineHeight: typography.lineHeights.lg, fontWeight: typography.fontWeights.bold, color: colors.textInverse },
  bigActionSub: { fontSize: typography.fontSizes.xs, color: colors.onBrandMuted, marginTop: spacing.xs, lineHeight: typography.lineHeights.sm },
  actionTile: {
    flex: 1,
    minHeight: 132,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopWidth: 3,
    ...shadows.sm,
  },
  actionTileIcon: { width: 38, height: 38, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  actionTileTitle: titleSm,
  actionTileSub: subtitleMeta,
  assistantBanner: {
    minHeight: 48,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  assistantBannerInner: rowGapMd,
  assistantIconCircle: {
    width: 46,
    height: 46,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  assistantTextContainer: flex1,
  assistantBannerTitle: titleBaseAccent,
  assistantBannerSub: subtitleMeta,
  alertsContainer: { paddingVertical: spacing.xs },
  alertCard: { padding: spacing.sm },
  alertRow: rowGapSm,
  alertIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTextWrap: flex1,
  alertTitle: titleSm,
  alertMessage: subtitleMeta,
  connectionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  connectionFooterText: mutedCaption,
});
