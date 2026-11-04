import fs from "fs";
import path from "path";
import { createServer } from "./index";
import { warnIfModelUnavailable } from "./services/providers/llmProvider";
import * as express from "express";

const app = createServer();
const port = process.env.PORT || 3000;

// In production, serve the built SPA files. The server bundle now lives OUTSIDE
// the static root (build/server/node-build.mjs, see vite.config.server.ts) so
// the backend code and its source map can never be downloaded. The client output
// is therefore a sibling `dist/` directory. The legacy `dist/server` layout and
// the cwd-based candidates are kept as fallbacks for other hosts/launchers.
const __dirname = import.meta.dirname;
const distCandidates = [
  path.join(process.cwd(), "dist"), // repo-root cwd (Render/Docker)
  path.join(__dirname, "../../dist"), // build/server/../../dist = dist
  path.join(__dirname, ".."), // legacy dist/server/.. = dist
  path.join(process.cwd(), "dist/spa"),
  path.join(__dirname, "../../dist/spa"),
  path.join(__dirname, "../spa"), // hosts that emit dist/spa
  path.join(__dirname, "../dist"), // legacy nested layout
];
const distPath =
  distCandidates.find((candidate) =>
    fs.existsSync(path.join(candidate, "index.html")),
  ) || path.join(process.cwd(), "dist");

/**
 * Explicit MIME map for the build output. `express.static` derives the type from
 * the `mime-types` database, which has drifted across versions (a `.js` file can
 * be served as `text/javascript` or, historically, `application/x-javascript`).
 * A module script served with the wrong type is refused by the browser, so the
 * type is pinned here. This also guarantees CSS is `text/css`, which the blank
 * page incident depended on.
 */
const STATIC_MIME: Record<string, string> = {
  ".js": "application/javascript; charset=UTF-8",
  ".mjs": "application/javascript; charset=UTF-8",
  ".css": "text/css; charset=UTF-8",
  ".json": "application/json; charset=UTF-8",
  ".map": "application/json; charset=UTF-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
  ".txt": "text/plain; charset=UTF-8",
  ".webmanifest": "application/manifest+json",
};

// Serve static files
app.use(
  express.static(distPath, {
    setHeaders(res, filePath) {
      const mime = STATIC_MIME[path.extname(filePath).toLowerCase()];
      if (mime) res.setHeader("Content-Type", mime);
    },
  }),
);

// A missing hashed asset must be a real 404. Without this the SPA catch-all
// answers 200 text/html for `/assets/*.js`, so the browser receives HTML where
// it expected JavaScript and the app silently fails to boot.
app.use("/assets", (_req, res) => {
  res.status(404).type("text/plain").send("Asset not found");
});

// Defence in depth: the backend bundle and its source map used to be served
// from `dist/server`. They now live outside the static root, but any request
// for a server-bundle path is answered with a hard 404 so a future build-layout
// regression can never re-expose the source. These paths must never reach the
// SPA fallback.
app.use(["/server", "/build"], (_req, res) => {
  res.status(404).type("text/plain").send("Not found");
});

// Handle React Router - serve index.html for all non-API routes
app.get("*", (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }

  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(port, () => {
  console.log(`🚀 Fusion Starter server running on port ${port}`);
  console.log(`📱 Frontend: http://localhost:${port}`);
  console.log(`🔧 API: http://localhost:${port}/api`);

  // Non-blocking: surface a misconfigured/unavailable AI model without ever
  // substituting one. Runs after listen so it never delays readiness.
  void warnIfModelUnavailable();
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});
