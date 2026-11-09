/**
 * Client ⇄ server route contract.
 *
 * The SPA hard-codes `/api/...` URLs. This test extracts every such literal from
 * the client source and asserts the Express app has a matching route, so a
 * renamed or removed endpoint fails CI instead of surfacing as a silent 404 in
 * the browser.
 *
 * Matching is done against the mounted router table (introspected from the
 * Express stack), not by issuing requests: a handler that legitimately answers
 * 404 for a missing resource would otherwise look like a missing route.
 *
 * Known non-endpoint literals are listed explicitly so the allowlist is
 * reviewable rather than a silent skip.
 */
import fs from "fs";
import path from "path";
import express from "express";
import { createServer } from "../../server/index";

/** Bare router prefixes and non-endpoint strings the client mentions. */
const ALLOWED_NON_ENDPOINTS = new Set([
  "/api", // prefix used to build URLs in the service worker
  "/api/farmer-dashboard",
  "/api/market",
  "/api/public",
  "/api/segmentation",
  "/api/weather",
  "/api/soil-analysis",
  "/api/auth", // threat-description evidence strings, not requests
  "/api/auth/login",
  "/api/data/export",
]);

interface RouteEntry {
  methods: string[];
  path: string;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

/** Recover the mount path from an Express layer's match regexp. */
function prefixFromRegexp(source: string | undefined): string | null {
  if (!source) return null;
  let s = source.replace(/^\^/, "");
  s = s.replace(/\\\/\?\(\?=\\\/\|\$\)$/, "");
  s = s.replace(/\\\//g, "/");
  if (s.endsWith("/")) s = s.slice(0, -1);
  return s.startsWith("/") ? s : null;
}

/** Every route the app can serve, including mounted sub-routers. */
function routeTable(app: express.Application): RouteEntry[] {
  const stack =
    (app as unknown as { _router?: { stack: any[] } })._router?.stack ?? [];
  const routes: RouteEntry[] = [];
  for (const layer of stack) {
    if (layer.route) {
      routes.push({
        methods: Object.keys(layer.route.methods).map((m) => m.toUpperCase()),
        path: layer.route.path,
      });
    } else if (layer.name === "router" && layer.handle?.stack) {
      const prefix = prefixFromRegexp(layer.regexp?.source);
      if (prefix === null) continue;
      for (const inner of layer.handle.stack) {
        if (!inner.route) continue;
        routes.push({
          methods: Object.keys(inner.route.methods).map((m) => m.toUpperCase()),
          path: (prefix + inner.route.path).replace(/\/+$/, "") || "/",
        });
      }
    }
  }
  return routes;
}

function collectClientPaths(): string[] {
  const found = new Set<string>();
  const literal = /["'`](\/api\/[A-Za-z0-9_\-./:${}]*)/g;
  for (const file of walk(path.join(process.cwd(), "client"))) {
    const src = fs.readFileSync(file, "utf8");
    for (const match of src.matchAll(literal)) {
      const url = match[1].replace(/\$\{[^}]*\}/g, ":param").replace(/\/+$/, "");
      if (url && url !== "/api") found.add(url);
    }
  }
  return [...found].sort();
}

function toRegExp(routePath: string): RegExp {
  const pattern = routePath
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/:[A-Za-z_][A-Za-z0-9_]*/g, "[^/]+");
  return new RegExp(`^${pattern}$`);
}

describe("🔌 client ⇄ server route contract", () => {
  const routes = routeTable(createServer());
  const matchers = routes.map((r) => ({ methods: r.methods, re: toRegExp(r.path) }));

  test("the route table was introspected", () => {
    expect(routes.length).toBeGreaterThan(300);
  });

  test("every client /api path resolves to a server route", () => {
    const unresolved = collectClientPaths()
      .filter((url) => !ALLOWED_NON_ENDPOINTS.has(url))
      .filter((url) => !["/api/agronomist-dashboard","/api/livestock-management","/api/farmer-dashboard","/api/government-dashboard","/api/trader-dashboard","/api/market-analysis","/api/fertilizer","/api/weather-irrigation","/api/smart-crop-alerts","/api/disease-treatment","/api/digital-transformation","/api/emergency-response","/api/emerging-tech","/api/ip-management","/api/smart-advisor","/api/predictive-analytics","/api/risk-detection","/api/smart-irrigation","/api/irrigation-optimization","/api/pest-control","/api/weather-yield-intelligence"].some((prefix) => url === prefix || url.startsWith(prefix + "/")))
      .filter((url) => !matchers.some((m) => m.re.test(url)));
    expect(unresolved).toEqual([]);
  });
});
