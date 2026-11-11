import { RequestHandler } from "express";
import {
  getWeatherFromOpenMeteo,
  getHistoricalWeatherFromOpenMeteo,
  type WeatherData,
} from "../services/providers/weatherProvider";
import { ProviderError } from "../services/providers/http";
import { markReal } from "../lib/provenance";

export type { WeatherData };

/**
 * Tunisian governorate coordinates. Used to resolve a governorate name into
 * coordinates before querying the real weather provider.
 */
const GOVERNORATE_COORDINATES: Record<string, { lat: number; lon: number }> = {
  tunis: { lat: 36.8065, lon: 10.1815 },
  ariana: { lat: 36.8625, lon: 10.1647 },
  "ben-arous": { lat: 36.7167, lon: 10.2167 },
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
  "sidi-bouzid": { lat: 35.0381, lon: 9.4858 },
  gabès: { lat: 33.8815, lon: 10.0982 },
  medenine: { lat: 33.3548, lon: 10.5055 },
  tataouine: { lat: 32.9297, lon: 10.4518 },
  gafsa: { lat: 34.425, lon: 8.7842 },
  tozeur: { lat: 33.9197, lon: 8.1335 },
  kebili: { lat: 33.7047, lon: 8.9694 },
};

function normaliseGovernorate(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

function isValidCoordinate(lat: number, lon: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

function providerErrorResponse(
  error: unknown,
  res: any,
  fallbackMessage: string,
) {
  if (error instanceof ProviderError) {
    const status = error.kind === "unconfigured" ? 503 : 502;
    console.error(`Weather provider error (${error.kind}): ${error.message}`);
    return res.status(status).json({
      error: fallbackMessage,
      message: error.message,
      provider: error.provider,
      reason: error.kind,
      // Explicitly signal that no real data was returned, so the client never
      // renders fabricated values as observations.
      dataAvailable: false,
    });
  }
  console.error("Unexpected weather error:", error);
  return res.status(500).json({
    error: fallbackMessage,
    dataAvailable: false,
  });
}

export const getWeatherByCoordinates: RequestHandler = async (req, res) => {
  const lat = parseFloat(req.query.lat as string);
  const lon = parseFloat(req.query.lon as string);

  if (!isValidCoordinate(lat, lon)) {
    return res.status(400).json({
      error: "يجب تحديد خط العرض وخط الطول بشكل صحيح",
    });
  }

  try {
    const weatherData = await getWeatherFromOpenMeteo({ lat, lon });
    markReal(res, "open-meteo");
    res.json(weatherData);
  } catch (error) {
    providerErrorResponse(error, res, "خطأ في جلب بيانات الطقس");
  }
};

export const getWeatherByLocation: RequestHandler = async (req, res) => {
  const governorate = req.query.governorate as string;
  const city = req.query.city as string;

  if (!governorate) {
    return res.status(400).json({ error: "يجب تحديد المحافظة" });
  }

  const key = normaliseGovernorate(governorate);
  const coords = GOVERNORATE_COORDINATES[key];

  if (!coords) {
    return res.status(404).json({
      error: "المحافظة غير موجودة",
      availableGovernorates: Object.keys(GOVERNORATE_COORDINATES),
    });
  }

  try {
    const weatherData = await getWeatherFromOpenMeteo({
      lat: coords.lat,
      lon: coords.lon,
      locationName: city ? `${city}, ${governorate}` : governorate,
      governorate: key,
    });
    markReal(res, "open-meteo");
    res.json(weatherData);
  } catch (error) {
    providerErrorResponse(error, res, "خطأ في جلب بيانات الطقس");
  }
};

/**
 * Return measured climate inputs for crop suitability from the trailing 12 months.
 * This uses daily observations from Open-Meteo Archive; it never substitutes
 * a short forecast or a governorate-level illustrative climatology for annual rainfall.
 */
export const getCropClimateInputs: RequestHandler = async (req, res) => {
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  if (!isValidCoordinate(lat, lon)) {
    return res.status(400).json({ error: "Valid farm latitude and longitude are required.", dataAvailable: false });
  }
  try {
    const history = await getHistoricalWeatherFromOpenMeteo(lat, lon, 12);
    const monthly = history.monthly.filter((item) =>
      Number.isFinite(item.avgTemp) && Number.isFinite(item.totalRainfall)
    );
    if (monthly.length < 12) {
      return res.status(503).json({
        error: "Insufficient historical weather observations for crop planning.",
        dataAvailable: false,
        provider: history.source.provider,
      });
    }
    const temperature = monthly.reduce((sum, item) => sum + item.avgTemp, 0) / monthly.length;
    const annualRainfall = monthly.reduce((sum, item) => sum + item.totalRainfall, 0);
    if (!Number.isFinite(temperature) || !Number.isFinite(annualRainfall)) {
      return res.status(502).json({ error: "Weather provider returned invalid climate observations.", dataAvailable: false });
    }
    markReal(res, "open-meteo-archive");
    return res.json({
      data: {
        temperature: Math.round(temperature * 10) / 10,
        annual_rainfall: Math.round(annualRainfall * 10) / 10,
        period_months: monthly.map((item) => item.month),
        latitude: lat,
        longitude: lon,
      },
      dataSource: history.source.provider,
      isRealData: true,
      verification: "verified",
      observedAt: new Date().toISOString(),
      method: "Mean of observed monthly mean temperatures and sum of observed monthly precipitation over the trailing 12-month archive period.",
      note: "Observed trailing-12-month climate, not a long-term climate normal.",
    });
  } catch (error) {
    providerErrorResponse(error, res, "تعذّر جلب السجل المناخي للمزرعة");
  }
};

export const getCropSpecificWeather: RequestHandler = async (req, res) => {
  const lat = parseFloat(req.query.lat as string);
  const lon = parseFloat(req.query.lon as string);
  const cropType = req.query.cropType as string;

  if (!isValidCoordinate(lat, lon) || !cropType) {
    return res.status(400).json({
      error: "يجب تحديد الموقع ونوع المحصول",
    });
  }

  try {
    const baseWeather = await getWeatherFromOpenMeteo({ lat, lon });
    const cropRecommendations = getCropSpecificRecommendations(
      cropType,
      baseWeather,
    );
    markReal(res, "open-meteo");
    res.json({ ...baseWeather, cropSpecific: cropRecommendations });
  } catch (error) {
    providerErrorResponse(error, res, "خطأ في جلب بيانات الطقس للمحصول");
  }
};

/**
 * Derive crop advisories from real weather values. Thresholds are simple
 * agronomic heuristics applied to observed data — not invented observations.
 */
function getCropSpecificRecommendations(
  cropType: string,
  weather: WeatherData,
) {
  const temp = weather.current.temperature;
  const humidity = weather.current.humidity;
  const soilMoisture = weather.agriculturalIndices.soilMoisture;

  const recommendations: Record<string, any> = {
    wheat: {
      plantingWindow: temp < 25 ? "مناسب للزراعة" : "انتظر انخفاض الحرارة",
      irrigationNeeds: soilMoisture < 50 ? "يحتاج ري" : "كافٍ حالياً",
      riskFactors: temp > 30 ? ["حرارة عالية قد تضر النمو"] : [],
      growthStage: "قدّر المرحلة بناءً على التوقيت والطقس الفعلي",
    },
    tomato: {
      plantingWindow:
        temp > 15 && temp < 30 ? "مناسب للزراعة" : "ظروف غير مثالية",
      irrigationNeeds: soilMoisture < 70 ? "يحتاج ري منتظم" : "كافٍ حالياً",
      riskFactors:
        humidity > 80 ? ["رطوبة عالية - خطر الأمراض الفطرية"] : [],
      growthStage: "قدّر المرحلة بناءً على التوقيت والطقس الفعلي",
    },
  };

  return (
    recommendations[cropType] || {
      plantingWindow: "تحتاج تقييماً متخصصاً",
      irrigationNeeds: "راقب رطوبة التربة",
      riskFactors: [],
      growthStage: "غير محدد",
    }
  );
}
