# AgroGrowth — FINAL Independent Production Readiness Audit

**Repository:** Arfaoui859/AgroDev
**Branch audited:** `feat/ai-integration-production-hardening`
**HEAD:** `7c5b3cb` (unchanged — no commit, push, rebase, reset or deploy)
**Audit date:** 2026-11-04
**Auditor:** OpenHands (independent)

> Read-first audit. Every claim below is backed by a command executed in this
> session; nothing is copied from the template, README or a prior report.
> A **narrow, authorised P1 hardening pass** was applied for three confirmed
> regressions (see §1.1). All pre-existing uncommitted changes were preserved.

Legend used throughout:
**VERIFIED** = proven by real execution this session ·
**PARTIALLY VERIFIED** = proven for part of the surface ·
**BLOCKED** = cannot be proven without an external resource (DB, feed, host) ·
**NOT VERIFIED** = not executed.

---

## 0. Environment under test

| Item | Value |
|---|---|
| Node | v24.21.0 |
| npm | 11.21.0 |
| Python | 3.13.15 |
| `.env` present | **No** — only `.env.example` (Supabase/DB unconfigured here) |
| Injected credential | `GEMINI_API_KEY` present and authenticating (value never printed) |
| Built server | `build/server/node-build.mjs` (new location — see §1.1) |
| AI microservices | **all 8 booted and health-checked this session** (8001–8008) |

---

## 1. Test suites executed (actual results)

| Suite | Command | Result |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | **PASS** (exit 0) |
| Jest (full, ambient key) | `npx jest --silent` | **PASS — 575 passed, 2 skipped, 63/64 suites** |
| pytest (AI services) | `agrogrowth-ai/.venv/bin/python -m pytest tests` | **PASS — 194 passed** |
| Lint | `npm run lint` (`--max-warnings 0`) | **PASS** (exit 0) |
| Build | `npm run build` | **PASS** — SPA in `dist/` + `build/server/node-build.mjs` (950 kB) |
| Prod dependency audit | `npm audit --omit=dev` | **0 vulnerabilities** |
| Live LLM text smoke | `AI_LIVE_TESTS=1 … npx jest tests/live/real-provider-smoke.test.ts` | **PASS** — real answer, real socket |
| Live vision smoke | `AI_LIVE_VISION_TESTS=1 AI_LIVE_TEST_IMAGE=…` | **PASS** — real multimodal round-trip |
| AI services health | `bash scripts/start-ai-services.sh --check` | **8/8 OK** |

### 1.1 Confirmed defects fixed in this pass (all reproduced before the fix)

| ID | Defect | Fix | Regression coverage |
|---|---|---|---|
| **S-1 (P0)** | Production publicly served the whole backend bundle `/server/node-build.mjs` **and** its 2.1 MB source map `/server/node-build.mjs.map`; the map's `sourcesContent` embedded every server `.ts` file (incl. `adminAuth.ts`). Root cause: the server bundle was emitted into `dist/`, which is the statically-served root. | `vite.config.server.ts`: `outDir` moved to `build/server`, `sourcemap:false`, `minify:true`. `node-build.ts` resolves the SPA from `dist/` and hard-404s `/server/*` and `/build/*`. `package.json`/`render.yaml`/`Dockerfile`/`ci.yml`/`AGENTS.md` updated. | `cors-and-static-serving.test.ts` ("backend bundle and source-map paths are hard 404"), built-server smoke |
| **S-2 (P1)** | CORS allow-list reflected the request `Host` header as a trusted origin. With `credentials:true`, an attacker presenting `Host: attacker.example` + `Origin: https://attacker.example` would receive a matching `Access-Control-Allow-Origin`. | `security.ts`: trust only `APP_ORIGIN`, `RENDER_EXTERNAL_URL`, `CORS_ORIGINS`; `normalizeOrigin()`; exact match; `Host` never trusted. | `cors-and-static-serving.test.ts` (Host/Origin attack matrix) |
| **S-3 (P1)** | `language=fr` was unsupported in the three French-facing microservices' advisory path; no test proved `fr` is accepted. | Added `agrogrowth-ai/tests/test_multilingual_fr.py` (11 tests) proving `fr`/`ar`/`ar-tn`/`en` are accepted and canonical fields are locale-independent. | new pytest suite |

---

## 2. Area 1 — Real LLM provider availability and actual inference

**Status: VERIFIED**

Evidence (live, this session, key injected but never printed):

- `AI_LIVE_TESTS=1 AI_PROVIDER=gemini npx jest tests/live/real-provider-smoke.test.ts`
  → **PASS**: "a minimal authenticated request returns a real answer with usage"
  (14.7 s), real text + usage over a real socket.
- Provider resolution honours `AI_PROVIDER` and auto-detects `GEMINI_API_KEY`
  (`llmProvider.ts` `providerLabel()` / `resolveApiKey()`).
- `GET /api/ai/health` (built server, live) reports the `llm` block and, per
  service, the true engine — e.g. `Image Diagnosis → gemini:gemini-flash-latest`,
  `isRealModel:true`.
- Health probe is decoupled from inference timeout: `AI_HEALTH_TIMEOUT_MS`
  default **45 000 ms**; `AI_TIMEOUT_MS` default **30 000 ms**
  (`PROBE_DEFAULT_TIMEOUT_MS`); `.env.example` documents both consistently.
- `tests/integration/llm-health-check.test.ts` (**25.8 s**, 20 tests) and
  `tests/unit/providers.test.ts` pass.

Residual (upstream, not a code defect): Gemini cold latency is variable
(≈11–40 s under load). Operators should pin `AI_TEXT_MODEL`/`AI_VISION_MODEL`
and treat a single health timeout as advisory (probe cached 60 s).

---

## 3. Area 2 — Real image-based plant disease diagnosis

**Status: VERIFIED (pipeline) / PARTIALLY VERIFIED (agronomic accuracy)**

Evidence (live, this session):

- Live multimodal round-trip `tests/live/real-provider-smoke.test.ts` vision test
  → **PASS** (`isRealData:true`, confidence in `[0,1]`, 14 s).
- End-to-end through the built server:
  `POST /api/ai/images/detect-disease` with a real JPEG returned
  `{"dataSource":"llm","isRealData":true,"modelSource":"vision:gemini-flash-lite-latest","provider":"gemini",…}`.
  Notably the model **honestly rejected** a non-tomato image
  (`primary_disease.disease:"invalid_image_target"`) instead of fabricating a
  diagnosis — strong evidence against hallucinated output.
- No-fabrication contract pinned by `vision-provider.test.ts` /
  `vision-gateway.test.ts`: with no multimodal back-end the adapter throws
  `ProviderError("vision","unconfigured")`; the caller then tries
  `IMAGE_DIAGNOSIS_URL` and, if absent, reports diagnosis unavailable.

Caveat (honesty): the live image was a generic real photograph, not a labelled
leaf set, so the **pipeline** is proven but **agronomic accuracy** is not.

---

## 4. Area 3 — All 8 Python microservices and Node.js integration

**Status: VERIFIED (all booted, health-checked, proxied) / PARTIALLY VERIFIED (models synthetic)**

Evidence (live, this session):

- `bash scripts/start-ai-services.sh` booted all eight; `--check` → **8/8 OK**.
- `GET /api/ai/health` on the built server reported
  `availableServices:8, unavailableServices:0` with per-service
  `modelSource` / `isRealModel` (e.g. `image_diagnosis` and `intelligent_agent`
  → `gemini:*`, `isRealModel:true`; the six numeric services →
  `synthetic-demo`, `modelTrainedOnSyntheticData:true`).
- Node↔Python integration tests: `microservice-proxy`, `ai-gateway-contract`,
  `ai-service-health-coverage`, `route-contract-live`, `microservice-inventory`
  → **34 tests pass**.
- Python suite: **194 passed** (includes the new 11-test French suite).
- When a service is down the endpoint returns an honest 503, never fabricated
  data (`ai-service-health-coverage.test.ts`).

---

## 5. Area 4 — Real agricultural market data availability

**Status: BLOCKED (no real feed) / VERIFIED (honest labelling)**

Evidence:

- `market.ts` reads `market_prices` and reports `dataSource:"database"`,
  `isRealData:true`; `market-analysis.ts` reports `dataSource:"simulated"`,
  `isRealData:false` and sets `X-Data-Provenance: simulated` via `markSimulated`.
- Live probe (no DB configured here): `GET /api/market/crop/1` → 404
  `{"status":"error","message":"المحصول غير موجود"}` — degrades honestly.
- `market-endpoints`, `market-trend-direction`, `no-database-degradation` tests
  → pass (109 tests across the market/provenance group).

**BLOCKED:** no licensed external market feed and no seeded prices exist, so
market intelligence returns simulated/empty data. The labelling is honest; the
*capability* is not real. Action in `FINAL_BLOCKERS.md` B-3.

---

## 6. Area 5 — Admin authentication and authorization

**Status: VERIFIED (fail-closed)**

Evidence:

- `server/lib/adminAuth.ts`: constant-time compare (`crypto.timingSafeEqual`),
  no short-circuit across configured secrets.
- `requireAdminAccess` (`server/middleware/auth.ts`): grants access only for
  (1) a valid `x-admin-token`, or (2) a verified Supabase JWT whose
  `public.users.role ∈ {admin, administrator}`, or (3) the non-production demo
  fallback. Never trusts a client-supplied `userId`.
- `requireAdminToken()` (`security.ts`): in production with no token configured
  the endpoint is **disabled (403)** — fails closed.
- `admin-authorization`, `admin-panel-auth`, `field-admin-hardening`,
  `admin-auth`, `security-middleware`, `farm-rls-identity`,
  `gamification-identity`, `public-api-key-hardening`, `param-route-hardening`
  → **74 tests pass**.

**P2 residual:** CSP is delegated to the host (`contentSecurityPolicy:false`).

---

## 7. Area 6 — Frontend mock/demo data and provenance

**Status: VERIFIED (labelling) / PARTIALLY VERIFIED (page-by-page sweep)**

Evidence:

- `server/lib/provenance.ts` (`markSimulated`/`markReal`) is the single source;
  `provenance-headers.test.ts`, `provenance.test.ts`, `data-provenance.test.ts`,
  `provenance-classifier.test.ts` → pass.
- `client/components/SimulatedDataNotice.tsx` exists and is imported by **29
  pages** (`grep -rl` count).
- Market endpoints emit `simulated` + `isRealData:false`; weather reports
  `isRealData:true` (Open-Meteo); DB market reads report `dataSource:"database"`.

Residual: a manual walk of every demo screen was not performed; the checklist
carries that item.

---

## 8. Area 7 — Arabic, French and English localization

**Status: PARTIALLY VERIFIED (improved this pass)**

Evidence:

- `client/lib/i18n.ts` holds **116** keys, each defining `ar`, `fr`, `en`.
  `i18n.test.ts` enforces three-language coverage, non-empty strings, RTL for
  Arabic / LTR for fr+en, and the `ar→fr→en→ar` cycle.
- Three farmer-workflow screens (`IrrigationOptimization`, `PestControl`,
  `WeatherYieldPlanner`) now send `language` to the microservices and use the
  context `t(key)` + `dir` (previously a local `t(ar,en)` helper that could
  never render French).
- New `agrogrowth-ai/tests/test_multilingual_fr.py` proves `fr` is accepted by
  `pest_control`, `irrigation_optimization` and `weather_yield_intelligence`, and
  that canonical machine-readable fields are **not** translated.

Residual (P1): the legacy `isArabic` boolean is still used on ~16 other pages
and some pages contain hard-coded Arabic. Migration is incremental; until done
the language switcher should be labelled honestly (see B-6).

---

## 9. Area 8 — Database security, RLS and user data ownership

**Status: BLOCKED (no live DB access) / VERIFIED (static review)**

Evidence:

- `database/rls-hardening.sql`: **13** `ENABLE ROW LEVEL SECURITY` statements,
  **46** `CREATE POLICY` statements, covering `farms`, `farm_sections`,
  `crop_cultivations`, `soil_analyses`, `sensor_devices`, `sensor_readings`,
  `leaf_health_analyses`, `plant_disease_detections`, `market_predictions`,
  `notifications`, `user_analytics`, `user_profiles`, `users`, `weather_*`,
  `push_subscriptions`, `system_settings`, etc. Helper predicates
  `is_admin`, `is_expert`, `owns_farm`, `owns_section`, `current_user_role`.
- `database/user-lifecycle.sql` installs `on_auth_user_deleted`.
- `farm-rls-identity.test.ts` passes (mocked identity resolution).

**BLOCKED:** no `SUPABASE_*`/`DATABASE_URL` in this environment, so
`anon`/`authenticated` behaviour could **not** be executed against a real
database. Because grants to `anon`/`authenticated` are broad, isolation depends
**entirely** on RLS — this must be proven live before launch (B-2).

---

## 10. Area 9 — Frontend/backend integration and production build

**Status: VERIFIED**

Evidence:

- `npm run build` → `dist/` (SPA) + `build/server/node-build.mjs` (950 kB, **no
  `.map`**), clean.
- Built server smoke (production mode):
  - `/` → 200 `text/html`; `/assets/index-*.css` → 200 `text/css`;
    `/assets/index-*.js` → 200 `application/javascript`
  - `/assets/missing.js` → **404** (never SPA HTML)
  - `/server/node-build.mjs`, `/server/node-build.mjs.map`,
    `/build/server/node-build.mjs` → **404 text/plain** (never served)
  - `/some/spa/route` → 200 `text/html` (SPA fallback intact)
  - `/api/ping` → 200 JSON; `/api/definitely-missing` → 404 JSON
- Verified from a foreign working directory (`cwd=/tmp`): SPA still resolves
  (cwd-independent `import.meta.dirname` + `../../dist` candidate).
- CORS on the built server (trusted origin configured): valid origin gets ACAO;
  attacker `Host`+`Origin` gets none; a valid origin still gets ACAO even when
  `Host` is manipulated.

---

## 11. Area 10 — Environment and secret-management security

**Status: VERIFIED (static) / BLOCKED (live rotation)**

Evidence:

- `.gitignore` excludes `.env`, `.env.*`, `dist/`, `build/` (keeps
  `.env.example`). `git check-ignore .env` → ignored; **no `.env` tracked**.
- Hardcoded-secret scan found only **Supabase `anon` keys** (decoded payloads:
  `"role":"anon"`) in `client/lib/supabase.ts` and two seed scripts. Anon keys
  are public by design (shipped to every browser) and are gated by RLS; they are
  **not** service-role secrets. No service-role key, provider key or admin token
  is committed.
- Build output contains **no `.map` files** and no secret-looking strings
  (`grep -rlE "SERVICE_ROLE|GEMINI_API_KEY|ADMIN_API_TOKEN" dist build` → none).
- `npm audit --omit=dev` → 0 vulnerabilities.
- Config/health endpoints never return a credential.

**BLOCKED:** live secret rotation / DB-credential validation needs the host
secret store, unreachable from here.

---

## 12. Summary matrix

| # | Area | Status |
|---|---|---|
| 1 | Real LLM provider availability & inference | **VERIFIED** |
| 2 | Image-based plant disease diagnosis | **VERIFIED** (pipeline) / **PARTIALLY VERIFIED** (accuracy) |
| 3 | 8 microservices + Node integration | **VERIFIED** (booted, proxied, tests) / **PARTIALLY VERIFIED** (6 models synthetic) |
| 4 | Real agricultural market data | **BLOCKED** (no real feed) / VERIFIED (labelling) |
| 5 | Admin authn/authz | **VERIFIED** (fail-closed) |
| 6 | Frontend mock/demo data & provenance | **VERIFIED** (labelling) / **PARTIALLY VERIFIED** (sweep) |
| 7 | ar/fr/en localization | **PARTIALLY VERIFIED** (infra + 3 screens + microservices) |
| 8 | DB security, RLS, ownership | **BLOCKED** (no live DB) / VERIFIED (static) |
| 9 | Frontend/backend integration & build | **VERIFIED** |
| 10 | Env & secret management | **VERIFIED** (static) / **BLOCKED** (live) |

---

## 13. Bottom line

The AI layer is real and honest: with a provider configured, inference works
end-to-end (text **and** vision, both proven live), the health probe is accurate
and decoupled from the inference timeout, all eight microservices boot and are
proxied correctly, and nothing is fabricated when a back-end is missing. The app
builds, typechecks, lints, and passes **575 Jest + 194 pytest** tests.

Three confirmed defects were fixed with regression coverage — most importantly
**S-1**, where production was publicly serving the entire backend bundle and its
source map (full server source, including admin auth code). The remaining gaps
are **external-resource blockers** (live DB/RLS proof, a real market feed,
trained models) plus incremental i18n — none is a code regression.

---

## Addendum — 2026-11-11 (baseline `649de66`, branch `feat/soil-analysis-professional-report`)

A second independent pass audited the auth → profile → role → route chain
against the running code and the built server. Four defects were reproduced and
fixed, each with regression coverage; full detail in `FINAL_BLOCKERS.md`
(Addendum) and `AUTONOMOUS_PROGRESS.md` (Session 8). Summary:

| # | Defect | Status |
|---|---|---|
| A-1 | `ProtectedRoute` failed **open** when the profile had not loaded (`user &&` short-circuit) — `/admin-panel` reachable by a non-admin during that window | **VERIFIED FIXED** (`resolveRouteAccess`, fails closed) |
| A-2 | `AuthContext` fabricated `role: "farmer"` on profile-read failure — the reported wrong-dashboard symptom | **VERIFIED FIXED** (`roleVerified` gate) |
| A-3 | Generic error page caused by stale-deploy Vite chunk-load failures | **VERIFIED FIXED** (`lazyWithRetry`, one guarded reload) |
| A-4 | No compensating path when the signup trigger had not created `public.users` — new user locked out | **VERIFIED FIXED** (`POST /api/auth/ensure-profile`, JWT-scoped, idempotent, always `farmer`) |

Re-verified live on the built server: every admin route fails closed
(`/api/admin/users` 401, role PATCH 401); `ensure-profile` 401 anon / 503 forged
JWT; `/api/news` returns real publisher RSS. Gates after the pass:
`tsc --noEmit` 0 · `eslint` 0 · `npm run build` 0 · `npx jest` **793 passed,
2 skipped** · `pytest agrogrowth-ai/tests` **245 passed**. The
live-DB/RLS proof (Area 8) and a licensed market feed (Area 5) remain the only
external blockers.

