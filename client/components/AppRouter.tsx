import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Layout from "./Layout";
import ErrorBoundary from "./ErrorBoundary";
import ProtectedRoute from "./ProtectedRoute";
import Login from "../pages/Login";
import Signup from "../pages/Signup";

// Import all the page components
import Index from "../pages/Index";
import Analysis from "../pages/Analysis";
import EnhancedAnalysis from "../pages/EnhancedAnalysis";
import History from "../pages/History";
import Location from "../pages/Location";
import Recommendations from "../pages/Recommendations";
import CropDetails from "../pages/CropDetails";
import CropHistory from "../pages/CropHistory";
import DiseaseUpload from "../pages/DiseaseUpload";
import DiseaseDiagnosis from "../pages/DiseaseDiagnosis";
import DiseaseHistory from "../pages/DiseaseHistory";
import DiseaseGuide from "../pages/DiseaseGuide";
import MarketDashboard from "../pages/MarketDashboard";
import EnhancedMarketDashboard from "../pages/EnhancedMarketDashboard";
import MarketIntelligence from "../pages/MarketIntelligence";
import PriceForecasts from "../pages/PriceForecasts";
import MarketAlerts from "../pages/MarketAlerts";
import FertilizerRecommendations from "../pages/FertilizerRecommendations";
import TreatmentSchedule from "../pages/TreatmentSchedule";
import EffectivenessReports from "../pages/EffectivenessReports";
import IrrigationScheduler from "../pages/IrrigationScheduler";
import CropPlanner from "../pages/CropPlanner";
import WeatherAlerts from "../pages/WeatherAlerts";
import WaterAnalytics from "../pages/WaterAnalytics";
import WeatherCropPlanner from "../pages/WeatherCropPlanner";
import LivestockDashboard from "../pages/LivestockDashboard";
import AnimalHealthMonitoring from "../pages/AnimalHealthMonitoring";
import BreedingManagement from "../pages/BreedingManagement";
import FeedManagement from "../pages/FeedManagement";
import SoilProblemDetection from "../pages/SoilProblemDetection";
import IdealSoilComparison from "../pages/IdealSoilComparison";
import SoilAlertSystem from "../pages/SoilAlertSystem";
import SmartCropSuggestions from "../pages/SmartCropSuggestions";
import CropRotationPlanner from "../pages/CropRotationPlanner";
import AlertHistory from "../pages/AlertHistory";
import MyTasks from "../pages/MyTasks";
import TreatmentRecommendations from "../pages/TreatmentRecommendations";
import TreatmentProgress from "../pages/TreatmentProgress";
import TreatmentHistory from "../pages/TreatmentHistory";
import SmartIrrigationDashboard from "../pages/SmartIrrigationDashboard";
import WaterConservationAnalytics from "../pages/WaterConservationAnalytics";
import FinancialDashboard from "../pages/FinancialDashboard";
import ExpenseTracker from "../pages/ExpenseTracker";
import RevenueAnalysis from "../pages/RevenueAnalysis";
import ProfitabilityReports from "../pages/ProfitabilityReports";
import BudgetPlanning from "../pages/BudgetPlanning";
import AdvancedLivestockDashboard from "../pages/AdvancedLivestockDashboard";
import IntelligentBreedingManager from "../pages/IntelligentBreedingManager";
import SmartFeedManager from "../pages/SmartFeedManager";
import LivestockDiseasePredictor from "../pages/LivestockDiseasePredictor";
import LivestockProductionAnalytics from "../pages/LivestockProductionAnalytics";
import FarmerDashboard from "../pages/FarmerDashboard";
import AgronomistDashboard from "../pages/AgronomistDashboard";
import EnhancedAgronomistDashboard from "../pages/EnhancedAgronomistDashboard";
import TraderDashboard from "../pages/TraderDashboard";
import VeterinarianDashboard from "../pages/VeterinarianDashboard";
import ComprehensiveFarmManagement from "../pages/ComprehensiveFarmManagement";
import FieldInspectorDashboard from "../pages/FieldInspectorDashboard";
import AdminPanel from "../pages/AdminPanel";
import GovernmentDashboard from "../pages/GovernmentDashboard";
import UserSettings from "../pages/UserSettings";
import FieldManagement from "../pages/FieldManagement";
import AIIntelligenceDashboard from "../pages/AIIntelligenceDashboard";
import GamificationDashboard from "../pages/GamificationDashboard";
import InvestorDashboard from "../pages/InvestorDashboard";
import PublicDataDashboard from "../pages/PublicDataDashboard";
import FarmerCollaboration from "../pages/FarmerCollaboration";
import FarmerSegmentation from "../pages/FarmerSegmentation";
import OfflineManager from "../pages/OfflineManager";
import NotificationCenter from "../pages/NotificationCenter";
import CloudServicesStatus from "../pages/CloudServicesStatus";
import SystemTest from "../pages/SystemTest";
import SaaSManagement from "../pages/SaaSManagement";
import SubscriptionManagement from "../pages/SubscriptionManagement";
import AdaptiveAI from "../pages/AdaptiveAI";
import SmartMarketplace from "../pages/SmartMarketplace";
import SupplyChainTracker from "../pages/SupplyChainTracker";
import SmartLogistics from "../pages/SmartLogistics";
import QualityInventoryManagement from "../pages/QualityInventoryManagement";
import DynamicPricing from "../pages/DynamicPricing";
import AIServicesTest from "../pages/AIServicesTest";
import AIAssistantChatbot from "../pages/AIAssistantChatbot";
import SmartAdvisor from "../pages/SmartAdvisor";
import DatabaseDiagnostics from "../pages/DatabaseDiagnostics";
import DatabaseStatus from "../pages/DatabaseStatus";
import ServiceStatus from "../pages/ServiceStatus";
import AuthTest from "../pages/AuthTest";
import SetupDemo from "../pages/SetupDemo";
import NotFound from "../pages/NotFound";

export default function AppRouter() {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Public routes (login, signup, auth-test) - don't require authentication
  const publicRoutes = ["/login", "/signup", "/auth-test", "/setup-demo"];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  // If on public route, render without Layout
  if (isPublicRoute) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/auth-test" element={<AuthTest />} />
      </Routes>
    );
  }

  // If not authenticated and trying to access protected route, redirect to login
  if (!isAuthenticated) {
    return <Login />;
  }

  // Authenticated user accessing protected routes - render with Layout
  return (
    <ErrorBoundary fallbackRoute="/">
      <Layout>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/data-input" element={<Index />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/enhanced-analysis" element={<EnhancedAnalysis />} />
          <Route path="/analyze" element={<Analysis />} />
          <Route path="/history" element={<History />} />
          <Route path="/location" element={<Location />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/crop/:cropId" element={<CropDetails />} />
          <Route path="/crop-history" element={<CropHistory />} />
          <Route path="/disease-upload" element={<DiseaseUpload />} />
          <Route
            path="/disease-diagnosis/:diagnosisId"
            element={<DiseaseDiagnosis />}
          />
          <Route path="/disease-history" element={<DiseaseHistory />} />
          <Route path="/disease-guide" element={<DiseaseGuide />} />
          <Route path="/market-dashboard" element={<MarketDashboard />} />
          <Route
            path="/enhanced-market"
            element={<EnhancedMarketDashboard />}
          />
          <Route path="/market-intelligence" element={<MarketIntelligence />} />
          <Route path="/price-forecasts" element={<PriceForecasts />} />
          <Route path="/market-alerts" element={<MarketAlerts />} />
          <Route
            path="/fertilizer-recommendations"
            element={<FertilizerRecommendations />}
          />
          <Route path="/treatment-schedule" element={<TreatmentSchedule />} />
          <Route
            path="/effectiveness-reports"
            element={<EffectivenessReports />}
          />
          <Route
            path="/irrigation-scheduler"
            element={<IrrigationScheduler />}
          />
          <Route path="/crop-planner" element={<CropPlanner />} />
          <Route path="/weather-alerts" element={<WeatherAlerts />} />
          <Route path="/water-analytics" element={<WaterAnalytics />} />
          <Route
            path="/weather-crop-planner"
            element={<WeatherCropPlanner />}
          />
          <Route path="/livestock-dashboard" element={<LivestockDashboard />} />
          <Route
            path="/animal-health-monitoring"
            element={<AnimalHealthMonitoring />}
          />
          <Route path="/breeding-management" element={<BreedingManagement />} />
          <Route path="/feed-management" element={<FeedManagement />} />
          <Route
            path="/soil-problem-detection"
            element={<SoilProblemDetection />}
          />
          <Route
            path="/ideal-soil-comparison"
            element={<IdealSoilComparison />}
          />
          <Route path="/soil-alert-system" element={<SoilAlertSystem />} />
          <Route
            path="/smart-crop-suggestions"
            element={<SmartCropSuggestions />}
          />
          <Route
            path="/crop-rotation-planner"
            element={<CropRotationPlanner />}
          />
          <Route path="/alert-history" element={<AlertHistory />} />
          <Route path="/my-tasks" element={<MyTasks />} />
          <Route
            path="/treatment-recommendations"
            element={<TreatmentRecommendations />}
          />
          <Route
            path="/treatment-progress/:historyId"
            element={<TreatmentProgress />}
          />
          <Route path="/treatment-history" element={<TreatmentHistory />} />
          <Route
            path="/smart-irrigation"
            element={<SmartIrrigationDashboard />}
          />
          <Route
            path="/water-conservation"
            element={<WaterConservationAnalytics />}
          />
          <Route path="/financial-dashboard" element={<FinancialDashboard />} />
          <Route path="/expense-tracker" element={<ExpenseTracker />} />
          <Route path="/revenue-analysis" element={<RevenueAnalysis />} />
          <Route
            path="/profitability-reports"
            element={<ProfitabilityReports />}
          />
          <Route path="/budget-planning" element={<BudgetPlanning />} />
          <Route
            path="/advanced-livestock"
            element={<AdvancedLivestockDashboard />}
          />
          <Route
            path="/intelligent-breeding"
            element={<IntelligentBreedingManager />}
          />
          <Route path="/smart-feed-manager" element={<SmartFeedManager />} />
          <Route
            path="/livestock-disease-predictor"
            element={<LivestockDiseasePredictor />}
          />
          <Route
            path="/livestock-production-analytics"
            element={<LivestockProductionAnalytics />}
          />
          <Route path="/farmer-dashboard" element={<FarmerDashboard />} />
          <Route
            path="/agronomist-dashboard"
            element={<AgronomistDashboard />}
          />
          <Route
            path="/enhanced-agronomist"
            element={<EnhancedAgronomistDashboard />}
          />
          <Route path="/trader-dashboard" element={<TraderDashboard />} />
          <Route
            path="/veterinarian-dashboard"
            element={<VeterinarianDashboard />}
          />
          <Route
            path="/comprehensive-farm-management"
            element={<ComprehensiveFarmManagement />}
          />
          <Route
            path="/field-inspector-dashboard"
            element={<FieldInspectorDashboard />}
          />
          <Route
            path="/admin-panel"
            element={
              <ProtectedRoute allowedRoles={['admin']} fallbackRoute="/">
                <AdminPanel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/government-dashboard"
            element={<GovernmentDashboard />}
          />
          <Route path="/field-management" element={<FieldManagement />} />
          <Route
            path="/ai-intelligence"
            element={<AIIntelligenceDashboard />}
          />
          <Route
            path="/ai-intelligence-dashboard"
            element={<AIIntelligenceDashboard />}
          />
          <Route path="/ai-assistant" element={<AIAssistantChatbot />} />
          <Route path="/ai-chatbot" element={<AIAssistantChatbot />} />
          <Route path="/smart-advisor" element={<SmartAdvisor />} />
          <Route path="/gamification" element={<GamificationDashboard />} />
          <Route path="/investor-dashboard" element={<InvestorDashboard />} />
          <Route path="/public-data" element={<PublicDataDashboard />} />
          <Route
            path="/farmer-collaboration"
            element={<FarmerCollaboration />}
          />
          <Route path="/farmer-segmentation" element={<FarmerSegmentation />} />
          <Route path="/offline-manager" element={<OfflineManager />} />
          <Route path="/notifications" element={<NotificationCenter />} />
          <Route path="/cloud-status" element={<CloudServicesStatus />} />
          <Route path="/system-test" element={<SystemTest />} />
          <Route path="/saas-management" element={<SaaSManagement />} />
          <Route
            path="/subscription-management"
            element={<SubscriptionManagement />}
          />
          <Route path="/adaptive-ai" element={<AdaptiveAI />} />
          <Route path="/smart-marketplace" element={<SmartMarketplace />} />
          <Route
            path="/supply-chain-tracker"
            element={<SupplyChainTracker />}
          />
          <Route path="/smart-logistics" element={<SmartLogistics />} />
          <Route
            path="/quality-inventory"
            element={<QualityInventoryManagement />}
          />
          <Route path="/dynamic-pricing" element={<DynamicPricing />} />
          <Route path="/ai-services-test" element={<AIServicesTest />} />
          <Route
            path="/database-diagnostics"
            element={<DatabaseDiagnostics />}
          />
          <Route path="/database-status" element={<DatabaseStatus />} />
          <Route path="/service-status" element={<ServiceStatus />} />
          <Route path="/auth-test" element={<AuthTest />} />
          <Route path="/settings" element={<UserSettings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </ErrorBoundary>
  );
}
