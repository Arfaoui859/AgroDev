/**
 * Disclosure convention (AGENTS.md): a page that renders fixed, non-persisted
 * fixture records must disclose that with the shared `SimulatedDataNotice`
 * (or `DataProvenanceBanner`). Without it the fixtures read as real data.
 *
 * This guards the fix for DynamicPricing / QualityInventoryManagement /
 * WaterConservationAnalytics, which seeded hardcoded arrays behind a
 * "Simulate API call" comment and rendered them with no disclosure.
 */
import fs from "node:fs";
import path from "node:path";

const PAGES_DIR = path.join(__dirname, "..", "..", "client", "pages");

const FIXTURE_MARKERS = [
  /Simulate API call/i,
  /Mock data for demonstration/i,
  /simulated API/i,
];

describe("simulated-data pages disclose their fixtures", () => {
  const files = fs
    .readdirSync(PAGES_DIR)
    .filter((name) => name.endsWith(".tsx"));

  test.each(files)("%s", (name) => {
    const source = fs.readFileSync(path.join(PAGES_DIR, name), "utf8");
    const seedsFixtures = FIXTURE_MARKERS.some((re) => re.test(source));
    if (!seedsFixtures) return;
    expect(/SimulatedDataNotice|DataProvenanceBanner/.test(source)).toBe(true);
  });
});
