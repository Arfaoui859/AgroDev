/**
 * Guard: role dashboards must not render action buttons with no handler.
 *
 * The professional dashboards (agronomist, trader, veterinarian, inspector,
 * government, investor) cannot persist yet — their data source is not
 * connected — so their create/edit/export controls are wired to an honest
 * "not available yet" notice instead of doing nothing. A click that silently
 * does nothing reads as a broken product; these checks keep that from coming
 * back.
 *
 * A `<Button>` is considered wired when it carries `onClick`, is a submit
 * button, uses `asChild`, is `disabled`, or is wrapped in a Radix
 * `…Trigger asChild`.
 */
import fs from "node:fs";
import path from "node:path";

const PAGES = path.join(__dirname, "..", "..", "client", "pages");
const read = (name: string) => fs.readFileSync(path.join(PAGES, name), "utf8");

const DASHBOARDS = [
  "AgronomistDashboard.tsx",
  "TraderDashboard.tsx",
  "VeterinarianDashboard.tsx",
  "FieldInspectorDashboard.tsx",
  "GovernmentDashboard.tsx",
  "InvestorDashboard.tsx",
  "EnhancedAgronomistDashboard.tsx",
];

/** Brace-aware scan of `<Button …>` opening tags. */
function deadButtons(source: string): string[] {
  const out: string[] = [];
  const re = /<Button\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    let i = m.index;
    let depth = 0;
    let end = -1;
    for (; i < source.length; i++) {
      const ch = source[i];
      if (ch === "{") depth++;
      else if (ch === "}") depth--;
      else if (ch === ">" && depth === 0) {
        end = i;
        break;
      }
    }
    if (end === -1) continue;
    const tag = source.slice(m.index, end + 1);
    if (/onClick=|type=["']submit["']|asChild|disabled/.test(tag)) continue;
    const before = source.slice(Math.max(0, m.index - 160), m.index);
    if (/Trigger\s+asChild[^>]*>\s*$/.test(before)) continue;
    out.push(tag.replace(/\s+/g, " ").slice(0, 90));
  }
  return out;
}

describe("role dashboards have no handler-less action buttons", () => {
  for (const file of DASHBOARDS) {
    test(`${file} wires every action button`, () => {
      expect(deadButtons(read(file))).toEqual([]);
    });
  }
});

/**
 * The same guarantee applies to the operational pages reachable from the
 * sidebar. A control that renders but does nothing reads as a broken product;
 * these pages either wire the click to a real request or disable it with an
 * honest reason in `title`. Anything else fails this guard.
 */
const REACHABLE_PAGES = [
  "AdvancedLivestockDashboard.tsx",
  "AnimalHealthMonitoring.tsx",
  "IntelligentBreedingManager.tsx",
  "CropRotationPlanner.tsx",
  "EffectivenessReports.tsx",
  "LivestockDashboard.tsx",
];

describe("sidebar-reachable pages have no handler-less action buttons", () => {
  for (const file of REACHABLE_PAGES) {
    test(`${file} wires or honestly disables every action button`, () => {
      expect(deadButtons(read(file))).toEqual([]);
    });
  }
});
