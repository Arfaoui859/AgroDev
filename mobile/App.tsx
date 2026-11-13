import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { colors } from './src/theme/colors';
import { LanguageProvider, useLanguage } from './src/context/LanguageContext';
import { AuthProvider } from './src/context/AuthContext';
import { Header } from './src/components/ui/Header';
import { BottomTabBar, TabKey } from './src/components/ui/BottomTabBar';

// Main Screens
import { HomeScreen } from './src/screens/HomeScreen';
import { ServicesScreen } from './src/screens/ServicesScreen';
import { AIAssistantScreen } from './src/screens/AIAssistantScreen';
import { MarketplaceScreen } from './src/screens/MarketplaceScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

// Interactive Service Screens
import { SoilAnalysisScreen } from './src/screens/services/SoilAnalysisScreen';
import { DiseaseDetectionScreen } from './src/screens/services/DiseaseDetectionScreen';
import { CropRecommendationScreen } from './src/screens/services/CropRecommendationScreen';
import { WeatherDetailScreen } from './src/screens/services/WeatherDetailScreen';
import { FarmManagementScreen } from './src/screens/services/FarmManagementScreen';
import { MultiAgentAIScreen } from './src/screens/services/MultiAgentAIScreen';
import { RecentAnalysesScreen } from './src/screens/services/RecentAnalysesScreen';
import { GeneralServiceModal } from './src/screens/services/GeneralServiceModal';

const MainAppContent: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [activeService, setActiveService] = useState<string | null>(null);

  const handleTabChange = (tab: TabKey) => {
    setActiveService(null);
    setActiveTab(tab);
  };

  const getActiveHeaderTitle = (): { title?: string; subtitle?: string } => {
    if (activeService) {
      switch (activeService) {
        case 'soil':
          return { title: t.soilAnalysisName };
        case 'disease':
          return { title: t.diseaseDiagnosisName };
        case 'live_scan':
          return { title: 'فحص حي بالكاميرا' };
        case 'crops':
          return { title: t.cropRecommendName };
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
        case 'recent_analyses':
          return { title: 'سجل التحاليل السابقة' };
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      {/* Top Universal Header with language toggle and branding */}
      <Header
        title={title}
        subtitle={subtitle}
        showBack={!!activeService}
        onBack={() => setActiveService(null)}
      />

      {/* Screen Body */}
      <View style={styles.screenBody}>
        {activeService ? (
          activeService === 'soil' ? (
            <SoilAnalysisScreen onBack={() => setActiveService(null)} />
          ) : activeService === 'disease' ? (
            <DiseaseDetectionScreen onBack={() => setActiveService(null)} />
          ) : activeService === 'live_scan' ? (
            <DiseaseDetectionScreen onBack={() => setActiveService(null)} startWithCamera={true} />
          ) : activeService === 'crops' ? (
            <CropRecommendationScreen onBack={() => setActiveService(null)} />
          ) : activeService === 'weather' ? (
            <WeatherDetailScreen onBack={() => setActiveService(null)} />
          ) : activeService === 'farms' ? (
            <FarmManagementScreen onBack={() => setActiveService(null)} />
          ) : activeService === 'multi_agent' ? (
            <MultiAgentAIScreen onBack={() => setActiveService(null)} />
          ) : activeService === 'recent_analyses' ? (
            <RecentAnalysesScreen onBack={() => setActiveService(null)} />
          ) : (
            <GeneralServiceModal serviceId={activeService} onBack={() => setActiveService(null)} />
          )
        ) : (
          <>
            {activeTab === 'home' && (
              <HomeScreen
                onNavigateToService={(serviceId) => setActiveService(serviceId)}
                onNavigateToTab={(tab) => setActiveTab(tab)}
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
      </View>

      {/* Bottom Main Navigation Bar */}
      <BottomTabBar activeTab={activeTab} onTabChange={handleTabChange} />
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LanguageProvider>
          <MainAppContent />
        </LanguageProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.card,
  },
  screenBody: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
