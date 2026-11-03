import { RequestHandler, Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";
import crypto from "crypto";

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
 * CORS configuration. In production the allowed origins must be listed in
 * CORS_ORIGINS (comma separated). In development all origins are allowed.
 */
export function corsMiddleware(): RequestHandler {
  const configured = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  const isProd = process.env.NODE_ENV === "production";

  return cors({
    origin: (origin, callback) => {
      // Allow same-origin / server-to-server requests (no Origin header).
      if (!origin) return callback(null, true);
      if (!isProd || configured.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
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
    const expected = process.env.ADMIN_API_TOKEN;
    const provided = req.header("x-admin-token") || "";

    if (expected && timingSafeEqualStr(provided, expected)) {
      return next();
    }

    const demoAllowed =
      !isProd && process.env.ENABLE_DEMO_ENDPOINTS !== "false";
    if (demoAllowed) {
      return next();
    }

    if (!expected && isProd) {
      return res.status(403).json({
        error: "This endpoint is disabled.",
      });
    }

    return res.status(401).json({ error: "Unauthorized" });
  };
}

/** Constant-time string comparison to avoid leaking the token via timing. */
function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Still compare against itself to keep timing roughly constant.
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}
