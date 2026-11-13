import React, { Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Layout from "./Layout";
import ErrorBoundary from "./ErrorBoundary";
import ProtectedRoute from "./ProtectedRoute";
import { lazyWithRetry } from "../lib/lazyWithRetry";
const Login = lazyWithRetry(() => import("../pages/Login"));
const Signup = lazyWithRetry(() => import("../pages/Signup"));

// Import all the page components
const Index = lazyWithRetry(() => import("../pages/Index"));
const Analysis = lazyWithRetry(() => import("../pages/Analysis"));
const EnhancedAnalysis = lazyWithRetry(() => import("../pages/EnhancedAnalysis"));
const History = lazyWithRetry(() => import("../pages/History"));
const Location = lazyWithRetry(() => import("../pages/Location"));
const Recommendations = lazyWithRetry(() => import("../pages/Recommendations"));
const CropDetails = lazyWithRetry(() => import("../pages/CropDetails"));
const CropHistory = lazyWithRetry(() => import("../pages/CropHistory"));
const DiseaseUpload = lazyWithRetry(() => import("../pages/DiseaseUpload"));
const DiseaseDiagnosis = lazyWithRetry(() => import("../pages/DiseaseDiagnosis"));
const DiseaseHistory = lazyWithRetry(() => import("../pages/DiseaseHistory"));
const DiseaseGuide = lazyWithRetry(() => import("../pages/DiseaseGuide"));
const MarketDashboard = lazyWithRetry(() => import("../pages/MarketDashboard"));
const EnhancedMarketDashboard = lazyWithRetry(() => import("../pages/EnhancedMarketDashboard"));
const MarketIntelligence = lazyWithRetry(() => import("../pages/MarketIntelligence"));
const TunisianAgriNews = lazyWithRetry(() => import("../pages/TunisianAgriNews"));
const Legal = lazyWithRetry(() => import("../pages/Legal"));
const PriceForecasts = lazyWithRetry(() => import("../pages/PriceForecasts"));
const MarketAlerts = lazyWithRetry(() => import("../pages/MarketAlerts"));
const FertilizerRecommendations = lazyWithRetry(() => import("../pages/FertilizerRecommendations"));
const TreatmentSchedule = lazyWithRetry(() => import("../pages/TreatmentSchedule"));
const EffectivenessReports = lazyWithRetry(() => import("../pages/EffectivenessReports"));
const IrrigationScheduler = lazyWithRetry(() => import("../pages/IrrigationScheduler"));
const CropPlanner = lazyWithRetry(() => import("../pages/CropPlanner"));
const WeatherAlerts = lazyWithRetry(() => import("../pages/WeatherAlerts"));
const WaterAnalytics = lazyWithRetry(() => import("../pages/WaterAnalytics"));
const WeatherCropPlanner = lazyWithRetry(() => import("../pages/WeatherCropPlanner"));
const LivestockDashboard = lazyWithRetry(() => import("../pages/LivestockDashboard"));
const AnimalHealthMonitoring = lazyWithRetry(() => import("../pages/AnimalHealthMonitoring"));
const BreedingManagement = lazyWithRetry(() => import("../pages/BreedingManagement"));
const FeedManagement = lazyWithRetry(() => import("../pages/FeedManagement"));
const SoilProblemDetection = lazyWithRetry(() => import("../pages/SoilProblemDetection"));
const IdealSoilComparison = lazyWithRetry(() => import("../pages/IdealSoilComparison"));
const SoilAlertSystem = lazyWithRetry(() => import("../pages/SoilAlertSystem"));
const SoilAnalysisDetailedReport = lazyWithRetry(() => import("../pages/SoilAnalysisDetailedReport"));
const SmartCropSuggestions = lazyWithRetry(() => import("../pages/SmartCropSuggestions"));
const CropRotationPlanner = lazyWithRetry(() => import("../pages/CropRotationPlanner"));
const AlertHistory = lazyWithRetry(() => import("../pages/AlertHistory"));
const MyTasks = lazyWithRetry(() => import("../pages/MyTasks"));
const TreatmentRecommendations = lazyWithRetry(() => import("../pages/TreatmentRecommendations"));
const TreatmentProgress = lazyWithRetry(() => import("../pages/TreatmentProgress"));
const TreatmentHistory = lazyWithRetry(() => import("../pages/TreatmentHistory"));
const SmartIrrigationDashboard = lazyWithRetry(() => import("../pages/SmartIrrigationDashboard"));
const IrrigationOptimization = lazyWithRetry(() => import("../pages/IrrigationOptimization"));
const PestControl = lazyWithRetry(() => import("../pages/PestControl"));
const WeatherYieldPlanner = lazyWithRetry(() => import("../pages/WeatherYieldPlanner"));
const WaterConservationAnalytics = lazyWithRetry(() => import("../pages/WaterConservationAnalytics"));
const FinancialDashboard = lazyWithRetry(() => import("../pages/FinancialDashboard"));
const ExpenseTracker = lazyWithRetry(() => import("../pages/ExpenseTracker"));
const RevenueAnalysis = lazyWithRetry(() => import("../pages/RevenueAnalysis"));
const ProfitabilityReports = lazyWithRetry(() => import("../pages/ProfitabilityReports"));
const BudgetPlanning = lazyWithRetry(() => import("../pages/BudgetPlanning"));
const AdvancedLivestockDashboard = lazyWithRetry(() => import("../pages/AdvancedLivestockDashboard"));
const IntelligentBreedingManager = lazyWithRetry(() => import("../pages/IntelligentBreedingManager"));
const SmartFeedManager = lazyWithRetry(() => import("../pages/SmartFeedManager"));
const LivestockDiseasePredictor = lazyWithRetry(() => import("../pages/LivestockDiseasePredictor"));
const LivestockProductionAnalytics = lazyWithRetry(() => import("../pages/LivestockProductionAnalytics"));
const UnifiedFarmerDashboard = lazyWithRetry(() => import("../pages/UnifiedFarmerDashboard"));
const AgronomistDashboard = lazyWithRetry(() => import("../pages/AgronomistDashboard"));
const EnhancedAgronomistDashboard = lazyWithRetry(() => import("../pages/EnhancedAgronomistDashboard"));
const TraderDashboard = lazyWithRetry(() => import("../pages/TraderDashboard"));
const VeterinarianDashboard = lazyWithRetry(() => import("../pages/VeterinarianDashboard"));

const FieldInspectorDashboard = lazyWithRetry(() => import("../pages/FieldInspectorDashboard"));
const AdminPanel = lazyWithRetry(() => import("../pages/AdminPanel"));
const GovernmentDashboard = lazyWithRetry(() => import("../pages/GovernmentDashboard"));
const UserSettings = lazyWithRetry(() => import("../pages/UserSettings"));
const FieldManagement = lazyWithRetry(() => import("../pages/FieldManagement"));
const ComprehensiveFarmManagement = lazyWithRetry(() => import("../pages/ComprehensiveFarmManagement"));

const GamificationDashboard = lazyWithRetry(() => import("../pages/GamificationDashboard"));
const InvestorDashboard = lazyWithRetry(() => import("../pages/InvestorDashboard"));
const PublicDataDashboard = lazyWithRetry(() => import("../pages/PublicDataDashboard"));
const FarmerCollaboration = lazyWithRetry(() => import("../pages/FarmerCollaboration"));
const FarmerSegmentation = lazyWithRetry(() => import("../pages/FarmerSegmentation"));
const OfflineManager = lazyWithRetry(() => import("../pages/OfflineManager"));
const NotificationCenter = lazyWithRetry(() => import("../pages/NotificationCenter"));
const CloudServicesStatus = lazyWithRetry(() => import("../pages/CloudServicesStatus"));
const SystemTest = lazyWithRetry(() => import("../pages/SystemTest"));
const SaaSManagement = lazyWithRetry(() => import("../pages/SaaSManagement"));
const SubscriptionManagement = lazyWithRetry(() => import("../pages/SubscriptionManagement"));
const AdaptiveAI = lazyWithRetry(() => import("../pages/AdaptiveAI"));
const SmartMarketplace = lazyWithRetry(() => import("../pages/SmartMarketplace"));
const SupplyChainTracker = lazyWithRetry(() => import("../pages/SupplyChainTracker"));
const SmartLogistics = lazyWithRetry(() => import("../pages/SmartLogistics"));
const QualityInventoryManagement = lazyWithRetry(() => import("../pages/QualityInventoryManagement"));
const DynamicPricing = lazyWithRetry(() => import("../pages/DynamicPricing"));
const AIServicesTest = lazyWithRetry(() => import("../pages/AIServicesTest"));
const AIIntelligenceDashboard = lazyWithRetry(() => import("../pages/AIIntelligenceDashboard"));
const AIAssistantChatbot = lazyWithRetry(() => import("../pages/AIAssistantChatbot"));

const DatabaseDiagnostics = lazyWithRetry(() => import("../pages/DatabaseDiagnostics"));
const DatabaseStatus = lazyWithRetry(() => import("../pages/DatabaseStatus"));
const ServiceStatus = lazyWithRetry(() => import("../pages/ServiceStatus"));
const AuthTest = lazyWithRetry(() => import("../pages/AuthTest"));
const SetupDemo = lazyWithRetry(() => import("../pages/SetupDemo"));
const NotFound = lazyWithRetry(() => import("../pages/NotFound"));

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
    return (
      <Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center" role="status" aria-live="polite"><span className="text-sm text-gray-500">Loading page…</span></div>}>
        <Login />
      </Suspense>
    );
  }

  // Authenticated user accessing protected routes - render with Layout
  return (
    <ErrorBoundary fallbackRoute="/">
      <Layout>
        <Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center" role="status" aria-live="polite"><span className="text-sm text-gray-500">Loading page…</span></div>}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/data-input" element={<EnhancedAnalysis />} />
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
          <Route
            path="/market-dashboard"
            element={
              <ProtectedRoute fallbackRoute="/login">
                <MarketDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/enhanced-market"
            element={<EnhancedMarketDashboard />}
          />
          <Route path="/market-intelligence" element={<MarketIntelligence />} />
          <Route path="/news" element={<TunisianAgriNews />} />
          <Route path="/terms" element={<Legal />} />
          <Route path="/privacy" element={<Legal />} />
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
          <Route
            path="/livestock-dashboard"
            element={
              <ProtectedRoute fallbackRoute="/login">
                <LivestockDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/animal-health-monitoring"
            element={<AnimalHealthMonitoring />}
          />
          <Route
            path="/breeding-management"
            element={
              <ProtectedRoute fallbackRoute="/login">
                <BreedingManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/feed-management"
            element={
              <ProtectedRoute fallbackRoute="/login">
                <FeedManagement />
              </ProtectedRoute>
            }
          />
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
          <Route
            path="/financial-dashboard"
            element={
              <ProtectedRoute fallbackRoute="/login">
                <FinancialDashboard />
              </ProtectedRoute>
            }
          />
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
          <Route
            path="/farmer-dashboard"
            element={
              <ProtectedRoute fallbackRoute="/login">
                <UnifiedFarmerDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/agronomist-dashboard" element={<ProtectedRoute allowedRoles={["agronomist", "admin"]} fallbackRoute="/farmer-dashboard"><AgronomistDashboard /></ProtectedRoute>} />
          <Route path="/enhanced-agronomist" element={<ProtectedRoute allowedRoles={["agronomist", "admin"]} fallbackRoute="/farmer-dashboard"><EnhancedAgronomistDashboard /></ProtectedRoute>} />
          <Route path="/trader-dashboard" element={<ProtectedRoute allowedRoles={["trader", "admin"]} fallbackRoute="/farmer-dashboard"><TraderDashboard /></ProtectedRoute>} />
          <Route path="/veterinarian-dashboard" element={<ProtectedRoute allowedRoles={["veterinarian", "admin"]} fallbackRoute="/farmer-dashboard"><VeterinarianDashboard /></ProtectedRoute>} />
          <Route
            path="/comprehensive-farm-management"
            element={
              <ProtectedRoute fallbackRoute="/login">
                <ComprehensiveFarmManagement />
              </ProtectedRoute>
            }
          />
          <Route path="/field-inspector-dashboard" element={<ProtectedRoute allowedRoles={["inspector", "admin"]} fallbackRoute="/farmer-dashboard"><FieldInspectorDashboard /></ProtectedRoute>} />
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
            element={
              <ProtectedRoute allowedRoles={["government", "admin"]} fallbackRoute="/farmer-dashboard">
                <GovernmentDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/field-management" element={<FieldManagement />} />
          <Route path="/ai-intelligence" element={<AIIntelligenceDashboard />} />
          <Route
            path="/ai-intelligence-dashboard"
            element={
              <ProtectedRoute fallbackRoute="/login">
                <AIIntelligenceDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/ai-assistant" element={<AIAssistantChatbot />} />
          <Route path="/ai-chatbot" element={<AIAssistantChatbot />} />
          <Route path="/smart-advisor" element={<Navigate to="/ai-assistant" replace />} />
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
          <Route
            path="/investor-dashboard"
            element={
              <ProtectedRoute allowedRoles={["investor", "admin"]} fallbackRoute="/farmer-dashboard">
                <InvestorDashboard />
              </ProtectedRoute>
            }
          />
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
