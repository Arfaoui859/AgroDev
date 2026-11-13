/**
 * Regression: a professional dashboard must never crash into the global error
 * boundary when its data source is not connected.
 *
 * The role routers (agronomist, trader, veterinarian, inspector, …) honestly
 * answer HTTP 503 with `data: null`. The dashboards previously did
 * `setFarms(response.data)` and then ran `.filter()`/`.map()` on those lists
 * *before* the null guard, which threw and rendered the generic
 * "unexpected error" page. These checks pin the fix: list state is coerced
 * through `asArray`, the honest reason is detected, and the null branch shows
 * the localized `DataUnavailableNotice` instead of a red "failed to load".
 */
import fs from "node:fs";
import path from "node:path";
import { asArray, detectUnavailable } from "../../client/lib/dashboardData";

const ROOT = path.join(__dirname, "..", "..");
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8");

const DASHBOARDS = [
  "client/pages/AgronomistDashboard.tsx",
  "client/pages/TraderDashboard.tsx",
  "client/pages/VeterinarianDashboard.tsx",
  "client/pages/FieldInspectorDashboard.tsx",
];

describe("professional dashboards fail safely when the data source is absent", () => {
  test("asArray coerces null/undefined into an iterable list", () => {
    expect(asArray(null)).toEqual([]);
    expect(asArray(undefined)).toEqual([]);
    expect(asArray({})).toEqual([]);
    expect(asArray([1, 2])).toEqual([1, 2]);
  });

  test("detectUnavailable recognises the server's honest 503 envelope", () => {
    const info = detectUnavailable([
      { success: false, code: "DASHBOARD_DATA_SOURCE_NOT_CONNECTED", message: "not connected" },
    ]);
    expect(info).not.toBeNull();
    expect(info?.code).toBe("DASHBOARD_DATA_SOURCE_NOT_CONNECTED");
    expect(detectUnavailable([{ ok: true }, [1, 2]])).toBeNull();
  });

  for (const file of DASHBOARDS) {
    test(`${path.basename(file)} guards every list with asArray`, () => {
      const src = read(file);
      // List state must be assigned through asArray, never a raw `.data`.
      expect(src).toMatch(/set[A-Z][A-Za-z]*\(asArray/);
      // No bare `setX(response.data)` assignment remains for a list.
      expect(src).not.toMatch(/set[A-Z][A-Za-z]*\([A-Za-z]+Data\.data\)/);
      // The honest notice replaces the misleading red error card.
      expect(src).toContain("DataUnavailableNotice");
    });
  }
});

/**
 * The livestock screens read `{ success, data }` envelopes from
 * `/api/livestock-management/*`. `listAnimals` returns an array on success, but
 * the shape is only guaranteed by convention — a null `data` (e.g. a partially
 * applied migration) must degrade to an empty list, not crash the `.filter()`
 * that runs on the very next line.
 */
const LIST_ENVELOPE_PAGES = [
  "client/pages/LivestockDashboard.tsx",
  "client/pages/AnimalHealthMonitoring.tsx",
  "client/pages/TreatmentRecommendations.tsx",
];

describe("list-envelope screens never store a null list", () => {
  for (const file of LIST_ENVELOPE_PAGES) {
    test(`${path.basename(file)} coerces envelope data through asArray`, () => {
      const src = read(file);
      expect(src).toContain("asArray");
      expect(src).not.toMatch(/set[A-Z][A-Za-z]*\(\s*[A-Za-z]*[Dd]ata\.data\s*\)/);
    });
  }
});

/**
 * Regression: `AdvancedLivestockDashboard` gated every fetch on
 * `data.provenance?.verified === true`, but the livestock routes answer with
 * `provenance: { source, persisted: true }` — the `verified` field was never
 * emitted. The gate therefore always failed and the page rendered a permanent
 * "data unavailable" panel even when the caller had real, persisted records.
 * It also consumed a synthetic demo shape (`summary.avgHealthScore`,
 * `speciesDistribution`, `productionHistory`) the backend never produced.
 *
 * The page must read the real `{ success, data }` envelope, coerce lists
 * through `asArray`, and never depend on a provenance field the API does not
 * send.
 */
describe("AdvancedLivestockDashboard reads the real livestock envelope", () => {
  const src = read("client/pages/AdvancedLivestockDashboard.tsx");

  test("does not gate on a provenance.verified field the API never returns", () => {
    expect(src).not.toMatch(/provenance\?\.verified/);
    expect(src).not.toMatch(/provenance\.verified/);
  });

  test("coerces list envelopes through asArray", () => {
    expect(src).toContain("asArray");
    expect(src).not.toMatch(/set[A-Z][A-Za-z]*\(\s*[A-Za-z]*[Dd]ata\.data\s*\)/);
  });

  test("consumes the real aggregate fields, not the removed synthetic shape", () => {
    expect(src).toContain("bySpecies");
    expect(src).toContain("byHealthStatus");
    expect(src).not.toContain("avgHealthScore");
    expect(src).not.toContain("productionHistory");
  });

  test("the add-animal control posts to the real tenant-scoped route", () => {
    expect(src).toContain("/api/livestock-management/animals");
  });
});
