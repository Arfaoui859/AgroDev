import { firstEnv } from "../lib/env";
import { Request, Response } from "express";
import crypto from "crypto";
import axios, { AxiosError } from "axios";
import FormData from "form-data";
import multer from "multer";
import { uploadError, requireRealImages } from "../middleware/upload";
import {
  analyzeSoilForUI,
  recommendCropsForUI,
  CROP_REFERENCE,
} from "../services/ai/cropAdvisor";
import { analyzeSoil, recommendCrops } from "../services/ai/knowledgeEngine";
import {
  answerAgriculturalQuestion,
  detectLanguage,
} from "../services/ai/farmAdvisor";
import {
  diagnosePlantImage,
  type VisionDiagnosis,
} from "../services/providers/visionProvider";
import { isLLMConfigured } from "../services/providers/llmProvider";
import { getLLMInfo } from "../services/providers/llmProvider";
import { probeService } from "../services/providers/serviceProbe";
import { MAX_USER_MESSAGE_CHARS } from "../lib/promptSafety";

/**
 * Model-source markers that mean "this service is not running a model trained
 * on real field data". Shared with the health view so a reachable-but-synthetic
 * service is labelled honestly instead of shown as production inference.
 */
const HEURISTIC_MODEL_SOURCE_RE =
  /heuristic|demo|simulat|synthetic|mock|random|placeholder|dummy/i;

/**
 * Normalize a service base URL. Render's `fromService` `hostport` property yields
 * "host:port" with no scheme, and Docker/Render sometimes supply a trailing slash.
 * Axios needs an absolute URL, so we prepend http:// when the scheme is missing.
 */
export function normalizeServiceUrl(raw: string | undefined, fallback: string): string {
  const value = (raw && raw.trim()) || fallback;
  const withScheme = /^https?:\/\//i.test(value) ? value : `http://${value}`;
  return withScheme.replace(/\/+$/, "");
}

/**
 * AI service base URLs, read from the environment on every access.
 *
 * Reading lazily (rather than freezing the values into a module constant at
 * import time) means a URL can be set after this module loads, which matters
 * when the gateway is imported before the environment is finalised, e.g. in
 * tests that point the gateway at an ephemeral service port.
 */
const AI_SERVICES = {
  get SOIL_ANALYSIS() {
    return normalizeServiceUrl(process.env.SOIL_ANALYSIS_URL, "http://localhost:8001");
  },
  get CROP_RECOMMENDATION() {
    return normalizeServiceUrl(process.env.CROP_RECOMMENDATION_URL, "http://localhost:8002");
  },
  get IMAGE_DIAGNOSIS() {
    return normalizeServiceUrl(process.env.IMAGE_DIAGNOSIS_URL, "http://localhost:8003");
  },
  get MARKET_FORECAST() {
    return normalizeServiceUrl(
      firstEnv("MARKET_FORECAST_URL", "MARKET_PREDICTION_URL"),
      "http://localhost:8004",
    );
  },
  get SMART_ASSISTANT() {
    return normalizeServiceUrl(
      firstEnv("SMART_ASSISTANT_URL", "INTELLIGENT_AGENT_URL"),
      "http://localhost:8005",
    );
  },
  get SMART_MARKETPLACE() {
    return normalizeServiceUrl(
      process.env.WEATHER_YIELD_INTELLIGENCE_URL ??
        process.env.SMART_MARKETPLACE_URL,
      "http://localhost:8006",
    );
  },
  get PEST_CONTROL() {
    return normalizeServiceUrl(process.env.PEST_CONTROL_URL, "http://localhost:8007");
  },
  get IRRIGATION_OPTIMIZATION() {
    return normalizeServiceUrl(
      process.env.IRRIGATION_OPTIMIZATION_URL,
      "http://localhost:8008",
    );
  },
};

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(uploadError({ message: "Only image files are allowed (JPEG, PNG, WebP)" }));
    }
  },
});

// Error handler for AI service calls
const handleAIServiceError = (
  error: AxiosError,
  serviceName: string,
  res: Response,
) => {
  console.error(`Error calling ${serviceName}:`, error.message);

  if (error.response) {
    res.status(error.response.status).json({
      error: `${serviceName} service error`,
      message: error.response.data || error.message,
      status: error.response.status,
    });
  } else if (error.request) {
    res.status(503).json({
      error: `${serviceName} service unavailable`,
      message: "Service is not responding",
      status: 503,
    });
  } else {
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
      status: 500,
    });
  }
};

// Generic AI service call function
const callAIService = async (
  serviceUrl: string,
  endpoint: string,
  method: "GET" | "POST" = "POST",
  data?: any,
  headers?: any,
) => {
  const url = `${serviceUrl}${endpoint}`;
  const config = {
    method,
    url,
    timeout: 30000, // 30 seconds timeout
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    ...(data && { data }),
  };

  return axios(config);
};

/**
 * Forward a self-hosted AI microservice response to the client while tagging
 * its provenance. The bundled microservices train on synthetic/demo data, so
 * the result must be labelled honestly instead of being presented as a
 * field-validated prediction.
 */
const respondFromMicroservice = async (
  res: Response,
  data: any,
  serviceUrl?: string,
) => {
  const probe = serviceUrl
    ? await probeService(serviceUrl)
    : { reachable: true, modelSource: null as string | null, heuristic: false };
  // Never present synthetic/heuristic output as model inference.
  const dataSource = probe.heuristic ? "heuristic" : "microservice";
  const provenance = {
    dataSource,
    isRealData: !probe.heuristic,
    modelSource: probe.modelSource,
  };
  const payload =
    data && typeof data === "object" && !Array.isArray(data)
      ? { ...provenance, ...data }
      : { ...provenance, result: data };
  res.json(payload);
};


/**
 * Image Diagnosis uses request-level provenance returned by the actual
 * inference endpoint. Never infer it from /health.
 */
const respondFromImageMicroservice = (
  res: Response,
  data: any,
  allowVisionModel = false,
) => {
  const payload =
    data && typeof data === "object" && !Array.isArray(data)
      ? { ...data }
      : { result: data };

  const rawDataSource = payload.data_source ?? payload.dataSource;
  const rawIsRealData = payload.is_real_data ?? payload.isRealData;
  const rawModelSource = payload.model_source ?? payload.modelSource;

  const validVisionSource =
    rawDataSource === "vision-model" || rawDataSource === "llm";

  const isRealData =
    allowVisionModel &&
    rawIsRealData === true &&
    validVisionSource &&
    typeof rawModelSource === "string" &&
    rawModelSource.trim().length > 0;

  const finalDataSource = isRealData ? rawDataSource : "heuristic";
  const finalModelSource = isRealData ? rawModelSource : "heuristic-demo";

  // Keep snake_case and camelCase identical for every frontend consumer.
  res.json({
    ...payload,
    data_source: finalDataSource,
    dataSource: finalDataSource,
    is_real_data: isRealData,
    isRealData,
    model_source: finalModelSource,
    modelSource: finalModelSource,
  });
};

// 🌱 SOIL ANALYSIS ENDPOINTS
export const analyzeSoilData = async (req: Request, res: Response) => {
  const sensorData = req.body?.sensor_data ?? req.body ?? {};
  try {
    const response = await callAIService(
      AI_SERVICES.SOIL_ANALYSIS,
      "/analyze-soil",
      "POST",
      {
        sensor_data: sensorData,
        location: normaliseLocation(req.body?.location),
        farm_id: req.body?.farm_id,
        // Forwarded so a configured LLM produces the advisory in the farmer's
        // language and can tailor it to the crop.
        language: req.body?.language,
        crop: req.body?.crop ?? req.body?.crop_type,
      },
    );
    await respondFromMicroservice(res, response.data, AI_SERVICES.SOIL_ANALYSIS);
  } catch (error) {
    // Microservice unavailable: fall back to the transparent rule-based engine
    // rather than fabricating an ML result.
    console.warn(
      "Soil microservice unavailable, using rule-based analysis:",
      (error as AxiosError).message,
    );
    try {
      const fallback = analyzeSoilForUI(normaliseSoilInput(sensorData));
      res.json(fallback);
    } catch (fallbackError) {
      handleAIServiceError(error as AxiosError, "Soil Analysis", res);
    }
  }
};

export const matchCropToClimate = async (req: Request, res: Response) => {
  try {
    const response = await callAIService(
      AI_SERVICES.SOIL_ANALYSIS,
      "/match-crops",
      "POST",
      req.body,
    );
    await respondFromMicroservice(res, response.data, AI_SERVICES.SOIL_ANALYSIS);
  } catch (error) {
    const climate = req.body?.climate_data ?? {};
    const soil = req.body?.soil_data ?? {};
    const fallback = recommendCrops({
      ph: soil.ph,
      temperature: climate.temperature,
      rainfall: climate.rainfall,
      salinity: soil.salinity,
      season: climate.season,
    });
    res.json({
      dataSource: "rule-based",
      suitable_crops: fallback.recommendations.map((c, i) => ({
        rank: i + 1,
        crop: c.crop,
        name_ar: c.nameAr,
        suitability_score: c.suitabilityScore,
        reasons: c.reasonsAr,
      })),
      best_crop: fallback.recommendations[0] ?? null,
      disclaimer: fallback.disclaimer,
    });
  }
};

export const diagnoseSoilFromImage = [
  upload.single("file"),
  requireRealImages(),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const formData = new FormData();
      formData.append("file", req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });

      const response = await axios.post(
        `${AI_SERVICES.SOIL_ANALYSIS}/diagnose-image`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          timeout: 30000,
        },
      );

      await respondFromMicroservice(res, response.data, AI_SERVICES.SOIL_ANALYSIS);
    } catch (error) {
      handleAIServiceError(error as AxiosError, "Soil Image Diagnosis", res);
    }
  },
];

// 🌾 CROP RECOMMENDATION ENDPOINTS
export const getSmartCropRecommendations = async (
  req: Request,
  res: Response,
) => {
  const body = (req.body ?? {}) as Record<string, any>;

  // Accept the known frontend payload variants without inventing measurements.
  const temperature = toNumber(
    body.temperature ?? body.climate_data?.temperature,
  );
  const rainfall = toNumber(
    body.annual_rainfall ??
      body.rainfall ??
      body.climate_data?.annual_rainfall ??
      body.climate_data?.rainfall,
  );
  const soilPh = toNumber(
    body.soil_ph ?? body.ph ?? body.soil_data?.ph,
  );

  // These are mandatory in the Python service's Pydantic request model.
  const requiredErrors: string[] = [];

  if (temperature === undefined || temperature < -30 || temperature > 60)
    requiredErrors.push("temperature must be between -30 and 60");

  if (rainfall === undefined || rainfall < 0 || rainfall > 10000)
    requiredErrors.push("annual_rainfall must be between 0 and 10000");

  if (soilPh === undefined || soilPh < 0 || soilPh > 14)
    requiredErrors.push("soil_ph must be between 0 and 14");

  // Only forward optional values that satisfy the Python API constraints.
  const optionalNumber = (
    value: unknown,
    min: number,
    max = Number.POSITIVE_INFINITY,
  ): number | undefined => {
    const n = toNumber(value);
    return n !== undefined && n >= min && n <= max ? n : undefined;
  };

  const experience = optionalNumber(
    body.farmer_experience_years,
    0,
  );

  const requestPayload = {
    temperature,
    annual_rainfall: rainfall,
    soil_ph: soilPh,
    soil_quality_score: optionalNumber(body.soil_quality_score, 0, 1),
    water_availability: optionalNumber(body.water_availability, 0, 1),
    target_market_price: optionalNumber(body.target_market_price, 0),
    farmer_experience_years:
      experience !== undefined && Number.isInteger(experience)
        ? experience
        : undefined,
    available_capital: optionalNumber(body.available_capital, 0),
    farm_size: optionalNumber(body.farm_size ?? body.area_hectares, 0.000001),
    risk_tolerance: optionalNumber(body.risk_tolerance, 0, 1),
    location: normaliseLocation(body.location),
    language: ["ar", "ar-tn", "fr", "en"].includes(body.language)
      ? body.language
      : undefined,
  };

  // Missing or invalid required measurements: use the honest local fallback.
  // Never send a request that is guaranteed to fail FastAPI validation.
  if (requiredErrors.length > 0) {
    console.warn(
      "Crop microservice skipped: invalid or missing required measurements:",
      requiredErrors,
    );
    return res.json(recommendCropsForUI(normaliseCropInput(body)));
  }

  try {
    const response = await callAIService(
      AI_SERVICES.CROP_RECOMMENDATION,
      "/recommend-crops",
      "POST",
      requestPayload,
    );

    return await respondFromMicroservice(
      res,
      response.data,
      AI_SERVICES.CROP_RECOMMENDATION,
    );
  } catch (error) {
    console.warn(
      "Crop microservice unavailable, using rule-based recommendations:",
      (error as AxiosError).message,
    );
    return res.json(recommendCropsForUI(normaliseCropInput(body)));
  }
};

export const getQuickCropRecommendation = async (
  req: Request,
  res: Response,
) => {
  const temperature = parseFloat(req.query.temperature as string);
  const rainfall = parseFloat(req.query.rainfall as string);
  const soil_ph = parseFloat(req.query.soil_ph as string);
  const farm_size = parseFloat(req.query.farm_size as string) || 2.0;

  try {
    const qs = new URLSearchParams({
      temperature: String(temperature),
      rainfall: String(rainfall),
      soil_ph: String(soil_ph),
      farm_size: String(farm_size),
    });
    const response = await callAIService(
      AI_SERVICES.CROP_RECOMMENDATION,
      `/quick-recommendation?${qs.toString()}`,
      "POST",
    );
    await respondFromMicroservice(res, response.data, AI_SERVICES.CROP_RECOMMENDATION);
  } catch (error) {
    const fallback = recommendCropsForUI({
      ph: soil_ph,
      temperature,
      rainfall,
      area_hectares: farm_size,
    });
    const top = fallback.recommendations.slice(0, 3);
    res.json({
      dataSource: "rule-based",
      quick_recommendations: top.map((c) => ({
        crop_name: c.crop,
        crop_name_ar: c.name_ar,
        suitability_score: c.suitability_score,
        expected_profit_per_hectare: c.profit_analysis.net_profit,
        risk_level: c.risk_assessment.overall_risk_level,
        growing_season: c.growing_season,
      })),
      best_crop: top[0]
        ? {
            crop_name: top[0].crop,
            crop_name_ar: top[0].name_ar,
            suitability_score: top[0].suitability_score,
          }
        : null,
      disclaimer: fallback.disclaimer,
    });
  }
};

export const estimateCropProfitability = async (
  req: Request,
  res: Response,
) => {
  try {
    const response = await callAIService(
      AI_SERVICES.CROP_RECOMMENDATION,
      "/estimate-profit",
      "POST",
      req.body,
    );
    await respondFromMicroservice(res, response.data, AI_SERVICES.CROP_RECOMMENDATION);
  } catch (error) {
    handleAIServiceError(error as AxiosError, "Profit Estimator", res);
  }
};

export const compareCropProfitability = async (req: Request, res: Response) => {
  const b = req.body ?? {};
  // The service expects {crops_data: ProfitEstimationRequest[]}; forwarding the
  // raw body made Pydantic answer 422 whenever the caller sent a bare list.
  const rawList = Array.isArray(b.crops_data)
    ? b.crops_data
    : Array.isArray(b.crops)
      ? b.crops
      : null;
  if (!rawList || rawList.length === 0) {
    return res.status(400).json({
      error: "crops_data is required",
      message: "Pass { crops_data: [{ crop_name, farm_size, ... }] } to compare crops.",
    });
  }
  const crops_data = rawList
    .map((c: any) => ({
      ...c,
      crop_name: c?.crop_name ?? c?.crop ?? c?.name,
      farm_size: toNumber(c?.farm_size ?? c?.field_area ?? b.farm_size),
    }))
    .filter((c: any) => c.crop_name && c.farm_size !== undefined);

  if (crops_data.length === 0) {
    return res.status(400).json({
      error: "Each crop needs crop_name and farm_size",
      message: "Provide crop_name and farm_size for at least one crop.",
    });
  }
  try {
    const response = await callAIService(
      AI_SERVICES.CROP_RECOMMENDATION,
      "/compare-crops",
      "POST",
      { crops_data },
    );
    await respondFromMicroservice(res, response.data, AI_SERVICES.CROP_RECOMMENDATION);
  } catch (error) {
    handleAIServiceError(error as AxiosError, "Crop Comparison", res);
  }
};

// 📸 IMAGE DIAGNOSIS ENDPOINTS

/**
 * Map a real vision-model diagnosis to the payload shape the client already
 * consumes (disease_detection.primary_disease + treatment_plan + severity).
 */
function visionDiagnosisToPayload(
  diagnosis: VisionDiagnosis,
  modelSource: string,
  provider: string,
) {
  return {
    dataSource: "llm",
    isRealData: true,
    modelSource,
    provider,
    disease_detection: {
      primary_disease: {
        disease: diagnosis.diseaseId ?? diagnosis.disease,
        disease_name_ar: diagnosis.disease,
        description: diagnosis.description,
        probability: diagnosis.confidence,
        severity_level: diagnosis.severity ?? "medium",
        symptoms: diagnosis.symptoms,
        causes: diagnosis.causes,
      },
      top_predictions: [],
    },
    severity_assessment: {
      severity_level: diagnosis.severity ?? "medium",
    },
    treatment_plan: {
      immediate_treatment: diagnosis.treatment,
      general_care: [],
      prevention_measures: diagnosis.prevention,
      follow_up_schedule: [],
    },
  };
}

export const detectPlantDisease = [
  upload.single("file"),
  requireRealImages(),
  async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    // Prefer a real multimodal vision model when one is configured.
    if (isLLMConfigured()) {
      try {
        const result = await diagnosePlantImage({
          image: { buffer: req.file.buffer, mimetype: req.file.mimetype },
          cropType: req.body.plant_type,
          plantPart: req.body.plant_part,
          symptoms: req.body.symptoms,
        });
        return res.json(
          visionDiagnosisToPayload(result.diagnosis, result.modelSource, result.provider),
        );
      } catch (error) {
        console.error("Vision model error:", (error as Error).message);
        // If a microservice is also configured, try it; otherwise report the
        // failure instead of fabricating a diagnosis.
        if (!process.env.IMAGE_DIAGNOSIS_URL) {
          return res.status(502).json({
            error: "Vision analysis failed",
            message: "تعذّر تحليل الصورة بواسطة نموذج الرؤية. حاول مرة أخرى.",
            code: "VISION_FAILED",
            dataAvailable: false,
          });
        }
      }
    }

    try {
      const formData = new FormData();
      formData.append("file", req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });

      if (req.body.plant_type) {
        formData.append("plant_type", req.body.plant_type);
      }

      const response = await axios.post(
        `${AI_SERVICES.IMAGE_DIAGNOSIS}/detect-disease`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          timeout: 30000,
        },
      );

      await respondFromImageMicroservice(res, response.data, true);
    } catch (error) {
      handleAIServiceError(error as AxiosError, "Plant Disease Detection", res);
    }
  },
];

export const analyzeLeafHealth = [
  upload.single("file"),
  requireRealImages(),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const formData = new FormData();
      formData.append("file", req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });

      if (req.body.plant_type) {
        formData.append("plant_type", req.body.plant_type);
      }

      if (req.body.growth_stage) {
        formData.append("growth_stage", req.body.growth_stage);
      }

      const response = await axios.post(
        `${AI_SERVICES.IMAGE_DIAGNOSIS}/analyze-leaf`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          timeout: 30000,
        },
      );

      await respondFromImageMicroservice(res, response.data);
    } catch (error) {
      handleAIServiceError(error as AxiosError, "Leaf Analysis", res);
    }
  },
];

export const comprehensivePlantAnalysis = [
  upload.single("file"),
  requireRealImages(),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const formData = new FormData();
      formData.append("file", req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });

      if (req.body.plant_type) {
        formData.append("plant_type", req.body.plant_type);
      }

      if (req.body.growth_stage) {
        formData.append("growth_stage", req.body.growth_stage);
      }

      if (req.body.analysis_focus) {
        formData.append("analysis_focus", req.body.analysis_focus);
      }

      const response = await axios.post(
        `${AI_SERVICES.IMAGE_DIAGNOSIS}/analyze-plant`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          timeout: 30000,
        },
      );

      await respondFromImageMicroservice(res, response.data);
    } catch (error) {
      handleAIServiceError(
        error as AxiosError,
        "Comprehensive Plant Analysis",
        res,
      );
    }
  },
];

export const quickPlantHealthCheck = [
  upload.single("file"),
  requireRealImages(),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const formData = new FormData();
      formData.append("file", req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });

      const response = await axios.post(
        `${AI_SERVICES.IMAGE_DIAGNOSIS}/quick-health-check`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          timeout: 30000,
        },
      );

      await respondFromImageMicroservice(res, response.data);
    } catch (error) {
      handleAIServiceError(error as AxiosError, "Quick Health Check", res);
    }
  },
];

// 📈 MARKET FORECAST ENDPOINTS
export const forecastMarketPrices = async (req: Request, res: Response) => {
  const b = req.body ?? {};
  // PriceForecastRequest requires crop_type and a positive current_price.
  // Validate here so a caller that omits either gets a clear 400 naming the
  // missing field, instead of an opaque 422 proxied from the microservice.
  const cropType = b.crop_type ?? b.crop ?? b.cropId;
  const currentPrice = toNumber(b.current_price ?? b.price);
  if (!cropType || currentPrice === undefined || currentPrice <= 0) {
    return res.status(400).json({
      error: "Invalid market forecast request",
      message:
        "crop_type (or crop) and a positive current_price (or price) are required.",
      dataSource: "none",
      isRealData: false,
    });
  }
  try {
    const response = await callAIService(
      AI_SERVICES.MARKET_FORECAST,
      "/forecast-price",
      "POST",
      {
        crop_type: cropType,
        current_price: currentPrice,
        forecast_days: toNumber(b.forecast_days ?? b.days) ?? 30,
        market_conditions: b.market_conditions,
        language: b.language,
      },
    );
    await respondFromMicroservice(res, response.data, AI_SERVICES.MARKET_FORECAST);
  } catch (error) {
    handleAIServiceError(error as AxiosError, "Market Forecast", res);
  }
};

export const analyzeSupplyDemand = async (req: Request, res: Response) => {
  const b = req.body ?? {};
  // SupplyDemandRequest requires crop_type and a positive current_production.
  const cropType = b.crop_type ?? b.crop ?? b.cropId;
  const production = toNumber(
    b.current_production ?? b.production ?? b.production_tons,
  );
  if (!cropType || production === undefined || production <= 0) {
    return res.status(400).json({
      error: "Invalid supply/demand request",
      message:
        "crop_type (or crop) and a positive current_production (or production) are required.",
      dataSource: "none",
      isRealData: false,
    });
  }
  try {
    const response = await callAIService(
      AI_SERVICES.MARKET_FORECAST,
      "/analyze-supply-demand",
      "POST",
      {
        crop_type: cropType,
        current_production: production,
        region: b.region ?? "tunisia",
        analysis_period: toNumber(b.analysis_period ?? b.period) ?? 30,
      },
    );
    await respondFromMicroservice(res, response.data, AI_SERVICES.MARKET_FORECAST);
  } catch (error) {
    handleAIServiceError(error as AxiosError, "Supply Demand Analysis", res);
  }
};

// 🧠 SMART ASSISTANT ENDPOINTS
export const chatWithAIAssistant = async (req: Request, res: Response) => {
  const { message, question, context, history, language } = req.body ?? {};
  const userMessage: string = (message || question || "").toString();
  // Correlation id lets a user quote a request in a support report without the
  // server logging the prompt itself.
  const correlationId = crypto.randomUUID();
  res.set("X-Correlation-Id", correlationId);

  if (!userMessage.trim()) {
    return res.status(400).json({ error: "message is required", correlationId });
  }
  if (userMessage.length > MAX_USER_MESSAGE_CHARS) {
    return res.status(413).json({
      error: `الرسالة طويلة جداً (الحد ${MAX_USER_MESSAGE_CHARS} حرفاً)`,
      correlationId,
    });
  }
  // Cap history so a caller cannot inflate the provider bill or context window.
  const safeHistory = Array.isArray(history) ? history.slice(-12) : undefined;

  try {
    const result = await answerAgriculturalQuestion({
      question: userMessage,
      language: language || detectLanguage(userMessage),
      context,
      history: safeHistory,
    });
    res.json({ ...result, correlationId });
  } catch (error) {
    // Log the correlation id and error category only — never the prompt.
    console.error(
      `Assistant error [${correlationId}]:`,
      error instanceof Error ? error.name : "unknown",
    );
    res.status(500).json({
      error: "تعذّر معالجة السؤال",
      dataAvailable: false,
      correlationId,
    });
  }
};

export const generateFarmingTasks = async (req: Request, res: Response) => {
  const b = req.body ?? {};
  // The service (TaskPlanRequest) requires crop_type, field_id, planting_date
  // and field_area (>0). Accept the aliases the UI uses so a valid request is
  // not rejected as 422, and answer 400 with a clear message when a required
  // field is genuinely missing instead of letting Pydantic 422 through.
  const crop_type = b.crop_type ?? b.crop ?? b.cropId;
  const field_id = b.field_id ?? b.fieldId ?? b.farm_id ?? b.farmId;
  const planting_date =
    b.planting_date ?? b.plantingDate ?? b.sowing_date ?? b.sowingDate;
  const field_area = toNumber(
    b.field_area ?? b.fieldArea ?? b.area ?? b.area_hectares ?? b.farm_size,
  );

  const missing: string[] = [];
  if (!crop_type) missing.push("crop_type");
  if (!field_id) missing.push("field_id");
  if (!planting_date) missing.push("planting_date");
  if (field_area === undefined || field_area <= 0) missing.push("field_area (>0)");
  if (missing.length) {
    return res.status(400).json({
      error: "Missing required fields",
      message: `Provide: ${missing.join(", ")}`,
    });
  }

  try {
    const response = await callAIService(
      AI_SERVICES.SMART_ASSISTANT,
      "/plan-season",
      "POST",
      {
        crop_type,
        field_id,
        planting_date,
        field_area,
        available_resources: b.available_resources ?? b.resources,
      },
    );
    await respondFromMicroservice(res, response.data, AI_SERVICES.SMART_ASSISTANT);
  } catch (error) {
    handleAIServiceError(error as AxiosError, "Farming Tasks Planner", res);
  }
};

export const getSmartAlerts = async (req: Request, res: Response) => {
  // The assistant service exposes alerts per farmer (/alerts/{farmer_id}); there
  // is no fleet-wide endpoint, so require the id instead of requesting a path
  // the service does not serve (which returned a 404).
  const farmerId = (req.query.farmer_id ?? req.query.farmerId ?? "")
    .toString()
    .trim();
  if (!farmerId) {
    return res.status(400).json({
      error: "farmer_id is required",
      message: "Pass ?farmer_id=... to fetch that farmer's active alerts.",
    });
  }
  const severity = req.query.severity
    ? encodeURIComponent(String(req.query.severity))
    : undefined;
  try {
    const response = await callAIService(
      AI_SERVICES.SMART_ASSISTANT,
      `/alerts/${encodeURIComponent(farmerId)}${severity ? `?severity_filter=${severity}` : ""}`,
      "GET",
    );
    await respondFromMicroservice(res, response.data, AI_SERVICES.SMART_ASSISTANT);
  } catch (error) {
    handleAIServiceError(error as AxiosError, "Smart Alerts", res);
  }
};

// HELPER ENDPOINTS
function toNumber(value: unknown): number | undefined {
  const n = typeof value === "number" ? value : parseFloat(value as string);
  return Number.isFinite(n) ? n : undefined;
}

/** Normalise varied soil payloads into the rule-based engine input shape. */
function normaliseSoilInput(data: Record<string, any>) {
  const d = data ?? {};
  return {
    ph: toNumber(d.ph),
    nitrogen: toNumber(d.nitrogen),
    phosphorus: toNumber(d.phosphorus),
    potassium: toNumber(d.potassium),
    organic_matter: toNumber(d.organic_matter ?? d.organicMatter),
    moisture: toNumber(d.moisture),
    salinity: toNumber(d.salinity ?? d.conductivity),
    temperature: toNumber(d.temperature),
  };
}

/**
 * The AI microservices type `location` as optional GPS coordinates
 * ({latitude, longitude}). The UI sometimes sends a free-text place name, which
 * makes Pydantic answer 422 and silently disables the microservice. Convert to a
 * GPS object when possible, otherwise drop the field rather than send junk.
 */
function normaliseLocation(raw: any): { latitude: number; longitude: number } | undefined {
  if (!raw) return undefined;
  if (typeof raw === "object") {
    const lat = toNumber(raw.latitude ?? raw.lat);
    const lon = toNumber(raw.longitude ?? raw.lng ?? raw.lon);
    return lat !== undefined && lon !== undefined
      ? { latitude: lat, longitude: lon }
      : undefined;
  }
  return undefined;
}

/** Normalise varied crop request payloads into the crop advisor input shape. */
function normaliseCropInput(data: Record<string, any>) {
  const d = data ?? {};
  return {
    ph: toNumber(d.ph ?? d.soil_ph ?? d.soil_data?.ph),
    nitrogen: toNumber(d.nitrogen ?? d.soil_data?.nitrogen),
    phosphorus: toNumber(d.phosphorus ?? d.soil_data?.phosphorus),
    potassium: toNumber(d.potassium ?? d.soil_data?.potassium),
    temperature: toNumber(d.temperature ?? d.climate_data?.temperature),
    humidity: toNumber(d.humidity ?? d.climate_data?.humidity),
    rainfall: toNumber(d.rainfall ?? d.climate_data?.rainfall ?? d.annual_rainfall),
    area_hectares: toNumber(d.area_hectares ?? d.farm_size),
    soil_type: d.soil_type,
    salinity: toNumber(d.salinity ?? d.soil_data?.salinity),
    season: d.season,
  };
}

export const getSupportedCrops = async (req: Request, res: Response) => {
  try {
    const response = await callAIService(
      AI_SERVICES.CROP_RECOMMENDATION,
      "/supported-crops",
      "GET",
    );
    await respondFromMicroservice(res, response.data, AI_SERVICES.CROP_RECOMMENDATION);
  } catch (error) {
    // Serve the reference dataset so the UI always has a crop list.
    res.json({
      dataSource: "reference-dataset",
      supported_crops: CROP_REFERENCE.map((c) => ({
        name: c.crop,
        name_ar: c.nameAr,
        category: c.category,
        growing_season: c.seasons.join("، "),
        suitable_soil_types: [],
      })),
      total_count: CROP_REFERENCE.length,
      note: "قائمة مرجعية محلية (خدمة التوصيات غير متاحة).",
    });
  }
};

export const getSupportedDiseases = async (req: Request, res: Response) => {
  try {
    const response = await callAIService(
      AI_SERVICES.IMAGE_DIAGNOSIS,
      "/supported-diseases",
      "GET",
    );
    await respondFromMicroservice(res, response.data, AI_SERVICES.IMAGE_DIAGNOSIS);
  } catch (error) {
    handleAIServiceError(error as AxiosError, "Supported Diseases", res);
  }
};

export const getAIServicesHealth = async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();

    // Define services with Arabic names
    const services = [
      {
        name: "Soil Analysis",
        nameAr: "تحليل التربة",
        url: AI_SERVICES.SOIL_ANALYSIS,
        key: "soil_analysis"
      },
      {
        name: "Crop Recommendation",
        nameAr: "توصيات المحاصيل",
        url: AI_SERVICES.CROP_RECOMMENDATION,
        key: "crop_recommendation"
      },
      {
        name: "Image Diagnosis",
        nameAr: "تشخيص الصور",
        url: AI_SERVICES.IMAGE_DIAGNOSIS,
        key: "image_diagnosis"
      },
      {
        name: "Market Forecast",
        nameAr: "توقعات السوق",
        url: AI_SERVICES.MARKET_FORECAST,
        key: "market_forecast"
      },
      {
        name: "Smart Assistant",
        nameAr: "المساعد الذكي",
        url: AI_SERVICES.SMART_ASSISTANT,
        key: "smart_assistant"
      },
      {
        name: "Weather & Yield Intelligence",
        nameAr: "الطقس والمردودية",
        url: AI_SERVICES.SMART_MARKETPLACE,
        key: "weather_yield"
      },
      {
        name: "Pest Control",
        nameAr: "مكافحة الآفات",
        url: AI_SERVICES.PEST_CONTROL,
        key: "pest_control"
      },
      {
        name: "Irrigation Optimization",
        nameAr: "تحسين الري",
        url: AI_SERVICES.IRRIGATION_OPTIMIZATION,
        key: "irrigation_optimization"
      }
    ];

    // Use a shorter timeout to avoid long delays when services are down
    const healthChecks = await Promise.allSettled(
      services.map(async (service) => {
        const checkStart = Date.now();
        try {
          const response = await axios.get(`${service.url}/health`, { timeout: 3000 });
          // A reachable service is not evidence of a trained model: the bundled
          // services self-report "synthetic-demo"/"heuristic-demo" in their own
          // /health payload. Surface that so the monitoring view does not
          // present synthetic inference as production model output.
          const declared =
            response.data?.model_source ?? response.data?.modelSource ?? null;
          const modelSource = typeof declared === "string" ? declared : null;
          const heuristic =
            modelSource !== null && HEURISTIC_MODEL_SOURCE_RE.test(modelSource);
          return {
            ...service,
            status: "available",
            modelSource,
            isRealModel: modelSource !== null && !heuristic,
            modelTrainedOnSyntheticData: heuristic,
            responseTime: Date.now() - checkStart,
            lastChecked: new Date().toISOString()
          };
        } catch (error) {
          return {
            ...service,
            status: "unavailable",
            responseTime: Date.now() - checkStart,
            lastChecked: new Date().toISOString(),
            error: error.message
          };
        }
      })
    );

    const serviceResults = healthChecks.map((check, index) => {
      if (check.status === "fulfilled") {
        return check.value;
      } else {
        return {
          ...services[index],
          status: "unavailable",
          responseTime: undefined,
          lastChecked: new Date().toISOString(),
          error: "Connection failed"
        };
      }
    });

    const availableCount = serviceResults.filter(s => s.status === "available").length;
    const unavailableCount = serviceResults.length - availableCount;
    // Services that answer /health but self-declare synthetic/heuristic models.
    const syntheticCount = serviceResults.filter(
      (s: any) => s.modelTrainedOnSyntheticData === true,
    ).length;

    const results = {
      overview: {
        totalServices: serviceResults.length,
        availableServices: availableCount,
        unavailableServices: unavailableCount,
        /** Reachable services whose own /health reports a synthetic/heuristic model. */
        syntheticModelServices: syntheticCount,
        lastUpdated: new Date().toISOString(),
        checkDuration: Date.now() - startTime,
      },
      services: serviceResults,
      llm: getLLMInfo(),
      fallbackEngine: {
        available: true,
        type: "rule-based",
        description:
          "محرك قواعد زراعية محلي يوفر تحليلاً بديلاً عند تعذّر الخدمات (بدون تقديم نتائج كنموذج ذكاء اصطناعي).",
      },
      note:
        unavailableCount > 0
          ? "بعض خدمات الذكاء الاصطناعي غير متاحة؛ يتم استخدام محرك القواعد الزراعية كبديل شفاف."
          : syntheticCount > 0
            ? "جميع الخدمات تعمل، لكن بعضها مصرّح بأنه مدرّب على بيانات اصطناعية (model_source: synthetic-demo) وليس على بيانات حقلية موثّقة."
            : "جميع خدمات الذكاء الاصطناعي تعمل بشكل طبيعي",
    };

    // Always return 200 status since unavailable services are expected in development
    res.json(results);
  } catch (error) {
    // Return a 200 response with unavailable status instead of 500 error
    console.warn("AI services health check failed:", error);
    res.json({
      overview: {
        totalServices: 5,
        availableServices: 0,
        unavailableServices: 5,
        syntheticModelServices: 0,
        lastUpdated: new Date().toISOString(),
        checkDuration: 0
      },
      services: [
        { name: "Soil Analysis", nameAr: "تحليل التربة", url: AI_SERVICES.SOIL_ANALYSIS, status: "unavailable" },
        { name: "Crop Recommendation", nameAr: "توصيات المحاصيل", url: AI_SERVICES.CROP_RECOMMENDATION, status: "unavailable" },
        { name: "Image Diagnosis", nameAr: "تشخيص الصور", url: AI_SERVICES.IMAGE_DIAGNOSIS, status: "unavailable" },
        { name: "Market Forecast", nameAr: "توقعات السوق", url: AI_SERVICES.MARKET_FORECAST, status: "unavailable" },
        { name: "Smart Assistant", nameAr: "المساعد الذكي", url: AI_SERVICES.SMART_ASSISTANT, status: "unavailable" }
      ],
      error: "فشل في فحص خدمات الذكاء الاصطناعي - هذا طبيعي عندما لا تكون الخدمات قيد التشغيل"
    });
  }
};
