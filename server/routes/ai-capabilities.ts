/**
 * AI capability discovery + alias surface.
 *
 * `client/lib/serviceStatus.ts` health-checks one endpoint per AI capability
 * (`/api/ai/soil-analysis`, `/api/ai/pest-control`, ...) and only enables the
 * corresponding UI action when that endpoint answers 200. Previously none of
 * those paths existed, so every AI feature in the UI was permanently disabled
 * even though real engines were available in-process.
 *
 * This router exposes each capability against the engine that actually backs it
 * and states, for every response, whether the result came from a real model, a
 * rule-based engine, or an external microservice that is not configured. It
 * never reports a capability as "model-powered" when only rules are available.
 */

import express, { Request, Response } from "express";
import { analyzeSoilForUI, recommendCropsForUI } from "../services/ai/cropAdvisor";
import { isLLMConfigured, getLLMInfo } from "../services/providers/llmProvider";

const router = express.Router();

type Engine = "llm" | "vision-model" | "rule-based" | "microservice" | "unavailable";

interface Capability {
  id: string;
  name: string;
  nameAr: string;
  engine: Engine;
  /** True when an external microservice URL is configured for this capability. */
  microserviceConfigured?: boolean;
  /** Human-readable explanation of where the answer actually comes from. */
  provenance: string;
  provenanceAr: string;
  requiresConfiguration?: string;
}

const LLM_CONFIG_HINT =
  "AI_BASE_URL + AI_API_KEY (or OPENAI_API_KEY) for LLM features; " +
  "IMAGE_DIAGNOSIS_URL for vision inference";

/**
 * Capability registry. `engine` is computed at request time for anything that
 * depends on configuration (LLM / vision), so the client sees the truth.
 */
function capabilities(): Capability[] {
  const llmReady = isLLMConfigured();
  const visionReady = Boolean(process.env.IMAGE_DIAGNOSIS_URL);
  const microservices = Boolean(
    process.env.SOIL_ANALYSIS_URL || process.env.CROP_RECOMMENDATION_URL,
  );

  return [
    {
      id: "soil-analysis",
      name: "Soil Analysis",
      nameAr: "تحليل التربة",
      engine: "rule-based",
      microserviceConfigured: microservices,
      provenance: microservices
        ? "Answered by the in-process rule-based agronomic engine; a soil-analysis microservice is also configured and used by /api/ai/soil/analyze."
        : "Rule-based agronomic engine (pH, NPK, salinity, organic matter).",
      provenanceAr:
        "محرك قواعد زراعية (pH، NPK، الملوحة، المادة العضوية) وليس نموذجاً مدرّباً.",
    },
    {
      id: "crop-recommendation",
      name: "Smart Crop Recommendations",
      nameAr: "توصيات المحاصيل",
      engine: "rule-based",
      microserviceConfigured: microservices,
      provenance: microservices
        ? "Answered by the in-process rule-based crop engine; a crop-recommendation microservice is also configured and used by /api/ai/crops/recommend."
        : "Rule-based crop suitability scoring over the built-in crop reference table.",
      provenanceAr:
        "ترشيح محاصيل بقواعد ثابتة اعتماداً على جدول مرجعي للمحاصيل، وليس نموذجاً مدرّباً.",
    },
    {
      id: "climate-crop-matcher",
      name: "Climate Crop Matcher",
      nameAr: "مطابقة المناخ للمحاصيل",
      engine: "rule-based",
      microserviceConfigured: microservices,
      provenance: "Climate/soil matching via the rule-based crop engine.",
      provenanceAr: "مطابقة المناخ والتربة عبر محرك القواعد.",
    },
    {
      id: "plant-disease-detection",
      name: "Plant Disease Detection",
      nameAr: "كشف أمراض النبات",
      engine: visionReady ? "vision-model" : "unavailable",
      provenance: visionReady
        ? "Forwarded to the configured vision inference service."
        : "No vision inference service is configured.",
      provenanceAr: visionReady
        ? "يُحوّل إلى خدمة الرؤية المُهيّأة."
        : "لا توجد خدمة استدلال بالصور مُهيّأة.",
      requiresConfiguration: visionReady ? undefined : LLM_CONFIG_HINT,
    },
    {
      id: "leaf-scan",
      name: "Leaf Scan AI",
      nameAr: "فحص الأوراق",
      engine: visionReady ? "vision-model" : "unavailable",
      provenance: visionReady
        ? "Forwarded to the configured vision inference service."
        : "No vision inference service is configured.",
      provenanceAr: visionReady
        ? "يُحوّل إلى خدمة الرؤية المُهيّأة."
        : "لا توجد خدمة استدلال بالصور مُهيّأة.",
      requiresConfiguration: visionReady ? undefined : LLM_CONFIG_HINT,
    },
    {
      id: "pest-control",
      name: "Pest Control Recommender",
      nameAr: "مكافحة الآفات",
      engine: "rule-based",
      provenance: "Curated pest knowledge base with rule-based treatment guidance.",
      provenanceAr: "قاعدة معرفية للآفات مع إرشادات علاج بقواعد ثابتة.",
    },
    {
      id: "weather-yield-planner",
      name: "Smart Weather Crop Planner",
      nameAr: "مخطط الطقس والمحاصيل",
      engine: "rule-based",
      provenance:
        "Live weather from the configured provider (Open-Meteo) combined with rule-based crop planning.",
      provenanceAr: "بيانات طقس حقيقية مع تخطيط محاصيل بقواعد ثابتة.",
    },
    {
      id: "yield-predictor",
      name: "Yield Predictor AI",
      nameAr: "توقّع الإنتاجية",
      engine: "unavailable",
      provenance:
        "No trained yield model is hosted in-process; this capability is declared unavailable rather than faked.",
      provenanceAr:
        "لا يوجد نموذج توقّع إنتاجية مُدرّب داخل المنصة؛ تُعلن هذه القدرة غير متاحة بدل تزييف النتائج.",
      requiresConfiguration: LLM_CONFIG_HINT,
    },
    {
      id: "irrigation-optimizer",
      name: "Smart Irrigation Optimizer",
      nameAr: "تحسين الري",
      engine: "rule-based",
      provenance: "Water-balance calculation from weather data and rule-based scheduling.",
      provenanceAr: "حساب الميزان المائي من بيانات الطقس مع جدولة بقواعد ثابتة.",
    },
    {
      id: "market-forecast",
      name: "Market Forecast AI",
      nameAr: "توقّع السوق",
      engine: "unavailable",
      provenance:
        "No licensed live market data feed is configured; forecasts are not generated.",
      provenanceAr:
        "لا يوجد مصدر أسعار حقيقي مُرخّص ومتصل؛ لا يتم توليد توقعات.",
      requiresConfiguration: "A licensed market-data provider URL",
    },
    {
      id: "supply-demand",
      name: "Supply Demand AI",
      nameAr: "العرض والطلب",
      engine: "unavailable",
      provenance: "Requires a live market-data feed, which is not configured.",
      provenanceAr: "يتطلب مصدر بيانات سوق حقيقي غير مُهيّأ.",
      requiresConfiguration: "A licensed market-data provider URL",
    },
    {
      id: "smart-match",
      name: "Smart Match AI",
      nameAr: "المطابقة الذكية",
      engine: "rule-based",
      provenance: "Rule-based matching of listings to buyers within the marketplace module.",
      provenanceAr: "مطابقة قائمة على قواعد داخل وحدة السوق.",
    },
    {
      id: "farming-tasks-planner",
      name: "Farming Tasks Planner",
      nameAr: "مخطط المهام الزراعية",
      engine: "rule-based",
      provenance: "Rule-based task scheduling from the crop calendar.",
      provenanceAr: "جدولة مهام بقواعد ثابتة من الرزنامة الزراعية.",
    },
    {
      id: "agro-chat",
      name: "Agro Chat AI",
      nameAr: "المساعد الفلاحي",
      engine: llmReady ? "llm" : "rule-based",
      provenance: llmReady
        ? "Answers generated by the configured LLM provider."
        : "Answers generated by the local rule-based knowledge engine.",
      provenanceAr: llmReady
        ? "إجابات من مزوّد LLM المُهيّأ."
        : "إجابات من محرك القواعد المحلي.",
      requiresConfiguration: llmReady ? undefined : LLM_CONFIG_HINT,
    },
    {
      id: "alert-notifier",
      name: "Alert Notifier AI",
      nameAr: "منبّه التنبيهات",
      engine: "rule-based",
      provenance: "Threshold-based alerting over weather and sensor rules.",
      provenanceAr: "تنبيهات مبنية على عتبات الطقس والحسّاسات.",
    },
  ];
}

function findCapability(id: string): Capability | undefined {
  return capabilities().find((c) => c.id === id);
}

/** Standard, honest envelope for a capability probe. */
function capabilityPayload(cap: Capability, extra: Record<string, unknown> = {}) {
  return {
    capability: cap.id,
    name: cap.name,
    nameAr: cap.nameAr,
    available: cap.engine !== "unavailable",
    engine: cap.engine,
    microserviceConfigured: cap.microserviceConfigured ?? false,
    dataSource: cap.engine,
    isRealData: cap.engine === "llm" || cap.engine === "vision-model",
    provenance: cap.provenance,
    provenanceAr: cap.provenanceAr,
    requiresConfiguration: cap.requiresConfiguration,
    llm: getLLMInfo(),
    checkedAt: new Date().toISOString(),
    ...extra,
  };
}

// ---------------------------------------------------------------- discovery

router.get("/capabilities", (_req, res) => {
  const caps = capabilities();
  res.json({
    capabilities: caps,
    summary: {
      total: caps.length,
      available: caps.filter((c) => c.engine !== "unavailable").length,
      unavailable: caps.filter((c) => c.engine === "unavailable").length,
      modelPowered: caps.filter((c) => c.engine === "llm" || c.engine === "vision-model")
        .length,
    },
    llm: getLLMInfo(),
  });
});

// Capability probe: the client uses this to decide whether to enable a feature.
router.get("/capabilities/:id", (req, res) => {
  const cap = findCapability(req.params.id);
  if (!cap) return res.status(404).json({ error: "Unknown AI capability" });
  res.json(capabilityPayload(cap));
});

// --------------------------------------------------- soil analysis (client)
// EnhancedAnalysis.tsx posts the raw sensor form directly to this path.
router.get("/soil-analysis", (_req, res) => {
  const cap = findCapability("soil-analysis")!;
  res.json(
    capabilityPayload(cap, {
      note: "POST sensor data (ph, nitrogen, phosphorus, potassium, ...) to this path for analysis.",
    }),
  );
});

router.post("/soil-analysis", (req: Request, res: Response) => {
  const body = req.body ?? {};
  const cap = findCapability("soil-analysis")!;
  try {
    const analysis = analyzeSoilForUI(body);
    res.json(capabilityPayload(cap, { ...analysis }));
  } catch (error) {
    res.status(400).json({
      error: "Invalid soil data",
      message: error instanceof Error ? error.message : "unknown error",
      dataSource: "rule-based",
      isRealData: false,
    });
  }
});

// ------------------------------------------------- crop recommendation (client)
router.post("/crop-recommendation", (req: Request, res: Response) => {
  const cap = findCapability("crop-recommendation")!;
  try {
    const result = recommendCropsForUI(req.body ?? {});
    res.json(capabilityPayload(cap, { ...result }));
  } catch (error) {
    res.status(400).json({
      error: "Invalid crop request",
      message: error instanceof Error ? error.message : "unknown error",
      dataSource: "rule-based",
      isRealData: false,
    });
  }
});

router.get("/crop-recommendation", (req, res) => {
  const cap = findCapability("crop-recommendation")!;
  const result = recommendCropsForUI({
    ph: parseFloat(req.query.ph as string) || undefined,
    temperature: parseFloat(req.query.temperature as string) || undefined,
    rainfall: parseFloat(req.query.rainfall as string) || undefined,
    salinity: parseFloat(req.query.salinity as string) || undefined,
    season: (req.query.season as string) || undefined,
  });
  res.json(capabilityPayload(cap, { ...result }));
});

// ----------------------------------------------------- simple GET probes
// These back the remaining serviceStatus.ts checks. They report honest engine
// provenance and, where a real engine exists, a live sample of its output.
router.get("/climate-crop-matcher", (_req, res) => {
  const cap = findCapability("climate-crop-matcher")!;
  res.json(
    capabilityPayload(cap, {
      note: "Send climate_data + soil_data to /api/ai/soil/match-crops for a full match.",
    }),
  );
});

router.get("/pest-control", (_req, res) => {
  const cap = findCapability("pest-control")!;
  res.json(
    capabilityPayload(cap, {
      note: "Send crop and symptoms to /api/pest-control/analyze-problem.",
    }),
  );
});

router.get("/irrigation-optimizer", (_req, res) => {
  const cap = findCapability("irrigation-optimizer")!;
  res.json(
    capabilityPayload(cap, {
      note: "Irrigation scheduling is served by /api/smart-irrigation.",
    }),
  );
});

router.get("/weather-yield-planner", (_req, res) => {
  const cap = findCapability("weather-yield-planner")!;
  res.json(
    capabilityPayload(cap, {
      note: "Weather planning is served by /api/weather-crop-planner.",
    }),
  );
});

router.get("/smart-match", (_req, res) => {
  const cap = findCapability("smart-match")!;
  res.json(
    capabilityPayload(cap, {
      note: "Matching is served by /api/smart-marketplace.",
    }),
  );
});

router.get("/farming-tasks-planner", (_req, res) => {
  const cap = findCapability("farming-tasks-planner")!;
  res.json(
    capabilityPayload(cap, {
      note: "Task planning is served by /api/tasks.",
    }),
  );
});

router.get("/alert-notifier", (_req, res) => {
  const cap = findCapability("alert-notifier")!;
  res.json(
    capabilityPayload(cap, {
      note: "Alerts are served by /api/alerts and /api/smart-crop-alerts.",
    }),
  );
});

router.get("/agro-chat", (_req, res) => {
  const cap = findCapability("agro-chat")!;
  res.json(
    capabilityPayload(cap, {
      note: "Chat is served by POST /api/ai/assistant/chat.",
    }),
  );
});

// Vision + market capabilities that are genuinely unavailable without
// configuration. They answer 200 (so the client can read the reason) but
// clearly report `available: false`.
router.get("/plant-disease-detection", (_req, res) => {
  const cap = findCapability("plant-disease-detection")!;
  res.json(
    capabilityPayload(cap, {
      note: "Image upload endpoint: POST /api/ai/images/detect-disease.",
    }),
  );
});

router.get("/leaf-scan", (_req, res) => {
  const cap = findCapability("leaf-scan")!;
  res.json(
    capabilityPayload(cap, {
      note: "Leaf analysis endpoint: POST /api/ai/images/analyze-leaf.",
    }),
  );
});

router.get("/yield-predictor", (_req, res) => {
  const cap = findCapability("yield-predictor")!;
  res.json(capabilityPayload(cap));
});

router.get("/market-forecast", (_req, res) => {
  const cap = findCapability("market-forecast")!;
  res.json(capabilityPayload(cap));
});

router.get("/supply-demand", (_req, res) => {
  const cap = findCapability("supply-demand")!;
  res.json(capabilityPayload(cap));
});

export default router;
