/**
 * Client authenticated-fetch contract.
 *
 * Per-user API endpoints resolve the caller's identity from the verified
 * Supabase JWT, so a raw `fetch("/api/...")` from the SPA carries no
 * Authorization header and is rejected (401) — the screen silently shows an
 * empty state even though the endpoint is fine. The fix is always to use
 * `apiFetch` from `client/lib/apiFetch`, which attaches the access token.
 *
 * This test statically finds every `/api/...` path the server mounts behind
 * `requireAuth` (direct handlers and routers) and fails if a client file calls
 * that path with a bare `fetch(` instead of `apiFetch(`.
 *
 * A path may be exempted only when the call is genuinely unauthenticated (a
 * public endpoint) or the identity is attached by hand — add it to
 * MANUAL_AUTH_ALLOWLIST with a reason.
 */
import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "../..");

/** Client files that attach the bearer token themselves, with a reason. */
const MANUAL_AUTH_ALLOWLIST: Record<string, string> = {
  "client/contexts/NotificationContext.tsx":
    "reads the Supabase session and sets the Authorization header explicitly",
};

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

function normalize(p: string): string {
  const segs = p.split("/").filter(Boolean);
  return "/" + segs.map((s) => (s.startsWith(":") || s === "*" ? "*" : s)).join("/");
}

/** API paths the server mounts behind requireAuth (direct + mounted routers). */
function authProtectedPaths(): Set<string> {
  const indexSrc = read(path.join(ROOT, "server/index.ts"));
  const paths = new Set<string>();

  // Direct handlers: app.<verb>("...", requireAuth, ...)
  for (const m of indexSrc.matchAll(
    /app\.(?:get|post|put|patch|delete)\(\s*"([^"]+)"\s*,\s*requireAuth/g,
  )) {
    paths.add(normalize(m[1]));
  }

  // Mounted routers: app.use("/api/x", requireAuth, ..., routerVar)
  const imports = new Map<string, string>();
  for (const m of indexSrc.matchAll(/import\s+(\w+)\s+from\s+"(\.\/routes\/[^"]+)"/g)) {
    imports.set(m[1], m[2]);
  }
  for (const m of indexSrc.matchAll(
    /app\.use\(\s*"([^"]+)"\s*,\s*requireAuth[^,]*,\s*(\w+)\s*\)/g,
  )) {
    const prefix = m[1];
    const mod = imports.get(m[2]);
    if (!mod) continue;
    let file = path.join(ROOT, "server", mod.replace(/^\.\//, "") + ".ts");
    if (!fs.existsSync(file)) {
      file = file.replace(/\.ts$/, "/index.ts");
      if (!fs.existsSync(file)) continue;
    }
    const src = read(file);
    for (const r of src.matchAll(/router\.(?:get|post|put|patch|delete)\(\s*[`"']([^`"']+)/g)) {
      const sub = r[1].startsWith("/") ? r[1] : "/" + r[1];
      paths.add(normalize(prefix.replace(/\/$/, "") + sub));
    }
  }

  return paths;
}

interface RawCall {
  file: string;
  path: string;
  line: number;
}

/**
 * Raw fetch("/api/...") calls that do NOT attach an Authorization header.
 * A call site is treated as authenticated when the fetch call or the following
 * few lines set `Authorization` / `Bearer` (some pages pass the token by hand).
 */
function rawFetchCalls(): RawCall[] {
  const calls: RawCall[] = [];
  for (const file of walk(path.join(ROOT, "client"), [".ts", ".tsx"])) {
    const rel = path.relative(ROOT, file);
    if (MANUAL_AUTH_ALLOWLIST[rel]) continue;
    const lines = read(file).split("\n");
    lines.forEach((line, i) => {
      // A bare `fetch(` or `window.fetch(` — not `apiFetch(`/`prefetch(`.
      const m = line.match(/(?<![a-zA-Z])fetch\(\s*[`"']([^`"']+)/);
      if (!m) return;
      const cleaned = m[1].split("?")[0].replace(/\$\{[^}]*\}/g, "*");
      if (!cleaned.startsWith("/api")) return;
      // Skip calls that supply request headers (auth is attached by the caller,
      // e.g. `{ headers }`, `await this.authHeaders()`, or an explicit Bearer).
      const window = lines.slice(i, i + 10).join("\n");
      if (/header/i.test(window) || /Authorization|Bearer/.test(window)) return;
      calls.push({ file: rel, path: cleaned, line: i + 1 });
    });
  }
  return calls;
}

describe("🔐 Client fetches to authenticated API paths use apiFetch", () => {
  const protectedPaths = authProtectedPaths();
  const calls = rawFetchCalls();

  test("the server has authenticated API paths to check", () => {
    expect(protectedPaths.size).toBeGreaterThan(20);
  });

  test("no client file calls a requireAuth path with a bare fetch", () => {
    const violations = calls.filter((c) => protectedPaths.has(normalize(c.path)));
    const report = violations
      .map((v) => `  ${v.file}:${v.line}  fetch("${v.path}") — use apiFetch instead`)
      .join("\n");
    expect(report ? `\n${report}\n` : "").toBe("");
  });
});
