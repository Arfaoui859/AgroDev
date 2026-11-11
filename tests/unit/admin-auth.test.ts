/**
 * Admin-token verification tests.
 *
 * Privileged operator endpoints accept only the dedicated ADMIN_API_TOKEN.
 * The Supabase service-role key is never valid as an HTTP header credential.
 */
import { verifyAdminToken, timingSafeEqualStr } from "../../server/lib/adminAuth";

function fakeReq(token?: string): any {
  return { header: (name: string) => (name === "x-admin-token" ? token : undefined) };
}

const SAVED_ADMIN = process.env.ADMIN_API_TOKEN;
const SAVED_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

beforeEach(() => {
  delete process.env.ADMIN_API_TOKEN;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
});

afterEach(() => {
  if (SAVED_ADMIN === undefined) delete process.env.ADMIN_API_TOKEN;
  else process.env.ADMIN_API_TOKEN = SAVED_ADMIN;
  if (SAVED_SERVICE_ROLE === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY = SAVED_SERVICE_ROLE;
});

describe("verifyAdminToken", () => {
  test("accepts a matching dedicated ADMIN_API_TOKEN", () => {
    process.env.ADMIN_API_TOKEN = "correct-horse";
    expect(verifyAdminToken(fakeReq("correct-horse"))).toBe(true);
  });

  test("rejects a wrong ADMIN_API_TOKEN", () => {
    process.env.ADMIN_API_TOKEN = "correct-horse";
    expect(verifyAdminToken(fakeReq("wrong"))).toBe(false);
  });

  test("never accepts SUPABASE_SERVICE_ROLE_KEY as an HTTP token", () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
    expect(verifyAdminToken(fakeReq("service-role-key"))).toBe(false);
  });

  test("accepts only ADMIN_API_TOKEN even when both secrets are configured", () => {
    process.env.ADMIN_API_TOKEN = "admin-only";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
    expect(verifyAdminToken(fakeReq("admin-only"))).toBe(true);
    expect(verifyAdminToken(fakeReq("service-role-key"))).toBe(false);
    expect(verifyAdminToken(fakeReq("neither"))).toBe(false);
  });

  test("rejects everything when no dedicated token is configured", () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
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

describe("timingSafeEqualStr", () => {
  test("matches equal strings and rejects unequal ones", () => {
    expect(timingSafeEqualStr("abc", "abc")).toBe(true);
    expect(timingSafeEqualStr("abc", "abd")).toBe(false);
    expect(timingSafeEqualStr("abc", "abcd")).toBe(false);
    expect(timingSafeEqualStr("", "")).toBe(true);
  });
});
