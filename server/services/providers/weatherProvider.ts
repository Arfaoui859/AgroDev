/**
 * Production weather provider: WeatherAPI.com for current conditions + forecast,
 * NASA POWER for historical daily meteorological observations.
 *
 * WeatherAPI.com Free currently includes 100,000 calls/month and a 3-day
 * forecast for commercial applications. Keep the key server-side only.
 */
import { fetchJson, round, ProviderError } from "./http";

export interface WeatherData {
  location: { name: string; lat: number; lon: number };
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
      /** Daily shortwave radiation (kWh/m2/day) from the provider, when available. */
      solarRadiation?: number;
      /** Daily maximum UV index from the provider, when available. */
      uvIndex?: number;
      /** Daily mean sea-level pressure (hPa) from the provider, when available. */
      pressure?: number;
      /** Daily mean horizontal visibility (km) from the provider, when available. */
      visibility?: number;
      /** Dominant daily wind direction (degrees) from the provider, when available. */
      windDirection?: number;
      /** Daily maximum wind speed (km/h) from the provider, when available. */
      windSpeed?: number;
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
    isClimatology?: boolean;
    source?: string;
  };
  agriculturalIndices: {
    growingDegreeDays: number;
    evapotranspiration: number;
    soilMoisture: number;
    soilMoistureSource?: "weather-derived-estimate";
    cropStress: "low" | "medium" | "high";
  };
  /** Provenance so callers never confuse real observations with estimates. */
  source: {
    provider: string;
    observationTime: string | null;
    isRealData: true;
  };
}

interface WeatherApiResponse {
  current?: {
    last_updated?: string;
    temp_c?: number;
    humidity?: number;
    wind_kph?: number;
    pressure_mb?: number;
    vis_km?: number;
    condition?: { text?: string; code?: number };
  };
  forecast?: {
    forecastday?: Array<{
      date?: string;
      day?: {
        maxtemp_c?: number;
        mintemp_c?: number;
        avghumidity?: number;
        totalprecip_mm?: number;
        condition?: { text?: string; code?: number };
        maxwind_kph?: number;
        avgvis_km?: number;
        uv?: number;
      };
    }>;
  };
}

interface NasaPowerResponse {
  properties?: {
    parameter?: Record<string, Record<string, number>>;
  };
}

// WeatherAPI condition codes -> stable UI icon keys.
const WEATHERAPI_ICONS: Record<number, string> = {
  1000: "sunny", 1003: "partly-cloudy", 1006: "cloudy", 1009: "cloudy",
  1030: "mist", 1063: "rain", 1066: "snow", 1069: "sleet", 1072: "drizzle",
  1087: "thunderstorm", 1114: "snow", 1117: "snow", 1135: "mist", 1147: "mist",
  1150: "drizzle", 1153: "drizzle", 1168: "drizzle", 1171: "drizzle",
  1180: "rain", 1183: "rain", 1186: "rain", 1189: "rain", 1192: "rain", 1195: "rain",
  1198: "sleet", 1201: "sleet", 1204: "sleet", 1207: "sleet",
  1210: "snow", 1213: "snow", 1216: "snow", 1219: "snow", 1222: "snow", 1225: "snow",
  1237: "hail", 1240: "rain", 1243: "rain", 1246: "rain",
  1249: "sleet", 1252: "sleet", 1255: "snow", 1258: "snow",
  1261: "hail", 1264: "hail", 1273: "thunderstorm", 1276: "thunderstorm",
  1279: "thunderstorm", 1282: "thunderstorm",
};

function decodeWeatherCondition(condition?: { text?: string; code?: number }) {
  return {
    description: condition?.text?.trim() || "غير متوفر",
    icon: typeof condition?.code === "number"
      ? WEATHERAPI_ICONS[condition.code] ?? "unknown"
      : "unknown",
  };
}

const MONTHS_AR = [
  "جانفي",
  "فيفري",
  "مارس",
  "أفريل",
  "ماي",
  "جوان",
  "جويلية",
  "أوت",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

export interface WeatherRequest {
  lat: number;
  lon: number;
  locationName?: string;
  /** Tunisian governorate used to derive a default climatology for the seasonal table. */
  governorate?: string;
}

/**
 * Fetch current conditions and a 3-day forecast from WeatherAPI.com.
 * Results are cached for 8 minutes and concurrent requests for the same
 * rounded coordinates share one upstream call.
 */
const weatherCache = new Map<string, { expiresAt: number; value: WeatherData }>();
const weatherInflight = new Map<string, Promise<WeatherData>>();

export async function getWeatherFromWeatherApi(
  request: WeatherRequest,
): Promise<WeatherData> {
  const { lat, lon, locationName } = request;
  const apiKey = process.env.WEATHERAPI_KEY || process.env.WEATHER_API_KEY;
  if (!apiKey) {
    throw new ProviderError("WeatherAPI.com", "unconfigured", "WEATHERAPI_KEY is not configured");
  }

  const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const cached = weatherCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const pending = weatherInflight.get(cacheKey);
  if (pending) return pending;

  const task = (async () => {
    const params = new URLSearchParams({
      key: apiKey,
      q: `${lat},${lon}`,
      days: "3",
      aqi: "no",
      alerts: "no",
      lang: "ar",
    });
    const data = await fetchJson<WeatherApiResponse>(
      `https://api.weatherapi.com/v1/forecast.json?${params.toString()}`,
      {
        provider: "WeatherAPI.com",
        timeoutMs: Number(process.env.WEATHER_FORECAST_TIMEOUT_MS) || 8_000,
        retries: Number(process.env.WEATHER_FORECAST_RETRIES ?? 1),
        retryDelayMs: 350,
        maxRetryDelayMs: 2_500,
      },
    );

    const current = data?.current;
    const forecastDays = data?.forecast?.forecastday ?? [];
    if (
      !current ||
      !Number.isFinite(current.temp_c) ||
      !Number.isFinite(current.humidity) ||
      forecastDays.length === 0
    ) {
      throw new ProviderError("WeatherAPI.com", "parse", "WeatherAPI.com returned an incomplete current/forecast payload");
    }

    const currentCondition = decodeWeatherCondition(current.condition);
    const dailyForecast = forecastDays.map((entry) => {
      const day = entry.day ?? {};
      const condition = decodeWeatherCondition(day.condition);
      return {
        date: String(entry.date ?? ""),
        maxTemp: round(day.maxtemp_c),
        minTemp: round(day.mintemp_c),
        humidity: round(day.avghumidity),
        rainfall: round(day.totalprecip_mm, 1),
        description: condition.description,
        icon: condition.icon,
        uvIndex: typeof day.uv === "number" ? round(day.uv) : undefined,
        visibility: typeof day.avgvis_km === "number" ? round(day.avgvis_km, 1) : undefined,
        windSpeed: typeof day.maxwind_kph === "number" ? round(day.maxwind_kph) : undefined,
      };
    });

    const avgTemp = dailyForecast.reduce((sum, d) => sum + (d.maxTemp + d.minTemp) / 2, 0) / dailyForecast.length;
    const totalRainfall = dailyForecast.reduce((sum, d) => sum + d.rainfall, 0);
    const avgHumidity = dailyForecast.reduce((sum, d) => sum + d.humidity, 0) / dailyForecast.length;
    const et0 = calculateEvapotranspiration(
      current.temp_c,
      current.humidity,
      current.wind_kph ?? 10,
    );
    // WeatherAPI does not expose measured field soil moisture on the free tier.
    // This is explicitly a weather-derived proxy, not a soil sensor reading.
    const soilMoisturePercent = estimateSoilMoisturePercent(et0, dailyForecast[0]?.rainfall ?? 0);
    const cropStress: "low" | "medium" | "high" =
      soilMoisturePercent > 60 ? "low" : soilMoisturePercent > 35 ? "medium" : "high";

    const value: WeatherData = {
      location: {
        name: locationName || `موقع (${lat.toFixed(2)}, ${lon.toFixed(2)})`,
        lat,
        lon,
      },
      current: {
        temperature: round(current.temp_c),
        humidity: round(current.humidity),
        windSpeed: round(current.wind_kph),
        pressure: round(current.pressure_mb),
        visibility: round(current.vis_km, 1),
        description: currentCondition.description,
        icon: currentCondition.icon,
      },
      forecast: {
        daily: dailyForecast,
        weekly: {
          averageTemp: round(avgTemp),
          totalRainfall: round(totalRainfall, 1),
          averageHumidity: round(avgHumidity),
        },
      },
      historical: {
        monthlyAverages: buildSeasonalClimatology(
          request.governorate,
          current.temp_c,
          current.humidity,
        ),
        isClimatology: true,
        source: "governorate-climatology-estimate",
      },
      agriculturalIndices: {
        growingDegreeDays: round(dailyForecast.reduce(
          (sum, d) => sum + Math.max(0, (d.maxTemp + d.minTemp) / 2 - 10), 0,
        )),
        evapotranspiration: round(et0, 1),
        soilMoisture: soilMoisturePercent,
        soilMoistureSource: "weather-derived-estimate",
        cropStress,
      },
      source: {
        provider: "WeatherAPI.com",
        observationTime: current.last_updated ?? null,
        isRealData: true,
      },
    };

    weatherCache.set(cacheKey, { expiresAt: Date.now() + 8 * 60 * 1000, value });
    return value;
  })();

  weatherInflight.set(cacheKey, task);
  try {
    return await task;
  } finally {
    weatherInflight.delete(cacheKey);
  }
}

/**
 * This fallback seasonal table is an approximate climatology, not a measured
 * historical time series. Historical trend endpoints use NASA POWER separately.
 */
function buildSeasonalClimatology(
  governorate: string | undefined,
  currentTemp: number,
  currentHumidity: number,
): WeatherData["historical"]["monthlyAverages"] {
  const base = governorate ? TUNISIA_MONTHLY_TEMP[governorate] : undefined;
  return MONTHS_AR.map((month, index) => {
    const temp = base ? base[index] : currentTemp + Math.sin(((index - 6) * Math.PI) / 6) * 8;
    return {
      month,
      avgTemp: round(temp),
      totalRainfall: round(base ? TUNISIA_MONTHLY_RAIN[index] : Math.max(0, 40 - index * 3), 1),
      avgHumidity: round(currentHumidity),
    };
  });
}

/** Approximate monthly mean temperature (°C) by Tunisian governorate (Jan..Dec). */
const TUNISIA_MONTHLY_TEMP: Record<string, number[]> = {
  tunis: [12, 12, 14, 16, 20, 24, 27, 27, 25, 21, 16, 13],
  sfax: [12, 13, 15, 18, 21, 25, 28, 28, 26, 22, 17, 13],
  tozeur: [11, 13, 16, 20, 25, 29, 32, 32, 29, 24, 17, 12],
  bizerte: [11, 11, 13, 15, 19, 23, 26, 26, 24, 20, 15, 12],
  gabès: [12, 13, 15, 18, 22, 25, 28, 28, 26, 22, 17, 13],
};

/** Approximate monthly rainfall (mm) representative of northern Tunisia (Jan..Dec). */
const TUNISIA_MONTHLY_RAIN = [70, 60, 50, 40, 25, 10, 5, 8, 30, 55, 65, 75];

/** FAO-56 derived reference evapotranspiration (mm/day) from current observations. */
export function calculateEvapotranspiration(
  temp: number,
  humidity: number,
  windSpeed: number,
): number {
  const delta =
    (4098 * (0.6108 * Math.exp((17.27 * temp) / (temp + 237.3)))) /
    Math.pow(temp + 237.3, 2);
  const gamma = 0.665;
  const u2 = windSpeed * 0.748;
  const es = 0.6108 * Math.exp((17.27 * temp) / (temp + 237.3));
  const ea = (es * humidity) / 100;
  const radiation = 15;
  const et0 =
    (0.408 * delta * radiation +
      ((gamma * 900) / (temp + 273)) * u2 * (es - ea)) /
    (delta + gamma * (1 + 0.34 * u2));
  return Math.max(0, et0);
}

function estimateSoilMoisturePercent(et0: number, todayRainfall: number): number {
  return round(Math.max(0, Math.min(100, 60 - et0 * 3 + todayRainfall * 10)));
}

export interface HistoricalMonthlyAverage {
  /** Calendar month as YYYY-MM. */
  month: string;
  avgTemp: number;
  totalRainfall: number;
  avgHumidity: number;
}

export interface HistoricalWeather {
  monthly: HistoricalMonthlyAverage[];
  source: { provider: string; isRealData: true };
}

/**
 * Fetch daily historical meteorology from NASA POWER and aggregate it by month.
 * NASA POWER provides global daily meteorological data from 1981 to near-real-time.
 * Cache successful aggregates for 24 hours because this endpoint is archival,
 * not a live observation service.
 */
const historyCache = new Map<string, { expiresAt: number; value: HistoricalWeather }>();

export async function getHistoricalWeatherFromNasaPower(
  lat: number,
  lon: number,
  months: number,
): Promise<HistoricalWeather> {
  const count = Math.max(1, Math.min(60, Math.trunc(months)));
  const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)},${count}`;
  const cached = historyCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 3); // POWER daily products are not instantaneous.
  const start = new Date(end);
  start.setUTCMonth(start.getUTCMonth() - count);
  const formatDate = (date: Date) =>
    `${date.getUTCFullYear()}${String(date.getUTCMonth()+1).padStart(2,"0")}${String(date.getUTCDate()).padStart(2,"0")}`;

  const params = new URLSearchParams({
    parameters: "T2M,T2M_MAX,T2M_MIN,RH2M,PRECTOTCORR",
    community: "AG",
    longitude: String(lon),
    latitude: String(lat),
    start: formatDate(start),
    end: formatDate(end),
    format: "JSON",
    "time-standard": "UTC",
  });
  const data = await fetchJson<NasaPowerResponse>(
    `https://power.larc.nasa.gov/api/temporal/daily/point?${params.toString()}`,
    {
      provider: "NASA POWER",
      timeoutMs: Number(process.env.WEATHER_HISTORY_TIMEOUT_MS) || 25_000,
      retries: 1,
      retryDelayMs: 700,
      maxRetryDelayMs: 3_000,
    },
  );

  const parameters = data?.properties?.parameter;
  const temps = parameters?.T2M ?? {};
  const maxTemps = parameters?.T2M_MAX ?? {};
  const minTemps = parameters?.T2M_MIN ?? {};
  const humidity = parameters?.RH2M ?? {};
  const rainfall = parameters?.PRECTOTCORR ?? {};
  const buckets = new Map<string, { tempSum: number; tempCount: number; rainSum: number; humSum: number; humCount: number }>();

  for (const [dateKey, rawTemp] of Object.entries(temps)) {
    const temp = Number.isFinite(rawTemp) && rawTemp > -900
      ? rawTemp
      : (Number(maxTemps[dateKey]) > -900 && Number(minTemps[dateKey]) > -900
        ? (Number(maxTemps[dateKey]) + Number(minTemps[dateKey])) / 2
        : null);
    const hum = humidity[dateKey];
    const rain = rainfall[dateKey];
    if (temp === null && !(typeof rain === "number" && rain > -900)) continue;
    const month = `${dateKey.slice(0,4)}-${dateKey.slice(4,6)}`;
    const bucket = buckets.get(month) ?? { tempSum: 0, tempCount: 0, rainSum: 0, humSum: 0, humCount: 0 };
    if (temp !== null) { bucket.tempSum += temp; bucket.tempCount++; }
    if (typeof hum === "number" && hum > -900) { bucket.humSum += hum; bucket.humCount++; }
    if (typeof rain === "number" && rain > -900) bucket.rainSum += rain;
    buckets.set(month, bucket);
  }

  const monthly = [...buckets.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([month,b])=>({
    month,
    avgTemp: b.tempCount ? round(b.tempSum/b.tempCount,1) : 0,
    totalRainfall: round(b.rainSum,1),
    avgHumidity: b.humCount ? round(b.humSum/b.humCount) : 0,
  }));
  if (!monthly.length) {
    throw new ProviderError("NASA POWER", "parse", "NASA POWER returned no valid historical daily observations");
  }

  const value: HistoricalWeather = {
    monthly,
    source: { provider: "NASA POWER", isRealData: true },
  };
  historyCache.set(cacheKey, { expiresAt: Date.now() + 24 * 60 * 60 * 1000, value });
  return value;
}
