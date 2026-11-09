import React, { Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Layout from "./Layout";
import ErrorBoundary from "./ErrorBoundary";
import ProtectedRoute from "./ProtectedRoute";
const Login = React.lazy(() => import("../pages/Login"));
const Signup = React.lazy(() => import("../pages/Signup"));

// Import all the page components
const Index = React.lazy(() => import("../pages/Index"));
const Analysis = React.lazy(() => import("../pages/Analysis"));
const EnhancedAnalysis = React.lazy(() => import("../pages/EnhancedAnalysis"));
const History = React.lazy(() => import("../pages/History"));
const Location = React.lazy(() => import("../pages/Location"));
const Recommendations = React.lazy(() => import("../pages/Recommendations"));
const CropDetails = React.lazy(() => import("../pages/CropDetails"));
const CropHistory = React.lazy(() => import("../pages/CropHistory"));
const DiseaseUpload = React.lazy(() => import("../pages/DiseaseUpload"));
const DiseaseDiagnosis = React.lazy(() => import("../pages/DiseaseDiagnosis"));
const DiseaseHistory = React.lazy(() => import("../pages/DiseaseHistory"));
const DiseaseGuide = React.lazy(() => import("../pages/DiseaseGuide"));
const MarketDashboard = React.lazy(() => import("../pages/MarketDashboard"));
const EnhancedMarketDashboard = React.lazy(() => import("../pages/EnhancedMarketDashboard"));
const MarketIntelligence = React.lazy(() => import("../pages/MarketIntelligence"));
const PriceForecasts = React.lazy(() => import("../pages/PriceForecasts"));
const MarketAlerts = React.lazy(() => import("../pages/MarketAlerts"));
const FertilizerRecommendations = React.lazy(() => import("../pages/FertilizerRecommendations"));
const TreatmentSchedule = React.lazy(() => import("../pages/TreatmentSchedule"));
const EffectivenessReports = React.lazy(() => import("../pages/EffectivenessReports"));
const IrrigationScheduler = React.lazy(() => import("../pages/IrrigationScheduler"));
const CropPlanner = React.lazy(() => import("../pages/CropPlanner"));
const WeatherAlerts = React.lazy(() => import("../pages/WeatherAlerts"));
const WaterAnalytics = React.lazy(() => import("../pages/WaterAnalytics"));
const WeatherCropPlanner = React.lazy(() => import("../pages/WeatherCropPlanner"));
const LivestockDashboard = React.lazy(() => import("../pages/LivestockDashboard"));
const AnimalHealthMonitoring = React.lazy(() => import("../pages/AnimalHealthMonitoring"));
const BreedingManagement = React.lazy(() => import("../pages/BreedingManagement"));
const FeedManagement = React.lazy(() => import("../pages/FeedManagement"));
const SoilProblemDetection = React.lazy(() => import("../pages/SoilProblemDetection"));
const IdealSoilComparison = React.lazy(() => import("../pages/IdealSoilComparison"));
const SoilAlertSystem = React.lazy(() => import("../pages/SoilAlertSystem"));
const SoilAnalysisDetailedReport = React.lazy(() => import("../pages/SoilAnalysisDetailedReport"));
const SmartCropSuggestions = React.lazy(() => import("../pages/SmartCropSuggestions"));
const CropRotationPlanner = React.lazy(() => import("../pages/CropRotationPlanner"));
const AlertHistory = React.lazy(() => import("../pages/AlertHistory"));
const MyTasks = React.lazy(() => import("../pages/MyTasks"));
const TreatmentRecommendations = React.lazy(() => import("../pages/TreatmentRecommendations"));
const TreatmentProgress = React.lazy(() => import("../pages/TreatmentProgress"));
const TreatmentHistory = React.lazy(() => import("../pages/TreatmentHistory"));
const SmartIrrigationDashboard = React.lazy(() => import("../pages/SmartIrrigationDashboard"));
const IrrigationOptimization = React.lazy(() => import("../pages/IrrigationOptimization"));
const PestControl = React.lazy(() => import("../pages/PestControl"));
const WeatherYieldPlanner = React.lazy(() => import("../pages/WeatherYieldPlanner"));
const WaterConservationAnalytics = React.lazy(() => import("../pages/WaterConservationAnalytics"));
const FinancialDashboard = React.lazy(() => import("../pages/FinancialDashboard"));
const ExpenseTracker = React.lazy(() => import("../pages/ExpenseTracker"));
const RevenueAnalysis = React.lazy(() => import("../pages/RevenueAnalysis"));
const ProfitabilityReports = React.lazy(() => import("../pages/ProfitabilityReports"));
const BudgetPlanning = React.lazy(() => import("../pages/BudgetPlanning"));
const AdvancedLivestockDashboard = React.lazy(() => import("../pages/AdvancedLivestockDashboard"));
const IntelligentBreedingManager = React.lazy(() => import("../pages/IntelligentBreedingManager"));
const SmartFeedManager = React.lazy(() => import("../pages/SmartFeedManager"));
const LivestockDiseasePredictor = React.lazy(() => import("../pages/LivestockDiseasePredictor"));
const LivestockProductionAnalytics = React.lazy(() => import("../pages/LivestockProductionAnalytics"));
const FarmerDashboard = React.lazy(() => import("../pages/FarmerDashboard"));
const AgronomistDashboard = React.lazy(() => import("../pages/AgronomistDashboard"));
const EnhancedAgronomistDashboard = React.lazy(() => import("../pages/EnhancedAgronomistDashboard"));
const TraderDashboard = React.lazy(() => import("../pages/TraderDashboard"));
const VeterinarianDashboard = React.lazy(() => import("../pages/VeterinarianDashboard"));
const ComprehensiveFarmManagement = React.lazy(() => import("../pages/ComprehensiveFarmManagement"));
const FieldInspectorDashboard = React.lazy(() => import("../pages/FieldInspectorDashboard"));
const AdminPanel = React.lazy(() => import("../pages/AdminPanel"));
const GovernmentDashboard = React.lazy(() => import("../pages/GovernmentDashboard"));
const UserSettings = React.lazy(() => import("../pages/UserSettings"));
const FieldManagement = React.lazy(() => import("../pages/FieldManagement"));
const AIIntelligenceDashboard = React.lazy(() => import("../pages/AIIntelligenceDashboard"));
const GamificationDashboard = React.lazy(() => import("../pages/GamificationDashboard"));
const InvestorDashboard = React.lazy(() => import("../pages/InvestorDashboard"));
const PublicDataDashboard = React.lazy(() => import("../pages/PublicDataDashboard"));
const FarmerCollaboration = React.lazy(() => import("../pages/FarmerCollaboration"));
const FarmerSegmentation = React.lazy(() => import("../pages/FarmerSegmentation"));
const OfflineManager = React.lazy(() => import("../pages/OfflineManager"));
const NotificationCenter = React.lazy(() => import("../pages/NotificationCenter"));
const CloudServicesStatus = React.lazy(() => import("../pages/CloudServicesStatus"));
const SystemTest = React.lazy(() => import("../pages/SystemTest"));
const SaaSManagement = React.lazy(() => import("../pages/SaaSManagement"));
const SubscriptionManagement = React.lazy(() => import("../pages/SubscriptionManagement"));
const AdaptiveAI = React.lazy(() => import("../pages/AdaptiveAI"));
const SmartMarketplace = React.lazy(() => import("../pages/SmartMarketplace"));
const SupplyChainTracker = React.lazy(() => import("../pages/SupplyChainTracker"));
const SmartLogistics = React.lazy(() => import("../pages/SmartLogistics"));
const QualityInventoryManagement = React.lazy(() => import("../pages/QualityInventoryManagement"));
const DynamicPricing = React.lazy(() => import("../pages/DynamicPricing"));
const AIServicesTest = React.lazy(() => import("../pages/AIServicesTest"));
const AIAssistantChatbot = React.lazy(() => import("../pages/AIAssistantChatbot"));
const SmartAdvisor = React.lazy(() => import("../pages/SmartAdvisor"));
const DatabaseDiagnostics = React.lazy(() => import("../pages/DatabaseDiagnostics"));
const DatabaseStatus = React.lazy(() => import("../pages/DatabaseStatus"));
const ServiceStatus = React.lazy(() => import("../pages/ServiceStatus"));
const AuthTest = React.lazy(() => import("../pages/AuthTest"));
const SetupDemo = React.lazy(() => import("../pages/SetupDemo"));
const NotFound = React.lazy(() => import("../pages/NotFound"));

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
      <Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center" role="status" aria-live="polite"><span className="text-sm text-gray-500">Loading page…</span></div>}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/auth-test" element={<AuthTest />} />
        <Route path="/setup-demo" element={<SetupDemo />} />
      </Routes>
      </Suspense>
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
        <Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center" role="status" aria-live="polite"><span className="text-sm text-gray-500">Loading page…</span></div>}>
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
            path="/soil-analysis-detailed"
            element={<SoilAnalysisDetailedReport />}
          />
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
          <Route
            path="/irrigation-optimization"
            element={<IrrigationOptimization />}
          />
          <Route path="/pest-control" element={<PestControl />} />
          <Route
            path="/weather-yield-planner"
            element={<WeatherYieldPlanner />}
          />
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
        </Suspense>
      </Layout>
    </ErrorBoundary>
  );
}
