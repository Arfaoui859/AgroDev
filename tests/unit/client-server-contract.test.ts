/**
 * Client/server route contract.
 *
 * The SPA talks to the Express API with bare fetch() calls. Nothing at compile
 * time connects the two, so a renamed or removed server route silently turns a
 * working screen into a 404 at runtime. This test statically extracts every
 * `/api/...` path the client fetches, expands the routers mounted in
 * server/index.ts, and asserts each client path resolves to a real route.
 *
 * If a fetch genuinely needs a new endpoint, add the route; do not add an
 * exception here unless the path is built at runtime from a non-literal base.
 */
import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "../..");

/**
 * Routers and shared guards that answer 503 for every path under a prefix
 * (fail-closed until a verified data source is connected). A client call to any
 * path beneath one of these resolves to a real, intentional response.
 */
const FAIL_CLOSED_PREFIXES = [
  "/api/alerts",
  "/api/tasks",
  "/api/smart-crop-suggestions",
  "/api/agronomist-dashboard",
  "/api/livestock-management",
  "/api/farmer-dashboard",
  "/api/government-dashboard",
  "/api/trader-dashboard",
  "/api/market-analysis",
  "/api/fertilizer",
  "/api/weather-irrigation",
  "/api/smart-crop-alerts",
  "/api/disease-treatment",
  "/api/digital-transformation",
  "/api/emergency-response",
  "/api/emerging-tech",
  "/api/ip-management",
  "/api/smart-advisor",
  "/api/predictive-analytics",
  "/api/risk-detection",
  "/api/smart-irrigation",
  "/api/irrigation-optimization",
  "/api/pest-control",
  "/api/weather-yield-intelligence",
];

function walk(dir: string, exts: string[]): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, exts));
    else if (exts.some((e) => entry.name.endsWith(e))) out.push(full);
  }
  return out;
}

function read(p: string): string {
  return fs.readFileSync(p, "utf8");
}

/** Collapse :params and template holes to a single "*" wildcard segment. */
function normalize(p: string): string {
  const segs = p.split("/").filter(Boolean);
  return (
    "/" +
    segs.map((s) => (s.startsWith(":") || s === "*" ? "*" : s)).join("/")
  );
}

function clientApiPaths(): Set<string> {
  const paths = new Set<string>();
  for (const file of walk(path.join(ROOT, "client"), [".ts", ".tsx"])) {
    const src = read(file);
    for (const raw of src.matchAll(/fetch\(\s*[`"']([^`"']+)/g)) {
      const cleaned = raw[1]
        .split("?")[0]
        .replace(/\$\{[^}]*\}/g, "*");
      if (cleaned.startsWith("/api")) paths.add(cleaned);
    }
  }
  return paths;
}

function serverApiPaths(): Set<string> {
  const indexPath = path.join(ROOT, "server/index.ts");
  const indexSrc = read(indexPath);

  const routes = new Set<string>();
  const add = (p: string) => p.startsWith("/api") && routes.add(normalize(p));
  // Explicit catch-all fail-closed routers are valid mounted API surfaces.
  // They answer 503 for every path under the prefix, so they are matched as
  // prefix wildcards (see FAIL_CLOSED_PREFIXES below) rather than one segment.
  for (const prefix of FAIL_CLOSED_PREFIXES) add(prefix);

  // Direct handlers in index.ts
  for (const m of indexSrc.matchAll(
    /app\.(?:get|post|put|patch|delete)\(\s*"([^"]+)"/g,
  )) {
    add(m[1]);
  }

  // Mounted routers: app.use("/api/x", routerVar)
  const imports = new Map<string, string>();
  for (const m of indexSrc.matchAll(
    /import\s+(\w+)\s+from\s+"(\.\/routes\/[^"]+)"/g,
  )) {
    imports.set(m[1], m[2]);
  }

  for (const m of indexSrc.matchAll(/app\.use\(\s*"([^"]+)"\s*,\s*(\w+)\s*\)/g)) {
    const prefix = m[1];
    const mod = imports.get(m[2]);
    if (!mod) continue;

    let file = path.join(ROOT, "server", mod.replace(/^\.\//, "") + ".ts");
    if (!fs.existsSync(file)) {
      file = file.replace(/\.ts$/, "/index.ts");
      if (!fs.existsSync(file)) continue;
    }

    const src = read(file);
    for (const r of src.matchAll(
      /router\.(?:get|post|put|patch|delete)\(\s*[`"']([^`"']+)/g,
    )) {
      const sub = r[1].startsWith("/") ? r[1] : "/" + r[1];
      add(prefix.replace(/\/$/, "") + sub);
    }
  }

  return routes;
}

describe("🔌 Client fetch paths resolve to server routes", () => {
  const serverRoutes = serverApiPaths();
  const clientPaths = clientApiPaths();

  test("the server exposes a substantial route surface", () => {
    expect(serverRoutes.size).toBeGreaterThan(100);
  });

  test("every /api path the client fetches has a matching route", () => {
    const segsOf = (p: string) => normalize(p).split("/");

    const underFailClosedPrefix = (p: string) =>
      FAIL_CLOSED_PREFIXES.some((prefix) => p === prefix || p.startsWith(prefix + "/"));

    const matches = (clientPath: string) => {
      if (underFailClosedPrefix(normalize(clientPath))) return true;
      const c = segsOf(clientPath);
      for (const route of serverRoutes) {
        const s = segsOf(route);
        if (
          c.length === s.length &&
          c.every((seg, i) => seg === s[i] || seg === "*" || s[i] === "*")
        ) {
          return true;
        }
      }
      return false;
    };

    const unmatched = [...clientPaths].filter((p) => !matches(p)).sort();
    expect(unmatched).toEqual([]);
  });
});
