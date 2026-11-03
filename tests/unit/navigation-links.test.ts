/**
 * Navigation link contract.
 *
 * Navigation menus and the home page's service cards link to routes with plain
 * string literals (`href: "/pest-control"`). Nothing connected those strings to
 * the `<Route>` table, so three AI service cards (/pest-control,
 * /irrigation-optimization, /weather-yield-planner) pointed at routes that did
 * not exist and silently fell through to the catch-all 404 page.
 *
 * This test extracts every in-app href literal and asserts each one resolves to
 * a route declared in client/components/AppRouter.tsx.
 */
import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "../..");
const CLIENT = path.join(ROOT, "client");

function walk(dir: string, exts: string[]): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, exts));
    else if (exts.some((e) => entry.name.endsWith(e))) out.push(full);
  }
  return out;
}

/** Collapse dynamic segments to a wildcard so `/crop/:id` matches `/crop/42`. */
function normalize(p: string): string {
  return (
    "/" +
    p
      .split("/")
      .filter(Boolean)
      .map((s) => (s.startsWith(":") || s === "*" ? "*" : s))
      .join("/")
  );
}

function declaredRoutes(): Set<string> {
  const src = fs.readFileSync(
    path.join(CLIENT, "components/AppRouter.tsx"),
    "utf8",
  );
  const routes = new Set<string>();
  for (const match of src.matchAll(/<Route\s+path="([^"]+)"/g)) {
    routes.add(normalize(match[1]));
  }
  return routes;
}

function navHrefs(): Map<string, string[]> {
  const hrefs = new Map<string, string[]>();
  for (const file of walk(CLIENT, [".tsx", ".ts"])) {
    // Skip the UI component library and the router itself.
    if (file.includes(`${path.sep}components${path.sep}ui${path.sep}`)) continue;
    if (file.endsWith("AppRouter.tsx")) continue;
    const src = fs.readFileSync(file, "utf8");
    for (const match of src.matchAll(/href[=:]\s*["'](\/[a-z0-9\-/:]*)["']/g)) {
      const href = match[1];
      const list = hrefs.get(href) ?? [];
      list.push(path.relative(ROOT, file));
      hrefs.set(href, list);
    }
  }
  return hrefs;
}

describe("🧭 In-app navigation links resolve to declared routes", () => {
  test("every href literal has a matching <Route>", () => {
    const routes = declaredRoutes();
    const missing: Record<string, string[]> = {};
    for (const [href, files] of navHrefs()) {
      if (!routes.has(normalize(href))) missing[href] = files;
    }
    expect(missing).toEqual({});
  });

  test("the AI service cards added for the microservice screens resolve", () => {
    const routes = declaredRoutes();
    for (const href of [
      "/pest-control",
      "/irrigation-optimization",
      "/weather-yield-planner",
    ]) {
      expect(routes.has(normalize(href))).toBe(true);
    }
  });
});
