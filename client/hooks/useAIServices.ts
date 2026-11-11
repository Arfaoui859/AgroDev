import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { cloudConfig } from "@/lib/cloud-config";

// Types for AI Service responses
interface SoilAnalysisResult {
  /**
   * Provenance of the result:
   *  - "microservice": produced by a self-hosted AI microservice (demo-grade models)
   *  - "rule-based": produced by the server's deterministic agronomy engine
   *  - "estimate": produced locally from the farmer's own inputs (no model)
   */
  dataSource?: "microservice" | "rule-based" | "estimate";
  soil_type: {
    classification: string;
    confidence: number;
  };
  properties: Record<string, any>;
  health_score: number | null;
  fertility_level: string;
  overall_recommendations: string[];
  analysis_timestamp: string;
}

interface CropRecommendationResult {
  recommendations: Array<{
    rank: number;
    crop: string;
    name_ar: string;
    category: string;
    suitability_score: number;
    predicted_yield_per_hectare: number;
    profit_analysis: {
      net_profit: number;
      roi_percent: number;
      profit_margin_percent: number;
    };
    risk_assessment: {
      overall_risk_score: number;
      overall_risk_level: string;
    };
  }>;
  best_recommendation: any;
  overall_analysis: any;
  seasonal_advice: any;
}

interface DiseaseDetectionResult {
  disease_detection: {
    primary_disease: {
      disease: string;
      disease_name_ar: string;
      probability: number;
    };
    top_predictions: Array<{
      disease: string;
      disease_name_ar: string;
      probability: number;
      severity_level: string;
    }>;
    confidence_score: number;
  };
  severity_assessment: {
    severity_score: number;
    severity_level: string;
    affected_area_percentage: number;
    urgency_level: string;
  };
  treatment_plan: {
    immediate_treatment: string[];
    estimated_recovery_time: string;
  };
  health_score: {
    health_score: number;
    health_category: string;
  };
}

interface LeafAnalysisResult {
  leaf_nutrition: {
    primary_deficiency: {
      type: string;
      name_ar: string;
      probability: number;
      severity_score: number;
      severity_stage: string;
    };
    nutritional_health_score: number;
    nutrition_status_available: boolean;
    nutrition_recommendations: string[];
  };
  growth_assessment: {
    overall_growth_score: number;
    development_indicators: {
      size_adequacy: string;
      structural_development: string;
      maturity_level: string;
    };
  };
  health_evaluation: {
    overall_health_score: number;
    health_category: string;
    health_status: string;
  };
  overall_leaf_score: {
    overall_score: number;
    quality_grade: string;
    quality_description: string;
  };
}

// All AI requests go through the Node API gateway.
const API_BASE = cloudConfig.apiBaseUrl;

if (import.meta.env.DEV) {
  console.info("AgroGrowth AI gateway:", API_BASE);
}

// Robust fetch wrapper to handle external script interference
const robustFetch = async (
  url: string,
  options: RequestInit = {},
): Promise<Response> => {
  // Check if this is a relative URL and convert to absolute
  const resolvedUrl = url.startsWith("/")
    ? `${window.location.origin}${url}`
    : url;

  // Try native fetch first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await window.fetch(resolvedUrl, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    console.warn("Native fetch failed, attempting fallback:", error);

    // If native fetch fails due to external script interference, try XMLHttpRequest
    if (error instanceof TypeError || error instanceof DOMException) {
      console.warn("Using XMLHttpRequest fallback due to fetch interference");

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const method = options.method || "GET";

        try {
          xhr.open(method, resolvedUrl);

          // Set headers (but not Content-Type for FormData - let browser set it)
          if (options.headers && !(options.body instanceof FormData)) {
            Object.entries(options.headers).forEach(([key, value]) => {
              if (
                key.toLowerCase() !== "content-type" ||
                !(options.body instanceof FormData)
              ) {
                xhr.setRequestHeader(key, value as string);
              }
            });
          }

          xhr.onload = () => {
            try {
              const responseHeaders: Record<string, string> = {};
              const headerString = xhr.getAllResponseHeaders();
              headerString.split("\r\n").forEach((line) => {
                const [key, value] = line.split(": ");
                if (key && value) responseHeaders[key] = value;
              });

              const response = new Response(xhr.responseText, {
                status: xhr.status,
                statusText: xhr.statusText,
                headers: new Headers(responseHeaders),
              });
              resolve(response);
            } catch (responseError) {
              reject(new Error(`Failed to create response: ${responseError}`));
            }
          };

          xhr.onerror = () => reject(new Error("XMLHttpRequest network error"));
          xhr.ontimeout = () => reject(new Error("XMLHttpRequest timeout"));
          xhr.onabort = () => reject(new Error("XMLHttpRequest aborted"));
          xhr.timeout = 30000;

          if (options.body) {
            xhr.send(options.body as XMLHttpRequestBodyInit);
          } else {
            xhr.send();
          }
        } catch (xhrError) {
          reject(new Error(`Failed to setup XMLHttpRequest: ${xhrError}`));
        }
      });
    }

    // Re-throw the original error if it's not a fetch interference issue
    throw error;
  }
};

// Custom hook for AI Services with Cloud Support
export const useAIServices = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // All inference is routed through the authenticated Node API gateway.
  // Python microservices may be private Render services and must never be
  // called directly from the browser.
  const smartApiCall = useCallback(
    async (
      endpoint: string,
      _serviceType?: string,
      options: RequestInit = {},
    ) => {
      const response = await robustFetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers ? (options.headers as Record<string, string>) : {}),
        },
      });

      if (!response.ok) {
        if (response.status === 503 || response.status === 502) {
          throw new Error(
            `Service temporarily unavailable (${response.status}). The AI gateway or its provider is unavailable.`,
          );
        }
        if (response.status === 404) {
          throw new Error(
            `API endpoint not found (${response.status}). Please check the backend route.`,
          );
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`,
        );
      }

      return response.json();
    },
    [],
  );

  // Regular API call for backwards compatibility
  const apiCall = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      return smartApiCall(endpoint, undefined, options);
    },
    [],
  );

  // Uploads also pass through the Node gateway; private service URLs and
  // provider credentials never reach the browser.
  const smartFileUploadCall = useCallback(
    async (
      endpoint: string,
      file: File,
      _serviceType?: string,
      additionalData?: Record<string, string>,
    ) => {
      const formData = new FormData();
      formData.append("file", file);

      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }

      const response = await robustFetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`,
        );
      }

      return response.json();
    },
    [],
  );

  // File upload call for backwards compatibility
  const fileUploadCall = useCallback(
    async (
      endpoint: string,
      file: File,
      additionalData?: Record<string, string>,
    ) => {
      return smartFileUploadCall(endpoint, file, undefined, additionalData);
    },
    [],
  );

  // 🌱 SOIL ANALYSIS SERVICES
  const analyzeSoilData = useCallback(
    async (sensorData: Record<string, number>): Promise<SoilAnalysisResult> => {
      setLoading(true);
      try {
        const result = await smartApiCall("/ai/soil/analyze", "soil", {
          method: "POST",
          body: JSON.stringify({ sensor_data: sensorData }),
        });

        toast({
          title: "تم تحليل التربة بنجاح",
          description: `مستوى الخصوبة: ${result.fertility_level}`,
        });

        return result;
      } catch (error) {
        console.error("Soil analysis request failed:", error);
        toast({
          title: "تعذر إكمال تحليل التربة",
          description:
            error instanceof Error
              ? error.message
              : "خدمة التحليل غير متاحة حالياً. لم يتم إنشاء نتيجة بديلة أو بيانات تقديرية.",
          variant: "destructive",
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  const matchCropsToClimate = useCallback(
    async (
      climateData: Record<string, any>,
      soilData?: Record<string, any>,
    ) => {
      setLoading(true);
      try {
        const result = await smartApiCall("/ai/soil/match-crops", "soil", {
          method: "POST",
          body: JSON.stringify({
            climate_data: climateData,
            soil_data: soilData,
          }),
        });

        toast({
          title: "تم مطابقة المحاصيل بنجاح",
          description: `تم العثور على ${result.suitable_crops?.length || 0} محصول مناسب`,
        });

        return result;
      } catch (error) {
        toast({
          title: "خطأ في مطابقة المحاصيل",
          description:
            error instanceof Error ? error.message : "حدث خطأ غير متوقع",
          variant: "destructive",
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  const diagnoseSoilFromImage = useCallback(
    async (imageFile: File) => {
      setLoading(true);
      try {
        const result = await smartFileUploadCall(
          "/ai/soil/diagnose-image",
          imageFile,
          "soil",
        );

        toast({
          title: "تم تشخيص التربة من الصورة",
          description: `نوع التربة: ${result.soil_classification?.classification}`,
        });

        return result;
      } catch (error) {
        toast({
          title: "خطأ في تشخيص التربة",
          description:
            error instanceof Error ? error.message : "حدث خطأ غير متوقع",
          variant: "destructive",
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  // 🌾 CROP RECOMMENDATION SERVICES
  const getSmartCropRecommendations = useCallback(
    async (
      inputData: Record<string, any>,
    ): Promise<CropRecommendationResult> => {
      setLoading(true);
      try {
        const result = await smartApiCall("/ai/crops/recommend", "crops", {
          method: "POST",
          body: JSON.stringify(inputData),
        });

        toast({
          title: "تم إنشاء التوصيات الذكية",
          description: `أفضل محصول: ${result.best_recommendation?.name_ar || "غير محدد"}`,
        });

        return result;
      } catch (error) {
        toast({
          title: "خطأ في توصيات المحاصيل",
          description:
            error instanceof Error ? error.message : "حدث خطأ غير متوقع",
          variant: "destructive",
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  const estimateCropProfitability = useCallback(
    async (cropData: Record<string, any>) => {
      setLoading(true);
      try {
        const result = await smartApiCall(
          "/ai/crops/estimate-profit",
          "crops",
          {
            method: "POST",
            body: JSON.stringify(cropData),
          },
        );

        toast({
          title: "تم تقدير الربحية",
          description: `العائد المتوقع: ${result.financial_analysis?.roi_percent?.toFixed(1)}%`,
        });

        return result;
      } catch (error) {
        toast({
          title: "خطأ في تقدير الربحية",
          description:
            error instanceof Error ? error.message : "حدث خطأ غير متوقع",
          variant: "destructive",
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  const compareCropProfitability = useCallback(
    async (cropsData: Array<Record<string, any>>) => {
      setLoading(true);
      try {
        const result = await smartApiCall("/ai/crops/compare", "crops", {
          method: "POST",
          body: JSON.stringify({ crops_data: cropsData }),
        });

        toast({
          title: "تم مقارنة المحاصيل",
          description: `تم مقارنة ${cropsData.length} محصول`,
        });

        return result;
      } catch (error) {
        toast({
          title: "خطأ في مقارنة المحاصيل",
          description:
            error instanceof Error ? error.message : "حدث خطأ غير متوقع",
          variant: "destructive",
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  const getQuickCropRecommendation = useCallback(
    async (
      temperature: number,
      rainfall: number,
      soilPh: number,
      farmSize: number = 2.0,
    ) => {
      setLoading(true);
      try {
        const result = await smartApiCall(
          `/ai/crops/quick-recommend?temperature=${temperature}&rainfall=${rainfall}&soil_ph=${soilPh}&farm_size=${farmSize}`,
          "crops",
        );

        toast({
          title: "توصية سريعة",
          description: `أفضل محصول: ${result.best_crop?.crop_name_ar || "غير محدد"}`,
        });

        return result;
      } catch (error) {
        toast({
          title: "خطأ في التوصية السريعة",
          description:
            error instanceof Error ? error.message : "حدث خطأ غير متوقع",
          variant: "destructive",
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  // 📸 IMAGE DIAGNOSIS SERVICES
  const detectPlantDisease = useCallback(
    async (
      imageFile: File,
      plantType?: string,
    ): Promise<DiseaseDetectionResult> => {
      setLoading(true);
      try {
        const additionalData =
          plantType && plantType !== "unspecified"
            ? { plant_type: plantType }
            : undefined;
        const result = await smartFileUploadCall(
          "/ai/images/detect-disease",
          imageFile,
          "images",
          additionalData,
        );

        const primaryDisease = result.disease_detection?.primary_disease;
        toast({
          title: "تم تشخيص النبات",
          description: `التشخيص: ${primaryDisease?.disease_name_ar || "غير محدد"}`,
          variant:
            primaryDisease?.disease === "healthy" ? "default" : "destructive",
        });

        return result;
      } catch (error) {
        toast({
          title: "خطأ في تشخيص المرض",
          description:
            error instanceof Error ? error.message : "حدث خطأ غير متوقع",
          variant: "destructive",
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  const analyzeLeafHealth = useCallback(
    async (
      imageFile: File,
      plantType?: string,
      growthStage?: string,
    ): Promise<LeafAnalysisResult> => {
      setLoading(true);
      try {
        const additionalData: Record<string, string> = {};
        if (plantType && plantType !== "unspecified")
          additionalData.plant_type = plantType;
        if (growthStage && growthStage !== "unspecified")
          additionalData.growth_stage = growthStage;

        const result = await smartFileUploadCall(
          "/ai/images/analyze-leaf",
          imageFile,
          "images",
          Object.keys(additionalData).length > 0 ? additionalData : undefined,
        );

        toast({
          title: "تم تحليل الورقة",
          description: `الدرجة الإجمالية: ${result.overall_leaf_score?.quality_grade || "غير محدد"}`,
        });

        return result;
      } catch (error) {
        toast({
          title: "خطأ في تحليل الورقة",
          description:
            error instanceof Error ? error.message : "حدث خطأ غير متوقع",
          variant: "destructive",
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  const comprehensivePlantAnalysis = useCallback(
    async (
      imageFile: File,
      plantType?: string,
      growthStage?: string,
      analysisFocus: string = "comprehensive",
    ) => {
      setLoading(true);
      try {
        const additionalData: Record<string, string> = {
          analysis_focus: analysisFocus,
        };
        if (plantType && plantType !== "unspecified")
          additionalData.plant_type = plantType;
        if (growthStage && growthStage !== "unspecified")
          additionalData.growth_stage = growthStage;

        const result = await smartFileUploadCall(
          "/ai/images/analyze-plant",
          imageFile,
          "images",
          additionalData,
        );

        toast({
          title: "تم التحليل الشامل",
          description: `النتيجة الإجمالية: ${result.overall_plant_health?.score?.toFixed(1) || "غير محدد"}%`,
        });

        return result;
      } catch (error) {
        toast({
          title: "خطأ في التحليل الشامل",
          description:
            error instanceof Error ? error.message : "حدث خطأ غير متوقع",
          variant: "destructive",
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  const quickPlantHealthCheck = useCallback(
    async (imageFile: File) => {
      setLoading(true);
      try {
        const result = await smartFileUploadCall(
          "/ai/images/quick-health-check",
          imageFile,
          "images",
        );

        toast({
          title: "فحص سريع",
          description: `الحالة: ${result.overall_status}`,
          variant: result.needs_immediate_attention ? "destructive" : "default",
        });

        return result;
      } catch (error) {
        toast({
          title: "خطأ في الفحص السريع",
          description:
            error instanceof Error ? error.message : "حدث خطأ غير متوقع",
          variant: "destructive",
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  // HELPER SERVICES
  const getSupportedCrops = useCallback(async () => {
    try {
      return await smartApiCall("/ai/crops/supported", "crops");
    } catch (error) {
      toast({
        title: "خطأ في جلب المحاصيل المدعومة",
        description:
          error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const getSupportedDiseases = useCallback(async () => {
    try {
      return await smartApiCall("/ai/images/supported-diseases", "images");
    } catch (error) {
      toast({
        title: "خطأ في جلب الأمراض المدعومة",
        description:
          error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const checkAIServicesHealth = useCallback(async () => {
    try {
      // The backend gateway is authoritative: it checks all eight private
      // services and returns each service's actual model provenance. Browser
      // probes only cover a subset and cannot reliably reach private services.
      return await smartApiCall("/ai/health");
    } catch (error) {
      console.warn("AI services health check failed:", error);
      return {
        overview: {
          totalServices: 8,
          availableServices: 0,
          unavailableServices: 8,
          syntheticModelServices: 0,
        },
        services: [],
        error: error instanceof Error ? error.message : "AI health check failed",
      };
    }
  }, [smartApiCall]);

  return {
    loading,
    // Soil Analysis
    analyzeSoilData,
    matchCropsToClimate,
    diagnoseSoilFromImage,
    // Crop Recommendations
    getSmartCropRecommendations,
    estimateCropProfitability,
    compareCropProfitability,
    getQuickCropRecommendation,
    // Image Diagnosis
    detectPlantDisease,
    analyzeLeafHealth,
    comprehensivePlantAnalysis,
    quickPlantHealthCheck,
    // Helper functions
    getSupportedCrops,
    getSupportedDiseases,
    checkAIServicesHealth,
  };
};
