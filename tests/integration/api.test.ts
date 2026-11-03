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

describe("🔌 AgroGrowth API Integration Tests", () => {
  let app: express.Application;

  beforeAll(() => {
    app = createServer();
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

  describe("🌱 Soil analysis (rule-based fallback)", () => {
    test("POST /api/ai/soil/analyze returns a structured analysis", async () => {
      const response = await request(app)
        .post("/api/ai/soil/analyze")
        .send({
          sensor_data: {
            ph: 5.2,
            nitrogen: 30,
            phosphorus: 15,
            potassium: 120,
            moisture: 20,
            salinity: 5.5,
          },
        })
        .expect(200);

      expect(response.body).toHaveProperty("health_score");
      expect(response.body.health_score).toBeGreaterThanOrEqual(0);
      expect(response.body.health_score).toBeLessThanOrEqual(100);
      expect(response.body).toHaveProperty("findings");
      expect(response.body).toHaveProperty("missing_measurements");
      expect(response.body.problems.length).toBeGreaterThan(0);
      expect(response.body.dataSource).toBe("rule-based");
    });

    test("POST /api/ai/soil/analyze flags missing measurements instead of guessing", async () => {
      const response = await request(app)
        .post("/api/ai/soil/analyze")
        .send({ sensor_data: { ph: 6.8 } })
        .expect(200);

      expect(response.body.missing_measurements.length).toBeGreaterThan(0);
      expect(
        response.body.findings.some((f: any) => f.status === "missing"),
      ).toBe(true);
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

      test("a matching x-admin-token is accepted", async () => {
        const previousToken = process.env.ADMIN_API_TOKEN;
        process.env.ADMIN_API_TOKEN = "test-admin-token";
        try {
          const prodApp = createServer();
          const response = await request(prodApp)
            .get("/api/demo-users")
            .set("x-admin-token", "test-admin-token");
          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty("demoUsers");
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

    test("demo user list never contains real personal email addresses", async () => {
      const previousToken = process.env.ADMIN_API_TOKEN;
      process.env.ADMIN_API_TOKEN = "test-admin-token";
      try {
        const prodApp = createServer();
        const response = await request(prodApp)
          .get("/api/demo-users")
          .set("x-admin-token", "test-admin-token")
          .expect(200);
        const emails: string[] = response.body.demoUsers.map(
          (u: any) => u.email,
        );
        expect(emails.length).toBeGreaterThan(0);
        for (const email of emails) {
          expect(email).toMatch(/@demo\.com$|@agrogrowth\.com$/);
        }
      } finally {
        if (previousToken === undefined) delete process.env.ADMIN_API_TOKEN;
        else process.env.ADMIN_API_TOKEN = previousToken;
      }
    });
  });
});
