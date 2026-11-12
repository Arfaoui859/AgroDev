/**
 * Server-side model-provenance classifier.
 *
 * Regression guard for the defect where `deterministic-rules` (the source the
 * soil service declares) was NOT matched by the old `HEURISTIC_MARKERS` regex.
 * The gateway compensated with a second regex, but `microserviceProxy` did not,
 * so a deterministic-rule service could be labelled `isRealData: true`.
 *
 * The classification is now centralised; every consumer must agree that
 * `deterministic-rules` is a rule engine — never a trained ML model.
 */
import {
  classifyModelSource,
  isSyntheticModelSource,
  isNonModelSource,
  isTrainedModelSource,
  provenanceDataSource,
} from "../../server/services/providers/modelProvenance";

describe("model provenance classification", () => {
  test("deterministic-rules is a rule engine, never trained ML", () => {
    expect(classifyModelSource("deterministic-rules")).toBe("rule-based");
    expect(isNonModelSource("deterministic-rules")).toBe(true);
    expect(isTrainedModelSource("deterministic-rules")).toBe(false);
    expect(isSyntheticModelSource("deterministic-rules")).toBe(false);
  });

  test("all deterministic-* variants are rule-based", () => {
    for (const source of [
      "deterministic-rules",
      "deterministic_visual_analysis",
      "deterministic-financial-rules",
      "rule-based",
      "knowledge-engine",
      "symptom-keyword-rules",
    ]) {
      expect(classifyModelSource(source)).toBe("rule-based");
    }
  });

  test("a source that is both rule-based and demo is labelled synthetic", () => {
    // "rule-based-demo" contains a demo marker, and the platform has always
    // treated demo output as synthetic. Preserved deliberately.
    expect(classifyModelSource("rule-based-demo")).toBe("synthetic");
  });

  test("synthetic / heuristic / demo sources are synthetic", () => {
    for (const source of [
      "synthetic-demo",
      "synthetic-demo-disabled",
      "heuristic-demo",
      "mock-model",
      "placeholder",
      "random",
    ]) {
      expect(classifyModelSource(source)).toBe("synthetic");
      expect(isSyntheticModelSource(source)).toBe(true);
    }
  });

  test("llm providers are llm", () => {
    for (const source of ["gemini:gemini-flash-lite-latest", "openrouter:qwen", "llm-advisory", "ollama:qwen2.5"]) {
      expect(classifyModelSource(source)).toBe("llm");
    }
  });

  test("genuine trained-model sources are trained", () => {
    for (const source of [
      "mobilenetv3-plantvillage-v1",
      "field-validated-v2",
      "lab-assisted-production-v1",
    ]) {
      expect(classifyModelSource(source)).toBe("trained");
      expect(isTrainedModelSource(source)).toBe(true);
      expect(isNonModelSource(source)).toBe(false);
    }
  });

  test("a vision-model provenance is a trained model, not an llm", () => {
    // Guards against an over-broad LLM regex swallowing "vision-model".
    expect(classifyModelSource("provider:test-vision-model")).toBe("trained");
  });

  test("missing / empty source is unknown and never 'real'", () => {
    expect(classifyModelSource(null)).toBe("unknown");
    expect(classifyModelSource(undefined)).toBe("unknown");
    expect(classifyModelSource("")).toBe("unknown");
    expect(isNonModelSource(null)).toBe(true);
    expect(isNonModelSource("")).toBe(true);
  });

  test("dataSource mapping is stable", () => {
    expect(provenanceDataSource("trained")).toBe("trained-model");
    expect(provenanceDataSource("rule-based")).toBe("rule-based");
    expect(provenanceDataSource("synthetic")).toBe("heuristic");
    expect(provenanceDataSource("llm")).toBe("llm-generated");
    expect(provenanceDataSource("unknown")).toBe("unavailable");
  });
});
