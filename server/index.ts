import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
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
import { generateCropRecommendations } from "./routes/ai-recommender";
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
} from "./routes/financial-management";
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
  getProfitabilityAnalysis,
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
import { confirmUnconfirmedUsers } from "./routes/confirm-unconfirmed";
import { testAuthSignup, testAuthSignin } from "./routes/test-auth";
import { setupDemoUsers, getDemoUsers, deleteDemoUsers } from "./routes/setup-demo-users";
import { createUserWithProfile, checkUserExists } from "./routes/auth-helper";
import { debugAuth } from "./routes/debug-auth";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

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
  app.post("/api/ai/recommend", generateCropRecommendations);

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

  // Smart Crop Suggestions routes
  app.use("/api/smart-crop-suggestions", smartCropSuggestionsRoutes);

  // Smart Crop Alerts routes
  app.use("/api", smartCropAlertsRoutes);

  // Disease Treatment routes
  app.use("/api/disease-treatment", diseaseTreatmentRoutes);

  // Smart Irrigation routes
  app.use("/api/smart-irrigation", smartIrrigationRoutes);

  // Irrigation Optimization routes
  app.use("/api/irrigation-optimization", irrigationOptimizationRouter);

  // Pest Control routes
  app.use("/api/pest-control", pestControlRouter);

  // Weather & Yield Intelligence routes
  app.use("/api/weather-yield-intelligence", weatherYieldIntelligenceRouter);

  // Financial Management routes
  app.post("/api/expenses", createExpense);
  app.get("/api/expenses", getExpenses);
  app.post("/api/revenues", createRevenue);
  app.get("/api/revenues", getRevenues);
  app.get("/api/profitability-analysis", getProfitabilityAnalysis);
  app.get("/api/financial-summary", getFinancialSummary);
  app.post("/api/budget-plans", createBudgetPlan);
  app.get("/api/budget-plans", getBudgetPlans);
  app.put("/api/budget-plans/:id", updateBudgetPlan);

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

  // Admin Panel routes
  app.get("/api/admin/overview", getAdminDashboard);
  app.get("/api/admin/users", getAdminUsers);
  app.get("/api/admin/system-metrics", getAdminSystemMetrics);
  app.get("/api/admin/usage-analytics", getAdminUsageAnalytics);
  app.get("/api/admin/security-events", getAdminSecurityEvents);
  app.get("/api/admin/activity-logs", getAdminActivityLogs);
  app.get("/api/admin/subscriptions", getAdminSubscriptions);

  // Government Dashboard routes
  app.use("/api/government-dashboard", governmentDashboardRoutes);

  // Field Management routes
  app.get("/api/farms", getFarms);
  app.get("/api/farms/:farmId", getFarmById);
  app.get("/api/fields", getFields);
  app.get("/api/fields/:fieldId", getFieldById);
  app.post("/api/fields", createField);
  app.put("/api/fields/:fieldId", updateField);
  app.delete("/api/fields/:fieldId", deleteField);
  app.get("/api/crop-history", getCropHistory);
  app.get("/api/field-alerts", getFieldAlerts);
  app.get("/api/activity-logs", getActivityLogs);
  app.get("/api/fields/:fieldId/performance", getFieldPerformance);
  app.post("/api/ai-recommendations", generateAIRecommendations);

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

  // Supabase Connection Test
  app.get("/api/test/supabase", testSupabaseConnection);
  // Admin: confirm unconfirmed users (requires x-admin-token header with service role key)
  app.post("/api/admin/confirm-unconfirmed", (req, res, next) => {
    return confirmUnconfirmedUsers(req, res, next as any);
  });

  // Admin: set a user's password (requires x-admin-token header with service role key)
  app.post('/api/admin/set-password', (req, res, next) => {
    return (require('./routes/admin-set-password') as any).adminSetPassword(req, res, next);
  });

  // Auth Test Endpoints
  app.post("/api/test/auth/signup", testAuthSignup);
  app.post("/api/test/auth/signin", testAuthSignin);
  app.get("/api/debug/auth", debugAuth);

  // Demo User Setup
  app.post("/api/setup-demo-users", setupDemoUsers);
  app.get("/api/demo-users", getDemoUsers);
  app.delete("/api/setup-demo-users", deleteDemoUsers);

  // Test endpoint for development
  app.get("/api/ping", (req, res) => {
    res.json({
      message: "Server is running",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
    });
  });

  // Auth Helper Endpoints (bypass RLS)
  app.post("/api/auth/create-user-profile", createUserWithProfile);
  app.get("/api/auth/check-user/:userId", checkUserExists);

  // 🎮 GAMIFICATION SYSTEM ROUTES
  app.get("/api/gamification/profile", getUserProfile);
  app.post("/api/gamification/award-xp", awardXP);
  app.get("/api/gamification/leaderboard", getLeaderboard);
  app.get("/api/gamification/achievements", getAvailableAchievements);
  app.get("/api/gamification/activity", getUserActivity);
  app.get("/api/gamification/stats", getGamificationStats);

  // 💼 INVESTOR DASHBOARD ROUTES
  app.get("/api/investor/opportunities", getInvestmentOpportunities);
  app.get("/api/investor/profitability", getProfitabilityAnalysis);
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
  app.post("/api/public/create-key", createAPIKey);

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

  return app;
}
