/**
 * Guard: navigation must not lead to dead routes.
 *
 * The router's catch-all (`*`) renders NotFound, so a link to an undeclared
 * path silently produces a "not found" page instead of the intended screen.
 * That is how `/terms` and `/privacy` (linked from Login and Signup) were
 * broken. These checks assert every static in-app destination that appears in
 * a `to="…"`, `navigate("…")` or `href="…"` actually has a declared route.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(__dirname, "..", "..");
const CLIENT = path.join(ROOT, "client");

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(tsx|ts)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const routerSource = fs.readFileSync(
  path.join(CLIENT, "components", "AppRouter.tsx"),
  "utf8",
);
const declared = new Set(
  Array.from(routerSource.matchAll(/path="([^"]+)"/g)).map((m) => m[1]),
);

// Static paths only: dynamic segments (`:id`) and the catch-all are excluded.
const isStatic = (p: string) => !p.includes(":") && p !== "*";

const destinations = new Set<string>();
for (const file of walk(CLIENT)) {
  const src = fs.readFileSync(file, "utf8");
  for (const m of src.matchAll(/(?:to=|navigate\(|href=)["'`](\/[a-z0-9/_-]*)["'`]/gi)) {
    destinations.add(m[1]);
  }
}

describe("in-app navigation targets", () => {
  test("every static destination has a declared route", () => {
    const missing = [...destinations].filter(
      (p) => isStatic(p) && !declared.has(p),
    );
    expect(missing).toEqual([]);
  });

  test("the legal routes linked from auth screens exist", () => {
    // Regression: Login/Signup link to /terms and /privacy.
    expect(declared.has("/terms")).toBe(true);
    expect(declared.has("/privacy")).toBe(true);
  });
});
