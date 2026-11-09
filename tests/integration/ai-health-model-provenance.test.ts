/**
 * AI service health: reachability vs. trained-model provenance.
 *
 * `/api/ai/health` used to report a service as simply "available" whenever its
 * /health endpoint answered. The bundled microservices all answer /health while
 * declaring `model_source: "synthetic-demo"` / `"heuristic-demo"`, so the
 * monitoring view presented synthetic inference as production model output.
 *
 * This pins the honest behaviour: the service's own declared model_source is
 * surfaced per service, and the overview counts the synthetic ones so the SPA
 * can disclose them.
 */
import express from "express";
import request from "supertest";
import { createServer } from "../../server/index";

jest.mock("axios", () => {
  const callable: any = jest.fn(async (first: any) => {
    const url: string = typeof first === "string" ? first : (first?.url ?? "");
    // Port 8001 declares a synthetic model; port 8002 a real one.
    const modelSource = url.includes(":8001") ? "synthetic-demo" : "field-validated-v2";
    return {
      data: { status: "healthy", model_source: modelSource },
      status: 200,
    };
  });
  callable.__esModule = true;
  callable.default = callable;
  callable.get = callable;
  callable.post = callable;
  return callable;
});

describe("🧪 AI health model provenance", () => {
  let app: express.Application;

  beforeAll(() => {
    app = createServer();
  });

  test("surfaces each service's declared model source", async () => {
    const res = await request(app).get("/api/ai/health").expect(200);
    const soil = res.body.services.find((s: any) => s.key === "soil_analysis");
    expect(soil.modelSource).toBe("synthetic-demo");
    expect(soil.modelTrainedOnSyntheticData).toBe(true);
    expect(soil.isRealModel).toBe(false);

    const crop = res.body.services.find((s: any) => s.key === "crop_recommendation");
    expect(crop.modelSource).toBe("field-validated-v2");
    expect(crop.modelTrainedOnSyntheticData).toBe(false);
    expect(crop.isRealModel).toBe(true);
  });

  test("counts synthetic-model services in the overview and warns in the note", async () => {
    const res = await request(app).get("/api/ai/health").expect(200);
    expect(res.body.overview.syntheticModelServices).toBeGreaterThan(0);
    expect(res.body.note).toContain("اصطناعية");
  });

  test("counts HTTP 429 as reachable but not inference-available", async () => {
    const axios = require("axios");
    (axios.get as jest.Mock).mockImplementationOnce(async () => {
      const error: any = new Error("rate limited");
      error.response = { status: 429 };
      throw error;
    });

    const res = await request(app).get("/api/ai/health").expect(200);
    const soil = res.body.services.find((s: any) => s.key === "soil_analysis");

    expect(soil.status).toBe("rate_limited");
    expect(soil.reachable).toBe(true);
    expect(soil.error).toContain("host responded");
    expect(res.body.overview.reachableServices).toBe(8);
    expect(res.body.overview.availableServices).toBe(7);
    expect(res.body.overview.rateLimitedServices).toBe(1);
  });
});
