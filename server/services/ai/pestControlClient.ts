/**
 * Client for the pest-control microservice's symptom matcher
 * (`POST /identify-pest`).
 *
 * The service is explicit about what it is: it matches user-entered symptoms
 * against a fixed keyword table and declares `model_source: "symptom-keyword-rules"`
 * with `field_validated: false` and `confidence_calibrated: false`. It is a
 * deterministic rule engine, NOT a trained classifier, so this client is called
 * directly (the shared `microserviceProxy` gate correctly refuses to route
 * production data through a rule-based service as if it were a model).
 *
 * The result is always labelled `dataSource: "rule-based"` / `isRealData: false`.
 * The service's own confidence value is never presented as a calibrated
 * probability, and no treatment/product/dose is ever produced here: that path
 * stays fail-closed until a verified Tunisian product registry is connected.
 */

const MAX_SYMPTOMS = 20;
const MAX_SYMPTOM_CHARS = 200;

export interface PestIdentification {
  identified_pest?: string | null;
  pest_name_ar?: string | null;
  category?: string | null;
  identification_method?: string | null;
}

export interface PestIdentificationOutcome {
  /** True when the service returned a usable identification. */
  identified: boolean;
  pest?: string | null;
  pestNameAr?: string | null;
  category?: string | null;
  method?: string | null;
  /** The service's own honesty note; always surfaced, never rewritten. */
  serviceMessage?: string | null;
}

export type PestIdentifyResult =
  | { ok: true; outcome: PestIdentificationOutcome }
  | { ok: false; reason: "not_configured" | "unavailable" | "invalid_response"; detail?: string };

/**
 * Keep only non-empty symptom strings, trimmed and length-bounded. A caller
 * cannot inject a huge payload or non-string values into the model request.
 */
export function sanitiseSymptoms(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const out: string[] = [];
  for (const raw of input) {
    if (typeof raw !== "string") continue;
    const value = raw.trim().slice(0, MAX_SYMPTOM_CHARS);
    if (value) out.push(value);
    if (out.length >= MAX_SYMPTOMS) break;
  }
  return out;
}

/**
 * Derive candidate symptom phrases from a free-text question.
 *
 * When the caller does not send an explicit `symptoms` array, the pest
 * specialist still needs the user's own words. This splits the question into
 * clauses and keeps only those that mention something observable on a plant
 * (a leaf/root/fruit/stem, or a visible sign such as yellowing, wilting,
 * spots, holes, honeydew). It never adds a symptom the user did not write —
 * it only selects their own clauses — and it never invents a pest.
 */
const SYMPTOM_MARKER_RE =
  /(ورق|أوراق|اوراق|جذر|ساق|ثمر|زهر|اصفر|أصفر|ذبول|بقعة|بقع|ثقب|تعفن|عسل|حشر|يرق|دود|نسيج|leaf|leaves|root|stem|fruit|flower|yellow|wilt|spot|hole|rot|mildew|blight|aphid|insect|larvae|feuille|racine|tige|fleur|jaun|flétr|tache|trou|pourri)/i;

export function deriveSymptomsFromQuestion(question: string): string[] {
  if (typeof question !== "string" || !question.trim()) return [];
  const clauses = question
    .split(/[.,;:!?؟،\n]|\s+(?:و|and|et|puis|then)\s+/i)
    .map((c) => c.trim())
    .filter((c) => c.length >= 3 && c.length <= MAX_SYMPTOM_CHARS && SYMPTOM_MARKER_RE.test(c));
  return sanitiseSymptoms(clauses);
}

export function pestServiceBaseUrl(): string {
  const hostedRuntime =
    process.env.NODE_ENV === "production" ||
    process.env.RENDER === "true" ||
    Boolean(process.env.RENDER_SERVICE_ID);
  const raw = process.env.PEST_CONTROL_URL || (hostedRuntime ? "" : "http://localhost:8007");
  if (!raw) return "";
  const value = /^https?:\/\//i.test(raw) ? raw : `http://${raw}`;
  return value.replace(/\/+$/, "");
}

/**
 * Identify a pest from described symptoms. Returns a discriminated result
 * rather than throwing, so a caller can report an unavailable service without
 * inventing an identification.
 */
export async function identifyPestFromSymptoms(
  symptoms: string[],
  cropType: string,
  options: { baseUrl?: string; timeoutMs?: number } = {},
): Promise<PestIdentifyResult> {
  const cleanSymptoms = sanitiseSymptoms(symptoms);
  if (cleanSymptoms.length === 0) return { ok: false, reason: "invalid_response", detail: "no symptoms" };
  const baseUrl = options.baseUrl ?? pestServiceBaseUrl();
  if (!baseUrl) return { ok: false, reason: "not_configured" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 15_000);
  try {
    const response = await fetch(`${baseUrl}/identify-pest`, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symptoms: cleanSymptoms, crop_type: cropType || "unknown" }),
    });
    if (!response.ok) {
      return { ok: false, reason: "unavailable", detail: `HTTP ${response.status}` };
    }
    const body = (await response.json()) as {
      data?: { identification?: PestIdentification };
      message?: string;
    };
    const identification = body?.data?.identification;
    if (!identification || typeof identification !== "object") {
      return { ok: false, reason: "invalid_response" };
    }
    const pest = typeof identification.identified_pest === "string" ? identification.identified_pest : null;
    return {
      ok: true,
      outcome: {
        identified: Boolean(pest),
        pest,
        pestNameAr: typeof identification.pest_name_ar === "string" ? identification.pest_name_ar : null,
        category: typeof identification.category === "string" ? identification.category : null,
        method: typeof identification.identification_method === "string" ? identification.identification_method : null,
        serviceMessage: typeof body.message === "string" ? body.message : null,
      },
    };
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
