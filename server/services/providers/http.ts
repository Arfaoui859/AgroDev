/**
 * Shared HTTP helpers for external provider calls.
 *
 * All provider integrations must use these helpers so that timeouts, retries and
 * error normalisation behave consistently. Provider failures must surface as
 * explicit errors (never as fabricated data).
 */

export class ProviderError extends Error {
  readonly provider: string;
  readonly status?: number;
  readonly kind: "timeout" | "network" | "http" | "parse" | "unconfigured";
  /** Whether the caller should retry. Only transient failures are retryable. */
  readonly retryable: boolean;

  constructor(
    provider: string,
    kind: ProviderError["kind"],
    message: string,
    status?: number,
    retryable = kind === "timeout" || kind === "network",
  ) {
    super(message);
    this.name = "ProviderError";
    this.provider = provider;
    this.kind = kind;
    this.status = status;
    this.retryable = retryable;
  }
}

export interface FetchOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
  provider?: string;
}

const DEFAULT_TIMEOUT_MS = 12_000;
const DEFAULT_RETRIES = 2;
const DEFAULT_RETRY_DELAY_MS = 400;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch JSON with timeout + bounded retries. Retries only on transient failures
 * (network errors, 429 and 5xx). 4xx responses fail fast.
 */
export async function fetchJson<T = unknown>(
  url: string,
  options: FetchOptions = {},
): Promise<T> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = DEFAULT_RETRIES,
    retryDelayMs = DEFAULT_RETRY_DELAY_MS,
    provider = "external",
    ...init
  } = options;

  let lastError: ProviderError | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timer);

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        const isTransient = response.status === 429 || response.status >= 500;
        throw new ProviderError(
          provider,
          "http",
          `${provider} responded with HTTP ${response.status}${body ? `: ${body.slice(0, 200)}` : ""}`,
          response.status,
          isTransient,
        );
      }

      try {
        return (await response.json()) as T;
      } catch {
        throw new ProviderError(
          provider,
          "parse",
          `${provider} returned a non-JSON response`,
        );
      }
    } catch (error) {
      clearTimeout(timer);

      if (error instanceof ProviderError) {
        // Parse and unconfigured errors are terminal; non-transient HTTP too.
        if (error.kind === "parse" || error.kind === "unconfigured" || !error.retryable) {
          throw error;
        }
        lastError = error;
      } else if ((error as Error)?.name === "AbortError") {
        lastError = new ProviderError(
          provider,
          "timeout",
          `${provider} request timed out after ${timeoutMs}ms`,
        );
      } else {
        lastError = new ProviderError(
          provider,
          "network",
          `${provider} request failed: ${(error as Error)?.message ?? "unknown error"}`,
        );
      }

      if (attempt === retries) throw lastError;
    }

    await sleep(retryDelayMs * (attempt + 1));
  }

  throw lastError ?? new ProviderError(provider, "network", `${provider} failed`);
}

/** Round a numeric value to a fixed number of decimals without throwing on non-numbers. */
export function round(value: unknown, decimals = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}
