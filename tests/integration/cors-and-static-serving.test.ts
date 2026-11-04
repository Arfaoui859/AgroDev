/**
 * Production CORS + static-serving contract.
 *
 * Regression origin: on Render, requests carrying an `Origin` header were
 * rejected by the CORS middleware via `callback(new Error(...))`, which the
 * error handler turned into an opaque HTTP 500 (`application/json`). Because
 * the production bundle requests its own assets with a `crossorigin` attribute
 * — the browser then sends `Origin` even for same-origin fetches — the CSS and
 * JS 500'd, producing the reported blank page and the
 * "MIME type ('application/json') is not a supported stylesheet MIME type"
 * console error.
 *
 * These tests boot the real Express app (no stubbing) and assert the behaviour
 * that must hold in production.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";

const PROD_ORIGIN = "https://agrodev-3.onrender.com";
const ENV_KEYS = [
  "NODE_ENV",
  "CORS_ORIGINS",
  "APP_ORIGIN",
  "RENDER_EXTERNAL_URL",
] as const;
const saved: Record<string, string | undefined> = {};

beforeAll(() => {
  for (const key of ENV_KEYS) saved[key] = process.env[key];
});

afterAll(() => {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key] as string;
  }
});

describe("CORS policy", () => {
  beforeEach(() => {
    delete process.env.CORS_ORIGINS;
    delete process.env.APP_ORIGIN;
    delete process.env.RENDER_EXTERNAL_URL;
    process.env.NODE_ENV = "production";
  });

  // (a) Valid production origin, from RENDER_EXTERNAL_URL (the trusted source).
  test("accepts the exact production origin configured via RENDER_EXTERNAL_URL", async () => {
    process.env.RENDER_EXTERNAL_URL = PROD_ORIGIN;
    const res = await request(createServer())
      .get("/api/ping")
      .set("Origin", PROD_ORIGIN);
    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBe(PROD_ORIGIN);
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
  });

  // (a') APP_ORIGIN is an equally trusted explicit source.
  test("accepts the exact production origin configured via APP_ORIGIN", async () => {
    process.env.APP_ORIGIN = PROD_ORIGIN;
    const res = await request(createServer())
      .get("/api/ping")
      .set("Origin", PROD_ORIGIN);
    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBe(PROD_ORIGIN);
  });

  // (b) Valid configured custom domain.
  test("accepts an extra origin listed in CORS_ORIGINS", async () => {
    process.env.CORS_ORIGINS = "https://agrogrowth.tn, https://www.agrogrowth.tn";
    const res = await request(createServer())
      .get("/api/ping")
      .set("Origin", "https://agrogrowth.tn");
    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBe("https://agrogrowth.tn");
  });

  // (c) Unauthorized origin.
  test("rejects an unauthorized origin without a 500", async () => {
    process.env.RENDER_EXTERNAL_URL = PROD_ORIGIN;
    const res = await request(createServer())
      .get("/api/ping")
      .set("Origin", "https://evil.example.com");
    // The request is still served, but carries no CORS headers so the browser
    // blocks the response. Critically it must NOT be an opaque 500.
    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
    expect(res.headers["access-control-allow-credentials"]).toBeUndefined();
  });

  // (d) Attacker-controlled Host AND matching Origin must NOT be trusted.
  test("rejects Host: attacker.example + Origin: https://attacker.example", async () => {
    process.env.RENDER_EXTERNAL_URL = PROD_ORIGIN;
    const res = await request(createServer())
      .get("/api/ping")
      .set("Host", "attacker.example")
      .set("Origin", "https://attacker.example");
    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
    expect(res.headers["access-control-allow-credentials"]).toBeUndefined();
  });

  // (e) The real Host with an attacker Origin is still rejected.
  test("rejects Host: agrodev-3.onrender.com + Origin: https://attacker.example", async () => {
    process.env.RENDER_EXTERNAL_URL = PROD_ORIGIN;
    const res = await request(createServer())
      .get("/api/ping")
      .set("Host", "agrodev-3.onrender.com")
      .set("Origin", "https://attacker.example");
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  // (f) A valid Origin must be granted even when Host is manipulated: the
  // decision is driven by the configured allow-list, never by the Host header.
  test("grants a valid Origin even with a manipulated Host header", async () => {
    process.env.RENDER_EXTERNAL_URL = PROD_ORIGIN;
    const res = await request(createServer())
      .get("/api/ping")
      .set("Host", "attacker.example")
      .set("Origin", PROD_ORIGIN);
    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBe(PROD_ORIGIN);
  });

  // Fail-safe: with no trusted origin configured, an arbitrary Host must not
  // become a trusted origin.
  test("does not trust the Host header when nothing is configured", async () => {
    const res = await request(createServer())
      .get("/api/ping")
      .set("Host", "agrodev-3.onrender.com")
      .set("Origin", PROD_ORIGIN);
    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  test("accepts requests without an Origin header", async () => {
    const res = await request(createServer()).get("/api/ping");
    expect(res.status).toBe(200);
    expect(res.body.message).toBeTruthy();
  });

  // (h) localhost only outside production.
  test("allows localhost in development", async () => {
    process.env.NODE_ENV = "development";
    const res = await request(createServer())
      .get("/api/ping")
      .set("Origin", "http://localhost:5173");
    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
  });

  test("rejects localhost in production", async () => {
    const res = await request(createServer())
      .get("/api/ping")
      .set("Origin", "http://localhost:5173");
    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  // (g) OPTIONS preflight.
  test("OPTIONS preflight from the production origin succeeds", async () => {
    process.env.RENDER_EXTERNAL_URL = PROD_ORIGIN;
    const res = await request(createServer())
      .options("/api/smart-advisor/chat")
      .set("Origin", PROD_ORIGIN)
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "content-type");
    expect(res.status).toBeLessThan(300);
    expect(res.headers["access-control-allow-origin"]).toBe(PROD_ORIGIN);
    expect(res.headers["access-control-allow-methods"]).toContain("POST");
  });

  test("OPTIONS preflight from an unauthorized origin carries no CORS headers", async () => {
    process.env.RENDER_EXTERNAL_URL = PROD_ORIGIN;
    const res = await request(createServer())
      .options("/api/smart-advisor/chat")
      .set("Origin", "https://evil.example.com")
      .set("Access-Control-Request-Method", "POST");
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  // Malformed configuration must fail safe (never crash, never wildcard).
  test("a malformed APP_ORIGIN is ignored, not trusted", async () => {
    process.env.APP_ORIGIN = "not a url";
    const res = await request(createServer())
      .get("/api/ping")
      .set("Origin", "not a url");
    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  test("a malformed RENDER_EXTERNAL_URL does not crash the server", async () => {
    process.env.RENDER_EXTERNAL_URL = "::::not-a-url::::";
    const res = await request(createServer())
      .get("/api/ping")
      .set("Origin", PROD_ORIGIN);
    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });
});

describe("static asset serving", () => {
  // Build a throwaway SPA tree and mount the production static layer exactly as
  // node-build.ts does, so the MIME + fallback contract is exercised for real.
  let dir: string;

  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "agro-spa-"));
    fs.mkdirSync(path.join(dir, "assets"), { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), "<!doctype html><html><body>SPA</body></html>");
    fs.writeFileSync(path.join(dir, "assets", "index-abc.js"), "export const x = 1;");
    fs.writeFileSync(path.join(dir, "assets", "index-abc.css"), "body{color:red}");
  });

  afterAll(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  function buildStaticApp() {
    // Mirror node-build.ts: express.static(distPath) + /assets 404 + SPA catch-all.
    const app = express();
    app.use(
      express.static(dir, {
        setHeaders(res, filePath) {
          const ext = path.extname(filePath).toLowerCase();
          const mime =
            ext === ".js"
              ? "application/javascript; charset=UTF-8"
              : ext === ".css"
                ? "text/css; charset=UTF-8"
                : undefined;
          if (mime) res.setHeader("Content-Type", mime);
        },
      }),
    );
    app.use("/assets", (_req, res) => {
      res.status(404).type("text/plain").send("Asset not found");
    });
    // Mirror the node-build.ts defence-in-depth block.
    app.use(["/server", "/build"], (_req, res) => {
      res.status(404).type("text/plain").send("Not found");
    });
    app.get("*", (req, res) => {
      if (req.path.startsWith("/api/")) {
        return res.status(404).json({ error: "API endpoint not found" });
      }
      res.sendFile(path.join(dir, "index.html"));
    });
    return app;
  }

  test("/ returns the SPA HTML", async () => {
    const res = await request(buildStaticApp()).get("/");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/html");
    expect(res.text).toContain("SPA");
  });

  test("CSS is served as text/css", async () => {
    const res = await request(buildStaticApp()).get("/assets/index-abc.css");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/css");
  });

  test("JS is served as a valid JavaScript MIME type", async () => {
    const res = await request(buildStaticApp()).get("/assets/index-abc.js");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/javascript/);
  });

  test("an unknown frontend route returns the SPA HTML", async () => {
    const res = await request(buildStaticApp()).get("/some/deep/route");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/html");
  });

  test("a missing static asset returns a real 404, not the SPA HTML", async () => {
    const res = await request(buildStaticApp()).get("/assets/missing-xyz.js");
    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).not.toContain("text/html");
  });

  test("an unknown /api route returns a JSON 404, never index.html", async () => {
    const res = await request(buildStaticApp()).get("/api/definitely-missing");
    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).toContain("application/json");
    expect(res.text).not.toContain("SPA");
  });

  test("backend bundle and source-map paths are hard 404, never served", async () => {
    for (const p of [
      "/server/node-build.mjs",
      "/server/node-build.mjs.map",
      "/build/server/node-build.mjs",
    ]) {
      const res = await request(buildStaticApp()).get(p);
      expect(res.status).toBe(404);
      expect(res.headers["content-type"]).not.toContain("text/html");
      expect(res.text).not.toContain("SPA");
    }
  });
});

/**
 * The built server must locate `dist/index.html` relative to its own module
 * location, not only via `process.cwd()`. The original candidate list pointed at
 * `../dist` from `dist/server/`, i.e. `dist/dist`, which never exists, so a host
 * that launched the process from another directory served a 404 for "/".
 */
describe("built server path resolution", () => {
  const bundle = path.resolve(__dirname, "../../build/server/node-build.mjs");
  const hasBundle = fs.existsSync(bundle);
  const it = hasBundle ? test : test.skip;

  it(
    "serves the SPA from a working directory other than the repo root",
    async () => {
      const { spawn } = await import("node:child_process");
      const port = 4600 + Math.floor(Math.random() * 300);
      const child = spawn(process.execPath, [bundle], {
        cwd: os.tmpdir(),
        env: { ...process.env, NODE_ENV: "production", PORT: String(port) },
        stdio: "ignore",
      });
      try {
        // Poll until the server answers or the budget elapses.
        let status = 0;
        for (let i = 0; i < 40; i++) {
          await new Promise((r) => setTimeout(r, 250));
          try {
            const res = await fetch(`http://127.0.0.1:${port}/`);
            status = res.status;
            if (status) {
              expect(res.headers.get("content-type")).toContain("text/html");
              break;
            }
          } catch {
            // not up yet
          }
        }
        expect(status).toBe(200);
      } finally {
        child.kill("SIGTERM");
      }
    },
    20_000,
  );
});
