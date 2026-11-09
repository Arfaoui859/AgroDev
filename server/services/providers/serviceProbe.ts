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

export interface ServiceProbe {
  reachable: boolean;
  /** Model provenance declared by the service's own /health payload. */
  modelSource: string | null;
  /** True when the service reports it runs on synthetic/heuristic logic. */
  heuristic: boolean;
}

const TTL_MS = 30_000;
const cache = new Map<string, { probe: ServiceProbe; at: number }>();

const HEURISTIC_MARKERS =
  /heuristic|demo|simulat|synthetic|mock|random|placeholder|dummy/i;

const UNREACHABLE: ServiceProbe = {
  reachable: false,
  modelSource: null,
  heuristic: false,
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
      try {
        const body = (await response.json()) as Record<string, unknown>;
        const declared =
          body.model_source ?? body.modelSource ?? body.engine ?? body.mode;
        if (typeof declared === "string") modelSource = declared;
      } catch {
        // Non-JSON health body: reachable, provenance unknown.
      }
      probe = {
        reachable: true,
        modelSource,
        heuristic: modelSource !== null && HEURISTIC_MARKERS.test(modelSource),
      };
    } else if (response.status === 429) {
      // Rate limiting is an HTTP response from the target host. Preserve
      // reachability, but keep provenance unknown so inference remains blocked.
      probe = {
        reachable: true,
        modelSource: null,
        heuristic: false,
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
