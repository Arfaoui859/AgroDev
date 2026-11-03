import fs from "fs";
import path from "path";
import { createServer } from "./index";
import * as express from "express";

const app = createServer();
const port = process.env.PORT || 3000;

// In production, serve the built SPA files. Different build targets place the
// output in different folders (Vite -> dist/, some hosts -> dist/spa/), so pick
// the first candidate that actually contains an index.html.
const __dirname = import.meta.dirname;
const distCandidates = [
  path.join(__dirname, "../dist"),
  path.join(__dirname, "../spa"),
  path.join(__dirname, "../dist/spa"),
  path.join(process.cwd(), "dist"),
  path.join(process.cwd(), "dist/spa"),
];
const distPath =
  distCandidates.find((candidate) =>
    fs.existsSync(path.join(candidate, "index.html")),
  ) || path.join(__dirname, "../dist");

// Serve static files
app.use(express.static(distPath));

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
