import { firstEnv } from "../lib/env";
import { Request, Response } from "express";
import crypto from "crypto";
import axios, { AxiosError } from "axios";
import FormData from "form-data";
import multer from "multer";
import { uploadError, requireRealImages } from "../middleware/upload";
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
import { resolveUserIdFromJwt } from "../middleware/auth";
import { scopedClientFromAuthHeader } from "../lib/supabase";
import { getWeatherFromOpenMeteo } from "../services/providers/weatherProvider";

/**
 * Model-source markers that mean "this service is not running a model trained
 * on real field data". Shared with the health view so a reachable-but-synthetic
 * service is labelled honestly instead of shown as production inference.
 */
const HEURISTIC_MODEL_SOURCE_RE =
  /heuristic|demo|simulat|synthetic|mock|random|placeholder|dummy/i;
const RULE_BASED_MODEL_SOURCE_RE =
  /deterministic[-_ ]?rules?|rule[-_ ]?based|knowledge[-_ ]?engine/i;

/**
 * Normalize a service base URL. Render's `fromService` `hostport` property yields
 * "host:port" with no scheme, and Docker/Render sometimes supply a trailing slash.
 * Axios needs an absolute URL, so we prepend http:// when the scheme is missing.
 */
export function localServiceFallback(port: number): string {
  const hostedRuntime = process.env.NODE_ENV === "production" || process.env.RENDER === "true" || Boolean(process.env.RENDER_SERVICE_ID);
  return hostedRuntime ? "" : `http://localhost:${port}`;
}

export function normalizeServiceUrl(raw: string | undefined, fallback: string): string {
  const value = (raw && raw.trim()) || fallback;
  if (!value) return "";
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
    return normalizeServiceUrl(process.env.SOIL_ANALYSIS_URL, localServiceFallback(8001));
  },
  get CROP_RECOMMENDATION() {
    return normalizeServiceUrl(process.env.CROP_RECOMMENDATION_URL, localServiceFallback(8002));
  },
  get IMAGE_DIAGNOSIS() {
    return normalizeServiceUrl(process.env.IMAGE_DIAGNOSIS_URL, localServiceFallback(8003));
  },
  get MARKET_FORECAST() {
    return normalizeServiceUrl(
      firstEnv("MARKET_FORECAST_URL", "MARKET_PREDICTION_URL"),
      localServiceFallback(8004),
    );
  },
  get SMART_ASSISTANT() {
    return normalizeServiceUrl(
      firstEnv("SMART_ASSISTANT_URL", "INTELLIGENT_AGENT_URL"),
      localServiceFallback(8005),
    );
  },
  get SMART_MARKETPLACE() {
    return normalizeServiceUrl(
      process.env.WEATHER_YIELD_INTELLIGENCE_URL ??
        process.env.SMART_MARKETPLACE_URL,
      localServiceFallback(8006),
    );
  },
  get PEST_CONTROL() {
    return normalizeServiceUrl(process.env.PEST_CONTROL_URL, localServiceFallback(8007));
  },
  get IRRIGATION_OPTIMIZATION() {
    return normalizeServiceUrl(
      process.env.IRRIGATION_OPTIMIZATION_URL,
      localServiceFallback(8008),
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
      success: false,
      error: `${serviceName} service error`,
      message: error.response.data || error.message,
      status: error.response.status,
    });
  } else if (error.request) {
    res.status(503).json({
      success: false,
      error: `${serviceName} service unavailable`,
      message: "Service is not responding",
      status: 503,
    });
  } else {
    res.status(500).json({
      success: false,
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
  if (!serviceUrl) {
    const error = new Error("SERVICE_URL_NOT_CONFIGURED") as AxiosError;
    error.request = {};
    throw error;
  }
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
    : { reachable: false, modelSource: null as string | null, heuristic: false };

  // Reachability is not proof of model provenance. Fail closed when the
  // service is unreachable, declares synthetic/demo logic, or omits a source.
  if (!probe.reachable || !probe.modelSource || probe.heuristic) {
    return res.status(503).json({
      success: false,
      code: !probe.reachable
        ? "AI_SERVICE_UNAVAILABLE"
        : probe.heuristic
          ? "SYNTHETIC_MODEL_DISABLED"
          : "MODEL_PROVENANCE_UNKNOWN",
      message: "The AI service is unavailable for production output because its model provenance is missing, synthetic, or unverified.",
      productionReady: false,
      modelSource: probe.modelSource,
      isRealData: false,
    });
  }

  const source = probe.modelSource;
  const ruleBased = /deterministic-rules|rule-based/i.test(source);
  const llmBased = /openrouter|gemini|gpt|llm/i.test(source);
  const provenance = {
    dataSource: ruleBased
      ? "rule-based"
      : llmBased
        ? "llm-generated"
        : "trained-model",
    // A model-generated result is not itself a verified measurement.
    isRealData: false,
    modelSource: source,
    fieldValidated: false,
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
  const rawModelSource = payload.model_source ?? payload.modelSource;
  const source =
    typeof rawModelSource === "string" ? rawModelSource.trim() : "";
  const syntheticSource =
    !source || /heuristic|demo|simulat|synthetic|mock|random|placeholder|dummy/i.test(source);

  const validVisionSource =
    rawDataSource === "vision-model" || rawDataSource === "llm" || rawDataSource === "trained-ml" || rawDataSource === "trained-model-inference";
  const modelClaimVerified = payload.is_real_data === true || payload.isRealData === true;

  if (!allowVisionModel || syntheticSource || !validVisionSource || !modelClaimVerified) {
    return res.status(503).json({
      success: false,
      code: syntheticSource ? "VISION_MODEL_PROVENANCE_UNAVAILABLE" : "VISION_MODEL_NOT_APPROVED",
      message: "Image analysis is unavailable because no approved trained model provenance was returned.",
      productionReady: false,
      dataSource: "unavailable",
      isRealData: false,
      modelSource: source || null,
    });
  }

  // A genuine model inference is still a prediction, not a verified diagnosis.
  const dataSource = rawDataSource === "llm" || rawDataSource === "vision-model"
    ? "llm-generated"
    : "trained-model-inference";

  res.json({
    ...payload,
    data_source: dataSource,
    dataSource,
    is_real_data: false,
    isRealData: false,
    model_source: source,
    modelSource: source,
    field_validated: false,
    fieldValidated: false,
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
        language: req.body?.language,
        crop: req.body?.crop ?? req.body?.crop_type,
      },
    );
    return await respondFromMicroservice(res, response.data, AI_SERVICES.SOIL_ANALYSIS);
  } catch (error) {
    // Fail closed. The professional report workflow is the canonical soil analysis;
    // never substitute local heuristic output when the configured service is down.
    console.warn("Soil analysis microservice unavailable:", (error as AxiosError).message);
    return handleAIServiceError(error as AxiosError, "Soil Analysis", res);
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
    console.warn("Crop/climate service unavailable; no synthetic fallback is served.");
    return handleAIServiceError(error as AxiosError, "Crop/Climate Matching", res);
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

  // Never manufacture defaults or return an unvalidated local substitute.
  if (requiredErrors.length > 0) {
    return res.status(422).json({
      success: false,
      code: "CROP_INPUT_INVALID",
      message: "Valid temperature, annual rainfall, and soil pH measurements are required.",
      validationErrors: requiredErrors,
      productionReady: false,
    });
  }

  return res.status(503).json({ success: false, code: "CROP_MODEL_NOT_VALIDATED", message: "Crop recommendation model is not validated for production use.", data: null, dataAvailable: false, isRealData: false });

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
    console.warn("Crop recommendation service unavailable:", (error as AxiosError).message);
    return handleAIServiceError(error as AxiosError, "Crop Recommendation", res);
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
    return handleAIServiceError(error as AxiosError, "Quick Crop Recommendation", res);
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
    isRealData: false,
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
  return res.status(503).json({ success: false, code: "MARKET_MODEL_NOT_VALIDATED", message: "Market forecasting is unavailable until a verified, timestamped market data source and validated model are connected.", data: null, dataAvailable: false, isRealData: false });
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
  return res.status(503).json({ success: false, code: "MARKET_MODEL_NOT_VALIDATED", message: "Supply and demand analysis is unavailable until a verified market source is connected.", data: null, dataAvailable: false, isRealData: false });
};

// 🧠 SMART ASSISTANT ENDPOINTS
export const chatWithAIAssistant = async (req: Request, res: Response) => {
  const { message, question, history, language } = req.body ?? {};
  const userMessage: string = (message || question || "").toString();
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

  const safeHistory = Array.isArray(history)
    ? history
        .filter((entry: any) =>
          entry && (entry.role === "user" || entry.role === "assistant") &&
          typeof entry.content === "string" && entry.content.length <= 4000,
        )
        .slice(-12)
        .map((entry: any) => ({ role: entry.role, content: entry.content }))
    : undefined;

  try {
    let farmContext: {
      governorate?: string;
      crop?: string;
      farmSizeHectares?: number;
      soil?: { ph?: number; organicMatter?: number; moisture?: number; temperature?: number };
      temperature?: number;
      rainfall?: number;
      operationalAlerts?: string[];
      platformRecords?: string[];
    } | undefined;
    let farmContextStatus: "linked" | "no_farms" | "anonymous" | "unavailable" = "anonymous";

    // When a verified session is supplied, build context from the caller's
    // own persisted records. Client-supplied farm measurements are not trusted.
    let userId: string | null = null;
    try {
      userId = await resolveUserIdFromJwt(req);
    } catch (authError) {
      const reason = authError instanceof Error ? authError.message : "";
      if (reason === "AUTH_INVALID_TOKEN") {
        return res.status(401).json({ error: "Unauthorized", correlationId });
      }
      farmContextStatus = "unavailable";
    }

    if (userId) {
      const db = scopedClientFromAuthHeader(req.header("authorization"));
      if (!db) {
        farmContextStatus = "unavailable";
      } else {
        const [userResult, profileResult, farmsResult, publicMarketResult, publicPredictionsResult] = await Promise.all([
          db.from("users").select("role,language_preference").eq("id", userId).maybeSingle(),
          db.from("user_profiles").select("experience_years,farming_specializations,preferred_crops,location").eq("user_id", userId).maybeSingle(),
          db.from("farms").select("id,name,location,size_hectares,soil_type,climate_zone,elevation_meters,water_source,irrigation_type,organic_certified").eq("owner_id", userId).limit(20),
          db.from("market_prices").select("crop_name,variety,quality_grade,price_per_kg,currency,market_location,price_date,supply_level,demand_level,source").order("price_date", { ascending: false }).limit(10),
          db.from("market_predictions").select("crop_name,prediction_period,predicted_price_range,confidence_level,valid_from,valid_until,created_at").gte("valid_until", new Date().toISOString().slice(0, 10)).order("valid_from", { ascending: true }).limit(10),
        ]);
        const basePlatformRecords: string[] = [];
        const userRole = typeof userResult.data?.role === "string" ? userResult.data.role : "unreported";
        basePlatformRecords.push("Authenticated AgroGrowth account role=" + userRole + "; role is context only and does not grant cross-user data access.");
        if (typeof userResult.data?.language_preference === "string") {
          basePlatformRecords.push("Account language preference=" + userResult.data.language_preference);
        }
        if (profileResult.data) {
          if (profileResult.data.experience_years !== null && profileResult.data.experience_years !== undefined && Number.isFinite(Number(profileResult.data.experience_years))) {
            basePlatformRecords.push("Recorded farming experience=" + profileResult.data.experience_years + " years");
          }
          if (Array.isArray(profileResult.data.farming_specializations) && profileResult.data.farming_specializations.length) {
            basePlatformRecords.push("Recorded professional specializations=" + profileResult.data.farming_specializations.slice(0, 10).join(", "));
          }
          if (Array.isArray(profileResult.data.preferred_crops) && profileResult.data.preferred_crops.length) {
            basePlatformRecords.push("Recorded preferred crops=" + profileResult.data.preferred_crops.slice(0, 10).join(", "));
          }
        }
        if (farmsResult.error) {
          farmContextStatus = "unavailable";
        } else if (!farmsResult.data?.length) {
          for (const price of (publicMarketResult.error ? [] : publicMarketResult.data ?? [])) {
            basePlatformRecords.push("Recorded market price [crop=" + price.crop_name + "; variety=" + (price.variety || "unreported") + "; grade=" + (price.quality_grade || "unreported") + "; price=" + price.price_per_kg + " " + (price.currency || "TND") + "/kg; market=" + price.market_location + "; date=" + price.price_date + "; supply=" + (price.supply_level || "unreported") + "; demand=" + (price.demand_level || "unreported") + "; source=" + (price.source || "unreported") + "]. Historical recorded quote, not guaranteed live data.");
          }
          for (const prediction of (publicPredictionsResult.error ? [] : publicPredictionsResult.data ?? [])) {
            basePlatformRecords.push("Public stored market prediction [crop=" + prediction.crop_name + "; period=" + (prediction.prediction_period || "unreported") + "; range=" + JSON.stringify(prediction.predicted_price_range ?? {}).slice(0, 200) + "; confidence=" + (prediction.confidence_level ?? "unreported") + "; valid=" + prediction.valid_from + " to " + prediction.valid_until + "; created=" + prediction.created_at + "]. Prediction, not a current market quote or guaranteed price.");
          }
          farmContext = { platformRecords: basePlatformRecords };
          farmContextStatus = "no_farms";
        } else {
          const farms = farmsResult.data ?? [];
          const farmIds = farms.map((farm: any) => farm.id);
          const [cropResult, soilResult, alertsResult, sectionsResult, diseaseResult, weatherResult, forecastResult, sensorResult, satelliteResult] = await Promise.all([
            db.from("crop_cultivations")
              .select("id,farm_id,section_id,crop_name,crop_variety,status,planting_date,expected_harvest_date,current_growth_stage,irrigation_method,fertilizer_plan,pesticide_plan,area_hectares,estimated_yield,total_cost,revenue,profit,updated_at")
              .in("farm_id", farmIds).order("updated_at", { ascending: false }).limit(12),
            db.from("soil_analyses")
              .select("analysis_type,ph_level,nitrogen_level,phosphorus_level,potassium_level,organic_matter_percent,moisture_percent,temperature_celsius,health_score,fertility_level,sample_depth_cm,analyzed_at")
              .in("farm_id", farmIds).in("analysis_type", ["lab", "laboratory", "sensor"])
              .order("analyzed_at", { ascending: false }).limit(5),
            db.from("notifications")
              .select("title,message,priority,created_at,archived_at")
              .eq("user_id", userId).eq("category", "agrogrowth_agent")
              .is("archived_at", null).order("created_at", { ascending: false }).limit(8),
            db.from("farm_sections")
              .select("id,farm_id,name,area_hectares,soil_type,current_crop,planted_date,expected_harvest_date")
              .in("farm_id", farmIds).limit(15),
            db.from("plant_disease_detections")
              .select("farm_id,cultivation_id,detection_method,plant_type,primary_disease,severity_level,affected_area_percentage,treatment_applied,recovery_status,disease_confidence,detected_at")
              .in("farm_id", farmIds).order("detected_at", { ascending: false }).limit(8),
            db.from("weather_records")
              .select("farm_id,temperature_celsius,humidity_percent,rainfall_mm,wind_speed_kmh,uv_index,cloud_cover_percent,weather_conditions,record_date,source")
              .in("farm_id", farmIds).order("record_date", { ascending: false }).limit(5),
            db.from("weather_forecasts")
              .select("farm_id,forecast_date,forecast_period,forecast_data,accuracy_score,source")
              .in("farm_id", farmIds).gte("forecast_date", new Date().toISOString().slice(0, 10)).order("forecast_date", { ascending: true }).limit(5),
            db.from("sensor_devices")
              .select("id,farm_id,section_id,device_type,status,battery_level,last_maintenance_date,updated_at")
              .in("farm_id", farmIds).order("updated_at", { ascending: false }).limit(10),
            db.from("satellite_observations")
              .select("farm_id,index_name,mean_value,min_value,max_value,observed_from,observed_to,provider,sample_count,no_data_count")
              .in("farm_id", farmIds).order("observed_to", { ascending: false }).limit(10),
          ]);
          const sensorIds = (sensorResult.data ?? []).map((sensor: any) => sensor.id).filter(Boolean);
          const sensorReadingsResult = sensorIds.length
            ? await db.from("sensor_readings")
                .select("device_id,reading_type,value,unit,quality_indicator,recorded_at")
                .in("device_id", sensorIds)
                .order("recorded_at", { ascending: false })
                .limit(12)
            : { data: [], error: null };

          if (cropResult.error || soilResult.error) {
            farmContextStatus = "unavailable";
          } else {
            const firstLocation = farms.find((farm: any) => farm.location && typeof farm.location === "object")?.location;
            const rawSize = farms.reduce((sum: number, farm: any) => {
              const size = Number(farm.size_hectares);
              return sum + (Number.isFinite(size) && size > 0 ? size : 0);
            }, 0);
            const latestSoil = soilResult.data?.[0];
            const soil: { ph?: number; organicMatter?: number; moisture?: number; temperature?: number } = {};
            if (latestSoil) {
              const ph = toNumber(latestSoil.ph_level);
              const organicMatter = toNumber(latestSoil.organic_matter_percent);
              const moisture = toNumber(latestSoil.moisture_percent);
              const temperature = toNumber(latestSoil.temperature_celsius);
              if (ph !== undefined) soil.ph = ph;
              if (organicMatter !== undefined) soil.organicMatter = organicMatter;
              if (moisture !== undefined) soil.moisture = moisture;
              if (temperature !== undefined) soil.temperature = temperature;
            }
            const operationalAlerts = (alertsResult.error ? [] : (alertsResult.data ?? []))
              .filter((alert: any) => typeof alert.title === "string" && typeof alert.message === "string")
              .map((alert: any) => `[${alert.priority || "normal"}] ${alert.title}: ${alert.message}`);
            const marketCropNames = Array.from(new Set((cropResult.data ?? []).map((item: any) => item.crop_name).filter((name: any): name is string => typeof name === "string" && name.length > 0)));
          const marketResult = marketCropNames.length
            ? await db.from("market_prices")
                .select("crop_name,variety,quality_grade,price_per_kg,currency,market_location,price_date,supply_level,demand_level,source")
                .in("crop_name", marketCropNames)
                .order("price_date", { ascending: false })
                .limit(12)
            : { data: [], error: null };
          const marketPredictionsResult = marketCropNames.length
            ? await db.from("market_predictions")
                .select("crop_name,prediction_period,prediction_data,predicted_price_range,confidence_level,influencing_factors,valid_from,valid_until,created_at")
                .in("crop_name", marketCropNames)
                .gte("valid_until", new Date().toISOString().slice(0, 10))
                .order("valid_from", { ascending: true })
                .limit(8)
            : { data: [], error: null };
          const cultivationIds = (cropResult.data ?? []).map((item: any) => item.id).filter(Boolean);
          const leafHealthResult = cultivationIds.length
            ? await db.from("leaf_health_analyses")
                .select("cultivation_id,plant_type,growth_stage,nutrition_deficiency,health_score,quality_grade,recommendations,analyzed_at")
                .in("cultivation_id", cultivationIds)
                .order("analyzed_at", { ascending: false })
                .limit(8)
            : { data: [], error: null };
          const platformRecords: string[] = [...basePlatformRecords];
            for (const farm of farms) {
              const farmName = typeof farm.name === "string" ? farm.name : "Farm";
              platformRecords.push("Farm " + farmName + " · " + (Number(farm.size_hectares) || 0) + " ha; soil_type=" + (farm.soil_type || "not recorded") + "; climate_zone=" + (farm.climate_zone || "not recorded") + "; elevation_m=" + (farm.elevation_meters ?? "not recorded") + "; water_source=" + (farm.water_source || "not recorded") + "; irrigation_type=" + (farm.irrigation_type || "not recorded") + "; organic_certified=" + (farm.organic_certified === true ? "yes" : farm.organic_certified === false ? "no" : "not recorded"));
              for (const section of (sectionsResult.data ?? []).filter((item: any) => item.farm_id === farm.id)) {
                platformRecords.push("Plot " + section.name + " in " + farmName + ": " + section.area_hectares + " ha; crop=" + (section.current_crop || "not recorded") + "; soil=" + (section.soil_type || "not recorded") + "; planted=" + (section.planted_date || "unknown") + "; expected harvest=" + (section.expected_harvest_date || "unknown"));
              }
            }
            for (const crop of cropResult.data ?? []) {
              const farm = farms.find((item: any) => item.id === crop.farm_id);
              platformRecords.push("Cultivation " + crop.crop_name + " [status=" + crop.status + "; variety=" + (crop.crop_variety || "not recorded") + "; stage=" + (crop.current_growth_stage || "not recorded") + "; planted=" + crop.planting_date + "; expected harvest=" + (crop.expected_harvest_date || "unknown") + "; area_ha=" + (crop.area_hectares ?? "not recorded") + "; irrigation_method=" + (crop.irrigation_method || "not recorded") + "; fertilizer_plan=" + JSON.stringify(crop.fertilizer_plan ?? {}).slice(0, 350) + "; pesticide_plan=" + JSON.stringify(crop.pesticide_plan ?? {}).slice(0, 250) + "; estimated_yield=" + (crop.estimated_yield ?? "not recorded") + "; total_cost=" + (crop.total_cost ?? "not recorded") + "; revenue=" + (crop.revenue ?? "not recorded") + "; profit=" + (crop.profit ?? "not recorded") + "; farm=" + (farm?.name || crop.farm_id) + "; cultivation_id=" + crop.id + "]. Plans are stored user records and financial/yield values are not independently audited.");
            }
            for (const soilRecord of soilResult.data ?? []) {
              platformRecords.push("Verified soil analysis [type=" + soilRecord.analysis_type + "; pH=" + (soilRecord.ph_level ?? "not recorded") + "; N=" + (soilRecord.nitrogen_level ?? "not recorded") + "; P=" + (soilRecord.phosphorus_level ?? "not recorded") + "; K=" + (soilRecord.potassium_level ?? "not recorded") + "; organic matter=" + (soilRecord.organic_matter_percent ?? "not recorded") + "%; moisture=" + (soilRecord.moisture_percent ?? "not recorded") + "%; temperature=" + (soilRecord.temperature_celsius ?? "not recorded") + " C; health_score=" + (soilRecord.health_score ?? "not recorded") + "; fertility=" + (soilRecord.fertility_level || "not recorded") + "; sample_depth_cm=" + (soilRecord.sample_depth_cm ?? "not recorded") + "; analyzed=" + soilRecord.analyzed_at + "]. Only lab/laboratory/sensor records are included as verified baselines; sensor measurements are not laboratory nutrient tests.");
            }
            for (const detection of diseaseResult.data ?? []) {
              platformRecords.push("Saved plant-health record [method=" + (detection.detection_method || "not recorded") + "; crop=" + (detection.plant_type || "unknown") + "; suspected condition=" + (detection.primary_disease || "not classified") + "; severity=" + (detection.severity_level || "not recorded") + "; affected_area_percent=" + (detection.affected_area_percentage ?? "not recorded") + "; treatment_applied=" + (detection.treatment_applied === true ? "yes" : "no/not recorded") + "; recovery=" + (detection.recovery_status || "pending") + "; confidence=" + (detection.disease_confidence ?? "not reported") + "; detected=" + detection.detected_at + "; farm_id=" + detection.farm_id + "; cultivation_id=" + (detection.cultivation_id || "not linked") + "]. Saved model/inspection result, not a confirmed field diagnosis.");
            }
            for (const observation of (satelliteResult.error ? [] : satelliteResult.data ?? [])) {
              platformRecords.push("Saved satellite observation [index=" + observation.index_name + "; mean=" + observation.mean_value + "; min=" + observation.min_value + "; max=" + observation.max_value + "; interval=" + observation.observed_from + " to " + observation.observed_to + "; provider=" + observation.provider + "; valid_pixels=" + observation.sample_count + "; no_data_pixels=" + observation.no_data_count + "]. Periodic satellite vegetation index, not live telemetry or a disease diagnosis.");
            }
            for (const prediction of (marketPredictionsResult.error ? [] : marketPredictionsResult.data ?? [])) {
              const range = JSON.stringify(prediction.predicted_price_range ?? {}).slice(0, 250);
              const data = JSON.stringify(prediction.prediction_data ?? {}).slice(0, 350);
              platformRecords.push("Stored market prediction [crop=" + prediction.crop_name + "; period=" + (prediction.prediction_period || "unreported") + "; price_range=" + range + "; confidence=" + (prediction.confidence_level ?? "unreported") + "; valid=" + prediction.valid_from + " to " + prediction.valid_until + "; created=" + prediction.created_at + "; prediction_data=" + data + "]. This is a saved forecast, not a verified current market quote.");
            }
            for (const leaf of (leafHealthResult.error ? [] : leafHealthResult.data ?? [])) {
              platformRecords.push("Saved leaf-health analysis [crop=" + (leaf.plant_type || "unreported") + "; growth_stage=" + (leaf.growth_stage || "unreported") + "; nutrition_deficiency=" + (leaf.nutrition_deficiency || "not detected/reported") + "; health_score=" + (leaf.health_score ?? "unreported") + "; quality_grade=" + (leaf.quality_grade || "unreported") + "; analyzed=" + leaf.analyzed_at + "; cultivation_id=" + leaf.cultivation_id + "; recommendations=" + JSON.stringify(leaf.recommendations ?? {}).slice(0, 300) + "]. Saved assessment; verify against field conditions.");
            }
            for (const price of marketResult.data ?? []) {
              platformRecords.push("Recorded market price [crop=" + price.crop_name + "; price=" + price.price_per_kg + " " + (price.currency || "TND") + "/kg; market=" + price.market_location + "; date=" + price.price_date + "; source=" + (price.source || "unreported") + "]. Historical recorded quote, not a guaranteed live market price.");
            }
            for (const weather of weatherResult.data ?? []) {
              platformRecords.push("Recorded weather [date=" + weather.record_date + "; temperature=" + (weather.temperature_celsius ?? "unknown") + " C; humidity=" + (weather.humidity_percent ?? "unknown") + "%; rainfall=" + (weather.rainfall_mm ?? "unknown") + " mm; wind_speed=" + (weather.wind_speed_kmh ?? "unknown") + " km/h; UV=" + (weather.uv_index ?? "unknown") + "; cloud_cover=" + (weather.cloud_cover_percent ?? "unknown") + "%; conditions=" + (weather.weather_conditions || "unknown") + "; source=" + (weather.source || "unreported") + "]. Historical observation, not current weather.");
            }
            for (const forecast of (forecastResult.error ? [] : forecastResult.data ?? [])) {
              const compactForecast = typeof forecast.forecast_data === "string"
                ? forecast.forecast_data.slice(0, 600)
                : JSON.stringify(forecast.forecast_data ?? {}).slice(0, 300);
              platformRecords.push("Stored weather forecast [date=" + forecast.forecast_date + "; period=" + (forecast.forecast_period || "unreported") + "; source=" + (forecast.source || "unreported") + "; accuracy=" + (forecast.accuracy_score ?? "unreported") + "; forecast_data=" + compactForecast + "]. Forecast record, not a live observation.");
            }
            for (const sensor of sensorResult.data ?? []) {
              platformRecords.push("Registered sensor [type=" + sensor.device_type + "; status=" + sensor.status + "; battery=" + (sensor.battery_level ?? "unreported") + "%; last maintenance=" + (sensor.last_maintenance_date || "unreported") + "; updated=" + (sensor.updated_at || "unreported") + "]. Registry data, not live telemetry.");
            }
            for (const reading of (sensorReadingsResult.error ? [] : sensorReadingsResult.data ?? [])) {
              const device = (sensorResult.data ?? []).find((item: any) => item.id === reading.device_id);
              platformRecords.push("Stored sensor reading [sensor_type=" + (device?.device_type || "unknown") + "; reading=" + reading.reading_type + "; value=" + reading.value + " " + reading.unit + "; quality=" + (reading.quality_indicator || "unreported") + "; recorded_at=" + reading.recorded_at + "; farm_id=" + (device?.farm_id || "unknown") + "; section_id=" + (device?.section_id || "unlinked") + "]. Stored telemetry record; not necessarily current.");
            }
            const activeCultivations = (cropResult.data ?? []).filter((item: any) => item.status === "active");
            farmContext = {
              governorate: farms.length === 1 && typeof firstLocation?.region === "string" ? firstLocation.region : undefined,
              crop: activeCultivations.length === 1 ? activeCultivations[0].crop_name : undefined,
              farmSizeHectares: rawSize > 0 ? rawSize : undefined,
              soil: Object.keys(soil).length ? soil : undefined,
              operationalAlerts,
              platformRecords,
            };
            farmContextStatus = "linked";

            const wantsLiveWeather = /(weather|météo|meteo|طقس|مطر|حرارة|ري|irrigation|arrosage|ns9i|s9i|matar|skhouna|bard|jaw|jew|ri7|rri7|nrawi)/i.test(userMessage);
            if (wantsLiveWeather) {
              const namedFarmMatches = farms.filter((farm: any) =>
                typeof farm.name === "string" && farm.name.trim().length >= 3 &&
                userMessage.toLocaleLowerCase().includes(farm.name.trim().toLocaleLowerCase())
              );
              const selectedWeatherFarm = farms.length === 1
                ? farms[0]
                : namedFarmMatches.length === 1 ? namedFarmMatches[0] : null;
              if (!selectedWeatherFarm) {
                platformRecords.push("Live farm-specific weather was not fetched because no unique farm was selected. The account has " + farms.length + " farms. Ask the user to mention one exact saved farm name before fetching its forecast.");
              } else {
                const farmLocation = selectedWeatherFarm.location && typeof selectedWeatherFarm.location === "object" ? selectedWeatherFarm.location : {};
                const lat = Number((farmLocation as any).lat);
                const lon = Number((farmLocation as any).lng ?? (farmLocation as any).lon);
                if (Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
                  try {
                    const liveWeather = await getWeatherFromOpenMeteo({
                      lat,
                      lon,
                      locationName: selectedWeatherFarm.name,
                      governorate: typeof (farmLocation as any).region === "string" ? (farmLocation as any).region : undefined,
                    });
                    const nextDays = liveWeather.forecast.daily.slice(0, 5).map(day =>
                      day.date + ": " + day.minTemp + "–" + day.maxTemp + " C; rainfall=" + day.rainfall + " mm; humidity=" + day.humidity + "%"
                    ).join(" | ");
                    if (farmContext) {
                      farmContext.temperature = liveWeather.current.temperature;
                      const todayRainfall = liveWeather.forecast.daily[0]?.rainfall;
                      if (typeof todayRainfall === "number" && Number.isFinite(todayRainfall)) {
                        farmContext.rainfall = todayRainfall;
                      }
                    }
                    platformRecords.push("LIVE WEATHER FROM OPEN-METEO for the selected farm " + selectedWeatherFarm.name + " [observation_time=" + (liveWeather.source.observationTime || "unreported") + "; provider=" + liveWeather.source.provider + "; current_temperature=" + liveWeather.current.temperature + " C; humidity=" + liveWeather.current.humidity + "%; wind=" + liveWeather.current.windSpeed + " km/h; conditions=" + liveWeather.current.description + "; ET0=" + liveWeather.agriculturalIndices.evapotranspiration + "; gridded_soil_moisture_estimate=" + liveWeather.agriculturalIndices.soilMoisture + "; crop_stress_indicator=" + liveWeather.agriculturalIndices.cropStress + "; next_days=" + nextDays + "]. Real provider forecast for farm coordinates, not an on-farm sensor measurement; soil moisture is a gridded model estimate.");
                  } catch (weatherError) {
                    platformRecords.push("Live Open-Meteo weather request failed for the registered farm; no live values were substituted. Existing dated weather records remain historical only. Provider error=" + (weatherError instanceof Error ? weatherError.message.slice(0, 180) : "unknown"));
                  }
                } else {
                  platformRecords.push("Live farm-specific weather unavailable: the single registered farm has no valid latitude/longitude in its saved location. Ask the user to update the farm coordinates; do not infer a location.");
                }
              }
            }
          }
        }
      }
    }

    const result = await answerAgriculturalQuestion({
      question: userMessage,
      language: language || detectLanguage(userMessage),
      context: farmContext,
      history: safeHistory,
    });
    const contextNote = farmContextStatus === "linked"
      ? "تم ربط الإجابة بسياق المزرعة المسجل في حسابك؛ القياسات غير المتوفرة لم يتم تخمينها."
      : farmContextStatus === "no_farms"
        ? "لا توجد مزرعة مسجلة في الحساب بعد؛ هذه إجابة عامة وليست تحليلاً خاصاً بمزرعتك."
        : farmContextStatus === "unavailable"
          ? "تعذّر جلب سياق المزرعة والتحقق منه؛ هذه إجابة عامة ولا تعتمد على بيانات مزرعة غير متاحة."
          : "لم يتم تقديم جلسة موثقة؛ هذه إجابة عامة.";
    res.json({ ...result, farmContextStatus, note: [result.note, contextNote].filter(Boolean).join(" "), correlationId });
  } catch (error) {
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

export const getSupportedCrops = async (req: Request, res: Response) => {
  try {
    const response = await callAIService(
      AI_SERVICES.CROP_RECOMMENDATION,
      "/supported-crops",
      "GET",
    );
    await respondFromMicroservice(res, response.data, AI_SERVICES.CROP_RECOMMENDATION);
  } catch (error) {
    // Do not substitute an unverified local crop catalogue when the source
    // service is unavailable. The UI must show an unavailable state.
    return handleAIServiceError(error as AxiosError, "Supported Crops", res);
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

const AI_SERVICES_HEALTH_CACHE_TTL_MS = 30_000;
let aiServicesHealthCache: { payload: Record<string, any>; checkedAt: number; key: string } | null = null;

export const getAIServicesHealth = async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const cacheKey = [
      AI_SERVICES.SOIL_ANALYSIS,
      AI_SERVICES.CROP_RECOMMENDATION,
      AI_SERVICES.IMAGE_DIAGNOSIS,
      AI_SERVICES.MARKET_FORECAST,
      AI_SERVICES.SMART_ASSISTANT,
      AI_SERVICES.SMART_MARKETPLACE,
      AI_SERVICES.PEST_CONTROL,
      AI_SERVICES.IRRIGATION_OPTIMIZATION,
    ].join("|");
    const cacheAgeMs = aiServicesHealthCache ? startTime - aiServicesHealthCache.checkedAt : Infinity;
    if (req.query.force !== "true" && aiServicesHealthCache && aiServicesHealthCache.key === cacheKey && cacheAgeMs < AI_SERVICES_HEALTH_CACHE_TTL_MS) {
      return res.json({
        ...aiServicesHealthCache.payload,
        cached: true,
        cacheAgeMs,
      });
    }

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
        if (!service.url) {
          return {
            ...service,
            status: "not_configured",
            responseTime: 0,
            lastChecked: new Date().toISOString(),
            error: "SERVICE_URL_NOT_CONFIGURED",
          };
        }
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
          const ruleBased =
            modelSource !== null && RULE_BASED_MODEL_SOURCE_RE.test(modelSource);
          return {
            ...service,
            status: "available",
            modelSource,
            modelKind: !modelSource ? "unknown" : heuristic ? "synthetic" : ruleBased ? "rule-based" : "model",
            // Deterministic rules and synthetic demos are not trained ML models.
            isRealModel: modelSource !== null && !heuristic && !ruleBased,
            modelTrainedOnSyntheticData: heuristic,
            responseTime: Date.now() - checkStart,
            lastChecked: new Date().toISOString()
          };
        } catch (error) {
          const statusCode = (error as AxiosError)?.response?.status;
          return {
            ...service,
            // An HTTP 429 is a real response from the service host: the host is
            // reachable, but its health endpoint is rate-limited. Do not count
            // it as an available inference service or claim the model is healthy.
            status: statusCode === 429 ? "rate_limited" : "unavailable",
            reachable: statusCode === 429,
            responseTime: Date.now() - checkStart,
            lastChecked: new Date().toISOString(),
            error: statusCode === 429
              ? "HTTP 429: health endpoint rate-limited; host responded, inference availability remains unverified"
              : (error as Error).message
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
    const unavailableCount = serviceResults.filter(s => s.status === "unavailable").length;
    const notConfiguredCount = serviceResults.filter(s => s.status === "not_configured").length;
    const rateLimitedCount = serviceResults.filter(s => s.status === "rate_limited").length;
    // A 429 confirms that the host responded, not that inference is available.
    const reachableCount = serviceResults.filter(
      (s: any) => s.status === "available" || s.status === "rate_limited" || s.reachable === true,
    ).length;
    // Services that answer /health but self-declare synthetic/heuristic models.
    const syntheticCount = serviceResults.filter(
      (s: any) => s.modelTrainedOnSyntheticData === true,
    ).length;
    const ruleBasedCount = serviceResults.filter(
      (s: any) => s.modelKind === "rule-based",
    ).length;

    const results = {
      overview: {
        totalServices: serviceResults.length,
        availableServices: availableCount,
        reachableServices: reachableCount,
        unavailableServices: unavailableCount + notConfiguredCount,
        notConfiguredServices: notConfiguredCount,
        rateLimitedServices: rateLimitedCount,
        /** Reachable services whose own /health reports a synthetic/heuristic model. */
        syntheticModelServices: syntheticCount,
        ruleBasedServices: ruleBasedCount,
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
        unavailableCount > 0 || notConfiguredCount > 0 || rateLimitedCount > 0 || syntheticCount > 0 || ruleBasedCount > 0
          ? [
              "بعض خدمات الذكاء الاصطناعي غير متاحة أو غير مضبوطة أو محدودة الطلبات أو غير موثّقة؛ لا يتم استخدام نتائج اصطناعية أو بدائل مخمّنة.",
              ruleBasedCount > 0 ? "بعض القدرات تعمل بمحركات قواعد حتمية، وليست نماذج تعلم آلي مدرّبة." : "",
            ].filter(Boolean).join(" ")
          : "كل الخدمات التي اجتازت فحص المصدر متاحة؛ يلزم التحقق الميداني لكل قدرة قبل اعتمادها زراعياً.",
    };

    // Cache the whole health snapshot briefly: the dashboard can be opened by
    // multiple components and repeated probes can trigger upstream/host 429s.
    aiServicesHealthCache = { payload: results, checkedAt: Date.now(), key: cacheKey };
    // Always return 200 status since unavailable services are expected in development
    res.json({ ...results, cached: false, cacheAgeMs: 0 });
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
