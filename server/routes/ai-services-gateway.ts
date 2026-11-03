import { Request, Response } from "express";
import axios, { AxiosError } from "axios";
import FormData from "form-data";
import multer from "multer";
import { uploadError } from "../middleware/upload";
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
import { getLLMInfo } from "../services/providers/llmProvider";
import { probeService } from "../services/providers/serviceProbe";

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
    return normalizeServiceUrl(process.env.MARKET_FORECAST_URL, "http://localhost:8004");
  },
  get SMART_ASSISTANT() {
    return normalizeServiceUrl(process.env.SMART_ASSISTANT_URL, "http://localhost:8005");
  },
  get SMART_MARKETPLACE() {
    return normalizeServiceUrl(process.env.SMART_MARKETPLACE_URL, "http://localhost:8006");
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

// 🌱 SOIL ANALYSIS ENDPOINTS
export const analyzeSoilData = async (req: Request, res: Response) => {
  const sensorData = req.body?.sensor_data ?? req.body ?? {};
  try {
    const response = await callAIService(
      AI_SERVICES.SOIL_ANALYSIS,
      "/analyze-soil",
      "POST",
      { sensor_data: sensorData, location: req.body?.location, farm_id: req.body?.farm_id },
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
  try {
    const response = await callAIService(
      AI_SERVICES.CROP_RECOMMENDATION,
      "/recommend-crops",
      "POST",
      req.body,
    );
    await respondFromMicroservice(res, response.data, AI_SERVICES.CROP_RECOMMENDATION);
  } catch (error) {
    console.warn(
      "Crop microservice unavailable, using rule-based recommendations:",
      (error as AxiosError).message,
    );
    const body = req.body ?? {};
    res.json(recommendCropsForUI(normaliseCropInput(body)));
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
    const response = await callAIService(
      AI_SERVICES.CROP_RECOMMENDATION,
      "/quick-recommendation",
      "POST",
      { temperature, rainfall, soil_ph, farm_size },
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
  try {
    const response = await callAIService(
      AI_SERVICES.CROP_RECOMMENDATION,
      "/compare-crops",
      "POST",
      req.body,
    );
    await respondFromMicroservice(res, response.data, AI_SERVICES.CROP_RECOMMENDATION);
  } catch (error) {
    handleAIServiceError(error as AxiosError, "Crop Comparison", res);
  }
};

// 📸 IMAGE DIAGNOSIS ENDPOINTS
export const detectPlantDisease = [
  upload.single("file"),
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

      await respondFromMicroservice(res, response.data, AI_SERVICES.IMAGE_DIAGNOSIS);
    } catch (error) {
      handleAIServiceError(error as AxiosError, "Plant Disease Detection", res);
    }
  },
];

export const analyzeLeafHealth = [
  upload.single("file"),
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

      await respondFromMicroservice(res, response.data, AI_SERVICES.IMAGE_DIAGNOSIS);
    } catch (error) {
      handleAIServiceError(error as AxiosError, "Leaf Analysis", res);
    }
  },
];

export const comprehensivePlantAnalysis = [
  upload.single("file"),
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

      await respondFromMicroservice(res, response.data, AI_SERVICES.IMAGE_DIAGNOSIS);
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

      await respondFromMicroservice(res, response.data, AI_SERVICES.IMAGE_DIAGNOSIS);
    } catch (error) {
      handleAIServiceError(error as AxiosError, "Quick Health Check", res);
    }
  },
];

// 📈 MARKET FORECAST ENDPOINTS (Placeholder for future implementation)
export const forecastMarketPrices = async (req: Request, res: Response) => {
  try {
    const response = await callAIService(
      AI_SERVICES.MARKET_FORECAST,
      "/forecast-prices",
      "POST",
      req.body,
    );
    await respondFromMicroservice(res, response.data, AI_SERVICES.MARKET_FORECAST);
  } catch (error) {
    handleAIServiceError(error as AxiosError, "Market Forecast", res);
  }
};

export const analyzeSupplyDemand = async (req: Request, res: Response) => {
  try {
    const response = await callAIService(
      AI_SERVICES.MARKET_FORECAST,
      "/analyze-supply-demand",
      "POST",
      req.body,
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

  if (!userMessage.trim()) {
    return res.status(400).json({ error: "message is required" });
  }

  try {
    const result = await answerAgriculturalQuestion({
      question: userMessage,
      language: language || detectLanguage(userMessage),
      context,
      history,
    });
    res.json(result);
  } catch (error) {
    console.error("Assistant error:", error);
    res.status(500).json({
      error: "تعذّر معالجة السؤال",
      dataAvailable: false,
    });
  }
};

export const generateFarmingTasks = async (req: Request, res: Response) => {
  try {
    const response = await callAIService(
      AI_SERVICES.SMART_ASSISTANT,
      "/generate-tasks",
      "POST",
      req.body,
    );
    await respondFromMicroservice(res, response.data, AI_SERVICES.SMART_ASSISTANT);
  } catch (error) {
    handleAIServiceError(error as AxiosError, "Farming Tasks Planner", res);
  }
};

export const getSmartAlerts = async (req: Request, res: Response) => {
  try {
    const response = await callAIService(
      AI_SERVICES.SMART_ASSISTANT,
      "/smart-alerts",
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
      }
    ];

    // Use a shorter timeout to avoid long delays when services are down
    const healthChecks = await Promise.allSettled(
      services.map(async (service) => {
        const checkStart = Date.now();
        try {
          const response = await axios.get(`${service.url}/health`, { timeout: 3000 });
          return {
            ...service,
            status: "available",
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

    const results = {
      overview: {
        totalServices: serviceResults.length,
        availableServices: availableCount,
        unavailableServices: unavailableCount,
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
