/**
 * Guard: every role must have a usable sidebar.
 *
 * `investor` is a declared role (see `client/lib/roleDashboard.ts`) with its own
 * dashboard route, but it appeared in no `navigationCategories.allowedRoles`,
 * so an investor signed in to an empty sidebar with no way to reach their own
 * dashboard or the agricultural news. These checks pin role coverage for the
 * two universal entries: the role dashboard and the Agricultural News feed.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(__dirname, "..", "..");
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8");

const ROLES = [
  "farmer",
  "agronomist",
  "trader",
  "veterinarian",
  "inspector",
  "admin",
  "government",
  "investor",
];

/** Extract the `allowedRoles` array of the category whose `name` matches. */
function categoryRoles(src: string, name: string): string[] {
  const re = new RegExp(
    `name:\\s*"${name}"[\\s\\S]*?allowedRoles:\\s*\\[([^\\]]*)\\]`,
  );
  const match = src.match(re);
  if (!match) throw new Error(`category not found: ${name}`);
  return match[1]
    .split(",")
    .map((r) => r.trim().replace(/["']/g, ""))
    .filter(Boolean);
}

describe("role coverage in the sidebar navigation", () => {
  const layout = read("client/components/Layout.tsx");

  test("the Dashboards category is available to every role", () => {
    const roles = categoryRoles(layout, "Dashboards");
    for (const role of ROLES) {
      expect(roles).toContain(role);
    }
  });

  test("Agricultural News is a top-level entry available to every role", () => {
    // The dedicated category that hosts /news.
    const roles = categoryRoles(layout, "News & Info");
    for (const role of ROLES) {
      expect(roles).toContain(role);
    }
    // …and it actually links to the real news page.
    expect(layout).toMatch(/href:\s*"\/news"/);
  });

  test("every role has a dashboard remap entry in the sidebar", () => {
    // The Dashboards category rewrites its single item to the signed-in role's
    // dashboard. A role missing from `dashboardByRole` silently falls back to
    // the farmer dashboard, sending e.g. an investor to the wrong workspace.
    const block = layout.match(/dashboardByRole[\s\S]*?\};/)?.[0] ?? "";
    for (const role of ROLES) {
      expect(block).toContain(`${role}:`);
    }
    expect(block).toContain('"/investor-dashboard"');
  });

  test("the /news route is declared", () => {
    expect(read("client/components/AppRouter.tsx")).toContain('path="/news"');
  });
});
