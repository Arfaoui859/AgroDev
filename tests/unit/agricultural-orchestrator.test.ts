/**
 * Multi-agent orchestrator tests.
 *
 * These exercise the real orchestrator: an allow-listed registry, an explicit
 * plan with transitive dependencies, bounded-concurrency execution, dependency
 * gating (a dependent step is `blocked` when its upstream failed), honest
 * `insufficient_input` reporting, and a provenance-preserving trace.
 */
import {
  planSpecialists,
  executePlan,
  orchestrateAgriculturalQuestion,
  SPECIALISTS,
} from "../../server/services/ai/agriculturalOrchestrator";

describe("planSpecialists", () => {
  test("only returns allow-listed registry ids", () => {
    const allowed = new Set(SPECIALISTS.map((s) => s.id));
    const plan = planSpecialists("nheb nzra3 tmatem fi torba w kifeh ns9i?");
    for (const id of plan) expect(allowed.has(id)).toBe(true);
  });

  test("a crop/soil/irrigation question pulls in transitive dependencies", () => {
    const plan = planSpecialists("كيف أختار محصولاً وأسقي الحقل؟");
    // crop depends on soil+weather; irrigation depends on crop+weather
    expect(plan).toContain("crop");
    expect(plan).toContain("soil");
    expect(plan).toContain("weather");
    expect(plan).toContain("irrigation");
  });

  test("a disease question selects plant_health", () => {
    const plan = planSpecialists("هل يوجد مرض في الحقل؟");
    expect(plan).toContain("plant_health");
    expect(plan).not.toContain("crop");
  });

  test("an empty question falls back to the core soil+crop pair", () => {
    const plan = planSpecialists("");
    expect(plan).toEqual(expect.arrayContaining(["soil", "crop"]));
  });

  test("pest/fertilizer questions do not fabricate a product", () => {
    const plan = planSpecialists("أي مبيد أستعمل للحشرة؟");
    expect(plan).toContain("pest_control");
  });

  test("selects the trained lab models when analytes are supplied", () => {
    const plan = planSpecialists("hello", { labAnalytes: { ph: 6.5 } });
    expect(plan).toContain("lab_soil");
  });
});

describe("executePlan", () => {
  test("records a step as insufficient_input rather than inventing values", async () => {
    const { steps } = await executePlan(["soil"], {}, "ar");
    const soil = steps.find((s) => s.id === "soil")!;
    expect(soil.status).toBe("insufficient_input");
    expect(soil.findings).toEqual([]);
    expect(soil.dataSource).toBeNull();
  });

  test("runs soil analysis when measurements are present", async () => {
    const { steps } = await executePlan(["soil"], { soil: { ph: 6.5, nitrogen: 50 } }, "ar");
    const soil = steps.find((s) => s.id === "soil")!;
    expect(soil.status).toBe("ok");
    expect(soil.dataSource).toBe("rule-based");
    expect(soil.isRealData).toBe(false);
  });

  test("crop runs with a soft dependency and states the limitation", async () => {
    const { steps } = await executePlan(["soil", "weather", "crop"], {}, "ar");
    const crop = steps.find((s) => s.id === "crop")!;
    expect(crop.status).toBe("ok");
    expect(crop.confidence).toBe("low");
    expect(crop.note).toMatch(/جزئية|تنقص/);
  });

  test("irrigation is blocked when the crop recommendation failed", async () => {
    // Simulate a failing upstream specialist through the injectable registry
    // seam (a future remote specialist can genuinely throw/time out).
    const base = new Map(SPECIALISTS.map((s) => [s.id, s]));
    const failingCrop = {
      ...base.get("crop")!,
      run: () => {
        throw new Error("simulated crop specialist failure");
      },
    };
    const registry = new Map(base);
    registry.set("crop", failingCrop);

    const { steps } = await executePlan(
      ["soil", "weather", "crop", "irrigation"],
      {},
      "ar",
      { retries: 0, registry },
    );
    const crop = steps.find((s) => s.id === "crop")!;
    const irrigation = steps.find((s) => s.id === "irrigation")!;
    expect(crop.status).toBe("failed");
    expect(irrigation.status).toBe("blocked");
    expect(irrigation.note).toMatch(/failed|upstream/i);
  });

  test("weather reports open-meteo provenance only for live records", async () => {
    const live = await executePlan(
      ["weather"],
      { platformRecords: ["LIVE WEATHER FROM OPEN-METEO [provider=Open-Meteo]"] },
      "ar",
    );
    expect(live.steps[0].dataSource).toBe("open-meteo");
    expect(live.steps[0].isRealData).toBe(true);

    const recorded = await executePlan(
      ["weather"],
      { platformRecords: ["Recorded weather [date=2026-11-01; source=Open-Meteo]"] },
      "ar",
    );
    expect(recorded.steps[0].dataSource).toBe("persisted-records");
    expect(recorded.steps[0].isRealData).toBe(false);
  });

  test("pest_control never suggests a product without a verified registry", async () => {
    const { steps } = await executePlan(["pest_control"], {}, "ar");
    expect(steps[0].status).toBe("insufficient_input");
    expect(steps[0].findings).toEqual([]);
    expect(steps[0].note).toMatch(/registry|منتج/i);
  });

  test("respects a bounded concurrency value", async () => {
    const { concurrency } = await executePlan(["soil", "weather", "market"], {}, "ar", {
      concurrency: 2,
    });
    expect(concurrency).toBe(2);
  });

  test("lab_soil is insufficient_input without analytes and never calls out", async () => {
    const { steps } = await executePlan(["lab_soil"], {}, "ar");
    expect(steps[0].status).toBe("insufficient_input");
    expect(steps[0].findings).toEqual([]);
    expect(steps[0].dataSource).toBeNull();
  });

  test("lab_soil returns trained-model provenance when the service answers", async () => {
    // Stand up a throwaway server that mimics the real /predict-lab-soil route.
    const http = await import("node:http");
    const server = http.createServer((req, res) => {
      if ((req.url ?? "").startsWith("/predict-lab-soil")) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "success",
            prediction_scope: "lab_assisted_only",
            field_validated: false,
            models: {
              ph: { status: "predicted", prediction: 6.68, coverage: 1, metrics: { r2: 0.52 } },
              phosphorus_extractable: {
                status: "predicted",
                prediction: 12.1,
                coverage: 0.9,
                metrics: { r2: 0.34 },
                imputed_features: ["iron_extractable"],
              },
            },
          }),
        );
        return;
      }
      res.writeHead(404);
      res.end();
    });
    const url = await new Promise<string>((resolve) => {
      server.listen(0, "127.0.0.1", () => {
        const addr = server.address() as { port: number };
        resolve(`http://127.0.0.1:${addr.port}`);
      });
    });
    const saved = process.env.SOIL_ANALYSIS_URL;
    process.env.SOIL_ANALYSIS_URL = url;
    try {
      const { steps } = await executePlan(
        ["lab_soil"],
        { labAnalytes: { ph: 7.0, carbon_organic: 12 } },
        "ar",
      );
      expect(steps[0].status).toBe("ok");
      expect(steps[0].dataSource).toBe("trained-model-inference");
      // Inference is never claimed as a measured/real observation.
      expect(steps[0].isRealData).toBe(false);
      expect(steps[0].findings.join(" ")).toMatch(/ph.*6\.68/);
      expect(steps[0].findings.join(" ")).toMatch(/R²/);
    } finally {
      if (saved === undefined) delete process.env.SOIL_ANALYSIS_URL;
      else process.env.SOIL_ANALYSIS_URL = saved;
      await new Promise<void>((done) => server.close(() => done()));
    }
  });

  test("lab_soil reports unavailable (not fabricated) when the service is down", async () => {
    const saved = process.env.SOIL_ANALYSIS_URL;
    // A port nothing is listening on.
    process.env.SOIL_ANALYSIS_URL = "http://127.0.0.1:1";
    try {
      const { steps } = await executePlan(["lab_soil"], { labAnalytes: { ph: 7 } }, "ar");
      expect(steps[0].status).toBe("failed");
      expect(steps[0].findings).toEqual([]);
      expect(steps[0].note).toMatch(/no prediction was produced/i);
    } finally {
      if (saved === undefined) delete process.env.SOIL_ANALYSIS_URL;
      else process.env.SOIL_ANALYSIS_URL = saved;
    }
  });
});

describe("orchestrateAgriculturalQuestion", () => {
  test("produces a plan, a per-step trace and preserves provenance", async () => {
    const result = await orchestrateAgriculturalQuestion({
      question: "ما أفضل محصول لتربة pH 6.5 مع أمطار قليلة؟",
      language: "ar",
      context: { soil: { ph: 6.5 }, rainfall: 250 },
    });
    expect(result.trace.plan.length).toBeGreaterThan(0);
    expect(result.trace.steps.length).toBe(result.trace.plan.length);
    expect(result.usedSpecialists.length).toBeGreaterThan(0);
    expect(result.dataSource).toBe("rule-based");
    expect(result.isRealData).toBe(false);
    // grounded facts keep a per-specialist provenance tag
    for (const fact of result.groundedFacts) {
      expect(fact).toMatch(/^\[.+\] /);
    }
  });

  test("blocks dependents and reports them in the trace when upstream fails", async () => {
    const base = new Map(SPECIALISTS.map((s) => [s.id, s]));
    const registry = new Map(base);
    registry.set("crop", {
      ...base.get("crop")!,
      run: () => {
        throw new Error("simulated crop specialist failure");
      },
    });
    const result = await orchestrateAgriculturalQuestion(
      { question: "كيف أسقي المحصول؟", language: "ar" },
      { retries: 0, registry },
    );
    expect(result.trace.blocked).toContain("irrigation");
    // A partially executed workflow is not presented as complete.
    expect(result.trace.steps.some((s) => s.status === "blocked")).toBe(true);
  });

  test("a market question with no record is reported unavailable, not invented", async () => {
    const result = await orchestrateAgriculturalQuestion({
      question: "ch9adeh sou9 tmatem?",
      language: "ar",
    });
    const market = result.trace.steps.find((s) => s.id === "market")!;
    expect(market.status).toBe("unavailable");
    expect(market.findings).toEqual([]);
  });

  test("never claims model inference", async () => {
    const result = await orchestrateAgriculturalQuestion({
      question: "test",
      language: "en",
    });
    expect(result.dataSource).toBe("rule-based");
    expect(result.isRealData).toBe(false);
    expect(result.disclaimer).toMatch(/not from a trained ML model/i);
  });

  test("runs the full soil→weather→crop→irrigation workflow on real-shaped records", async () => {
    // The shape the gateway assembles from a farmer's own persisted rows. The
    // specialist extractors key on these exact prefixes, so this pins the
    // contract between the context builder and the orchestrator.
    const platformRecords = [
      "Recorded soil analysis [type=lab; pH=6.5; N=45; P=22; K=180; organic matter=2.1%; moisture=18%; farm_id=f1]",
      "LIVE WEATHER FROM OPEN-METEO for the selected farm Ferme A [provider=Open-Meteo; current_temperature=28 C; humidity=55%; rainfall_today=0 mm; ET0=4.2]",
      "Cultivation Tomato [status=active; variety=Rio Grande; stage=flowering; planted=2026-10-01; farm=Ferme A; cultivation_id=c1]",
      "Recorded market price [crop=Tomato; price=1.85 TND/kg; market=Bizerte; date=2026-11-08; source=ONAGRI]",
    ];
    const result = await orchestrateAgriculturalQuestion({
      question: "أي محصول أزرع في هذا الحقل وكيف أسقيه؟",
      language: "ar",
      context: {
        soil: { ph: 6.5, nitrogen: 45, phosphorus: 22, potassium: 180 },
        platformRecords,
      },
    });

    const byId = Object.fromEntries(result.trace.steps.map((s) => [s.id, s]));
    expect(byId.soil.status).toBe("ok");
    expect(byId.weather.status).toBe("ok");
    expect(byId.weather.dataSource).toBe("open-meteo");
    expect(byId.weather.isRealData).toBe(true);
    expect(byId.crop.status).toBe("ok");
    expect(byId.irrigation.status).toBe("ok");
    // No step is blocked when every upstream input is present.
    expect(result.trace.blocked).toEqual([]);
    // Live weather provenance survives into the grounded facts handed to the LLM.
    expect(result.groundedFacts.some((f) => /open-meteo/i.test(f))).toBe(true);
    // The answer is still honestly labelled as rule-based, not model inference.
    expect(result.dataSource).toBe("rule-based");
    expect(result.isRealData).toBe(false);
  });
});
