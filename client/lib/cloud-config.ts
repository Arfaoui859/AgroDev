// Browser-facing cloud configuration. The browser talks only to the Node
// API gateway; private Render/Python service URLs are resolved server-side.
export interface CloudConfig {
  apiBaseUrl: string;
  useCloudServices: boolean;
}

const isDevelopment = import.meta.env.DEV;

export const cloudConfig: CloudConfig = {
  apiBaseUrl:
    (import.meta.env.VITE_API_URL as string | undefined)?.trim() ||
    (isDevelopment ? "http://localhost:8080/api" : "/api"),
  // Retained for older deployment-info consumers. Direct browser-to-microservice
  // calls are deliberately disabled; all calls use the authenticated gateway.
  useCloudServices: false,
};

export interface ServiceStatus {
  service: string;
  url: string;
  isHealthy: boolean;
  lastChecked: Date;
  responseTime?: number;
}

const EXPECTED_SERVICES = [
  "soil_analysis",
  "crop_recommendation",
  "image_diagnosis",
  "market_forecast",
  "smart_assistant",
  "weather_yield",
  "pest_control",
  "irrigation_optimization",
] as const;

// Ask the backend gateway for service status. Browser probes cannot reliably
// reach private services and must not infer health from stale hard-coded URLs.
export const checkAllServicesHealth = async (): Promise<ServiceStatus[]> => {
  const checkedAt = new Date();
  try {
    const response = await fetch(`${cloudConfig.apiBaseUrl}/ai/health`, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    });
    if (!response.ok) {
      throw new Error(`AI gateway health returned HTTP ${response.status}`);
    }

    const payload = await response.json();
    const services = Array.isArray(payload.services) ? payload.services : [];
    const byKey = new Map(
      services.map((service: any) => [
        String(service.key || service.name || "").toLowerCase(),
        service,
      ]),
    );

    return EXPECTED_SERVICES.map((key) => {
      const service: any = byKey.get(key) || byKey.get(key.replaceAll("_", "-"));
      return {
        service: service?.nameAr || service?.name || key,
        url: "Node API gateway",
        isHealthy:
          service?.status === "available" ||
          service?.status === "healthy" ||
          service?.available === true,
        lastChecked: checkedAt,
        responseTime:
          typeof service?.responseTime === "number"
            ? service.responseTime
            : undefined,
      };
    });
  } catch (error) {
    console.warn("Gateway health check failed:", error);
    return EXPECTED_SERVICES.map((service) => ({
      service,
      url: "Node API gateway",
      isHealthy: false,
      lastChecked: checkedAt,
    }));
  }
};

export const validateEnvironment = (): {
  isValid: boolean;
  missing: string[];
} => {
  const requiredEnvVars = [
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_ANON_KEY",
  ];
  const missing = requiredEnvVars.filter(
    (varName) => !import.meta.env[varName],
  );
  return { isValid: missing.length === 0, missing };
};

export const getDeploymentInfo = () => ({
  environment: import.meta.env.MODE,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  useCloudServices: cloudConfig.useCloudServices,
  apiBaseUrl: cloudConfig.apiBaseUrl,
  buildTime: import.meta.env.VITE_BUILD_TIME || new Date().toISOString(),
  version: import.meta.env.VITE_APP_VERSION || "1.0.0",
});
