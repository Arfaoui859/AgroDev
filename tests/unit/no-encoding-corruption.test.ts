/**
 * Regression guard: no tracked source file may contain U+FFFD (the Unicode
 * "replacement character"). A visible "�" in the Arabic UI is always an
 * encoding bug — text that was decoded with the wrong charset and lost its
 * bytes. Several pages carried this corruption before; this test keeps it out.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(__dirname, "..", "..");
const SKIP_DIRS = new Set(["node_modules", "dist", "build", ".git", ".venv", "coverage"]);
const EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".json", ".html", ".css", ".md", ".sql", ".py"]);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (EXTS.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

describe("source encoding integrity", () => {
  test("no source file contains a U+FFFD replacement character", () => {
    const offenders: string[] = [];
    const self = __filename;
    for (const file of walk(ROOT)) {
      if (file === self) continue; // this guard references the codepoint itself
      const text = fs.readFileSync(file, "utf8");
      if (text.includes("\uFFFD")) offenders.push(path.relative(ROOT, file));
    }
    expect(offenders).toEqual([]);
  });

  test("Arabic UI strings survive as real UTF-8 codepoints", () => {
    // A sanity check that the guard is meaningful: a known Arabic label in the
    // i18n table must still be present as actual Arabic, not mojibake.
    const i18n = fs.readFileSync(path.join(ROOT, "client", "lib", "i18n.ts"), "utf8");
    expect(/[\u0600-\u06FF]/.test(i18n)).toBe(true);
  });
});
