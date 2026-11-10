export interface ServiceStatus {
  id: string;
  name: string;
  status: 'available' | 'unavailable' | 'checking' | 'error';
  endpoint?: string;
  description: string;
  lastChecked?: Date;
  errorMessage?: string;
  requiresLocal?: boolean;
  healthServiceKey?: string;
  modelSource?: string;
  advisoryModelSource?: string;
  advisoryConfigured?: boolean;
  isRealModel?: boolean;
  modelTrainedOnSyntheticData?: boolean;
}

export interface ServiceCategory {
  name: string;
  services: ServiceStatus[];
}

// Define all AI services and their status
export const AI_SERVICES: ServiceCategory[] = [
  {
    name: "Crop & Soil Analysis",
    services: [
      {
        id: "crop-recommendation",
        name: "Smart Crop Recommendations",
        status: "unavailable",
        endpoint: "/api/ai/health",
        healthServiceKey: "crop_recommendation",
        description: "AI-powered crop selection based on soil and climate conditions",
      },
      {
        id: "soil-analysis",
        name: "Soil Analysis AI",
        status: "unavailable", 
        endpoint: "/api/ai/health",
        healthServiceKey: "soil_analysis",
        description: "Intelligent soil health assessment and recommendations",
      },
      {
        id: "climate-crop-matcher",
        name: "Climate Crop Matcher",
        status: "unavailable",
        endpoint: "/api/ai/health",
        healthServiceKey: "soil_analysis", 
        description: "Match crops with climate conditions for optimal yield",
      }
    ]
  },
  {
    name: "Plant Health & Disease Detection",
    services: [
      {
        id: "plant-disease-detection",
        name: "Plant Disease Detection",
        status: "unavailable",
        endpoint: "/api/ai/health",
        healthServiceKey: "image_diagnosis",
        description: "Image-based plant disease identification and treatment recommendations",
      },
      {
        id: "leaf-scan",
        name: "Leaf Scan AI",
        status: "unavailable",
        endpoint: "/api/ai/health",
        healthServiceKey: "image_diagnosis",
        description: "Advanced leaf analysis for early disease detection",
      },
      {
        id: "pest-control",
        name: "Pest Control Recommender",
        status: "unavailable",
        endpoint: "/api/ai/health",
        healthServiceKey: "pest_control",
        description: "Intelligent pest identification and control strategies",
      }
    ]
  },
  {
    name: "Weather & Yield Intelligence", 
    services: [
      {
        id: "weather-yield-planner",
        name: "Smart Weather Crop Planner",
        status: "unavailable",
        endpoint: "/api/ai/health",
        healthServiceKey: "weather_yield",
        description: "Weather-based crop planning and yield optimization",
      },
      {
        id: "yield-predictor",
        name: "Yield Predictor AI",
        status: "unavailable", 
        endpoint: "/api/ai/health",
        healthServiceKey: "weather_yield",
        description: "Predict crop yields based on multiple factors",
      },
      {
        id: "irrigation-optimizer",
        name: "Smart Irrigation Optimizer",
        status: "unavailable",
        endpoint: "/api/ai/health",
        healthServiceKey: "irrigation_optimization",
        description: "Optimize irrigation schedules based on weather and soil data",
      }
    ]
  },
  {
    name: "Market Intelligence",
    services: [
      {
        id: "market-forecast",
        name: "Market Forecast AI",
        status: "unavailable",
        endpoint: "/api/ai/health",
        healthServiceKey: "market_forecast",
        description: "Predict market prices and demand trends",
      },
      {
        id: "supply-demand",
        name: "Supply Demand AI",
        status: "unavailable",
        endpoint: "/api/ai/health",
        healthServiceKey: "market_forecast",
        description: "Analyze supply and demand patterns for better decision making",
      },
      {
        id: "smart-match",
        name: "Smart Match AI",
        status: "unavailable",
        description: "No dedicated deployed service is registered in the current eight-service gateway.",
      }
    ]
  },
  {
    name: "Farm Management",
    services: [
      {
        id: "farming-tasks-planner",
        name: "Farming Tasks Planner",
        status: "unavailable",
        endpoint: "/api/ai/farming-tasks-planner", 
        healthServiceKey: "smart_assistant",
        description: "Intelligent farm task scheduling and planning",
      },
      {
        id: "agro-chat",
        name: "Agro Chat AI",
        status: "unavailable",
        endpoint: "/api/ai/agro-chat",
        healthServiceKey: "smart_assistant",
        description: "AI assistant for farming questions and guidance", 
      },
      {
        id: "alert-notifier",
        name: "Alert Notifier AI",
        status: "unavailable",
        endpoint: "/api/ai/alert-notifier",
        healthServiceKey: "smart_assistant",
        description: "Intelligent alert system for farm conditions",
      }
    ]
  }
];

// Database and core services
type GatewayServiceHealth = {
  key: string;
  status: string;
  modelSource?: string | null;
  advisoryModelSource?: string | null;
  advisoryConfigured?: boolean;
  isRealModel?: boolean;
  modelTrainedOnSyntheticData?: boolean;
  error?: string;
};

let gatewayHealthCache: { checkedAt: number; services: GatewayServiceHealth[] } | null = null;
let gatewayHealthInFlight: Promise<GatewayServiceHealth[]> | null = null;

async function getGatewayServiceHealth(): Promise<GatewayServiceHealth[]> {
  if (gatewayHealthCache && Date.now() - gatewayHealthCache.checkedAt < 15_000) {
    return gatewayHealthCache.services;
  }
  if (gatewayHealthInFlight) return gatewayHealthInFlight;

  gatewayHealthInFlight = (async () => {
    const response = await fetch("/api/ai/health", {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) {
      throw new Error(`AI gateway health returned HTTP ${response.status}`);
    }
    const payload = await response.json();
    if (!Array.isArray(payload.services)) {
      throw new Error("AI gateway health response has no services array");
    }
    const services = payload.services as GatewayServiceHealth[];
    gatewayHealthCache = { checkedAt: Date.now(), services };
    return services;
  })().finally(() => {
    gatewayHealthInFlight = null;
  });

  return gatewayHealthInFlight;
}

export const CORE_SERVICES: ServiceStatus[] = [
  {
    id: "supabase-db",
    name: "Supabase Database",
    status: "available",
    // Public, secret-free probe. The old /api/test/supabase endpoint is
    // admin-gated, so a correctly secured deployment reported the database as
    // unavailable even when it was healthy.
    endpoint: "/api/system/database",
    description: "PostgreSQL database with authentication"
  },
  {
    id: "supabase-auth", 
    name: "Supabase Authentication",
    status: "available",
    endpoint: "/api/system/auth",
    description: "User authentication and authorization"
  },
  {
    id: "offline-storage",
    name: "Offline Storage",
    status: "available", 
    description: "Local data storage for offline functionality"
  }
];

// Service status checker functions
export class ServiceStatusManager {
  private static instance: ServiceStatusManager;
  private statusCache = new Map<string, ServiceStatus>();
  private lastCheck = new Map<string, Date>();
  private inFlight = new Map<string, Promise<ServiceStatus>>();

  static getInstance(): ServiceStatusManager {
    if (!ServiceStatusManager.instance) {
      ServiceStatusManager.instance = new ServiceStatusManager();
    }
    return ServiceStatusManager.instance;
  }

  async checkServiceStatus(service: ServiceStatus): Promise<ServiceStatus> {
    const cacheKey = service.id;
    const now = new Date();
    const lastCheckTime = this.lastCheck.get(cacheKey);

    // Reuse a fresh cached result.
    if (
      lastCheckTime &&
      now.getTime() - lastCheckTime.getTime() < 30 * 1000
    ) {
      return this.statusCache.get(cacheKey) || service;
    }

    // Deduplicate concurrent probes for the same service.
    const pendingCheck = this.inFlight.get(cacheKey);
    if (pendingCheck) return pendingCheck;

    const checkPromise = (async (): Promise<ServiceStatus> => {
      const updatedService: ServiceStatus = {
        ...service,
        status: 'checking',
        lastChecked: new Date()
      };

      try {
        if (service.healthServiceKey) {
          const gatewayServices = await getGatewayServiceHealth();
          const serviceHealth = gatewayServices.find(
            item => item.key === service.healthServiceKey,
          );
          if (!serviceHealth) throw new Error(`No health entry for ${service.healthServiceKey}`);
          updatedService.status = serviceHealth.status === 'available' ? 'available' : 'unavailable';
          updatedService.modelSource = typeof serviceHealth.modelSource === 'string' ? serviceHealth.modelSource : undefined;
          updatedService.advisoryModelSource = typeof serviceHealth.advisoryModelSource === 'string' ? serviceHealth.advisoryModelSource : undefined;
          updatedService.advisoryConfigured = serviceHealth.advisoryConfigured === true;
          updatedService.isRealModel = serviceHealth.isRealModel === true;
          updatedService.modelTrainedOnSyntheticData = serviceHealth.modelTrainedOnSyntheticData === true;
          updatedService.errorMessage = serviceHealth.error;
          updatedService.lastChecked = new Date();
          this.statusCache.set(cacheKey, updatedService);
          this.lastCheck.set(cacheKey, updatedService.lastChecked);
          return updatedService;
        }
        if (service.endpoint) {
          const response = await fetch(service.endpoint, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });

          if (!response.ok) {
            updatedService.status = 'unavailable';
            updatedService.errorMessage =
              `HTTP ${response.status}: ${response.statusText}`;
          } else {
            let declaredAvailable = true;
            let declaredReason: string | undefined;

            try {
              const body = await response.clone().json();

              if (typeof body?.available === 'boolean') {
                declaredAvailable = body.available;

                if (!declaredAvailable) {
                  declaredReason =
                    body.requiresConfiguration ||
                    body.provenance ||
                    'Not configured';
                }
              }
            } catch {
              // A non-JSON 2xx response is treated as available.
            }

            updatedService.status = declaredAvailable
              ? 'available'
              : 'unavailable';

            updatedService.errorMessage = declaredReason;
          }
        } else {
          // Preserve the configured status of local-only services.
          updatedService.status = service.status;
          updatedService.errorMessage = service.errorMessage;
        }
      } catch (error) {
        updatedService.status = 'error';
        updatedService.errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
      }

      this.statusCache.set(cacheKey, updatedService);
      this.lastCheck.set(cacheKey, updatedService.lastChecked!);

      return updatedService;
    })();

    const trackedPromise = checkPromise.finally(() => {
      this.inFlight.delete(cacheKey);
    });

    this.inFlight.set(cacheKey, trackedPromise);
    return trackedPromise;
  }

  async checkAllServices(): Promise<{ aiServices: ServiceCategory[], coreServices: ServiceStatus[] }> {
    const aiServicePromises = AI_SERVICES.map(async (category) => ({
      ...category,
      services: await Promise.all(
        category.services.map(service => this.checkServiceStatus(service))
      )
    }));

    const coreServicePromises = CORE_SERVICES.map(service => this.checkServiceStatus(service));

    const [aiServices, coreServices] = await Promise.all([
      Promise.all(aiServicePromises),
      Promise.all(coreServicePromises)
    ]);

    return { aiServices, coreServices };
  }

  getServiceById(serviceId: string): ServiceStatus | undefined {
    // Check AI services
    for (const category of AI_SERVICES) {
      const service = category.services.find(s => s.id === serviceId);
      if (service) return service;
    }
    
    // Check core services
    return CORE_SERVICES.find(s => s.id === serviceId);
  }

  isServiceAvailable(serviceId: string): boolean {
    const cached = this.statusCache.get(serviceId);
    return cached?.status === 'available' || false;
  }
}

export const serviceStatusManager = ServiceStatusManager.getInstance();
