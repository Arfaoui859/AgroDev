/**
 * Admin-token verification tests.
 *
 * The privileged maintenance endpoints (admin user provisioning, password reset,
 * auth debug) accept an `x-admin-token` header. Verification must be
 * constant-time and must prefer the dedicated ADMIN_API_TOKEN, while still
 * accepting the legacy SUPABASE_SERVICE_ROLE_KEY for existing clients.
 */
import { verifyAdminToken, timingSafeEqualStr } from "../../server/lib/adminAuth";

function fakeReq(token?: string): any {
  return { header: (name: string) => (name === "x-admin-token" ? token : undefined) };
}

const KEYS = ["ADMIN_API_TOKEN", "SUPABASE_SERVICE_ROLE_KEY"] as const;
const SAVED: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of KEYS) {
    SAVED[k] = process.env[k];
    delete process.env[k];
  }
});

afterEach(() => {
  for (const k of KEYS) {
    if (SAVED[k] === undefined) delete process.env[k];
    else process.env[k] = SAVED[k];
  }
});

describe("🔐 verifyAdminToken", () => {
  test("accepts a matching ADMIN_API_TOKEN", () => {
    process.env.ADMIN_API_TOKEN = "correct-horse";
    expect(verifyAdminToken(fakeReq("correct-horse"))).toBe(true);
  });

  test("rejects a wrong ADMIN_API_TOKEN", () => {
    process.env.ADMIN_API_TOKEN = "correct-horse";
    expect(verifyAdminToken(fakeReq("wrong"))).toBe(false);
  });

  test("accepts SUPABASE_SERVICE_ROLE_KEY as a legacy fallback", () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
    expect(verifyAdminToken(fakeReq("service-role-key"))).toBe(true);
  });

  test("ADMIN_API_TOKEN matches independently of the service-role key", () => {
    process.env.ADMIN_API_TOKEN = "admin-only";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
    expect(verifyAdminToken(fakeReq("admin-only"))).toBe(true);
    expect(verifyAdminToken(fakeReq("service-role-key"))).toBe(true);
    expect(verifyAdminToken(fakeReq("neither"))).toBe(false);
  });

  test("rejects everything when no secret is configured", () => {
    expect(verifyAdminToken(fakeReq("anything"))).toBe(false);
  });

  test("rejects a missing or empty header", () => {
    process.env.ADMIN_API_TOKEN = "correct-horse";
    expect(verifyAdminToken(fakeReq(undefined))).toBe(false);
    expect(verifyAdminToken(fakeReq(""))).toBe(false);
  });

  test("a wrong-length token is rejected without throwing", () => {
    process.env.ADMIN_API_TOKEN = "correct-horse";
    expect(verifyAdminToken(fakeReq("short"))).toBe(false);
    expect(verifyAdminToken(fakeReq("correct-horse-and-then-some"))).toBe(false);
  });
});

describe("🔐 timingSafeEqualStr", () => {
  test("matches equal strings and rejects unequal ones", () => {
    expect(timingSafeEqualStr("abc", "abc")).toBe(true);
    expect(timingSafeEqualStr("abc", "abd")).toBe(false);
    expect(timingSafeEqualStr("abc", "abcd")).toBe(false);
    expect(timingSafeEqualStr("", "")).toBe(true);
  });
});
