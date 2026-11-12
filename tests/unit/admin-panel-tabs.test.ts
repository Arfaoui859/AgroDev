/**
 * Regression: every `<TabsTrigger value="x">` in the Admin Panel must have a
 * matching `<TabsContent value="x">`. Three triggers (system/security/
 * subscriptions) once had no content, so clicking them showed a blank panel.
 */
import fs from "node:fs";
import path from "node:path";

const ADMIN_PANEL = path.join(__dirname, "..", "..", "client", "pages", "AdminPanel.tsx");

function values(source: string, tag: "TabsTrigger" | "TabsContent"): Set<string> {
  const re = new RegExp(`${tag} value="([a-z0-9-]+)"`, "g");
  const found = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) found.add(m[1]);
  return found;
}

describe("AdminPanel tabs", () => {
  const source = fs.readFileSync(ADMIN_PANEL, "utf8");

  test("every tab trigger has matching tab content", () => {
    const triggers = values(source, "TabsTrigger");
    const contents = values(source, "TabsContent");
    const missing = [...triggers].filter((v) => !contents.has(v));
    expect(missing).toEqual([]);
  });
});
