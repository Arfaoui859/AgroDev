/**
 * Internal AI service topology (private host:port addresses, Render
 * private-service names) must never be disclosed to an unauthenticated caller.
 *
 * Regression: `GET /api/ai/health` echoed each service's configured `url` and
 * `GET /api/ai/capabilities/:id` echoed `microserviceUrl` (plus the address in
 * the `requiresConfiguration` message). Both endpoints are public, so an
 * anonymous caller could enumerate the backend's private service addresses.
 */
import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";
import { resetServiceProbeCache } from "../../server/services/providers/serviceProbe";

const ORIGINAL = { ...process.env };

const PRIVATE_URL = "http://ai-soil-analysis.internal:8001";

describe("🔒 AI service topology is never disclosed on public probes", () => {
  let app: express.Application;

  beforeAll(() => {
    process.env = { ...ORIGINAL, NODE_ENV: "production" };
    delete process.env.RENDER;
    delete process.env.RENDER_SERVICE_ID;
    process.env.SOIL_ANALYSIS_URL = PRIVATE_URL;
    resetServiceProbeCache();
    app = createServer();
  });

  afterAll(() => {
    process.env = ORIGINAL;
    resetServiceProbeCache();
  });

  test("GET /api/ai/health omits every service url", async () => {
    const res = await request(app).get("/api/ai/health").expect(200);
    expect(res.body.services).toBeDefined();
    for (const service of res.body.services) {
      expect(service).not.toHaveProperty("url");
    }
    // The reachability/configuration signal the SPA needs is still present.
    const soil = res.body.services.find((s: { key: string }) => s.key === "soil_analysis");
    expect(soil).toBeDefined();
    expect(soil.key).toBe("soil_analysis");
  });

  test("GET /api/ai/health body never contains the configured host", async () => {
    const res = await request(app).get("/api/ai/health").expect(200);
    expect(JSON.stringify(res.body)).not.toContain("ai-soil-analysis.internal");
  });

  test("GET /api/ai/capabilities/:id nulls microserviceUrl", async () => {
    const res = await request(app).get("/api/ai/capabilities/soil-analysis").expect(200);
    expect(res.body.microserviceUrl).toBeNull();
    expect(JSON.stringify(res.body)).not.toContain("ai-soil-analysis.internal");
  });
});
