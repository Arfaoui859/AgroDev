import { Request, Response, NextFunction } from "express";
import { supabase } from "../lib/supabase";

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
