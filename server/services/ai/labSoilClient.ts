/**
 * Client for the soil microservice's *genuinely trained* laboratory-assisted
 * models (`POST /predict-lab-soil`).
 *
 * The service's generic `/health` reports `model_source: "deterministic-rules"`
 * for its separate rule analyzer, so the shared provenance gate in
 * `microserviceProxy` (correctly) refuses to route production data through it.
 * The lab models are a distinct, verifiable capability — seven random-forest /
 * extra-trees / gradient-boosting regressors fitted on the iSDA wet-chemistry
 * reference dataset — and are therefore called directly here, with their own
 * metadata (model type, R², MAE, coverage) preserved in the result.
 */

/** The 16 analytes the lab models understand (from the service manifest). */
export const LAB_ANALYTES = [
  "aluminium_extractable",
  "boron_extractable",
  "calcium_extractable",
  "carbon_organic",
  "copper_extractable",
  "electrical_conductivity",
  "iron_extractable",
  "magnesium_extractable",
  "manganese_extractable",
  "nitrogen_total",
  "ph",
  "phosphorus_extractable",
  "potassium_extractable",
  "sodium_extractable",
  "sulphur_extractable",
  "zinc_extractable",
] as const;

const ALLOWED = new Set<string>(LAB_ANALYTES);

export interface LabModelPrediction {
  status: "predicted" | "insufficient_input" | string;
  prediction: number | null;
  coverage: number;
  imputed_features?: string[];
  missing_features?: string[];
  metrics?: { r2?: number; mae?: number; rmse?: number };
}

export interface LabSoilPredictionResult {
  status: string;
  prediction_scope?: string;
  field_validated?: boolean;
  tunisia_validated?: boolean;
  dataset?: string;
  models: Record<string, LabModelPrediction>;
  input_quality?: Record<string, unknown>;
}

/**
 * Keep only the recognised analytes whose values are finite numbers. A caller
 * cannot inject arbitrary keys or non-numeric values into the model request.
 */
export function sanitiseLabAnalytes(
  input: unknown,
): { values: Record<string, number>; rejected: string[] } {
  const values: Record<string, number> = {};
  const rejected: string[] = [];
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { values, rejected };
  }
  for (const [key, raw] of Object.entries(input as Record<string, unknown>)) {
    if (!ALLOWED.has(key)) {
      rejected.push(key);
      continue;
    }
    if (typeof raw === "number" && Number.isFinite(raw)) values[key] = raw;
  }
  return { values, rejected };
}

export function soilServiceBaseUrl(): string {
  const hostedRuntime =
    process.env.NODE_ENV === "production" ||
    process.env.RENDER === "true" ||
    Boolean(process.env.RENDER_SERVICE_ID);
  const raw = process.env.SOIL_ANALYSIS_URL || (hostedRuntime ? "" : "http://localhost:8001");
  if (!raw) return "";
  const value = /^https?:\/\//i.test(raw) ? raw : `http://${raw}`;
  return value.replace(/\/+$/, "");
}

/**
 * Run the trained lab models. Returns a discriminated result rather than
 * throwing, so a caller can decide how to surface an unavailable service
 * without inventing a prediction.
 */
export async function predictLabSoil(
  analytes: Record<string, number>,
  options: { baseUrl?: string; timeoutMs?: number } = {},
): Promise<
  | { ok: true; result: LabSoilPredictionResult }
  | { ok: false; reason: "not_configured" | "unavailable" | "invalid_response"; detail?: string }
> {
  const baseUrl = options.baseUrl ?? soilServiceBaseUrl();
  if (!baseUrl) return { ok: false, reason: "not_configured" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 60_000);
  try {
    const response = await fetch(`${baseUrl}/predict-lab-soil`, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lab_values: analytes }),
    });
    if (!response.ok) {
      return { ok: false, reason: "unavailable", detail: `HTTP ${response.status}` };
    }
    const result = (await response.json()) as LabSoilPredictionResult;
    if (!result || typeof result !== "object" || typeof result.models !== "object") {
      return { ok: false, reason: "invalid_response" };
    }
    return { ok: true, result };
  } catch (error) {
    return {
      ok: false,
      reason: "unavailable",
      detail: error instanceof Error ? error.name : "unknown",
    };
  } finally {
    clearTimeout(timer);
  }
}
