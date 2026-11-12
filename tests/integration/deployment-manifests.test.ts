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
  "PEST_CONTROL_URL",
  "IRRIGATION_OPTIMIZATION_URL",
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

    test("each python buildCommand resolves to a real requirements file under its rootDir", () => {
      // Render runs buildCommand relative to rootDir. A path like
      // `agrogrowth-ai/requirements.txt` with `rootDir: ./agrogrowth-ai` would
      // resolve to `agrogrowth-ai/agrogrowth-ai/requirements.txt`, which does
      // not exist, so the build fails. Assert the referenced file exists.
      for (const svc of services.filter((s) => s.env === "python")) {
        const match = /-r\s+(\S+)/.exec(String(svc.buildCommand));
        expect(match).not.toBeNull();
        const reqPath = path.resolve(root, svc.rootDir, match![1]);
        expect(fs.existsSync(reqPath)).toBe(true);
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

    test("the platform starts the server bundle from outside the static root", () => {
      const platform = services.find((s) => s.name === "agrogrowth-platform");
      // The server bundle must not live under dist/ (the public static root),
      // otherwise it and its source map become downloadable.
      expect(platform.startCommand).toBe("node build/server/node-build.mjs");
      expect(platform.startCommand).not.toContain("dist/server");
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

  describe("AI service Dockerfiles", () => {
    // The canonical port for each service, matching render.yaml, docker-compose
    // and the gateway's localhost fallbacks.
    const SERVICE_PORTS: Record<string, number> = {
      soil_analysis: 8001,
      crop_recommendation: 8002,
      image_diagnosis: 8003,
      market_prediction: 8004,
      intelligent_agent: 8005,
      weather_yield_intelligence: 8006,
      pest_control: 8007,
      irrigation_optimization: 8008,
    };

    for (const [service, port] of Object.entries(SERVICE_PORTS)) {
      test(`${service}/Dockerfile declares and honours port ${port}`, () => {
        const dockerfile = fs.readFileSync(
          path.join(root, "agrogrowth-ai", service, "Dockerfile"),
          "utf8",
        );
        const expose = dockerfile.match(/^\s*EXPOSE\s+(\d+)/m);
        expect(expose?.[1]).toBe(String(port));
        // The healthcheck must probe the same port the process listens on.
        const health = dockerfile.match(/localhost:(\d+)\/health/);
        if (health) expect(health[1]).toBe(String(port));
        // A hardcoded --port overrides Render's injected $PORT, so the CMD must
        // reference an env var (Render's PORT / compose's SERVICE_PORT).
        const cmd = dockerfile.match(/^CMD .*$/m)?.[0] ?? "";
        expect(cmd).toMatch(/\$(?:\{)?PORT/);
      });
    }
  });
});
