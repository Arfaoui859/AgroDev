import {
  getHistoricalWeatherFromNasaPower,
  getWeatherFromWeatherApi,
} from "../../server/services/providers/weatherProvider";
import { ProviderError } from "../../server/services/providers/http";

const originalWeatherApiKey = process.env.WEATHERAPI_KEY;
const originalWeatherApiAlias = process.env.WEATHER_API_KEY;
const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  if (originalWeatherApiKey === undefined) delete process.env.WEATHERAPI_KEY;
  else process.env.WEATHERAPI_KEY = originalWeatherApiKey;
  if (originalWeatherApiAlias === undefined) delete process.env.WEATHER_API_KEY;
  else process.env.WEATHER_API_KEY = originalWeatherApiAlias;
});

describe("WeatherAPI.com current conditions and forecast", () => {
  test("maps real current and 3-day forecast fields into the platform contract", async () => {
    process.env.WEATHERAPI_KEY = "unit-test-key";
    delete process.env.WEATHER_API_KEY;
    const payload = {
      current: {
        last_updated: "2026-11-16 10:00",
        temp_c: 23.4,
        humidity: 61,
        wind_kph: 12,
        pressure_mb: 1015,
        vis_km: 10,
        condition: { text: "مشمس", code: 1000 },
      },
      forecast: {
        forecastday: [
          {
            date: "2026-11-16",
            day: {
              maxtemp_c: 25,
              mintemp_c: 15,
              avghumidity: 60,
              totalprecip_mm: 1.2,
              condition: { text: "مشمس", code: 1000 },
              maxwind_kph: 14,
              avgvis_km: 10,
              uv: 4,
            },
          },
          {
            date: "2026-11-17",
            day: {
              maxtemp_c: 26,
              mintemp_c: 16,
              avghumidity: 58,
              totalprecip_mm: 0,
              condition: { text: "غائم جزئياً", code: 1003 },
              maxwind_kph: 13,
              avgvis_km: 10,
              uv: 5,
            },
          },
          {
            date: "2026-11-18",
            day: {
              maxtemp_c: 24,
              mintemp_c: 14,
              avghumidity: 65,
              totalprecip_mm: 3,
              condition: { text: "مطر خفيف", code: 1180 },
              maxwind_kph: 18,
              avgvis_km: 8,
              uv: 3,
            },
          },
        ],
      },
    };
    const fetchMock = jest.fn().mockResolvedValue(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    global.fetch = fetchMock as typeof fetch;

    const result = await getWeatherFromWeatherApi({
      lat: 11.11,
      lon: 22.22,
      locationName: "Test Farm",
    });

    expect(result.source.provider).toBe("WeatherAPI.com");
    expect(result.source.isRealData).toBe(true);
    expect(result.current.temperature).toBe(23);
    expect(result.current.humidity).toBe(61);
    expect(result.forecast.daily).toHaveLength(3);
    expect(result.forecast.daily[0].rainfall).toBe(1.2);
    expect(result.forecast.daily[2].icon).toBe("rain");
    expect(result.agriculturalIndices.soilMoistureSource).toBe("weather-derived-estimate");

    const requestUrl = new URL(String(fetchMock.mock.calls[0][0]));
    expect(requestUrl.hostname).toBe("api.weatherapi.com");
    expect(requestUrl.searchParams.get("key")).toBe("unit-test-key");
    expect(requestUrl.searchParams.get("days")).toBe("3");
    expect(requestUrl.searchParams.get("lang")).toBe("ar");
  });

  test("fails explicitly when the server-side API key is missing", async () => {
    delete process.env.WEATHERAPI_KEY;
    delete process.env.WEATHER_API_KEY;
    await expect(
      getWeatherFromWeatherApi({ lat: 12.12, lon: 23.23 }),
    ).rejects.toMatchObject<Partial<ProviderError>>({
      provider: "WeatherAPI.com",
      kind: "unconfigured",
    });
  });
});

describe("NASA POWER historical weather", () => {
  test("aggregates daily NASA POWER values into real monthly observations", async () => {
    const end = new Date();
    end.setUTCDate(end.getUTCDate() - 3);
    const dateKey = `${end.getUTCFullYear()}${String(end.getUTCMonth() + 1).padStart(2, "0")}${String(end.getUTCDate()).padStart(2, "0")}`;
    const payload = {
      properties: {
        parameter: {
          T2M: { [dateKey]: 20 },
          T2M_MAX: { [dateKey]: 25 },
          T2M_MIN: { [dateKey]: 15 },
          RH2M: { [dateKey]: 65 },
          PRECTOTCORR: { [dateKey]: 2.5 },
        },
      },
    };
    const fetchMock = jest.fn().mockResolvedValue(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    global.fetch = fetchMock as typeof fetch;

    const result = await getHistoricalWeatherFromNasaPower(13.13, 24.24, 1);

    expect(result.source.provider).toBe("NASA POWER");
    expect(result.source.isRealData).toBe(true);
    expect(result.monthly).toHaveLength(1);
    expect(result.monthly[0].avgTemp).toBe(20);
    expect(result.monthly[0].totalRainfall).toBe(2.5);
    expect(result.monthly[0].avgHumidity).toBe(65);
    expect(String(fetchMock.mock.calls[0][0])).toContain("power.larc.nasa.gov");
  });
});
