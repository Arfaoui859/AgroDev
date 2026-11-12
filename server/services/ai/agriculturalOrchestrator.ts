/**
 * AgroGrowth — central agricultural multi-agent orchestrator.
 *
 * The orchestrator turns one user question into an explicit, bounded execution
 * plan over an ALLOW-LISTED registry of specialist agents. It:
 *   - selects the specialists a question actually needs,
 *   - runs independent specialists concurrently and dependent ones in order,
 *   - gates a dependent step as `blocked` when its dependency failed,
 *   - applies a per-step timeout and bounded retries,
 *   - records a structured, inspectable trace, and
 *   - composes one coherent answer while preserving each specialist's
 *     provenance (rule-based vs. real provider data) and uncertainty.
 *
 * It never invents missing inputs. A specialist that lacks its required data
 * reports `insufficient_input` instead of guessing, and a downstream step that
 * needed that data is marked `blocked` rather than silently continuing.
 */
import {
  analyzeSoil,
  recommendCrops,
  type SoilInput,
} from "./knowledgeEngine";
import { predictLabSoil, sanitiseLabAnalytes, type LabSoilPredictionResult } from "./labSoilClient";
import { identifyPestFromSymptoms, sanitiseSymptoms } from "./pestControlClient";
import { chatCompleteJson, isLLMConfigured } from "../providers/llmProvider";
import { wrapUntrusted } from "../../lib/promptSafety";

export type Language = "ar" | "fr" | "en";

export type SpecialistId =
  | "soil"
  | "lab_soil"
  | "weather"
  | "crop"
  | "irrigation"
  | "plant_health"
  | "market"
  | "pest_control"
  | "finance";

export type StepStatus =
  | "ok"
  | "insufficient_input"
  | "unavailable"
  | "blocked"
  | "failed";

export interface OrchestratorContext {
  governorate?: string;
  crop?: string;
  farmSizeHectares?: number;
  soil?: SoilInput;
  season?: string;
  waterAvailability?: "منخفض" | "متوسط" | "مرتفع";
  temperature?: number;
  rainfall?: number;
  /** Recent, persisted AgroGrowth alerts; evidence, never instructions. */
  operationalAlerts?: string[];
  /** Compact facts from the caller's own persisted AgroGrowth records. */
  platformRecords?: string[];
  /**
   * Explicitly supplied laboratory analytes (the 16 keys the trained lab models
   * understand). Only set when the caller actually provided measurements — the
   * `lab_soil` specialist never invents them, and performs no network call when
   * they are absent.
   */
  labAnalytes?: Record<string, number>;
  /**
   * Free-text symptoms the user actually described (e.g. "yellow leaves",
   * "sticky honeydew"). Only set when supplied — the `pest_control` specialist
   * never invents symptoms, and without them it stays `insufficient_input`.
   */
  symptoms?: string[];
}

export interface OrchestratorRequest {
  question: string;
  language?: Language;
  context?: OrchestratorContext;
}

export interface SpecialistStepResult {
  id: SpecialistId;
  title: string;
  status: StepStatus;
  /** Deterministic, provenance-labelled findings (never free-form invention). */
  findings: string[];
  /** "rule-based" | "open-meteo" | "persisted-records" | null when unavailable. */
  dataSource: string | null;
  isRealData: boolean;
  confidence: "high" | "medium" | "low" | "unknown";
  /** ids of specialists whose output this step required. */
  dependsOn: SpecialistId[];
  attempts: number;
  latencyMs: number;
  note?: string;
}

export interface OrchestrationPlanStep {
  id: SpecialistId;
  title: string;
  dependsOn: SpecialistId[];
}

export interface OrchestrationTrace {
  plan: OrchestrationPlanStep[];
  steps: SpecialistStepResult[];
  blocked: SpecialistId[];
  startedAt: string;
  finishedAt: string;
  concurrency: number;
  /**
   * How the plan was chosen. `"llm"` means a configured language model read the
   * question and proposed the specialist set (validated against the allow-list);
   * `"keywords"` is the deterministic keyword planner. This is the only LLM use
   * in the orchestrator — agent selection, never computation.
   */
  plannedBy: "llm" | "keywords";
  /** Ids the LLM proposed but were dropped because they are not allow-listed. */
  rejectedPlanIds: string[];
}

export interface OrchestrationResult {
  answer: string;
  language: Language;
  usedSpecialists: SpecialistId[];
  /** Grounded facts to hand to an LLM as trusted evidence (provenance kept). */
  groundedFacts: string[];
  trace: OrchestrationTrace;
  /**
   * Specialists whose result came from a genuinely trained model artifact
   * (currently only `lab_soil`). Empty when none ran. The per-step `dataSource`
   * in the trace remains the authoritative provenance for each step.
   */
  trainedModelSpecialists: SpecialistId[];
  dataSource: "rule-based";
  isRealData: false;
  disclaimer: string;
}

export interface SpecialistDefinition {
  id: SpecialistId;
  title: Record<Language, string>;
  dependsOn: SpecialistId[];
  keywords: RegExp;
  /** A short reason the specialist cannot run without its required inputs. */
  run: (ctx: OrchestratorContext, deps: Map<SpecialistId, SpecialistStepResult>) => Omit<
    SpecialistStepResult,
    "id" | "title" | "dependsOn" | "attempts" | "latencyMs"
  > | Promise<
    Omit<SpecialistStepResult, "id" | "title" | "dependsOn" | "attempts" | "latencyMs">
  >;
}

const TITLES: Record<SpecialistId, Record<Language, string>> = {
  soil: { ar: "تحليل التربة", fr: "Analyse du sol", en: "Soil analysis" },
  lab_soil: { ar: "نماذج التربة المخبرية", fr: "Modèles de sol en laboratoire", en: "Laboratory soil models" },
  weather: { ar: "الطقس", fr: "Météo", en: "Weather" },
  crop: { ar: "توصية المحاصيل", fr: "Recommandation de cultures", en: "Crop recommendation" },
  irrigation: { ar: "تحسين الري", fr: "Optimisation de l'irrigation", en: "Irrigation optimization" },
  plant_health: { ar: "صحة النبات", fr: "Santé des plantes", en: "Plant health" },
  market: { ar: "معلومات السوق", fr: "Information marché", en: "Market intelligence" },
  pest_control: { ar: "مكافحة الآفات", fr: "Lutte contre les ravageurs", en: "Pest control" },
  finance: { ar: "المالية الزراعية", fr: "Finance agricole", en: "Agricultural finance" },
};

function hasSoilMeasurements(soil?: SoilInput): boolean {
  if (!soil) return false;
  return Object.values(soil).some((v) => typeof v === "number" && Number.isFinite(v));
}

function marketRecords(ctx: OrchestratorContext): string[] {
  return (ctx.platformRecords ?? []).filter((r) =>
    /^(Recorded market price|Stored market prediction|Public stored market prediction)/.test(r),
  );
}

function cultivationRecords(ctx: OrchestratorContext): string[] {
  return (ctx.platformRecords ?? []).filter((r) => /^Cultivation /.test(r));
}

function weatherRecords(ctx: OrchestratorContext): string[] {
  return (ctx.platformRecords ?? []).filter((r) =>
    /^(LIVE WEATHER FROM OPEN-METEO|Recorded weather|Stored weather forecast)/.test(r),
  );
}

function plantHealthRecords(ctx: OrchestratorContext): string[] {
  return (ctx.platformRecords ?? []).filter((r) =>
    /^(Saved plant-health record|Saved leaf-health analysis)/.test(r),
  );
}

/**
 * Format a lab-model prediction into a short, provenance-labelled finding.
 * Every predicted target states its out-of-fold R² so the caller can judge how
 * much to trust the number — the models are trained, but only lightly for some
 * targets (e.g. extractable phosphorus R²≈0.34).
 */
function formatLabFindings(result: LabSoilPredictionResult): string[] {
  const findings: string[] = [];
  for (const [target, entry] of Object.entries(result.models ?? {})) {
    if (entry.status !== "predicted" || typeof entry.prediction !== "number") {
      findings.push(
        `${target}: غير متوقّع — التغطية ${Math.round((entry.coverage ?? 0) * 100)}% (المطلوبة 80%)`,
      );
      continue;
    }
    const r2 = entry.metrics?.r2;
    const r2Label = typeof r2 === "number" ? `، R² خارج العيّنة ${r2.toFixed(2)}` : "";
    const imputed = entry.imputed_features?.length
      ? `، قيم مُستكملة: ${entry.imputed_features.join("، ")}`
      : "";
    findings.push(`${target}: ${entry.prediction.toFixed(3)}${r2Label}${imputed}`);
  }
  return findings;
}

/**
 * The allow-listed registry. Only these ids can ever run; nothing from user
 * input is used as an agent name.
 */
export const SPECIALISTS: SpecialistDefinition[] = [
  {
    id: "soil",
    title: TITLES.soil,
    dependsOn: [],
    keywords: /(تربة|ph|آزوت|فوسفور|بوتاس|ملوحة|خصوبة|soil|sol\b|torba|mlou7a|azot|fosfor)/i,
    run: (ctx) => {
      if (!hasSoilMeasurements(ctx.soil)) {
        return {
          status: "insufficient_input",
          findings: [],
          dataSource: null,
          isRealData: false,
          confidence: "unknown",
          note: "No soil measurements in context; pH / N / P / K / organic matter are required.",
        };
      }
      const soil = analyzeSoil(ctx.soil!);
      const findings = soil.findings
        .filter((f) => f.status !== "missing")
        .map((f) => `${f.labelAr}: ${f.value} — ${f.status}`);
      if (soil.missingMeasurements.length) {
        findings.push(`قياسات ناقصة: ${soil.missingMeasurements.join("، ")}`);
      }
      findings.unshift(`مؤشر صحة التربة: ${soil.healthScore}/100 (${soil.fertilityLevelAr})`);
      return {
        status: "ok",
        findings,
        dataSource: "rule-based",
        isRealData: false,
        confidence: soil.missingMeasurements.length > 3 ? "low" : "medium",
        note: soil.disclaimer,
      };
    },
  },
  {
    id: "lab_soil",
    title: TITLES.lab_soil,
    dependsOn: [],
    keywords: /(تحليل مخبري|مختبر|قيمة مخبرية|lab\b|laboratoire|lab_values|tahlil|3ayna)/i,
    run: async (ctx) => {
      const { values, rejected } = sanitiseLabAnalytes(ctx.labAnalytes);
      if (Object.keys(values).length === 0) {
        return {
          status: "insufficient_input",
          findings: [],
          dataSource: null,
          isRealData: false,
          confidence: "unknown",
          note: "No laboratory analyte measurements were supplied; the trained lab models require real measured values and never impute missing ones.",
        };
      }
      const outcome = await predictLabSoil(values, { timeoutMs: 7000 });
      if (outcome.ok === false) {
        const reason = outcome.reason;
        const detail = outcome.detail;
        return {
          status: reason === "not_configured" ? "unavailable" : "failed",
          findings: [],
          dataSource: null,
          isRealData: false,
          confidence: "unknown",
          note:
            reason === "not_configured"
              ? "The laboratory soil service is not configured; no prediction was produced."
              : `The laboratory soil service did not answer (${detail ?? reason}); no prediction was produced.`,
        };
      }
      const findings = formatLabFindings(outcome.result);
      const predictedCount = Object.values(outcome.result.models ?? {}).filter(
        (m) => m.status === "predicted",
      ).length;
      if (rejected.length) findings.push(`قياسات مُتجاهَلة (غير معروفة للنموذج): ${rejected.join("، ")}`);
      return {
        status: predictedCount > 0 ? "ok" : "insufficient_input",
        findings,
        // Only claim model inference when a target was actually predicted; a
        // coverage-only response produced no model output.
        dataSource: predictedCount > 0 ? "trained-model-inference" : null,
        isRealData: false,
        confidence: predictedCount >= 5 ? "medium" : "low",
        note:
          `نماذج تعلّم آلي مدرّبة (${predictedCount} هدف/أهداف) على مجموعة iSDA المرجعية؛ ` +
          "القيم مُستنتَجة وليست قياسات ميدانية، وتُترك التغطية/R² لتقدير درجة الثقة.",
      };
    },
  },
  {
    id: "weather",
    title: TITLES.weather,
    dependsOn: [],
    keywords: /(طقس|مطر|حرارة|ري|weather|météo|irrigation|arrosage|meteo|matar|skhouna|bard|jaw|ri7|nrawi|ndvi|قمر صناعي)/i,
    run: (ctx) => {
      const hasLive = weatherRecords(ctx).some((r) => /^LIVE WEATHER FROM OPEN-METEO/.test(r));
      if (ctx.temperature === undefined && ctx.rainfall === undefined && weatherRecords(ctx).length === 0) {
        return {
          status: "insufficient_input",
          findings: [],
          dataSource: null,
          isRealData: false,
          confidence: "unknown",
          note: "No live or recorded weather in context; farm coordinates are required for a real forecast.",
        };
      }
      const findings: string[] = [];
      if (ctx.temperature !== undefined) findings.push(`درجة الحرارة: ${ctx.temperature}°م`);
      if (ctx.rainfall !== undefined) findings.push(`الأمطار: ${ctx.rainfall} مم`);
      for (const record of weatherRecords(ctx).slice(0, 5)) findings.push(record);
      return {
        status: "ok",
        findings,
        dataSource: hasLive ? "open-meteo" : "persisted-records",
        isRealData: hasLive,
        confidence: hasLive ? "high" : "medium",
      };
    },
  },
  {
    id: "crop",
    title: TITLES.crop,
    dependsOn: ["soil", "weather"],
    keywords: /(محصول|بذور|زراعة|نزرع|نغرس|crop|semis|culture|ma7soul|ghars|zra3a|tmatem|tomat|zitoun|9amh|felfel)/i,
    run: (ctx, deps) => {
      // Soft dependency: if soil/weather ran but returned no data we still
      // produce a neutral recommendation and state the limitation explicitly.
      const soil = deps.get("soil");
      const weather = deps.get("weather");
      const soilUnavailable = !soil || soil.status !== "ok";
      const weatherUnavailable = !weather || weather.status !== "ok";
      const result = recommendCrops({
        ph: ctx.soil?.ph,
        temperature: ctx.temperature,
        rainfall: ctx.rainfall,
        salinity: ctx.soil?.salinity,
        waterAvailability: ctx.waterAvailability,
        season: ctx.season,
      });
      const findings = result.recommendations
        .slice(0, 3)
        .map((c, i) => `${i + 1}. ${c.nameAr} (ملاءمة ${c.suitabilityScore}%، احتياج مائي: ${c.waterNeedAr})`);
      const missing: string[] = [];
      if (soilUnavailable) missing.push("تحليل التربة");
      if (weatherUnavailable) missing.push("بيانات الطقس");
      const confidence =
        soilUnavailable || weatherUnavailable ? "low" : result.recommendations[0]?.suitabilityScore >= 80 ? "high" : "medium";
      return {
        status: "ok",
        findings,
        dataSource: "rule-based",
        isRealData: false,
        confidence,
        note: missing.length
          ? `التوصية مبنية على معطيات جزئية؛ تنقص: ${missing.join("، ")}.`
          : result.disclaimer,
      };
    },
  },
  {
    id: "irrigation",
    title: TITLES.irrigation,
    dependsOn: ["crop", "weather"],
    keywords: /(ري|سقي|ماء|irrigation|arrosage|eau|nrawi|ns9i|s9i|ri7)/i,
    run: (ctx, deps) => {
      const crop = deps.get("crop");
      if (!crop || crop.status !== "ok") {
        return {
          status: "blocked",
          findings: [],
          dataSource: null,
          isRealData: false,
          confidence: "unknown",
          note: "Irrigation depends on a crop recommendation, which is unavailable.",
        };
      }
      if (ctx.rainfall === undefined && weatherRecords(ctx).length === 0) {
        return {
          status: "insufficient_input",
          findings: [],
          dataSource: null,
          isRealData: false,
          confidence: "unknown",
          note: "Water requirement needs rainfall or a recorded weather/soil-moisture source; none is available.",
        };
      }
      const findings: string[] = [
        "لا يوجد نظام قياس مياه ميداني موثّق؛ التقدير التالي نوعي فقط وليس جدولة ري مؤكدة.",
      ];
      if (ctx.rainfall !== undefined) findings.push(`أمطار حديثة: ${ctx.rainfall} مم — خفّف الري بعد أمطار كافية.`);
      if (ctx.waterAvailability) findings.push(`توفر المياه المسجل: ${ctx.waterAvailability}.`);
      return {
        status: "ok",
        findings,
        dataSource: "rule-based",
        isRealData: false,
        confidence: "low",
        note: "Qualitative guidance only: no verified crop-water coefficients or field telemetry are connected.",
      };
    },
  },
  {
    id: "plant_health",
    title: TITLES.plant_health,
    dependsOn: [],
    keywords: /(مرض|حشرة|آفة|أوراق|disease|maladie|pest|ravageur|mardh|7achra|doud|feuille)/i,
    run: (ctx) => {
      const records = plantHealthRecords(ctx);
      if (records.length === 0) {
        return {
          status: "insufficient_input",
          findings: [],
          dataSource: null,
          isRealData: false,
          confidence: "unknown",
          note: "No saved plant-health record. A clear leaf/plant image is required for diagnosis; the platform never guesses a disease.",
        };
      }
      return {
        status: "ok",
        findings: records.slice(0, 5),
        dataSource: "persisted-records",
        isRealData: false,
        confidence: "medium",
        note: "Saved model/inspection results, not a confirmed field diagnosis.",
      };
    },
  },
  {
    id: "market",
    title: TITLES.market,
    dependsOn: [],
    keywords: /(سعر|سوق|تصدير|price|marché|market|sou9|souq|sou3|prix)/i,
    run: (ctx) => {
      const records = marketRecords(ctx);
      if (records.length === 0) {
        return {
          status: "unavailable",
          findings: [],
          dataSource: null,
          isRealData: false,
          confidence: "unknown",
          note: "No dated, sourced market record for this crop. Prices are never invented.",
        };
      }
      return {
        status: "ok",
        findings: records.slice(0, 6),
        dataSource: "persisted-records",
        isRealData: false,
        confidence: "medium",
        note: "Historical recorded quotes, not guaranteed live prices.",
      };
    },
  },
  {
    id: "pest_control",
    title: TITLES.pest_control,
    dependsOn: [],
    keywords: /(مبيد|مكافحة|آفة|حشرة|pesticide|traitement|lutte|7achra|doud)/i,
    run: async (ctx) => {
      const symptoms = sanitiseSymptoms(ctx.symptoms);
      if (symptoms.length === 0) {
        return {
          status: "insufficient_input",
          findings: [],
          dataSource: null,
          isRealData: false,
          confidence: "unknown",
          note:
            "No symptoms were described. The pest service matches keywords against described symptoms only, and " +
            "treatment advice requires a verified Tunisian product registry (active ingredient, dose, pre-harvest " +
            "interval). None is connected, so no product or dose is suggested.",
        };
      }
      const outcome = await identifyPestFromSymptoms(symptoms, ctx.crop ?? "unknown", { timeoutMs: 12_000 });
      if (outcome.ok === false) {
        return {
          status: "unavailable",
          findings: [],
          dataSource: null,
          isRealData: false,
          confidence: "unknown",
          note:
            outcome.reason === "not_configured"
              ? "No pest-control service is configured; no identification is guessed."
              : "The pest-control service could not be reached; no identification is guessed.",
        };
      }
      const result = outcome.outcome;
      if (!result.identified || !result.pest) {
        return {
          status: "insufficient_input",
          findings: [],
          dataSource: null,
          isRealData: false,
          confidence: "unknown",
          note: "The described symptoms did not match any known pest keyword rule; no pest is guessed.",
        };
      }
      const label = result.pestNameAr ? `${result.pest} (${result.pestNameAr})` : result.pest;
      const findings = [
        `آفة محتملة بحسب مطابقة الأعراض: ${label}${result.category ? ` — التصنيف: ${result.category}` : ""}`,
      ];
      return {
        status: "ok",
        findings,
        // Keyword matching against a fixed symptom table — a deterministic rule
        // engine, never a trained classifier or a calibrated confidence.
        dataSource: "rule-based",
        isRealData: false,
        confidence: "low",
        note:
          "مطابقة كلمات مفتاحية للأعراض فقط — ليست نتيجة نموذج مدرّب ولا تشخيصاً مؤكداً. لا يُقترح أي منتج أو جرعة " +
          "دون سجل منتجات تونسي موثّق.",
      };
    },
  },
  {
    id: "finance",
    title: TITLES.finance,
    dependsOn: [],
    keywords: /(ربح|ربحية|تكلفة|مصاريف|ميزانية|استثمار|تمويل|مردودية|profit|cost|expense|budget|investment|finance|rentabilité|masrouf|rb7)/i,
    run: (ctx) => {
      const withFigures = cultivationRecords(ctx).filter((r) =>
        /(?:total_cost|revenue|profit)=(-?\d+(?:\.\d+)?)(?:;|\])/i.test(r),
      );
      if (withFigures.length === 0) {
        return {
          status: "unavailable",
          findings: [],
          dataSource: null,
          isRealData: false,
          confidence: "unknown",
          note: "No numeric cost/revenue/profit records in context; figures are never invented.",
        };
      }
      return {
        status: "ok",
        findings: withFigures.slice(0, 6),
        dataSource: "persisted-records",
        isRealData: false,
        confidence: "medium",
        note: "Figures come from user records; verify currency, period and method before an investment decision.",
      };
    },
  },
];

const REGISTRY = new Map(SPECIALISTS.map((s) => [s.id, s]));

/**
 * Choose the specialists a question needs. Only registry ids can be returned.
 * Dependencies are pulled in transitively so a dependent step always has its
 * prerequisite in the plan.
 */
export function planSpecialists(
  question: string,
  context?: OrchestratorContext,
): SpecialistId[] {
  const q = question || "";
  const selected = new Set<SpecialistId>();
  for (const spec of SPECIALISTS) {
    if (spec.keywords.test(q)) selected.add(spec.id);
  }
  // If the caller actually supplied laboratory analytes, run the trained lab
  // models even when the wording does not mention them — the data is present.
  if (context?.labAnalytes && Object.keys(context.labAnalytes).length > 0) {
    selected.add("lab_soil");
  }
  // If a question is purely about a topic we have no keyword for, fall back to
  // soil + crop, which is the platform's core advisory pair.
  if (selected.size === 0) {
    selected.add("soil");
    selected.add("crop");
  }
  return closeOverDependencies(selected);
}

/** Pull a specialist set's dependencies in transitively; ids must be allow-listed. */
function closeOverDependencies(selected: Iterable<SpecialistId>): SpecialistId[] {
  const set = new Set<SpecialistId>(selected);
  let changed = true;
  while (changed) {
    changed = false;
    for (const id of Array.from(set)) {
      for (const dep of REGISTRY.get(id)?.dependsOn ?? []) {
        if (!set.has(dep)) {
          set.add(dep);
          changed = true;
        }
      }
    }
  }
  return SPECIALISTS.map((s) => s.id).filter((id) => set.has(id));
}

export interface SmartPlan {
  plan: SpecialistId[];
  plannedBy: "llm" | "keywords";
  rejected: string[];
}

/**
 * Ask a configured LLM which specialists a question needs.
 *
 * The model only ever *selects* from the allow-listed registry — it never runs a
 * tool, invents a specialist, or performs a calculation. Its answer is parsed
 * strictly: unknown ids are dropped (and reported), dependencies are added
 * transitively, and any parse/transport failure falls back to the deterministic
 * keyword planner. Disable with `ORCHESTRATOR_LLM_PLANNER=false`.
 */
export async function planSpecialistsWithLLM(
  question: string,
  context?: OrchestratorContext,
): Promise<SmartPlan> {
  const fallback: SmartPlan = {
    plan: planSpecialists(question, context),
    plannedBy: "keywords",
    rejected: [],
  };
  if (process.env.ORCHESTRATOR_LLM_PLANNER === "false") return fallback;
  if (!isLLMConfigured()) return fallback;

  const catalogue = SPECIALISTS.map((s) => `- ${s.id}: ${s.title.en}`).join("\n");
  // Bound the planner tightly: it is a routing decision, not an answer. Respect
  // a global AI_TIMEOUT_MS so a slow provider cannot stall the whole request.
  const planTimeoutMs =
    Number(process.env.ORCHESTRATOR_LLM_PLAN_TIMEOUT_MS) ||
    Math.min(Number(process.env.AI_TIMEOUT_MS) || 6000, 6000);
  try {
    const parsed = await chatCompleteJson<{ specialists?: unknown }>(
      [
        {
          role: "system",
          content:
            "You are an agricultural task router. Choose which specialist agents should answer the user's question. " +
            "Reply with JSON only: {\"specialists\": [\"id\", ...]}. Use ONLY these ids:\n" +
            `${catalogue}\n` +
            "Pick the smallest set that genuinely applies. Never invent ids. If nothing clearly applies, return an empty array.",
        },
        { role: "user", content: wrapUntrusted(question, "user_message").content },
      ],
      { temperature: 0, maxTokens: 120, timeoutMs: planTimeoutMs },
    );
    const proposed = Array.isArray(parsed?.specialists) ? parsed.specialists : null;
    if (!proposed) return fallback;

    const accepted = new Set<SpecialistId>();
    const rejected: string[] = [];
    for (const raw of proposed) {
      const id = typeof raw === "string" ? raw.trim() : "";
      if (!id) continue;
      if (REGISTRY.has(id as SpecialistId)) accepted.add(id as SpecialistId);
      else rejected.push(id);
    }
    // The LLM may return nothing useful; keep the deterministic plan then.
    if (accepted.size === 0) return { ...fallback, rejected };
    // Lab analytes present is a hard signal the model cannot see — always keep it.
    if (context?.labAnalytes && Object.keys(context.labAnalytes).length > 0) {
      accepted.add("lab_soil");
    }
    return { plan: closeOverDependencies(accepted), plannedBy: "llm", rejected };
  } catch {
    // Provider error, timeout, or unparseable output: deterministic planning.
    return fallback;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface RunOptions {
  timeoutMs?: number;
  retries?: number;
  concurrency?: number;
  /**
   * Registry override (testing / future plug-in specialists). Defaults to the
   * built-in allow-list. Keys not present here can never run.
   */
  registry?: Map<SpecialistId, SpecialistDefinition>;
}

/**
 * Execute the plan. Independent specialists run concurrently (bounded);
 * dependent steps run after their prerequisites. A step whose dependency did
 * not reach `ok` is recorded as `blocked` and is not executed.
 */
export async function executePlan(
  plan: SpecialistId[],
  context: OrchestratorContext,
  language: Language,
  options: RunOptions = {},
): Promise<{ steps: SpecialistStepResult[]; concurrency: number }> {
  const timeoutMs = options.timeoutMs ?? (Number(process.env.ORCHESTRATOR_STEP_TIMEOUT_MS) || 8000);
  const retries = options.retries ?? (Number(process.env.ORCHESTRATOR_STEP_RETRIES) || 1);
  const concurrency = Math.max(1, options.concurrency ?? (Number(process.env.ORCHESTRATOR_CONCURRENCY) || 4));
  const registry = options.registry ?? REGISTRY;

  const results = new Map<SpecialistId, SpecialistStepResult>();
  const remaining = new Set(plan);

  const runStep = async (id: SpecialistId): Promise<SpecialistStepResult> => {
    const spec = registry.get(id)!;
    const title = spec.title[language];
    const deps = new Map<SpecialistId, SpecialistStepResult>();
    for (const dep of spec.dependsOn) {
      const depResult = results.get(dep);
      if (depResult) deps.set(dep, depResult);
    }
    const startedAt = Date.now();
    let attempts = 0;
    let lastError: Error | null = null;
    const hardDependencyFailed = spec.dependsOn.some((dep) => {
      const r = results.get(dep);
      return r && (r.status === "failed" || r.status === "blocked");
    });

    if (hardDependencyFailed) {
      return {
        id,
        title,
        status: "blocked",
        findings: [],
        dataSource: null,
        isRealData: false,
        confidence: "unknown",
        dependsOn: [...spec.dependsOn],
        attempts: 0,
        latencyMs: 0,
        note: "A required upstream specialist failed; this step was not executed.",
      };
    }

    const maxAttempts = Math.max(1, retries + 1);
    while (attempts < maxAttempts) {
      attempts += 1;
      try {
        const partial = await withTimeout(
          Promise.resolve().then(() => spec.run(context, deps)),
          timeoutMs,
          id,
        );
        return {
          id,
          title,
          dependsOn: [...spec.dependsOn],
          attempts,
          latencyMs: Date.now() - startedAt,
          ...partial,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempts < maxAttempts) await sleep(150 * attempts);
      }
    }

    return {
      id,
      title,
      status: "failed",
      findings: [],
      dataSource: null,
      isRealData: false,
      confidence: "unknown",
      dependsOn: [...spec.dependsOn],
      attempts,
      latencyMs: Date.now() - startedAt,
      note: lastError?.message,
    };
  };

  while (remaining.size > 0) {
    const ready = Array.from(remaining).filter((id) =>
      (registry.get(id)?.dependsOn ?? []).every((dep) => results.has(dep) || !remaining.has(dep)),
    );
    const batch = ready.length ? ready : Array.from(remaining); // safety: never deadlock

    // Bounded-concurrency pool over the ready batch.
    for (let i = 0; i < batch.length; i += concurrency) {
      const slice = batch.slice(i, i + concurrency);
      const settled = await Promise.all(slice.map((id) => runStep(id)));
      settled.forEach((result, idx) => {
        results.set(slice[idx], result);
        remaining.delete(slice[idx]);
      });
    }
  }

  return { steps: plan.map((id) => results.get(id)!).filter(Boolean), concurrency };
}

const HEADINGS: Record<Language, { header: string; evidence: string; limits: string; trained: string }> = {
  ar: {
    header: "تنسيق متعدد الوكلاء",
    evidence: "أدلة الوكلاء",
    limits: "حدود وقيود",
    trained: "نموذج مدرَّب",
  },
  fr: {
    header: "Orchestration multi-agents",
    evidence: "Éléments des agents",
    limits: "Limites",
    trained: "modèle entraîné",
  },
  en: {
    header: "Multi-agent orchestration",
    evidence: "Agent findings",
    limits: "Limitations",
    trained: "trained model",
  },
};

function composeAnswer(
  language: Language,
  steps: SpecialistStepResult[],
): string {
  const h = HEADINGS[language];
  const ok = steps.filter((s) => s.status === "ok");
  const notOk = steps.filter((s) => s.status !== "ok");
  const lines: string[] = [`${h.header}:`];
  for (const step of ok) {
    const label = step.dataSource === "trained-model-inference"
      ? ` (${h.trained})`
      : step.isRealData
        ? " (بيانات حقيقية)"
        : "";
    lines.push(`\n${step.title}${label}:`);
    for (const f of step.findings) lines.push(`• ${f}`);
    if (step.note) lines.push(`(${step.note})`);
  }
  if (notOk.length) {
    lines.push(`\n${h.limits}:`);
    for (const step of notOk) {
      lines.push(`• ${step.title} — ${step.status}${step.note ? `: ${step.note}` : ""}`);
    }
  }
  return lines.join("\n");
}

const DISCLAIMERS: Record<Language, string> = {
  ar: "هذه إجابة مُنسّقة من وكلاء متخصصين. القيم محسوبة بقواعد زراعية أو مأخوذة من سجلات محفوظة أو من مزوّد بيانات حقيقي كما هو موضّح لكل وكيل، وليست ناتجة عن نموذج تعلّم آلي مدرَّب ما لم يُذكر خلاف ذلك.",
  fr: "Réponse orchestrée par des agents spécialisés. Les valeurs proviennent de règles agronomiques, d'enregistrements stockés ou d'un fournisseur réel, comme indiqué par agent; elles ne proviennent pas d'un modèle ML entraîné sauf mention contraire.",
  en: "This answer is orchestrated from specialist agents. Values are rule-based, from stored records, or from a real provider as labelled per agent; they are not from a trained ML model unless stated.",
};

/**
 * Plan, execute and compose one orchestrated answer.
 *
 * Deterministic and, by default, network-free: specialists only use the context
 * they are given. The one exception is `lab_soil`, which calls the trained lab
 * models over HTTP *only* when the caller actually supplied analyte
 * measurements; every other specialist is pure and offline. A failed or
 * unreachable lab service is reported as `failed`/`unavailable` — never
 * fabricated.
 */
export async function orchestrateAgriculturalQuestion(
  request: OrchestratorRequest,
  options: RunOptions = {},
): Promise<OrchestrationResult> {
  const language = request.language ?? "ar";
  const context = request.context ?? {};
  const startedAt = new Date().toISOString();
  const { plan, plannedBy, rejected } = await planSpecialistsWithLLM(request.question, context);
  const { steps, concurrency } = await executePlan(plan, context, language, options);

  const groundedFacts: string[] = [];
  for (const step of steps) {
    if (step.status !== "ok") continue;
    for (const f of step.findings) groundedFacts.push(`[${step.title}] ${f}`);
  }

  const trace: OrchestrationTrace = {
    plan: plan.map((id) => ({
      id,
      title: REGISTRY.get(id)!.title[language],
      dependsOn: [...(REGISTRY.get(id)!.dependsOn ?? [])],
    })),
    steps,
    blocked: steps.filter((s) => s.status === "blocked").map((s) => s.id),
    startedAt,
    finishedAt: new Date().toISOString(),
    concurrency,
    plannedBy,
    rejectedPlanIds: rejected,
  };

  return {
    answer: composeAnswer(language, steps),
    language,
    usedSpecialists: steps.filter((s) => s.status === "ok").map((s) => s.id),
    groundedFacts,
    trace,
    trainedModelSpecialists: steps
      .filter((s) => s.status === "ok" && s.dataSource === "trained-model-inference")
      .map((s) => s.id),
    dataSource: "rule-based",
    isRealData: false,
    disclaimer: DISCLAIMERS[language],
  };
}
