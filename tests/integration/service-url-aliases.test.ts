/**
 * AI service URL aliases.
 *
 * The project's history left more than one name for the same service
 * (MARKET_PREDICTION_URL vs MARKET_FORECAST_URL, INTELLIGENT_AGENT_URL vs
 * SMART_ASSISTANT_URL). A deployment that set only the older alias used to be
 * treated as "unconfigured" by code reading the newer name, silently disabling
 * a service that was actually running. These tests pin the alias resolution so
 * that regression cannot return.
 */
import { firstEnv } from "../../server/lib/env";
import {
  normalizeServiceUrl,
} from "../../server/routes/ai-services-gateway";

describe("🔗 AI service URL aliases", () => {
  const saved: Record<string, string | undefined> = {};
  const ALIASES = [
    "MARKET_FORECAST_URL",
    "MARKET_PREDICTION_URL",
    "SMART_ASSISTANT_URL",
    "INTELLIGENT_AGENT_URL",
  ];

  beforeAll(() => {
    for (const key of ALIASES) saved[key] = process.env[key];
  });

  afterAll(() => {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  beforeEach(() => {
    for (const key of ALIASES) delete process.env[key];
  });

  test("firstEnv returns the first non-empty alias", () => {
    process.env.MARKET_PREDICTION_URL = "http://market:9000";
    expect(firstEnv("MARKET_FORECAST_URL", "MARKET_PREDICTION_URL")).toBe(
      "http://market:9000",
    );
  });

  test("firstEnv prefers the primary name when both are set", () => {
    process.env.MARKET_FORECAST_URL = "http://primary:1";
    process.env.MARKET_PREDICTION_URL = "http://legacy:2";
    expect(firstEnv("MARKET_FORECAST_URL", "MARKET_PREDICTION_URL")).toBe(
      "http://primary:1",
    );
  });

  test("firstEnv ignores blank values and falls through", () => {
    process.env.MARKET_FORECAST_URL = "   ";
    process.env.MARKET_PREDICTION_URL = "http://legacy:2";
    expect(firstEnv("MARKET_FORECAST_URL", "MARKET_PREDICTION_URL")).toBe(
      "http://legacy:2",
    );
  });

  test("normalizeServiceUrl adds a scheme and trims a trailing slash", () => {
    expect(normalizeServiceUrl("localhost:8004", "http://x")).toBe(
      "http://localhost:8004",
    );
    expect(normalizeServiceUrl("http://a:1/", "http://x")).toBe("http://a:1");
    expect(normalizeServiceUrl(undefined, "http://fallback:2")).toBe(
      "http://fallback:2",
    );
  });
});
