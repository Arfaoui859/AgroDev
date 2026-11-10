import { Request, Response, NextFunction, RequestHandler } from "express";
import { supabase, supabaseAdmin } from "../lib/supabase";
import { verifyAdminToken } from "../lib/adminAuth";

/** Roles treated as platform administrators. */
const ADMIN_ROLES = new Set(["admin", "administrator"]);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Authenticated user id, set by requireAuth / attachIdentity. */
      userId?: string;
      /** How the identity was established: verified JWT, demo header, or none. */
      identitySource?: "jwt" | "demo" | "anonymous";
    }
  }
}

/** Bearer token from the Authorization header, if present. */
function bearerToken(req: Request): string | null {
  const header = req.header("authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match ? match[1].trim() : null;
}

/**
 * True when anonymous, client-asserted identity is acceptable.
 *
 * Only non-production environments that have not explicitly disabled demo
 * endpoints qualify. In production this always returns false, so the server
 * never trusts a userId supplied by the caller.
 */
export function demoIdentityAllowed(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.ENABLE_DEMO_ENDPOINTS !== "false"
  );
}

/**
 * Resolve the caller's identity from a verified Supabase JWT.
 *
 * Returns the user id on success. Returns null when no token is present.
 * Throws when a token is present but cannot be verified, so callers can
 * distinguish "not logged in" from "bad token" and answer 401.
 */
export async function resolveUserIdFromJwt(
  req: Request,
): Promise<string | null> {
  const token = bearerToken(req);
  if (!token) return null;
  if (!supabase) {
    throw new Error("AUTH_UNAVAILABLE");
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    throw new Error("AUTH_INVALID_TOKEN");
  }
  return data.user.id;
}

/**
 * Express middleware for endpoints that act on the caller's own data.
 *
 * Resolution order:
 *  1. A verified Supabase JWT -> req.userId from the token (never the client).
 *  2. A non-production demo identity (x-demo-user header or ?userId=), so the
 *     existing demo dashboards keep working locally.
 *  3. Otherwise 401 — an unauthenticated caller cannot name an arbitrary user.
 *
 * Endpoints using this must ignore any userId supplied in the query/body for
 * authorization purposes and use req.userId instead.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = await resolveUserIdFromJwt(req);
    if (userId) {
      req.userId = userId;
      req.identitySource = "jwt";
      return next();
    }
  } catch (err) {
    const reason = err instanceof Error ? err.message : "";
    if (reason === "AUTH_UNAVAILABLE") {
      res.status(503).json({
        success: false,
        error: "Authentication is unavailable",
        message:
          "The authentication service is not configured. Sign-in cannot be verified.",
      });
      return;
    }
    res.status(401).json({
      success: false,
      error: "Unauthorized",
      message: "The provided access token is invalid or expired.",
    });
    return;
  }

  if (demoIdentityAllowed()) {
    const demoUser =
      (req.header("x-demo-user") as string) ||
      (req.query.userId as string) ||
      "demo-user";
    req.userId = demoUser;
    req.identitySource = "demo";
    return next();
  }

  res.status(401).json({
    success: false,
    error: "Unauthorized",
    message: "Sign in to access this resource.",
  });
}

/**
 * Require requireAuth to have established a verified Supabase JWT.
 * Use for persisted user-owned resources that are available to multiple roles.
 */
export function requireVerifiedAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.identitySource !== "jwt" || !req.userId) {
    res.status(req.identitySource === "demo" ? 403 : 401).json({
      success: false,
      error: req.identitySource === "demo" ? "Forbidden" : "Unauthorized",
      code: "VERIFIED_SESSION_REQUIRED",
      message: "A verified Supabase session is required for persisted data.",
    });
    return;
  }
  next();
}

/**
 * Require a trusted role stored in public.users for the verified JWT identity.
 * Client metadata, query parameters, request bodies, and demo identities are
 * never accepted as role evidence. Platform admins may access role dashboards.
 */
export function requireRole(allowedRoles: readonly string[]): RequestHandler {
  const allowed = new Set(allowedRoles.map((role) => role.toLowerCase()));

  return async (req, res, next) => {
    if (!req.userId || req.identitySource !== "jwt") {
      res.status(req.identitySource === "demo" ? 403 : 401).json({
        success: false,
        error: req.identitySource === "demo" ? "Forbidden" : "Unauthorized",
        message: "A verified account is required to access this role-specific resource.",
      });
      return;
    }

    const role = await resolveRole(req.userId);
    if (!role) {
      res.status(403).json({
        success: false,
        error: "Forbidden",
        message: "Your account has no verifiable platform role. Contact an administrator.",
      });
      return;
    }

    if (ADMIN_ROLES.has(role) || allowed.has(role)) return next();

    res.status(403).json({
      success: false,
      error: "Forbidden",
      message: "Your account role is not permitted to access this resource.",
      requiredRoles: [...allowed],
    });
  };
}

/**
 * Resolve the caller's role from `public.users`, using the elevated client so
 * RLS cannot hide the caller's own row. Returns null when the user has no
 * profile row or the database is unavailable.
 */
async function resolveRole(userId: string): Promise<string | null> {
  const client = supabaseAdmin || supabase;
  if (!client) return null;
  try {
    const { data, error } = await client
      .from("users")
      .select("role,is_active")
      .eq("id", userId)
      .maybeSingle();
    if (error || !data || (data as { is_active?: boolean }).is_active === false) return null;
    const role = (data as { role?: string }).role;
    return typeof role === "string" ? role.toLowerCase() : null;
  } catch {
    return null;
  }
}

/**
 * Guard for platform-administrator endpoints.
 *
 * Access is granted when either:
 *  1. A valid admin token is presented (`x-admin-token`), i.e. the operator /
 *     service credential used by provisioning tooling — checked in constant
 *     time, or
 *  2. The caller presents a verified Supabase JWT whose `public.users` role is
 *     `admin` / `administrator` — this is how a signed-in administrator uses
 *     the admin dashboard, or
 *  3. The non-production demo fallback applies (so local dev keeps working).
 *
 * Everything else gets 401 (anonymous / invalid token) or 403 (authenticated
 * but not an administrator). It never falls back to trusting a client-supplied
 * userId. In production with no admin token configured the token path fails
 * closed, so only a real admin JWT can pass.
 */
export async function requireAdminAccess(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  // 1. Operator/service credential.
  if (verifyAdminToken(req)) {
    req.identitySource = "jwt";
    return next();
  }

  // 2. Verified administrator JWT.
  let userId: string | null = null;
  let tokenPresent = false;
  try {
    tokenPresent = Boolean(bearerToken(req));
    userId = await resolveUserIdFromJwt(req);
  } catch (err) {
    const reason = err instanceof Error ? err.message : "";
    if (reason === "AUTH_UNAVAILABLE" && !demoIdentityAllowed()) {
      res.status(503).json({
        success: false,
        error: "Authentication is unavailable",
        message:
          "The authentication service is not configured. Admin access cannot be verified.",
      });
      return;
    }
    // Invalid/expired token: fall through to the demo check (dev) or 401.
    userId = null;
  }

  if (userId) {
    const role = await resolveRole(userId);
    if (role && ADMIN_ROLES.has(role)) {
      req.userId = userId;
      req.identitySource = "jwt";
      return next();
    }
    res.status(403).json({
      success: false,
      error: "Forbidden",
      message: "Administrator privileges are required.",
    });
    return;
  }

  if (tokenPresent) {
    res.status(401).json({
      success: false,
      error: "Unauthorized",
      message: "The provided access token is invalid or expired.",
    });
    return;
  }

  // 3. Non-production demo fallback (unchanged dev ergonomics).
  if (demoIdentityAllowed()) {
    req.userId =
      (req.header("x-demo-user") as string) ||
      (req.query.userId as string) ||
      "demo-admin";
    req.identitySource = "demo";
    return next();
  }

  res.status(401).json({
    success: false,
    error: "Unauthorized",
    message: "Administrator sign-in is required.",
  });
}
