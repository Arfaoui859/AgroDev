import express from "express";
import request from "supertest";

/**
 * The admin system-metrics and usage-analytics endpoints previously returned a
 * blanket 503. System metrics are now measured from the Node process (real,
 * never estimated) and analytics are live counts from public.users/farms.
 * These tests pin the honesty contract:
 *  - metrics report verified provenance and measured numbers;
 *  - analytics reports revenue/retention as null rather than inventing values;
 *  - when the admin DB client is not configured, both still fail closed.
 */

let adminConfigured = true;
let counts: Record<string, number> = {};
let rows: Record<string, any[]> = {};
// Tables that should behave as if they do not exist (query returns an error).
let errorTables = new Set<string>();

function countBuilder(key: string) {
  const builder: any = {
    select: () => builder,
    eq: () => builder,
    in: () => builder,
    gte: () => builder,
    lt: () => builder,
    order: () => builder,
    limit: () => builder,
    // head:true count queries and row queries both await the builder.
    then: (resolve: (v: any) => unknown) =>
      Promise.resolve({
        data: errorTables.has(key) ? null : (rows[key] ?? []),
        count: errorTables.has(key) ? null : (counts[key] ?? 0),
        error: errorTables.has(key) ? { message: `relation "${key}" does not exist` } : null,
      }).then(resolve),
  };
  return builder;
}

jest.mock("../../server/lib/supabase", () => ({
  get isSupabaseAdminConfigured() {
    return adminConfigured;
  },
  get supabaseAdmin() {
    return adminConfigured
      ? {
          from: (table: string) => countBuilder(table),
        }
      : null;
  },
}));

import {
  getAdminSystemMetrics,
  getAdminUsageAnalytics,
  getAdminSecurityEvents,
  getAdminAgentMonitoring,
} from "../../server/routes/admin-panel";

function app() {
  const a = express();
  a.use(express.json());
  a.get("/api/admin/system-metrics", getAdminSystemMetrics);
  a.get("/api/admin/usage-analytics", getAdminUsageAnalytics);
  a.get("/api/admin/security-events", getAdminSecurityEvents);
  a.get("/api/admin/agent-monitoring", getAdminAgentMonitoring);
  return a;
}

describe("admin system metrics", () => {
  beforeEach(() => {
    adminConfigured = true;
  });

  it("returns measured, verified metrics (never a blank 503)", async () => {
    const res = await request(app()).get("/api/admin/system-metrics");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.headers["x-agrogrowth-data-status"]).toBe("verified");
    expect(res.headers["x-agrogrowth-data-provenance"]).toBe("node-process");
    const server = res.body.data.server;
    expect(typeof server.cpuUsage).toBe("number");
    expect(server.cpuUsage).toBeGreaterThanOrEqual(0);
    expect(typeof server.memoryUsage).toBe("number");
    expect(typeof server.eventLoopLagMs).toBe("number");
    expect(server.cpuCount).toBeGreaterThan(0);
    expect(server.nodeVersion).toMatch(/^v\d+\./);
    expect(typeof server.uptimeSeconds).toBe("number");
  });
});

describe("admin usage analytics", () => {
  beforeEach(() => {
    adminConfigured = true;
    counts = { users: 10, farms: 3 };
  });

  it("reports live counts and leaves unconnected figures null", async () => {
    const res = await request(app()).get("/api/admin/usage-analytics");
    expect(res.status).toBe(200);
    expect(res.headers["x-agrogrowth-data-status"]).toBe("verified");
    const data = res.body.data;
    expect(data.overview.totalUsers).toBe(10);
    expect(data.farms.total).toBe(3);
    // No billing/retention source is connected: must be null, not 0.
    expect(data.overview.retentionRate).toBeNull();
    expect(data.subscriptions.totalRevenue).toBeNull();
    expect(data.subscriptions.monthlyRecurringRevenue).toBeNull();
    expect(res.body.provenance.limitations.join(" ")).toMatch(/revenue/i);
  });

  it("fails closed when the admin DB client is not configured", async () => {
    adminConfigured = false;
    const res = await request(app()).get("/api/admin/usage-analytics");
    expect(res.status).toBe(503);
    expect(res.headers["x-agrogrowth-data-status"]).toBe("unavailable");
  });
});

describe("admin security events", () => {
  beforeEach(() => {
    adminConfigured = true;
    rows = {
      admin_audit_logs: [
        {
          id: "evt-1",
          actor_user_id: "admin-1",
          action: "user.role.changed",
          target_user_id: "user-2",
          created_at: "2026-01-01T00:00:00Z",
        },
      ],
    };
  });

  it("derives severity from the recorded audit action, not a guess", async () => {
    const res = await request(app()).get("/api/admin/security-events");
    expect(res.status).toBe(200);
    expect(res.headers["x-agrogrowth-data-status"]).toBe("verified");
    expect(res.body.data[0].event_type).toBe("user.role.changed");
    expect(res.body.data[0].severity).toBe("high");
  });
});

describe("admin agent monitoring", () => {
  beforeEach(() => {
    adminConfigured = true;
    rows = { ai_service_logs: [] };
    counts = { ai_service_logs: 0 };
    errorTables = new Set();
  });

  it("reports the real allow-listed specialist registry from the orchestrator", async () => {
    const res = await request(app()).get("/api/admin/agent-monitoring");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.headers["x-agrogrowth-data-status"]).toBe("verified");
    const { specialists, specialistCount } = res.body.data;
    // Must reflect the orchestrator's own allow-list, never a hand-kept list.
    expect(specialistCount).toBe(specialists.length);
    expect(specialistCount).toBeGreaterThanOrEqual(14);
    const ids = specialists.map((s: any) => s.id);
    for (const required of ["soil", "weather", "crop", "irrigation", "pest_control", "market"]) {
      expect(ids).toContain(required);
    }
    // Dependencies are reported so the UI can show the DAG honestly.
    const crop = specialists.find((s: any) => s.id === "crop");
    expect(Array.isArray(crop.dependsOn)).toBe(true);
  });

  it("reports real usage from ai_service_logs when the table exists", async () => {
    rows = {
      ai_service_logs: [
        { service_type: "soil_analysis", endpoint: "/predict", status_code: 200 },
        { service_type: "soil_analysis", endpoint: "/predict", status_code: 500 },
        { service_type: "crop_recommendation", endpoint: "/predict", status_code: 200 },
      ],
    };
    counts = { ai_service_logs: 42 };
    const res = await request(app()).get("/api/admin/agent-monitoring");
    expect(res.status).toBe(200);
    expect(res.body.data.usage.last24h).toBe(42);
    const soil = res.body.data.usage.byServiceType.find((r: any) => r.serviceType === "soil_analysis");
    expect(soil.calls).toBe(2);
    expect(soil.errors).toBe(1);
  });

  it("does not invent call volume when ai_service_logs is unavailable", async () => {
    errorTables = new Set(["ai_service_logs"]);
    const res = await request(app()).get("/api/admin/agent-monitoring");
    expect(res.status).toBe(200);
    // Absent table → usage stays null, never a fabricated zero/positive count.
    expect(res.body.data.usage).toBeNull();
    expect(res.body.provenance.limitations.join(" ")).toMatch(/ai_service_logs/i);
  });

  it("fails closed without throwing when the admin client is absent", async () => {
    adminConfigured = false;
    const res = await request(app()).get("/api/admin/agent-monitoring");
    expect(res.status).toBe(200);
    // Registry is code-level, so it is still reported; usage is simply absent.
    expect(res.body.data.specialistCount).toBeGreaterThanOrEqual(14);
    expect(res.body.data.usage).toBeNull();
  });
});
