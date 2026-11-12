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
      Promise.resolve({ data: rows[key] ?? [], count: counts[key] ?? 0, error: null }).then(resolve),
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
} from "../../server/routes/admin-panel";

function app() {
  const a = express();
  a.use(express.json());
  a.get("/api/admin/system-metrics", getAdminSystemMetrics);
  a.get("/api/admin/usage-analytics", getAdminUsageAnalytics);
  a.get("/api/admin/security-events", getAdminSecurityEvents);
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
