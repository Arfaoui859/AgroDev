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

import { safeErrorMessage } from '../lib/errors';
import express, { Request, Response } from "express";
import { analyzeSoilForUI, recommendCropsForUI } from "../services/ai/cropAdvisor";
import { isLLMConfigured, getLLMInfo } from "../services/providers/llmProvider";
import { isVisionConfigured } from "../services/providers/visionProvider";
import { probeService } from "../services/providers/serviceProbe";
import { capabilityStatus } from "../services/providers/aiTelemetry";
import { firstEnv } from "../lib/env";
import { localServiceFallback, normalizeServiceUrl } from "./ai-services-gateway";

const router = express.Router();

type Engine =
  | "llm"
  | "vision-model"
  | "rule-based"
  | "heuristic"
  | "microservice"
  | "unavailable";

interface Capability {
  id: string;
  name: string;
  nameAr: string;
  engine: Engine;
  /** External microservice backing this capability, if one is configured. */
  microserviceUrl?: string;
  /** Engine to report when the microservice is configured but unreachable. */
  fallbackEngine?: Engine;
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
 * Short-lived reachability cache. A capability backed by a microservice is only
 * "available" if that service actually answers — a configured URL is not proof
 * that a model is running behind it.
 */
/**
 * Capability registry. `engine` is computed at request time for anything that
 * depends on configuration (LLM / vision), so the client sees the truth.
 */
async function capabilities(): Promise<Capability[]> {
  const llmReady = isLLMConfigured();
  // A multimodal LLM (AI_VISION_MODEL) is a valid vision back-end too, so the
  // capability is "ready" when either the LLM or a vision service is set.
  const visionReady = isVisionConfigured();
  // Nominal engine for vision: a real model. The live probe downgrades this to
  // "heuristic" when the configured service self-reports demo inference.
  const visionEngine: Engine = "vision-model";
  const visionProvenance = llmReady
    ? "Answered by the configured multimodal LLM (AI_VISION_MODEL)."
    : "Forwarded to the configured vision inference service (reachability checked live).";
  const visionProvenanceAr = llmReady
    ? "يُحلّل بواسطة نموذج لغوي متعدد الوسائط مُهيّأ (AI_VISION_MODEL)."
    : "يُحوّل إلى خدمة الرؤية المُهيّأة (يُتحقّق من توفرها فعلياً).";
  // Resolve each capability's backing service the same way the AI gateway
  // does: an explicit env URL, else the gateway's localhost default — but only
  // in a local runtime. `localServiceFallback()` returns "" in a hosted
  // runtime, so production never advertises a `http://localhost` service (or
  // reports one as "configured") when no URL was set.
  const soilUrl = normalizeServiceUrl(firstEnv("SOIL_ANALYSIS_URL"), localServiceFallback(8001));
  const cropUrl = normalizeServiceUrl(firstEnv("CROP_RECOMMENDATION_URL"), localServiceFallback(8002));
  const visionUrl = normalizeServiceUrl(firstEnv("IMAGE_DIAGNOSIS_URL"), localServiceFallback(8003));
  const pestUrl = normalizeServiceUrl(firstEnv("PEST_CONTROL_URL"), localServiceFallback(8007));
  const irrigationUrl = normalizeServiceUrl(firstEnv("IRRIGATION_OPTIMIZATION_URL"), localServiceFallback(8008));
  const weatherYieldUrl = normalizeServiceUrl(
    firstEnv("WEATHER_YIELD_INTELLIGENCE_URL", "SMART_MARKETPLACE_URL"),
    localServiceFallback(8006),
  );
  const marketForecastUrl = normalizeServiceUrl(
    firstEnv("MARKET_FORECAST_URL", "MARKET_PREDICTION_URL"),
    localServiceFallback(8004),
  );

  return [
    {
      id: "soil-analysis",
      name: "Soil Analysis",
      nameAr: "تحليل التربة",
      // The in-process agronomic engine answers; the microservice is an
      // optional accelerator that is probed for reachability and provenance.
      engine: "rule-based",
      microserviceUrl: soilUrl,
      microserviceConfigured: Boolean(soilUrl),
      fallbackEngine: "rule-based",
      provenance: soilUrl
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
      microserviceUrl: cropUrl,
      microserviceConfigured: Boolean(cropUrl),
      fallbackEngine: "rule-based",
      provenance: cropUrl
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
      microserviceUrl: soilUrl,
      microserviceConfigured: Boolean(soilUrl),
      fallbackEngine: "rule-based",
      provenance: "Climate/soil matching via the rule-based crop engine.",
      provenanceAr: "مطابقة المناخ والتربة عبر محرك القواعد.",
    },
    {
      id: "plant-disease-detection",
      name: "Plant Disease Detection",
      nameAr: "كشف أمراض النبات",
      engine: visionReady ? visionEngine : "unavailable",
      microserviceConfigured: Boolean(visionUrl),
      microserviceUrl: visionUrl,
      fallbackEngine: "unavailable",
      provenance: visionReady ? visionProvenance : "No vision back-end is configured.",
      provenanceAr: visionReady
        ? visionProvenanceAr
        : "لا توجد خدمة استدلال بالصور مُهيّأة.",
      requiresConfiguration: visionReady ? undefined : LLM_CONFIG_HINT,
    },
    {
      id: "leaf-scan",
      name: "Leaf Scan AI",
      nameAr: "فحص الأوراق",
      engine: visionReady ? visionEngine : "unavailable",
      microserviceConfigured: Boolean(visionUrl),
      microserviceUrl: visionUrl,
      fallbackEngine: "unavailable",
      provenance: visionReady ? visionProvenance : "No vision back-end is configured.",
      provenanceAr: visionReady ? visionProvenanceAr : "لا توجد خدمة استدلال بالصور مُهيّأة.",
      requiresConfiguration: visionReady ? undefined : LLM_CONFIG_HINT,
    },
    {
      id: "pest-control",
      name: "Pest Control Recommender",
      nameAr: "مكافحة الآفات",
      // Backed by the pest_control microservice (symptom keyword matching +
      // classifier trained on synthetic samples). Reachability is probed live;
      // its synthetic provenance is surfaced rather than hidden.
      engine: "microservice",
      microserviceUrl: pestUrl,
      microserviceConfigured: Boolean(pestUrl),
      fallbackEngine: "unavailable",
      provenance: pestUrl
        ? "Answered by the pest_control microservice (symptom matching + classifier trained on synthetic samples)."
        : "No pest-control microservice is configured (set PEST_CONTROL_URL).",
      provenanceAr: pestUrl
        ? "يُجاب بواسطة خدمة مكافحة الآفات (مطابقة الأعراض + مصنّف مدرّب على بيانات اصطناعية)."
        : "لا توجد خدمة مكافحة آفات مُهيّأة (اضبط PEST_CONTROL_URL).",
      requiresConfiguration: pestUrl ? undefined : "PEST_CONTROL_URL",
    },
    {
      id: "weather-yield-planner",
      name: "Smart Weather Crop Planner",
      nameAr: "مخطط الطقس والمحاصيل",
      // Served by the weather_yield_intelligence microservice (seasonal planner
      // trained on synthetic samples).
      engine: "microservice",
      microserviceUrl: weatherYieldUrl,
      microserviceConfigured: Boolean(weatherYieldUrl),
      fallbackEngine: "unavailable",
      provenance: weatherYieldUrl
        ? "Answered by the weather_yield_intelligence microservice (seasonal planning model trained on synthetic samples)."
        : "No weather/yield microservice is configured (set WEATHER_YIELD_INTELLIGENCE_URL).",
      provenanceAr: weatherYieldUrl
        ? "يُجاب بواسطة خدمة الطقس والمردودية (نموذج تخطيط موسمي مدرّب على بيانات اصطناعية)."
        : "لا توجد خدمة طقس/مردودية مُهيّأة (اضبط WEATHER_YIELD_INTELLIGENCE_URL).",
      requiresConfiguration: weatherYieldUrl ? undefined : "WEATHER_YIELD_INTELLIGENCE_URL",
    },
    {
      id: "yield-predictor",
      name: "Yield Predictor AI",
      nameAr: "توقّع الإنتاجية",
      // Served by the same weather_yield_intelligence microservice.
      engine: "microservice",
      microserviceUrl: weatherYieldUrl,
      microserviceConfigured: Boolean(weatherYieldUrl),
      fallbackEngine: "unavailable",
      provenance: weatherYieldUrl
        ? "Answered by the weather_yield_intelligence microservice (yield regression trained on synthetic samples)."
        : "No yield-prediction microservice is configured (set WEATHER_YIELD_INTELLIGENCE_URL).",
      provenanceAr: weatherYieldUrl
        ? "يُجاب بواسطة خدمة الطقس والمردودية (انحدار المردودية مدرّب على بيانات اصطناعية)."
        : "لا توجد خدمة توقّع مردودية مُهيّأة (اضبط WEATHER_YIELD_INTELLIGENCE_URL).",
      requiresConfiguration: weatherYieldUrl ? undefined : "WEATHER_YIELD_INTELLIGENCE_URL",
    },
    {
      id: "irrigation-optimizer",
      name: "Smart Irrigation Optimizer",
      nameAr: "تحسين الري",
      // Served by the irrigation_optimization microservice (water-balance
      // scheduling model trained on synthetic samples).
      engine: "microservice",
      microserviceUrl: irrigationUrl,
      microserviceConfigured: Boolean(irrigationUrl),
      fallbackEngine: "unavailable",
      provenance: irrigationUrl
        ? "Answered by the irrigation_optimization microservice (water-balance scheduling model trained on synthetic samples)."
        : "No irrigation microservice is configured (set IRRIGATION_OPTIMIZATION_URL).",
      provenanceAr: irrigationUrl
        ? "يُجاب بواسطة خدمة تحسين الري (نموذج جدولة بالميزان المائي مدرّب على بيانات اصطناعية)."
        : "لا توجد خدمة ري مُهيّأة (اضبط IRRIGATION_OPTIMIZATION_URL).",
      requiresConfiguration: irrigationUrl ? undefined : "IRRIGATION_OPTIMIZATION_URL",
    },
    {
      id: "market-forecast",
      name: "Market Forecast AI",
      nameAr: "توقّع السوق",
      // Served by the market_prediction microservice. It models on synthetic
      // samples, not a licensed live price feed — its provenance says so.
      engine: "microservice",
      microserviceUrl: marketForecastUrl,
      microserviceConfigured: Boolean(marketForecastUrl),
      fallbackEngine: "unavailable",
      provenance: marketForecastUrl
        ? "Answered by the market_prediction microservice (forecast model trained on synthetic price history, not a licensed live feed)."
        : "No market-forecast microservice is configured (set MARKET_FORECAST_URL).",
      provenanceAr: marketForecastUrl
        ? "يُجاب بواسطة خدمة توقّع السوق (نموذج مدرّب على تاريخ أسعار اصطناعي، وليس مصدراً حقيقياً مُرخّصاً)."
        : "لا توجد خدمة توقّع سوق مُهيّأة (اضبط MARKET_FORECAST_URL).",
      requiresConfiguration: marketForecastUrl ? undefined : "MARKET_FORECAST_URL",
    },
    {
      id: "supply-demand",
      name: "Supply Demand AI",
      nameAr: "العرض والطلب",
      engine: "microservice",
      microserviceUrl: marketForecastUrl,
      microserviceConfigured: Boolean(marketForecastUrl),
      fallbackEngine: "unavailable",
      provenance: marketForecastUrl
        ? "Answered by the market_prediction microservice (supply/demand model trained on synthetic data)."
        : "No market microservice is configured (set MARKET_FORECAST_URL).",
      provenanceAr: marketForecastUrl
        ? "يُجاب بواسطة خدمة توقّع السوق (نموذج عرض/طلب مدرّب على بيانات اصطناعية)."
        : "لا توجد خدمة سوق مُهيّأة (اضبط MARKET_FORECAST_URL).",
      requiresConfiguration: marketForecastUrl ? undefined : "MARKET_FORECAST_URL",
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

async function findCapability(id: string): Promise<Capability | undefined> {
  const caps = await capabilities();
  return caps.find((c) => c.id === id);
}

/**
 * Resolve the effective engine for a capability. A microservice-backed
 * capability that is configured but unreachable must not be advertised as a
 * working model — it is downgraded to its declared fallback.
 */
async function resolveEngine(cap: Capability): Promise<{
  engine: Engine;
  reachable: boolean | null;
  configured: boolean;
  modelSource: string | null;
}> {
  if (!cap.microserviceUrl) {
    // No backing service is configured. A capability whose primary engine is
    // the microservice must degrade to its declared fallback (usually
    // "unavailable"); an in-process engine (rule-based) stays usable.
    const engine =
      cap.engine === "microservice" ? (cap.fallbackEngine ?? "unavailable") : cap.engine;
    return { engine, reachable: null, configured: false, modelSource: null };
  }
  const probe = await probeService(cap.microserviceUrl);
  if (!probe.reachable) {
    return {
      engine: cap.fallbackEngine ?? "unavailable",
      reachable: false,
      configured: true,
      modelSource: null,
    };
  }
  // The service is up. If it self-reports heuristic/demo inference, report
  // that honestly instead of advertising it as a trained model.
  if (probe.heuristic && cap.engine === "vision-model") {
    return {
      engine: "heuristic",
      reachable: true,
      configured: true,
      modelSource: probe.modelSource,
    };
  }
  return {
    engine: cap.engine,
    reachable: true,
    configured: true,
    modelSource: probe.modelSource,
  };
}

/**
 * Capability ids that are backed by an external provider we can monitor. The
 * chat capability is tracked under "agro-chat" by the advisor.
 */
function telemetryId(cap: Capability): string {
  return cap.id;
}

/** Standard, honest envelope for a capability probe. */
async function capabilityPayload(
  cap: Capability,
  extra: Record<string, unknown> = {},
) {
  const { engine, reachable, configured, modelSource } = await resolveEngine(cap);
  const available = engine !== "unavailable";
  const isReal = engine === "llm" || engine === "vision-model";
  const llm = getLLMInfo();
  // A capability is "configured" when a real engine is set up for it, or a
  // microservice URL is present. Rule-based engines are always available but
  // never count as an external provider.
  const engineConfigured =
    isReal || Boolean(cap.microserviceUrl) || configured;
  const telemetry = capabilityStatus(telemetryId(cap), engineConfigured, available, isReal);

  return {
    capability: cap.id,
    name: cap.name,
    nameAr: cap.nameAr,
    available,
    /** CONFIGURED | LIVE_VERIFIED | DEGRADED | FALLBACK | UNAVAILABLE | NOT_CONFIGURED */
    status: telemetry.status,
    engine,
    microserviceConfigured: cap.microserviceConfigured ?? false,
    // Never disclose internal service topology on this public probe; the
    // reachability flag is the signal callers need.
    microserviceUrl: null,
    microserviceReachable: reachable,
    modelSource,
    dataSource: engine,
    isRealData: isReal,
    provenance: cap.provenance,
    provenanceAr: cap.provenanceAr,
    requiresConfiguration:
      !available && configured
        ? "A microservice is configured for this capability but is not reachable."
        : cap.requiresConfiguration,
    /** Observability: last error category (never a stack trace) and latency. */
    lastError: telemetry.lastError,
    lastChecked: telemetry.lastChecked,
    lastLatencyMs: telemetry.lastLatencyMs,
    llm: {
      configured: llm.configured,
      credentialAvailable: llm.credentialAvailable,
      provider: llm.provider,
      textModel: llm.textModel,
      visionModel: llm.visionModel,
    },
    checkedAt: new Date().toISOString(),
    ...extra,
  };
}

// ---------------------------------------------------------------- discovery

router.get("/capabilities", async (_req, res) => {
  const caps = await capabilities();
  const resolved = await Promise.all(
    caps.map(async (cap) => ({
      id: cap.id,
      name: cap.name,
      nameAr: cap.nameAr,
      engine: (await resolveEngine(cap)).engine,
      microserviceConfigured: cap.microserviceConfigured ?? false,
      provenance: cap.provenance,
      provenanceAr: cap.provenanceAr,
    })),
  );
  res.json({
    capabilities: resolved,
    summary: {
      total: resolved.length,
      available: resolved.filter((c) => c.engine !== "unavailable").length,
      unavailable: resolved.filter((c) => c.engine === "unavailable").length,
      modelPowered: resolved.filter(
        (c) => c.engine === "llm" || c.engine === "vision-model",
      ).length,
    },
    llm: getLLMInfo(),
  });
});

// Capability probe: the client uses this to decide whether to enable a feature.
router.get("/capabilities/:id", async (req, res) => {
  const cap = await findCapability(req.params.id);
  if (!cap) return res.status(404).json({ error: "Unknown AI capability" });
  res.json(await capabilityPayload(cap));
});

// --------------------------------------------------- soil analysis (client)
// EnhancedAnalysis.tsx posts the raw sensor form directly to this path.
router.get("/soil-analysis", async (_req, res) => {
  const cap = (await findCapability("soil-analysis"))!;
  res.json(
    await capabilityPayload(cap, {
      note: "POST sensor data (ph, nitrogen, phosphorus, potassium, ...) to this path for analysis.",
    }),
  );
});

router.post("/soil-analysis", async (req: Request, res: Response) => {
  const body = req.body ?? {};
  const cap = (await findCapability("soil-analysis"))!;
  try {
    const analysis = analyzeSoilForUI(body);
    res.json(await capabilityPayload(cap, { ...analysis }));
  } catch (error) {
    res.status(400).json({
      error: "Invalid soil data",
      message: safeErrorMessage(error, "unknown error"),
      dataSource: "rule-based",
      isRealData: false,
    });
  }
});

// ------------------------------------------------- crop recommendation (client)
router.post("/crop-recommendation", async (req: Request, res: Response) => {
  const cap = (await findCapability("crop-recommendation"))!;
  try {
    const result = recommendCropsForUI(req.body ?? {});
    res.json(await capabilityPayload(cap, { ...result }));
  } catch (error) {
    res.status(400).json({
      error: "Invalid crop request",
      message: safeErrorMessage(error, "unknown error"),
      dataSource: "rule-based",
      isRealData: false,
    });
  }
});

router.get("/crop-recommendation", async (req, res) => {
  const cap = (await findCapability("crop-recommendation"))!;
  const result = recommendCropsForUI({
    ph: parseFloat(req.query.ph as string) || undefined,
    temperature: parseFloat(req.query.temperature as string) || undefined,
    rainfall: parseFloat(req.query.rainfall as string) || undefined,
    salinity: parseFloat(req.query.salinity as string) || undefined,
    season: (req.query.season as string) || undefined,
  });
  res.json(await capabilityPayload(cap, { ...result }));
});

// ----------------------------------------------------- simple GET probes
// These back the remaining serviceStatus.ts checks. They report honest engine
// provenance and, where a real engine exists, a live sample of its output.
router.get("/climate-crop-matcher", async (_req, res) => {
  const cap = (await findCapability("climate-crop-matcher"))!;
  res.json(
    await capabilityPayload(cap, {
      note: "Send climate_data + soil_data to /api/ai/soil/match-crops for a full match.",
    }),
  );
});

router.get("/pest-control", async (_req, res) => {
  const cap = (await findCapability("pest-control"))!;
  res.json(
    await capabilityPayload(cap, {
      note: "Send crop and symptoms to /api/pest-control/analyze-problem.",
    }),
  );
});

router.get("/irrigation-optimizer", async (_req, res) => {
  const cap = (await findCapability("irrigation-optimizer"))!;
  res.json(
    await capabilityPayload(cap, {
      note: "Irrigation scheduling is served by /api/smart-irrigation.",
    }),
  );
});

router.get("/weather-yield-planner", async (_req, res) => {
  const cap = (await findCapability("weather-yield-planner"))!;
  res.json(
    await capabilityPayload(cap, {
      note: "Weather planning is served by /api/weather-crop-planner.",
    }),
  );
});

router.get("/smart-match", async (_req, res) => {
  const cap = (await findCapability("smart-match"))!;
  res.json(
    await capabilityPayload(cap, {
      note: "Matching is served by /api/smart-marketplace.",
    }),
  );
});

router.get("/farming-tasks-planner", async (_req, res) => {
  const cap = (await findCapability("farming-tasks-planner"))!;
  res.json(
    await capabilityPayload(cap, {
      note: "Task planning is served by /api/tasks.",
    }),
  );
});

router.get("/alert-notifier", async (_req, res) => {
  const cap = (await findCapability("alert-notifier"))!;
  res.json(
    await capabilityPayload(cap, {
      note: "Alerts are served by /api/alerts and /api/smart-crop-alerts.",
    }),
  );
});

router.get("/agro-chat", async (_req, res) => {
  const cap = (await findCapability("agro-chat"))!;
  res.json(
    await capabilityPayload(cap, {
      note: "Chat is served by POST /api/ai/assistant/chat.",
    }),
  );
});

// Vision + market capabilities that are genuinely unavailable without
// configuration. They answer 200 (so the client can read the reason) but
// clearly report `available: false`.
router.get("/plant-disease-detection", async (_req, res) => {
  const cap = (await findCapability("plant-disease-detection"))!;
  res.json(
    await capabilityPayload(cap, {
      note: "Image upload endpoint: POST /api/ai/images/detect-disease.",
    }),
  );
});

router.get("/leaf-scan", async (_req, res) => {
  const cap = (await findCapability("leaf-scan"))!;
  res.json(
    await capabilityPayload(cap, {
      note: "Leaf analysis endpoint: POST /api/ai/images/analyze-leaf.",
    }),
  );
});

router.get("/yield-predictor", async (_req, res) => {
  const cap = (await findCapability("yield-predictor"))!;
  res.json(await capabilityPayload(cap));
});

router.get("/market-forecast", async (_req, res) => {
  const cap = (await findCapability("market-forecast"))!;
  res.json(await capabilityPayload(cap));
});

router.get("/supply-demand", async (_req, res) => {
  const cap = (await findCapability("supply-demand"))!;
  res.json(await capabilityPayload(cap));
});

export default router;
