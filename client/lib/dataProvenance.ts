/**
 * Data-provenance reader for API responses.
 *
 * Array-returning endpoints (market prices, weather series) cannot carry a
 * provenance field without breaking the existing SPA contract, so the server
 * advertises it in headers instead:
 *
 *   X-Data-Provenance: simulated | live | model | estimate
 *   X-Is-Real-Data:    true | false
 *
 * Object-returning endpoints embed `dataSource` / `isRealData` / `disclaimer`
 * in the body. This module normalises both shapes so a screen can render one
 * banner regardless of which convention the endpoint uses.
 *
 * Kept as plain TS (no JSX) so the Node jest environment, which does not
 * transform `.tsx`, can unit test it.
 */
export interface DataProvenance {
  dataSource?: string;
  isRealData?: boolean;
  disclaimer?: string;
  /** True when the server explicitly flagged the payload as not real. */
  simulated: boolean;
}

/** Read provenance from response headers and/or a parsed JSON body. */
export function readProvenance(
  headers: { get(name: string): string | null } | null | undefined,
  body: unknown,
): DataProvenance {
  const headerSource = headers?.get("X-Data-Provenance") ?? undefined;
  const headerReal = headers?.get("X-Is-Real-Data");

  const record =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : undefined;

  const bodySource =
    typeof record?.dataSource === "string" ? record.dataSource : undefined;
  const bodyReal =
    typeof record?.isRealData === "boolean" ? record.isRealData : undefined;
  const disclaimer =
    typeof record?.disclaimer === "string" ? record.disclaimer : undefined;

  const dataSource = bodySource ?? headerSource;
  const isRealData =
    bodyReal ?? (headerReal === null || headerReal === undefined
      ? undefined
      : headerReal === "true");

  return {
    dataSource,
    isRealData,
    disclaimer,
    simulated: isSimulatedData(dataSource, isRealData),
  };
}

/**
 * A payload is simulated when it is explicitly not real, or when its source
 * string names a synthetic generator. Absent provenance is NOT treated as
 * simulated -- unknown is surfaced separately rather than mislabelled.
 */
export function isSimulatedData(
  dataSource?: string,
  isRealData?: boolean,
): boolean {
  if (isRealData === false) return true;
  if (typeof dataSource !== "string") return false;
  return /simulat|synthetic|demo|mock|fake|placeholder/i.test(dataSource);
}

/** Arabic + English disclaimer shown when a screen renders simulated data. */
export const SIMULATED_MARKET_DISCLAIMER_AR =
  "بيانات محاكاة توضيحية وليست أسعاراً حقيقية من السوق. لا تعتمد عليها لاتخاذ قرارات تجارية.";
export const SIMULATED_MARKET_DISCLAIMER_EN =
  "Illustrative simulated data, not real market prices. Do not use for trading decisions.";

/** True when the payload is simulated and therefore must be labelled. */
export function needsProvenanceLabel(p: DataProvenance): boolean {
  return p.simulated;
}
