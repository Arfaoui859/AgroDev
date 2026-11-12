/**
 * Error-response helpers.
 *
 * `safeErrorMessage` exists so a caught Supabase/Postgres/provider error never
 * reaches the client with its raw message. These tests pin that behaviour: the
 * fallback is returned for anything that has not explicitly opted in, and the
 * caller's shape is preserved.
 */
import { safeErrorMessage, sanitizeNetworkMessage } from "../../server/lib/errors";

describe("safeErrorMessage", () => {
  test("returns the fallback for a plain Error (internal detail suppressed)", () => {
    const err = new Error('relation "farmers" does not exist');
    expect(safeErrorMessage(err, "Failed to load data")).toBe("Failed to load data");
    expect(safeErrorMessage(err, "Failed to load data")).not.toContain("farmers");
  });

  test("returns the fallback for non-Error throwables", () => {
    expect(safeErrorMessage("boom", "Generic")).toBe("Generic");
    expect(safeErrorMessage(undefined, "Generic")).toBe("Generic");
    expect(safeErrorMessage({ status: 500 }, "Generic")).toBe("Generic");
  });

  test("surfaces the message only when the error opts in via expose=true", () => {
    const err = Object.assign(new Error("Database is not configured"), {
      expose: true,
      status: 503,
    });
    expect(safeErrorMessage(err, "Generic")).toBe("Database is not configured");
  });

  test("expose=true with a non-string message still falls back", () => {
    const err = { expose: true, message: 42 } as unknown;
    expect(safeErrorMessage(err, "Generic")).toBe("Generic");
  });

  test("a default fallback is always provided", () => {
    expect(safeErrorMessage(new Error("secret"))).toBe("Internal error");
  });
});

describe("sanitizeNetworkMessage", () => {
  test("collapses DNS/refused failures to a coarse category", () => {
    expect(sanitizeNetworkMessage("getaddrinfo ENOTFOUND ai-soil-analysis.internal")).toBe(
      "dns_resolution_failed",
    );
    expect(sanitizeNetworkMessage("connect ECONNREFUSED 10.0.0.7:8001")).toBe(
      "connection_refused",
    );
    expect(sanitizeNetworkMessage("socket hang up ECONNRESET")).toBe("connection_reset");
    expect(sanitizeNetworkMessage("timeout of 45000ms exceeded ETIMEDOUT")).toBe("timeout");
  });

  test("scrubs URLs, IPv4 addresses and private hostnames", () => {
    const out = sanitizeNetworkMessage(
      "request to http://172.28.0.1:11434/v1 failed near 10.1.2.3 and api.svc.onrender.com:8004",
    );
    expect(out).not.toContain("172.28.0.1");
    expect(out).not.toContain("10.1.2.3");
    expect(out).not.toContain("onrender.com");
    expect(out).toContain("<redacted-url>");
  });

  test("leaves a benign message untouched", () => {
    expect(sanitizeNetworkMessage("service returned an invalid payload")).toBe(
      "service returned an invalid payload",
    );
  });
});
