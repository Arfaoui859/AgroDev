/**
 * Opt-in REAL provider smoke tests.
 *
 * These tests make real network calls and consume real quota, so they are
 * skipped by default. Enable explicitly:
 *
 *   AI_LIVE_TESTS=1 \
 *   AI_PROVIDER=openai AI_API_KEY=sk-... AI_MODEL=gpt-4o-mini \
 *   npm run test:live
 *
 * For a vision run also set AI_LIVE_VISION_TESTS=1 and provide an image at
 * AI_LIVE_TEST_IMAGE=/path/to/leaf.jpg (a real, approved test image).
 *
 * These tests assert on provenance and structure only — never on a specific
 * disease, since the model's answer is not deterministic. A pass here is the
 * only thing that may be reported as LIVE VERIFIED.
 */
import fs from "node:fs";
import {
  chatCompleteDetailed,
  isLLMConfigured,
  getLLMInfo,
} from "../../server/services/providers/llmProvider";
import {
  diagnosePlantImage,
  isVisionConfigured,
} from "../../server/services/providers/visionProvider";

const liveEnabled = process.env.AI_LIVE_TESTS === "1";
const visionEnabled = liveEnabled && process.env.AI_LIVE_VISION_TESTS === "1";
const describeLive = liveEnabled ? describe : describe.skip;
const describeVision = visionEnabled ? describe : describe.skip;

describeLive("🔴 LIVE text provider smoke test", () => {
  test("a minimal authenticated request returns a real answer with usage", async () => {
    expect(isLLMConfigured()).toBe(true);
    const info = getLLMInfo();

    const result = await chatCompleteDetailed(
      [
        { role: "system", content: "Answer in one short Arabic sentence." },
        { role: "user", content: "ما هو أفضل وقت لري الزيتون في تونس؟" },
      ],
      { maxTokens: 120, temperature: 0 },
    );

    console.log(
      `[live] provider=${result.provider} model=${result.model} latencyMs=${result.latencyMs} tokens=${result.usage.totalTokens}`,
    );
    expect(result.text.length).toBeGreaterThan(0);
    expect(result.provider).toBe(info.provider);
    expect(result.latencyMs).toBeGreaterThan(0);
  }, 60_000);
});

describeVision("🔴 LIVE vision provider smoke test", () => {
  test("a real image reaches the provider and returns a structured diagnosis", async () => {
    const imagePath = process.env.AI_LIVE_TEST_IMAGE;
    if (!imagePath) {
      throw new Error("Set AI_LIVE_TEST_IMAGE to an approved image path");
    }
    expect(isVisionConfigured()).toBe(true);

    const buffer = fs.readFileSync(imagePath);
    const result = await diagnosePlantImage({
      image: { buffer, mimetype: "image/jpeg" },
      cropType: "tomato",
      plantPart: "leaf",
      language: "ar",
    });

    console.log(
      `[live-vision] model=${result.modelSource} latencyMs=${result.latencyMs} confidence=${result.diagnosis.confidence}`,
    );
    expect(result.isRealData).toBe(true);
    expect(result.diagnosis.disease.length).toBeGreaterThan(0);
    expect(result.diagnosis.confidence).toBeGreaterThanOrEqual(0);
    expect(result.diagnosis.confidence).toBeLessThanOrEqual(1);
  }, 90_000);
});
