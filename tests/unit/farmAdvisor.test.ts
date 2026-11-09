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

  test("detects Tunisian Arabic written in Latin characters", () => {
    expect(detectLanguage("kifeh n7eb ns9i tmatem?", "en")).toBe("ar");
    expect(detectLanguage("chnowa na3mel fi torba?", "en")).toBe("ar");
    expect(detectLanguage("kifeh el jaw ghodwa?", "en")).toBe("ar");
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

  test("sends irrigation, NPK-unit and market-provenance safeguards to the LLM", async () => {
    process.env.AI_BASE_URL = "https://llm.test/v1";
    process.env.AI_API_KEY = "test-key";
    let sentMessages: Array<{ role: string; content: string }> = [];
    mockFetch(async (_url, init) => {
      const body = JSON.parse(String(init?.body || "{}"));
      sentMessages = body.messages || [];
      return new Response(
        JSON.stringify({ choices: [{ message: { content: "Check the latest measured soil moisture first." } }] }),
        { status: 200 },
      );
    });
    await answerAgriculturalQuestion({
      question: "How much should I irrigate?",
      language: "en",
    });
    const systemPrompt = sentMessages.filter(message => message.role === "system").map(message => message.content).join("\n");
    expect(systemPrompt).toContain("never prescribe an exact water volume");
    expect(systemPrompt).toContain("never assume NPK units");
    expect(systemPrompt).toContain("price prediction");
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

  test("passes persisted platform records into the advisor context without inventing values", async () => {
    const result = await answerAgriculturalQuestion({
      question: "شنوّة وضع الحقول متاعي؟",
      context: {
        platformRecords: [
          "Farm North Plot · 2 ha",
          "Cultivation tomato [status=active; cultivation_id=real-record-id]",
          "Saved plant-health record [suspected condition=early blight; recovery=pending]",
          "Recorded weather [date=2026-11-08; source=Open-Meteo]",
          "Registered sensor [status=maintenance]. Registry data, not live telemetry.",
        ],
      },
    });
    expect(result.contextSummary.join(" ")).toContain("سجلات AgroGrowth الفعلية");
    expect(result.contextSummary.join(" ")).toContain("cultivation_id=real-record-id");
    expect(result.contextSummary.join(" ")).toContain("not live telemetry");
  });

  test("routes Tunisian Arabizi crop, soil and irrigation questions to relevant agents", async () => {
    const result = await answerAgriculturalQuestion({
      question: "nheb nzra3 tmatem fi torba w kifeh ns9i?",
    });
    expect(result.language).toBe("ar");
    expect(result.usedAgents).toContain("crop");
    expect(result.usedAgents).toContain("soil");
    expect(result.usedAgents).toContain("weather");
  });

  test("routes transliterated Tunisian disease and market questions", async () => {
    const disease = await answerAgriculturalQuestion({ question: "famma mardh fi tmatem?" });
    const market = await answerAgriculturalQuestion({ question: "ch9adeh sou9 tmatem?" });
    expect(disease.usedAgents).toContain("disease");
    expect(market.usedAgents).toContain("market");
  });

  test("keeps account identity and the newest operational records in bounded context", async () => {
    const records = [
      "Authenticated AgroGrowth account role=investor",
      "Farm A · 2 ha",
      ...Array.from({ length: 48 }, (_, index) => "Historical record " + index),
      "LIVE WEATHER FROM OPEN-METEO [provider=Open-Meteo; observation_time=2026-11-09T18:00]",
      "Latest sensor reading [recorded_at=2026-11-09T17:55]",
    ];
    const result = await answerAgriculturalQuestion({
      question: "Give me a farm and market briefing",
      context: { platformRecords: records },
    });
    const summary = result.contextSummary.join(" ");
    expect(summary).toContain("role=investor");
    expect(summary).toContain("LIVE WEATHER FROM OPEN-METEO");
    expect(summary).toContain("Latest sensor reading");
  });

  test("uses saved market and live weather records when the LLM is unavailable", async () => {
    const market = await answerAgriculturalQuestion({
      question: "What is the recorded tomato market price?",
      language: "en",
      context: {
        platformRecords: [
          "Recorded market price [crop=tomato; price=2.75 TND/kg; market=Kasserine; date=2026-11-09; source=verified-market-survey]. Historical recorded quote, not guaranteed live data.",
        ],
      },
    });
    const weather = await answerAgriculturalQuestion({
      question: "What is the current weather?",
      language: "en",
      context: {
        platformRecords: [
          "LIVE WEATHER FROM OPEN-METEO [observation_time=2026-11-09T18:00; provider=Open-Meteo; current_temperature=22.3 C; humidity=45%]. Real provider forecast, not an on-farm sensor measurement.",
        ],
      },
    });
    expect(market.dataSource).toBe("rule-based");
    expect(market.answer).toContain("2.75 TND/kg");
    expect(weather.answer).toContain("current_temperature=22.3 C");
    expect(weather.answer).toContain("Open-Meteo");
  });

  test("does not invent market prices in rule-based mode", async () => {
    const result = await answerAgriculturalQuestion({
      question: "ما هي أسعار السوق اليوم؟",
    });
    expect(result.usedAgents).toContain("market");
    expect(result.answer).not.toMatch(/\d+(\.\d+)?\s*(د\.ت|TND|USD)/);
  });
});

describe("answerAgriculturalQuestion — localisation", () => {
  const ARABIC_SCRIPT = /[\u0600-\u06FF]/;

  test("answers a French crop question entirely in French", async () => {
    const result = await answerAgriculturalQuestion({
      question: "Quelle culture convient à un sol argileux avec peu de pluie ?",
      language: "fr",
      context: { temperature: 22, rainfall: 300 },
    });
    expect(result.language).toBe("fr");
    expect(result.answer).toMatch(/Cultures les mieux adaptées/);
    expect(result.answer).toMatch(/adéquation/);
    expect(result.answer).toMatch(/besoin en eau/);
    // The rule-based body must not leak untranslated Arabic for a French caller.
    expect(result.answer).not.toMatch(ARABIC_SCRIPT);
    expect(result.disclaimer).not.toMatch(ARABIC_SCRIPT);
  });

  test("answers an English crop question entirely in English", async () => {
    const result = await answerAgriculturalQuestion({
      question: "Which crop suits clay soil with low rainfall?",
      language: "en",
      context: { temperature: 22, rainfall: 300 },
    });
    expect(result.language).toBe("en");
    expect(result.answer).toMatch(/Crops best suited/);
    expect(result.answer).toMatch(/suitability/);
    expect(result.answer).not.toMatch(ARABIC_SCRIPT);
    expect(result.disclaimer).not.toMatch(ARABIC_SCRIPT);
  });

  test("still answers Arabic questions in Arabic", async () => {
    const result = await answerAgriculturalQuestion({
      question: "ما أفضل محصول لتربة طينية؟",
      language: "ar",
      context: { temperature: 22, rainfall: 300 },
    });
    expect(result.language).toBe("ar");
    expect(result.answer).toMatch(/المحاصيل الأنسب/);
  });
});
