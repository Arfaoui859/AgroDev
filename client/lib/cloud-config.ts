// Cloud Configuration for AI Services
export interface CloudConfig {
  apiBaseUrl: string;
  soilAnalysisUrl: string;
  cropRecommendationUrl: string;
  imageDiagnosisUrl: string;
  marketPredictionUrl: string;
  intelligentAgentUrl: string;
  useCloudServices: boolean;
  fallbackToMock: boolean;
}

// Environment-based configuration
const getCloudConfig = (): CloudConfig => {
  const isDevelopment = import.meta.env.DEV;
  const useCloud = import.meta.env.VITE_USE_CLOUD_SERVICES === "true";

  return {
    apiBaseUrl:
      import.meta.env.VITE_API_URL ||
      (isDevelopment ? "http://localhost:8080/api" : "/api"),
    soilAnalysisUrl:
      import.meta.env.VITE_SOIL_ANALYSIS_URL ||
      "https://agrogrowth-soil-analysis.railway.app",
    cropRecommendationUrl:
      import.meta.env.VITE_CROP_RECOMMENDATION_URL ||
      "https://agrogrowth-crop-recommendation.railway.app",
    imageDiagnosisUrl:
      import.meta.env.VITE_IMAGE_DIAGNOSIS_URL ||
      "https://agrogrowth-image-diagnosis.railway.app",
    marketPredictionUrl:
      import.meta.env.VITE_MARKET_PREDICTION_URL ||
      "https://agrogrowth-market-prediction.railway.app",
    intelligentAgentUrl:
      import.meta.env.VITE_INTELLIGENT_AGENT_URL ||
      "https://agrogrowth-intelligent-agent.railway.app",
    useCloudServices: useCloud && !isDevelopment,
    fallbackToMock: import.meta.env.VITE_FALLBACK_TO_MOCK !== "false",
  };
};

export const cloudConfig = getCloudConfig();

// Service health checker
export const checkServiceHealth = async (
  serviceUrl: string,
): Promise<boolean> => {
  try {
    const response = await fetch(`${serviceUrl}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    return response.ok;
  } catch (error) {
    console.warn(`Service ${serviceUrl} is not healthy:`, error);
    return false;
  }
};

// Service status interface
export interface ServiceStatus {
  service: string;
  url: string;
  isHealthy: boolean;
  lastChecked: Date;
  responseTime?: number;
}

// Check all services health
export const checkAllServicesHealth = async (): Promise<ServiceStatus[]> => {
  const services = [
    { name: "soil-analysis", url: cloudConfig.soilAnalysisUrl },
    { name: "crop-recommendation", url: cloudConfig.cropRecommendationUrl },
    { name: "image-diagnosis", url: cloudConfig.imageDiagnosisUrl },
    { name: "market-prediction", url: cloudConfig.marketPredictionUrl },
    { name: "intelligent-agent", url: cloudConfig.intelligentAgentUrl },
  ];

  const healthChecks = await Promise.allSettled(
    services.map(async (service) => {
      const startTime = Date.now();
      const isHealthy = await checkServiceHealth(service.url);
      const responseTime = Date.now() - startTime;

      return {
        service: service.name,
        url: service.url,
        isHealthy,
        lastChecked: new Date(),
        responseTime,
      };
    }),
  );

  return healthChecks.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    } else {
      return {
        service: services[index].name,
        url: services[index].url,
        isHealthy: false,
        lastChecked: new Date(),
        responseTime: undefined,
      };
    }
  });
};

// Robust fetch with retry logic
export const robustCloudFetch = async (
  url: string,
  options: RequestInit = {},
  retries: number = 3,
): Promise<Response> => {
  let lastError: Error;

  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return response;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      lastError = error as Error;
      console.warn(`Attempt ${i + 1} failed for ${url}:`, error);

      if (i < retries - 1) {
        // Exponential backoff
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, i) * 1000),
        );
      }
    }
  }

  throw lastError!;
};

// Environment variable checker
export const validateEnvironment = (): {
  isValid: boolean;
  missing: string[];
} => {
  const requiredEnvVars = [
    "VITE_API_URL",
    "VITE_SOIL_ANALYSIS_URL",
    "VITE_CROP_RECOMMENDATION_URL",
    "VITE_IMAGE_DIAGNOSIS_URL",
  ];

  const missing = requiredEnvVars.filter(
    (varName) => !import.meta.env[varName],
  );

  return {
    isValid: missing.length === 0,
    missing,
  };
};

// Get deployment status
export const getDeploymentInfo = () => {
  return {
    environment: import.meta.env.MODE,
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
    useCloudServices: cloudConfig.useCloudServices,
    apiBaseUrl: cloudConfig.apiBaseUrl,
    buildTime: import.meta.env.VITE_BUILD_TIME || new Date().toISOString(),
    version: import.meta.env.VITE_APP_VERSION || "1.0.0",
  };
};
