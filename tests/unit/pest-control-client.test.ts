/**
 * Pest-control client input handling.
 *
 * The service matches symptoms with keyword rules and self-declares
 * `symptom-keyword-rules` — a deterministic engine, not a trained model. These
 * tests pin the input boundary (bounded, string-only symptoms) and the
 * question-derived symptom selector, which must never invent a symptom.
 */
import {
  sanitiseSymptoms,
  deriveSymptomsFromQuestion,
} from "../../server/services/ai/pestControlClient";

describe("sanitiseSymptoms", () => {
  test("keeps only non-empty trimmed strings", () => {
    expect(sanitiseSymptoms([" yellow leaves ", "", "  ", "aphids"])).toEqual([
      "yellow leaves",
      "aphids",
    ]);
  });

  test("rejects non-array and non-string entries", () => {
    expect(sanitiseSymptoms(undefined)).toEqual([]);
    expect(sanitiseSymptoms("yellow leaves")).toEqual([]);
    expect(sanitiseSymptoms([1, null, { a: 1 }, "valid"])).toEqual(["valid"]);
  });

  test("bounds count and per-item length", () => {
    const many = Array.from({ length: 50 }, (_, i) => `symptom ${i}`);
    expect(sanitiseSymptoms(many)).toHaveLength(20);
    const long = "x".repeat(500);
    expect(sanitiseSymptoms([long])[0]).toHaveLength(200);
  });
});

describe("deriveSymptomsFromQuestion", () => {
  test("selects the user's own symptom-like clauses", () => {
    const derived = deriveSymptomsFromQuestion(
      "أوراق الطماطم صفراء وتظهر بقعة بنية، ما العمل؟",
    );
    expect(derived.length).toBeGreaterThan(0);
    expect(derived.join(" ")).toMatch(/صفراء|بقعة/);
  });

  test("returns nothing when the question describes no plant symptom", () => {
    expect(deriveSymptomsFromQuestion("ما هي أسعار السوق اليوم؟")).toEqual([]);
  });

  test("never invents text: every derived clause is a substring of the question", () => {
    const question = "leaves are yellow with spots, how do I fix it?";
    for (const clause of deriveSymptomsFromQuestion(question)) {
      expect(question).toContain(clause);
    }
  });
});
