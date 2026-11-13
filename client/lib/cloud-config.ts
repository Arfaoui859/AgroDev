// Cloud Configuration for AI Services.
//
// AI microservice traffic is routed through the backend AI gateway, which tags
// provenance and fails closed for synthetic/unverified models. The browser must
// never call the microservice hosts directly: doing so would skip that gate and
// could surface synthetic output as a real result. So this config intentionally
// exposes only the backend base URL.
export interface CloudConfig {
  apiBaseUrl: string;
  fallbackToMock: boolean;
}

// Environment-based configuration
const getCloudConfig = (): CloudConfig => {
  const isDevelopment = import.meta.env.DEV;

  return {
    apiBaseUrl:
      import.meta.env.VITE_API_URL ||
      (isDevelopment ? "http://localhost:8080/api" : "/api"),
    // Mock output is opt-in for local demos only; production defaults to off.
    fallbackToMock: import.meta.env.VITE_FALLBACK_TO_MOCK === "true",
  };
};

export const cloudConfig = getCloudConfig();

// Get deployment status
export const getDeploymentInfo = () => {
  return {
    environment: import.meta.env.MODE,
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
    apiBaseUrl: cloudConfig.apiBaseUrl,
    buildTime: import.meta.env.VITE_BUILD_TIME || new Date().toISOString(),
    version: import.meta.env.VITE_APP_VERSION || "1.0.0",
  };
};
