/**
 * Single source of truth for classifying an AI service's declared
 * `model_source` string.
 *
 * Before this module, three places each carried their own regex:
 *   - `serviceProbe.ts`   (`HEURISTIC_MARKERS`)
 *   - `ai-services-gateway.ts` (`HEURISTIC_MODEL_SOURCE_RE` / `RULE_BASED_MODEL_SOURCE_RE`)
 *   - ad-hoc `/heuristic|demo|.../` checks inline in the gateway.
 *
 * `HEURISTIC_MARKERS` did not match `deterministic-rules` — the source the
 * soil service declares. The gateway compensated with a separate rule-based
 * regex, but `microserviceProxy.respondWithProvenance()` did not, so a
 * deterministic-rules service would have been labelled `isRealData: true`.
 * Centralising the classification here removes that class of drift: every
 * consumer must agree on what a provenance string means.
 *
 * Taxonomy (a service is only "real" when it declares a trained model that is
 * not a demo/heuristic/rule-based engine):
 *   - synthetic  : synthetic/demo/heuristic/mock/placeholder output
 *   - rule-based : deterministic rules or a knowledge engine (NOT trained ML)
 *   - llm        : a language-model advisory provider
 *   - trained    : a trained model artifact (ML or computer vision)
 *   - unknown    : no provenance declared
 */

export type ProvenanceKind = "synthetic" | "rule-based" | "llm" | "trained" | "unknown";

/** Synthetic / heuristic / demo markers. Matches `heuristic-demo`, `synthetic-demo`, ... */
export const SYNTHETIC_MODEL_SOURCE_RE =
  /heuristic|demo|simulat|synthetic|mock|random|placeholder|dummy/i;

/**
 * Deterministic-rule markers. These engines compute an answer from fixed
 * agronomic rules — they are NOT trained ML models and must never be presented
 * as one. `deterministic-rules`, `deterministic-visual-analysis`,
 * `deterministic-financial-rules`, `rule-based`, `knowledge-engine` all match.
 */
export const RULE_BASED_MODEL_SOURCE_RE =
  /deterministic[-_ ]?\w*|rule[-_ ]?based|knowledge[-_ ]?engine|symptom[-_ ]?keyword/i;

/** Language-model advisory providers. */
export const LLM_MODEL_SOURCE_RE =
  /openrouter|gemini|gpt|claude|llama|mistral|qwen|nemotron|ollama|\bllm\b/i;

/** Classify a declared `model_source`. `null`/empty → "unknown". */
export function classifyModelSource(modelSource: string | null | undefined): ProvenanceKind {
  if (!modelSource || typeof modelSource !== "string") return "unknown";
  const value = modelSource.trim();
  if (!value) return "unknown";
  if (SYNTHETIC_MODEL_SOURCE_RE.test(value)) return "synthetic";
  if (RULE_BASED_MODEL_SOURCE_RE.test(value)) return "rule-based";
  if (LLM_MODEL_SOURCE_RE.test(value)) return "llm";
  return "trained";
}

/** True when the source is synthetic/heuristic/demo output. */
export function isSyntheticModelSource(modelSource: string | null | undefined): boolean {
  return classifyModelSource(modelSource) === "synthetic";
}

/**
 * True when the source is NOT a trained model — i.e. synthetic, rule-based, or
 * unverifiable. Callers that fail closed on non-model output use this.
 */
export function isNonModelSource(modelSource: string | null | undefined): boolean {
  const kind = classifyModelSource(modelSource);
  return kind !== "trained";
}

/** True only when a trained model artifact is declared. */
export function isTrainedModelSource(modelSource: string | null | undefined): boolean {
  return classifyModelSource(modelSource) === "trained";
}

/** Stable, non-sensitive label for the kind of engine behind a result. */
export function provenanceKindLabel(kind: ProvenanceKind): string {
  switch (kind) {
    case "synthetic":
      return "synthetic";
    case "rule-based":
      return "rule-based";
    case "llm":
      return "llm";
    case "trained":
      return "trained-model";
    default:
      return "unknown";
  }
}

/** Map a provenance kind to the platform's `dataSource` vocabulary. */
export function provenanceDataSource(kind: ProvenanceKind): string {
  switch (kind) {
    case "synthetic":
      return "heuristic";
    case "rule-based":
      return "rule-based";
    case "llm":
      return "llm-generated";
    case "trained":
      return "trained-model";
    default:
      return "unavailable";
  }
}
