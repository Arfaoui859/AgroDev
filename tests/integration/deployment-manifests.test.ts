/**
 * Deployment manifest alignment.
 *
 * The AI services use absolute package imports (`from soil_analysis.main import
 * app`), so they must be started with the `agrogrowth-ai` directory on
 * PYTHONPATH and the module qualified as `<service>.main:app`. Two deployment
 * manifests previously disagreed with that contract:
 *
 *  - render.yaml used `rootDir: ./agrogrowth-ai/<service>` together with
 *    `uvicorn main:app`. Running uvicorn from inside a service directory makes
 *    `main` a top-level module, which breaks the absolute package imports, and
 *    only one of five services had PYTHONPATH set at all.
 *  - docker-compose.yml set MARKET_PREDICTION_URL / INTELLIGENT_AGENT_URL /
 *    WEATHER_YIELD_INTELLIGENCE_URL, but the gateway reads MARKET_FORECAST_URL /
 *    SMART_ASSISTANT_URL / SMART_MARKETPLACE_URL, so those three services were
 *    never reachable from the backend container.
 *
 * These tests parse the real manifests and assert they match the server contract.
 */
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

const root = path.resolve(__dirname, "../..");

/** Env var names the AI gateway actually reads (see ai-services-gateway.ts). */
const GATEWAY_URL_KEYS = [
  "SOIL_ANALYSIS_URL",
  "CROP_RECOMMENDATION_URL",
  "IMAGE_DIAGNOSIS_URL",
  "MARKET_FORECAST_URL",
  "SMART_ASSISTANT_URL",
  "SMART_MARKETPLACE_URL",
];

describe("🚀 Deployment manifest alignment", () => {
  describe("render.yaml", () => {
    const doc = yaml.load(
      fs.readFileSync(path.join(root, "render.yaml"), "utf8"),
    ) as any;
    const services: any[] = doc.services;

    test("declares the platform and all eight AI services", () => {
      const names = services.map((s) => s.name);
      expect(names).toContain("agrogrowth-platform");
      for (const n of [
        "agrogrowth-soil-analysis",
        "agrogrowth-crop-recommendation",
        "agrogrowth-image-diagnosis",
        "agrogrowth-market-prediction",
        "agrogrowth-intelligent-agent",
        "agrogrowth-weather-yield",
        "agrogrowth-pest-control",
        "agrogrowth-irrigation-optimization",
      ]) {
        expect(names).toContain(n);
      }
    });

    test("python services start the qualified module from the ai root", () => {
      for (const svc of services.filter((s) => s.env === "python")) {
        expect(svc.rootDir).toBe("./agrogrowth-ai");
        expect(svc.startCommand).toMatch(
          /^python -m uvicorn [a-z_]+\.main:app /,
        );
      }
    });

    test("every python service has PYTHONPATH so absolute imports resolve", () => {
      for (const svc of services.filter((s) => s.env === "python")) {
        const keys = (svc.envVars ?? []).map((e: any) => e.key);
        expect(keys).toContain("PYTHONPATH");
      }
    });

    test("the platform service wires every gateway URL key", () => {
      const platform = services.find((s) => s.name === "agrogrowth-platform");
      const keys = (platform.envVars ?? []).map((e: any) => e.key);
      for (const k of GATEWAY_URL_KEYS) expect(keys).toContain(k);
    });

    test("no placeholder repository URLs remain", () => {
      for (const svc of services) {
        expect(String(svc.repo ?? "")).not.toContain("your-repo");
      }
    });
  });

  describe("docker-compose.yml", () => {
    const doc = yaml.load(
      fs.readFileSync(path.join(root, "docker-compose.yml"), "utf8"),
    ) as any;
    const backendEnv: string[] = doc.services.backend.environment;

    test("backend passes every gateway URL key", () => {
      const keys = backendEnv.map((e) => e.split("=")[0]);
      for (const k of GATEWAY_URL_KEYS) expect(keys).toContain(k);
    });

    test("no stale service URL names are left behind", () => {
      const keys = backendEnv.map((e) => e.split("=")[0]);
      expect(keys).not.toContain("MARKET_PREDICTION_URL");
      expect(keys).not.toContain("INTELLIGENT_AGENT_URL");
      expect(keys).not.toContain("WEATHER_YIELD_INTELLIGENCE_URL");
    });

    test("backend and AI service URLs agree on ports", () => {
      const urls = Object.fromEntries(
        backendEnv
          .filter((e) => e.includes("_URL=http"))
          .map((e) => {
            const [k, v] = e.split("=");
            return [k, v];
          }),
      );
      expect(urls.SOIL_ANALYSIS_URL).toBe("http://soil-analysis:8001");
      expect(urls.MARKET_FORECAST_URL).toBe("http://market-prediction:8004");
      expect(urls.SMART_ASSISTANT_URL).toBe("http://intelligent-agent:8005");
      expect(urls.SMART_MARKETPLACE_URL).toBe(
        "http://weather-yield-intelligence:8006",
      );
    });
  });
});
