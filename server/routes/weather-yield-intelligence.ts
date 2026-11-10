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
import { getWeatherFromOpenMeteo, getHistoricalWeatherFromOpenMeteo } from "../services/providers/weatherProvider";
import { ProviderError } from "../services/providers/http";
import {
  callMicroservice,
  respondServiceError,
  serviceBaseUrl,
} from "../services/providers/microserviceProxy";

const router = Router();

// The weather/yield service is addressed by two names across the deployment
// manifests: SMART_MARKETPLACE_URL (docker-compose, render.yaml) and the
// descriptive WEATHER_YIELD_INTELLIGENCE_URL. Accept either.
const WEATHER_YIELD_SERVICE = () =>
  serviceBaseUrl(
    process.env.WEATHER_YIELD_INTELLIGENCE_URL ??
      process.env.SMART_MARKETPLACE_URL,
    "http://localhost:8006",
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

// Build an input bundle from licensed, real forecast + historical weather data.
router.get("/weather-context", async (req, res) => {
  const latitude = Number(req.query.lat);
  const longitude = Number(req.query.lon);
  if (
    !Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
    !Number.isFinite(longitude) || longitude < -180 || longitude > 180
  ) {
    return res.status(400).json({ success: false, code: "INVALID_COORDINATES", error: "Valid latitude and longitude are required." });
  }
  try {
    const [current, historical] = await Promise.all([
      getWeatherFromOpenMeteo({ lat: latitude, lon: longitude }),
      getHistoricalWeatherFromOpenMeteo(latitude, longitude, 12),
    ]);
    const months = historical.monthly;
    if (!months.length || current.location.elevation === undefined) {
      return res.status(503).json({ success: false, code: "WEATHER_CONTEXT_INCOMPLETE", error: "The provider did not return enough verified weather history for this location.", dataAvailable: false });
    }
    const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
    const annualRainfall = months.reduce((sum, month) => sum + month.totalRainfall, 0);
    const annualTemperature = average(months.map((month) => month.avgTemp));
    const annualHumidity = average(months.map((month) => month.avgHumidity));
    const annualWind = average(months.map((month) => month.avgWindSpeed ?? 0));
    const annualSolar = average(months.map((month) => month.avgSolarRadiation ?? 0)) / 3.6;
    const annualVariation = Math.max(...months.map((month) => month.maxTemp ?? month.avgTemp)) -
      Math.min(...months.map((month) => month.minTemp ?? month.avgTemp));
    const recentTemperatureVariation = historical.recentTemperatureVariation || annualVariation;
    const recentRainfall = historical.recentRainfall;
    const currentWeather = {
      temperature: current.current.temperature,
      humidity: current.current.humidity,
      rainfall: current.current.rainfall ?? 0,
      wind_speed: current.current.windSpeed,
      solar_radiation: current.forecast.daily[0]?.solarRadiation ?? current.current.solarRadiation ?? 0,
      recent_rainfall: recentRainfall,
      annual_rainfall: annualRainfall,
      temperature_variation: recentTemperatureVariation,
    };
    const historicalWeather = {
      temperature: annualTemperature,
      humidity: annualHumidity,
      rainfall: annualRainfall,
      wind_speed: annualWind,
      solar_radiation: annualSolar,
      recent_rainfall: recentRainfall,
      annual_rainfall: annualRainfall,
      temperature_variation: annualVariation,
    };
    const values = [...Object.values(currentWeather), ...Object.values(historicalWeather)];
    if (values.some((value) => !Number.isFinite(value))) {
      return res.status(503).json({ success: false, code: "WEATHER_CONTEXT_INCOMPLETE", error: "The weather provider returned incomplete numeric data.", dataAvailable: false });
    }
    return res.json({
      success: true,
      data: {
        location: { latitude, longitude, elevation: current.location.elevation, region: typeof req.query.region === "string" ? req.query.region : undefined },
        current_conditions: currentWeather,
        historical_weather: historicalWeather,
        weather_data: currentWeather,
      },
      source: { provider: "Open-Meteo customer API + historical archive", isRealData: true },
    });
  } catch (error) {
    const providerError = error instanceof ProviderError ? error : null;
    const status = providerError?.kind === "unconfigured" ? 503 : providerError ? 502 : 500;
    console.error("[weather-yield-context] provider failure:", error instanceof Error ? error.message : error);
    return res.status(status).json({
      success: false,
      code: providerError?.kind === "unconfigured" ? "WEATHER_PROVIDER_NOT_CONFIGURED" : "WEATHER_DATA_UNAVAILABLE",
      error: providerError?.message || "Unable to load verified weather context.",
      provider: providerError?.provider || "Open-Meteo",
      dataAvailable: false,
    });
  }
});

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
    const { crop_type, location, current_weather } = req.body ?? {};
    if (
      typeof crop_type !== "string" || !crop_type.trim() ||
      !Number.isFinite(Number(location?.latitude)) ||
      !Number.isFinite(Number(location?.longitude)) ||
      !Number.isFinite(Number(current_weather?.temperature)) ||
      !Number.isFinite(Number(current_weather?.rainfall))
    ) {
      return res.status(400).json({
        success: false,
        code: "MISSING_MEASURED_INPUTS",
        error: "crop_type, field coordinates, and current measured weather are required.",
      });
    }

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
      crop_types,
      location,
      planning_months = 12,
    } = req.body ?? {};
    if (
      !Array.isArray(crop_types) || crop_types.length === 0 ||
      !Number.isFinite(Number(location?.latitude)) ||
      !Number.isFinite(Number(location?.longitude))
    ) {
      return res.status(400).json({
        success: false,
        code: "MISSING_MEASURED_INPUTS",
        error: "crop_types and valid field coordinates are required.",
      });
    }

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
