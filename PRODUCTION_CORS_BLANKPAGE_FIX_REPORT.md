# Production CORS + Blank-Page Fix — Evidence Report

- **Date:** 2026-11-04
- **Branch:** `feat/ai-integration-production-hardening` (HEAD `7c5b3cb`, unchanged)
- **Production URL:** https://agrodev-3.onrender.com
- **Scope:** Diagnose and fix the CORS error and the blank page. No commit, push,
  deploy, Render setting change, or environment-variable change was performed.
- **Constraint honoured:** all pre-existing working-tree changes preserved; no
  branch switch / reset / rebase / force-push.

---

## 1. Exact root cause of the CORS error

The production bundle references its own assets with a `crossorigin` attribute:

```html
<script type="module" crossorigin src="/assets/index-DN2vGxo8.js"></script>
<link rel="stylesheet" crossorigin href="/assets/index-Dn7tARcF.css">
```

Per the HTML spec, a `crossorigin` fetch is a CORS request, so the browser sends
an `Origin` header **even for same-origin requests**. Every such request hit
`corsMiddleware()` in `server/middleware/security.ts`, which rejected any origin
not present in the `CORS_ORIGINS` environment variable:

```ts
if (!isProd || configured.includes(origin)) return callback(null, true);
return callback(new Error(`Origin ${origin} is not allowed by CORS`));
```

`CORS_ORIGINS` is empty in production, so the app's own origin was rejected.
Worse, the middleware signalled the rejection with `callback(new Error(...))`,
which the `cors` package forwards to Express `next(err)`. The final error handler
in `server/index.ts` turned that into an opaque:

```json
HTTP 500  {"error":"Internal server error"}
```

**Live reproduction (production):**

| Request | Status | Content-Type |
|---|---|---|
| `GET /api/ping` (no Origin) | 200 | application/json |
| `GET /api/ping` + `Origin: https://agrodev-3.onrender.com` | **500** | application/json |
| `GET /assets/index-Dn7tARcF.css` (no Origin) | 200 | text/css |
| `GET /assets/index-Dn7tARcF.css` + same Origin | **500** | application/json |
| `OPTIONS` preflight + Origin | **500** | — |

Any request carrying an `Origin` header returned HTTP 500 — including the app's
own origin. This is the exact `Unhandled API error: Origin ... is not allowed by
CORS` line in the Render logs.

## 2. Exact root cause of the blank page

The blank page is a **direct consequence of the CORS error**, confirmed by
reproduction:

1. The HTML references the CSS with `crossorigin`.
2. The browser requests the CSS **with** an `Origin` header.
3. The server answers **HTTP 500 with `Content-Type: application/json`**.
4. The browser refuses the stylesheet:

   > `Refused to apply style because its MIME type ('application/json') is not a supported stylesheet MIME type`

5. The module script fails the same way (`GET /assets/index-*.js` → 500), so the
   React app never mounts → **blank page**.

The `GET /assets/index-*.js 500 Internal Server Error` in the browser console is
the same defect: same-origin asset fetch + `crossorigin` + Origin-rejecting CORS
middleware.

A **second, independent** static-serving defect was also found and fixed:
`server/node-build.ts` resolved the SPA directory to `dist/dist` via
`import.meta.dirname` (`../dist` from `dist/server/`), so it only worked because
`process.cwd()` happened to be the repo root on Render. Launched from any other
working directory, `/` returned 404.

## 3. Files inspected

- `server/index.ts` (middleware order, error handler, route table)
- `server/middleware/security.ts` (CORS, helmet, rate limits, admin token guard)
- `server/node-build.ts` (production static serving + SPA fallback)
- `vite.config.ts` (`base`, build output, dev Express plugin)
- `vite.config.server.ts` (SSR server bundle target)
- `package.json` (`build` / `build:server` / `start` scripts)
- `render.yaml` (read only — not modified)
- `.env.example` (CORS documentation)
- `dist/index.html` and the served `dist/assets/*` (build output)
- `node_modules/cors/lib/index.js` (callback semantics)
- `tests/integration/api.test.ts`, `security-middleware.test.ts`,
  `deployment-manifests.test.ts` (existing contracts)
- Live production responses (headers + bodies) for `/`, assets, `/api/ping`,
  `/api/health`, preflight, missing asset, unknown SPA route, unknown `/api` route

## 4. Files modified

| File | Nature |
|---|---|
| `server/middleware/security.ts` | CORS fix (production defect) |
| `server/node-build.ts` | Static MIME pinning, `/assets` 404, dist path fix |
| `.env.example` | Clarified `CORS_ORIGINS` semantics |
| `tests/integration/cors-and-static-serving.test.ts` | New regression suite (new file) |

`render.yaml` was deliberately left unchanged (the fix needs no Render settings).

## 5. Explanation of every modification

### `server/middleware/security.ts`

- **Reject without erroring.** An unlisted origin now returns
  `cb(null, false)` instead of `cb(new Error(...))`. Empirically verified against
  the installed `cors` package: `cb(null, false)` → HTTP 200 with no CORS headers
  (the browser blocks it), while `cb(new Error(...))` → HTTP 500. Rejection still
  happens; it is no longer an opaque server error.
- **Always allow the app's own origin.** New `selfOrigins(req)` derives the
  app's origin from the request `Host` header and `RENDER_EXTERNAL_URL`, and adds
  it to the allow-list. This is required because `crossorigin` asset requests
  carry an `Origin` equal to the app's own origin. It is **not** a wildcard: a
  cross-site caller reaches this server with the *server's* host (its `Origin`
  differs and is rejected), so only genuine same-origin requests can match.
- **`CORS_ORIGINS` still honoured** for extra/custom domains; localhost remains
  allowed only outside production; requests with no `Origin` remain allowed.
- The `cors` factory is now the options-delegate form `cors((req, cb) => …)` so
  the allow-list can be computed per request.
- **No security weakening:** no `origin: true`, no wildcard, no
  `origin: "*"`, credentials policy unchanged, preflight still handled by the
  same middleware.

### `server/node-build.ts`

- **Pin MIME types.** `express.static`'s `setHeaders` now sets an explicit
  `Content-Type` for `.js` (`application/javascript; charset=UTF-8`), `.css`
  (`text/css; charset=UTF-8`), fonts, images, JSON, maps, etc. This makes the
  served type deterministic across `mime-types` versions.
- **Real 404 for missing assets.** `app.use("/assets", …)` returns
  `404 text/plain` after the static layer. Previously a missing hashed asset fell
  through to the SPA catch-all and returned `200 text/html`, which the browser
  then failed to execute.
- **Correct dist path.** `path.join(__dirname, "..")` (i.e. `dist`) is now the
  first candidate, with `dist/spa`, legacy `dist/dist`, and the `process.cwd()`
  fallbacks retained. This removes the `dist/dist` bug.

### `.env.example`

- Clarified that `CORS_ORIGINS` lists **extra** origins; the app's own origin is
  allowed automatically.

## 6. Tests executed and real results

| Command | Result |
|---|---|
| `npx tsc --noEmit` | **PASS** (exit 0) |
| `npm run lint` | **PASS** (exit 0, 0 warnings) |
| `npm run build` (client + server) | **PASS** — `dist/index.html`, `dist/assets/*`, `dist/server/node-build.mjs` |
| `npx jest` (full suite) | **568 passed**, 2 skipped, 63 suites passed (1 skipped) |
| `npx jest tests/integration/cors-and-static-serving.test.ts` | **17 passed** |

New suite `tests/integration/cors-and-static-serving.test.ts` covers all ten
required scenarios plus extras:

1. Production origin accepted → ACAO reflected + credentials true
2. App's own origin accepted via `Host` and via `RENDER_EXTERNAL_URL`
3. Extra origin from `CORS_ORIGINS` accepted
4. Unauthorized origin rejected **without a 500** (no ACAO, status 200)
5. No-`Origin` request accepted
6. Localhost accepted in development, rejected in production
7. `OPTIONS` preflight from production origin succeeds (ACAO + methods)
8. `OPTIONS` preflight from unauthorized origin has no CORS headers
9. `/` returns SPA HTML
10. `/assets/*.css` → `text/css`; `/assets/*.js` → `javascript`
11. Unknown frontend route returns SPA HTML
12. Missing asset returns real 404 (not SPA HTML)
13. Unknown `/api/*` returns JSON 404 (never `index.html`)
14. Built server serves the SPA when launched from a different working directory

**End-to-end verification against the real built server**
(`NODE_ENV=production node dist/server/node-build.mjs`):

```
/                                        200  text/html
/api/ping  + Origin: https://agrodev-3.onrender.com
                                         200  ACAO: https://agrodev-3.onrender.com,
                                              Vary: Origin, credentials: true
/api/ping  + Origin: https://evil.example.com
                                         200  (no CORS headers)
/assets/index-*.css + Origin             200  text/css; charset=UTF-8
/assets/index-*.js  + Origin             200  application/javascript; charset=UTF-8
/assets/missing.js  + Origin             404  text/plain
/deep/spa/route                          200  text/html
launched from /tmp (different cwd)       / 200 text/html, css 200, missing 404
```

## 7. Tests that could not be executed and why

- **Live AI microservice / provider tests** were not run: they require the eight
  Python services and provider credentials and spend real quota. Not relevant to
  the CORS/static defect.
- **Post-deploy production verification** cannot be run by me: the fix is
  uncommitted, and production still serves HEAD `7c5b3cb`. It must be verified by
  you after you deploy (see section 9).

## 8. Remaining risks or blockers

1. **Production is still broken until you deploy.** HEAD is unchanged and the fix
   is uncommitted; `https://agrodev-3.onrender.com` continues to return HTTP 500
   for any request with an `Origin` header. This is expected and by design.
2. **`CORS_ORIGINS` remains unset on Render.** Not required for the fix (the
   app's own origin is auto-allowed), but setting it to any custom domains is
   recommended for clarity. I did not change Render settings.
3. **Cache busting.** Production HTML currently references
   `index-DN2vGxo8.js` / `index-Dn7tARcF.css`; the rebuilt bundle emits different
   hashes. A fresh deploy regenerates `dist/index.html`, so hashes stay
   consistent. Ensure the deploy is not serving a stale `dist/index.html`.
4. **`Vary: Origin`** is emitted (verified), so no CDN cache-poisoning risk from
   reflected origins.
5. The `selfOrigins` reflection trusts the `Host` header. On Render, `Host` is set
   by the platform proxy and is not attacker-controlled; behind a proxy that
   forwards arbitrary `Host`, prefer setting `CORS_ORIGINS` explicitly.

## 9. Exact manual steps you must perform before deployment

1. Review the diff of `server/middleware/security.ts`, `server/node-build.ts`,
   `.env.example`, and the new test file.
2. (Recommended) Set `CORS_ORIGINS` in the Render dashboard to your custom
   domains, e.g. `https://agrogrowth.tn,https://www.agrogrowth.tn`. This is
   optional — the app's own origin is allowed automatically.
3. Commit the changes and deploy to Render.
4. After deploy, verify:

   ```bash
   # Own origin must now be 200 with CORS headers (was 500):
   curl -s -D - -o /dev/null -H "Origin: https://agrodev-3.onrender.com" \
     https://agrodev-3.onrender.com/api/ping | grep -i "http/\|access-control"

   # The asset that produced the MIME error must be 200 text/css:
   curl -s -D - -o /dev/null -H "Origin: https://agrodev-3.onrender.com" \
     https://agrodev-3.onrender.com/assets/index-<hash>.css | grep -i "http/\|content-type"
   ```

5. Confirm the page is no longer blank and the browser console shows no
   `application/json` stylesheet error.

---

## Concise diff summary

- `server/middleware/security.ts`: unlisted origins now rejected with
  `cb(null, false)` (no 500); app's own origin (`Host` / `RENDER_EXTERNAL_URL`)
  always allowed; `CORS_ORIGINS`, dev-localhost, and no-`Origin` behaviour
  preserved; no wildcard.
- `server/node-build.ts`: pinned `Content-Type` for build assets; `/assets`
  missing files return 404; `distPath` now resolves `dist/server/..` = `dist`.
- `.env.example`: documented `CORS_ORIGINS` as extra origins.
- `tests/integration/cors-and-static-serving.test.ts`: new — 17 tests covering
  CORS policy, MIME types, SPA fallback, API 404, and cwd-independent serving.

**No commit, push, deploy, Render change, env-var change, or file deletion was
performed.**
