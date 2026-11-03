/**
 * Advisory presentation helpers.
 *
 * An AI service attaches `advisory` only when a configured LLM produced text.
 * The UI must show it when present and show nothing when absent — never a
 * placeholder that would read like a model answer.
 */
import {
  hasAdvisory,
  advisoryText,
  advisoryModel,
} from "../../client/lib/advisory";

describe("advisory helpers", () => {
  test("an advisory with text is present", () => {
    expect(hasAdvisory({ text: "نصيحة", language: "ar" })).toBe(true);
  });

  test("missing or blank advisory is absent", () => {
    expect(hasAdvisory(undefined)).toBe(false);
    expect(hasAdvisory(null)).toBe(false);
    expect(hasAdvisory({})).toBe(false);
    expect(hasAdvisory({ text: "   " })).toBe(false);
  });

  test("text is trimmed", () => {
    expect(advisoryText({ text: "  hello  " })).toBe("hello");
    expect(advisoryText({ text: "   " })).toBeNull();
    expect(advisoryText(undefined)).toBeNull();
  });

  test("model name is surfaced only when meaningful", () => {
    expect(advisoryModel({ model_source: "openai:gpt-4o-mini" })).toBe(
      "openai:gpt-4o-mini",
    );
    expect(advisoryModel({ model_source: "  " })).toBeNull();
    expect(advisoryModel({})).toBeNull();
  });
});
