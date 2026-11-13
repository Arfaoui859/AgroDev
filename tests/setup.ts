import { config } from "dotenv";

// Load test environment variables
config({ path: ".env.test" });

/**
 * Deterministic test environment.
 *
 * The suite must not depend on whatever provider credentials happen to be
 * exported in the shell (CI runners often inject GEMINI_API_KEY / OPENAI_API_KEY
 * for the live smoke tests). An ambient key makes unit tests that assert the
 * "no provider configured" fallback call the real provider instead, producing
 * false failures and real network traffic.
 *
 * So unless the operator explicitly opts into live tests, every provider
 * credential/override is removed before any suite loads. Live tests are opt-in:
 *
 *   AI_LIVE_TESTS=1 AI_PROVIDER=... AI_API_KEY=... npm run test:live
 */
const LIVE = process.env.AI_LIVE_TESTS === "1";

const PROVIDER_ENV_KEYS = [
  "AI_PROVIDER",
  "AI_BASE_URL",
  "AI_API_KEY",
  "AI_MODEL",
  "AI_TEXT_MODEL",
  "AI_VISION_MODEL",
  "AI_MAX_RETRIES",
  "OPENAI_API_KEY",
  "OPENAI_BASE_URL",
  "OPENAI_MODEL",
  "OPENROUTER_API_KEY",
  "GROQ_API_KEY",
  "TOGETHER_API_KEY",
  "GEMINI_API_KEY",
  "GOOGLE_API_KEY",
  "GEMINI_BASE_URL",
  // Timeout overrides: an ambient value (e.g. a host exporting AI_TIMEOUT_MS)
  // would otherwise change which tests hit their own abort paths.
  "AI_TIMEOUT_MS",
  "AI_HEALTH_TIMEOUT_MS",
];

if (!LIVE) {
  for (const key of PROVIDER_ENV_KEYS) delete process.env[key];

  // Bound external weather calls in the default (non-live) run. Open-Meteo is
  // a real network dependency; with the production budget (12s x 3 attempts) a
  // blocked sandbox would exceed the 30s per-test limit and hang the suite.
  // Capping it keeps the "real data or an explicit 5xx" assertions meaningful
  // while letting the request fail fast and honestly.
  process.env.WEATHER_FORECAST_TIMEOUT_MS = "3000";
  process.env.WEATHER_FORECAST_RETRIES = "0";
}

// Global test setup
beforeAll(async () => {
  // Setup test database or mock services if needed
  console.log("🧪 Test environment setup complete");
});

afterAll(async () => {
  // Cleanup after all tests
  console.log("🧹 Test environment cleanup complete");
});

// Increase timeout for integration tests
jest.setTimeout(30000);
