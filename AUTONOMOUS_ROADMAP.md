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
4. Give the dead-button demo pages (e.g. DigitalTraining, DynamicPricing) a
   `SimulatedDataNotice` where they are routed, or wire their buttons — they
   currently render no-op CTAs with no disclosure.

## Steps that need an external resource

- End-to-end farmer CRUD: a Supabase project + `.env`.
- Live AI inference: network access to the eight Render hosts.
- Verifying email-confirmation → `email_verified` sync: a real Supabase auth
  flow (the trigger sets it only at first insert; see audit note).
