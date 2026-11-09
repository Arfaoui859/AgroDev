/**
 * Adaptive AI analytics are unavailable until real telemetry, model registry,
 * feedback persistence and a tracked training pipeline are connected.
 * Static model catalogues, generated insights, fabricated user behaviour and
 * in-memory feedback from the former demo implementation have been removed.
 */
import type { RequestHandler } from "express";

const unavailable: RequestHandler = (_req, res) => {
  res.set("X-Data-Provenance", "unavailable");
  res.set("X-Is-Real-Data", "false");
  return res.status(503).json({
    success: false,
    code: "ADAPTIVE_AI_DATA_NOT_CONNECTED",
    message: "This capability requires persisted user telemetry and a verified model registry.",
    dataAvailable: false,
    isRealData: false,
    productionReady: false,
  });
};

export const getAIModels = unavailable;
export const getAIInsights = unavailable;
export const getUserBehaviorData = unavailable;
export const getPersonalizedRecommendations = unavailable;
export const getFeedbackData = unavailable;
export const submitFeedback = unavailable;
export const updateRecommendationFeedback = unavailable;

export const triggerModelTraining: RequestHandler = (req, res) => {
  return res.status(501).json({
    success: false,
    code: "MODEL_TRAINING_PIPELINE_NOT_CONFIGURED",
    dataSource: "unavailable",
    isRealData: false,
    productionReady: false,
    modelId: req.params.modelId,
    message: "No tracked model-training pipeline is configured. No training job was started.",
  });
};
