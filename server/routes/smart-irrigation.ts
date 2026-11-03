import express from 'express';
import {
  getWeatherFromOpenMeteo,
  type WeatherData as ProviderWeatherData,
} from '../services/providers/weatherProvider';
import { ProviderError } from '../services/providers/http';

const router = express.Router();

/**
 * Tunisian governorate coordinates, used to fetch real weather for the
 * irrigation engine. Mirrors the table in routes/weather.ts.
 */
const GOVERNORATE_COORDINATES: Record<string, { lat: number; lon: number }> = {
  tunis: { lat: 36.8065, lon: 10.1815 },
  ariana: { lat: 36.8625, lon: 10.1647 },
  'ben-arous': { lat: 36.7167, lon: 10.2167 },
  manouba: { lat: 36.8089, lon: 10.0969 },
  nabeul: { lat: 36.456, lon: 10.7376 },
  zaghouan: { lat: 36.4028, lon: 10.1425 },
  bizerte: { lat: 37.2746, lon: 9.8739 },
  beja: { lat: 36.7256, lon: 9.1817 },
  jendouba: { lat: 36.5011, lon: 8.7803 },
  kef: { lat: 36.1743, lon: 8.704 },
  siliana: { lat: 36.0853, lon: 9.3703 },
  sousse: { lat: 35.8256, lon: 10.6369 },
  monastir: { lat: 35.7781, lon: 10.8264 },
  mahdia: { lat: 35.5047, lon: 11.0624 },
  sfax: { lat: 34.7406, lon: 10.7603 },
  kairouan: { lat: 35.6781, lon: 10.0963 },
  kasserine: { lat: 35.1674, lon: 8.8366 },
  'sidi-bouzid': { lat: 35.0381, lon: 9.4858 },
  gabes: { lat: 33.8815, lon: 10.0982 },
  medenine: { lat: 33.3548, lon: 10.5055 },
  tataouine: { lat: 32.9297, lon: 10.4518 },
  gafsa: { lat: 34.425, lon: 8.7842 },
  tozeur: { lat: 33.9197, lon: 8.1335 },
  kebili: { lat: 33.7047, lon: 8.9694 },
};

const SIMULATED_PROVENANCE = {
  dataSource: 'simulated' as const,
  isRealData: false,
  disclaimer:
    'بيانات توضيحية (محاكاة) لأن أجهزة استشعار رطوبة التربة غير متصلة بهذه المنصة. لا تعتمد عليها لاتخاذ قرار ري فعلي.',
};

/**
 * Adapt the real provider payload (Open-Meteo) to the irrigation engine's
 * WeatherData contract. No value is invented: every number comes from the
 * provider response.
 */
function toEngineWeather(w: ProviderWeatherData): WeatherData {
  const daily = w.forecast?.daily ?? [];
  const toForecast = (d: (typeof daily)[number]): WeatherForecast => ({
    date: new Date(d.date),
    temperature: { min: d.minTemp, max: d.maxTemp },
    humidity: d.humidity,
    rainfall: d.rainfall,
    windSpeed: w.current?.windSpeed ?? 0,
    evapotranspiration: w.agriculturalIndices?.evapotranspiration ?? 0,
  });
  return {
    location: w.location?.name ?? 'Tunis',
    temperature: w.current?.temperature ?? 0,
    humidity: w.current?.humidity ?? 0,
    rainfall: daily[0]?.rainfall ?? 0,
    windSpeed: w.current?.windSpeed ?? 0,
    solarRadiation: 0,
    evapotranspiration: w.agriculturalIndices?.evapotranspiration ?? 0,
    timestamp: new Date(),
    forecast: {
      nextHours: [],
      next7Days: daily.slice(0, 7).map(toForecast),
    },
  };
}

function resolveLocation(location: string): { lat: number; lon: number; name: string } {
  const key = location.trim().toLowerCase().replace(/\s+/g, '-');
  const coords = GOVERNORATE_COORDINATES[key];
  if (coords) return { ...coords, name: location };
  return { ...GOVERNORATE_COORDINATES.tunis, name: location };
}

/**
 * Fetch real weather for the irrigation engine. Returns null when the provider
 * is unreachable so callers can report unavailability instead of inventing
 * numbers.
 */
async function fetchIrrigationWeather(
  location: string,
): Promise<ProviderWeatherData | null> {
  const { lat, lon, name } = resolveLocation(location);
  try {
    return await getWeatherFromOpenMeteo({ lat, lon, locationName: name });
  } catch (error) {
    console.warn(
      'Irrigation weather unavailable:',
      error instanceof ProviderError ? error.message : error,
    );
    return null;
  }
}

// Types and interfaces for smart irrigation system
interface SoilMoistureData {
  sensorId: string;
  fieldId: string;
  depth: number; // cm
  moistureLevel: number; // percentage
  temperature: number; // celsius
  salinity: number; // EC
  timestamp: Date;
  batteryLevel?: number;
}

interface WeatherData {
  location: string;
  temperature: number;
  humidity: number;
  rainfall: number; // mm
  windSpeed: number; // km/h
  solarRadiation: number; // MJ/m²/day
  evapotranspiration: number; // mm/day
  timestamp: Date;
  forecast: {
    nextHours: WeatherForecast[];
    next7Days: WeatherForecast[];
  };
}

interface WeatherForecast {
  date: Date;
  temperature: { min: number; max: number };
  humidity: number;
  rainfall: number;
  windSpeed: number;
  evapotranspiration: number;
}

interface CropWaterRequirement {
  cropType: string;
  stage: 'Germination' | 'Vegetative' | 'Flowering' | 'Fruiting' | 'Maturity';
  dailyWaterNeed: number; // mm/day
  criticalMoistureLevel: number; // percentage
  optimalMoistureRange: { min: number; max: number };
  waterStressThreshold: number; // percentage
  kc: number; // crop coefficient
  rootDepth: number; // cm
  sensitivityToSalinity: 'Low' | 'Medium' | 'High';
}

interface IrrigationSchedule {
  scheduleId: string;
  fieldId: string;
  cropType: string;
  userId: string;
  scheduleType: 'Automatic' | 'Manual' | 'Smart' | 'Timer';
  status: 'Active' | 'Paused' | 'Completed' | 'Cancelled';
  nextIrrigation: Date;
  duration: number; // minutes
  waterAmount: number; // liters
  priority: 'High' | 'Medium' | 'Low';
  conditions: {
    minMoisture: number;
    maxMoisture: number;
    weatherDependent: boolean;
    timeWindow: { start: string; end: string };
  };
  efficiency: {
    waterSaved: number; // liters
    energySaved: number; // kWh
    yieldIncrease: number; // percentage
  };
  createdAt: Date;
  lastRun?: Date;
  alertsEnabled: boolean;
}

interface IrrigationEvent {
  eventId: string;
  scheduleId: string;
  fieldId: string;
  startTime: Date;
  endTime?: Date;
  plannedDuration: number; // minutes
  actualDuration?: number; // minutes
  plannedWaterAmount: number; // liters
  actualWaterAmount?: number; // liters
  method: 'Drip' | 'Sprinkler' | 'Flood' | 'Micro' | 'Manual';
  status: 'Scheduled' | 'Running' | 'Completed' | 'Failed' | 'Cancelled';
  soilMoistureBeforeAfter: {
    before: number;
    after?: number;
  };
  weatherConditions: {
    temperature: number;
    humidity: number;
    windSpeed: number;
  };
  efficiency: {
    waterUseEfficiency: number; // %
    uniformity: number; // %
    energyUsed: number; // kWh
  };
  notes: string;
}

// Tunisia-specific crop water requirements database
const cropWaterRequirements: CropWaterRequirement[] = [
  {
    cropType: 'tomato',
    stage: 'Vegetative',
    dailyWaterNeed: 6,
    criticalMoistureLevel: 60,
    optimalMoistureRange: { min: 70, max: 85 },
    waterStressThreshold: 55,
    kc: 1.15,
    rootDepth: 60,
    sensitivityToSalinity: 'Medium'
  },
  {
    cropType: 'tomato',
    stage: 'Flowering',
    dailyWaterNeed: 8,
    criticalMoistureLevel: 65,
    optimalMoistureRange: { min: 75, max: 90 },
    waterStressThreshold: 60,
    kc: 1.15,
    rootDepth: 80,
    sensitivityToSalinity: 'High'
  },
  {
    cropType: 'olive',
    stage: 'Vegetative',
    dailyWaterNeed: 4,
    criticalMoistureLevel: 45,
    optimalMoistureRange: { min: 50, max: 70 },
    waterStressThreshold: 35,
    kc: 0.7,
    rootDepth: 150,
    sensitivityToSalinity: 'Low'
  },
  {
    cropType: 'olive',
    stage: 'Flowering',
    dailyWaterNeed: 6,
    criticalMoistureLevel: 55,
    optimalMoistureRange: { min: 60, max: 80 },
    waterStressThreshold: 45,
    kc: 1.0,
    rootDepth: 180,
    sensitivityToSalinity: 'Low'
  },
  {
    cropType: 'citrus',
    stage: 'Vegetative',
    dailyWaterNeed: 7,
    criticalMoistureLevel: 65,
    optimalMoistureRange: { min: 70, max: 85 },
    waterStressThreshold: 55,
    kc: 0.9,
    rootDepth: 100,
    sensitivityToSalinity: 'Medium'
  },
  {
    cropType: 'wheat',
    stage: 'Vegetative',
    dailyWaterNeed: 3,
    criticalMoistureLevel: 50,
    optimalMoistureRange: { min: 60, max: 75 },
    waterStressThreshold: 40,
    kc: 0.8,
    rootDepth: 120,
    sensitivityToSalinity: 'Medium'
  },
  {
    cropType: 'pepper',
    stage: 'Fruiting',
    dailyWaterNeed: 7,
    criticalMoistureLevel: 65,
    optimalMoistureRange: { min: 75, max: 90 },
    waterStressThreshold: 60,
    kc: 1.05,
    rootDepth: 50,
    sensitivityToSalinity: 'High'
  }
];

// Mock databases
let soilMoistureDB: SoilMoistureData[] = [
  {
    sensorId: 'sensor-001',
    fieldId: 'field-tomato-01',
    depth: 30,
    moistureLevel: 68,
    temperature: 22,
    salinity: 1.2,
    timestamp: new Date(),
    batteryLevel: 85
  },
  {
    sensorId: 'sensor-002',
    fieldId: 'field-olive-01',
    depth: 60,
    moistureLevel: 45,
    temperature: 24,
    salinity: 0.8,
    timestamp: new Date(),
    batteryLevel: 92
  }
];

let irrigationSchedulesDB: IrrigationSchedule[] = [
  {
    scheduleId: 'schedule-001',
    fieldId: 'field-tomato-01',
    cropType: 'tomato',
    userId: 'user-123',
    scheduleType: 'Smart',
    status: 'Active',
    nextIrrigation: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    duration: 45,
    waterAmount: 250,
    priority: 'High',
    conditions: {
      minMoisture: 65,
      maxMoisture: 85,
      weatherDependent: true,
      timeWindow: { start: '06:00', end: '10:00' }
    },
    efficiency: {
      waterSaved: 150,
      energySaved: 2.5,
      yieldIncrease: 12
    },
    createdAt: new Date('2024-01-10'),
    lastRun: new Date('2024-01-15T07:30:00'),
    alertsEnabled: true
  }
];

let irrigationEventsDB: IrrigationEvent[] = [
  {
    eventId: 'event-001',
    scheduleId: 'schedule-001',
    fieldId: 'field-tomato-01',
    startTime: new Date('2024-01-15T07:30:00'),
    endTime: new Date('2024-01-15T08:15:00'),
    plannedDuration: 45,
    actualDuration: 45,
    plannedWaterAmount: 250,
    actualWaterAmount: 248,
    method: 'Drip',
    status: 'Completed',
    soilMoistureBeforeAfter: {
      before: 62,
      after: 78
    },
    weatherConditions: {
      temperature: 18,
      humidity: 75,
      windSpeed: 8
    },
    efficiency: {
      waterUseEfficiency: 92,
      uniformity: 88,
      energyUsed: 1.2
    },
    notes: 'ري صباحي فعال مع تحسن ملحوظ في رطوبة التربة'
  }
];

// Smart Irrigation Engine
class SmartIrrigationEngine {
  // Calculate Evapotranspiration (ET0) using Penman-Monteith equation (simplified)
  static calculateET0(weather: WeatherData): number {
    const { temperature, humidity, windSpeed, solarRadiation } = weather;
    
    // Simplified ET0 calculation for Tunisia climate
    const saturationVaporPressure = 0.6108 * Math.exp((17.27 * temperature) / (temperature + 237.3));
    const actualVaporPressure = (humidity / 100) * saturationVaporPressure;
    const vaporPressureDeficit = saturationVaporPressure - actualVaporPressure;
    
    // Simplified formula adapted for Tunisia conditions
    const et0 = (0.0023 * (temperature + 17.8) * Math.sqrt(Math.abs(temperature - humidity)) * (solarRadiation * 0.408)) + 
                (0.0013 * windSpeed * vaporPressureDeficit);
    
    return Math.max(1, Math.min(12, et0)); // Constrain between 1-12 mm/day
  }

  // Calculate crop water requirement
  static calculateCropWaterRequirement(
    cropType: string, 
    stage: string, 
    weather: WeatherData
  ): number {
    const cropData = cropWaterRequirements.find(
      req => req.cropType === cropType && req.stage === stage
    );

    if (!cropData) {
      return 5; // Default fallback
    }

    const et0 = this.calculateET0(weather);
    const cropWaterNeed = et0 * cropData.kc;
    
    // Adjust for local conditions
    let adjustment = 1.0;
    
    // Temperature adjustment
    if (weather.temperature > 35) adjustment += 0.2;
    if (weather.temperature < 15) adjustment -= 0.1;
    
    // Humidity adjustment
    if (weather.humidity < 40) adjustment += 0.15;
    if (weather.humidity > 80) adjustment -= 0.1;
    
    // Wind adjustment
    if (weather.windSpeed > 15) adjustment += 0.1;
    
    return Math.round(cropWaterNeed * adjustment * 10) / 10;
  }

  // Determine irrigation necessity based on multiple factors
  static shouldIrrigate(
    soilMoisture: SoilMoistureData,
    cropRequirement: CropWaterRequirement,
    weather: WeatherData,
    forecast: WeatherForecast[]
  ): {
    shouldIrrigate: boolean;
    urgency: 'Low' | 'Medium' | 'High' | 'Critical';
    reason: string;
    recommendedAmount: number;
    optimalTime: Date;
  } {
    let shouldIrrigate = false;
    let urgency: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
    let reason = '';
    let recommendedAmount = 0;
    
    // Check current soil moisture
    const currentMoisture = soilMoisture.moistureLevel;
    const criticalLevel = cropRequirement.criticalMoistureLevel;
    const optimalMin = cropRequirement.optimalMoistureRange.min;
    const optimalMax = cropRequirement.optimalMoistureRange.max;
    
    // Determine irrigation need
    if (currentMoisture < cropRequirement.waterStressThreshold) {
      shouldIrrigate = true;
      urgency = 'Critical';
      reason = 'مستوى الرطوبة أقل من الحد الحرج - خطر على النبات';
      recommendedAmount = (optimalMax - currentMoisture) * 10; // Rough calculation
    } else if (currentMoisture < criticalLevel) {
      shouldIrrigate = true;
      urgency = 'High';
      reason = 'مستوى الرطوبة منخفض - يحتاج ري فوري';
      recommendedAmount = (optimalMin - currentMoisture) * 8;
    } else if (currentMoisture < optimalMin) {
      // Check weather forecast
      const nextRainfall = forecast.slice(0, 3).reduce((sum, f) => sum + f.rainfall, 0);
      if (nextRainfall < 5) { // Less than 5mm expected in next 3 days
        shouldIrrigate = true;
        urgency = 'Medium';
        reason = 'مستوى الرطوبة تحت المثالي ولا توجد أمطار متوقعة';
        recommendedAmount = (optimalMin - currentMoisture) * 6;
      }
    }

    // Temperature stress check
    if (weather.temperature > 35 && currentMoisture < optimalMax) {
      shouldIrrigate = true;
      if (urgency === 'Low') urgency = 'Medium';
      reason += ' + درجة حرارة عالية تزيد من احتياج الماء';
    }

    // Optimal irrigation time calculation
    const now = new Date();
    const optimalTime = new Date(now);
    
    // Best irrigation times: early morning (6-9 AM) or evening (6-8 PM)
    const currentHour = now.getHours();
    if (currentHour >= 10 && currentHour <= 17) {
      // Schedule for evening if it's hot daytime
      optimalTime.setHours(18, 0, 0, 0);
      if (optimalTime <= now) {
        optimalTime.setDate(optimalTime.getDate() + 1);
        optimalTime.setHours(6, 0, 0, 0);
      }
    } else if (currentHour >= 18 || currentHour <= 5) {
      // Schedule for next morning
      optimalTime.setDate(optimalTime.getDate() + 1);
      optimalTime.setHours(6, 0, 0, 0);
    } else {
      // Current time is good for irrigation
      optimalTime.setMinutes(now.getMinutes() + 15); // 15 minutes from now
    }

    return {
      shouldIrrigate,
      urgency,
      reason: reason || 'مستوى الرطوبة مناسب حالياً',
      recommendedAmount: Math.max(0, recommendedAmount),
      optimalTime
    };
  }

  // Generate smart irrigation schedule
  static generateSmartSchedule(
    fieldId: string,
    cropType: string,
    stage: string,
    soilData: SoilMoistureData[] | undefined,
    weather: WeatherData,
    userPreferences: {
      preferredTimes: string[];
      maxDuration: number;
      waterBudget: number;
      conservationMode: boolean;
    },
    latestSoilDataOverride?: SoilMoistureData,
  ): IrrigationSchedule {
    const cropRequirement = cropWaterRequirements.find(
      req => req.cropType === cropType && req.stage === stage
    ) || cropWaterRequirements[0];

    // Prefer an explicit latest reading; otherwise pick it from the series.
    // Never call .filter on an undefined series — that was the crash here.
    const latestSoilData =
      latestSoilDataOverride ??
      (soilData ?? [])
        .filter(data => data.fieldId === fieldId)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    if (!latestSoilData) {
      throw new Error(
        'No soil moisture measurement available for this field; cannot compute an irrigation schedule.',
      );
    }

    const recommendation = this.shouldIrrigate(
      latestSoilData,
      cropRequirement,
      weather,
      weather.forecast.next7Days
    );

    const scheduleId = `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Calculate water amount based on field size and soil deficit
    const baseWaterAmount = recommendation.recommendedAmount;
    const conservationFactor = userPreferences.conservationMode ? 0.85 : 1.0;
    const adjustedWaterAmount = Math.min(
      baseWaterAmount * conservationFactor,
      userPreferences.waterBudget
    );

    // Calculate irrigation duration (assuming 5 L/min flow rate)
    const flowRate = 5; // L/min
    const duration = Math.min(
      Math.ceil(adjustedWaterAmount / flowRate),
      userPreferences.maxDuration
    );

    return {
      scheduleId,
      fieldId,
      cropType,
      userId: 'user-123', // This should come from request
      scheduleType: 'Smart',
      status: recommendation.shouldIrrigate ? 'Active' : 'Paused',
      nextIrrigation: recommendation.optimalTime,
      duration,
      waterAmount: adjustedWaterAmount,
      priority: recommendation.urgency === 'Critical' ? 'High' : 
                recommendation.urgency === 'High' ? 'High' : 'Medium',
      conditions: {
        minMoisture: cropRequirement.criticalMoistureLevel,
        maxMoisture: cropRequirement.optimalMoistureRange.max,
        weatherDependent: true,
        timeWindow: { 
          start: userPreferences.preferredTimes[0] || '06:00', 
          end: userPreferences.preferredTimes[1] || '09:00' 
        }
      },
      efficiency: {
        waterSaved: userPreferences.conservationMode ? baseWaterAmount * 0.15 : 0,
        energySaved: 0,
        yieldIncrease: 0
      },
      createdAt: new Date(),
      alertsEnabled: true
    };
  }

  // Calculate irrigation efficiency metrics
  static calculateEfficiency(irrigationEvent: IrrigationEvent): {
    waterUseEfficiency: number;
    applicationEfficiency: number;
    distributionUniformity: number;
    energyEfficiency: number;
    costEfficiency: number;
  } {
    const plannedWater = irrigationEvent.plannedWaterAmount;
    const actualWater = irrigationEvent.actualWaterAmount || plannedWater;
    const plannedDuration = irrigationEvent.plannedDuration;
    const actualDuration = irrigationEvent.actualDuration || plannedDuration;

    // Water Use Efficiency (how much water was actually needed vs used)
    const moistureIncrease = (irrigationEvent.soilMoistureBeforeAfter.after || 0) - 
                            irrigationEvent.soilMoistureBeforeAfter.before;
    const waterUseEfficiency = Math.min(100, (moistureIncrease / actualWater) * 1000);

    // Application Efficiency (planned vs actual water delivery)
    const applicationEfficiency = Math.min(100, (plannedWater / actualWater) * 100);

    // Distribution Uniformity (from sensor data - simplified)
    const distributionUniformity = irrigationEvent.efficiency.uniformity || 85;

    // Energy Efficiency (water delivered per kWh)
    const energyEfficiency = actualWater / (irrigationEvent.efficiency.energyUsed || 1);

    // Cost Efficiency (assuming water cost 0.5 TND/m³ and energy 0.2 TND/kWh)
    const waterCost = (actualWater / 1000) * 0.5;
    const energyCost = (irrigationEvent.efficiency.energyUsed || 0) * 0.2;
    const totalCost = waterCost + energyCost;
    const costEfficiency = actualWater / totalCost;

    return {
      waterUseEfficiency: Math.round(waterUseEfficiency),
      applicationEfficiency: Math.round(applicationEfficiency),
      distributionUniformity: Math.round(distributionUniformity),
      energyEfficiency: Math.round(energyEfficiency),
      costEfficiency: Math.round(costEfficiency)
    };
  }
}

// API Routes

// Get soil moisture data
router.get('/soil-moisture/:fieldId', (req, res) => {
  try {
    const { fieldId } = req.params;
    const { hours = 24 } = req.query;
    
    const cutoffTime = new Date(Date.now() - parseInt(hours as string) * 60 * 60 * 1000);
    const moistureData = soilMoistureDB
      .filter(data => data.fieldId === fieldId && data.timestamp >= cutoffTime)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    res.json({
      success: true,
      data: moistureData,
      latest: moistureData[0],
      total: moistureData.length,
      ...SIMULATED_PROVENANCE
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في جلب بيانات رطوبة التربة',
      error: error.message
    });
  }
});

// Get weather data with forecast (real provider; no fabricated values)
router.get('/weather/:location', async (req, res) => {
  try {
    const { location } = req.params;
    const weather = await fetchIrrigationWeather(location);

    if (!weather) {
      return res.status(503).json({
        success: false,
        dataAvailable: false,
        message: 'تعذّر جلب بيانات الطقس من المزوّد (Open-Meteo) حالياً.',
        code: 'PROVIDER_UNAVAILABLE',
      });
    }

    res.json({
      success: true,
      data: toEngineWeather(weather),
      dataSource: 'open-meteo',
      isRealData: true,
      source: weather.source,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في جلب بيانات الطقس',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get irrigation recommendation
router.post('/recommend', async (req, res) => {
  try {
    const { fieldId, cropType, stage, location } = req.body;

    if (!fieldId || !cropType || !stage) {
      return res.status(400).json({
        success: false,
        message: 'بيانات غير مكتملة للحصول على توصية الري'
      });
    }

    // Get latest soil moisture data
    const soilData = soilMoistureDB.filter(data => data.fieldId === fieldId);
    const latestSoilData = soilData.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    if (!latestSoilData) {
      return res.status(404).json({
        success: false,
        message: 'لا توجد بيانات ��طوبة التربة لهذا الحقل'
      });
    }

    const weather = await fetchIrrigationWeather(location || 'Tunis');
    if (!weather) {
      return res.status(503).json({
        success: false,
        dataAvailable: false,
        message: 'تعذّر جلب بيانات الطقس من المزوّد (Open-Meteo)، لا يمكن إنتاج توصية ري دقيقة.',
        code: 'PROVIDER_UNAVAILABLE',
      });
    }
    const weatherData = toEngineWeather(weather);

    const cropRequirement = cropWaterRequirements.find(
      req => req.cropType === cropType && req.stage === stage
    );

    if (!cropRequirement) {
      return res.status(404).json({
        success: false,
        message: 'لا توجد متطلبات مائية لهذا المحصول والمرحلة'
      });
    }

    const recommendation = SmartIrrigationEngine.shouldIrrigate(
      latestSoilData,
      cropRequirement,
      weatherData,
      weatherData.forecast.next7Days
    );

    const waterRequirement = SmartIrrigationEngine.calculateCropWaterRequirement(
      cropType,
      stage,
      weatherData
    );

    res.json({
      success: true,
      data: {
        recommendation,
        waterRequirement,
        currentSoilMoisture: latestSoilData.moistureLevel,
        cropRequirement,
        weather: {
          temperature: weatherData.temperature,
          humidity: weatherData.humidity,
          rainfall: weatherData.rainfall,
          nextRainfall: weatherData.forecast.next7Days.slice(0, 3).reduce((sum, f) => sum + f.rainfall, 0)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في إنتاج توصية الري',
      error: error.message
    });
  }
});

// Create irrigation schedule
router.post('/schedule', async (req, res) => {
  try {
    const { fieldId, cropType, stage, userPreferences, location } = req.body ?? {};

    if (!fieldId || !cropType || !stage) {
      return res.status(400).json({
        success: false,
        message: 'fieldId و cropType و stage مطلوبة',
        code: 'INVALID_INPUT',
      });
    }

    const soilData = soilMoistureDB.filter(data => data.fieldId === fieldId);
    const weather = await fetchIrrigationWeather(location || 'Tunis');

    if (soilData.length === 0 || !weather) {
      return res.status(409).json({
        success: false,
        message:
          'لا يمكن إنشاء جدول ري: لا تتوفر قياسات رطوبة حقيقية لهذا الحقل أو تعذّر جلب بيانات الطقس.',
        code: 'DATA_UNAVAILABLE',
        dataAvailable: false,
        hasSoilData: soilData.length > 0,
        hasWeather: Boolean(weather),
      });
    }

    const weatherData = toEngineWeather(weather);
    const latestSoilData = [...soilData].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    )[0];

    const schedule = SmartIrrigationEngine.generateSmartSchedule(
      fieldId,
      cropType,
      stage,
      soilData,
      weatherData,
      userPreferences || {
        preferredTimes: ['06:00', '09:00'],
        maxDuration: 60,
        waterBudget: 500,
        conservationMode: false,
      },
      latestSoilData,
    );

    irrigationSchedulesDB.push(schedule);

    res.json({
      success: true,
      data: schedule,
      message: 'تم إنشاء جدول الري الذكي بنجاح',
      dataSource: 'simulated',
      isRealData: false,
      weatherSource: weather.source,
      disclaimer:
        'الطقس حقيقي من Open-Meteo، أما رطوبة التربة فهي بيانات محاكاة لأن المستشعرات غير متصلة.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في إنشاء جدول الري',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get irrigation schedules
router.get('/schedules/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { status, fieldId } = req.query;

    let schedules = irrigationSchedulesDB.filter(s => s.userId === userId);

    if (status) {
      schedules = schedules.filter(s => s.status === status);
    }

    if (fieldId) {
      schedules = schedules.filter(s => s.fieldId === fieldId);
    }

    schedules.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    res.json({
      success: true,
      data: schedules,
      total: schedules.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في جلب جداول الري',
      error: error.message
    });
  }
});

// Update irrigation schedule
router.patch('/schedules/:scheduleId', (req, res) => {
  try {
    const { scheduleId } = req.params;
    const updates = req.body;

    const scheduleIndex = irrigationSchedulesDB.findIndex(s => s.scheduleId === scheduleId);

    if (scheduleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'جدول الري غير موجود'
      });
    }

    irrigationSchedulesDB[scheduleIndex] = {
      ...irrigationSchedulesDB[scheduleIndex],
      ...updates
    };

    res.json({
      success: true,
      data: irrigationSchedulesDB[scheduleIndex],
      message: 'تم تحديث جدول الري بنجاح'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في تحديث جدول الري',
      error: error.message
    });
  }
});

// Get irrigation events/history
router.get('/events/:fieldId', (req, res) => {
  try {
    const { fieldId } = req.params;
    const { days = 30 } = req.query;

    const cutoffTime = new Date(Date.now() - parseInt(days as string) * 24 * 60 * 60 * 1000);
    const events = irrigationEventsDB
      .filter(event => event.fieldId === fieldId && event.startTime >= cutoffTime)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

    // Calculate statistics
    const totalWaterUsed = events.reduce((sum, event) => sum + (event.actualWaterAmount || 0), 0);
    const avgEfficiency = events.length > 0 
      ? events.reduce((sum, event) => sum + event.efficiency.waterUseEfficiency, 0) / events.length
      : 0;

    res.json({
      success: true,
      data: events,
      statistics: {
        totalEvents: events.length,
        totalWaterUsed,
        averageEfficiency: Math.round(avgEfficiency),
        completedEvents: events.filter(e => e.status === 'Completed').length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في جلب تاريخ الري',
      error: error.message
    });
  }
});

// Start irrigation manually
router.post('/start', (req, res) => {
  try {
    const { scheduleId, duration, waterAmount, method = 'Drip' } = req.body;

    const schedule = irrigationSchedulesDB.find(s => s.scheduleId === scheduleId);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'جدول الري غير موجود'
      });
    }

    const soilData = soilMoistureDB
      .filter(data => data.fieldId === schedule.fieldId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    const newEvent: IrrigationEvent = {
      eventId: `event_${Date.now()}`,
      scheduleId,
      fieldId: schedule.fieldId,
      startTime: new Date(),
      plannedDuration: duration || schedule.duration,
      plannedWaterAmount: waterAmount || schedule.waterAmount,
      method,
      status: 'Running',
      soilMoistureBeforeAfter: {
        before: soilData?.moistureLevel || 0
      },
      weatherConditions: {
        temperature: 25,
        humidity: 65,
        windSpeed: 10
      },
      efficiency: {
        waterUseEfficiency: 0,
        uniformity: 85,
        energyUsed: 0
      },
      notes: 'بدء الري اليدوي'
    };

    irrigationEventsDB.push(newEvent);

    // Update schedule
    schedule.lastRun = new Date();
    schedule.nextIrrigation = new Date(Date.now() + 24 * 60 * 60 * 1000); // Next day

    res.json({
      success: true,
      data: newEvent,
      message: 'تم بدء الري بنجاح'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في بدء الري',
      error: error.message
    });
  }
});

// Get irrigation analytics
router.get('/analytics/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { period = 30 } = req.query;

    const userSchedules = irrigationSchedulesDB.filter(s => s.userId === userId);
    const fieldIds = userSchedules.map(s => s.fieldId);
    
    const cutoffTime = new Date(Date.now() - parseInt(period as string) * 24 * 60 * 60 * 1000);
    const events = irrigationEventsDB.filter(
      event => fieldIds.includes(event.fieldId) && event.startTime >= cutoffTime
    );

    // Calculate analytics
    const totalWaterUsed = events.reduce((sum, event) => sum + (event.actualWaterAmount || 0), 0);
    const totalEnergy = events.reduce((sum, event) => sum + event.efficiency.energyUsed, 0);
    const avgEfficiency = events.length > 0 
      ? events.reduce((sum, event) => sum + event.efficiency.waterUseEfficiency, 0) / events.length
      : 0;

    const waterSavings = userSchedules.reduce((sum, schedule) => sum + schedule.efficiency.waterSaved, 0);
    const energySavings = userSchedules.reduce((sum, schedule) => sum + schedule.efficiency.energySaved, 0);

    // Monthly trend data
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const month = new Date();
      month.setMonth(month.getMonth() - i);
      const monthEvents = events.filter(event => 
        event.startTime.getMonth() === month.getMonth() &&
        event.startTime.getFullYear() === month.getFullYear()
      );
      
      return {
        month: month.toLocaleDateString('ar-EG', { month: 'short' }),
        waterUsed: monthEvents.reduce((sum, event) => sum + (event.actualWaterAmount || 0), 0),
        efficiency: monthEvents.length > 0 
          ? monthEvents.reduce((sum, event) => sum + event.efficiency.waterUseEfficiency, 0) / monthEvents.length
          : 0,
        events: monthEvents.length
      };
    }).reverse();

    res.json({
      success: true,
      data: {
        summary: {
          totalWaterUsed,
          totalEnergy,
          averageEfficiency: Math.round(avgEfficiency),
          waterSavings,
          energySavings,
          totalEvents: events.length,
          activeSchedules: userSchedules.filter(s => s.status === 'Active').length
        },
        trends: monthlyData,
        efficiency: {
          waterUseEfficiency: Math.round(avgEfficiency),
          energyEfficiency: totalWaterUsed / Math.max(1, totalEnergy),
          costSavings: (waterSavings * 0.5) + (energySavings * 0.2) // TND
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في جلب تحليلات الري',
      error: error.message
    });
  }
});

export default router;
