# AgroGrowth — FINAL Blockers

**Branch:** `feat/ai-integration-production-hardening`
**HEAD:** `7c5b3cb` · **Date:** 2026-11-04 · **Auditor:** OpenHands (independent)

Blockers are grouped by severity. Each has: the evidence, the impact, and the
exact action required. Nothing here is speculative — each was reproduced in this
session or in the immediately preceding audit.

Severity legend: **P0** = blocks a safe production launch · **P1** = must fix
before public/real users · **P2** = should fix soon · **P3** = nice to have.

---

## Resolved in this pass

| ID | Was | Now |
|---|---|---|
| **S-1 (P0)** | Production served the full backend bundle `/server/node-build.mjs` **and** its 2.1 MB source map (embedding every server `.ts`, incl. `adminAuth.ts`) | **FIXED** — bundle moved to `build/server` (outside the static root), `sourcemap:false`, `minify:true`; `/server/*` and `/build/*` hard-404; regression test added |
| **S-2 (P1)** | CORS reflected the request `Host` header as a trusted origin (`credentials:true`) | **FIXED** — trust only `APP_ORIGIN`/`RENDER_EXTERNAL_URL`/`CORS_ORIGINS`; exact, normalised match; `Host` never trusted; attack-matrix tests added |
| **S-3 (P1)** | `language=fr` unproven for the three French-facing microservices | **FIXED/COVERED** — `test_multilingual_fr.py` (11 tests) proves `fr`/`ar`/`ar-tn`/`en` accepted and canonical fields locale-independent |
| B-4 | Health probe false negative (`maxTokens:1` → MAX_TOKENS read as parse error; 10 s timeout < cold latency) | **FIXED** — MAX_TOKENS treated as success, probe budget 8, timeout raised (now 45 s), regression tests |
| B-8 | Tests failed when a provider key was present in the environment | **FIXED** — `tests/setup.ts` strips provider credentials unless `AI_LIVE_TESTS=1` |
| B-10 | `dist/` build artifacts tracked in git; `build/` would have been too | **FIXED** — `dist/` already ignored; `build/` added to `.gitignore` and `.dockerignore` |

---

## P0 — Blocks production launch

### B-1. No populated environment / secrets
- **Evidence:** only `.env.example` exists; no `.env`; `SUPABASE_URL` unset and
  no AI provider configured by default. Node logs "Supabase env vars not set".
- **Impact:** auth, DB-backed features and real inference are inert in a default
  deploy. Admin write routes correctly fail closed (403/404), but the product
  cannot function.
- **Action:** provision `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `DIRECT_URL`, **`APP_ORIGIN`**,
  and an AI provider (`AI_PROVIDER=gemini` + `GEMINI_API_KEY`, or
  `AI_BASE_URL`+`AI_API_KEY`) in the hosting platform's secret store. Never
  commit `.env`.

### B-2. Database security not live-verified (RLS / ownership)
- **Evidence:** `database/rls-hardening.sql` (13 tables, 46 policies) and
  `database/user-lifecycle.sql` are well-formed, but **no DB credentials** are
  available here, so `anon`/`authenticated` behaviour could not be executed.
- **Impact:** cannot prove in production that RLS blocks cross-tenant reads.
  Committed grants are broad, so isolation depends **entirely** on RLS.
- **Action:** run the SQL against the target DB and execute a live RLS test
  (as `anon` confirm sensitive tables are denied; as user A confirm user B's
  farms/fields return 0 rows; confirm the `on_auth_user_deleted` trigger removes
  the profile row).

### B-3. No real agricultural market data source
- **Evidence:** `/api/market-analysis/prices/current` returns
  `X-Data-Provenance: simulated` / `X-Is-Real-Data: false`; `/api/market/all`
  reads an **empty** `market_prices` table. No external feed integration exists.
- **Impact:** market intelligence is a core advertised capability but delivers
  simulated/empty data.
- **Action:** either (a) integrate a licensed market-data feed and seed
  `market_prices`, or (b) keep the simulated labelling and explicitly scope the
  feature as "demo" in product/marketing copy. Do **not** present simulated
  prices as real.

---

## P1 — Must fix before real users

### B-6. French and English UI localization is still incomplete
- **Evidence:** i18n infrastructure is solid and now covers the three migrated
  farmer screens, but the legacy `isArabic` boolean is still used on ~16 pages
  and many pages still contain hard-coded Arabic. Only a subset import
  `LanguageContext`.
- **Impact:** the language switcher promises three languages; a French/English
  user still sees untranslated Arabic on most screens.
- **Action:** continue migrating pages to the keyed `t()` API, and until complete
  label the switcher honestly (e.g. "العربية / English / Français (partiel)") or
  hide unsupported locales.

### B-14. `APP_ORIGIN` must be set (new, from the S-2 hardening)
- **Evidence:** the CORS allow-list no longer trusts the request `Host`; the
  app's own origin now comes only from `APP_ORIGIN` / `RENDER_EXTERNAL_URL` /
  `CORS_ORIGINS`.
- **Impact:** if none of those is set in production, the SPA's `crossorigin`
  asset requests receive no `Access-Control-Allow-Origin`. Assets still load
  (the `cors` middleware does not block the response), but the API is not
  reachable cross-origin, and the hardening relies on the operator configuring a
  real origin. On Render, `RENDER_EXTERNAL_URL` is injected automatically, so
  this is satisfied there; for other hosts set `APP_ORIGIN`.
- **Action:** set `APP_ORIGIN=https://<public-host>` (or list the domain in
  `CORS_ORIGINS`) in the production environment. Verify with
  `curl -H "Origin: https://<host>" -i https://<host>/api/ping` → ACAO present.

---

## P2 — Should fix soon

### B-7. AI microservice models are synthetic/heuristic demos
- **Evidence:** all 8 `/health` endpoints report `synthetic-demo` /
  `heuristic-demo` / `rule-based-demo`; `/api/ai/health` reports
  `syntheticModelServices:6`, `isRealModel:false` for the six numeric services
  (the two LLM-backed services report `gemini:*`, `isRealModel:true`).
  `tensorflow` is not installed (CNN path disabled).
- **Impact:** "AI" outputs are demo-grade; fine for pilots, not for production
  agronomic advice.
- **Action:** train/replace models on real labelled data and flip
  `model_source` accordingly; or keep the synthetic labelling and set product
  expectations. Keep the honest provenance reporting — it is a strength.

### B-9. Content-Security-Policy delegated to the host
- **Evidence:** `helmet({ contentSecurityPolicy: false })`
  (`server/middleware/security.ts`).
- **Impact:** no CSP unless the CDN/host sets one.
- **Action:** set a CSP at the edge (Netlify/Vercel/Render) or enable helmet's
  CSP with a policy appropriate to the SPA bundle.

### B-13. Provider latency is high and variable (upstream)
- **Evidence:** live Gemini round-trips measured at 11 s, 14 s, 18 s, 21 s, and
  two probes exceeded 30 s during a high-demand window.
- **Impact:** a correctly-configured provider can still show `errorKind:timeout`
  on `/api/system/ai/health` under load; user-facing calls feel slow.
- **Action:** pin a model verified in-region, set `AI_TIMEOUT_MS` for your
  latency budget, and treat a single health timeout as advisory (probe is cached
  60 s). Consider a paid tier or a secondary provider for production.

---

## P3 — Nice to have

### B-11. Dead/unreferenced components
- **Evidence:** `AlertFeed`, `EnhancedLayout`, `FeatureNotAvailable`,
  `MarketAnalyticsWidget`, `MobileNavigation`, `PWAInstallPrompt`,
  `PlaceholderPage`, `SoilStatusIndicator`, `UnifiedAlertSystem` have **0**
  references outside their own files.
- **Action:** remove or wire up.

---

## Explicitly NOT blockers (verified good)

- **Backend source no longer exposed.** `/server/*` and `/build/*` return 404;
  the bundle and its source map live outside the served root. Regression test
  present.
- **Admin authorization: fail-closed.** `GET /api/admin/*` anonymous → 401;
  `POST /api/admin/*` without a valid token → 404. Regression tests pass.
- **No committed privileged secrets.** Only `.env.example` is tracked; the only
  hard-coded JWTs are public Supabase **anon** keys (`role:"anon"`), which are
  gated by RLS.
- **Build, typecheck, lint, Jest (575), pytest (194) all green;**
  `npm audit --omit=dev` → 0 vulnerabilities.
- **Honest provenance everywhere tested** — no fabricated observations found.
