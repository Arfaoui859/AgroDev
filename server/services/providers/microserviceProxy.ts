/**
 * Proxy helpers for the self-hosted Python AI microservices.
 *
 * Several Express routers used to return hand-written mock payloads while a real
 * microservice for the same capability was already running (pest-control,
 * irrigation-optimization, weather-yield). That made the API look functional
 * while the actual model never ran. These helpers forward the request to the
 * real service and tag the response with the provenance the service declares,
 * so a caller can tell model output from a heuristic fallback.
 */

import type { Response } from "express";
import { ProviderError } from "./http";
import { sanitizeNetworkMessage } from "../../lib/errors";
import { probeService } from "./serviceProbe";
import { recordSuccess, recordFailure } from "./aiTelemetry";

const DEFAULT_TIMEOUT_MS = 45_000;
const DEFAULT_RETRIES = 1;

/** Resolve a microservice base URL, tolerating host:port values without a scheme. */
export function serviceBaseUrl(raw: string | undefined, fallback: string): string {
  const value = (raw && raw.trim()) || fallback;
  const withScheme = /^https?:\/\//i.test(value) ? value : `http://${value}`;
  return withScheme.replace(/\/+$/, "");
}

export interface MicroserviceCallOptions {
  /** Base URL of the microservice. */
  baseUrl: string;
  /** Path on the microservice, e.g. "/analyze-pest-problem". */
  path: string;
  /** Capability id used for telemetry (matches ai-capabilities ids). */
  capability: string;
  method?: "GET" | "POST";
  body?: unknown;
  timeoutMs?: number;
  retries?: number;
}

export interface MicroserviceResult<T = any> {
  /** The service's own JSON body, unwrapped from its {success, data} envelope. */
  data: T;
  /** Raw body as returned by the service (kept for endpoints that need it). */
  raw: any;
  /** Model provenance declared by the service's /health, if any. */
  modelSource: string | null;
  /** True when the service self-reports synthetic/heuristic output. */
  heuristic: boolean;
}

/**
 * Call a microservice endpoint with timeout + bounded retries. Throws a
 * `ProviderError` on failure — never returns fabricated data.
 */
export async function callMicroservice<T = any>(
  options: MicroserviceCallOptions,
): Promise<MicroserviceResult<T>> {
  const {
    baseUrl,
    path,
    capability,
    method = "POST",
    body,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = DEFAULT_RETRIES,
  } = options;

  const url = `${baseUrl}${path}`;
  let lastError: ProviderError | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const startedAt = Date.now();
    try {
      // Verify the service's declared model provenance BEFORE sending any
      // inference request. A reachable demo/heuristic service must not receive
      // or process production user data through this proxy.
      const probe = await probeService(baseUrl);
      if (!probe.reachable || !probe.modelSource || probe.heuristic) {
        // An unreachable host is a transport failure; a reachable host whose
        // provenance is synthetic/missing is a policy rejection. They are
        // reported with different error kinds so callers can tell them apart.
        const kind: ProviderError["kind"] = !probe.reachable ? "network" : "provenance";
        const reason = !probe.reachable
          ? "Microservice health/provenance could not be verified."
          : probe.heuristic
            ? "Synthetic or heuristic microservice output is disabled for production responses."
            : "Microservice did not declare a model source.";
        const provenanceError = new ProviderError(
          capability,
          kind,
          reason,
          503,
          false,
        );
        recordFailure(capability, probe.modelSource ?? "unknown", provenanceError, Date.now() - startedAt);
        throw provenanceError;
      }

      const response = await fetch(url, {
        method,
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        ...(body !== undefined && method !== "GET"
          ? { body: JSON.stringify(body) }
          : {}),
      });
      clearTimeout(timer);

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new ProviderError(
          capability,
          "http",
          `${capability} responded with HTTP ${response.status}${text ? `: ${text.slice(0, 200)}` : ""}`,
          response.status,
          response.status === 429 || response.status >= 500,
        );
      }

      const raw = (await response.json()) as any;
      recordSuccess(capability, probe.modelSource, true, Date.now() - startedAt);

      return {
        data: (raw && typeof raw === "object" && "data" in raw ? raw.data : raw) as T,
        raw,
        modelSource: probe.modelSource,
        heuristic: probe.heuristic,
      };
    } catch (error) {
      clearTimeout(timer);
      if (error instanceof ProviderError && !error.retryable) throw error;
      if (error instanceof ProviderError) {
        lastError = error;
      } else if ((error as Error)?.name === "AbortError") {
        lastError = new ProviderError(
          capability,
          "timeout",
          `${capability} request timed out after ${timeoutMs}ms`,
        );
      } else {
        lastError = new ProviderError(
          capability,
          "network",
          `${capability} request failed: ${sanitizeNetworkMessage((error as Error)?.message ?? "unknown error")}`,
        );
      }
      if (attempt === retries) {
        recordFailure(capability, "microservice", lastError, Date.now() - startedAt);
        throw lastError;
      }
    }
  }

  throw lastError ?? new ProviderError(capability, "network", `${capability} failed`);
}

/**
 * Send a microservice result to the client, tagging provenance so a heuristic
 * answer is never presented as model inference.
 */
export function respondWithProvenance(
  res: Response,
  result: Pick<MicroserviceResult, "data" | "modelSource" | "heuristic">,
  status = 200,
): void {
  const data = result.data;
  const provenance = {
    dataSource: result.heuristic ? "heuristic" : "microservice",
    isRealData: !result.heuristic,
    modelSource: result.modelSource,
  };
  const payload =
    data && typeof data === "object" && !Array.isArray(data)
      ? { ...provenance, ...data }
      : { ...provenance, result: data };
  res.status(status).json(payload);
}

/** Map a microservice failure to an honest HTTP error (never fake success). */
export function respondServiceError(
  res: Response,
  capability: string,
  error: unknown,
): void {
  if (error instanceof ProviderError) {
    const status = error.kind === "timeout" ? 504 : error.kind === "network" ? 503 : error.status ?? 502;
    if (error.kind === "provenance") {
      // The service answered but its model provenance was rejected. Return a
      // structured envelope so callers can distinguish "disabled" from "down".
      res.status(status).json({
        success: false,
        data: null,
        code: "MODEL_PROVENANCE_UNVERIFIED",
        error: `${capability} unavailable`,
        message: error.message,
        status,
      });
      return;
    }
    // Transport/service failure: no `success` flag and no `data` field, so a
    // caller can never mistake an unreachable service for a fabricated success.
    res.status(status).json({
      error: `${capability} unavailable`,
      message: error.message,
      status,
    });
    return;
  }
  res.status(500).json({
    error: "Internal server error",
    message: (error as Error)?.message ?? "unknown error",
    status: 500,
  });
}
