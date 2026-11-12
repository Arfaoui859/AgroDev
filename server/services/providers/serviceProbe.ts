/**
 * Microservice reachability + provenance probe.
 *
 * A configured URL is not evidence that a trained model is running behind it.
 * This probe asks the service's own /health endpoint and reads the model
 * provenance it declares (e.g. "heuristic-demo"), so callers can label results
 * honestly instead of presenting synthetic output as model inference.
 *
 * Results are cached briefly to avoid a health call on every request.
 */

import { classifyModelSource, isSyntheticModelSource, type ProvenanceKind } from "./modelProvenance";

export interface ServiceProbe {
  reachable: boolean;
  /** Model provenance declared by the service's own /health payload. */
  modelSource: string | null;
  /** True when the service reports it runs on synthetic/heuristic logic. */
  heuristic: boolean;
  /**
   * Full classification of the declared source. Unlike `heuristic`, this also
   * distinguishes deterministic rule engines (which are NOT trained ML) and
   * language-model providers from a genuine trained model.
   */
  kind: ProvenanceKind;
  /** True when the service self-reports a deterministic rule engine. */
  ruleBased: boolean;
  /**
   * True only when the service's /health declares its trained lab models are
   * loadable (`lab_assisted.models_available > 0`). The soil service's overall
   * `model_source` is `deterministic-rules` (its rule analyzer), so this
   * separate signal is required to detect the trained lab capability.
   */
  labModelsAvailable: boolean;
}

const TTL_MS = 30_000;
const cache = new Map<string, { probe: ServiceProbe; at: number }>();

const UNREACHABLE: ServiceProbe = {
  reachable: false,
  modelSource: null,
  heuristic: false,
  kind: "unknown",
  ruleBased: false,
  labModelsAvailable: false,
};

export async function probeService(
  url: string,
  timeoutMs = 1500,
): Promise<ServiceProbe> {
  const cached = cache.get(url);
  const now = Date.now();
  if (cached && now - cached.at < TTL_MS) return cached.probe;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let probe = UNREACHABLE;
  try {
    const response = await fetch(`${url.replace(/\/+$/, "")}/health`, {
      signal: controller.signal,
    });
    if (response.ok) {
      let modelSource: string | null = null;
      let labModelsAvailable = false;
      try {
        const body = (await response.json()) as Record<string, unknown>;
        const declared =
          body.model_source ?? body.modelSource ?? body.engine ?? body.mode;
        if (typeof declared === "string") modelSource = declared;
        const lab = body.lab_assisted as Record<string, unknown> | undefined;
        const available = lab?.models_available;
        if (typeof available === "number" && available > 0) labModelsAvailable = true;
        // The soil service reports readiness as metadata_ready (the seven model
        // manifests are readable, so the artifacts are available to load).
        else if (lab?.metadata_ready === true) labModelsAvailable = true;
      } catch {
        // Non-JSON health body: reachable, provenance unknown.
      }
      probe = {
        reachable: true,
        modelSource,
        heuristic: isSyntheticModelSource(modelSource),
        kind: classifyModelSource(modelSource),
        ruleBased: classifyModelSource(modelSource) === "rule-based",
        labModelsAvailable,
      };
    } else if (response.status === 429) {
      // Rate limiting is an HTTP response from the target host. Preserve
      // reachability, but keep provenance unknown so inference remains blocked.
      probe = {
        reachable: true,
        modelSource: null,
        heuristic: false,
        kind: "unknown",
        ruleBased: false,
        labModelsAvailable: false,
      };
    }
  } catch {
    probe = UNREACHABLE;
  } finally {
    clearTimeout(timer);
  }

  cache.set(url, { probe, at: now });
  return probe;
}

/** Clear the probe cache (used by tests). */
export function resetServiceProbeCache(): void {
  cache.clear();
}
