/**
 * Regression: the Cloud Services Status page misread the backend health
 * snapshot in two ways that made every service look unavailable:
 *
 *  1. It probed the microservice hosts directly from the browser via
 *     `VITE_*` URLs (`checkAllServicesHealth`). Those variables are unset in
 *     production, so the client fell back to an empty string and every probe
 *     failed — the dashboard showed "0 of 5" regardless of real availability.
 *     The page must instead consume the backend's provenance-aware
 *     `/api/ai/health` snapshot (`checkAIServicesHealth`).
 *
 *  2. The "Main API Health" card iterated `Object.entries(aiHealthStatus)` and
 *     treated each top-level key of the rich snapshot (`overview`, `services`,
 *     `llm`, ...) as a service named "healthy/unavailable". It must read the
 *     documented `overview` / `services` / `llm` fields.
 */
import fs from "node:fs";
import path from "node:path";

const PAGE = path.join(
  __dirname,
  "..",
  "..",
  "client",
  "pages",
  "CloudServicesStatus.tsx",
);

const source = fs.readFileSync(PAGE, "utf8");

describe("CloudServicesStatus consumes the backend health snapshot", () => {
  test("does not probe microservice hosts directly from the browser", () => {
    expect(source).not.toMatch(/checkAllServicesHealth/);
  });

  test("uses the provenance-aware backend health check", () => {
    expect(source).toMatch(/checkAIServicesHealth/);
  });

  test("reads the documented snapshot fields instead of object keys", () => {
    expect(source).toMatch(/aiHealthStatus\?\.overview/);
    expect(source).toMatch(/overview\.totalServices/);
    expect(source).toMatch(/overview\.availableServices/);
    expect(source).toMatch(/overview\.rateLimitedServices/);
    // The per-service array comes from the snapshot body.
    expect(source).toMatch(/Array\.isArray\(aiHealth\.services\)/);
    // The old bug iterated Object.entries on the whole snapshot.
    expect(source).not.toMatch(/Object\.entries\(aiHealthStatus\)/);
  });

  test("never presents a rate-limited or unconfigured service as available", () => {
    // Availability must be derived from the exact `available` status.
    expect(source).toMatch(/s\.status === "available"/);
    expect(source).toMatch(/rate_limited/);
    expect(source).toMatch(/not_configured/);
  });
});
