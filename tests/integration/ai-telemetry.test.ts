/**
 * AI capability status taxonomy tests.
 *
 * The monitor must never present a rule-based engine as a live model, and must
 * distinguish "configured" from "verified working". These tests pin the state
 * machine that decides which label a capability gets.
 */
import {
  capabilityStatus,
  categoriseError,
  recordFailure,
  recordSuccess,
  resetTelemetry,
} from "../../server/services/providers/aiTelemetry";
import { ProviderError } from "../../server/services/providers/http";

beforeEach(() => resetTelemetry());

describe("🏷️ capabilityStatus", () => {
  test("no config and no engine => NOT_CONFIGURED", () => {
    expect(capabilityStatus("x", false, false, false).status).toBe("NOT_CONFIGURED");
  });

  test("rule engine only => FALLBACK (never LIVE_VERIFIED)", () => {
    expect(capabilityStatus("x", false, true, false).status).toBe("FALLBACK");
  });

  test("configured but never exercised => CONFIGURED", () => {
    expect(capabilityStatus("x", true, true, true).status).toBe("CONFIGURED");
  });

  test("a real successful call => LIVE_VERIFIED", () => {
    recordSuccess("x", "openai:gpt-4o-mini", true, 120);
    const s = capabilityStatus("x", true, true, true);
    expect(s.status).toBe("LIVE_VERIFIED");
    expect(s.lastLatencyMs).toBe(120);
    expect(s.lastError).toBeNull();
  });

  test("a success on a rule engine stays FALLBACK, not LIVE_VERIFIED", () => {
    recordSuccess("x", "rule-based-engine", false, 5);
    expect(capabilityStatus("x", true, true, true).status).toBe("FALLBACK");
  });

  test("a failure after configuration => DEGRADED with a category", () => {
    recordFailure("x", "llm", new ProviderError("llm", "http", "boom", 429));
    const s = capabilityStatus("x", true, true, true);
    expect(s.status).toBe("DEGRADED");
    expect(s.lastError).toBe("rate_limit");
  });

  test("configured but engine unavailable => UNAVAILABLE", () => {
    expect(capabilityStatus("x", true, false, true).status).toBe("UNAVAILABLE");
  });
});

describe("🔎 categoriseError", () => {
  test.each([
    [new ProviderError("llm", "unconfigured", "x"), "unconfigured"],
    [new ProviderError("llm", "timeout", "x"), "timeout"],
    [new ProviderError("llm", "network", "x"), "network"],
    [new ProviderError("llm", "parse", "x"), "parse"],
    [new ProviderError("llm", "http", "x", 401), "auth"],
    [new ProviderError("llm", "http", "x", 403), "auth"],
    [new ProviderError("llm", "http", "x", 429), "rate_limit"],
    [new ProviderError("llm", "http", "x", 503), "upstream"],
  ])("maps %# to the right category", (error, expected) => {
    expect(categoriseError(error)).toBe(expected);
  });

  test("an unknown error is not mislabelled as auth", () => {
    expect(categoriseError(new Error("nope"))).toBe("unknown");
  });
});
