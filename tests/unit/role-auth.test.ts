import { requireRole } from "../../server/middleware/auth";
import { supabaseAdmin } from "../../server/lib/supabase";

jest.mock("../../server/lib/supabase", () => ({
  supabase: null,
  supabaseAdmin: { from: jest.fn() },
}));

const mockedAdmin = supabaseAdmin as unknown as {
  from: jest.Mock;
};
const maybeSingle = jest.fn();

function request(identitySource: "jwt" | "demo" = "jwt") {
  return { userId: "user-123", identitySource } as any;
}

function response() {
  const res: any = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res;
}

async function runRoleGuard(role: string | null, allowed: string[], identity = "jwt") {
  maybeSingle.mockResolvedValue({
    data: role ? { role } : null,
    error: null,
  });
  mockedAdmin.from.mockReturnValue({
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({ maybeSingle }),
    }),
  });

  const req = request(identity as "jwt" | "demo");
  const res = response();
  const next = jest.fn();
  await requireRole(allowed)(req, res, next);
  return { req, res, next };
}

describe("requireRole", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("allows the requested role from public.users", async () => {
    const result = await runRoleGuard("farmer", ["farmer"]);
    expect(result.next).toHaveBeenCalledTimes(1);
    expect(result.res.status).not.toHaveBeenCalled();
  });

  it("allows platform administrators to access role dashboards", async () => {
    const result = await runRoleGuard("administrator", ["farmer"]);
    expect(result.next).toHaveBeenCalledTimes(1);
  });

  it("rejects a different role with 403", async () => {
    const result = await runRoleGuard("trader", ["farmer"]);
    expect(result.next).not.toHaveBeenCalled();
    expect(result.res.status).toHaveBeenCalledWith(403);
  });

  it("fails closed when the user has no trusted role row", async () => {
    const result = await runRoleGuard(null, ["farmer"]);
    expect(result.next).not.toHaveBeenCalled();
    expect(result.res.status).toHaveBeenCalledWith(403);
  });

  it("rejects non-JWT demo identities", async () => {
    const result = await runRoleGuard("farmer", ["farmer"], "demo");
    expect(result.next).not.toHaveBeenCalled();
    expect(result.res.status).toHaveBeenCalledWith(403);
    expect(mockedAdmin.from).not.toHaveBeenCalled();
  });
});
