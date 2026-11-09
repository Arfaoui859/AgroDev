/**
 * API integration tests exercising the real Express application (not mocks).
 *
 * These tests boot the actual server created by `createServer()` and assert on
 * real route behaviour, including the rule-based AI fallbacks that are used when
 * the external AI microservices / LLM provider are not configured.
 */
import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";

/**
 * These tests assert the in-process rule-based fallback, so the external
 * microservice URLs must point somewhere nothing is listening. Otherwise a
 * developer or CI runner that happens to have the AI services up on their
 * default localhost ports (as .env specifies) would silently exercise the
 * microservice path instead, and these assertions would fail on the response
 * shape rather than on any real defect.
 */
const UNREACHABLE = "http://127.0.0.1:1";
const savedEnv: Record<string, string | undefined> = {};

describe("🔌 AgroGrowth API Integration Tests", () => {
  let app: express.Application;

  beforeAll(() => {
    for (const key of ["SOIL_ANALYSIS_URL", "CROP_RECOMMENDATION_URL"]) {
      savedEnv[key] = process.env[key];
      process.env[key] = UNREACHABLE;
    }
    app = createServer();
  });

  afterAll(() => {
    for (const [key, value] of Object.entries(savedEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  describe("Health checks", () => {
    test("GET /api/ping returns server status", async () => {
      const response = await request(app).get("/api/ping").expect(200);
      expect(response.body).toHaveProperty("message");
    });

    test("GET /api/ai/health returns service overview and fallback info", async () => {
      const response = await request(app).get("/api/ai/health").expect(200);
      expect(response.body).toHaveProperty("overview");
      expect(response.body).toHaveProperty("services");
      expect(Array.isArray(response.body.services)).toBe(true);
      expect(response.body).toHaveProperty("fallbackEngine");
      expect(response.body.fallbackEngine).toHaveProperty("available", true);
    });
  });

  describe("🌱 Soil analysis fails closed when its microservice is unavailable", () => {
    test("POST /api/ai/soil/analyze does not return a heuristic report", async () => {
      const response = await request(app)
        .post("/api/ai/soil/analyze")
        .send({ sensor_data: { ph: 5.2, moisture: 20 } })
        .expect(503);
      expect(response.body.success).toBe(false);
    });

    test("missing service does not silently produce a soil estimate", async () => {
      const response = await request(app)
        .post("/api/ai/soil/analyze")
        .send({ sensor_data: { ph: 6.8 } })
        .expect(503);
      expect(response.body.success).toBe(false);
    });
  });

  describe("🌾 Crop recommendations (rule-based fallback)", () => {
    test("POST /api/ai/crops/recommend returns ranked recommendations", async () => {
      const response = await request(app)
        .post("/api/ai/crops/recommend")
        .send({
          ph: 6.5,
          temperature: 24,
          rainfall: 450,
          area_hectares: 3,
          soil_type: "تربة طينية",
        })
        .expect(200);

      expect(Array.isArray(response.body.recommendations)).toBe(true);
      expect(response.body.recommendations.length).toBeGreaterThan(0);

      const first = response.body.recommendations[0];
      expect(first).toHaveProperty("name_ar");
      expect(first).toHaveProperty("suitability_score");
      expect(first).toHaveProperty("profit_analysis");
      expect(first.profit_analysis).toHaveProperty("net_profit");
      expect(first.profit_analysis.isEstimate).toBe(true);
      expect(response.body.best_recommendation).toBeTruthy();
      expect(response.body.dataSource).toBe("rule-based");
    });

    test("POST /api/ai/crops/recommend ranks higher-suitability crops first", async () => {
      const response = await request(app)
        .post("/api/ai/crops/recommend")
        .send({ ph: 7.5, temperature: 38, rainfall: 150 })
        .expect(200);

      const scores = response.body.recommendations.map(
        (r: any) => r.suitability_score,
      );
      const sorted = [...scores].sort((a: number, b: number) => b - a);
      expect(scores).toEqual(sorted);
    });
  });

  describe("🧠 Agricultural assistant", () => {
    test("POST /api/ai/assistant/chat answers with provenance", async () => {
      const response = await request(app)
        .post("/api/ai/assistant/chat")
        .send({
          message: "شنوة أفضل محصول لتربة pH 6.5 مع مياه قليلة؟",
          context: { temperature: 24, rainfall: 400, soil: { ph: 6.5 } },
        })
        .expect(200);

      expect(response.body).toHaveProperty("answer");
      expect(response.body.answer.length).toBeGreaterThan(0);
      expect(["llm", "rule-based"]).toContain(response.body.dataSource);
      expect(response.body.language).toBe("ar");
      expect(Array.isArray(response.body.usedAgents)).toBe(true);
    });

    test("POST /api/ai/assistant/chat rejects empty messages", async () => {
      await request(app)
        .post("/api/ai/assistant/chat")
        .send({ message: "   " })
        .expect(400);
    });

    test("language detection works for French input", async () => {
      const response = await request(app)
        .post("/api/ai/assistant/chat")
        .send({ message: "Comment améliorer la fertilité de mon sol ?" })
        .expect(200);

      expect(response.body.language).toBe("fr");
    });
  });

  describe("🌦️ Weather", () => {
    test("GET /api/weather/coordinates validates coordinates", async () => {
      await request(app)
        .get("/api/weather/coordinates?lat=abc&lon=xyz")
        .expect(400);
    });

    test("GET /api/weather/location rejects unknown governorates", async () => {
      const response = await request(app)
        .get("/api/weather/location?governorate=not-a-place")
        .expect(404);
      expect(response.body).toHaveProperty("availableGovernorates");
    });
  });

  describe("⚡ Performance", () => {
    test("GET /api/ping responds within 1 second", async () => {
      const start = Date.now();
      await request(app).get("/api/ping").expect(200);
      expect(Date.now() - start).toBeLessThan(1000);
    });

    test("handles concurrent requests", async () => {
      const responses = await Promise.all(
        Array(5)
          .fill(null)
          .map(() => request(app).get("/api/ping").expect(200)),
      );
      expect(responses).toHaveLength(5);
    });
  });

  describe("🔐 Security", () => {
    test("sets security headers via helmet", async () => {
      const response = await request(app).get("/api/ping").expect(200);
      expect(response.headers["x-content-type-options"]).toBe("nosniff");
      expect(response.headers["x-frame-options"]).toBeDefined();
    });

    test("rejects oversized JSON bodies with 413", async () => {
      const big = "x".repeat(3 * 1024 * 1024);
      await request(app)
        .post("/api/ai/soil/analyze")
        .set("Content-Type", "application/json")
        .send(JSON.stringify({ sensor_data: { note: big } }))
        .expect(413);
    });

    test("returns 400 (not a crash) for malformed JSON", async () => {
      const response = await request(app)
        .post("/api/ai/soil/analyze")
        .set("Content-Type", "application/json")
        .send("{ not valid json ");
      expect([400, 413]).toContain(response.status);
    });

    test("does not leak stack traces on unknown routes", async () => {
      const response = await request(app)
        .get("/api/definitely-not-a-route")
        .expect(404);
      expect(JSON.stringify(response.body)).not.toMatch(/at Object\./);
    });

    test("CORS allows requests without an Origin header", async () => {
      const response = await request(app).get("/api/ping").expect(200);
      expect(response.status).toBe(200);
    });

    describe("Synthetic data is never presented as real", () => {
      test("market-analysis prices keep the array contract but flag provenance", async () => {
        const response = await request(app)
          .get("/api/market-analysis/prices/current")
          .expect(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.headers["x-data-provenance"]).toBe("simulated");
        expect(response.headers["x-is-real-data"]).toBe("false");
      });

      test("market-analysis alerts keep the array contract but flag provenance", async () => {
        const response = await request(app)
          .get("/api/market-analysis/alerts")
          .expect(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.headers["x-data-provenance"]).toBe("simulated");
      });

      test("market-analysis predictions carry simulated provenance", async () => {
        const response = await request(app)
          .get("/api/market-analysis/predictions/olive")
          .expect(200);
        expect(response.body.dataSource).toBe("simulated");
        expect(response.body.isRealData).toBe(false);
      });

      test("public market prices are labelled simulated, not real", async () => {
        const response = await request(app)
          .get("/api/public/market-prices?limit=2")
          .set("x-api-key", "public_demo_key_12345")
          .expect(200);
        expect(response.body.meta.dataSource).toBe("simulated");
        expect(response.body.meta.isRealData).toBe(false);
      });

      test("weather responses declare a real provider source", async () => {
        const response = await request(app)
          .get("/api/weather/coordinates?lat=36.8&lon=10.2");
        // Live provider may be unreachable in CI; when it succeeds it must
        // declare provenance, and when it fails it must NOT fabricate data.
        if (response.status === 200) {
          expect(response.body.source).toBeDefined();
          expect(response.body.source.isRealData).toBe(true);
        } else {
          expect([502, 503]).toContain(response.status);
          expect(response.body.dataAvailable).toBe(false);
        }
      });
    });

    describe("Privileged maintenance endpoints are not anonymous", () => {
      const privileged: Array<[string, string]> = [
        ["post", "/api/setup-admin"],
        ["post", "/api/setup-demo-users"],
        ["get", "/api/demo-users"],
        ["post", "/api/setup-inspector"],
        ["post", "/api/setup-users"],
        ["get", "/api/debug/auth"],
        ["post", "/api/test/auth/signup"],
        ["post", "/api/test/auth/signin"],
        ["get", "/api/test/supabase"],
        ["post", "/api/auth/create-user-profile"],
        ["get", "/api/auth/check-user/00000000-0000-0000-0000-000000000000"],
      ];

      test.each(privileged)(
        "%s %s requires the admin token in production",
        async (method, path) => {
          const previousEnv = process.env.NODE_ENV;
          const previousToken = process.env.ADMIN_API_TOKEN;
          const previousDemo = process.env.ENABLE_DEMO_ENDPOINTS;
          process.env.NODE_ENV = "production";
          delete process.env.ADMIN_API_TOKEN;
          delete process.env.ENABLE_DEMO_ENDPOINTS;
          try {
            const prodApp = createServer();
            const agent = request(prodApp) as any;
            const response = await agent[method](path).send({});
            expect([401, 403]).toContain(response.status);
          } finally {
            if (previousEnv === undefined) delete process.env.NODE_ENV;
            else process.env.NODE_ENV = previousEnv;
            if (previousToken !== undefined)
              process.env.ADMIN_API_TOKEN = previousToken;
            if (previousDemo !== undefined)
              process.env.ENABLE_DEMO_ENDPOINTS = previousDemo;
          }
        },
      );

      test("a matching x-admin-token does not re-enable disabled production demo endpoints", async () => {
        const previousToken = process.env.ADMIN_API_TOKEN;
        process.env.ADMIN_API_TOKEN = "test-admin-token";
        try {
          const prodApp = createServer();
          const response = await request(prodApp)
            .get("/api/demo-users")
            .set("x-admin-token", "test-admin-token");
          expect(response.status).toBe(404);
          expect(response.body).toMatchObject({
            success: false,
            error: "Demo provisioning is disabled",
          });
        } finally {
          if (previousToken === undefined) delete process.env.ADMIN_API_TOKEN;
          else process.env.ADMIN_API_TOKEN = previousToken;
        }
      });

      test("a wrong x-admin-token is rejected in production", async () => {
        const previousEnv = process.env.NODE_ENV;
        const previousToken = process.env.ADMIN_API_TOKEN;
        process.env.NODE_ENV = "production";
        process.env.ADMIN_API_TOKEN = "test-admin-token";
        try {
          const prodApp = createServer();
          const response = await request(prodApp)
            .get("/api/demo-users")
            .set("x-admin-token", "wrong-token");
          expect([401, 403]).toContain(response.status);
        } finally {
          if (previousEnv === undefined) delete process.env.NODE_ENV;
          else process.env.NODE_ENV = previousEnv;
          if (previousToken === undefined) delete process.env.ADMIN_API_TOKEN;
          else process.env.ADMIN_API_TOKEN = previousToken;
        }
      });
    });

    test("demo user listing remains disabled in production, even with a valid admin token", async () => {
      const previousToken = process.env.ADMIN_API_TOKEN;
      const previousEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";
      process.env.ADMIN_API_TOKEN = "test-admin-token";
      try {
        const prodApp = createServer();
        const response = await request(prodApp)
          .get("/api/demo-users")
          .set("x-admin-token", "test-admin-token")
          .expect(404);
        expect(response.body.success).toBe(false);
        expect(response.body.demoUsers).toBeUndefined();
      } finally {
        if (previousEnv === undefined) delete process.env.NODE_ENV;
        else process.env.NODE_ENV = previousEnv;
        if (previousToken === undefined) delete process.env.ADMIN_API_TOKEN;
        else process.env.ADMIN_API_TOKEN = previousToken;
      }
    });
  });
});
