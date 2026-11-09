import { buildFarmAgentEvents } from "../../server/services/ai/autonomousFarmAgent";

describe("Autonomous Farm Agent event evaluation", () => {
  const now = new Date("2026-11-09T12:00:00.000Z");

  test("creates a transparent soil-baseline reminder only when no soil record exists", () => {
    const events = buildFarmAgentEvents({
      farms: [{ id: "farm-1", name: "North field" }],
      cultivations: [],
      soilAnalyses: [],
      sensors: [],
      now,
    });
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("agent_soil_baseline_missing");
    expect(events[0].evidence.evidence).toBe("no_verified_soil_analysis_record");
    expect(events[0].key).toBe("soil-baseline:farm-1:2026-11-09");
  });

  test("reminds about a recorded harvest date within seven days", () => {
    const events = buildFarmAgentEvents({
      farms: [{ id: "farm-1", name: "North field" }],
      cultivations: [{
        id: "crop-1",
        farm_id: "farm-1",
        crop_name: "tomato",
        expected_harvest_date: "2026-11-13",
        status: "active",
      }],
      soilAnalyses: [{ id: "soil-1", farm_id: "farm-1", analyzed_at: "2026-11-01T00:00:00Z" }],
      sensors: [],
      now,
    });
    expect(events.some((event) => event.type === "agent_harvest_upcoming")).toBe(true);
    expect(events.find((event) => event.type === "agent_harvest_upcoming")?.evidence.days_until_harvest).toBe(4);
  });

  test("flags a passed expected harvest date without claiming the crop is lost", () => {
    const events = buildFarmAgentEvents({
      farms: [{ id: "farm-1", name: "North field" }],
      cultivations: [{
        id: "crop-2",
        farm_id: "farm-1",
        crop_name: "wheat",
        expected_harvest_date: "2026-11-04",
        status: "active",
      }],
      soilAnalyses: [{ id: "soil-1", farm_id: "farm-1", analyzed_at: "2026-11-01T00:00:00Z" }],
      sensors: [],
      now,
    });
    expect(events.some((event) => event.type === "agent_harvest_date_passed")).toBe(true);
    expect(events.find((event) => event.type === "agent_harvest_date_passed")?.message).toContain("حدّث حالة المحصول");
  });

  test("reports inactive and low-battery sensors using their stored values", () => {
    const events = buildFarmAgentEvents({
      farms: [{ id: "farm-1", name: "North field" }],
      cultivations: [],
      soilAnalyses: [],
      sensors: [{
        id: "sensor-1",
        farm_id: "farm-1",
        device_id: "S-01",
        status: "inactive",
        battery_level: 8,
      }],
      now,
    });
    expect(events.map((event) => event.type)).toEqual(expect.arrayContaining([
      "agent_sensor_inactive",
      "agent_sensor_battery_low",
    ]));
    expect(events.find((event) => event.type === "agent_sensor_battery_low")?.evidence.battery_level_percent).toBe(8);
  });

  test("does not invent harvest or sensor alerts when records are missing", () => {
    const events = buildFarmAgentEvents({
      farms: [{ id: "farm-1", name: "North field" }],
      cultivations: [{ id: "crop-1", farm_id: "farm-1", crop_name: "olive", status: "active" }],
      soilAnalyses: [{ id: "soil-1", farm_id: "farm-1", analyzed_at: "2026-11-01T00:00:00Z" }],
      sensors: [],
      now,
    });
    expect(events).toEqual([]);
  });
});
