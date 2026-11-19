import { readFileSync } from "node:fs";
import { join } from "node:path";

const nativePath = join(__dirname, "../../src/services/liveVoiceSession.ts");
const webPath = join(__dirname, "../../src/services/liveVoiceSession.web.ts");

function readSource(path: string): string {
  return readFileSync(path, "utf8");
}

function declaredTools(source: string): string[] {
  return [...source.matchAll(/^\s+name:\s*"([a-z][a-z0-9_]*)",/gm)]
    .map((match) => match[1])
    .sort();
}

function explicitlyHandledTools(source: string): string[] {
  return [...source.matchAll(/call\.name\s*===?\s*"([a-z][a-z0-9_]*)"/g)]
    .map((match) => match[1]);
}

describe("Gemini Live voice contract", () => {
  const nativeSource = readSource(nativePath);
  const webSource = readSource(webPath);

  it("keeps native and web function declarations in sync", () => {
    expect(declaredTools(nativeSource)).toEqual(declaredTools(webSource));
    expect(declaredTools(nativeSource)).toHaveLength(13);
  });

  it("has a client handler for every declared tool", () => {
    for (const [platform, source] of [
      ["native", nativeSource],
      ["web", webSource],
    ] as const) {
      const declarations = declaredTools(source);
      const handlers = new Set(explicitlyHandledTools(source));

      // get_weather is intentionally handled by the final generic weather
      // branch rather than a call.name === guard.
      handlers.add("get_weather");

      expect({
        platform,
        missingHandlers: declarations.filter((name) => !handlers.has(name)),
      }).toEqual({ platform, missingHandlers: [] });
    }
  });

  it("queries and filters market observations by the requested commodity on native and web", () => {
    for (const source of [nativeSource, webSource]) {
      expect(source).toContain("/api/agro-market/prices?");
      expect(source).toContain("commodity_name");
      expect(source).toContain("NO_MATCHING_COMMODITY_OBSERVATIONS");
      expect(source).toContain("withinPeriod");
      expect(source).not.toContain("/api/agro-market/intelligence?period=");
    }
  });

  it("keeps verified farm context and persisted memory in both prompts", () => {
    for (const source of [nativeSource, webSource]) {
      expect(source).toContain("verifiedFarmContext");
      expect(source).toContain("personalMemoryContext");
      expect(source).toContain("remember_user_memory");
      expect(source).toContain("forget_user_memory");
      expect(source).toContain("consult_agrogrowth_platform");
      expect(source).toContain("/api/ai/assistant/chat");
      expect(source).toContain("timeoutMs: 90_000");
      expect(source).toContain("لا تستنتج قيماً ناقصة");
    }
  });
});
