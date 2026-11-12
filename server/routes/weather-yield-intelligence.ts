/**
 * Weather & yield intelligence API.
 *
 * This router returned entirely fabricated results — a hardcoded Mediterranean
 * climate zone, `Math.random()` yields, canned risks — while the real
 * `weather_yield_intelligence` microservice (seasonal planner + yield predictor
 * on port 8006) was running unused. Every endpoint now forwards to that service
 * and tags the response with the provenance it declares, so its synthetic
 * training data is never presented as field-validated prediction.
 *
 * The legacy `{ success, data, message }` envelope is preserved.
 */

import { Router } from "express";
import {
  callMicroservice,
  respondServiceError,
  serviceBaseUrl,
} from "../services/providers/microserviceProxy";
import { localServiceFallback } from "./ai-services-gateway";

const router = Router();

// The weather/yield service is addressed by two names across the deployment
// manifests: SMART_MARKETPLACE_URL (docker-compose, render.yaml) and the
// descriptive WEATHER_YIELD_INTELLIGENCE_URL. Accept either.
const WEATHER_YIELD_SERVICE = () =>
  serviceBaseUrl(
    process.env.WEATHER_YIELD_INTELLIGENCE_URL ??
      process.env.SMART_MARKETPLACE_URL,
    localServiceFallback(8006),
  );

const CAPABILITY = "weather-yield-planner";

function sendLegacy(
  res: Parameters<typeof respondServiceError>[0],
  result: { data: unknown; modelSource: string | null; heuristic: boolean },
  message: string,
) {
  res.json({
    success: true,
    data: result.data,
    message,
    dataSource: result.heuristic ? "heuristic" : "microservice",
    isRealData: !result.heuristic,
    modelSource: result.modelSource,
  });
}

// Weather-based crop planning
router.post("/weather-plan", async (req, res) => {
  try {
    const result = await callMicroservice({
      baseUrl: WEATHER_YIELD_SERVICE(),
      path: "/create-weather-plan",
      capability: CAPABILITY,
      body: req.body ?? {},
    });
    sendLegacy(res, result, "تم إنشاء الخطة المناخية بنجاح");
  } catch (error) {
    respondServiceError(res, CAPABILITY, error);
  }
});

// Crop yield prediction
router.post("/predict-yield", async (req, res) => {
  try {
    const result = await callMicroservice({
      baseUrl: WEATHER_YIELD_SERVICE(),
      path: "/predict-crop-yield",
      capability: "yield-predictor",
      body: req.body ?? {},
    });
    sendLegacy(res, result, "تم التنبؤ بالمردودية بنجاح");
  } catch (error) {
    respondServiceError(res, "yield-predictor", error);
  }
});

// Combined weather + yield analysis
router.post("/comprehensive-analysis", async (req, res) => {
  try {
    const result = await callMicroservice({
      baseUrl: WEATHER_YIELD_SERVICE(),
      path: "/combined-analysis",
      capability: CAPABILITY,
      body: req.body ?? {},
    });
    sendLegacy(res, result, "تم إنجاز التحليل الشامل بنجاح");
  } catch (error) {
    respondServiceError(res, CAPABILITY, error);
  }
});

// Climate zone reference data
router.get("/climate-zones", async (_req, res) => {
  try {
    const result = await callMicroservice({
      baseUrl: WEATHER_YIELD_SERVICE(),
      path: "/climate-zones",
      capability: CAPABILITY,
      method: "GET",
    });
    sendLegacy(res, result, "تم جلب معلومات المناطق المناخية");
  } catch (error) {
    respondServiceError(res, CAPABILITY, error);
  }
});

// Crop yield reference database
router.get("/yield-database", async (_req, res) => {
  try {
    const result = await callMicroservice({
      baseUrl: WEATHER_YIELD_SERVICE(),
      path: "/crop-yield-database",
      capability: "yield-predictor",
      method: "GET",
    });
    sendLegacy(res, result, "تم جلب قاعدة بيانات العوائد");
  } catch (error) {
    respondServiceError(res, "yield-predictor", error);
  }
});

// Climate suitability for a single crop. The microservice takes `crop_type`
// as a query parameter and the rest as a JSON body.
router.post("/assess-climate-suitability", async (req, res) => {
  try {
    const {
      crop_type = "wheat",
      location = { latitude: 35.0, longitude: 10.0 },
      current_weather = { temperature: 25.0, rainfall: 400.0 },
    } = req.body ?? {};

    const params = new URLSearchParams({ crop_type: String(crop_type) });
    const result = await callMicroservice({
      baseUrl: WEATHER_YIELD_SERVICE(),
      path: `/assess-climate-suitability?${params.toString()}`,
      capability: CAPABILITY,
      body: { location, current_weather },
    });
    sendLegacy(res, result, "تم تقييم الملاءمة المناخية");
  } catch (error) {
    respondServiceError(res, CAPABILITY, error);
  }
});

// Optimal planting schedule for a set of crops
router.post("/optimize-planting", async (req, res) => {
  try {
    const {
      crop_types = ["wheat", "tomato"],
      location = { latitude: 35.0, longitude: 10.0 },
      planning_months = 12,
    } = req.body ?? {};

    const params = new URLSearchParams();
    for (const crop of crop_types) params.append("crop_types", String(crop));
    params.append("planning_months", String(planning_months));

    const result = await callMicroservice({
      baseUrl: WEATHER_YIELD_SERVICE(),
      path: `/optimize-planting-schedule?${params.toString()}`,
      capability: CAPABILITY,
      body: { location },
    });
    sendLegacy(res, result, "تم تحسين جدولة الزراعة");
  } catch (error) {
    respondServiceError(res, CAPABILITY, error);
  }
});

export { router as weatherYieldIntelligenceRouter };
