# AgroGrowth — Autonomous Audit Report

**Auditor:** OpenHands (autonomous mission)
**Date:** 2026-11-11
**Baseline commit:** `649de66082c0aa8da2611856bc61c9b7b2f418f1`
**Branch:** `feat/soil-analysis-professional-report`
**Working tree at start:** clean
**Shallow clone:** no (unshallowed during audit)

This report is evidence-based. Every claim below was reproduced against the
checked-out code in this session. Nothing here is copied from prior docs.

---

## 1. What the platform actually is

A mature full-stack platform, not a starter template:

- **Frontend:** React 18 SPA (React Router 6), TypeScript, TailwindCSS 3, Radix UI.
  110+ pages under `client/pages/`, ~90 route registrations in `client/components/AppRouter.tsx`.
- **Backend:** Express 4, TypeScript, 224 route registrations in `server/index.ts`,
  ~90 routers in `server/routes/`. Single-port dev (8080) and prod (`PORT`).
- **Data:** Supabase Postgres. RLS hardening + user-lifecycle SQL committed under `database/`.
- **AI:** an in-process deterministic agronomic engine (`server/services/ai/`), a
  unified LLM/vision provider abstraction (`server/services/providers/`), and
  eight Python FastAPI microservices (`agrogrowth-ai/`, ports 8001–8008).
- **Tests:** Jest (603 tests across 72 suites), plus pytest inside `agrogrowth-ai/`,
  plus Cypress e2e.

## 2. Baseline health (reproduced this session)

| Check | Command | Result |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | **PASS** (exit 0) |
| Tests | `npx jest` | **57 failed / 543 passed / 3 skipped** (16 suites failed) |

`npm install` completed (849 packages). No `.env` is present, so the app runs in
its degraded/rule-based posture, which is the honest default.

## 3. Root-cause of the 57 test failures

The failures are **not** random. They are the residue of two opposing changes
landed on this branch:

1. **2026-11-03 — "honesty" pass** (`09aa320`, `ce0aab7`, `e7c1355`, `5dbb777`,
   `54d1d52`, `f311e39`). It made several deterministic endpoints return
   *honest 200s* with explicit provenance (`dataSource: "rule-based"` /
   `"reference-catalogue"` / `"simulated"`, `isRealData: false`), validated
   inputs (400/404/409 instead of 500), and added regression tests for that
   contract.

2. **2026-11-09/10 — "fail-closed" pass** (`6fe186c`, `dc9af11`, `02d00c6`,
   `76101e5`, and the admin-security commits). It then **gutted** many of those
   same routers to a blanket `router.use(... 503 ...)`, deleted the rule-based
   implementations, and added `requireRole`/`requireVerifiedAuth` guards to
   `/api/farms`, `/api/fields`, etc.

The two passes were never fully reconciled: the routers returned 503/403 while
the tests still asserted the earlier honest-200 / validation contract.

**Correction (2026-11-11, second pass).** The first pass of this audit proposed
restoring the fertilizer and smart-irrigation routers to their pre-gutting
versions. That was **wrong** and has been reverted. Those routers were gutted on
purpose by commits `6fe186c` ("remove unverified fertilizer doses and static
nutrient recipes") and `945b630` ("remove static irrigation schedules and
unvalidated water estimates"). Restoring them re-introduced **fabricated
agronomic data**: invented fertilizer doses (`200-300 kg/ha`), invented Tunisian
supplier names, invented pesticide active ingredients / concentrations / dosages
/ **pre-harvest intervals**, and fabricated weather (`25 °C, 65 % RH, 10 km/h`)
in `/api/smart-irrigation/start` — none of it labelled as synthetic. That
directly violates the platform's own honesty rules and the mission's §8 ("Do not
invent active ingredients, dosages, application rates, or pre-harvest
intervals"). The baseline fail-closed stubs are the correct, honest posture and
are preserved. The stale tests were reconciled to the fail-closed contract.

### Failure buckets

| Bucket | Suites | Examples | Verdict |
|---|---|---|---|
| Endpoints gutted to blanket 503 | `agro-endpoints-hardening` | fertilizer recommendations/schedule/effectiveness/inventory, smart-irrigation, weather-irrigation analytics, trader orders | **Baseline is correct** — the gutting removed fabricated dosages/PHIs/telemetry; tests reconciled to fail-closed |
| Role guard added without updating tests | `field-admin-hardening`, `param-route-hardening`, `field-recommendations-honesty`, `provenance` (agronomist) | `/api/fields`, `/api/farms`, `/api/ai-recommendations` now 403 | **Mixed** — guard is correct security; tests need a verified-identity fixture |
| Response-code / envelope drift | `admin-authorization`, `provenance` (supply-chain) | `ADMIN_*_NOT_CONNECTED` vs `DASHBOARD_DATA_SOURCE_NOT_CONNECTED`; `SUPPLY_CHAIN_*` vs `MARKETPLACE_*` | **Mixed** — tests pin a generic code; keep specific codes and update tests, or vice-versa |
| Route-contract drift | `route-contract`, `route-contract-live`, `client-server-contract` | client calls `/api/alerts/*`, `/api/tasks/*`, `/api/farm-operations/*` with **no mounted route** | **Real gap** — mount real (fail-closed) routers for these prefixes |
| Vision/upload | `vision-provider`, `vision-gateway`, `upload-validation` | `/api/disease/analyze` returns 503 before upload validation; vision gateway 503 | **Mixed** — validate upload content before the unavailable check; restore gateway forwarding contract |
| AI gateway | `ai-gateway-contract`, `ai-service-health-coverage`, `microservice-proxy` | crop recommendation short-circuits to 503 before calling the service; assistant alerts 503 | **Code regression** — dead code after an early `return res.status(503)` |

## 4. Genuine P0 findings (user-facing, beyond the test failures)

1. **Client calls unmounted routes.** `client/pages/AlertHistory.tsx`,
   `client/pages/MyTasks.tsx`, `client/components/AlertFeed.tsx` call
   `/api/alerts/*` and `/api/tasks/*`. These prefixes are mounted with
   `blockSimulatedData()` (fail-closed 503, *not* 404) so the pages degrade
   gracefully — they do not crash the app. This is the honest posture: the
   alert/task stores are in-memory fixtures with no persistence, so a 503 is
   correct until real tables exist. Not a bug; left fail-closed.
2. **Signup showed a success alert even when it must not. FIXED.** `Signup.tsx`
   unconditionally alerted "تم إنشاء الحساب بنجاح! يرجى تسجيل الدخول." after
   `signUp()`, even when Supabase created an auth user *without* a session
   (email confirmation required) — a false "you can log in now" message.
   `signUp` now returns `{ needsEmailConfirmation }` and the page shows the
   correct message ("check your email to confirm before signing in").
3. **Role-derived dashboard routing was incomplete. FIXED.** `signIn` routed
   only admins to `/admin-panel`; every other role landed on `/`. Added a
   `client/lib/roleDashboard.ts` map (farmer→/farmer-dashboard,
   agronomist→/agronomist-dashboard, trader, veterinarian, inspector, admin)
   with case-insensitive matching, the legacy `administrator` alias, and a safe
   `/` fallback. Unit-tested.
4. **Generic unexpected-error page. FIXED (root cause).** The top-level
   `ErrorBoundary` auto-redirected to `/` after 5 s via
   `window.location.href`, which discards session state and is itself a cause of
   "the app shows the wrong page / a generic error". The auto-redirect is
   removed; the boundary now offers explicit Retry / Home actions. Its
   `localStorage` read was also unguarded (`JSON.parse` of a corrupt value would
   crash the boundary itself) and is now wrapped in try/catch.

## 5. Security posture (verified)

- Backend admin auth is sound: `requireAdminAccess` fails closed in production
  (verified by `admin-authorization` and `admin-panel-auth` suites, which pass
  for the anonymous/forged-token cases).
- `public.users` role is the single source of trust; client-supplied roles are
  ignored; the `handle_new_auth_user` trigger forces `role='farmer'`.
- RLS hardening + append-only admin audit log + last-admin protection exist.
- No secrets committed; only public Supabase anon keys are embedded (RLS-gated).

## 6. AI services (source-level, honest)

Eight FastAPI services exist. Per their own health metadata and the committed
`AI_SERVICES_STATUS.md`, numeric engines are synthetic/heuristic; only the soil
lab-regressor artifacts and the image-diagnosis ONNX model are real artifacts,
and neither is field-validated for Tunisia. The platform already labels this
honestly. No production `localhost` URLs should remain in `render.yaml`.

## 7. Final state (second pass, 2026-11-11)

| Check | Command | Result |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | **PASS** (exit 0) |
| Lint (changed files) | `npx eslint …` | **PASS** |
| Tests | `npx jest` | **601 passed / 2 skipped / 603 total** (72 suites passed, 1 skipped) |
| Build | `npm run build` | **PASS** |

Changes made this pass:

- **Reverted the fertilizer/smart-irrigation router restores** to the baseline
  fail-closed stubs (they re-introduced fabricated dosages/PHIs/telemetry).
- Reconciled `tests/integration/agro-endpoints-hardening.test.ts` to the
  fail-closed contract (17 cases).
- **Signup** now distinguishes "account created, confirm your email" from
  "account created, sign in" instead of always claiming success.
- **Role→dashboard routing** map added (`client/lib/roleDashboard.ts`) + unit
  test; sign-in now lands each role on its own dashboard.
- **ErrorBoundary** auto-redirect removed; `localStorage` read hardened; explicit
  Retry / Home actions and the underlying error message shown.

## 8. Not implemented / blocked (honest status)

- **Tunisian agricultural news** — no news router, page, or parser exists in the
  repository. **NOT IMPLEMENTED.** Building it needs outbound network access to
  the source sites (Tunisie Agriculture, ONAGRI, APIA, Agridata, TAP) and a
  persistence/cache layer; it is a feature build, not a repair.
- **Central multi-agent orchestrator** — `server/services/ai/farmAdvisor.ts`
  exists (a 593-line keyword-based specialist router with provenance-preserving
  grounding). It is **PARTIAL**: it selects specialist domains and grounds
  answers in stored records, but there is no explicit execution-plan / DAG /
  parallel executor with per-step trace as the mission describes.
- **Eight AI microservices** — implementations exist under `agrogrowth-ai/`;
  their bundled models are synthetic-demo. Live inference against the Render
  hosts was **NOT VERIFIED** here (no credentials/network in this environment;
  the last external snapshot reported 4 reachable-but-429, 4 unconfigured).
- **Farmer CRUD persistence** — requires a live Supabase project (`.env` is
  absent here), so end-to-end persistence could not be exercised. **BLOCKED** on
  database credentials.

## 9. Plan of record

The honesty-preserving repairs are complete and green. Remaining work is
feature-building (Tunisian news), orchestration hardening (explicit plan/trace),
and live-environment verification (Supabase persistence, deployed AI services) —
all of which need resources not present in this environment.

## 10. Session 2 update (2026-11-11, later)

Two P1/P2 items from section 8 have since been delivered and verified:

- **Central multi-agent orchestrator — now VERIFIED.** Built
  `server/services/ai/agriculturalOrchestrator.ts` (allow-listed specialist
  registry, dependency-aware plan, bounded-concurrency executor, per-step trace,
  dependency gating, honest `insufficient_input`) and wired it into the chat
  handler (`POST /api/ai/assistant/chat`), which now returns `usedSpecialists`
  and `orchestrationTrace`. 16 unit + 2 integration tests pass.
- **Tunisian agricultural news — now VERIFIED (live).** Built
  `server/lib/rssParser.ts`, `server/services/news/tunisianAgriNews.ts`,
  `server/routes/tunisian-news.ts` (`GET /api/news`, `GET /api/news/sources`,
  real-data provenance) and `client/pages/TunisianAgriNews.tsx` (route `/news`).
  Verified against the real internet: 6 sources up, 132 articles, all
  attributed + dated. 20 tests pass (6 parser, 11 service, 3 API).

Two real bugs were found and fixed during live verification: JS `\b` does not
work for Arabic script (leaked non-agricultural articles), and a derived
category self-matched the keyword filter. Both are now covered by regression
tests.

Full verification after both features: `tsc --noEmit` exit 0, eslint exit 0,
`npm run build` exit 0, `npx jest` 639 passed / 2 skipped / 641 total.

Still **BLOCKED** (unchanged): live AI microservice inference (no credentials /
the hosts rate-limit), and end-to-end farmer CRUD persistence (no Supabase
`.env` in this environment).

