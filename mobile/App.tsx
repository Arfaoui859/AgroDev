import React, { useEffect, useState } from 'react';
import { BackHandler, Platform, StyleSheet, View, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors, spacing, typography } from './src/theme/colors';
import { LanguageProvider, useLanguage } from './src/context/LanguageContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { Header } from './src/components/ui/Header';
import { BottomTabBar, TabKey } from './src/components/ui/BottomTabBar';
import { StateView } from './src/components/ui/StateView';
import { ErrorBoundary } from './src/components/ui/ErrorBoundary';
import { PersonaSelectorModal } from './src/components/onboarding/PersonaSelectorModal';
import { useConnectivity } from './src/hooks/useConnectivity';

// Main screens
import { HomeScreen } from './src/screens/HomeScreen';
import { ServicesScreen } from './src/screens/ServicesScreen';
import { AIAssistantScreen } from './src/screens/AIAssistantScreen';
import { MarketplaceScreen } from './src/screens/MarketplaceScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';

// Service screens
import { SoilAnalysisScreen } from './src/screens/services/SoilAnalysisScreen';
import { DiseaseDetectionScreen } from './src/screens/services/DiseaseDetectionScreen';
import { CropRecommendationScreen, CropSelection } from './src/screens/services/CropRecommendationScreen';
import { CultivationProjectScreen } from './src/screens/services/CultivationProjectScreen';
import { WeatherDetailScreen } from './src/screens/services/WeatherDetailScreen';
import { FarmManagementScreen } from './src/screens/services/FarmManagementScreen';
import { LivestockScreen } from './src/screens/services/LivestockScreen';
import { MultiAgentAIScreen } from './src/screens/services/MultiAgentAIScreen';
import { AgriNewsScreen } from './src/screens/services/AgriNewsScreen';
import { ShortVideoFeedScreen } from './src/screens/services/ShortVideoFeedScreen';
import { CommunityScreen } from './src/screens/services/CommunityScreen';
import { RecentAnalysesScreen } from './src/screens/services/RecentAnalysesScreen';
import { ProjectsScreen } from './src/screens/services/ProjectsScreen';
import { GeneralServiceModal } from './src/screens/services/GeneralServiceModal';
import { SoilToCropContext } from './src/types';
import { getSoil } from './src/i18n/soil';
import { getProjects } from './src/i18n/projects';

const MainAppContent: React.FC = () => {
  const { t, x, isRtl, language } = useLanguage();
  const soil = getSoil(language);
  const { isInitialising, hasOnboarded } = useAuth();
  const { isOnline } = useConnectivity();
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [activeService, setActiveService] = useState<string | null>(null);
  const [personaDismissed, setPersonaDismissed] = useState(false);
  const [learningCategory, setLearningCategory] = useState<string | undefined>(undefined);
  const [showNotifications, setShowNotifications] = useState(false);
  // Soil → crop → project handoff context. Kept in App so the crop screen can
  // reuse the plot/measurements without re-entry, and the project screen knows
  // which farm/plot/crop the user chose.
  const [cropContext, setCropContext] = useState<SoilToCropContext | null>(null);
  const [cropSelection, setCropSelection] = useState<CropSelection | null>(null);
  const [selectionNames, setSelectionNames] = useState<{ farmName?: string; fieldName?: string }>({});

  // First-run onboarding, derived rather than mirrored into state.
  const showPersona = !isInitialising && !hasOnboarded && !personaDismissed;

  // Android hardware/gesture back: close the active overlay or return to the
  // Home tab before letting the OS exit the app. Without this, back would
  // always leave the app from a nested screen.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const onHardwareBack = () => {
      if (showNotifications) {
        setShowNotifications(false);
        return true;
      }
      if (activeService) {
        // Step back through the soil → crop → project flow rather than jumping
        // straight home from a nested screen.
        if (activeService === 'cultivation_project') {
          setActiveService('crops');
        } else {
          if (activeService === 'crops') setCropContext(null);
          setActiveService(null);
        }
        return true;
      }
      if (activeTab !== 'home') {
        setActiveTab('home');
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => sub.remove();
  }, [showNotifications, activeService, activeTab]);

  const handleTabChange = (tab: TabKey) => {
    setActiveService(null);
    setShowNotifications(false);
    setLearningCategory(undefined);
    setActiveTab(tab);
  };

  const getActiveHeaderTitle = (): { title?: string; subtitle?: string } => {
    if (showNotifications) return { title: x.notificationsTitle };

    if (activeService) {
      switch (activeService) {
        case 'soil':
          return { title: t.soilAnalysisName };
        case 'disease':
          return { title: t.diseaseDiagnosisName };
        case 'live_scan':
          return { title: t.diseaseDiagnosisName };
        case 'crops':
          return { title: t.cropRecommendName };
        case 'cultivation_project':
          return { title: soil.projectConfirmTitle };
        case 'weather':
          return { title: t.weatherIntelligenceName };
        case 'farms':
          return { title: t.farmManagementName };
        case 'irrigation':
          return { title: t.smartIrrigationName };
        case 'pest':
          return { title: t.pestControlName };
        case 'livestock':
          return { title: t.livestockName };
        case 'expert':
          return { title: t.expertConsultationName };
        case 'community':
          return { title: t.communityForumName };
        case 'multi_agent':
          return { title: t.multiAgentAiName };
        case 'agri_news':
          return { title: t.agriNewsName };
        case 'community':
        return <CommunityScreen onBack={() => setActiveService(null)} />;
      case 'learning':
          return { title: t.homeLearningTitle };
        case 'recent_analyses':
          return { title: x.recentAnalysesTitle };
        case 'projects':
          return { title: getProjects(language).title };
        default:
          return { title: t.servicesTitle };
      }
    }

    switch (activeTab) {
      case 'services':
        return { title: t.servicesTitle, subtitle: t.servicesSubtitle };
      case 'assistant':
        return { title: t.assistantTitle, subtitle: t.assistantSubtitle };
      case 'marketplace':
        return { title: t.marketTitle, subtitle: t.marketSubtitle };
      case 'profile':
        return { title: t.profileTitle };
      case 'home':
      default:
        return {};
    }
  };

  const { title, subtitle } = getActiveHeaderTitle();
  const showBack = !!activeService || showNotifications;

  const renderService = () => {
    switch (activeService) {
      case 'soil':
        return (
          <SoilAnalysisScreen
            onBack={() => setActiveService(null)}
            onFindCrops={(context) => {
              setCropContext(context);
              setActiveService('crops');
            }}
          />
        );
      case 'disease':
        return <DiseaseDetectionScreen onBack={() => setActiveService(null)} />;
      case 'live_scan':
        return <DiseaseDetectionScreen onBack={() => setActiveService(null)} startWithCamera />;
      case 'crops':
        return (
          <CropRecommendationScreen
            onBack={() => {
              // Leaving the crop screen without choosing clears the soil handoff
              // so a later entry starts clean.
              setCropContext(null);
              setActiveService(null);
            }}
            initialContext={cropContext}
            onSelectCrop={(selection) => {
              setCropSelection(selection);
              setSelectionNames({
                farmName: cropContext?.farmName,
                fieldName: cropContext?.fieldName,
              });
              setActiveService('cultivation_project');
            }}
          />
        );
      case 'cultivation_project':
        return cropSelection ? (
          <CultivationProjectScreen
            onBack={() => {
              setActiveService('crops');
            }}
            selection={cropSelection}
            farmName={selectionNames.farmName}
            fieldName={selectionNames.fieldName}
          />
        ) : (
          <CropRecommendationScreen onBack={() => setActiveService(null)} />
        );
      case 'weather':
        return <WeatherDetailScreen onBack={() => setActiveService(null)} />;
      case 'farms':
        return <FarmManagementScreen onBack={() => setActiveService(null)} />;
      case 'livestock':
        return <LivestockScreen onBack={() => setActiveService(null)} />;
      case 'multi_agent':
        return <MultiAgentAIScreen onBack={() => setActiveService(null)} />;
      case 'agri_news':
        return <AgriNewsScreen onBack={() => setActiveService(null)} />;
      case 'learning':
        return (
          <ShortVideoFeedScreen
            onBack={() => {
              setLearningCategory(undefined);
              setActiveService(null);
            }}
            initialCategory={(learningCategory as any) ?? 'all'}
          />
        );
      case 'recent_analyses':
        return (
          <RecentAnalysesScreen
            onBack={() => setActiveService(null)}
            onSelectAnalysis={(analysis) => {
              // Re-open the service that produced the record so the user can run
              // it again; the saved summary itself is shown in the list.
              if (analysis.type === 'disease') setActiveService('disease');
              else if (analysis.type === 'soil') setActiveService('soil');
              else if (analysis.type === 'crop') setActiveService('crops');
            }}
          />
        );
      case 'projects':
        return <ProjectsScreen onBack={() => setActiveService(null)} />;
      default:
        return <GeneralServiceModal serviceId={activeService as string} onBack={() => setActiveService(null)} />;
    }
  };

  if (isInitialising) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" />
        <View style={styles.loadingScreen}>
          <MaterialCommunityIcons name="sprout" size={56} color={colors.primary} />
          <Text style={styles.loadingBrand}>AgroGrowth</Text>
          <StateView kind="loading" compact />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      {!isOnline ? (
        <View style={[styles.offlineBar, isRtl && styles.rtlRow]}>
          <MaterialCommunityIcons name="wifi-off" size={14} color={colors.textInverse} />
          <Text style={styles.offlineBarText}>{x.offlineBanner}</Text>
        </View>
      ) : null}

      <Header
        title={title}
        subtitle={subtitle}
        showBack={showBack}
        onBack={() => {
          setShowNotifications(false);
          setActiveService(null);
        }}
        onOpenNotifications={() => {
          setActiveService(null);
          setShowNotifications(true);
        }}
      />

      <View style={styles.screenBody}>
        <ErrorBoundary
          language={language}
          resetKey={`${activeTab}:${activeService ?? ''}:${showNotifications}`}
        >
        {showNotifications ? (
          <NotificationsScreen onBack={() => setShowNotifications(false)} />
        ) : activeService ? (
          renderService()
        ) : (
          <>
            {activeTab === 'home' && (
              <HomeScreen
                onNavigateToService={(serviceId) => {
                  // A generic service open always starts the learning catalogue
                  // at "all" unless an Academy tile explicitly selected a
                  // category via onOpenLearning.
                  setLearningCategory(undefined);
                  setActiveService(serviceId);
                }}
                onNavigateToTab={(tab) => setActiveTab(tab as TabKey)}
                onOpenNotifications={() => {
                  setActiveService(null);
                  setShowNotifications(true);
                }}
                onOpenLearning={(category) => {
                  setLearningCategory(category);
                  setActiveService('learning');
                }}
              />
            )}
            {activeTab === 'services' && (
              <ServicesScreen onSelectService={(serviceId) => setActiveService(serviceId)} />
            )}
            {activeTab === 'assistant' && <AIAssistantScreen />}
            {activeTab === 'marketplace' && <MarketplaceScreen />}
            {activeTab === 'profile' && <ProfileScreen />}
          </>
        )}
        </ErrorBoundary>
      </View>

      <BottomTabBar activeTab={activeTab} onTabChange={handleTabChange} />

      <PersonaSelectorModal visible={showPersona} onClose={() => setPersonaDismissed(true)} />
    </SafeAreaView>
  );
};

const RootBoundary: React.FC = () => {
  const { language } = useLanguage();
  return (
    <ErrorBoundary language={language}>
      <MainAppContent />
    </ErrorBoundary>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AuthProvider>
          <RootBoundary />
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.card },
  screenBody: { flex: 1, backgroundColor: colors.background },
  offlineBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.warning,
    paddingVertical: 5,
    paddingHorizontal: spacing.md,
  },
  offlineBarText: { color: colors.textInverse, fontSize: typography.fontSizes.xs, lineHeight: 20, fontWeight: typography.fontWeights.semibold },
  rtlRow: { flexDirection: 'row-reverse' },
  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  loadingBrand: { fontSize: typography.fontSizes['2xl'], lineHeight: 36, fontWeight: typography.fontWeights.bold, color: colors.primary },
});
