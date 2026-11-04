/**
 * Caller-scoped Supabase client regression tests.
 *
 * The per-user tables (farms, farm_sections, soil_analyses, crop_recommendations)
 * carry RLS policies keyed on auth.uid(). A client built with only the anon key
 * evaluates those policies with auth.uid() = NULL, so reads return zero rows and
 * writes are denied — the farmer's own data is unreachable through the API.
 *
 * createScopedClient must attach the caller's verified access token so PostgREST
 * evaluates the policies as that user. These tests pin that contract.
 */
import { createClient } from "@supabase/supabase-js";

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({ mocked: true })),
}));

const URL = "https://example.supabase.co";
const ANON = "anon-key";

describe("🔐 Caller-scoped Supabase client", () => {
  let lib: typeof import("../../server/lib/supabase");

  beforeAll(() => {
    process.env.SUPABASE_URL = URL;
    process.env.SUPABASE_ANON_KEY = ANON;
    lib = require("../../server/lib/supabase");
  });

  beforeEach(() => {
    (createClient as jest.Mock).mockClear();
  });

  test("attaches the caller's token as a bearer header", () => {
    const client = lib.createScopedClient("user-jwt");
    expect(client).not.toBeNull();
    expect(createClient).toHaveBeenCalledWith(
      URL,
      ANON,
      expect.objectContaining({
        global: { headers: { Authorization: "Bearer user-jwt" } },
        auth: { persistSession: false, autoRefreshToken: false },
      }),
    );
  });

  test("returns null without a token, so callers use the anon client", () => {
    expect(lib.createScopedClient(undefined)).toBeNull();
    expect(lib.createScopedClient(null)).toBeNull();
    expect(lib.createScopedClient("")).toBeNull();
  });

  test("parses a Bearer Authorization header into a scoped client", () => {
    const client = lib.scopedClientFromAuthHeader("Bearer abc.def.ghi");
    expect(client).not.toBeNull();
    expect(createClient).toHaveBeenCalledWith(
      URL,
      ANON,
      expect.objectContaining({
        global: { headers: { Authorization: "Bearer abc.def.ghi" } },
      }),
    );
  });

  test("rejects a malformed or missing Authorization header", () => {
    expect(lib.scopedClientFromAuthHeader(undefined)).toBeNull();
    expect(lib.scopedClientFromAuthHeader("")).toBeNull();
    expect(lib.scopedClientFromAuthHeader("Basic xyz")).toBeNull();
    expect(lib.scopedClientFromAuthHeader("Bearer")).toBeNull();
    // The anon key must never be reused as a user identity.
    expect(createClient).not.toHaveBeenCalledWith(
      URL,
      ANON,
      expect.objectContaining({ global: { headers: { Authorization: `Bearer ${ANON}` } } }),
    );
  });
});
