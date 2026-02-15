import { RequestHandler } from "express";

export interface WeatherData {
  location: {
    name: string;
    lat: number;
    lon: number;
  };
  current: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    pressure: number;
    visibility: number;
    description: string;
    icon: string;
  };
  forecast: {
    daily: Array<{
      date: string;
      maxTemp: number;
      minTemp: number;
      humidity: number;
      rainfall: number;
      description: string;
      icon: string;
    }>;
    weekly: {
      averageTemp: number;
      totalRainfall: number;
      averageHumidity: number;
    };
  };
  historical: {
    monthlyAverages: Array<{
      month: string;
      avgTemp: number;
      totalRainfall: number;
      avgHumidity: number;
    }>;
  };
  agriculturalIndices: {
    growingDegreeDays: number;
    evapotranspiration: number;
    soilMoisture: number;
    cropStress: 'low' | 'medium' | 'high';
  };
}

export const getWeatherByCoordinates: RequestHandler = async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({ 
        error: "يجب تحديد خط العرض وخط الطول" 
      });
    }

    // In a real implementation, this would call OpenWeatherMap API or similar
    // For now, we'll return mock data based on Egyptian climate patterns
    
    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lon as string);
    
    // Mock weather data with realistic values for Egypt
    const weatherData: WeatherData = generateMockWeatherData(latitude, longitude);
    
    res.json(weatherData);
  } catch (error) {
    console.error('Weather API error:', error);
    res.status(500).json({ 
      error: "خطأ في جلب بيانات الطقس" 
    });
  }
};

export const getWeatherByLocation: RequestHandler = async (req, res) => {
  try {
    const { governorate, city } = req.query;
    
    if (!governorate) {
      return res.status(400).json({ 
        error: "يجب تحديد المحافظة" 
      });
    }

    // Mock coordinates for Egyptian governorates
    const governorateCoords = getGovernorateCoordinates(governorate as string);
    
    if (!governorateCoords) {
      return res.status(404).json({ 
        error: "المحافظة غير موجودة" 
      });
    }

    const weatherData: WeatherData = generateMockWeatherData(
      governorateCoords.lat, 
      governorateCoords.lon,
      `${city || ''}, ${governorate}`
    );
    
    res.json(weatherData);
  } catch (error) {
    console.error('Weather API error:', error);
    res.status(500).json({ 
      error: "خطأ في جلب بيانات الطقس" 
    });
  }
};

function generateMockWeatherData(lat: number, lon: number, locationName?: string): WeatherData {
  // Base temperature varies by region in Tunisia - Mediterranean climate
  const baseTemp = lat > 36 ? 20 : lat > 34 ? 25 : 30; // Cooler in north, warmer in south
  const currentTemp = baseTemp + (Math.random() - 0.5) * 8;

  // Humidity is generally higher near Mediterranean coast
  const baseHumidity = lat > 35 ? 70 : 55; // Higher humidity in northern coastal areas
  const humidity = Math.max(40, Math.min(85, baseHumidity + (Math.random() - 0.5) * 15));
  
  const windSpeed = 5 + Math.random() * 15;
  const pressure = 1010 + (Math.random() - 0.5) * 20;
  
  // Generate 7-day forecast
  const dailyForecast = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    
    return {
      date: date.toISOString().split('T')[0],
      maxTemp: Math.round(currentTemp + (Math.random() - 0.5) * 6),
      minTemp: Math.round(currentTemp - 8 - Math.random() * 4),
      humidity: Math.round(humidity + (Math.random() - 0.5) * 15),
      rainfall: Math.random() < 0.2 ? Math.random() * 10 : 0, // 20% chance of rain
      description: getWeatherDescription(),
      icon: getWeatherIcon()
    };
  });
  
  // Calculate weekly averages
  const weeklyAvgTemp = dailyForecast.reduce((sum, day) => sum + (day.maxTemp + day.minTemp) / 2, 0) / 7;
  const weeklyTotalRain = dailyForecast.reduce((sum, day) => sum + day.rainfall, 0);
  const weeklyAvgHumidity = dailyForecast.reduce((sum, day) => sum + day.humidity, 0) / 7;
  
  // Generate historical monthly data
  const monthlyAverages = Array.from({ length: 12 }, (_, i) => {
    const monthTemp = baseTemp + Math.sin((i - 6) * Math.PI / 6) * 10; // Seasonal variation
    return {
      month: new Date(2024, i, 1).toLocaleDateString('ar-EG', { month: 'long' }),
      avgTemp: Math.round(monthTemp),
      totalRainfall: Math.random() * (i < 3 || i > 10 ? 20 : 2), // More rain in winter
      avgHumidity: Math.round(humidity + (Math.random() - 0.5) * 10)
    };
  });
  
  // Calculate agricultural indices
  const gdd = Math.max(0, currentTemp - 10) * 30; // Growing degree days for current month
  const et = calculateEvapotranspiration(currentTemp, humidity, windSpeed);
  const soilMoisture = Math.max(0, 100 - et + (dailyForecast[0].rainfall * 10));
  const cropStress = soilMoisture > 70 ? 'low' : soilMoisture > 40 ? 'medium' : 'high';
  
  return {
    location: {
      name: locationName || `موقع (${lat.toFixed(2)}, ${lon.toFixed(2)})`,
      lat,
      lon
    },
    current: {
      temperature: Math.round(currentTemp),
      humidity: Math.round(humidity),
      windSpeed: Math.round(windSpeed),
      pressure: Math.round(pressure),
      visibility: Math.round(8 + Math.random() * 7),
      description: getWeatherDescription(),
      icon: getWeatherIcon()
    },
    forecast: {
      daily: dailyForecast,
      weekly: {
        averageTemp: Math.round(weeklyAvgTemp),
        totalRainfall: Math.round(weeklyTotalRain * 10) / 10,
        averageHumidity: Math.round(weeklyAvgHumidity)
      }
    },
    historical: {
      monthlyAverages
    },
    agriculturalIndices: {
      growingDegreeDays: Math.round(gdd),
      evapotranspiration: Math.round(et * 10) / 10,
      soilMoisture: Math.round(soilMoisture),
      cropStress
    }
  };
}

function getGovernorateCoordinates(governorate: string): { lat: number; lon: number } | null {
  const coords: { [key: string]: { lat: number; lon: number } } = {
    'tunis': { lat: 36.8065, lon: 10.1815 },
    'ariana': { lat: 36.8625, lon: 10.1647 },
    'ben-arous': { lat: 36.7167, lon: 10.2167 },
    'manouba': { lat: 36.8089, lon: 10.0969 },
    'nabeul': { lat: 36.4560, lon: 10.7376 },
    'zaghouan': { lat: 36.4028, lon: 10.1425 },
    'bizerte': { lat: 37.2746, lon: 9.8739 },
    'beja': { lat: 36.7256, lon: 9.1817 },
    'jendouba': { lat: 36.5011, lon: 8.7803 },
    'kef': { lat: 36.1743, lon: 8.7040 },
    'siliana': { lat: 36.0853, lon: 9.3703 },
    'sousse': { lat: 35.8256, lon: 10.6369 },
    'monastir': { lat: 35.7781, lon: 10.8264 },
    'mahdia': { lat: 35.5047, lon: 11.0624 },
    'sfax': { lat: 34.7406, lon: 10.7603 },
    'kairouan': { lat: 35.6781, lon: 10.0963 },
    'kasserine': { lat: 35.1674, lon: 8.8366 },
    'sidi-bouzid': { lat: 35.0381, lon: 9.4858 },
    'gabès': { lat: 33.8815, lon: 10.0982 },
    'medenine': { lat: 33.3548, lon: 10.5055 },
    'tataouine': { lat: 32.9297, lon: 10.4518 },
    'gafsa': { lat: 34.4250, lon: 8.7842 },
    'tozeur': { lat: 33.9197, lon: 8.1335 },
    'kebili': { lat: 33.7047, lon: 8.9694 }
  };

  return coords[governorate] || null;
}

function getWeatherDescription(): string {
  const descriptions = [
    'مشمس',
    'مشمس جزئياً',
    'غائم جزئياً',
    'غائم',
    'صافي',
    'ضباب خفيف',
    'رياح خفيفة'
  ];
  
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

function getWeatherIcon(): string {
  const icons = [
    'sunny',
    'partly-cloudy',
    'cloudy',
    'clear',
    'windy',
    'mist'
  ];
  
  return icons[Math.floor(Math.random() * icons.length)];
}

function calculateEvapotranspiration(temp: number, humidity: number, windSpeed: number): number {
  // Simplified Penman-Monteith equation for daily ET0
  const delta = 4098 * (0.6108 * Math.exp(17.27 * temp / (temp + 237.3))) / Math.pow(temp + 237.3, 2);
  const gamma = 0.665; // psychrometric constant
  const u2 = windSpeed * 0.748; // wind speed at 2m height
  const es = 0.6108 * Math.exp(17.27 * temp / (temp + 237.3));
  const ea = es * humidity / 100;
  
  const radiation = 15; // assumed solar radiation MJ/m²/day
  const et0 = (0.408 * delta * radiation + gamma * 900 / (temp + 273) * u2 * (es - ea)) / 
              (delta + gamma * (1 + 0.34 * u2));
  
  return Math.max(0, et0);
}

export const getCropSpecificWeather: RequestHandler = async (req, res) => {
  try {
    const { lat, lon, cropType } = req.query;
    
    if (!lat || !lon || !cropType) {
      return res.status(400).json({ 
        error: "يجب تحديد الموقع ونوع المحصول" 
      });
    }

    const baseWeather = generateMockWeatherData(
      parseFloat(lat as string), 
      parseFloat(lon as string)
    );
    
    // Add crop-specific recommendations
    const cropRecommendations = getCropSpecificRecommendations(
      cropType as string, 
      baseWeather
    );
    
    res.json({
      ...baseWeather,
      cropSpecific: cropRecommendations
    });
  } catch (error) {
    console.error('Crop weather API error:', error);
    res.status(500).json({ 
      error: "خطأ في جلب بيانات الطقس للمحصول" 
    });
  }
};

function getCropSpecificRecommendations(cropType: string, weather: WeatherData) {
  const recommendations: { [key: string]: any } = {
    wheat: {
      plantingWindow: weather.current.temperature < 25 ? 'مناسب للزراعة' : 'انتظر انخفاض الحرارة',
      irrigationNeeds: weather.agriculturalIndices.soilMoisture < 50 ? 'يحتاج ري' : 'كافي حالياً',
      riskFactors: weather.current.temperature > 30 ? ['حرارة عالية قد تضر النمو'] : [],
      growthStage: 'تقدير المرحلة بناءً على التوقيت والطقس'
    },
    tomato: {
      plantingWindow: weather.current.temperature > 15 && weather.current.temperature < 30 ? 'مناسب للزراعة' : 'ظروف غير مثالية',
      irrigationNeeds: weather.agriculturalIndices.soilMoisture < 70 ? 'يحتاج ري منتظم' : 'كافي حالياً',
      riskFactors: weather.current.humidity > 80 ? ['رطوبة عالية - خطر الأمراض الفطرية'] : [],
      growthStage: 'تقدير المرحلة بناءً على التوقيت والطقس'
    }
  };
  
  return recommendations[cropType] || {
    plantingWindow: 'تحتاج تقييم متخصص',
    irrigationNeeds: 'راقب رطوبة التربة',
    riskFactors: [],
    growthStage: 'غير محدد'
  };
}
