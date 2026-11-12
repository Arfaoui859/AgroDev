/**
 * Comprehensive farm-management overview mapping.
 *
 * The dashboard used to serve random alerts, crops, weather, equipment and
 * payroll figures. These tests pin the replacement contract: every figure is
 * derived from the caller's own persisted rows, and a domain with no connected
 * source reports `null` / empty rather than an invented value.
 */
import { buildFarmOverview } from "../../server/routes/comprehensive-farm-management";

const empty = {
  farms: [],
  sections: [],
  cultivations: [],
  tasks: [],
  equipment: [],
  revenues: [],
  expenses: [],
  notifications: [],
  marketPrices: [],
  weather: null,
};

describe("buildFarmOverview", () => {
  it("reports zeros and nulls for a brand-new farmer with no records", () => {
    const out = buildFarmOverview(empty);
    expect(out.summary.totalFarms).toBe(0);
    expect(out.summary.totalFields).toBe(0);
    expect(out.summary.activeCrops).toBe(0);
    expect(out.summary.pendingTasks).toBe(0);
    expect(out.summary.criticalAlerts).toBe(0);
    expect(out.summary.operationalEquipment).toBe(0);
    // Not persisted anywhere -> never a fabricated number.
    expect(out.summary.workersPresent).toBeNull();
    expect(out.alerts).toEqual([]);
    expect(out.tasks).toEqual([]);
    expect(out.crops).toEqual([]);
    expect(out.market).toEqual([]);
    expect(out.weather).toBeNull();
  });

  it("counts only the caller's persisted rows and derives revenue from today", () => {
    const today = new Date().toISOString().slice(0, 10);
    const out = buildFarmOverview({
      ...empty,
      farms: [
        { id: "f1", name: "Farm A", size_hectares: 3.5, soil_type: "clay" },
        { id: "f2", name: "Farm B", size_hectares: 1.5 },
      ],
      sections: [{ id: "s1", farm_id: "f1" }, { id: "s2", farm_id: "f1" }],
      cultivations: [
        { id: "c1", crop_name: "Wheat", status: "active", area_hectares: 2 },
        { id: "c2", crop_name: "Olive", status: "harvested", area_hectares: 1 },
      ],
      tasks: [
        { id: "t1", title: "Irrigate", status: "pending", priority: "urgent", due_date: today },
        { id: "t2", title: "Spray", status: "completed", priority: "low" },
      ],
      equipment: [
        { id: "e1", status: "active" },
        { id: "e2", status: "maintenance" },
      ],
      revenues: [
        { id: "r1", amount: 250, revenue_date: today },
        { id: "r2", amount: 100, revenue_date: "2000-01-01" },
      ],
      notifications: [
        { id: "n1", title: "Pest", priority: "urgent", read_at: null, created_at: today },
        { id: "n2", title: "Read one", priority: "low", read_at: today, created_at: today },
      ],
    });
    expect(out.summary.totalFarms).toBe(2);
    expect(out.summary.totalArea).toBe(5);
    expect(out.summary.totalFields).toBe(2);
    expect(out.summary.activeCrops).toBe(1);
    expect(out.summary.pendingTasks).toBe(1);
    expect(out.summary.criticalAlerts).toBe(1);
    expect(out.summary.operationalEquipment).toBe(1);
    expect(out.summary.todayRevenue).toBe(250);
    // Only the unread alert is surfaced.
    expect(out.alerts).toHaveLength(1);
    expect(out.alerts[0].severity).toBe("critical");
  });

  it("keeps a single latest market quote per crop and never invents a change", () => {
    const out = buildFarmOverview({
      ...empty,
      marketPrices: [
        { id: "p1", crop_name: "Wheat", price_per_kg: 1.2, price_date: "2026-11-10", market_location: "Tunis", currency: "TND" },
        { id: "p2", crop_name: "Wheat", price_per_kg: 1.1, price_date: "2026-11-01", market_location: "Tunis", currency: "TND" },
        { id: "p3", crop_name: "Olive", price_per_kg: 5.5, price_date: "2026-11-09", market_location: "Sfax", currency: "TND" },
      ],
    });
    expect(out.market).toHaveLength(2);
    const wheat = out.market.find((m) => m.cropName === "Wheat")!;
    expect(wheat.currentPrice).toBe(1.2);
    expect(wheat.priceChange).toBeNull();
  });

  it("reports stored weather as real and never fabricates a forecast", () => {
    const out = buildFarmOverview({
      ...empty,
      weather: {
        temperature_celsius: 24,
        humidity_percent: 55,
        wind_speed_kmh: 12,
        pressure_hpa: 1013,
        uv_index: 6,
        weather_conditions: "clear",
        source: "open-meteo",
        record_date: "2026-11-11",
      },
    });
    expect(out.weather?.current.temperature).toBe(24);
    expect(out.weather?.current.condition).toBe("clear");
    expect(out.weather?.forecast).toEqual([]);
    expect(out.weather?.alerts).toEqual([]);
  });

  it("nulls crop telemetry it has no persisted source for", () => {
    const out = buildFarmOverview({
      ...empty,
      cultivations: [{ id: "c1", crop_name: "Wheat", status: "active" }],
    });
    expect(out.crops[0].soilMoisture).toBeNull();
    expect(out.crops[0].healthScore).toBeNull();
  });

  it("derives equipment status from rows but nulls telemetry it never stored", () => {
    const out = buildFarmOverview({
      ...empty,
      equipment: [
        { id: "e1", name: "Tractor", category: "tractor", status: "active" },
        { id: "e2", name: "Pump", status: "maintenance" },
      ],
    });
    expect(out.equipment).toHaveLength(2);
    expect(out.equipment[0].status).toBe("active");
    expect(out.equipment[0].type).toBe("tractor");
    // No usage/fuel/next-maintenance columns exist -> never invented.
    expect(out.equipment[0].usage).toBeNull();
    expect(out.equipment[0].fuel).toBeNull();
    expect(out.equipment[0].nextMaintenance).toBeNull();
    expect(out.summary.operationalEquipment).toBe(1);
  });

  it("computes financial totals from expenses and revenues, null margin without revenue", () => {
    const withRevenue = buildFarmOverview({
      ...empty,
      revenues: [{ id: "r1", amount: 1000 }, { id: "r2", amount: 500 }],
      expenses: [{ id: "x1", amount: 300 }],
    });
    expect(withRevenue.financial.totalRevenue).toBe(1500);
    expect(withRevenue.financial.totalExpenses).toBe(300);
    expect(withRevenue.financial.netProfit).toBe(1200);
    expect(withRevenue.financial.profitMargin).toBeCloseTo(80, 5);

    const noRevenue = buildFarmOverview({
      ...empty,
      expenses: [{ id: "x1", amount: 300 }],
    });
    expect(noRevenue.financial.profitMargin).toBeNull();
    expect(noRevenue.financial.netProfit).toBe(-300);
  });
});
