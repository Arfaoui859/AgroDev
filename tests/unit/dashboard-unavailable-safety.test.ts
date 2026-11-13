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

/**
 * Regression: `MarketAnalyticsWidget` fetched `/api/market-analysis/dashboard`,
 * which has no licensed feed connected and therefore answers 503 with an
 * explicit `MARKET_SOURCE_NOT_CONNECTED` code and `data: null`. The widget
 * ignored `response.ok` and defaulted every field to a plausible-looking
 * constant (`+2.3%`, `الزيتون +15%`, volume `12500`), so the UI displayed
 * fabricated market figures with only a faint "simulation" note.
 *
 * The widget must fail closed on a non-OK response and never substitute
 * invented prices, trends or volumes.
 */
describe("MarketAnalyticsWidget fails closed on an unavailable feed", () => {
  const src = read("client/components/MarketAnalyticsWidget.tsx");

  test("checks response.ok before trusting the body", () => {
    expect(src).toContain("!response.ok");
  });

  test("does not hard-code fabricated market figures", () => {
    expect(src).not.toContain('"+2.3%"');
    expect(src).not.toContain('"الزيتون"');
    expect(src).not.toContain("12500");
    expect(src).not.toContain("850000");
    expect(src).not.toMatch(/topPerformer:\s*data\.topPerformers\?\.\[0\]\s*\|\|/);
  });

  test("renders missing values as an explicit placeholder, not a default", () => {
    expect(src).toContain("dash(");
    expect(src).toContain("?? \"—\"");
  });
});

/**
 * Regression: `ComprehensiveOverviewCards` mapped the `/api/farm-management/overview`
 * response as if it were a `{ land, crops, livestock, financial }` shape with
 * flat numeric fields. The endpoint actually returns `{ summary, farms, crops,
 * market, financial, unavailable }`, so *every* field silently fell through to
 * a hard-coded illustrative default (`totalArea || 25.5`, `totalYield || 1247`,
 * `totalAnimals || 245`, `totalRevenue || 156780`, …). The farmer's overview
 * therefore displayed a fully fabricated farm — a direct violation of the
 * "never present synthetic output as observed data" rule.
 *
 * The component must read the real contract, render only what the endpoints
 * return, and show an explicit empty/unavailable state per domain otherwise.
 */
describe("ComprehensiveOverviewCards never fabricates a farm overview", () => {
  const src = read("client/components/ComprehensiveOverviewCards.tsx");

  test("does not hard-code illustrative farm figures", () => {
    for (const literal of [
      "25.5", "22.3", "1247", "156780", "98450", "58330",
      "245", "1850", "2400", "118",
    ]) {
      expect(src).not.toContain(literal);
    }
    // `6.8` also appears inside the Tunis coordinate (36.8065); assert it is
    // never used as a fallback default specifically.
    expect(src).not.toMatch(/\|\|\s*6\.8\b/);
  });

  test("does not substitute defaults with || on data reads", () => {
    expect(src).not.toMatch(/farmData\?\.\w+\s*\|\|/);
    expect(src).not.toMatch(/livestockData\?\.\w+\s*\|\|/);
    expect(src).not.toMatch(/financialData\?\.\w+\s*\|\|/);
  });

  test("reads the real summary/aggregate contract", () => {
    expect(src).toContain("summary.totalFarms");
    expect(src).toContain("summary.activeCrops");
    expect(src).toContain("bySpecies");
    expect(src).toContain("netProfit");
  });

  test("checks response.ok before trusting a body", () => {
    expect(src).toContain("res.ok");
  });
});

/**
 * Regression: `EnhancedMarketDashboard` stored the raw `/api/market-analysis/*`
 * JSON body straight into list state. That route answers 503 with
 * `{ success: false, data: null }` (no licensed feed), so `marketPrices` became
 * an object and the first render calling `marketPrices.filter(...)` threw,
 * producing the generic "unexpected error" page. It must guard `response.ok`
 * and only accept array bodies.
 */
describe("EnhancedMarketDashboard never stores a non-array list", () => {
  const src = read("client/pages/EnhancedMarketDashboard.tsx");

  test("validates array bodies before storing list state", () => {
    expect(src).toContain("Array.isArray(prices) ? prices : []");
    expect(src).toContain("Array.isArray(alerts) ? alerts : []");
    expect(src).toContain("Array.isArray(data?.data) ? data.data : []");
  });

  test("gates the dashboard object on a real marketSummary", () => {
    expect(src).toContain("dashboard?.marketSummary ? dashboard : null");
  });
});

/**
 * Regression: `Index` mapped the farm overview as flat fields
 * (`totalFields`, `soilHealthAvg`, `profitMargin`, `waterEfficiency`) that the
 * endpoint never returns, and defaulted weather to plausible constants
 * (`|| 24`, `|| 65`, `|| 25`). It must read `summary.*` and render "—" for a
 * missing observation.
 */
describe("Index reads the real farm/weather contract without defaults", () => {
  const src = read("client/pages/Index.tsx");

  test("reads the real summary shape", () => {
    expect(src).toContain("farmOverview.summary.totalFarms");
    expect(src).toContain("farmOverview.summary.totalFields");
  });

  test("does not default weather to illustrative constants", () => {
    expect(src).not.toMatch(/weather\.current\?\.\w+\s*\|\|\s*\d/);
    expect(src).not.toMatch(/day\.maxTemp\s*\|\|\s*\d/);
  });

  test("uses the real Open-Meteo keys", () => {
    expect(src).toContain("current.description");
    expect(src).toContain("current.windSpeed");
  });
});

/**
 * Regression: `SmartAdvisor` (a page whose data route is retired and returns
 * 410) still rendered invented farm context — a Riyadh location, a 100 ha farm,
 * sandy soil, drip irrigation — and a hard-coded 3-item weather-alert list.
 * It must show an empty placeholder instead of plausible-looking values.
 */
describe("SmartAdvisor does not fabricate farm context", () => {
  const src = read("client/pages/SmartAdvisor.tsx");

  test("has no invented location/size/soil/irrigation defaults", () => {
    expect(src).not.toContain('الرياض');
    expect(src).not.toContain("farm_size || 100");
    expect(src).not.toContain("soil_type || 'sandy'");
    expect(src).not.toContain("irrigation_system || 'drip'");
  });

  test("does not render a hard-coded alert list", () => {
    expect(src).not.toContain('موجة حارة متوقعة الأسبوع القادم');
  });
});

/**
 * Regression: the account menu fell back to a made-up email
 * ("user@agrogrowth.com") for an unauthenticated/unknown user. It must render
 * a neutral placeholder rather than a fabricated identity.
 */
describe("EnhancedLayout does not fabricate an account email", () => {
  const src = read("client/components/EnhancedLayout.tsx");

  test("uses a neutral placeholder for a missing email", () => {
    expect(src).not.toContain("user@agrogrowth.com");
  });
});

/**
 * Regression: `EffectivenessReports` pre-filled the before/after plant-health
 * inputs with 50/70 and coerced an empty field back to those values
 * (`parseInt(...) || 50`), so a report could be submitted with scores the
 * farmer never entered. The scores must start null and stay null until typed.
 */
describe("EffectivenessReports never invents plant-health scores", () => {
  const src = read("client/pages/EffectivenessReports.tsx");

  test("starts the scores empty and does not coerce to a constant", () => {
    expect(src).not.toContain("beforeHealthScore: 50");
    expect(src).not.toContain("afterHealthScore: 70");
    expect(src).not.toMatch(/beforeHealthScore:\s*parseInt\([^)]*\)\s*\|\|\s*50/);
    expect(src).not.toMatch(/afterHealthScore:\s*parseInt\([^)]*\)\s*\|\|\s*70/);
  });

  test("blocks submission while a score is missing", () => {
    expect(src).toContain("newReport.beforeHealthScore == null");
    expect(src).toContain("newReport.afterHealthScore == null");
  });
});

/**
 * Regression: `FinancialDashboard` rendered `money(summary?.totalX || 0)`, so an
 * unavailable/erroring summary was shown as a real "0.000 TND" balance instead
 * of an honest "not available". A null summary must render the placeholder.
 */
describe("FinancialDashboard fails closed on a missing summary", () => {
  const src = read("client/pages/FinancialDashboard.tsx");

  test("does not coerce a missing summary to zero", () => {
    expect(src).not.toMatch(/money\(summary\?\.\w+\s*\|\|\s*0\)/);
    expect(src).toContain('summary?money(summary.totalExpenses):"—"');
    expect(src).toContain('summary?money(summary.netProfit):"—"');
  });
});
