/**
 * Client/backend route-contract regression test.
 *
 * The client calls 190+ distinct /api paths via fetch(). Previously 41 of them
 * returned 404 because five fully-implemented routers were never registered in
 * server/index.ts, which silently disabled large parts of the UI.
 *
 * This test walks the real Express route table, converts every registered path
 * into a matcher, and asserts that each client fetch path matches a route.
 * It needs no fixtures or database, so it fails the moment a client contract is
 * broken by an unmounted router or a renamed path.
 */
import fs from "node:fs";
import path from "node:path";
import express from "express";
import { createServer } from "../../server/index";

interface RouteEntry {
  method: string;
  pattern: string;
}

/** Recursively collect every (method, path) pair from an Express app. */
function collectRoutes(app: express.Application): RouteEntry[] {
  const entries: RouteEntry[] = [];
  const router = (app as unknown as { _router?: { stack: any[] } })._router;
  if (!router) return entries;

  const walk = (stack: any[], prefix: string) => {
    for (const layer of stack) {
      if (layer.route) {
        const routePath = layer.route.path as string;
        for (const method of Object.keys(layer.route.methods)) {
          entries.push({
            method: method.toUpperCase(),
            pattern: joinPath(prefix, routePath),
          });
        }
      } else if (layer.name === "router" && layer.handle?.stack) {
        // Mounted sub-router: recover its mount path from the regexp.
        const mount = mountPath(layer);
        walk(layer.handle.stack, joinPath(prefix, mount));
      }
    }
  };
  walk(router.stack, "");
  return entries;
}

function joinPath(prefix: string, segment: string): string {
  const clean = (p: string) => p.replace(/\/+$/, "");
  const base = clean(prefix);
  if (segment === "/" || segment === "") return base || "/";
  if (segment.startsWith("/")) return `${base}${segment}`;
  return `${base}/${segment}`;
}

/** Express stores mounted routers as a regexp like ^\/api\/foo\/?(?=\/|$). */
function mountPath(layer: any): string {
  const source: string = layer.regexp?.source ?? "";
  const match = source
    .replace("^\\/", "/")
    .replace("\\/?(?=\\/|$)", "")
    .replace(/\\\//g, "/")
    .replace(/\$$/, "");
  return match === "/?$" || match === "" ? "" : match;
}

/** Compile an Express path pattern into a regexp, treating :params as segments. */
function patternToRegex(pattern: string): RegExp {
  const escaped = pattern
    .split("/")
    .map((seg) => {
      if (seg.startsWith(":")) return "[^/]+";
      if (seg.includes("*")) return ".*";
      return seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("/");
  return new RegExp(`^${escaped}/?$`);
}

interface ClientCall {
  method: string;
  path: string;
}

/**
 * Extract every /api call the client makes, together with its HTTP method.
 * fetch() defaults to GET; an explicit method is read from the options object
 * that follows the call (within a short window).
 */
function clientCalls(): ClientCall[] {
  const root = path.resolve(__dirname, "../../client");
  const found = new Map<string, ClientCall>();
  const files: string[] = [];
  const walkDir = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walkDir(full);
      else if (/\.(ts|tsx)$/.test(entry.name)) files.push(full);
    }
  };
  walkDir(root);

  const re = /fetch\(\s*[`'"]([^`'"]+)[`'"]/g;
  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    let m: RegExpExecArray | null;
    while ((m = re.exec(content))) {
      let p = m[1];
      if (!p.startsWith("/api")) continue;
      p = p.split("?")[0].replace(/\$\{[^}]*\}/g, "1");
      // Look ahead for an explicit method in the fetch options.
      const window = content.slice(m.index, m.index + 200);
      const methodMatch = window.match(/method\s*:\s*['"]([A-Za-z]+)['"]/);
      const method = (methodMatch ? methodMatch[1] : "GET").toUpperCase();
      found.set(`${method} ${p}`, { method, path: p });
    }
  }
  return [...found.values()];
}

describe("🔌 Client/backend route contract", () => {
  let routes: RouteEntry[];
  let matchers: { method: string; regex: RegExp; pattern: string }[];
  let calls: ClientCall[];

  beforeAll(() => {
    const app = createServer();
    routes = collectRoutes(app);
    matchers = routes.map((r) => ({
      method: r.method,
      regex: patternToRegex(r.pattern),
      pattern: r.pattern,
    }));
    calls = clientCalls();
  });

  test("the route table is non-trivial", () => {
    expect(routes.length).toBeGreaterThan(300);
  });

  test("every client /api path matches a mounted route", () => {
    const unmatched = calls
      .filter((c) => !matchers.some((m) => m.regex.test(c.path)))
      .map((c) => c.path);
    expect(unmatched).toEqual([]);
  });

  test("every client call matches a route with the same HTTP method", () => {
    const unmatched = calls
      .filter(
        (c) =>
          !matchers.some((m) => m.method === c.method && m.regex.test(c.path)),
      )
      .map((c) => `${c.method} ${c.path}`);
    expect(unmatched).toEqual([]);
  });

  test("no duplicate method+path registration shadows a route", () => {
    const seen = new Map<string, number>();
    for (const r of routes) {
      const key = `${r.method} ${r.pattern}`;
      seen.set(key, (seen.get(key) ?? 0) + 1);
    }
    const duplicates = [...seen.entries()].filter(([, n]) => n > 1);
    expect(duplicates).toEqual([]);
  });
});
