import express from 'express';
import {
  getWeatherFromOpenMeteo,
  calculateEvapotranspiration as calculateEt0FromWeather,
} from '../services/providers/weatherProvider';

const router = express.Router();

// Enhanced weather stations data for Tunisia
const tunisianWeatherStations = [
  { id: 'tunis-center', name: 'تونس العاصمة', lat: 36.8065, lng: 10.1815, elevation: 4 },
  { id: 'sfax-center', name: 'صفاقس', lat: 34.7406, lng: 10.7603, elevation: 4 },
  { id: 'sousse-center', name: 'سوسة', lat: 35.8256, lng: 10.6369, elevation: 4 },
  { id: 'kairouan', name: 'القيروان', lat: 35.6781, lng: 10.0963, elevation: 68 },
  { id: 'gabes', name: 'قابس', lat: 33.8815, lng: 10.0982, elevation: 5 },
  { id: 'bizerte', name: 'بنزرت', lat: 37.2746, lng: 9.8739, elevation: 6 },
  { id: 'gafsa', name: 'قفصة', lat: 34.4250, lng: 8.7842, elevation: 314 },
  { id: 'tozeur', name: 'توزر', lat: 33.9197, lng: 8.1348, elevation: 87 }
];

// Crop water requirements (mm per day) for different growth stages
const cropWaterRequirements = {
  olive: {
    establishment: 4,
    vegetative: 6,
    flowering: 8,
    fruiting: 10,
    dormant: 2
  },
  tomato: {
    seedling: 2,
    vegetative: 4,
    flowering: 6,
    fruiting: 8,
    ripening: 5
  },
  wheat: {
    germination: 3,
    tillering: 4,
    stem_elongation: 6,
    flowering: 7,
    grain_filling: 5,
    maturity: 2
  },
  citrus: {
    flowering: 6,
    fruit_set: 8,
    fruit_development: 10,
    harvest: 6,
    dormant: 3
  },
  potato: {
    emergence: 2,
    vegetative: 4,
    tuber_initiation: 6,
    tuber_bulking: 8,
    maturation: 3
  }
};

// Fetch a real forecast from the configured weather provider (Open-Meteo) and
// map it to the irrigation planner's shape. Returns null for an unknown station.
// Throws when the provider is unreachable so callers can answer 503 instead of
// inventing weather.
async function fetchWeatherForecast(stationId: string, days: number = 14) {
  const station = tunisianWeatherStations.find((s) => s.id === stationId);
  if (!station) return null;

  const weather = await getWeatherFromOpenMeteo({
    lat: station.lat,
    lon: station.lng,
    locationName: station.name,
  });

  const windSpeed = weather.current.windSpeed;

  return weather.forecast.daily.slice(0, days).map((day) => {
    const avgTemp = (day.maxTemp + day.minTemp) / 2;
    const et0 = calculateEt0FromWeather(avgTemp, day.humidity, windSpeed);
    // Prefer the provider's measured radiation/UV; fall back to a Hargreaves
    // estimate only when the provider omits them.
    const solarRadiation =
      day.solarRadiation ??
      Math.round(
        Math.max(
          1,
          (avgTemp + 17.8) * Math.sqrt(Math.max(0.1, day.maxTemp - day.minTemp)) * 0.0864,
        ) * 10,
      ) / 10;

    return {
      date: day.date,
      station: station.name,
      temperature: {
        max: Math.round(day.maxTemp),
        min: Math.round(day.minTemp),
        avg: Math.round(avgTemp),
      },
      humidity: Math.round(day.humidity),
      windSpeed: Math.round(windSpeed),
      precipitation: Math.round(day.rainfall * 10) / 10,
      solarRadiation,
      evapotranspiration: Math.round(et0 * 10) / 10,
      // Real provider UV when available; otherwise a bounded derived index.
      uvIndex: day.uvIndex ?? Math.min(11, Math.round(solarRadiation * 0.8)),
      soilMoisture: Math.round(calculateSoilMoisture(day.rainfall, et0)),
      irrigationNeed: Math.round(calculateIrrigationNeed(day.rainfall, et0) * 10) / 10,
    };
  });
}

function calculateSoilMoisture(precipitation: number, et0: number): number {
  const moistureChange = precipitation - et0;
  const baseMoisture = 40; // Assume 40% starting moisture
  return Math.max(10, Math.min(90, baseMoisture + moistureChange * 2));
}

function calculateIrrigationNeed(precipitation: number, et0: number): number {
  const deficit = et0 - precipitation;
  return Math.max(0, deficit);
}

// Get detailed weather forecast with irrigation recommendations
router.get('/forecast/:stationId', async (req, res) => {
  const { stationId } = req.params;
  const days = parseInt(req.query.days as string) || 14;
  
  let forecast;
  try {
    forecast = await fetchWeatherForecast(stationId, days);
  } catch (error) {
    console.error('Weather provider error (forecast):', (error as Error).message);
    return res.status(503).json({
      error: 'Weather data is currently unavailable',
      dataAvailable: false,
    });
  }
  
  if (!forecast || forecast.length === 0) {
    return res.status(404).json({ error: 'Weather station not found' });
  }
  
  res.json({
    station: tunisianWeatherStations.find(s => s.id === stationId),
    forecast,
    summary: {
      avgTemperature: Math.round(forecast.reduce((sum, day) => sum + day.temperature.avg, 0) / forecast.length),
      totalRainfall: Math.round(forecast.reduce((sum, day) => sum + day.precipitation, 0) * 10) / 10,
      avgHumidity: Math.round(forecast.reduce((sum, day) => sum + day.humidity, 0) / forecast.length),
      totalET0: Math.round(forecast.reduce((sum, day) => sum + day.evapotranspiration, 0) * 10) / 10,
      irrigationDays: forecast.filter(day => day.irrigationNeed > 3).length
    },
    dataSource: 'open-meteo',
    isRealData: true,
    lastUpdated: new Date().toISOString()
  });
});

// Generate intelligent irrigation schedule for specific crop
router.post('/irrigation/schedule', async (req, res) => {
  const { 
    cropType, 
    growthStage, 
    farmSize, 
    soilType,
    irrigationSystem,
    stationId,
    plantingDate 
  } = req.body ?? {};

  if (!stationId || typeof stationId !== 'string') {
    return res.status(400).json({
      error: 'Missing stationId',
      message: 'A valid "stationId" is required to fetch a weather-based schedule.',
    });
  }

  let forecast;
  try {
    forecast = await fetchWeatherForecast(stationId, 14);
  } catch (error) {
    console.error('Weather provider error (schedule):', (error as Error).message);
    return res.status(503).json({
      error: 'Weather data is currently unavailable',
      dataAvailable: false,
    });
  }

  if (!forecast || forecast.length === 0) {
    return res.status(404).json({ error: 'Weather station not found' });
  }

  const waterReq = cropWaterRequirements[cropType as keyof typeof cropWaterRequirements];
  
  if (!waterReq) {
    return res.status(400).json({ error: 'Unsupported crop type' });
  }

  const dailyWaterNeed = waterReq[growthStage as keyof typeof waterReq] || 5;
  
  // Generate irrigation schedule
  const schedule = forecast.map(day => {
    const netIrrigation = Math.max(0, dailyWaterNeed - day.precipitation);
    const efficiency = getIrrigationEfficiency(irrigationSystem);
    const grossIrrigation = netIrrigation / efficiency;
    
    return {
      date: day.date,
      recommended: netIrrigation > 2,
      waterAmount: Math.round(grossIrrigation * farmSize * 10) / 10, // liters
      duration: calculateIrrigationDuration(grossIrrigation, irrigationSystem),
      bestTime: getBestIrrigationTime(day),
      weatherConditions: {
        temperature: day.temperature.avg,
        humidity: day.humidity,
        windSpeed: day.windSpeed,
        suitability: getIrrigationSuitability(day)
      },
      efficiency: Math.round(efficiency * 100),
      cost: calculateIrrigationCost(grossIrrigation * farmSize),
      soilMoisture: day.soilMoisture,
      notes: generateIrrigationNotes(day, netIrrigation)
    };
  });

  const totalWater = schedule.reduce((sum, day) => sum + day.waterAmount, 0);
  const totalCost = schedule.reduce((sum, day) => sum + day.cost, 0);
  const recommendedDays = schedule.filter(day => day.recommended).length;

  res.json({
    cropType,
    growthStage,
    farmSize,
    schedule,
    summary: {
      totalWaterNeeded: Math.round(totalWater),
      totalCost: Math.round(totalCost * 100) / 100,
      recommendedIrrigationDays: recommendedDays,
      waterSavings: Math.round((farmSize * 100 - totalWater) * 100) / 100, // Compared to daily irrigation
      efficiencyScore: Math.round((recommendedDays / 14) * 100)
    },
    recommendations: generateIrrigationRecommendations(schedule, cropType),
    dataSource: 'open-meteo',
    isRealData: true,
    lastUpdated: new Date().toISOString()
  });
});

// Get crop planting calendar based on weather patterns
router.get('/planting-calendar/:governorate', (req, res) => {
  const { governorate } = req.params;
  const year = parseInt(req.query.year as string) || new Date().getFullYear();
  
  const calendar = generatePlantingCalendar(governorate, year);
  
  res.json({
    governorate,
    year,
    calendar,
    generalAdvice: [
      'تجنب الزراعة خلال فترات الصقيع',
      'اختر الأصناف المقاومة للجفاف في المناطق الداخلية',
      'راعي مواسم الأمطار عند التخطيط للزراعة',
      'استخدم التقنيات الحديثة لتوفير المياه'
    ],
    climateInfo: getClimateInfo(governorate),
    lastUpdated: new Date().toISOString()
  });
});

// Weather alerts and notifications
router.get('/alerts/:stationId', async (req, res) => {
  const { stationId } = req.params;
  let forecast;
  try {
    forecast = await fetchWeatherForecast(stationId, 7);
  } catch (error) {
    console.error('Weather provider error (alerts):', (error as Error).message);
    return res.status(503).json({
      error: 'Weather data is currently unavailable',
      dataAvailable: false,
    });
  }
  
  // An unknown station yields a null forecast; without this guard the alerts
  // generator crashed the process (forecast.forEach on null).
  if (!forecast || forecast.length === 0) {
    return res.status(404).json({ error: 'Weather station not found' });
  }
  const alerts = generateWeatherAlerts(forecast);
  
  res.json({
    station: tunisianWeatherStations.find(s => s.id === stationId),
    alerts,
    activeAlerts: alerts.filter(alert => alert.severity !== 'info'),
    dataSource: 'open-meteo',
    isRealData: true,
    lastUpdated: new Date().toISOString()
  });
});

// Water usage analytics
//
// AgroGrowth has no metered irrigation telemetry: the platform never receives
// real per-field water consumption. The figures below are therefore an
// illustrative baseline, stamped as simulated so the SPA can disclose them
// instead of showing them as measured usage.
router.post('/analytics/water-usage', (_req, res) => {
  res.set('X-Data-Provenance', 'simulated-disabled');
  res.set('X-Is-Real-Data', 'false');
  return res.status(503).json({
    success: false,
    code: 'IRRIGATION_TELEMETRY_NOT_CONNECTED',
    message: 'Water-usage analytics require real, persisted irrigation meter or sensor readings. Simulated consumption figures are disabled.',
    dataSource: 'simulated',
    isRealData: false,
    productionReady: false,
  });
});

// Helper functions
function getIrrigationEfficiency(system: string): number {
  const efficiencies = {
    'drip': 0.9,
    'sprinkler': 0.75,
    'furrow': 0.6,
    'flood': 0.4
  };
  return efficiencies[system as keyof typeof efficiencies] || 0.7;
}

function calculateIrrigationDuration(waterAmount: number, system: string): string {
  const rates = {
    'drip': 4, // mm/hour
    'sprinkler': 8,
    'furrow': 15,
    'flood': 25
  };
  
  const rate = rates[system as keyof typeof rates] || 8;
  const hours = waterAmount / rate;
  
  if (hours < 1) {
    return `${Math.round(hours * 60)} دقيقة`;
  } else {
    return `${Math.round(hours * 10) / 10} ساعة`;
  }
}

function getBestIrrigationTime(day: any): string {
  if (day.temperature.max > 35) {
    return 'الفجر (5:00-7:00) أو المساء (18:00-20:00)';
  } else if (day.windSpeed > 15) {
    return 'الصباح الباكر (6:00-8:00)';
  } else {
    return 'الصباح (7:00-9:00) أو المساء (17:00-19:00)';
  }
}

function getIrrigationSuitability(day: any): 'excellent' | 'good' | 'poor' {
  if (day.temperature.max > 40 || day.windSpeed > 20) {
    return 'poor';
  } else if (day.temperature.max < 30 && day.windSpeed < 10) {
    return 'excellent';
  } else {
    return 'good';
  }
}

function calculateIrrigationCost(waterVolume: number): number {
  const waterCostPerCubicMeter = 0.8; // TND per m³
  return (waterVolume / 1000) * waterCostPerCubicMeter;
}

function generateIrrigationNotes(day: any, netIrrigation: number): string {
  if (day.precipitation > 10) {
    return 'أمطار كافية - لا حاجة للري';
  } else if (netIrrigation > 8) {
    return 'حاجة عالية للري - راقب رطوبة التربة';
  } else if (netIrrigation > 5) {
    return 'حاجة متوسطة للري';
  } else if (netIrrigation > 2) {
    return 'حاجة خفيفة للري';
  } else {
    return 'لا حاجة للري';
  }
}

function generateIrrigationRecommendations(schedule: any[], cropType: string): string[] {
  const recommendations = [];
  
  const highNeedDays = schedule.filter(day => day.waterAmount > 50).length;
  if (highNeedDays > 7) {
    recommendations.push('فكر في تحسين نظام الري لتوفير المياه');
  }
  
  const expensiveDays = schedule.filter(day => day.cost > 10).length;
  if (expensiveDays > 5) {
    recommendations.push('استخدم تقنيات توفير المياه لتقليل التكاليف');
  }
  
  recommendations.push('راقب رطوبة التربة بانتظام');
  recommendations.push('اضبط جدولة الري حسب الطقس اليومي');
  
  if (cropType === 'olive') {
    recommendations.push('الزيتون يتحمل الجفاف - تجنب الإفراط في الري');
  }
  
  return recommendations;
}

function generatePlantingCalendar(governorate: string, year: number) {
  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  
  return months.map((month, index) => {
    const activities = getMonthlyActivities(index + 1, governorate);
    return {
      month,
      monthNumber: index + 1,
      activities,
      temperature: getMonthlyTemperature(index + 1, governorate),
      rainfall: getMonthlyRainfall(index + 1, governorate),
      recommendations: getMonthlyRecommendations(index + 1, governorate)
    };
  });
}

function getMonthlyActivities(month: number, governorate: string) {
  const activities = {
    1: ['زراعة الشعير', 'تقليم الزيتون', 'زراعة الفول'],
    2: ['زراعة البطاطا المبكرة', 'تطعيم الحمضيات', 'تحضير التربة'],
    3: ['زراعة الطماطم', 'زراعة الخرشوف', 'بداية موسم الري'],
    4: ['زراعة البطيخ', 'زراعة الذرة', 'مكافحة الآفات'],
    5: ['زراعة الخضروات الصيفية', 'قطف الخرشوف', 'تكثيف الري'],
    6: ['حصاد القمح', 'زراعة الطماطم الصيفية', 'مراقبة الآفات'],
    7: ['حصاد الشعير', 'زراعة الخضروات المتأخرة', 'ري مكثف'],
    8: ['قطف الخوخ والمشمش', 'تحضير الأرض للزراعة الخريفية'],
    9: ['بداية قطف الزيتون المبكر', 'زراعة الخضروات الشتوية'],
    10: ['قطف الزيتون', 'زراعة القمح', 'تقليل الري'],
    11: ['زراعة الفول والحمص', 'تحضير أشجار الفاكهة للشتاء'],
    12: ['زراعة البصل', 'تقليم الكروم', 'حماية النباتات من الصقيع']
  };
  
  return activities[month as keyof typeof activities] || [];
}

function getMonthlyTemperature(month: number, governorate: string): {min: number, max: number} {
  // Simplified temperature data for Tunisia
  const temps = [
    {min: 7, max: 16}, {min: 8, max: 17}, {min: 11, max: 20}, {min: 14, max: 23},
    {min: 18, max: 27}, {min: 22, max: 31}, {min: 25, max: 34}, {min: 25, max: 34},
    {min: 22, max: 30}, {min: 18, max: 26}, {min: 13, max: 21}, {min: 9, max: 17}
  ];
  
  return temps[month - 1];
}

function getMonthlyRainfall(month: number, governorate: string): number {
  // Average rainfall in mm for Tunisia
  const rainfall = [48, 41, 35, 25, 15, 8, 3, 7, 25, 45, 38, 52];
  return rainfall[month - 1];
}

function getMonthlyRecommendations(month: number, governorate: string): string[] {
  const recommendations = {
    1: ['احم النباتات من الصقيع', 'قلل من الري'],
    2: ['راقب تطور النباتات', 'حضر للموسم الجديد'],
    3: ['ابدأ برنامج الري المنتظم', 'راقب الآفات الربيعية'],
    4: ['كثف من المراقبة', 'ابدأ برنامج التسميد'],
    5: ['زد من كمية الري', 'راقب الآفات الصيفية'],
    6: ['ري مكثف في الظهيرة', 'حماية من الحر الشديد'],
    7: ['ري مبكر ومتأخر', 'تجنب العمل في منتصف النهار'],
    8: ['استمر في الري المكثف', 'راقب علامات الإجهاد المائي'],
    9: ['قلل تدريجياً من الري', 'استعد لموسم القطف'],
    10: ['اضبط الري حسب الأمطار', 'ابدأ تحضيرات الشتاء'],
    11: ['قلل من الري', 'حضر للزراعات الشتوية'],
    12: ['ري خفيف فقط', 'احم من الصقيع']
  };
  
  return recommendations[month as keyof typeof recommendations] || [];
}

function getClimateInfo(governorate: string) {
  return {
    type: 'مناخ متو��طي',
    characteristics: [
      'صيف حار وجاف',
      'شتاء معتدل وممطر',
      'أمطار موسمية في الشتاء',
      'رياح متغيرة حسب الموسم'
    ],
    challenges: [
      'ندرة المياه في الصيف',
      'تقلبات الطقس',
      'أمطار غير منتظمة',
      'موجات حر صيفية'
    ]
  };
}

function generateWeatherAlerts(forecast: any[] | null | undefined) {
  if (!Array.isArray(forecast)) return [];
  const alerts = [];
  
  forecast.forEach((day, index) => {
    // Temperature alerts
    if (day.temperature.max > 40) {
      alerts.push({
        id: `heat-${index}`,
        type: 'temperature',
        severity: 'warning',
        title: 'تحذير من موجة حر',
        message: `درجة حرارة مرتفعة متوقعة ${day.temperature.max}°م`,
        date: day.date,
        recommendations: [
          'تجنب الري في منتصف النهار',
          'احم النباتات الحساسة',
          'زد من تكرار الري'
        ]
      });
    }
    
    // Frost alerts
    if (day.temperature.min < 2) {
      alerts.push({
        id: `frost-${index}`,
        type: 'frost',
        severity: 'critical',
        title: 'تحذير من الصقيع',
        message: `درجة حرارة منخفضة جداً متوقعة ${day.temperature.min}°م`,
        date: day.date,
        recommendations: [
          'احم النباتات الحساسة',
          'استخدم أغطية واقية',
          'تجنب الري قبل الصقيع'
        ]
      });
    }
    
    // Wind alerts
    if (day.windSpeed > 25) {
      alerts.push({
        id: `wind-${index}`,
        type: 'wind',
        severity: 'warning',
        title: 'رياح قوية',
        message: `رياح قوية متوقعة ${day.windSpeed} كم/س`,
        date: day.date,
        recommendations: [
          'تجنب الرش والتسميد الورقي',
          'اربط النباتات الطويلة',
          'تأجيل أعمال الزراعة'
        ]
      });
    }
    
    // Rain alerts
    if (day.precipitation > 20) {
      alerts.push({
        id: `rain-${index}`,
        type: 'precipitation',
        severity: 'info',
        title: 'أمطار غزيرة متوقعة',
        message: `أمطار قوية متوقعة ${day.precipitation} مم`,
        date: day.date,
        recommendations: [
          'تأجيل أعمال الري',
          'تحقق من تصريف المياه',
          'احم التربة من التآكل'
        ]
      });
    }
  });
  
  return alerts;
}

export default router;
