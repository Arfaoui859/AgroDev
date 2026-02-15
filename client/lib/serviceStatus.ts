export interface ServiceStatus {
  id: string;
  name: string;
  status: 'available' | 'unavailable' | 'checking' | 'error';
  endpoint?: string;
  description: string;
  lastChecked?: Date;
  errorMessage?: string;
  requiresLocal?: boolean;
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
        endpoint: "/api/ai/crop-recommendation",
        description: "AI-powered crop selection based on soil and climate conditions",
        requiresLocal: true
      },
      {
        id: "soil-analysis",
        name: "Soil Analysis AI",
        status: "unavailable", 
        endpoint: "/api/ai/soil-analysis",
        description: "Intelligent soil health assessment and recommendations",
        requiresLocal: true
      },
      {
        id: "climate-crop-matcher",
        name: "Climate Crop Matcher",
        status: "unavailable",
        endpoint: "/api/ai/climate-crop-matcher", 
        description: "Match crops with climate conditions for optimal yield",
        requiresLocal: true
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
        endpoint: "/api/ai/plant-disease-detection",
        description: "Image-based plant disease identification and treatment recommendations",
        requiresLocal: true
      },
      {
        id: "leaf-scan",
        name: "Leaf Scan AI",
        status: "unavailable",
        endpoint: "/api/ai/leaf-scan",
        description: "Advanced leaf analysis for early disease detection",
        requiresLocal: true
      },
      {
        id: "pest-control",
        name: "Pest Control Recommender",
        status: "unavailable",
        endpoint: "/api/ai/pest-control",
        description: "Intelligent pest identification and control strategies",
        requiresLocal: true
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
        endpoint: "/api/ai/weather-yield-planner",
        description: "Weather-based crop planning and yield optimization",
        requiresLocal: true
      },
      {
        id: "yield-predictor",
        name: "Yield Predictor AI",
        status: "unavailable", 
        endpoint: "/api/ai/yield-predictor",
        description: "Predict crop yields based on multiple factors",
        requiresLocal: true
      },
      {
        id: "irrigation-optimizer",
        name: "Smart Irrigation Optimizer",
        status: "unavailable",
        endpoint: "/api/ai/irrigation-optimizer",
        description: "Optimize irrigation schedules based on weather and soil data",
        requiresLocal: true
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
        endpoint: "/api/ai/market-forecast",
        description: "Predict market prices and demand trends",
        requiresLocal: true
      },
      {
        id: "supply-demand",
        name: "Supply Demand AI",
        status: "unavailable",
        endpoint: "/api/ai/supply-demand",
        description: "Analyze supply and demand patterns for better decision making",
        requiresLocal: true
      },
      {
        id: "smart-match",
        name: "Smart Match AI",
        status: "unavailable",
        endpoint: "/api/ai/smart-match",
        description: "Match farmers with buyers and optimize pricing",
        requiresLocal: true
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
        description: "Intelligent farm task scheduling and planning",
        requiresLocal: true
      },
      {
        id: "agro-chat",
        name: "Agro Chat AI",
        status: "unavailable",
        endpoint: "/api/ai/agro-chat",
        description: "AI assistant for farming questions and guidance", 
        requiresLocal: true
      },
      {
        id: "alert-notifier",
        name: "Alert Notifier AI",
        status: "unavailable",
        endpoint: "/api/ai/alert-notifier",
        description: "Intelligent alert system for farm conditions",
        requiresLocal: true
      }
    ]
  }
];

// Database and core services
export const CORE_SERVICES: ServiceStatus[] = [
  {
    id: "supabase-db",
    name: "Supabase Database",
    status: "available",
    endpoint: "/api/test/supabase",
    description: "PostgreSQL database with authentication"
  },
  {
    id: "supabase-auth", 
    name: "Supabase Authentication",
    status: "available",
    endpoint: "/api/test/auth",
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

  static getInstance(): ServiceStatusManager {
    if (!ServiceStatusManager.instance) {
      ServiceStatusManager.instance = new ServiceStatusManager();
    }
    return ServiceStatusManager.instance;
  }

  async checkServiceStatus(service: ServiceStatus): Promise<ServiceStatus> {
    const cacheKey = service.id;
    const lastCheckTime = this.lastCheck.get(cacheKey);
    const now = new Date();

    // Use cached result if checked within last 5 minutes
    if (lastCheckTime && (now.getTime() - lastCheckTime.getTime()) < 5 * 60 * 1000) {
      return this.statusCache.get(cacheKey) || service;
    }

    const updatedService = { ...service, status: 'checking' as const, lastChecked: now };

    try {
      if (service.endpoint) {
        const response = await fetch(service.endpoint, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          updatedService.status = 'available';
          updatedService.errorMessage = undefined;
        } else {
          updatedService.status = 'unavailable'; 
          updatedService.errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
      } else if (service.requiresLocal) {
        updatedService.status = 'unavailable';
        updatedService.errorMessage = 'Requires local AI services to be running';
      }
    } catch (error) {
      updatedService.status = 'error';
      updatedService.errorMessage = error instanceof Error ? error.message : 'Unknown error';
    }

    this.statusCache.set(cacheKey, updatedService);
    this.lastCheck.set(cacheKey, now);
    return updatedService;
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
