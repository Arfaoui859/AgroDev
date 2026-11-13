# AgroGrowth — Autonomous Mission Roadmap

**Baseline:** `649de66` · **Branch:** `feat/soil-analysis-professional-report`

Priority order from the mission brief. Status reflects the 2026-11-11 pass.

---

## P0 — Correctness, auth, persistence

| # | Item | Status |
|---|---|---|
| 1 | Application does not crash / generic error page | **VERIFIED FIXED** — ErrorBoundary auto-redirect removed, retry offered |
| 2 | Registration messaging (email-confirmation vs immediate sign-in) | **VERIFIED FIXED** |
| 3 | Role→dashboard routing (farmer/agronomist/trader/vet/inspector/admin) | **VERIFIED FIXED** — map + unit test |
| 4 | Admin authorization (server-side, fail-closed) | **VERIFIED** (existing `requireAdminAccess`, `requireRole`; suites pass) |
| 5 | No fabricated agronomic data (fertilizer doses, PHIs, irrigation telemetry) | **VERIFIED** — routers fail closed at baseline |
| 6 | Farmer CRUD persistence end-to-end | **VERIFIED** — a real Postgres 17 + PostgREST stack was stood up locally and the SPA's own REST path exercised with real HS256 JWTs: a farmer creates/reads their own farm, a second farmer and anon see nothing, cross-tenant update/delete affect 0 rows, ownership spoof is denied (`42501`), self-role-escalation is denied, `admin_change_user_role` is not client-callable and rejects a non-admin actor, and `admin_audit_logs` is unreachable by clients. Reproduced by `scripts/verify-local-persistence.sh` (13 checks) and wired into CI. |
| 6a | Route guard fails **closed** when the trusted role is unloaded/unreadable | **VERIFIED FIXED** — `resolveRouteAccess` (`client/lib/routeAccess.ts`); 8 unit tests. Previously `ProtectedRoute` failed open (`user &&` short-circuit), leaking `/admin-panel` to a non-admin mid-load |
| 6b | `AuthContext` never fabricates a role | **VERIFIED FIXED** — `roleVerified` gate; fallback no longer defaults to `farmer` |
| 6c | Generic "unexpected error" page after a redeploy | **VERIFIED FIXED** — `lazyWithRetry` (guarded reload on chunk-load failure); 9 unit tests |
| 6d | New user recoverable when the signup trigger has not provisioned `public.users` | **VERIFIED FIXED** — idempotent, JWT-scoped `POST /api/auth/ensure-profile`; 4 integration tests |

## P1 — Multi-agent + AI services

| # | Item | Status |
|---|---|---|
| 7 | Central orchestrator with explicit plan/trace | **VERIFIED** — `agriculturalOrchestrator.ts`: allow-listed registry, dependency-aware plan, bounded-concurrency executor, per-step trace, dependency gating. The full soil→weather→crop→irrigation workflow now has a regression test built from real-shaped persisted records (`tests/unit/agricultural-orchestrator.test.ts`, 17 tests) |
| 8 | Specialist agent contracts + tests | **VERIFIED** — 10 specialists (`soil`, `lab_soil`, `weather`, `crop`, `irrigation`, `plant_health`, `market`, `agri_news`, `pest_control`, `finance`), honest `insufficient_input`, 34 unit + 4 integration tests |
| 9 | Chatbot uses the orchestrator | **VERIFIED** — chat handler runs the orchestrator and returns `usedSpecialists` + `orchestrationTrace` |
| 10 | AI service URL config + health monitoring | **VERIFIED** — registry/env reconciled; 429 → `rate_limited` (reachable, inference unverified); production no longer reports localhost |
| 10a | No browser→microservice direct calls | **VERIFIED FIXED (Session 5b)** — `client/lib/cloud-config.ts` no longer exposes the direct-probe helpers (`checkServiceHealth`, `checkAllServicesHealth`, `robustCloudFetch`) or the `VITE_*_URL` host fields; `useAIServices` always routes through the backend AI gateway so the provenance gate cannot be bypassed. Guarded by `tests/unit/no-direct-microservice-calls.test.ts`; deploy docs corrected. |
| 11 | Real inference verification for all eight services | **VERIFIED (hosted, Session 5)** — all eight deployed `/health` return 200 (earlier 429s were Render cold-start rate limiting). Real trained-model/LLM inference confirmed **on the deployed hosts**: (a) `ai-soil-analysis` `POST /predict-lab-soil` returns 7/7 targets from the trained wetchem models with per-target R²/MAE/RMSE (e.g. carbon_organic R²=0.86) and honest `insufficient_input` + coverage on sparse input; (b) `agrogrowth-image-diagnosis` `POST /detect-disease` runs the MobileNetV3 PlantVillage ONNX classifier; (c) `agrodev-4` `POST /chat` returns a real Arabic LLM answer. The other five self-declare synthetic/rule-based and **fail closed on the deployed host** with a named code (`CROP_MODEL_NOT_VALIDATED`, `LIVE_MARKET_FEED_NOT_CONFIGURED`, `YIELD_MODEL_NOT_VALIDATED`, `IRRIGATION_MODEL_NOT_VALIDATED`) or return an honest rule-based result (`pest_control` `/identify-pest`, confidence 0.0). |
| 11a | Orchestrator uses trained lab models (`lab_soil`) | **VERIFIED** — allow-listed specialist; no network call without analytes; `trained-model-inference` provenance with per-target R²; honest `failed`/`unavailable`; live-verified 7/7 targets and sparse-input `insufficient_input` |
| 11b | Orchestrator uses the real pest-control service (`pest_control`) | **VERIFIED** — allow-listed specialist now calls `POST /identify-pest` when the user describes symptoms; always `rule-based` / `isRealData:false` / `confidence:low` (the service is a keyword matcher, never a trained classifier); never a product/dose; honest `unavailable` when the service is down; live-verified aphids from an Arabic symptom sentence |
| 11c | Lightweight operational probes (`/ready`, `/metrics`) on all eight services | **VERIFIED** — `register_service_probes` in `ai_common/base_service.py`, registered in all eight services; `/ready` never loads a model, `/metrics` reports real process counters; `/api/ai/health` probes `/ready` first; docker-compose healthchecks added; 16 Python checks; live 200 on 8001–8008 |

## P2 — News, farm management, admin monitoring

| # | Item | Status |
|---|---|---|
| 12 | Tunisian agricultural news (fetch, parse, search, filter, cache) | **VERIFIED (live)** — real RSS sources, per-source status, search/filter/pagination/cache; UI at `/news`. The chatbot now also answers news questions through the `agri_news` orchestrator specialist (real fetched headlines with publisher + original link; `unavailable`/no findings when no feed answers). |
| 13 | Farm management workflows (farms, fields, crops, cycles, activities) | **VERIFIED (server)** — the comprehensive dashboard (`/api/farm-management/*`) was rewritten from random demo data to caller-scoped Supabase reads (farms, sections, cultivations, tasks, equipment, revenues, notifications, market quotes, stored weather). Domains with no persisted source report `null`/empty or fail closed (labour = 503), never a fabricated figure. 5 unit + 3 integration tests added. |
| 13a | Livestock module (herds, animals, weights, health, reproduction, feed) | **VERIFIED (schema+RLS+API)** — `database/livestock-persistence.sql` (6 owner-scoped tables, RLS, indexes) + `server/routes/livestock.ts` caller-scoped CRUD; the synthetic demo router was removed. RLS SCENARIO 10 (9 checks) passes against real PG17; 14 + 7 integration tests; frontend wired via `apiFetch` with a working add-animal flow. |
| 14 | Admin monitoring / analytics from real data | **VERIFIED (server)** — System tab: real Node process metrics; Analytics tab: live DB counts + per-role breakdown; Security tab: append-only audit-log events. Subscriptions remain honestly unavailable (no billing source). |

## P3 — UX, reports, performance, docs

| # | Item | Status |
|---|---|---|
| 15 | RTL / mobile / empty / loading / error states | **PARTIAL** — news page ships ar/fr/en + RTL + loading/empty/error states; global `dir`/`lang` set by `LanguageContext` and `<html dir="rtl">` |
| 15a | Arabic text integrity (no U+FFFD mojibake) | **VERIFIED FIXED (Session 21)** — 555 corrupted characters across ~97 source files repaired; guarded by `tests/unit/no-encoding-corruption.test.ts` |
| 16 | Reports and documentation | **PARTIAL** |

---

## Next actionable steps (no blocker)

1. Extend the orchestrator's `market` specialist to consume a licensed market
   registry once available (it currently fails closed with `insufficient_input`).
   The `agri_news` specialist is now wired to the real news service. *(Done.)*
2. Add an Admin "news source status" panel backed by `GET /api/news/sources`.
   *(Done — `GET /api/admin/news-sources`, backed by the real news service.)*
3. Continue hardening farm-management workflows against live Supabase.
4. ~~Give the dead-button demo pages (e.g. DigitalTraining, DynamicPricing) a
   `SimulatedDataNotice` where they are routed, or wire their buttons — they
   currently render no-op CTAs with no disclosure.~~ **Done — all routed
   demo/mock pages carry `SimulatedDataNotice` (`tests/unit/simulated-page-disclosure.test.ts`, 106 checks).**
5. ~~Every SPA call to an authenticated `/api/...` path must attach the bearer
   token.~~ **Done — Session 12: 29 bare-`fetch` call sites (revenue, vet,
   inspector, breeding, profitability, budget, overview cards, livestock
   alerts) switched to `apiFetch`; guarded by
   `tests/unit/client-auth-fetch.test.ts`.**
6. ~~Sensor registry (`GET /api/sensors`) and budget planning (`/api/budget-plans`)
   returned unconditional 501/503.~~ **Done — Session 11.** Both now persist
   under owner-scoped RLS; budget projections derive from the caller's own
   ledger and are labelled `derived:user-history`.
7. ~~Raw provider/Postgres error messages reached clients from public
   endpoints.~~ **Done — Session 15.** `notifications`, `autonomous-farm-agent`,
   `weather` and the AI gateway now log server-side and return fixed/coarse
   messages; `tests/integration/error-disclosure.test.ts` pins it.
8. ~~Verify the eight AI services locally.~~ **Done — Session 14.** All eight
   boot and answer `/health` 200; soil inference is real, the rest fail closed
   with `*_MODEL_NOT_VALIDATED`. Remaining: hosted inference (external).

## Steps that need an external resource

- End-to-end farmer CRUD against hosted Supabase: needs the hosted project +
  `.env` (local PG17 + PostgREST equivalence is already verified).
- ~~Live AI inference: network access to the eight Render hosts.~~ **Done —
  Session 5: all eight deployed hosts probed for real inference (see #11).**
- Verifying email-confirmation → `email_verified` sync: a real Supabase auth
  flow (the trigger sets it only at first insert; see audit note).

---

## Session 13 — final hardening sweep (evidence)

| Area | Result |
|---|---|
| Unauthenticated route sweep (129 `GET /api/*`) | **VERIFIED** — only `/api/health`, `/api/ping`, `/api/ai/health` return 200; 63×401, 3×403, 54×503 (fail-closed fixtures), 4×400, 2×404. No data-bearing route is anonymously readable. |
| News feature (live) | **VERIFIED** — 139 real articles / 6 sources; `?q=` (ar), `?language=ar|fr`, `?category=<facet>`, pagination (cap 50) all work; every article carries a publisher name + original link. |
| Public endpoint URL leakage | **VERIFIED** — `/api/ai/capabilities` and `/api/system/ai` expose no internal `http(s)` service URLs or credentials. |
| SSRF | **VERIFIED (none)** — microservice base URLs come only from env (`serviceBaseUrl`); no route accepts a client-supplied URL. |
| Hardcoded secrets / localhost | **VERIFIED (none)** — no `sk-…`, `onrender.com`, or `localhost` in non-test server/client source. |
| Weather/yield provenance | **VERIFIED** — router now forwards to the real port-8006 microservice and tags declared provenance; fabricated `Math.random()` yields removed. |
| Remaining `Math.random` | `farmer-collaboration` (in-memory, fail-closed 503) and `field-management` (comment only) — neither reaches a client as persisted data. `http.ts` use is legitimate retry jitter. |
| Admin auth | **VERIFIED** — 51 tests across 4 admin suites; role change requires a verified JWT + allow-listed role via `admin_change_user_role` RPC. |
| Role→dashboard routing | **VERIFIED** — `dashboardRouteForRole` + `ProtectedRoute`; login redirects from the persisted profile role. |
| render.yaml env wiring | **FIXED** — weather/yield now sets both `WEATHER_YIELD_INTELLIGENCE_URL` and `SMART_MARKETPLACE_URL`; stale TODO removed. |

**Gates (all green):** `npx tsc --noEmit` 0 · `npm run lint` 0 · `npx jest`
860 passed / 3 skipped · Python per-service 245 passed.
