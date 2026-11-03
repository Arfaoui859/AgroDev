/**
 * Farm Advisor orchestrator tests.
 *
 * These exercise the real advisor code paths to guarantee that:
 *  - a configured LLM produces dataSource="llm"
 *  - a failing/unreachable LLM falls back to the rule-based engine AND says so
 *  - an unconfigured LLM answers with rule-based output and an honest note
 *  - language detection and agent routing behave as documented
 *
 * fetch is stubbed so no network access is required.
 */
import {
  answerAgriculturalQuestion,
  detectLanguage,
} from "../../server/services/ai/farmAdvisor";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  delete process.env.AI_BASE_URL;
  delete process.env.AI_API_KEY;
  delete process.env.AI_MODEL;
  delete process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_BASE_URL;
});

function mockFetch(impl: typeof fetch) {
  global.fetch = impl as typeof fetch;
}

describe("detectLanguage", () => {
  test("detects Arabic script", () => {
    expect(detectLanguage("كيف أعالج الطماطم؟")).toBe("ar");
  });
  test("detects French", () => {
    expect(detectLanguage("Comment irriguer mes cultures ?")).toBe("fr");
  });
  test("defaults to English otherwise", () => {
    expect(detectLanguage("How do I grow wheat?")).toBe("en");
  });
});

describe("answerAgriculturalQuestion", () => {
  test("returns rule-based output with an honest note when no LLM is configured", async () => {
    const result = await answerAgriculturalQuestion({
      question: "ما هي أفضل المحاصيل لتربتي؟",
      context: { soil: { ph: 6.5, nitrogen: 40 } },
    });
    expect(result.dataSource).toBe("rule-based");
    expect(result.language).toBe("ar");
    expect(result.note).toMatch(/AI_BASE_URL/);
    expect(result.answer.length).toBeGreaterThan(0);
    // Must never claim to be model-generated.
    expect(result.disclaimer).toMatch(/قواعد|ليست ناتجة/);
  });

  test("uses the LLM and reports dataSource=llm when configured", async () => {
    process.env.AI_BASE_URL = "https://llm.test/v1";
    process.env.AI_API_KEY = "test-key";
    process.env.AI_MODEL = "test-model";
    mockFetch(async () =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "استعمل الري بالتنقيط." } }],
        }),
        { status: 200 },
      ),
    );
    const result = await answerAgriculturalQuestion({
      question: "كيف أسقي الطماطم؟",
    });
    expect(result.dataSource).toBe("llm");
    expect(result.answer).toContain("الري بالتنقيط");
    expect(result.modelInfo).toEqual({
      provider: "openai-compatible",
      model: "test-model",
    });
  });

  test("falls back to rule-based and explains why when the LLM fails", async () => {
    process.env.AI_BASE_URL = "https://llm.test/v1";
    process.env.AI_API_KEY = "test-key";
    mockFetch(async () => {
      throw new Error("connection refused");
    });
    const result = await answerAgriculturalQuestion({
      question: "ما هي أفضل المحاصيل؟",
    });
    expect(result.dataSource).toBe("rule-based");
    expect(result.note).toMatch(/LLM unavailable/);
    expect(result.disclaimer).toMatch(/تعذّر الاتصال/);
  });

  test("treats an empty LLM response as a parse failure and falls back", async () => {
    process.env.AI_BASE_URL = "https://llm.test/v1";
    process.env.AI_API_KEY = "test-key";
    mockFetch(async () =>
      new Response(JSON.stringify({ choices: [] }), { status: 200 }),
    );
    const result = await answerAgriculturalQuestion({
      question: "soil ph question",
      language: "en",
    });
    expect(result.dataSource).toBe("rule-based");
    expect(result.note).toMatch(/LLM unavailable/);
  });

  test("routes soil questions to the soil agent and surfaces missing measurements", async () => {
    const result = await answerAgriculturalQuestion({
      question: "ما هو تحليل التربة (soil) الخاص بي؟",
      context: { soil: { ph: 4.5 } },
    });
    expect(result.usedAgents).toContain("soil");
    expect(result.contextSummary.join(" ")).toContain("التربة");
  });

  test("does not invent market prices in rule-based mode", async () => {
    const result = await answerAgriculturalQuestion({
      question: "ما هي أسعار السوق اليوم؟",
    });
    expect(result.usedAgents).toContain("market");
    expect(result.answer).not.toMatch(/\d+(\.\d+)?\s*(د\.ت|TND|USD)/);
  });
});
