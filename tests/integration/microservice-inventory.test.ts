/**
 * Python microservice inventory.
 *
 * The platform ships eight FastAPI microservices under `agrogrowth-ai/`. This
 * test pins the inventory (name -> default port -> env var -> health path) so a
 * renamed service, a changed default port, or a dropped env var is caught here
 * rather than silently disabling a capability at runtime.
 *
 * It reads the real service source (main.py + Dockerfile + docker-compose.yml)
 * instead of asserting against a copy, so it fails if the deployment files
 * drift apart from each other.
 */
import fs from "fs";
import path from "path";

const AI_DIR = path.resolve(__dirname, "../../agrogrowth-ai");

/** name -> [defaultPort, [envVarAliases]] */
const INVENTORY: Record<string, [number, string[]]> = {
  soil_analysis: [8001, ["SOIL_ANALYSIS_URL"]],
  crop_recommendation: [8002, ["CROP_RECOMMENDATION_URL"]],
  image_diagnosis: [8003, ["IMAGE_DIAGNOSIS_URL"]],
  market_prediction: [8004, ["MARKET_FORECAST_URL", "MARKET_PREDICTION_URL"]],
  intelligent_agent: [8005, ["SMART_ASSISTANT_URL", "INTELLIGENT_AGENT_URL"]],
  weather_yield_intelligence: [
    8006,
    ["WEATHER_YIELD_INTELLIGENCE_URL", "SMART_MARKETPLACE_URL"],
  ],
  pest_control: [8007, ["PEST_CONTROL_URL"]],
  irrigation_optimization: [8008, ["IRRIGATION_OPTIMIZATION_URL"]],
};

describe("🐍 Python microservice inventory", () => {
  test.each(Object.entries(INVENTORY))(
    "%s has a main.py, a Dockerfile and a /health endpoint on port %i",
    (name, [port]) => {
      const dir = path.join(AI_DIR, name);
      expect(fs.existsSync(path.join(dir, "main.py"))).toBe(true);
      expect(fs.existsSync(path.join(dir, "Dockerfile"))).toBe(true);

      const src = fs.readFileSync(path.join(dir, "main.py"), "utf8");
      // The service must expose /health ...
      expect(src).toMatch(/@app\.(get|api_route)\(\s*["']\/health["']/);
      // ... and resolve the documented default port through PORT,
      // allowing a SERVICE_PORT fallback before the hardcoded default.
      const directPort = new RegExp(`PORT["']?\\s*,\\s*["']?${port}["']?\\b`);
      const fallbackPort = new RegExp(
        `PORT["']?\\s*,[\\s\\S]{0,200}?["']${port}["']`,
      );
      expect(src).toMatch(directPort.test(src) ? directPort : fallbackPort);
    },
  );

  test("docker-compose wires every service to its documented port", () => {
    const compose = fs.readFileSync(
      path.resolve(__dirname, "../../docker-compose.yml"),
      "utf8",
    );
    for (const [, [port, envVars]] of Object.entries(INVENTORY)) {
      expect(compose).toContain(`"${port}:${port}"`);
      expect(envVars.some((v) => compose.includes(`${v}=http://`))).toBe(true);
    }
  });

  test("the backend resolves a URL env var for every service", () => {
    const gateway = fs.readFileSync(
      path.resolve(__dirname, "../../server/routes/ai-services-gateway.ts"),
      "utf8",
    );
    for (const [, [, envVars]] of Object.entries(INVENTORY)) {
      expect(envVars.some((v) => gateway.includes(v))).toBe(true);
    }
  });
});
