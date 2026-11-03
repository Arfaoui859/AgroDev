/**
 * Provenance reader tests.
 *
 * Market prices are synthetic but the UI renders them as authoritative TND
 * figures, so the header/body provenance contract is the only thing standing
 * between a farmer and a fake live price. These tests pin that contract.
 */
import {
  isSimulatedData,
  needsProvenanceLabel,
  readProvenance,
  SIMULATED_MARKET_DISCLAIMER_AR,
} from "../../client/lib/dataProvenance";

function headers(map: Record<string, string>) {
  const lower: Record<string, string> = {};
  for (const [k, v] of Object.entries(map)) lower[k.toLowerCase()] = v;
  return { get: (name: string) => lower[name.toLowerCase()] ?? null };
}

describe("readProvenance", () => {
  it("reads simulated provenance from the X-Data-Provenance header (array body)", () => {
    const p = readProvenance(
      headers({ "X-Data-Provenance": "simulated", "X-Is-Real-Data": "false" }),
      [{ id: "olive", currentPrice: 3.2 }],
    );
    expect(p.dataSource).toBe("simulated");
    expect(p.isRealData).toBe(false);
    expect(p.simulated).toBe(true);
    expect(needsProvenanceLabel(p)).toBe(true);
  });

  it("reads provenance embedded in an object body", () => {
    const p = readProvenance(null, {
      dataSource: "simulated",
      isRealData: false,
      disclaimer: SIMULATED_MARKET_DISCLAIMER_AR,
    });
    expect(p.simulated).toBe(true);
    expect(p.disclaimer).toBe(SIMULATED_MARKET_DISCLAIMER_AR);
  });

  it("does not label a genuine live feed as simulated", () => {
    const p = readProvenance(
      headers({ "X-Data-Provenance": "live", "X-Is-Real-Data": "true" }),
      [{ id: "olive" }],
    );
    expect(p.isRealData).toBe(true);
    expect(p.simulated).toBe(false);
    expect(needsProvenanceLabel(p)).toBe(false);
  });

  it("treats a missing header as unknown, not as simulated", () => {
    const p = readProvenance(headers({}), [{ id: "olive" }]);
    expect(p.dataSource).toBeUndefined();
    expect(p.isRealData).toBeUndefined();
    expect(p.simulated).toBe(false);
  });

  it("body provenance wins over the header", () => {
    const p = readProvenance(
      headers({ "X-Data-Provenance": "live", "X-Is-Real-Data": "true" }),
      { dataSource: "simulated", isRealData: false },
    );
    expect(p.dataSource).toBe("simulated");
    expect(p.simulated).toBe(true);
  });

  it("ignores array bodies for field extraction (arrays carry no fields)", () => {
    const p = readProvenance(headers({ "X-Data-Provenance": "simulated" }), [
      { dataSource: "live" },
    ]);
    expect(p.dataSource).toBe("simulated");
    expect(p.simulated).toBe(true);
  });

  it("survives a null/undefined headers object", () => {
    expect(() => readProvenance(undefined, {})).not.toThrow();
    expect(readProvenance(null, {}).simulated).toBe(false);
  });
});

describe("isSimulatedData", () => {
  it("is true whenever isRealData is explicitly false", () => {
    expect(isSimulatedData(undefined, false)).toBe(true);
    expect(isSimulatedData("live", false)).toBe(true);
  });

  it("recognises synthetic source strings", () => {
    for (const src of [
      "simulated",
      "synthetic-model",
      "demo",
      "mock",
      "fake",
      "placeholder",
      "SIMULATED",
    ]) {
      expect(isSimulatedData(src, undefined)).toBe(true);
    }
  });

  it("does not flag real or unknown sources", () => {
    expect(isSimulatedData("live", true)).toBe(false);
    expect(isSimulatedData("model", undefined)).toBe(false);
    expect(isSimulatedData(undefined, undefined)).toBe(false);
  });
});
