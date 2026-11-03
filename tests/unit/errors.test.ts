/**
 * Error-response helpers.
 *
 * `safeErrorMessage` exists so a caught Supabase/Postgres/provider error never
 * reaches the client with its raw message. These tests pin that behaviour: the
 * fallback is returned for anything that has not explicitly opted in, and the
 * caller's shape is preserved.
 */
import { safeErrorMessage } from "../../server/lib/errors";

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
