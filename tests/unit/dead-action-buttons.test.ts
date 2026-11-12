/**
 * Regression: the "export / share / visit" buttons fixed this pass were rendered
 * with no handler, so they did nothing when clicked. Each must now be wired:
 *  - ExpenseTracker "تصدير"      -> onClick={exportToCSV}
 *  - ProfitabilityReports "تصدير التقرير" -> onClick={exportReport}
 *  - DiseaseDiagnosis "مشاركة"   -> onClick={shareDiagnosis}
 *  - DiseaseGuide "زيارة الموقع" -> an <a href={resource.link}>
 */
import fs from "node:fs";
import path from "node:path";

const PAGES = path.join(__dirname, "..", "..", "client", "pages");
const read = (name: string) => fs.readFileSync(path.join(PAGES, name), "utf8");

/** Extract the opening tag of each <Button ...> in `source`, brace-depth aware
 *  so a `>` inside `onClick={() => ...}` does not end the tag early. */
function buttonTags(source: string): Array<{ tag: string; after: string }> {
  const out: Array<{ tag: string; after: string }> = [];
  const re = /<Button\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    let i = m.index;
    let depth = 0;
    let end = -1;
    for (; i < source.length; i++) {
      const ch = source[i];
      if (ch === "{") depth++;
      else if (ch === "}") depth--;
      else if (ch === ">" && depth === 0) {
        end = i;
        break;
      }
    }
    if (end === -1) continue;
    out.push({ tag: source.slice(m.index, end + 1), after: source.slice(end + 1, end + 200) });
  }
  return out;
}

function buttonTagContaining(source: string, marker: string): string | null {
  for (const { tag, after } of buttonTags(source)) {
    if (tag.includes(marker) || after.includes(marker)) return tag;
  }
  return null;
}

describe("previously dead action buttons are wired", () => {
  test("ExpenseTracker export button has an onClick", () => {
    const tag = buttonTagContaining(read("ExpenseTracker.tsx"), "تصدير");
    expect(tag).not.toBeNull();
    expect(tag).toMatch(/onClick=\{exportToCSV\}/);
  });

  test("ProfitabilityReports export button has an onClick", () => {
    const tag = buttonTagContaining(read("ProfitabilityReports.tsx"), "تصدير التقرير");
    expect(tag).not.toBeNull();
    expect(tag).toMatch(/onClick=\{exportReport\}/);
  });

  test("DiseaseDiagnosis share button has an onClick", () => {
    const tag = buttonTagContaining(read("DiseaseDiagnosis.tsx"), "مشاركة");
    expect(tag).not.toBeNull();
    expect(tag).toMatch(/onClick=\{\(\) => void shareDiagnosis\(\)\}/);
  });

  test("DiseaseGuide resource button links to its resource URL", () => {
    const source = read("DiseaseGuide.tsx");
    expect(source).toMatch(/<a href=\{resource\.link\} target="_blank" rel="noopener noreferrer">/);
  });
});
