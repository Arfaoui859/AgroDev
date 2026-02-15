import { Request, Response } from "express";
import axios, { AxiosError } from "axios";
import FormData from "form-data";
import multer from "multer";

// AI Services Configuration
const AI_SERVICES = {
  SOIL_ANALYSIS: process.env.SOIL_ANALYSIS_URL || "http://localhost:8001",
  CROP_RECOMMENDATION:
    process.env.CROP_RECOMMENDATION_URL || "http://localhost:8002",
  IMAGE_DIAGNOSIS: process.env.IMAGE_DIAGNOSIS_URL || "http://localhost:8003",
  MARKET_FORECAST: process.env.MARKET_FORECAST_URL || "http://localhost:8004",
  SMART_ASSISTANT: process.env.SMART_ASSISTANT_URL || "http://localhost:8005",
  SMART_MARKETPLACE:
    process.env.SMART_MARKETPLACE_URL || "http://localhost:8006",
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
      cb(new Error("Only image files are allowed"), false);
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

// 🌱 SOIL ANALYSIS ENDPOINTS
export const analyzeSoilData = async (req: Request, res: Response) => {
  try {
    const response = await callAIService(
      AI_SERVICES.SOIL_ANALYSIS,
      "/analyze-soil",
      "POST",
      req.body,
    );
    res.json(response.data);
  } catch (error) {
    handleAIServiceError(error as AxiosError, "Soil Analysis", res);
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
    res.json(response.data);
  } catch (error) {
    handleAIServiceError(error as AxiosError, "Climate Crop Matcher", res);
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

      res.json(response.data);
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
    res.json(response.data);
  } catch (error) {
    handleAIServiceError(error as AxiosError, "Crop Recommender", res);
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
    res.json(response.data);
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
    res.json(response.data);
  } catch (error) {
    handleAIServiceError(error as AxiosError, "Crop Comparison", res);
  }
};

export const getQuickCropRecommendation = async (
  req: Request,
  res: Response,
) => {
  try {
    const { temperature, rainfall, soil_ph, farm_size } = req.query;

    const response = await callAIService(
      AI_SERVICES.CROP_RECOMMENDATION,
      "/quick-recommendation",
      "POST",
      {
        temperature: parseFloat(temperature as string),
        rainfall: parseFloat(rainfall as string),
        soil_ph: parseFloat(soil_ph as string),
        farm_size: parseFloat(farm_size as string) || 2.0,
      },
    );
    res.json(response.data);
  } catch (error) {
    handleAIServiceError(error as AxiosError, "Quick Crop Recommendation", res);
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

      res.json(response.data);
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

      res.json(response.data);
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

      res.json(response.data);
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

      res.json(response.data);
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
    res.json(response.data);
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
    res.json(response.data);
  } catch (error) {
    handleAIServiceError(error as AxiosError, "Supply Demand Analysis", res);
  }
};

// 🧠 SMART ASSISTANT ENDPOINTS (Placeholder for future implementation)
export const chatWithAIAssistant = async (req: Request, res: Response) => {
  try {
    const response = await callAIService(
      AI_SERVICES.SMART_ASSISTANT,
      "/chat",
      "POST",
      req.body,
    );
    res.json(response.data);
  } catch (error) {
    handleAIServiceError(error as AxiosError, "AI Chat Assistant", res);
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
    res.json(response.data);
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
    res.json(response.data);
  } catch (error) {
    handleAIServiceError(error as AxiosError, "Smart Alerts", res);
  }
};

// HELPER ENDPOINTS
export const getSupportedCrops = async (req: Request, res: Response) => {
  try {
    const response = await callAIService(
      AI_SERVICES.CROP_RECOMMENDATION,
      "/supported-crops",
      "GET",
    );
    res.json(response.data);
  } catch (error) {
    handleAIServiceError(error as AxiosError, "Supported Crops", res);
  }
};

export const getSupportedDiseases = async (req: Request, res: Response) => {
  try {
    const response = await callAIService(
      AI_SERVICES.IMAGE_DIAGNOSIS,
      "/supported-diseases",
      "GET",
    );
    res.json(response.data);
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
        checkDuration: Date.now() - startTime
      },
      services: serviceResults,
      note: unavailableCount > 0 ? "بعض خدمات الذكاء الاصطناعي غير متاحة حاليا. هذا طبيعي في بيئة التطوير." : "جميع خدمات الذكاء الاصطناعي تعمل بشكل طبيعي"
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
