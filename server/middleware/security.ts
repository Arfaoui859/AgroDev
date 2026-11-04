import { RequestHandler, Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";
import { verifyAdminToken } from "../lib/adminAuth";

/**
 * Security headers. The API is consumed by the SPA and by external clients, so
 * the CSP is permissive enough for the built frontend bundle while still
 * blocking inline scripts by default.
 */
export function securityHeaders(): RequestHandler {
  return helmet({
    contentSecurityPolicy: false, // SPA + external AI providers; set by the host/CDN
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  });
}

/**
 * Normalise a candidate origin into a canonical `scheme://host[:port]` string,
 * or return null when it is not a usable absolute origin.
 *
 * Only the origin is kept (any path/query/fragment is dropped), so a value like
 * `https://app.example.com/` and `https://app.example.com` match identically.
 * A bare value with no scheme (e.g. `app.example.com`) is rejected rather than
 * guessed, so a malformed setting can never silently widen the allow-list.
 */
function normalizeOrigin(value: string | undefined | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

/**
 * Origins trusted for CORS, in addition to any listed in `CORS_ORIGINS`.
 *
 * The app's own public origin is required because the production bundle requests
 * its assets with a `crossorigin` attribute, so the browser sends an `Origin`
 * header even for same-origin fetches.
 *
 * The origin is taken ONLY from configuration that the platform operator
 * controls — `APP_ORIGIN` and `RENDER_EXTERNAL_URL` — never from the request's
 * `Host` header. Reflecting `Host` would let an attacker present
 * `Host: attacker.example` and receive a matching
 * `Access-Control-Allow-Origin` (with `credentials: true`), so it is not a
 * trust boundary we accept. When neither variable is set the app simply has no
 * implicit self-origin; operators must set `APP_ORIGIN` (or list the domain in
 * `CORS_ORIGINS`).
 */
function trustedOrigins(): Set<string> {
  const set = new Set<string>();
  for (const raw of [process.env.APP_ORIGIN, process.env.RENDER_EXTERNAL_URL]) {
    const origin = normalizeOrigin(raw);
    if (origin) set.add(origin);
  }
  for (const raw of (process.env.CORS_ORIGINS || "").split(",")) {
    const origin = normalizeOrigin(raw);
    if (origin) set.add(origin);
  }
  return set;
}

/**
 * CORS configuration.
 *
 * Allowed origins are:
 *  - requests with no `Origin` header (same-origin navigation, server-to-server)
 *  - the app's own origin(s) from `APP_ORIGIN` / `RENDER_EXTERNAL_URL`
 *  - every origin in `CORS_ORIGINS` (comma separated)
 *  - in non-production, any origin (convenient for local tooling)
 *
 * Matching is exact and case-sensitive on the normalised origin. There is no
 * wildcard and no `origin: true`. The request `Host` header is never trusted.
 *
 * An origin that is not allowed is rejected by returning `callback(null, false)`
 * — the request still completes normally but carries no CORS headers, so the
 * browser blocks it. It must NOT `callback(new Error(...))`: the `cors`
 * middleware forwards that error, and the final error handler turns it into an
 * opaque HTTP 500 (which is what previously broke asset loading and produced the
 * blank page).
 */
export function corsMiddleware(): RequestHandler {
  const isProd = process.env.NODE_ENV === "production";

  return cors((_req, callback) => {
    // Computed per request so a configuration change (or test) is honoured
    // without a restart; the sources are all process env, not the request.
    const allowed = trustedOrigins();
    callback(null, {
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (!isProd || allowed.has(origin)) return cb(null, true);
        return cb(null, false);
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    });
  });
}

/** General API rate limiter: 300 requests per minute per IP. */
export function apiRateLimiter(): RequestHandler {
  return rateLimit({
    windowMs: 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX || 300),
    standardHeaders: true,
    legacyHeaders: false,
    // Health checks and preflight must never be throttled.
    skip: (req) =>
      req.method === "OPTIONS" ||
      req.originalUrl.startsWith("/api/ping") ||
      req.originalUrl.startsWith("/api/health"),
    message: { error: "Too many requests, please try again later." },
  });
}

/**
 * Stricter limiter for expensive AI inference endpoints: 30 requests per
 * minute per IP. These endpoints can trigger paid model calls.
 */
export function aiRateLimiter(): RequestHandler {
  return rateLimit({
    windowMs: 60 * 1000,
    max: Number(process.env.AI_RATE_LIMIT_MAX || 30),
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) =>
      req.method === "OPTIONS" || req.originalUrl.startsWith("/api/ai/health"),
    message: {
      error: "Too many AI requests, please slow down and try again shortly.",
    },
  });
}

/**
 * Very strict limiter for anonymous key-minting. A public API key endpoint is
 * an attractive target for resource exhaustion, so cap it at a handful per hour
 * per IP instead of relying on the general API limit.
 */
export function keyMintRateLimiter(): RequestHandler {
  return rateLimit({
    windowMs: 60 * 60 * 1000,
    max: Number(process.env.PUBLIC_API_KEY_MINT_MAX || 5),
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error:
        "Too many API key requests. Please try again later or contact support.",
    },
  });
}

/** Reject oversized JSON bodies early with a clear 413 instead of a crash. */
export function jsonBodyErrorHandler(): (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => void {
  return (err, _req, res, next) => {
    if (err?.type === "entity.too.large") {
      return res.status(413).json({ error: "Request body too large" });
    }
    if (err instanceof SyntaxError && "body" in err) {
      return res.status(400).json({ error: "Invalid JSON body" });
    }
    return next(err);
  };
}

/**
 * Guard for privileged maintenance endpoints (demo/admin user provisioning,
 * auth debug helpers). These MUST NOT be reachable anonymously in production.
 *
 * Access is granted when either:
 *  - ADMIN_API_TOKEN is set and the request carries a matching
 *    `x-admin-token` header (timing-safe comparison), or
 *  - the environment is explicitly non-production AND
 *    ENABLE_DEMO_ENDPOINTS is not set to "false".
 *
 * In production with no token configured the endpoint is disabled entirely,
 * which fails closed rather than exposing privileged operations.
 */
export function requireAdminToken(): RequestHandler {
  const isProd = process.env.NODE_ENV === "production";

  return (req, res, next) => {
    if (verifyAdminToken(req)) {
      return next();
    }

    const demoAllowed =
      !isProd && process.env.ENABLE_DEMO_ENDPOINTS !== "false";
    if (demoAllowed) {
      return next();
    }

    if (!process.env.ADMIN_API_TOKEN && isProd) {
      return res.status(403).json({
        error: "This endpoint is disabled.",
      });
    }

    return res.status(401).json({ error: "Unauthorized" });
  };
}
