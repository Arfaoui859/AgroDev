/**
 * Provenance classification tests.
 *
 * The UI must never present a rule-based or device-computed fallback as a model
 * prediction. These lock down the mapping from the wire tags the server emits
 * (dataSource / isRealData / modelSource) to the banner the farmer sees.
 */
import { classifyProvenance } from "../../client/lib/provenance";

describe("classifyProvenance", () => {
  test("a real model result is 'real'", () => {
    expect(classifyProvenance({ dataSource: "llm", isRealData: true })).toBe("real");
    expect(classifyProvenance({ dataSource: "vision-service", isRealData: true })).toBe("real");
  });

  test("isRealData=false is never 'real'", () => {
    expect(classifyProvenance({ dataSource: "heuristic", isRealData: false })).toBe("engine");
    expect(classifyProvenance({ dataSource: "synthetic-demo", isRealData: false })).toBe("engine");
    expect(classifyProvenance({ dataSource: "estimate", isRealData: false })).toBe("estimate");
  });

  test("rule-based engine output is 'engine'", () => {
    expect(classifyProvenance({ dataSource: "rule-based" })).toBe("engine");
  });

  test("microservice output counts as real model output", () => {
    expect(classifyProvenance({ dataSource: "microservice" })).toBe("real");
  });

  test("client-computed estimate is 'estimate'", () => {
    expect(classifyProvenance({ dataSource: "estimate" })).toBe("estimate");
  });

  test("unknown sources degrade to 'unknown'", () => {
    expect(classifyProvenance({})).toBe("unknown");
    expect(classifyProvenance(null)).toBe("unknown");
  });

  test("isRealData wins over a misleading source string", () => {
    expect(classifyProvenance({ dataSource: "llm", isRealData: false })).toBe("engine");
  });
});
