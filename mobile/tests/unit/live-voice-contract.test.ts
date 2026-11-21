import { readFileSync } from "node:fs";
import { join } from "node:path";

const nativePath = join(__dirname, "../../src/services/liveVoiceSession.ts");
const webPath = join(__dirname, "../../src/services/liveVoiceSession.web.ts");
const modalPath = join(__dirname, "../../src/components/assistant/LiveVoiceCallModal.tsx");

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
  const modalSource = readSource(modalPath);

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
      expect(source).toContain("containsCommodityAlias");
      expect(source).toContain("matchTerms.some((term) => containsCommodityAlias(searchable, term))");
      expect(source).not.toContain("/api/agro-market/intelligence?period=");
    }
  });


  it("keeps market commodity aliases identical and separates olive fruit from olive oil", () => {
    const extractAliases = (source: string) =>
      source.match(/const\s+commodityAliases: Record<string, string\[]> = \{[\s\S]*?\n\s{8}\};/)?.[0] ?? "";
    const nativeAliases = extractAliases(nativeSource);
    const webAliases = extractAliases(webSource);

    expect(nativeAliases).toBeTruthy();
    expect(nativeAliases).toBe(webAliases);
    expect(nativeAliases).toContain('olive_oil: ["زيت الزيتون"');
    expect(nativeAliases).toContain('olive: ["زيتون"');
    expect(nativeAliases).toContain("tomato:");
    expect(nativeAliases).toContain("onion:");
    expect(nativeAliases).toContain("grape:");
    expect(nativeAliases).toContain("pomegranate:");
  });

  it("does not end Android voice startup when the microphone permission dialog backgrounds the app", () => {
    expect(modalSource).toContain("!startInProgressRef.current && stateRef.current !== \"connecting\"");
    expect(modalSource).toContain("if (AppState.currentState === \"background\" && sessionRef.current === session)");
    expect(modalSource).toContain("Every opening starts with a clean UI state");
  });

  it("requests and captures user and assistant speech transcription while keeping audio-only replies", () => {
    for (const source of [nativeSource, webSource]) {
      expect(source).toContain("responseModalities: [\"AUDIO\"]");
      expect(source).toContain("inputAudioTranscription: {}");
      expect(source).toContain("outputAudioTranscription: {}");
      expect(source).toContain("serverContent.inputTranscription?.text");
      expect(source).toContain("serverContent.outputTranscription?.text");
      expect(source).toContain("onTranscript?.(\"user\"");
      expect(source).toContain("onTranscript?.(\"assistant\"");
      expect(source).toContain("conversationHistory");
    }
  });

  it("streams microphone audio continuously and delegates turn detection to Gemini Live on native and web", () => {
    for (const source of [nativeSource, webSource]) {
      expect(source).toContain('mimeType: "audio/pcm;rate=16000"');
      expect(source).toContain("realtimeInput: {");
      expect(source).toContain("this.callbacks.onState(\"thinking\")");
      expect(source).not.toContain("automaticActivityDetection: { disabled: true }");
      expect(source).not.toContain("activityStart: {}");
      expect(source).not.toContain("activityEnd: {}");
      expect(source).not.toContain("SPEECH_RMS_THRESHOLD");
      expect(source).not.toContain("END_SILENCE_MS");
    }
  });

  it("does not reset the user's saved conversation context when a new live session starts", () => {
    expect(modalSource).toContain("conversationHistory,");
    expect(modalSource).toContain("onTranscript,");
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
