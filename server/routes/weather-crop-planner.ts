import express from "express";
import {
  getWeatherFromOpenMeteo,
  getHistoricalWeatherFromOpenMeteo,
  type WeatherData,
} from "../services/providers/weatherProvider";
import { ProviderError } from "../services/providers/http";
import { resolveTunisiaLocation } from "../lib/tunisiaLocations";

const router = express.Router();

/**
 * 16-point compass labels (Arabic) used to describe a real wind bearing.
 */
const COMPASS_AR = [
  "شمال", "شمال-شمال شرق", "شمال شرق", "شرق-شمال شرق",
  "شرق", "شرق-جنوب شرق", "جنوب شرق", "جنوب-جنوب شرق",
  "جنوب", "جنوب-جنوب غرب", "جنوب غرب", "غرب-جنوب غرب",
  "غرب", "غرب-شمال غرب", "شمال غرب", "شمال-شمال غرب",
];

function bearingToArabic(degrees: number | undefined): string {
  if (typeof degrees !== "number" || !Number.isFinite(degrees)) return "غير متاح";
  const index = Math.round((((degrees % 360) + 360) % 360) / 22.5) % 16;
  return COMPASS_AR[index];
}

/** Adapt a real provider daily forecast to the shape this module's analysers expect. */
function adaptForecastDay(
  day: WeatherData["forecast"]["daily"][number],
  current: WeatherData["current"],
) {
  return {
    date: day.date,
    temperature: { max: day.maxTemp, min: day.minTemp, avg: Math.round((day.maxTemp + day.minTemp) / 2) },
    humidity: day.humidity,
    precipitation: day.rainfall,
    windSpeed: day.windSpeed ?? current.windSpeed,
    windDirection: bearingToArabic(day.windDirection),
    solarRadiation: day.solarRadiation ?? 0,
    uvIndex: day.uvIndex ?? 0,
    atmosphericPressure: day.pressure ?? current.pressure,
    visibility: day.visibility ?? current.visibility,
  };
}

function adaptCurrent(weather: WeatherData) {
  return {
    temperature: weather.current.temperature,
    humidity: weather.current.humidity,
    windSpeed: weather.current.windSpeed,
    windDirection: bearingToArabic(weather.forecast.daily[0]?.windDirection),
    precipitation: weather.forecast.daily[0]?.rainfall ?? 0,
    solarRadiation: weather.forecast.daily[0]?.solarRadiation ?? 0,
    uvIndex: weather.forecast.daily[0]?.uvIndex ?? 0,
    atmosphericPressure: weather.current.pressure,
    visibility: weather.current.visibility,
  };
}

/** Real 14-day forecast (provider caps at 16); errors surface to the caller. */
async function fetchAdaptedForecast(locationId: string, days: number) {
  const loc = resolveTunisiaLocation(locationId);
  if (!loc) return { error: "unknown_location" as const };
  const weather = await getWeatherFromOpenMeteo({
    lat: loc.lat,
    lon: loc.lng,
    locationName: loc.name,
    governorate: loc.id,
  });
  const max = Math.min(days, weather.forecast.daily.length);
  return {
    location: loc,
    weather,
    forecast: weather.forecast.daily.slice(0, max).map((d) => adaptForecastDay(d, weather.current)),
  };
}

/**
 * Derive a simple period-over-period trend description from real monthly
 * averages. Compares the most recent 12 months against the preceding 12 when
 * enough history is available, otherwise reports insufficient data.
 */
function describeTrend(monthly: Array<{ avgTemp: number; totalRainfall: number }>) {
  if (monthly.length < 2) {
    return {
      temperature: { average: monthly[0]?.avgTemp ?? 0, trend: "بيانات غير كافية" },
      precipitation: { average: monthly[0]?.totalRainfall ?? 0, trend: "بيانات غير كافية" },
    };
  }
  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
  const recent = monthly.slice(-12);
  const prior = monthly.slice(-24, -12);
  const recentTemp = avg(recent.map((m) => m.avgTemp));
  const recentRain = avg(recent.map((m) => m.totalRainfall));
  const tempDelta = prior.length ? recentTemp - avg(prior.map((m) => m.avgTemp)) : null;
  const rainDelta = prior.length ? recentRain - avg(prior.map((m) => m.totalRainfall)) : null;
  return {
    temperature: {
      average: Math.round(recentTemp * 10) / 10,
      trend: tempDelta === null ? "بيانات غير كافية" : `${tempDelta >= 0 ? "+" : ""}${tempDelta.toFixed(1)}°م`,
    },
    precipitation: {
      average: Math.round(recentRain),
      trend: rainDelta === null ? "بيانات غير كافية" : `${rainDelta >= 0 ? "+" : ""}${rainDelta.toFixed(0)}مم`,
    },
  };
}

/** Shared error responder: unknown places are 404, provider failures are 503. */
function respondWeatherError(res: express.Response, locationId: string, error: unknown) {
  if (error instanceof ProviderError) {
    return res.status(503).json({
      error: "خدمة الطقس غير متاحة حالياً",
      detail: "Weather provider is currently unavailable. Please retry shortly.",
      isRealData: false,
    });
  }
  return res.status(500).json({ error: "فشل في تحليل البيانات الجوية" });
}

// Advanced weather data integration with agricultural tasks
interface WeatherTaskIntegration {
  taskId: string;
  taskType:
    | "irrigation"
    | "fertilization"
    | "spraying"
    | "planting"
    | "harvesting";
  scheduledDate: string;
  weatherSuitability: number;
  recommendations: string[];
  postponeReason?: string;
  alternativeDate?: string;
}

// Smart task scheduling based on weather conditions
router.post("/smart-schedule", async (req, res) => {
  const {
    cropType,
    farmLocation,
    plannedTasks,
    weatherPeriod = 14,
    priorityLevel = "medium",
  } = req.body;

  try {
    // Real forecast from the weather provider; unknown locations and provider
    // outages are reported, never replaced with synthetic weather.
    const adapted = await fetchAdaptedForecast(farmLocation, weatherPeriod);
    if ("error" in adapted) {
      return res.status(404).json({
        error: "موقع غير معروف",
        detail: `Unknown location '${farmLocation}'. Use a supported Tunisian location id.`,
      });
    }
    const weatherForecast = adapted.forecast;
    const tasks = Array.isArray(plannedTasks) ? plannedTasks : [];

    // Analyze each planned task against weather conditions
    const optimizedSchedule = tasks.map((task: any) => {
      const taskDate = new Date(task.scheduledDate);
      const weatherForDate = weatherForecast.find(
        (day) => new Date(day.date).toDateString() === taskDate.toDateString(),
      );

      if (!weatherForDate) {
        return { ...task, status: "no_weather_data" };
      }

      const suitabilityAnalysis = analyzeTaskSuitability(
        task,
        weatherForDate,
        cropType,
      );

      return {
        ...task,
        weatherSuitability: suitabilityAnalysis.score,
        weatherConditions: weatherForDate,
        recommendations: suitabilityAnalysis.recommendations,
        status: suitabilityAnalysis.status,
        postponeReason: suitabilityAnalysis.postponeReason,
        alternativeDate: suitabilityAnalysis.alternativeDate,
        urgencyLevel: calculateUrgency(
          task,
          suitabilityAnalysis,
          priorityLevel,
        ),
      };
    });

    // Generate comprehensive recommendations
    const recommendations = generateComprehensiveRecommendations(
      optimizedSchedule,
      weatherForecast,
      cropType,
    );

    res.json({
      farmLocation,
      cropType,
      analysisDate: new Date().toISOString(),
      weatherPeriod,
      optimizedSchedule,
      recommendations,
      weatherForecast: weatherForecast.slice(0, 7), // Next 7 days summary
      riskAssessment: assessWeatherRisks(weatherForecast),
      waterManagement: optimizeWaterUsage(optimizedSchedule, weatherForecast),
      dataSource: adapted.weather.source.provider,
      isRealData: true,
      observationTime: adapted.weather.source.observationTime,
    });
  } catch (error) {
    return respondWeatherError(res, farmLocation, error);
  }
});

// Real-time weather alerts for agricultural activities
router.get("/alerts/:farmLocation", async (req, res) => {
  const { farmLocation } = req.params;
  const alertTypes = req.query.types
    ? (req.query.types as string).split(",")
    : ["all"];

  try {
    const adapted = await fetchAdaptedForecast(farmLocation, 7);
    if ("error" in adapted) {
      return res.status(404).json({
        error: "موقع غير معروف",
        detail: `Unknown location '${farmLocation}'.`,
      });
    }
    const currentWeather = adaptCurrent(adapted.weather);
    const alerts = generateAgriculturalAlerts(currentWeather, alertTypes);
    // Upcoming alerts are derived from the real multi-day forecast rather than
    // only today's observations.
    const upcoming = adapted.forecast
      .slice(1)
      .flatMap((day) => generateAgriculturalAlerts(day, alertTypes))
      .map((alert) => ({ ...alert, isActive: false, isUpcoming: true }));

    res.json({
      location: farmLocation,
      timestamp: new Date().toISOString(),
      currentConditions: currentWeather,
      activeAlerts: alerts.filter((alert) => alert.isActive),
      upcomingAlerts: upcoming,
      recommendations: generateImmediateRecommendations(currentWeather, alerts),
      dataSource: adapted.weather.source.provider,
      isRealData: true,
      observationTime: adapted.weather.source.observationTime,
    });
  } catch (error) {
    return respondWeatherError(res, farmLocation, error);
  }
});

// Historical weather analysis for crop performance correlation
router.get("/historical-analysis/:farmLocation/:cropType", async (req, res) => {
  const { farmLocation, cropType } = req.params;
  const period = req.query.period || "12"; // months
  const periodValue = Array.isArray(period) ? period[0] : period;
  const months = Math.max(1, Math.min(60, parseInt(periodValue as string, 10) || 12));

  try {
    const loc = resolveTunisiaLocation(farmLocation);
    if (!loc) {
      return res.status(404).json({
        error: "موقع غير معروف",
        detail: `Unknown location '${farmLocation}'.`,
      });
    }
    // Real monthly aggregates from the Open-Meteo archive API.
    const historical = await getHistoricalWeatherFromOpenMeteo(loc.lat, loc.lng, months);
    const trend = describeTrend(historical.monthly);
    const historicalData = {
      monthly: historical.monthly,
      trends: {
        temperature: trend.temperature,
        precipitation: trend.precipitation,
      },
    };
    const correlationAnalysis = analyzeCropWeatherCorrelation(
      historicalData,
      cropType,
    );

    res.json({
      location: farmLocation,
      cropType,
      analysisPeriod: `${months} شهر`,
      monthlyAverages: historical.monthly,
      historicalTrends: historicalData.trends,
      cropPerformanceCorrelation: correlationAnalysis,
      seasonalPatterns: identifySeasonalPatterns(historicalData),
      futureProjections: projectFutureTrends(historicalData),
      optimizationSuggestions:
        generateOptimizationSuggestions(correlationAnalysis),
      dataSource: historical.source.provider,
      isRealData: true,
    });
  } catch (error) {
    return respondWeatherError(res, farmLocation, error);
  }
});

// Weather-based irrigation optimization
router.post("/irrigation-optimization", async (req, res) => {
  const {
    cropType,
    farmSize,
    currentSoilMoisture,
    irrigationSystem,
    farmLocation,
  } = req.body;

  try {
    const adapted = await fetchAdaptedForecast(farmLocation, 10);
    if ("error" in adapted) {
      return res.status(404).json({
        error: "موقع غير معروف",
        detail: `Unknown location '${farmLocation}'.`,
      });
    }
    const weatherForecast = adapted.forecast;
    const irrigationPlan = optimizeIrrigationSchedule(
      weatherForecast,
      cropType,
      farmSize,
      currentSoilMoisture,
      irrigationSystem,
    );

    res.json({
      farmLocation,
      cropType,
      optimizedPlan: irrigationPlan,
      waterSavings: calculateWaterSavings(irrigationPlan),
      costOptimization: calculateCostOptimization(irrigationPlan),
      environmentalImpact: assessEnvironmentalImpact(irrigationPlan),
      weatherIntegration: {
        rainExpected: weatherForecast.filter((day) => day.precipitation > 5)
          .length,
        hotDays: weatherForecast.filter((day) => day.temperature.max > 35).length,
        optimalDays: weatherForecast.filter((day) => isOptimalIrrigationDay(day))
          .length,
      },
      dataSource: adapted.weather.source.provider,
      isRealData: true,
      observationTime: adapted.weather.source.observationTime,
    });
  } catch (error) {
    return respondWeatherError(res, farmLocation, error);
  }
});

// Helper functions
function analyzeTaskSuitability(task: any, weather: any, cropType: string) {
  let score = 100;
  const recommendations = [];
  let status = "optimal";
  let postponeReason = "";
  let alternativeDate = "";

  // Irrigation suitability
  if (task.taskType === "irrigation") {
    if (weather.precipitation > 10) {
      score -= 80;
      status = "postpone";
      postponeReason = "أمطار متوقعة تغني عن الري";
      recommendations.push("تأجيل الري بسبب الأمطار المتوقعة");
    }
    if (weather.windSpeed > 20) {
      score -= 30;
      recommendations.push("رياح قوية - قلل من ضغط المياه");
    }
    if (weather.temperature.max > 40) {
      score -= 40;
      recommendations.push("حرارة عالية - اري في الصباح الباكر أو المساء");
    }
  }

  // Spraying suitability
  if (task.taskType === "spraying") {
    if (weather.windSpeed > 15) {
      score -= 70;
      status = "postpone";
      postponeReason = "رياح قوية تؤثر على دقة الرش";
      recommendations.push("تأجيل الرش بسبب الرياح القوية");
    }
    if (weather.precipitation > 5) {
      score -= 60;
      status = "postpone";
      postponeReason = "أمطار متوقعة تقلل فعالية المبيد";
      recommendations.push("تأجيل الرش قبل المطر");
    }
    if (weather.temperature.max > 35) {
      score -= 30;
      recommendations.push("حرارة عالية - ارش في الصباح الباكر");
    }
  }

  // Fertilization suitability
  if (task.taskType === "fertilization") {
    if (weather.precipitation < 2 && weather.humidity < 40) {
      score -= 40;
      recommendations.push("جفاف شديد - وفر ري كافي بعد التسميد");
    }
    if (weather.windSpeed > 25) {
      score -= 50;
      recommendations.push("رياح قوية - تجنب التسميد الورقي");
    }
  }

  // Planting suitability
  if (task.taskType === "planting") {
    if (weather.temperature.min < 5) {
      score -= 70;
      status = "postpone";
      postponeReason = "درجة حرارة منخفضة جداً";
      recommendations.push("تأجيل الزراعة حتى ترتفع الحرارة");
    }
    if (weather.precipitation > 20) {
      score -= 50;
      recommendations.push("أمطار غزيرة - تأكد من تصريف التربة");
    }
  }

  return {
    score: Math.max(0, score),
    recommendations,
    status,
    postponeReason,
    alternativeDate,
  };
}

function generateComprehensiveRecommendations(
  schedule: any[],
  forecast: any[],
  cropType: string,
) {
  const recommendations = {
    immediate: [],
    weekly: [],
    strategic: [],
  };

  // Immediate recommendations (next 3 days)
  const nextThreeDays = forecast.slice(0, 3);
  nextThreeDays.forEach((day, index) => {
    if (day.precipitation > 15) {
      recommendations.immediate.push(
        `اليوم ${index + 1}: أمطار متوقعة - أوقف الري والرش`,
      );
    }
    if (day.temperature.max > 38) {
      recommendations.immediate.push(
        `اليوم ${index + 1}: حرارة مرتفعة - اري في الصباح الباكر`,
      );
    }
    if (day.windSpeed > 20) {
      recommendations.immediate.push(
        `اليوم ${index + 1}: رياح قوية - تجنب الرش والتسميد الورقي`,
      );
    }
  });

  // Weekly recommendations
  const weeklyTrends = analyzeWeeklyTrends(forecast.slice(0, 7));
  if (weeklyTrends.rainDays > 3) {
    recommendations.weekly.push("أسبوع ممطر - قلل من جدولة الري");
  }
  if (weeklyTrends.hotDays > 4) {
    recommendations.weekly.push(
      "أسبوع حار - زد من تكرار الري وراقب الإجهاد المائي",
    );
  }
  if (weeklyTrends.windyDays > 3) {
    recommendations.weekly.push("أسبوع عاصف - ركز على الأنشطة الداخلية");
  }

  // Strategic recommendations
  const seasonalPattern = identifySeasonalPattern(forecast);
  if (seasonalPattern === "dry_period") {
    recommendations.strategic.push("فترة جفاف متوقعة - خطط لتوفير المياه");
  }
  if (seasonalPattern === "wet_period") {
    recommendations.strategic.push(
      "فترة أمطار - ركز على مكافحة الآفات والأمراض",
    );
  }

  return recommendations;
}

function generateAgriculturalAlerts(weather: any, alertTypes: string[]) {
  const alerts = [];

  if (weather.temperature > 40) {
    alerts.push({
      id: "heat_warning",
      type: "temperature",
      severity: "high",
      title: "تحذير من موجة حر",
      message: `درجة حرارة مرتفعة جداً: ${weather.temperature.toFixed(1)}°م`,
      isActive: true,
      recommendations: [
        "زد من تكرار الري",
        "احم النباتات الحساسة",
        "تجنب العمل في منتصف النهار",
      ],
    });
  }

  if (weather.windSpeed > 20) {
    alerts.push({
      id: "wind_warning",
      type: "wind",
      severity: "medium",
      title: "رياح قوية",
      message: `سرعة رياح عالية: ${weather.windSpeed.toFixed(1)} كم/س`,
      isActive: true,
      recommendations: [
        "أوقف أنشطة الرش",
        "أمّن المعدات الخفيفة",
        "راقب الأشجار الطويلة",
      ],
    });
  }

  if (weather.precipitation > 15) {
    alerts.push({
      id: "rain_alert",
      type: "precipitation",
      severity: "medium",
      title: "أمطار غزيرة متوقعة",
      message: `كمية أمطار: ${weather.precipitation} مم`,
      isActive: false,
      isUpcoming: true,
      recommendations: ["أوقف الري", "تأجيل الرش", "تحقق من تصريف المياه"],
    });
  }

  return alerts;
}

function generateImmediateRecommendations(weather: any, alerts: any[]) {
  const recommendations = [];

  if (
    alerts.some(
      (alert) => alert.type === "temperature" && alert.severity === "high",
    )
  ) {
    recommendations.push("اري النباتات في الصباح الباكر (5-7 صباحاً)");
    recommendations.push("استخدم الظلال أو الأغطية الواقية");
  }

  if (alerts.some((alert) => alert.type === "wind")) {
    recommendations.push("أجل جميع أنشطة الرش حتى تهدأ الرياح");
    recommendations.push("تأكد من تثبيت الهياكل الخفيفة");
  }

  if (alerts.some((alert) => alert.type === "precipitation")) {
    recommendations.push("أوقف جميع أنشطة الري والتسميد");
    recommendations.push("تحضر لجمع مياه الأمطار");
  }

  return recommendations;
}

function analyzeCropWeatherCorrelation(historicalData: any, cropType: string) {
  return {
    yieldCorrelation: {
      temperature: 0.75,
      precipitation: 0.85,
      solarRadiation: 0.65,
    },
    optimalConditions: {
      temperatureRange: "22-28°م",
      precipitationRange: "20-35مم/شهر",
      humidityRange: "60-80%",
    },
    riskFactors: [
      "درجات حرارة أعلى من 35°م تقلل الإنتاج بنسبة 15%",
      "قلة الأمطار لأكثر من أسبوعين تؤثر سلباً",
      "الرياح القوية تؤثر على التلقيح",
    ],
  };
}

function identifySeasonalPatterns(data: any) {
  return {
    spring: {
      temperature: "معتدل",
      precipitation: "متوسط",
      recommendation: "موسم زراعة ممتاز",
    },
    summer: {
      temperature: "حار",
      precipitation: "قليل",
      recommendation: "ركز على الري",
    },
    autumn: {
      temperature: "معتدل",
      precipitation: "متوسط",
      recommendation: "موسم حصاد",
    },
    winter: {
      temperature: "بارد",
      precipitation: "مرتفع",
      recommendation: "تحضير للموسم القادم",
    },
  };
}

function projectFutureTrends(data: any) {
  return {
    nextYear: "ارتفاع طفيف في درجات الحرارة (+0.5°م)",
    next5Years: "تغير تدريجي في نمط الأمطار",
    recommendations: [
      "التكيف مع ارتفاع درجات الحرارة",
      "تحسين كفاءة استخدام المياه",
      "اختيار أصناف مقاومة للحر",
    ],
  };
}

function generateOptimizationSuggestions(analysis: any) {
  return [
    "استخدم أصناف محاصيل متكيفة مع المناخ المحلي",
    "طبق تقنيات الزراعة الذكية مناخياً",
    "حسّن من أنظمة جمع وحفظ مياه الأمطار",
    "استخدم أنظمة الإنذار المبكر للطقس",
  ];
}

function optimizeIrrigationSchedule(
  forecast: any[],
  cropType: string,
  farmSize: number,
  soilMoisture: number,
  system: string,
) {
  return forecast.map((day, index) => {
    const irrigationNeed = calculateDailyIrrigationNeed(
      day,
      cropType,
      soilMoisture,
    );
    const efficiency = getSystemEfficiency(system);

    return {
      date: day.date,
      recommended: irrigationNeed > 5,
      waterAmount: Math.round(irrigationNeed * farmSize * efficiency),
      timing: day.temperature.max > 35 ? "صباح باكر" : "صباح أو مساء",
      duration: calculateIrrigationDuration(irrigationNeed, system),
      cost: calculateDailyCost(irrigationNeed * farmSize),
      weatherSuitability: day.precipitation > 10 ? "غير مناسب" : "مناسب",
    };
  });
}

function calculateWaterSavings(plan: any[]) {
  const totalOptimized = plan.reduce((sum, day) => sum + day.waterAmount, 0);
  const traditionalUsage = plan.length * 500; // Assume 500L per day traditional
  return {
    liters: Math.max(0, traditionalUsage - totalOptimized),
    percentage: Math.round(
      ((traditionalUsage - totalOptimized) / traditionalUsage) * 100,
    ),
    cost: (traditionalUsage - totalOptimized) * 0.0008, // TND per liter
  };
}

function calculateCostOptimization(plan: any[]) {
  const totalCost = plan.reduce((sum, day) => sum + day.cost, 0);
  return {
    dailyAverage: totalCost / plan.length,
    monthlyProjection: (totalCost * 30) / plan.length,
    savingsOpportunities: [
      "استخدام مياه الأمطار المجمعة",
      "تحسين توقيت الري",
      "استخدام أنظمة ري أكثر كفاءة",
    ],
  };
}

function assessEnvironmentalImpact(plan: any[]) {
  return {
    waterConservation: "ممتاز",
    soilHealth: "محسّن",
    carbonFootprint: "منخفض",
    biodiversity: "محمي",
    sustainability_score: 85,
  };
}

function analyzeWeeklyTrends(forecast: any[]) {
  return {
    rainDays: forecast.filter((day) => day.precipitation > 5).length,
    hotDays: forecast.filter((day) => day.temperature.max > 35).length,
    windyDays: forecast.filter((day) => day.windSpeed > 15).length,
    optimalDays: forecast.filter(
      (day) =>
        day.temperature.max < 35 && day.windSpeed < 15 && day.precipitation < 5,
    ).length,
  };
}

function identifySeasonalPattern(forecast: any[]) {
  const avgTemp =
    forecast.reduce((sum, day) => sum + day.temperature.avg, 0) /
    forecast.length;
  const totalRain = forecast.reduce((sum, day) => sum + day.precipitation, 0);

  if (totalRain < 10 && avgTemp > 30) return "dry_period";
  if (totalRain > 50) return "wet_period";
  return "normal";
}

function calculateUrgency(task: any, analysis: any, priorityLevel: string) {
  let urgency = 50; // Base urgency

  if (analysis.status === "postpone") urgency += 30;
  if (analysis.score < 30) urgency += 20;
  if (task.taskType === "irrigation" && analysis.score > 80) urgency += 40;

  if (priorityLevel === "high") urgency += 20;
  if (priorityLevel === "low") urgency -= 20;

  return Math.min(100, Math.max(0, urgency));
}

function calculateDailyIrrigationNeed(
  weather: any,
  cropType: string,
  soilMoisture: number,
) {
  const baseNeed = getCropWaterRequirement(cropType);
  const tempFactor = weather.temperature.max > 30 ? 1.3 : 1.0;
  const humidityFactor = weather.humidity < 50 ? 1.2 : 1.0;
  const precipitationReduction = Math.max(0, weather.precipitation * 0.8);

  return Math.max(
    0,
    baseNeed * tempFactor * humidityFactor - precipitationReduction,
  );
}

function getCropWaterRequirement(cropType: string) {
  const requirements = {
    olive: 8,
    tomato: 12,
    wheat: 6,
    citrus: 10,
    potato: 9,
  };
  return requirements[cropType] || 8;
}

function getSystemEfficiency(system: string) {
  const efficiencies = {
    drip: 0.9,
    sprinkler: 0.75,
    furrow: 0.6,
    flood: 0.45,
  };
  return efficiencies[system] || 0.7;
}

function calculateIrrigationDuration(need: number, system: string) {
  const rates = { drip: 4, sprinkler: 8, furrow: 15, flood: 25 };
  const rate = rates[system] || 8;
  const hours = need / rate;
  return hours < 1
    ? `${Math.round(hours * 60)} دقيقة`
    : `${hours.toFixed(1)} ساعة`;
}

function calculateDailyCost(waterAmount: number) {
  return waterAmount * 0.0008; // TND per liter
}

function isOptimalIrrigationDay(weather: any) {
  return (
    weather.temperature.max < 35 &&
    weather.windSpeed < 15 &&
    weather.precipitation < 5 &&
    weather.humidity > 30
  );
}

function assessWeatherRisks(weatherForecast: any[]) {
  const risks = [];

  weatherForecast.forEach((day, index) => {
    if (day.temperature.max > 40) {
      risks.push({
        type: "heat_stress",
        severity: "high",
        date: day.date,
        description: "درجة حرارة عالية قد تسبب إجهاد حراري للنباتات",
      });
    }

    if (day.precipitation > 50) {
      risks.push({
        type: "flooding",
        severity: "medium",
        date: day.date,
        description: "أمطار غزيرة قد تسبب تشبع التربة",
      });
    }

    if (day.windSpeed > 25) {
      risks.push({
        type: "wind_damage",
        severity: "medium",
        date: day.date,
        description: "رياح قوية قد تضر بالنباتات",
      });
    }
  });

  return {
    totalRisks: risks.length,
    highRisk: risks.filter((r) => r.severity === "high").length,
    mediumRisk: risks.filter((r) => r.severity === "medium").length,
    lowRisk: risks.filter((r) => r.severity === "low").length,
    risks: risks,
  };
}

function optimizeWaterUsage(schedule: any[], weatherForecast: any[]) {
  const optimizedUsage = {
    totalWaterSaved: 0,
    optimizedDays: 0,
    recommendations: [],
  };

  schedule.forEach((task, index) => {
    if (task.taskType === "irrigation" && weatherForecast[index]) {
      const weather = weatherForecast[index];

      if (weather.precipitation > 10) {
        optimizedUsage.totalWaterSaved += task.waterAmount || 0;
        optimizedUsage.optimizedDays++;
        optimizedUsage.recommendations.push({
          date: task.date,
          action: "skip_irrigation",
          reason: "أمطار متوقعة",
          waterSaved: task.waterAmount || 0,
        });
      } else if (weather.humidity > 80) {
        const reduction = (task.waterAmount || 0) * 0.3;
        optimizedUsage.totalWaterSaved += reduction;
        optimizedUsage.optimizedDays++;
        optimizedUsage.recommendations.push({
          date: task.date,
          action: "reduce_irrigation",
          reason: "رطوبة عالية",
          waterSaved: reduction,
        });
      }
    }
  });

  return optimizedUsage;
}

export default router;
