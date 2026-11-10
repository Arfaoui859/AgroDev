/**
 * Admin-token verification tests.
 *
 * The privileged maintenance endpoints (admin user provisioning, password reset,
 * auth debug) accept an `x-admin-token` header. Verification must be
 * constant-time and must accept only the dedicated ADMIN_API_TOKEN. The
 * Supabase service-role key must never be accepted as an HTTP credential.
 */
import { verifyAdminToken, timingSafeEqualStr } from "../../server/lib/adminAuth";
import { ADMIN_EMAIL_PATTERN } from "../../server/routes/admin-create-user";

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

  test("rejects SUPABASE_SERVICE_ROLE_KEY as an HTTP credential", () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
    expect(verifyAdminToken(fakeReq("service-role-key"))).toBe(false);
  });

  test("ADMIN_API_TOKEN is independent of the service-role key", () => {
    process.env.ADMIN_API_TOKEN = "admin-only";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
    expect(verifyAdminToken(fakeReq("admin-only"))).toBe(true);
    expect(verifyAdminToken(fakeReq("service-role-key"))).toBe(false);
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


describe("admin provisioning email validation", () => {
  test.each(["admin@example.com", "sami.arfaoui+agro@neuroforge.tn"])(
    "accepts valid email %s",
    (email) => expect(ADMIN_EMAIL_PATTERN.test(email)).toBe(true),
  );

  test.each(["", "not-an-email", "admin@", "@example.com", "admin @example.com", "admin@example"])(
    "rejects invalid email %s",
    (email) => expect(ADMIN_EMAIL_PATTERN.test(email)).toBe(false),
  );
});
