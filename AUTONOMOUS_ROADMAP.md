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
| 6 | Farmer CRUD persistence end-to-end | **BLOCKED** — needs live Supabase |
| 6a | Route guard fails **closed** when the trusted role is unloaded/unreadable | **VERIFIED FIXED** — `resolveRouteAccess` (`client/lib/routeAccess.ts`); 8 unit tests. Previously `ProtectedRoute` failed open (`user &&` short-circuit), leaking `/admin-panel` to a non-admin mid-load |
| 6b | `AuthContext` never fabricates a role | **VERIFIED FIXED** — `roleVerified` gate; fallback no longer defaults to `farmer` |
| 6c | Generic "unexpected error" page after a redeploy | **VERIFIED FIXED** — `lazyWithRetry` (guarded reload on chunk-load failure); 9 unit tests |
| 6d | New user recoverable when the signup trigger has not provisioned `public.users` | **VERIFIED FIXED** — idempotent, JWT-scoped `POST /api/auth/ensure-profile`; 4 integration tests |

## P1 — Multi-agent + AI services

| # | Item | Status |
|---|---|---|
| 7 | Central orchestrator with explicit plan/trace | **VERIFIED** — `agriculturalOrchestrator.ts`: allow-listed registry, dependency-aware plan, bounded-concurrency executor, per-step trace, dependency gating |
| 8 | Specialist agent contracts + tests | **VERIFIED** — 7 specialists, honest `insufficient_input`, 16 unit + 2 integration tests |
| 9 | Chatbot uses the orchestrator | **VERIFIED** — chat handler runs the orchestrator and returns `usedSpecialists` + `orchestrationTrace` |
| 10 | AI service URL config + health monitoring | **VERIFIED** — registry/env reconciled; 429 → `rate_limited` (reachable, inference unverified); production no longer reports localhost |
| 11 | Real inference verification for all eight services | **PARTIAL** — locally all eight `/health` endpoints answer 200 and self-declare model source (only `intelligent_agent` = LLM); hosted inference remains **BLOCKED** (no network/credentials here) |

## P2 — News, farm management, admin monitoring

| # | Item | Status |
|---|---|---|
| 12 | Tunisian agricultural news (fetch, parse, search, filter, cache) | **VERIFIED (live)** — real RSS sources, per-source status, search/filter/pagination/cache; UI at `/news` |
| 13 | Farm management workflows (farms, fields, crops, cycles, activities) | **VERIFIED (server)** — the comprehensive dashboard (`/api/farm-management/*`) was rewritten from random demo data to caller-scoped Supabase reads (farms, sections, cultivations, tasks, equipment, revenues, notifications, market quotes, stored weather). Domains with no persisted source report `null`/empty or fail closed (labour = 503), never a fabricated figure. 5 unit + 3 integration tests added. |
| 13a | Livestock module (herds, animals, weights, health, reproduction, feed) | **VERIFIED (schema+RLS+API)** — `database/livestock-persistence.sql` (6 owner-scoped tables, RLS, indexes) + `server/routes/livestock.ts` caller-scoped CRUD; the synthetic demo router was removed. RLS SCENARIO 10 (9 checks) passes against real PG17; 14 + 7 integration tests; frontend wired via `apiFetch` with a working add-animal flow. |
| 14 | Admin monitoring / analytics from real data | **VERIFIED (server)** — System tab: real Node process metrics; Analytics tab: live DB counts + per-role breakdown; Security tab: append-only audit-log events. Subscriptions remain honestly unavailable (no billing source). |

## P3 — UX, reports, performance, docs

| # | Item | Status |
|---|---|---|
| 15 | RTL / mobile / empty / loading / error states | **PARTIAL** — news page ships ar/fr/en + RTL + loading/empty/error states |
| 16 | Reports and documentation | **PARTIAL** |

---

## Next actionable steps (no blocker)

1. Extend the orchestrator's `market`/`pest_control` specialists to consume the
   news service and any licensed registry once available (they currently fail
   closed with `insufficient_input`).
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

## Steps that need an external resource

- End-to-end farmer CRUD: a Supabase project + `.env`.
- Live AI inference: network access to the eight Render hosts.
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
