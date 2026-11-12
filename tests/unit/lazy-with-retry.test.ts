/**
 * Stale-deploy chunk-load recovery.
 *
 * After a new deployment an open tab references old hashed chunk names; the
 * lazy import then fails and React shows the generic error boundary. The
 * recovery is a single guarded full reload. These tests pin that decision.
 */
import {
  isChunkLoadError,
  shouldReloadForChunkError,
} from "../../client/lib/lazyWithRetry";

describe("isChunkLoadError", () => {
  test.each([
    "Loading chunk 12 failed.",
    "Loading CSS chunk 3 failed.",
    "Failed to fetch dynamically imported module: https://x/assets/Index-abc.js",
    "Importing a module script failed.",
    "error loading dynamically imported module",
  ])("recognises %s", (message) => {
    expect(isChunkLoadError(new Error(message))).toBe(true);
  });

  test("does not treat an ordinary render error as a chunk error", () => {
    expect(isChunkLoadError(new Error("Cannot read properties of undefined"))).toBe(false);
  });

  test("handles non-Error values and nullish input", () => {
    expect(isChunkLoadError("Failed to fetch dynamically imported module")).toBe(true);
    expect(isChunkLoadError(null)).toBe(false);
    expect(isChunkLoadError(undefined)).toBe(false);
  });
});

describe("shouldReloadForChunkError", () => {
  test("reloads when there is no prior reload recorded", () => {
    expect(shouldReloadForChunkError(null, 1_000_000)).toBe(true);
  });

  test("suppresses a second reload inside the guard window", () => {
    expect(shouldReloadForChunkError(1_000_000, 1_005_000)).toBe(false);
  });

  test("allows a reload once the guard window has elapsed", () => {
    expect(shouldReloadForChunkError(1_000_000, 1_020_000)).toBe(true);
  });

  test("treats a corrupt stored value as no prior reload", () => {
    expect(shouldReloadForChunkError(Number.NaN, 1_000_000)).toBe(true);
  });
});
