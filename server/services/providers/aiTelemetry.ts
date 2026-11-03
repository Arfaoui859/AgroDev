/**
 * In-process AI capability telemetry.
 *
 * Records the outcome of the most recent provider calls so the capability
 * monitor can report an honest status per service. This is deliberately
 * lightweight and process-local: it holds only the last outcome, latency and a
 * coarse error category — never request bodies, prompts, images or credentials.
 *
 * Status taxonomy (see capabilityStatus()):
 *   NOT_CONFIGURED — no provider/engine configured for the capability
 *   CONFIGURED     — configured but not yet exercised in this process
 *   LIVE_VERIFIED  — a real provider call succeeded
 *   DEGRADED       — configured and previously worked, but the last call failed
 *   FALLBACK       — the capability is served by its rule-based fallback
 *   UNAVAILABLE    — no engine can serve the capability
 */

export type ErrorCategory =
  | "none"
  | "unconfigured"
  | "auth"
  | "rate_limit"
  | "timeout"
  | "network"
  | "upstream"
  | "parse"
  | "unknown";

export type CapabilityStatus =
  | "NOT_CONFIGURED"
  | "CONFIGURED"
  | "LIVE_VERIFIED"
  | "DEGRADED"
  | "FALLBACK"
  | "UNAVAILABLE";

export interface TelemetryEntry {
  /** e.g. "agro-chat", "plant-disease-detection" */
  capability: string;
  /** Provider/model or engine that produced the last result. */
  source: string;
  /** True when the last result came from a real external provider. */
  real: boolean;
  latencyMs: number;
  at: string;
  errorCategory: ErrorCategory;
  errorMessage?: string;
}

const MAX_ENTRIES = 200;
const entries: TelemetryEntry[] = [];

/** Map a thrown provider error to a coarse, non-sensitive category. */
export function categoriseError(error: unknown): ErrorCategory {
  const status = (error as { status?: number })?.status;
  const kind = (error as { kind?: string })?.kind;
  if (kind === "unconfigured") return "unconfigured";
  if (kind === "timeout") return "timeout";
  if (kind === "network") return "network";
  if (kind === "parse") return "parse";
  if (status === 401 || status === 403) return "auth";
  if (status === 429) return "rate_limit";
  if (typeof status === "number" && status >= 500) return "upstream";
  return "unknown";
}

export function recordTelemetry(entry: TelemetryEntry): void {
  entries.push(entry);
  if (entries.length > MAX_ENTRIES) entries.splice(0, entries.length - MAX_ENTRIES);
}

/** Record a successful provider call. */
export function recordSuccess(
  capability: string,
  source: string,
  real: boolean,
  latencyMs: number,
): void {
  recordTelemetry({
    capability,
    source,
    real,
    latencyMs,
    at: new Date().toISOString(),
    errorCategory: "none",
  });
}

/** Record a failed provider call. The message is truncated and secret-free. */
export function recordFailure(
  capability: string,
  source: string,
  error: unknown,
  latencyMs = 0,
): void {
  recordTelemetry({
    capability,
    source,
    real: false,
    latencyMs,
    at: new Date().toISOString(),
    errorCategory: categoriseError(error),
    errorMessage: error instanceof Error ? error.message.slice(0, 160) : undefined,
  });
}

export function lastEntry(capability: string): TelemetryEntry | undefined {
  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i].capability === capability) return entries[i];
  }
  return undefined;
}

/** Derive the honest status for a capability from config + telemetry. */
export function capabilityStatus(
  capability: string,
  configured: boolean,
  engineAvailable: boolean,
  engineIsReal: boolean,
): { status: CapabilityStatus; lastError: ErrorCategory | null; lastChecked: string | null; lastLatencyMs: number | null } {
  const entry = lastEntry(capability);
  const base = {
    lastError: entry && entry.errorCategory !== "none" ? entry.errorCategory : null,
    lastChecked: entry?.at ?? null,
    lastLatencyMs: entry?.latencyMs ?? null,
  };

  if (!configured && !engineAvailable) {
    return { status: "NOT_CONFIGURED", ...base };
  }
  if (!configured) {
    // A deterministic/rule engine serves it, but no external provider is set.
    return { status: engineAvailable ? "FALLBACK" : "UNAVAILABLE", ...base };
  }
  if (!engineAvailable) {
    return { status: "UNAVAILABLE", ...base };
  }
  if (!entry) {
    return { status: "CONFIGURED", ...base };
  }
  if (entry.errorCategory !== "none") {
    return { status: "DEGRADED", ...base };
  }
  return { status: entry.real && engineIsReal ? "LIVE_VERIFIED" : "FALLBACK", ...base };
}

/** Clear telemetry (used by tests). */
export function resetTelemetry(): void {
  entries.length = 0;
}
