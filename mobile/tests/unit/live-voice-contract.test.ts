import { readFileSync } from "node:fs";
import { join } from "node:path";

const nativePath = join(process.cwd(), "src/services/liveVoiceSession.ts");
const webPath = join(process.cwd(), "src/services/liveVoiceSession.web.ts");

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
    expect(declaredTools(nativeSource)).toHaveLength(12);
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

  it("keeps verified farm context and persisted memory in both prompts", () => {
    for (const source of [nativeSource, webSource]) {
      expect(source).toContain("verifiedFarmContext");
      expect(source).toContain("personalMemoryContext");
      expect(source).toContain("remember_user_memory");
      expect(source).toContain("forget_user_memory");
      expect(source).toContain("لا تستنتج قيماً ناقصة");
    }
  });
});
