import { Request, Response } from "express";

// Types for public data API
interface MarketPrice {
  id: string;
  cropType: string;
  cropTypeArabic: string;
  currentPrice: number;
  currency: string;
  unit: string;
  unitArabic: string;
  priceChange24h: number;
  priceChangePercent: number;
  volume24h: number;
  marketCap: number;
  lastUpdated: string;
  region: string;
  regionArabic: string;
  quality: "premium" | "standard" | "low";
}

interface ProductionData {
  id: string;
  cropType: string;
  cropTypeArabic: string;
  region: string;
  regionArabic: string;
  totalProduction: number; // tons
  area: number; // hectares
  yield: number; // tons per hectare
  season: string;
  seasonArabic: string;
  year: number;
  month: number;
  growthRate: number; // percentage vs previous period
  productionTrend: "increasing" | "stable" | "decreasing";
  weatherImpact: number; // -100 to 100 scale
}

interface ExportData {
  id: string;
  cropType: string;
  cropTypeArabic: string;
  destinationCountry: string;
  destinationCountryArabic: string;
  quantity: number; // tons
  value: number; // USD
  averagePrice: number; // USD per ton
  exportDate: string;
  growthRate: number; // percentage vs previous period
  marketShare: number; // percentage
}

interface WeatherData {
  id: string;
  region: string;
  regionArabic: string;
  temperature: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
  soilMoisture: number;
  date: string;
  forecast: {
    temperature: number;
    humidity: number;
    rainfall: number;
    date: string;
  }[];
  alerts: {
    type: string;
    severity: "low" | "medium" | "high" | "critical";
    message: string;
    messageArabic: string;
  }[];
}

interface APIKey {
  key: string;
  name: string;
  email: string;
  tier: "free" | "basic" | "premium" | "enterprise";
  requestsPerMonth: number;
  requestsUsed: number;
  lastRequest: string;
  active: boolean;
  createdAt: string;
  expiresAt: string;
}

interface RateLimitInfo {
  requests: number;
  limit: number;
  remaining: number;
  resetTime: string;
}

// Rate limiting configuration
const RATE_LIMITS = {
  free: { requests: 100, window: 24 * 60 * 60 * 1000 }, // 100 requests per day
  basic: { requests: 1000, window: 24 * 60 * 60 * 1000 }, // 1000 requests per day
  premium: { requests: 10000, window: 24 * 60 * 60 * 1000 }, // 10000 requests per day
  enterprise: { requests: 100000, window: 24 * 60 * 60 * 1000 }, // 100000 requests per day
};

// Mock data storage (in production, use Redis/database)
let apiKeys: APIKey[] = [
  {
    key: "public_demo_key_12345",
    name: "Demo User",
    email: "demo@example.com",
    tier: "free",
    requestsPerMonth: 100,
    requestsUsed: 45,
    lastRequest: new Date().toISOString(),
    active: true,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

let requestLogs: Array<{
  apiKey: string;
  endpoint: string;
  timestamp: string;
  ip: string;
  userAgent: string;
  responseTime: number;
  statusCode: number;
}> = [];

// Helper functions
function generateMockMarketPrices(): MarketPrice[] {
  const crops = [
    { en: "Wheat", ar: "القمح" },
    { en: "Tomatoes", ar: "الطماطم" },
    { en: "Olives", ar: "الزيتون" },
    { en: "Corn", ar: "الذرة" },
    { en: "Barley", ar: "الشعير" },
    { en: "Almonds", ar: "اللوز" },
    { en: "Dates", ar: "التمر" },
    { en: "Citrus", ar: "الحمضيات" },
    { en: "Rice", ar: "الأرز" },
    { en: "Potatoes", ar: "البطاطس" },
  ];

  const regions = [
    { en: "North Tunisia", ar: "شمال تونس" },
    { en: "Central Tunisia", ar: "وسط تونس" },
    { en: "South Tunisia", ar: "جنوب تونس" },
    { en: "Coastal Plains", ar: "السهول الساحلية" },
  ];

  const qualities: ("premium" | "standard" | "low")[] = [
    "premium",
    "standard",
    "low",
  ];

  return crops.flatMap((crop, cropIndex) =>
    regions.map((region, regionIndex) => {
      const basePrice = 200 + Math.random() * 800; // $200-1000 per ton
      const priceChange = (Math.random() - 0.5) * 20; // -10% to +10%
      const volume = 1000 + Math.random() * 49000; // 1000-50000 tons

      return {
        id: `price_${cropIndex}_${regionIndex}`,
        cropType: crop.en,
        cropTypeArabic: crop.ar,
        currentPrice: Math.round(basePrice * 100) / 100,
        currency: "USD",
        unit: "ton",
        unitArabic: "طن",
        priceChange24h: Math.round(priceChange * 100) / 100,
        priceChangePercent: Math.round((priceChange / basePrice) * 10000) / 100,
        volume24h: Math.round(volume),
        marketCap: Math.round(basePrice * volume),
        lastUpdated: new Date(
          Date.now() - Math.random() * 2 * 60 * 60 * 1000,
        ).toISOString(),
        region: region.en,
        regionArabic: region.ar,
        quality: qualities[Math.floor(Math.random() * qualities.length)],
      };
    }),
  );
}

function generateMockProductionData(): ProductionData[] {
  const crops = [
    { en: "Wheat", ar: "القمح" },
    { en: "Tomatoes", ar: "الطماطم" },
    { en: "Olives", ar: "الزيتون" },
    { en: "Corn", ar: "الذرة" },
    { en: "Barley", ar: "الشعير" },
  ];

  const regions = [
    { en: "North Tunisia", ar: "شمال تونس" },
    { en: "Central Tunisia", ar: "وسط تونس" },
    { en: "South Tunisia", ar: "جنوب تونس" },
  ];

  const seasons = [
    { en: "Spring 2024", ar: "ربيع 2024" },
    { en: "Summer 2024", ar: "صيف 2024" },
    { en: "Fall 2024", ar: "خريف 2024" },
    { en: "Winter 2024", ar: "شتاء 2024" },
  ];

  const trends: ("increasing" | "stable" | "decreasing")[] = [
    "increasing",
    "stable",
    "decreasing",
  ];

  return crops.flatMap((crop, cropIndex) =>
    regions.flatMap((region, regionIndex) =>
      seasons.slice(0, 2).map((season, seasonIndex) => {
        // Last 2 seasons
        const area = 1000 + Math.random() * 9000; // 1000-10000 hectares
        const yieldPerHectare = 2 + Math.random() * 8; // 2-10 tons per hectare
        const totalProduction = area * yieldPerHectare;
        const growthRate = (Math.random() - 0.5) * 30; // -15% to +15%

        return {
          id: `prod_${cropIndex}_${regionIndex}_${seasonIndex}`,
          cropType: crop.en,
          cropTypeArabic: crop.ar,
          region: region.en,
          regionArabic: region.ar,
          totalProduction: Math.round(totalProduction),
          area: Math.round(area),
          yield: Math.round(yieldPerHectare * 100) / 100,
          season: season.en,
          seasonArabic: season.ar,
          year: 2024,
          month: seasonIndex * 3 + 3, // Roughly seasonal
          growthRate: Math.round(growthRate * 100) / 100,
          productionTrend: trends[Math.floor(Math.random() * trends.length)],
          weatherImpact: Math.round((Math.random() - 0.5) * 100), // -50 to +50
        };
      }),
    ),
  );
}

function generateMockExportData(): ExportData[] {
  const crops = [
    { en: "Wheat", ar: "القمح" },
    { en: "Olives", ar: "الزيتون" },
    { en: "Dates", ar: "التمر" },
    { en: "Citrus", ar: "الحمضيات" },
  ];

  const countries = [
    { en: "France", ar: "فرنسا" },
    { en: "Italy", ar: "إيطاليا" },
    { en: "Germany", ar: "ألمانيا" },
    { en: "Spain", ar: "إسبانيا" },
    { en: "Libya", ar: "ليبيا" },
    { en: "Algeria", ar: "الجزائر" },
  ];

  return crops.flatMap((crop, cropIndex) =>
    countries.slice(0, 3).map((country, countryIndex) => {
      const quantity = 500 + Math.random() * 4500; // 500-5000 tons
      const pricePerTon = 300 + Math.random() * 700; // $300-1000 per ton
      const value = quantity * pricePerTon;
      const growthRate = (Math.random() - 0.5) * 40; // -20% to +20%

      return {
        id: `export_${cropIndex}_${countryIndex}`,
        cropType: crop.en,
        cropTypeArabic: crop.ar,
        destinationCountry: country.en,
        destinationCountryArabic: country.ar,
        quantity: Math.round(quantity),
        value: Math.round(value),
        averagePrice: Math.round(pricePerTon),
        exportDate: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        growthRate: Math.round(growthRate * 100) / 100,
        marketShare: Math.round(Math.random() * 25 * 100) / 100, // 0-25%
      };
    }),
  );
}

function generateMockWeatherData(): WeatherData[] {
  const regions = [
    { en: "North Tunisia", ar: "شمال تونس" },
    { en: "Central Tunisia", ar: "وسط تونس" },
    { en: "South Tunisia", ar: "جنوب تونس" },
    { en: "Coastal Plains", ar: "السهول الساحلية" },
  ];

  return regions.map((region, index) => {
    const temperature = 15 + Math.random() * 20; // 15-35°C
    const humidity = 30 + Math.random() * 50; // 30-80%
    const rainfall = Math.random() * 20; // 0-20mm

    // Generate 7-day forecast
    const forecast = Array.from({ length: 7 }, (_, i) => ({
      temperature: temperature + (Math.random() - 0.5) * 10,
      humidity: humidity + (Math.random() - 0.5) * 20,
      rainfall: Math.random() * 15,
      date: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
    }));

    // Generate alerts
    const alerts = [];
    if (temperature > 35) {
      alerts.push({
        type: "heat_wave",
        severity: "high" as const,
        message: "High temperature warning",
        messageArabic: "تحذير من درجات حرارة عالية",
      });
    }
    if (rainfall > 15) {
      alerts.push({
        type: "heavy_rain",
        severity: "medium" as const,
        message: "Heavy rainfall expected",
        messageArabic: "أمطار غزيرة متوقعة",
      });
    }

    return {
      id: `weather_${index}`,
      region: region.en,
      regionArabic: region.ar,
      temperature: Math.round(temperature * 10) / 10,
      humidity: Math.round(humidity),
      rainfall: Math.round(rainfall * 10) / 10,
      windSpeed: Math.round(Math.random() * 25), // 0-25 km/h
      soilMoisture: Math.round(30 + Math.random() * 40), // 30-70%
      date: new Date().toISOString(),
      forecast,
      alerts,
    };
  });
}

// Rate limiting middleware
function rateLimitMiddleware(req: Request, res: Response, next: Function) {
  const apiKey =
    (req.headers["x-api-key"] as string) || (req.query.api_key as string);

  if (!apiKey) {
    return res.status(401).json({
      error: "API key required",
      message:
        "Please provide a valid API key in the X-API-Key header or api_key query parameter",
    });
  }

  const keyData = apiKeys.find((k) => k.key === apiKey && k.active);

  if (!keyData) {
    return res.status(401).json({
      error: "Invalid API key",
      message: "The provided API key is invalid or has been deactivated",
    });
  }

  // Check if key is expired
  if (new Date() > new Date(keyData.expiresAt)) {
    return res.status(401).json({
      error: "API key expired",
      message: "The provided API key has expired",
    });
  }

  // Check rate limits
  const limit = RATE_LIMITS[keyData.tier];
  const now = new Date();
  const windowStart = new Date(now.getTime() - limit.window);

  // Count requests in current window
  const recentRequests = requestLogs.filter(
    (log) => log.apiKey === apiKey && new Date(log.timestamp) > windowStart,
  ).length;

  if (recentRequests >= limit.requests) {
    return res.status(429).json({
      error: "Rate limit exceeded",
      message: `API key has exceeded the rate limit of ${limit.requests} requests per ${limit.window / (1000 * 60 * 60)} hours`,
      rateLimitInfo: {
        requests: recentRequests,
        limit: limit.requests,
        remaining: 0,
        resetTime: new Date(windowStart.getTime() + limit.window).toISOString(),
      },
    });
  }

  // Log request
  requestLogs.push({
    apiKey,
    endpoint: req.path,
    timestamp: now.toISOString(),
    ip: req.ip || "unknown",
    userAgent: req.headers["user-agent"] || "unknown",
    responseTime: 0, // Will be updated later
    statusCode: 200,
  });

  // Add rate limit info to response headers
  res.set({
    "X-RateLimit-Limit": limit.requests.toString(),
    "X-RateLimit-Remaining": (limit.requests - recentRequests - 1).toString(),
    "X-RateLimit-Reset": new Date(
      windowStart.getTime() + limit.window,
    ).toISOString(),
  });

  // Attach key data to request for later use
  (req as any).apiKeyData = keyData;

  next();
}

// Public API Endpoints

export const getMarketPrices = [
  rateLimitMiddleware,
  async (req: Request, res: Response) => {
    try {
      const {
        crop,
        region,
        quality,
        sortBy = "lastUpdated",
        order = "desc",
        limit = 50,
      } = req.query;

      let prices = generateMockMarketPrices();

      // Apply filters
      if (crop) {
        prices = prices.filter(
          (p) =>
            p.cropType.toLowerCase().includes((crop as string).toLowerCase()) ||
            p.cropTypeArabic.includes(crop as string),
        );
      }

      if (region) {
        prices = prices.filter(
          (p) =>
            p.region.toLowerCase().includes((region as string).toLowerCase()) ||
            p.regionArabic.includes(region as string),
        );
      }

      if (quality) {
        prices = prices.filter((p) => p.quality === quality);
      }

      // Sort
      prices.sort((a, b) => {
        const aValue = a[sortBy as keyof MarketPrice];
        const bValue = b[sortBy as keyof MarketPrice];

        if (typeof aValue === "string" && typeof bValue === "string") {
          return order === "desc"
            ? bValue.localeCompare(aValue)
            : aValue.localeCompare(bValue);
        }

        return order === "desc"
          ? (bValue as number) - (aValue as number)
          : (aValue as number) - (bValue as number);
      });

      // Limit
      prices = prices.slice(0, Number(limit));

      res.json({
        success: true,
        data: prices,
        meta: {
          total: prices.length,
          timestamp: new Date().toISOString(),
          source: "AgroGrowth Public API",
        },
      });
    } catch (error) {
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
];

export const getProductionData = [
  rateLimitMiddleware,
  async (req: Request, res: Response) => {
    try {
      const {
        crop,
        region,
        year,
        season,
        sortBy = "totalProduction",
        order = "desc",
        limit = 50,
      } = req.query;

      let production = generateMockProductionData();

      // Apply filters
      if (crop) {
        production = production.filter(
          (p) =>
            p.cropType.toLowerCase().includes((crop as string).toLowerCase()) ||
            p.cropTypeArabic.includes(crop as string),
        );
      }

      if (region) {
        production = production.filter(
          (p) =>
            p.region.toLowerCase().includes((region as string).toLowerCase()) ||
            p.regionArabic.includes(region as string),
        );
      }

      if (year) {
        production = production.filter((p) => p.year === Number(year));
      }

      if (season) {
        production = production.filter(
          (p) =>
            p.season.toLowerCase().includes((season as string).toLowerCase()) ||
            p.seasonArabic.includes(season as string),
        );
      }

      // Sort
      production.sort((a, b) => {
        const aValue = a[sortBy as keyof ProductionData] as number;
        const bValue = b[sortBy as keyof ProductionData] as number;
        return order === "desc" ? bValue - aValue : aValue - bValue;
      });

      // Limit
      production = production.slice(0, Number(limit));

      res.json({
        success: true,
        data: production,
        meta: {
          total: production.length,
          timestamp: new Date().toISOString(),
          source: "AgroGrowth Public API",
        },
      });
    } catch (error) {
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
];

export const getExportData = [
  rateLimitMiddleware,
  async (req: Request, res: Response) => {
    try {
      const {
        crop,
        country,
        sortBy = "value",
        order = "desc",
        limit = 50,
      } = req.query;

      let exports = generateMockExportData();

      // Apply filters
      if (crop) {
        exports = exports.filter(
          (e) =>
            e.cropType.toLowerCase().includes((crop as string).toLowerCase()) ||
            e.cropTypeArabic.includes(crop as string),
        );
      }

      if (country) {
        exports = exports.filter(
          (e) =>
            e.destinationCountry
              .toLowerCase()
              .includes((country as string).toLowerCase()) ||
            e.destinationCountryArabic.includes(country as string),
        );
      }

      // Sort
      exports.sort((a, b) => {
        const aValue = a[sortBy as keyof ExportData] as number;
        const bValue = b[sortBy as keyof ExportData] as number;
        return order === "desc" ? bValue - aValue : aValue - bValue;
      });

      // Limit
      exports = exports.slice(0, Number(limit));

      res.json({
        success: true,
        data: exports,
        meta: {
          total: exports.length,
          timestamp: new Date().toISOString(),
          source: "AgroGrowth Public API",
        },
      });
    } catch (error) {
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
];

export const getWeatherData = [
  rateLimitMiddleware,
  async (req: Request, res: Response) => {
    try {
      const {
        region,
        includeForecast = "true",
        includeAlerts = "true",
      } = req.query;

      let weather = generateMockWeatherData();

      // Apply filters
      if (region) {
        weather = weather.filter(
          (w) =>
            w.region.toLowerCase().includes((region as string).toLowerCase()) ||
            w.regionArabic.includes(region as string),
        );
      }

      // Remove forecast and alerts if not requested
      if (includeForecast === "false") {
        weather = weather.map((w) => ({ ...w, forecast: [] }));
      }

      if (includeAlerts === "false") {
        weather = weather.map((w) => ({ ...w, alerts: [] }));
      }

      res.json({
        success: true,
        data: weather,
        meta: {
          total: weather.length,
          timestamp: new Date().toISOString(),
          source: "AgroGrowth Public API",
        },
      });
    } catch (error) {
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
];

export const getAPIKeyInfo = [
  rateLimitMiddleware,
  async (req: Request, res: Response) => {
    try {
      const keyData = (req as any).apiKeyData as APIKey;

      // Calculate usage statistics
      const limit = RATE_LIMITS[keyData.tier];
      const now = new Date();
      const windowStart = new Date(now.getTime() - limit.window);

      const recentRequests = requestLogs.filter(
        (log) =>
          log.apiKey === keyData.key && new Date(log.timestamp) > windowStart,
      ).length;

      res.json({
        success: true,
        data: {
          tier: keyData.tier,
          requestsPerMonth: keyData.requestsPerMonth,
          requestsUsed: keyData.requestsUsed,
          requestsRemaining: keyData.requestsPerMonth - keyData.requestsUsed,
          rateLimitInfo: {
            requests: recentRequests,
            limit: limit.requests,
            remaining: limit.requests - recentRequests,
            resetTime: new Date(
              windowStart.getTime() + limit.window,
            ).toISOString(),
          },
          keyInfo: {
            createdAt: keyData.createdAt,
            expiresAt: keyData.expiresAt,
            lastRequest: keyData.lastRequest,
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
];

export const getPublicStats = async (req: Request, res: Response) => {
  try {
    // Public statistics (no API key required)
    const totalRequests = requestLogs.length;
    const uniqueKeys = new Set(requestLogs.map((log) => log.apiKey)).size;
    const avgResponseTime =
      requestLogs.length > 0
        ? requestLogs.reduce((sum, log) => sum + log.responseTime, 0) /
          requestLogs.length
        : 0;

    const endpointUsage = requestLogs.reduce(
      (acc, log) => {
        acc[log.endpoint] = (acc[log.endpoint] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    res.json({
      success: true,
      data: {
        totalRequests,
        uniqueAPIKeys: uniqueKeys,
        averageResponseTime: Math.round(avgResponseTime),
        endpointUsage,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const createAPIKey = async (req: Request, res: Response) => {
  try {
    const { name, email, tier = "free" } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "Name and email are required",
      });
    }

    // Generate new API key
    const newKey: APIKey = {
      key: `agro_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      email,
      tier: tier as APIKey["tier"],
      requestsPerMonth:
        RATE_LIMITS[tier as keyof typeof RATE_LIMITS]?.requests * 30 || 3000, // Approximate monthly limit
      requestsUsed: 0,
      lastRequest: "",
      active: true,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
    };

    apiKeys.push(newKey);

    res.json({
      success: true,
      data: {
        apiKey: newKey.key,
        tier: newKey.tier,
        expiresAt: newKey.expiresAt,
        documentation: "/public-api/docs",
      },
      message: "API key created successfully",
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
