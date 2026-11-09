import "dotenv/config";
import express from "express";
import {
  securityHeaders,
  corsMiddleware,
  apiRateLimiter,
  aiRateLimiter,
  jsonBodyErrorHandler,
  requireAdminToken,
  keyMintRateLimiter,
} from "./middleware/security";
import { requireAuth, requireAdminAccess } from "./middleware/auth";
import { blockSimulatedData } from "./lib/provenance";
import systemCapabilitiesRoutes from "./routes/system-capabilities";
import { handleUploadError } from "./middleware/upload";
import {
  getWeatherByCoordinates,
  getWeatherByLocation,
  getCropSpecificWeather,
} from "./routes/weather";
import {
  getMarketData,
  getAllMarketData,
  getMarketTrends,
  getRegionalPrices,
} from "./routes/market";
import {
  analyzePlantImages,
  uploadMiddleware,
  getDiseaseHistory,
  getDiseaseInfo,
  getAllDiseases,
} from "./routes/disease-detection";
import marketAnalysisRoutes from "./routes/market-analysis";
import fertilizerRecommenderRoutes from "./routes/fertilizer-recommender";
import weatherIrrigationRoutes from "./routes/weather-irrigation";
import weatherCropPlannerRoutes from "./routes/weather-crop-planner";
import livestockManagementRoutes from "./routes/livestock-management";
import soilAiDetectorRoutes from "./routes/soil-ai-detector";
import smartCropSuggestionsRoutes from "./routes/smart-crop-suggestions";
import smartCropAlertsRoutes from "./routes/smart-crop-alerts";
import diseaseTreatmentRoutes from "./routes/disease-treatment-recommendations";
import digitalTransformationRoutes from "./routes/digital-transformation";
import emergencyResponseRoutes from "./routes/emergency-response";
import emergingTechRoutes from "./routes/emerging-tech";
import ipManagementRoutes from "./routes/ip-management";
import smartAdvisorRoutes from "./routes/smart-advisor";
import digitalTrainingRoutes from "./routes/digital-training";
import predictiveAnalyticsRoutes from "./routes/predictive-analytics";
import riskDetectionRoutes from "./routes/risk-detection";
import aiCapabilitiesRoutes from "./routes/ai-capabilities";
import smartIrrigationRoutes from "./routes/smart-irrigation";
import { irrigationOptimizationRouter } from "./routes/irrigation-optimization";
import { pestControlRouter } from "./routes/pest-control";
import { weatherYieldIntelligenceRouter } from "./routes/weather-yield-intelligence";
import {
  createExpense,
  getExpenses,
  createRevenue,
  getRevenues,
  getProfitabilityAnalysis,
  getFinancialSummary,
  createBudgetPlan,
  getBudgetPlans,
  updateBudgetPlan,
  deleteBudgetPlan,
  updateExpense,
  deleteExpense,
  updateRevenue,
  deleteRevenue,
} from "./routes/farm-finance";
import {
  getAnimals,
  getAnimalHealth,
  getBreedingRecommendations,
  getFeedRecommendations,
  optimizeFeedBudget,
  getHealthAlerts,
  getLivestockDashboard,
} from "./routes/advanced-livestock-management";
import farmerDashboardRoutes from "./routes/farmer-dashboard";
import agronomistDashboardRoutes from "./routes/agronomist-dashboard";
import traderDashboardRoutes from "./routes/trader-dashboard";
import {
  getVeterinarianDashboard,
  getVeterinarianPatients,
  getVeterinarianAppointments,
  getVeterinarianEmergencies,
  getVeterinarianInventory,
  getVeterinarianTreatments,
  getVeterinarianFinancials,
} from "./routes/veterinarian-dashboard";
import {
  getComprehensiveFarmDashboard,
  getFarmAlerts,
  getFarmTasks,
  getFarmCrops,
  getFarmWeather,
  getFarmMarket,
  getFarmEquipment,
  getFarmFinancial,
  getFarmLabor,
} from "./routes/comprehensive-farm-management";
import {
  getFieldInspectorDashboard,
  getFieldInspectorVisits,
  getFieldInspectorNotes,
  getFieldInspectorQualityAssessments,
  getFieldInspectorReports,
  getFieldInspectorRecommendationTracking,
  getFieldInspectorProfile,
} from "./routes/field-inspector";
import {
  getAdminDashboard,
  getAdminUsers,
  getAdminSystemMetrics,
  getAdminUsageAnalytics,
  getAdminSecurityEvents,
  getAdminActivityLogs,
  getAdminSubscriptions,
} from "./routes/admin-panel";
import governmentDashboardRoutes from "./routes/government-dashboard";
import {
  getFarms,
  createFarm,
  getFarmById,
  getFields,
  getFieldById,
  createField,
  updateField,
  deleteField,
  getCropHistory,
  getFieldAlerts,
  getActivityLogs,
  getFieldPerformance,
  generateAIRecommendations,
} from "./routes/field-management";
import {
  getNotifications,
  getNotificationById,
  createNotification,
  updateNotification,
  markAsRead,
  markAsUnread,
  toggleStar,
  archiveNotification,
  deleteNotification,
  bulkUpdateNotifications,
  getSensors,
  getRealTimeData,
  getNotificationRules,
  createNotificationRule,
  updateNotificationRule,
  deleteNotificationRule,
  getNotificationStats,
  sendManualNotification,
} from "./routes/notifications";
import {
  getSaaSMetrics,
  getSaaSAnalytics,
  getSaaSSubscriptions,
  getSaaSPlans,
} from "./routes/saas-management";
import {
  getSubscriptionPlans,
  getPaymentMethods,
  getPromoCodes,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
} from "./routes/subscription-management";
import {
  getAIModels,
  getAIInsights,
  getUserBehaviorData,
  getPersonalizedRecommendations,
  getFeedbackData,
  submitFeedback,
  updateRecommendationFeedback,
  triggerModelTraining,
} from "./routes/adaptive-ai";
import {
  getMarketplaceListings,
  getMarketplaceInquiries,
  getMarketplaceAnalytics,
  getSupplyChainNodes,
  createMarketplaceListing,
  createInquiry,
} from "./routes/smart-marketplace";
import {
  getSupplyChainTracking,
  getSupplyChainMetrics,
  getTrackingByBatch,
  updateTrackingStep,
  addQualityCheck,
  resolveAlert,
  generateTrackingReport,
} from "./routes/supply-chain-tracking";
import {
  getLogisticsVehicles,
  getLogisticsOrders,
  getLogisticsMetrics,
  getRouteOptimizations,
  createRouteOptimization,
  updateVehicleLocation,
  updateOrderStatus,
  assignOrderToVehicle,
  getVehiclePerformance,
} from "./routes/smart-logistics";
import {
  analyzeSoilData,
  matchCropToClimate,
  diagnoseSoilFromImage,
  getSmartCropRecommendations,
  estimateCropProfitability,
  compareCropProfitability,
  getQuickCropRecommendation,
  detectPlantDisease,
  analyzeLeafHealth,
  comprehensivePlantAnalysis,
  quickPlantHealthCheck,
  forecastMarketPrices,
  analyzeSupplyDemand,
  chatWithAIAssistant,
  generateFarmingTasks,
  getSmartAlerts,
  getSupportedCrops,
  getSupportedDiseases,
  getAIServicesHealth,
} from "./routes/ai-services-gateway";
import {
  getUserProfile,
  awardXP,
  getLeaderboard,
  getAvailableAchievements,
  getUserActivity,
  getGamificationStats,
} from "./routes/gamification";
import {
  getInvestmentOpportunities,
  getProfitabilityAnalysis as getInvestorProfitabilityAnalysis,
  getMarketInsights,
  getInvestorPortfolio,
  getInvestorDashboard,
  createInvestment,
} from "./routes/investor-dashboard";
import {
  getMarketPrices,
  getProductionData,
  getExportData,
  getWeatherData,
  getAPIKeyInfo,
  getPublicStats,
  createAPIKey,
} from "./routes/public-data-api";
import {
  getChatRooms,
  getRoomMessages,
  sendMessage,
  getConsultations,
  createConsultation,
  getForumPosts,
  createForumPost,
  getPostReplies,
  getOnlineExperts,
  getCollaborationStats,
} from "./routes/farmer-collaboration";
import {
  getFarmerSegments,
  segmentFarmer,
  getAllFarmersSegmentation,
  getSegmentationAnalytics,
  updateFarmerProfile,
} from "./routes/farmer-segmentation";
import { testSupabaseConnection } from "./routes/test-supabase";
import { listAssistantFarms, createAssistantCultivation, listAssistantCultivations } from "./routes/assistant-actions";
import { confirmUnconfirmedUsers } from "./routes/confirm-unconfirmed";
import { adminSetPassword } from "./routes/admin-set-password";
import { adminCreateUser } from "./routes/admin-create-user";
import { testAuthSignup, testAuthSignin } from "./routes/test-auth";
import { createUserWithProfile, checkUserExists } from "./routes/auth-helper";
import { debugAuth } from "./routes/debug-auth";
import { setupInspectorUser, setupMultipleUsers } from "./routes/setup-inspector-user";
import { setupAdminUser } from "./routes/admin-setup";
import {
  analyzeSoilDetailed,
  analyzeSoilBatch,
  listSoilAnalysisReports,
  getSoilAnalysisReport,
} from "./routes/soil-analysis-detailed";

export function createServer() {
  const app = express();

  // Trust the single reverse proxy in front of the Render service.
  app.set("trust proxy", 1);

  // Security middleware
  app.use(securityHeaders());
  app.use(corsMiddleware());

  // Middleware
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true, limit: "2mb" }));

  // Global API rate limiting (health checks are exempt)
  app.use("/api", apiRateLimiter());

  // Stricter limiter for expensive AI inference paths (may trigger paid model
  // calls). Registered here, before any /api/ai, /api/disease, /api/soil-analysis
  // or /api/ai-recommendations route, so every one of them is actually covered.
  app.use(
    ["/api/ai", "/api/disease", "/api/soil-analysis", "/api/ai-recommendations"],
    aiRateLimiter(),
  );

  // Fail closed for modules whose current handlers are backed by in-memory
  // fixtures, seeded generators, or unverified static records. A disclosure
  // banner is not enough: these APIs return 503 until real persistence and
  // verifiable data sources are connected.
  app.use(
    [
      "/api/government-dashboard",
      "/api/investor-dashboard",
      "/api/veterinarian-dashboard",
      "/api/segmentation",
      "/api/smart-crop-suggestions",
      "/api/alerts",
      "/api/tasks",
      // In-memory demo stores with no database backing: label them so the SPA
      // discloses that the community/transformation content is not persisted.
      "/api/collaboration",
      "/api/digital-transformation",
      "/api/disease-treatment",
      // SaaS / logistics / supply-chain modules are served from fixed in-memory
      // fixtures (mock vehicles, orders, plans, tracking records). Stamp them so
      // the SPA can disclose that these are illustrative, not live records.
      "/api/saas",
      "/api/subscription",
      "/api/logistics",
      "/api/soil-ai-detector",
      // Further fixture-backed modules: the routers below build their records
      // from fixed in-memory arrays (see the "Mock data for demonstration"
      // block at the top of each). They have no database or licensed feed
      // behind them, so they are stamped as simulated too.
      "/api/emergency-response",
      "/api/ip-management",
      "/api/emerging-tech",
      // Investor and agronomist dashboards generate their figures from seeded
      // demo generators (no licensed market feed, no farm database behind
      // them). Mounted at /api/investor/* and /api/agronomist-dashboard/*.
    ],
    blockSimulatedData(),
  );

  // Health check routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });


  // Public, secret-free capability probes used by the SPA service-status panel.
  app.use("/api/system", systemCapabilitiesRoutes);
  app.use("/api/test/db", systemCapabilitiesRoutes);

  // Weather API routes
  app.get("/api/weather/coordinates", getWeatherByCoordinates);
  app.get("/api/weather/location", getWeatherByLocation);
  app.get("/api/weather/crop-specific", getCropSpecificWeather);

  // Market API routes
  app.get("/api/market/crop/:cropId", getMarketData);
  app.get("/api/market/all", getAllMarketData);
  app.get("/api/market/trends", getMarketTrends);
  app.get("/api/market/regional/:cropId", getRegionalPrices);

  // AI Recommendation routes

  // Disease Detection routes
  app.post("/api/disease/analyze", uploadMiddleware, analyzePlantImages);
  app.get("/api/disease/history", getDiseaseHistory);
  app.get("/api/disease/info/:diseaseId", getDiseaseInfo);
  app.get("/api/disease/all", getAllDiseases);

  // Market Analysis routes
  app.use("/api/market-analysis", marketAnalysisRoutes);

  // Fertilizer Recommender routes
  app.use("/api/fertilizer", fertilizerRecommenderRoutes);

  // Weather & Irrigation routes
  app.use("/api/weather-irrigation", weatherIrrigationRoutes);

  // Weather-Based Crop Planner routes
  app.use("/api/weather-crop-planner", weatherCropPlannerRoutes);

  // Livestock Management routes
  app.use("/api/livestock-management", livestockManagementRoutes);

  // Soil AI Detector routes
  app.use("/api/soil-ai-detector", soilAiDetectorRoutes);

  // Soil Analysis Detailed routes (AI-powered detailed analysis)
  app.post("/api/soil-analysis/analyze", requireAuth, analyzeSoilDetailed);
  app.post("/api/soil-analysis/batch", requireAuth, analyzeSoilBatch);
  app.get("/api/soil-analysis/reports", requireAuth, listSoilAnalysisReports);
  app.get("/api/soil-analysis/report/:analysisId", requireAuth, getSoilAnalysisReport);

  // Smart Crop Suggestions routes
  app.use("/api/smart-crop-suggestions", smartCropSuggestionsRoutes);

  // Smart Crop Alerts routes
  app.use("/api", smartCropAlertsRoutes);

  // Disease Treatment routes
  app.use("/api/disease-treatment", diseaseTreatmentRoutes);
  app.use("/api/digital-transformation", digitalTransformationRoutes);
  app.use("/api/emergency-response", emergencyResponseRoutes);
  app.use("/api/emerging-tech", emergingTechRoutes);
  app.use("/api/ip-management", ipManagementRoutes);
  app.use("/api/smart-advisor", smartAdvisorRoutes);
  app.use("/api/digital-training", digitalTrainingRoutes);
  app.use("/api/predictive-analytics", predictiveAnalyticsRoutes);
  app.use("/api/risk-detection", riskDetectionRoutes);

  // Smart Irrigation routes
  app.use("/api/smart-irrigation", smartIrrigationRoutes);

  // Irrigation Optimization routes
  app.use("/api/irrigation-optimization", irrigationOptimizationRouter);

  // Pest Control routes
  app.use("/api/pest-control", pestControlRouter);

  // Weather & Yield Intelligence routes
  app.use("/api/weather-yield-intelligence", weatherYieldIntelligenceRouter);

  // Financial Management routes
  app.post("/api/expenses", requireAuth, createExpense);
  app.get("/api/expenses", requireAuth, getExpenses);
  app.put("/api/expenses/:id", requireAuth, updateExpense);
  app.delete("/api/expenses/:id", requireAuth, deleteExpense);
  app.post("/api/revenues", requireAuth, createRevenue);
  app.get("/api/revenues", requireAuth, getRevenues);
  app.put("/api/revenues/:id", requireAuth, updateRevenue);
  app.delete("/api/revenues/:id", requireAuth, deleteRevenue);
  app.get("/api/profitability-analysis", requireAuth, getProfitabilityAnalysis);
  app.get("/api/financial-summary", requireAuth, getFinancialSummary);
  app.post("/api/budget-plans", requireAuth, createBudgetPlan);
  app.get("/api/budget-plans", requireAuth, getBudgetPlans);
  app.put("/api/budget-plans/:id", requireAuth, updateBudgetPlan);
  app.delete("/api/budget-plans/:id", requireAuth, deleteBudgetPlan);

  // Assistant actions are always explicit, authenticated, and persisted.
  app.get("/api/assistant/farms", requireAuth, listAssistantFarms);
  app.get("/api/assistant/cultivations", requireAuth, listAssistantCultivations);
  app.post("/api/assistant/actions/cultivations", requireAuth, createAssistantCultivation);

  // Advanced Livestock Management routes
  app.get("/api/animals", getAnimals);
  app.get("/api/animal-health/:animalId", getAnimalHealth);
  app.get("/api/breeding-recommendations", getBreedingRecommendations);
  app.get("/api/feed-recommendations/:animalId", getFeedRecommendations);
  app.post("/api/optimize-feed-budget", optimizeFeedBudget);
  app.get("/api/health-alerts", getHealthAlerts);
  app.get("/api/livestock-dashboard", getLivestockDashboard);

  // Farmer Dashboard routes
  app.use("/api/farmer-dashboard", farmerDashboardRoutes);

  // Agronomist Dashboard routes
  app.use("/api/agronomist-dashboard", agronomistDashboardRoutes);

  // Trader Dashboard routes
  app.use("/api/trader-dashboard", traderDashboardRoutes);

  // Veterinarian Dashboard routes
  app.get("/api/veterinarian-dashboard/overview", getVeterinarianDashboard);
  app.get("/api/veterinarian-dashboard/patients", getVeterinarianPatients);
  app.get(
    "/api/veterinarian-dashboard/appointments",
    getVeterinarianAppointments,
  );
  app.get(
    "/api/veterinarian-dashboard/emergencies",
    getVeterinarianEmergencies,
  );
  app.get("/api/veterinarian-dashboard/inventory", getVeterinarianInventory);
  app.get("/api/veterinarian-dashboard/treatments", getVeterinarianTreatments);
  app.get(
    "/api/veterinarian-dashboard/financial-summary",
    getVeterinarianFinancials,
  );

  // Comprehensive Farm Management Dashboard routes
  app.get("/api/farm-management/overview", getComprehensiveFarmDashboard);
  app.get("/api/farm-management/alerts", getFarmAlerts);
  app.get("/api/farm-management/tasks", getFarmTasks);
  app.get("/api/farm-management/crops", getFarmCrops);
  app.get("/api/farm-management/weather", getFarmWeather);
  app.get("/api/farm-management/market", getFarmMarket);
  app.get("/api/farm-management/equipment", getFarmEquipment);
  app.get("/api/farm-management/financial", getFarmFinancial);
  app.get("/api/farm-management/labor", getFarmLabor);

  // Field Inspector Dashboard routes
  app.get("/api/field-inspector/overview", getFieldInspectorDashboard);
  app.get("/api/field-inspector/visits", getFieldInspectorVisits);
  app.get("/api/field-inspector/notes", getFieldInspectorNotes);
  app.get(
    "/api/field-inspector/quality-assessments",
    getFieldInspectorQualityAssessments,
  );
  app.get("/api/field-inspector/reports", getFieldInspectorReports);
  app.get(
    "/api/field-inspector/recommendation-tracking",
    getFieldInspectorRecommendationTracking,
  );
  app.get("/api/field-inspector/profile", getFieldInspectorProfile);

  // Admin Panel routes. These expose platform-wide figures (all users, system
  // metrics, security events, activity logs), so they are gated with
  // requireAdminAccess(): an x-admin-token, or a verified JWT whose role is
  // admin/administrator. Anonymous callers get 401; non-admin JWTs get 403.
  // (The non-production demo fallback still applies for local development.)
  app.get("/api/admin/overview", requireAdminAccess, getAdminDashboard);
  app.get("/api/admin/users", requireAdminAccess, getAdminUsers);
  app.get("/api/admin/system-metrics", requireAdminAccess, getAdminSystemMetrics);
  app.get("/api/admin/usage-analytics", requireAdminAccess, getAdminUsageAnalytics);
  app.get("/api/admin/security-events", requireAdminAccess, getAdminSecurityEvents);
  app.get("/api/admin/activity-logs", requireAdminAccess, getAdminActivityLogs);
  app.get("/api/admin/subscriptions", requireAdminAccess, getAdminSubscriptions);

  // Government Dashboard routes
  app.use("/api/government-dashboard", governmentDashboardRoutes);

  // Field Management routes. These act on the caller's own farms/fields, so
  // identity must be established (verified JWT, or the non-production demo
  // identity) before the handler runs. The scoped Supabase client then enforces
  // ownership through RLS as a second layer.
  app.get("/api/farms", requireAuth, getFarms);
  app.post("/api/farms", requireAuth, createFarm);
  app.get("/api/farms/:farmId", requireAuth, getFarmById);
  app.get("/api/fields", requireAuth, getFields);
  app.get("/api/fields/:fieldId", requireAuth, getFieldById);
  app.post("/api/fields", requireAuth, createField);
  app.put("/api/fields/:fieldId", requireAuth, updateField);
  app.delete("/api/fields/:fieldId", requireAuth, deleteField);
  app.get("/api/crop-history", requireAuth, getCropHistory);
  app.get("/api/field-alerts", requireAuth, getFieldAlerts);
  app.get("/api/activity-logs", requireAuth, getActivityLogs);
  app.get("/api/fields/:fieldId/performance", requireAuth, getFieldPerformance);
  app.post("/api/ai-recommendations", requireAuth, generateAIRecommendations);

  // Notification System routes
  app.get("/api/notifications", getNotifications);
  app.get("/api/notifications/:id", getNotificationById);
  app.post("/api/notifications", createNotification);
  app.put("/api/notifications/:id", updateNotification);
  app.patch("/api/notifications/:id/read", markAsRead);
  app.patch("/api/notifications/:id/unread", markAsUnread);
  app.patch("/api/notifications/:id/star", toggleStar);
  app.patch("/api/notifications/:id/archive", archiveNotification);
  app.delete("/api/notifications/:id", deleteNotification);
  app.patch("/api/notifications/bulk", bulkUpdateNotifications);
  app.get("/api/sensors", getSensors);
  app.get("/api/real-time-data", getRealTimeData);
  app.get("/api/notification-rules", getNotificationRules);
  app.post("/api/notification-rules", createNotificationRule);
  app.put("/api/notification-rules/:id", updateNotificationRule);
  app.delete("/api/notification-rules/:id", deleteNotificationRule);
  app.get("/api/notification-stats", getNotificationStats);
  app.post("/api/send-notification", sendManualNotification);

  // SaaS Management routes
  app.get("/api/saas/metrics", getSaaSMetrics);
  app.get("/api/saas/analytics", getSaaSAnalytics);
  app.get("/api/saas/subscriptions", getSaaSSubscriptions);
  app.get("/api/saas/plans", getSaaSPlans);

  // Subscription Management routes
  app.get("/api/subscription/plans", getSubscriptionPlans);
  app.get("/api/subscription/payment-methods", getPaymentMethods);
  app.get("/api/subscription/promo-codes", getPromoCodes);
  app.post("/api/subscription/plans", createSubscriptionPlan);
  app.put("/api/subscription/plans/:planId", updateSubscriptionPlan);
  app.delete("/api/subscription/plans/:planId", deleteSubscriptionPlan);

  // Adaptive AI routes
  app.get("/api/ai/models", getAIModels);
  app.get("/api/ai/insights", getAIInsights);
  app.get("/api/ai/behavior-data", getUserBehaviorData);
  app.get("/api/ai/recommendations", getPersonalizedRecommendations);
  app.get("/api/ai/feedback", getFeedbackData);
  app.post("/api/ai/feedback", submitFeedback);
  app.put(
    "/api/ai/recommendations/:recommendationId/feedback",
    updateRecommendationFeedback,
  );
  app.post("/api/ai/models/:modelId/train", triggerModelTraining);

  // Smart Marketplace routes
  app.get("/api/marketplace/listings", getMarketplaceListings);
  app.get("/api/marketplace/inquiries", getMarketplaceInquiries);
  app.get("/api/marketplace/analytics", getMarketplaceAnalytics);
  app.get("/api/supply-chain/nodes", getSupplyChainNodes);
  app.post("/api/marketplace/listings", createMarketplaceListing);
  app.post("/api/marketplace/inquiries", createInquiry);

  // Supply Chain Tracking routes
  app.get("/api/supply-chain/tracking", getSupplyChainTracking);
  app.get("/api/supply-chain/metrics", getSupplyChainMetrics);
  app.get("/api/supply-chain/tracking/:batchId", getTrackingByBatch);
  app.put(
    "/api/supply-chain/tracking/:trackingId/steps/:stepId",
    updateTrackingStep,
  );
  app.post(
    "/api/supply-chain/tracking/:trackingId/steps/:stepId/quality-checks",
    addQualityCheck,
  );
  app.put(
    "/api/supply-chain/tracking/:trackingId/alerts/:alertId/resolve",
    resolveAlert,
  );
  app.post(
    "/api/supply-chain/tracking/:trackingId/report",
    generateTrackingReport,
  );

  // Smart Logistics routes
  app.get("/api/logistics/vehicles", getLogisticsVehicles);
  app.get("/api/logistics/orders", getLogisticsOrders);
  app.get("/api/logistics/metrics", getLogisticsMetrics);
  app.get("/api/logistics/route-optimization", getRouteOptimizations);
  app.post("/api/logistics/route-optimization", createRouteOptimization);
  app.put("/api/logistics/vehicles/:vehicleId/location", updateVehicleLocation);
  app.put("/api/logistics/orders/:orderId/status", updateOrderStatus);
  app.post("/api/logistics/assign-order", assignOrderToVehicle);
  app.get(
    "/api/logistics/vehicles/:vehicleId/performance",
    getVehiclePerformance,
  );

  // 🤖 AI SERVICES INTEGRATION ROUTES

  // 🌱 Soil Analysis AI Service
  app.post("/api/ai/soil/analyze", analyzeSoilData);
  app.post("/api/ai/soil/match-crops", matchCropToClimate);
  app.post("/api/ai/soil/diagnose-image", diagnoseSoilFromImage);

  // 🌾 Crop Recommendation AI Service
  app.post("/api/ai/crops/recommend", getSmartCropRecommendations);
  app.post("/api/ai/crops/estimate-profit", estimateCropProfitability);
  app.post("/api/ai/crops/compare", compareCropProfitability);
  app.get("/api/ai/crops/quick-recommend", getQuickCropRecommendation);
  app.get("/api/ai/crops/supported", getSupportedCrops);

  // 📸 Image Diagnosis AI Service
  app.post("/api/ai/images/detect-disease", detectPlantDisease);
  app.post("/api/ai/images/analyze-leaf", analyzeLeafHealth);
  app.post("/api/ai/images/analyze-plant", comprehensivePlantAnalysis);
  app.post("/api/ai/images/quick-health-check", quickPlantHealthCheck);
  app.get("/api/ai/images/supported-diseases", getSupportedDiseases);

  // 📈 Market Forecast AI Service (Future)
  app.post("/api/ai/market/forecast-prices", forecastMarketPrices);
  app.post("/api/ai/market/supply-demand", analyzeSupplyDemand);

  // 🧠 Smart Assistant AI Service (Future)
  app.post("/api/ai/assistant/chat", chatWithAIAssistant);
  app.post("/api/ai/assistant/generate-tasks", generateFarmingTasks);
  app.get("/api/ai/assistant/alerts", getSmartAlerts);

  // AI Services Health Check
  app.get("/api/ai/health", getAIServicesHealth);

  // AI capability discovery + honest provenance for every client AI feature
  app.use("/api/ai", aiCapabilitiesRoutes);

  // Supabase Connection Test
  app.get("/api/test/supabase", requireAdminToken(), testSupabaseConnection);
  // Admin: confirm unconfirmed users (requires x-admin-token header matching ADMIN_API_TOKEN)
  app.post("/api/admin/confirm-unconfirmed", (req, res, next) => {
    return confirmUnconfirmedUsers(req, res, next as any);
  });

  // Admin: set a user's password (requires x-admin-token header matching ADMIN_API_TOKEN)
  app.post("/api/admin/set-password", (req, res, next) => {
    return adminSetPassword(req, res, next as any);
  });

  // Admin: create a confirmed admin user (requires x-admin-token header matching ADMIN_API_TOKEN)
  app.post("/api/admin/create-user", (req, res, next) => {
    return adminCreateUser(req, res, next as any);
  });

  // Auth Test Endpoints
  app.post("/api/test/auth/signup", requireAdminToken(), testAuthSignup);
  app.post("/api/test/auth/signin", requireAdminToken(), testAuthSignin);
  app.get("/api/debug/auth", requireAdminToken(), debugAuth);

  // Inspector User Setup
  app.post("/api/setup-inspector", requireAdminToken(), setupInspectorUser);
  app.post("/api/setup-users", requireAdminToken(), setupMultipleUsers);

  // Admin User Setup
  app.post("/api/setup-admin", requireAdminToken(), setupAdminUser);

  // Auth Helper Endpoints (bypass RLS)
  app.post("/api/auth/create-user-profile", requireAdminToken(), createUserWithProfile);
  app.get("/api/auth/check-user/:userId", requireAdminToken(), checkUserExists);

  // 🎮 GAMIFICATION SYSTEM ROUTES
  // Per-user endpoints resolve identity from the verified JWT (requireAuth) so
  // a caller cannot read or award XP to another user by naming their id.
  app.get("/api/gamification/profile", requireAuth, getUserProfile);
  app.post("/api/gamification/award-xp", requireAuth, awardXP);
  app.get("/api/gamification/achievements", requireAuth, getAvailableAchievements);
  app.get("/api/gamification/activity", requireAuth, getUserActivity);
  // Leaderboard and aggregate stats are intentionally public.
  app.get("/api/gamification/leaderboard", getLeaderboard);
  app.get("/api/gamification/stats", getGamificationStats);

  // 💼 INVESTOR DASHBOARD ROUTES
  app.get("/api/investor/opportunities", getInvestmentOpportunities);
  app.get("/api/investor/profitability", getInvestorProfitabilityAnalysis);
  app.get("/api/investor/insights", getMarketInsights);
  app.get("/api/investor/portfolio", getInvestorPortfolio);
  app.get("/api/investor/dashboard", getInvestorDashboard);
  app.post("/api/investor/invest", createInvestment);

  // 📊 PUBLIC DATA API ROUTES
  app.get("/api/public/market-prices", getMarketPrices);
  app.get("/api/public/production", getProductionData);
  app.get("/api/public/exports", getExportData);
  app.get("/api/public/weather", getWeatherData);
  app.get("/api/public/key-info", getAPIKeyInfo);
  app.get("/api/public/stats", getPublicStats);
  app.post("/api/public/create-key", keyMintRateLimiter(), createAPIKey);

  // 👥 FARMER COLLABORATION ROUTES
  app.get("/api/collaboration/chat-rooms", getChatRooms);
  app.get("/api/collaboration/rooms/:roomId/messages", getRoomMessages);
  app.post("/api/collaboration/messages", sendMessage);
  app.get("/api/collaboration/consultations", getConsultations);
  app.post("/api/collaboration/consultations", createConsultation);
  app.get("/api/collaboration/forum/posts", getForumPosts);
  app.post("/api/collaboration/forum/posts", createForumPost);
  app.get("/api/collaboration/forum/posts/:postId/replies", getPostReplies);
  app.get("/api/collaboration/experts/online", getOnlineExperts);
  app.get("/api/collaboration/stats", getCollaborationStats);

  // 🧩 FARMER SEGMENTATION AI ROUTES
  app.get("/api/segmentation/segments", getFarmerSegments);
  app.get("/api/segmentation/farmer/:farmerId", segmentFarmer);
  app.get("/api/segmentation/all", getAllFarmersSegmentation);
  app.get("/api/segmentation/analytics", getSegmentationAnalytics);
  app.put("/api/segmentation/farmer/:farmerId", updateFarmerProfile);

  // Any unmatched /api/* route must answer a JSON 404. Without this the dev
  // Vite server falls through to the SPA and answers 200 text/html, so a
  // frontend calling a route that no longer exists looks like a success and
  // the mistake goes unnoticed.
  app.use("/api", (req: express.Request, res: express.Response) => {
    res.status(404).json({
      error: "API endpoint not found",
      method: req.method,
      path: `/api${req.path}`,
    });
  });

  // JSON body parsing errors (oversized / malformed) must not crash the server
  app.use(jsonBodyErrorHandler());

  // Final error handler: never leak stack traces or internal details
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    // Upload validation errors are client mistakes, not server faults.
    if (handleUploadError(err, res)) return;
    console.error("Unhandled API error:", err?.message || err);
    // Only messages explicitly marked safe are returned; everything else stays
    // opaque so internal details never leak.
    const status = typeof err?.status === "number" ? err.status : 500;
    const message =
      err?.expose === true && typeof err?.message === "string"
        ? err.message
        : "Internal server error";
    res.status(status).json({ error: message });
  });

  return app;
}
