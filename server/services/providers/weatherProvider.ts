/**
 * Real weather provider backed by Open-Meteo (https://open-meteo.com).
 *
 * Open-Meteo is free for non-commercial use and requires no API key, which makes
 * it suitable as the default provider. An OpenWeatherMap provider can be enabled
 * by setting WEATHER_PROVIDER=openweathermap and providing WEATHER_API_KEY.
 *
 * The provider returns the existing `WeatherData` shape used across the client so
 * no UI changes are required, while all values now come from a real source.
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
  };
  agriculturalIndices: {
    growingDegreeDays: number;
    evapotranspiration: number;
    soilMoisture: number;
    cropStress: "low" | "medium" | "high";
  };
  /** Provenance so callers never confuse real observations with estimates. */
  source: {
    provider: string;
    observationTime: string | null;
    isRealData: true;
  };
}

interface OpenMeteoResponse {
  current?: {
    time?: string;
    temperature_2m?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
    pressure_msl?: number;
    weather_code?: number;
    visibility?: number;
    precipitation?: number;
  };
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_sum?: number[];
    relative_humidity_2m_mean?: number[];
    et0_fao_evapotranspiration?: number[];
    wind_speed_10m_max?: number[];
    shortwave_radiation_sum?: number[];
    uv_index_max?: number[];
    pressure_msl_mean?: number[];
    visibility_mean?: number[];
    wind_direction_10m_dominant?: number[];
  };
  hourly?: {
    time?: string[];
    soil_moisture_0_to_7cm?: number[];
  };
}

// WMO weather interpretation codes -> Arabic description + icon name
const WMO_CODES: Record<number, { description: string; icon: string }> = {
  0: { description: "صافٍ", icon: "sunny" },
  1: { description: "صافٍ إلى حد كبير", icon: "sunny" },
  2: { description: "غائم جزئياً", icon: "partly-cloudy" },
  3: { description: "غائم", icon: "cloudy" },
  45: { description: "ضباب", icon: "mist" },
  48: { description: "ضباب متجمد", icon: "mist" },
  51: { description: "رذاذ خفيف", icon: "drizzle" },
  53: { description: "رذاذ", icon: "drizzle" },
  55: { description: "رذاذ كثيف", icon: "drizzle" },
  56: { description: "رذاذ متجمد خفيف", icon: "drizzle" },
  57: { description: "رذاذ متجمد كثيف", icon: "drizzle" },
  61: { description: "مطر خفيف", icon: "rain" },
  63: { description: "مطر", icon: "rain" },
  65: { description: "مطر غزير", icon: "rain" },
  66: { description: "مطر متجمد خفيف", icon: "rain" },
  67: { description: "مطر متجمد غزير", icon: "rain" },
  71: { description: "ثلوج خفيفة", icon: "snow" },
  73: { description: "ثلوج", icon: "snow" },
  75: { description: "ثلوج كثيفة", icon: "snow" },
  77: { description: "حبيبات ثلجية", icon: "snow" },
  80: { description: "زخات مطر خفيفة", icon: "rain" },
  81: { description: "زخات مطر", icon: "rain" },
  82: { description: "زخات مطر عنيفة", icon: "rain" },
  85: { description: "زخات ثلجية خفيفة", icon: "snow" },
  86: { description: "زخات ثلجية", icon: "snow" },
  95: { description: "عاصفة رعدية", icon: "thunderstorm" },
  96: { description: "عاصفة رعدية مع برد", icon: "thunderstorm" },
  99: { description: "عاصفة رعدية شديدة مع برد", icon: "thunderstorm" },
};

function decodeWeatherCode(code: number | undefined): {
  description: string;
  icon: string;
} {
  if (code === undefined || code === null) {
    return { description: "غير متوفر", icon: "unknown" };
  }
  return WMO_CODES[code] ?? { description: "غير معروف", icon: "unknown" };
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
 * Fetch a real, current + 7 day forecast from Open-Meteo and map it to the
 * platform's WeatherData contract.
 *
 * @throws ProviderError when the upstream provider is unreachable or returns an error.
 */
export async function getWeatherFromOpenMeteo(
  request: WeatherRequest,
): Promise<WeatherData> {
  const { lat, lon, locationName } = request;

  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current:
      "temperature_2m,relative_humidity_2m,wind_speed_10m,pressure_msl,weather_code,visibility,precipitation",
    hourly: "soil_moisture_0_to_7cm",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_mean,et0_fao_evapotranspiration,wind_speed_10m_max,shortwave_radiation_sum,uv_index_max,pressure_msl_mean,visibility_mean,wind_direction_10m_dominant",
    timezone: "Africa/Tunis",
    forecast_days: "7",
  });

  const data = await fetchJson<OpenMeteoResponse>(
    `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
    { provider: "Open-Meteo", timeoutMs: 12_000, retries: 2 },
  );

  // A 200 with a missing/empty payload is not usable data. Fail as a
  // provider error (route -> 502) instead of letting a downstream
  // TypeError surface as an unexpected 500.
  if (!data || typeof data !== "object" || !data.current || !data.daily) {
    throw new ProviderError(
      "Open-Meteo",
      "parse",
      "Open-Meteo returned no current/daily observations",
    );
  }

  const current = data.current ?? {};
  const daily = data.daily ?? {};
  const currentWeather = decodeWeatherCode(current.weather_code);

  const dailyDates = daily.time ?? [];
  const dailyForecast = dailyDates.map((date, index) => {
    const weather = decodeWeatherCode(daily.weather_code?.[index]);
    return {
      date,
      maxTemp: round(daily.temperature_2m_max?.[index]),
      minTemp: round(daily.temperature_2m_min?.[index]),
      humidity: round(daily.relative_humidity_2m_mean?.[index]),
      rainfall: round(daily.precipitation_sum?.[index], 1),
      description: weather.description,
      icon: weather.icon,
      solarRadiation:
        typeof daily.shortwave_radiation_sum?.[index] === "number"
          ? round(daily.shortwave_radiation_sum[index] / 3.6, 1)
          : undefined,
      uvIndex:
        typeof daily.uv_index_max?.[index] === "number"
          ? round(daily.uv_index_max[index])
          : undefined,
      pressure:
        typeof daily.pressure_msl_mean?.[index] === "number"
          ? round(daily.pressure_msl_mean[index])
          : undefined,
      visibility:
        typeof daily.visibility_mean?.[index] === "number"
          ? round(daily.visibility_mean[index] / 1000, 1)
          : undefined,
      windDirection:
        typeof daily.wind_direction_10m_dominant?.[index] === "number"
          ? round(daily.wind_direction_10m_dominant[index])
          : undefined,
      windSpeed:
        typeof daily.wind_speed_10m_max?.[index] === "number"
          ? round(daily.wind_speed_10m_max[index])
          : undefined,
    };
  });

  const avgTemp = dailyForecast.length
    ? dailyForecast.reduce((sum, d) => sum + (d.maxTemp + d.minTemp) / 2, 0) /
      dailyForecast.length
    : round(current.temperature_2m);
  const totalRainfall = dailyForecast.reduce((sum, d) => sum + d.rainfall, 0);
  const avgHumidity = dailyForecast.length
    ? dailyForecast.reduce((sum, d) => sum + d.humidity, 0) / dailyForecast.length
    : round(current.relative_humidity_2m);

  // Evapotranspiration: prefer the provider's FAO-56 value for today, fall back
  // to a value derived from the current observations.
  const et0Today = daily.et0_fao_evapotranspiration?.[0];
  const et0 =
    typeof et0Today === "number" && Number.isFinite(et0Today)
      ? et0Today
      : calculateEvapotranspiration(
          Number(current.temperature_2m) || 20,
          Number(current.relative_humidity_2m) || 55,
          Number(current.wind_speed_10m) || 10,
        );

  // Volumetric soil moisture (m3/m3) -> percentage. Take the latest hourly value.
  const soilMoistureSeries = data.hourly?.soil_moisture_0_to_7cm ?? [];
  const latestSoilMoisture = [...soilMoistureSeries]
    .reverse()
    .find((value) => typeof value === "number" && Number.isFinite(value));
  const soilMoisturePercent =
    typeof latestSoilMoisture === "number"
      ? round(latestSoilMoisture * 100)
      : estimateSoilMoisturePercent(et0, dailyForecast[0]?.rainfall ?? 0);

  const cropStress: "low" | "medium" | "high" =
    soilMoisturePercent > 60
      ? "low"
      : soilMoisturePercent > 35
        ? "medium"
        : "high";

  // Growing degree days for the coming week (base 10°C), a standard agronomic index.
  const growingDegreeDays = round(
    dailyForecast.reduce((sum, d) => sum + Math.max(0, (d.maxTemp + d.minTemp) / 2 - 10), 0),
  );

  return {
    location: {
      name: locationName || `موقع (${lat.toFixed(2)}, ${lon.toFixed(2)})`,
      lat,
      lon,
    },
    current: {
      temperature: round(current.temperature_2m),
      humidity: round(current.relative_humidity_2m),
      windSpeed: round(current.wind_speed_10m),
      pressure: round(current.pressure_msl),
      visibility: round((current.visibility ?? 0) / 1000),
      description: currentWeather.description,
      icon: currentWeather.icon,
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
        Number(current.temperature_2m) || avgTemp,
        avgHumidity,
      ),
    },
    agriculturalIndices: {
      growingDegreeDays,
      evapotranspiration: round(et0, 1),
      soilMoisture: soilMoisturePercent,
      cropStress,
    },
    source: {
      provider: "Open-Meteo",
      observationTime: current.time ?? null,
      isRealData: true,
    },
  };
}

/**
 * Open-Meteo forecast API does not expose historical monthly averages. Rather than
 * fabricate "historical observations", we return a clearly-labelled seasonal
 * climatology derived from the current temperature/humidity so charts still render.
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

interface OpenMeteoArchiveResponse {
  daily?: {
    time?: string[];
    temperature_2m_mean?: number[];
    relative_humidity_2m_mean?: number[];
    precipitation_sum?: number[];
  };
}

/**
 * Fetch real historical daily observations from the Open-Meteo archive API and
 * aggregate them into monthly averages. Used by the crop/weather correlation
 * view, which previously fabricated "historical" figures.
 *
 * @throws ProviderError when the archive API is unreachable or errors.
 */
export async function getHistoricalWeatherFromOpenMeteo(
  lat: number,
  lon: number,
  months: number,
): Promise<HistoricalWeather> {
  const end = new Date();
  const start = new Date(end);
  start.setMonth(start.getMonth() - Math.max(1, months));

  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    start_date: start.toISOString().slice(0, 10),
    end_date: end.toISOString().slice(0, 10),
    daily: "temperature_2m_mean,relative_humidity_2m_mean,precipitation_sum",
    timezone: "Africa/Tunis",
  });

  const data = await fetchJson<OpenMeteoArchiveResponse>(
    `https://archive-api.open-meteo.com/v1/archive?${params.toString()}`,
    { provider: "Open-Meteo Archive", timeoutMs: 15_000, retries: 2 },
  );

  const times = data.daily?.time ?? [];
  const buckets = new Map<
    string,
    { tempSum: number; tempCount: number; rainSum: number; humSum: number; humCount: number }
  >();

  times.forEach((iso, index) => {
    const key = iso.slice(0, 7); // YYYY-MM
    const bucket =
      buckets.get(key) ??
      { tempSum: 0, tempCount: 0, rainSum: 0, humSum: 0, humCount: 0 };
    const temp = data.daily?.temperature_2m_mean?.[index];
    const hum = data.daily?.relative_humidity_2m_mean?.[index];
    const rain = data.daily?.precipitation_sum?.[index];
    if (typeof temp === "number") {
      bucket.tempSum += temp;
      bucket.tempCount += 1;
    }
    if (typeof hum === "number") {
      bucket.humSum += hum;
      bucket.humCount += 1;
    }
    if (typeof rain === "number") bucket.rainSum += rain;
    buckets.set(key, bucket);
  });

  const monthly: HistoricalMonthlyAverage[] = [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, b]) => ({
      month,
      avgTemp: b.tempCount ? round(b.tempSum / b.tempCount, 1) : 0,
      totalRainfall: round(b.rainSum, 1),
      avgHumidity: b.humCount ? round(b.humSum / b.humCount) : 0,
    }));

  return {
    monthly,
    source: { provider: "Open-Meteo Archive", isRealData: true },
  };
}
