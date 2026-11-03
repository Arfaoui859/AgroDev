/**
 * Provenance classification for AI analysis results.
 *
 * AgroGrowth tags every analysis with where it came from (`dataSource`) and
 * whether a real model produced it (`isRealData`). Screens must render that tag
 * instead of assuming success: a rule-based or device-computed fallback is
 * genuinely useful, but showing it as a model prediction would mislead the
 * farmer. Kept as plain TS (no JSX) so it can be unit tested by the Node jest
 * environment, which does not transform `.tsx`.
 */
export type ProvenanceKind = "real" | "engine" | "estimate" | "unknown";

export interface ProvenanceInput {
  dataSource?: string;
  isRealData?: boolean;
  modelSource?: string;
}

export function classifyProvenance(result: ProvenanceInput | null | undefined): ProvenanceKind {
  if (!result) return "unknown";
  const source = `${result.dataSource ?? ""} ${result.modelSource ?? ""}`.toLowerCase();
  if (result.isRealData === true) return "real";
  if (result.isRealData === false) {
    return /estimate|client|local-compute/.test(source) ? "estimate" : "engine";
  }
  if (/llm|vision|microservice|trained|model-api/.test(source)) return "real";
  if (/estimate|client|local-compute/.test(source)) return "estimate";
  if (/heuristic|rule|synthetic|demo|engine/.test(source)) return "engine";
  return "unknown";
}
