import { getWeatherFromOpenMeteo, getHistoricalWeatherFromOpenMeteo } from "../../server/services/providers/weatherProvider";
import { ProviderError } from "../../server/services/providers/http";

const original = {
  nodeEnv: process.env.NODE_ENV,
  apiKey: process.env.OPEN_METEO_API_KEY,
  allowFree: process.env.OPEN_METEO_ALLOW_FREE_NONCOMMERCIAL,
};

afterEach(() => {
  if (original.nodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = original.nodeEnv;
  if (original.apiKey === undefined) delete process.env.OPEN_METEO_API_KEY;
  else process.env.OPEN_METEO_API_KEY = original.apiKey;
  if (original.allowFree === undefined) delete process.env.OPEN_METEO_ALLOW_FREE_NONCOMMERCIAL;
  else process.env.OPEN_METEO_ALLOW_FREE_NONCOMMERCIAL = original.allowFree;
});

describe("commercial Open-Meteo production guard", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "production";
    delete process.env.OPEN_METEO_API_KEY;
    delete process.env.OPEN_METEO_ALLOW_FREE_NONCOMMERCIAL;
  });

  test("forecast endpoint refuses the non-commercial public API in production", async () => {
    await expect(getWeatherFromOpenMeteo({ lat: 36.8, lon: 10.2 })).rejects.toMatchObject({
      provider: "Open-Meteo",
      kind: "unconfigured",
    });
  });

  test("historical archive refuses the non-commercial public API in production", async () => {
    await expect(getHistoricalWeatherFromOpenMeteo(36.8, 10.2, 12)).rejects.toMatchObject({
      provider: "Open-Meteo",
      kind: "unconfigured",
    });
  });
});
