# AgroGrowth — Autonomous Mission Progress

**Baseline commit:** `649de66082c0aa8da2611856bc61c9b7b2f418f1`
**Branch:** `feat/soil-analysis-professional-report`
**Last updated:** 2026-11-11 (session 3 — orchestrator lab specialist + ONNX runtime)

Legend: **VERIFIED** (proven by real execution this session) ·
**IMPLEMENTED BUT NOT VERIFIED** · **EXPERIMENTAL** · **BLOCKED** ·
**NOT IMPLEMENTED**.

---

## Completed this pass

| Item | Status | Evidence |
|---|---|---|
| Fertilizer/smart-irrigation routers reverted to baseline fail-closed stubs | **VERIFIED** | `git checkout HEAD -- server/routes/fertilizer-recommender.ts server/routes/smart-irrigation.ts`; both answer 503 `FERTILIZER_REFERENCE_NOT_VERIFIED` / `SMART_IRRIGATION_NOT_VALIDATED` |
| `agro-endpoints-hardening.test.ts` reconciled to fail-closed contract | **VERIFIED** | 17/17 pass |
| Signup no longer claims success when email confirmation is pending | **VERIFIED** | `client/pages/Signup.tsx` + `signUp` returns `{ needsEmailConfirmation }` |
| Role→dashboard routing map + unit test | **VERIFIED** | `client/lib/roleDashboard.ts`, `tests/unit/role-dashboard-routing.test.ts` 6/6 pass |
| ErrorBoundary: no silent auto-redirect; hardened localStorage read | **VERIFIED** | `client/components/ErrorBoundary.tsx` |
| Full suite | **VERIFIED** | `npx jest` → 642 passed, 2 skipped, 644 total |
| Typecheck / lint / build | **VERIFIED** | `tsc --noEmit` exit 0; eslint exit 0; `npm run build` exit 0 |

## Session 2 — P1 multi-agent orchestrator + P2 Tunisian news

### Central multi-agent orchestrator — **VERIFIED**

- `server/services/ai/agriculturalOrchestrator.ts` — allow-listed specialist
  registry (soil, weather, crop, plant_health, pest_control, irrigation, market),
  a planner with transitive dependencies, a bounded-concurrency executor with
  dependency gating (a dependent step is `blocked` when its upstream failed),
  per-step timeouts/retries, an honest `insufficient_input` status, and a
  provenance-preserving composer. It runs network-free over already-verified
  context, so it can never invent inputs.
- Wired into the chat handler `POST /api/ai/assistant/chat`
  (`server/routes/ai-services-gateway.ts`): the orchestration's grounded facts
  are appended to the advisor context as labelled evidence, and the response now
  carries `usedSpecialists` and a structured `orchestrationTrace`.
- Tests: `tests/unit/agricultural-orchestrator.test.ts` (16) +
  `tests/integration/assistant-orchestration.test.ts` (2) — all pass.

### Tunisian agricultural news — **VERIFIED (live)**

- `server/lib/rssParser.ts` — dependency-free RSS 2.0 / Atom parser
  (entity decoding, CDATA/tag stripping, no evaluation).
- `server/services/news/tunisianAgriNews.ts` — real sources
  (La Presse, Business News, African Manager, Mosaïque FM + Google News
  agriculture feeds), per-source failure isolation, agriculture filtering,
  dedup, search, category/language filter, pagination, TTL caching.
- `server/routes/tunisian-news.ts` — `GET /api/news`,
  `GET /api/news/sources`, stamped `X-Is-Real-Data: true` / `dataSource:
  "rss-feeds"`.
- `client/pages/TunisianAgriNews.tsx` + route `/news` + Layout nav entry
  (ar/fr/en, RTL-aware).
- Tests: `tests/unit/rss-parser.test.ts` (6),
  `tests/unit/tunisian-news.test.ts` (11),
  `tests/integration/tunisian-news-api.test.ts` (3) — all pass.
- Live verification (built server, real internet): all 6 sources UP,
  `total: 132`, `isRealData: true`, articles attributed + dated, search works.
- Two real bugs found and fixed while verifying live: (1) JS `\b` does not work
  for Arabic, so `/ري\b/` matched inside "حريقا" and leaked non-agricultural
  articles — replaced with Unicode-aware boundaries; (2) the derived category
  "irrigation & eau" self-matched the keyword filter — agriculture
  classification now uses raw headline/summary/publisher categories only.

### AI service health monitoring — **VERIFIED (hardened)**

- `server/routes/ai-services-gateway.ts`: the health fallback (error path) had a
  hardcoded 5-service list that disagreed with the real 8-service registry.
  Extracted a single `serviceRegistry()` helper used by both the live check and
  the fallback, so `totalServices`/`notConfiguredServices` are always correct.
- 429 handling was already honest (host reachable, inference unverified) and is
  covered by `tests/integration/ai-service-health-coverage.test.ts`.

### Admin — real news-source status — **VERIFIED (live)**

- New `GET /api/admin/news-sources` (`getAdminNewsSourceStatus` in
  `server/routes/admin-panel.ts`), gated by `requireAdminAccess`. Returns the
  live per-source availability from the same probe the public news endpoint uses
  — real data, never fake counters.
- Admin UI (`client/pages/AdminPanel.tsx`): new "News Sources" tab rendering
  per-source up/down status, item counts and errors.
- Verified live: anonymous → 401; authorized → 200 with 6/6 sources UP,
  132 articles. Test: `tests/integration/admin-authorization.test.ts` now covers
  the endpoint (26/26 pass).

### AI capability reporting — production localhost leak — **VERIFIED FIXED**

- Real bug: `server/routes/ai-capabilities.ts` defaulted every unset service URL
  to `http://localhost:<port>`. In a hosted runtime this reported
  `microserviceConfigured: true` (and `microserviceUrl: "http://localhost:..."`)
  for services that cannot exist there, and treated microservice-primary
  capabilities as *available* merely because a URL string existed.
- Fix: reuse the gateway's `normalizeServiceUrl` + `localServiceFallback`
  (which returns `""` under `NODE_ENV=production` / Render). Empty URLs are now
  reported as `null`, and `resolveEngine` degrades a microservice-primary
  capability to its declared fallback (`unavailable`) when no URL is set.
- Regression test: `tests/integration/capability-no-localhost.test.ts`
  (production posture → no capability contains "localhost"; unset
  pest/irrigation/weather/market capabilities are `unavailable` + unconfigured).

### Admin Panel — dead tabs (System/Security/Subscriptions) — **VERIFIED FIXED**

- Real UI bug: `client/pages/AdminPanel.tsx` declared `TabsTrigger`s for
  `system`, `security` and `subscriptions` but no matching `TabsContent`, so
  clicking them showed a blank panel.
- Added honest content: the System tab shows real runtime metrics when the
  endpoint is connected and an explicit "monitoring not connected" alert
  otherwise; Security and Subscriptions show honest unavailable states (never a
  fabricated zero count). Removed the duplicate "System Health" card above the
  tabs.
- Regression test: `tests/unit/admin-panel-tabs.test.ts` asserts every trigger
  has matching content.

## Session 3 — honest disclosure for fixture-backed routed pages

- `client/pages/DynamicPricing.tsx` and
  `client/pages/QualityInventoryManagement.tsx` seed hardcoded arrays inside a
  `setTimeout` behind a "// Simulate API calls" comment, then render them as if
  live — no `SimulatedDataNotice`, against the AGENTS.md convention. Added the
  notice to both.
- `client/pages/WaterConservationAnalytics.tsx` renders `sampleUsageData` /
  `sampleInsights` fixture objects (the real fetch is commented out) with no
  disclosure. Added the notice.
- Regression test: `tests/unit/simulated-page-disclosure.test.ts` — every page
  file containing a fixture marker ("Simulate API call", "Mock data for
  demonstration") must import `SimulatedDataNotice` or `DataProvenanceBanner`.

## Session 4 — dead action buttons in routed pages

Audited every `<Button>` in the routed pages the prior pass flagged as "loads
real data". Four rendered with no handler and did nothing on click:

- `client/pages/ExpenseTracker.tsx` — "تصدير" had no `onClick`. Added
  `exportToCSV()` (BOM-prefixed CSV of `filteredExpenses`, RFC-4180 quoting,
  disabled when the list is empty).
- `client/pages/ProfitabilityReports.tsx` — "تصدير التقرير" had no `onClick`.
  Added `exportReport()` (JSON of summary + per-crop rows + AI analysis).
- `client/pages/DiseaseDiagnosis.tsx` — "مشاركة" had no `onClick`. Added
  `shareDiagnosis()` using `navigator.share` with a clipboard fallback; the
  shared text preserves the `isRealData` provenance label.
- `client/pages/DiseaseGuide.tsx` — the "زيارة الموقع" resource button ignored
  the `resource.link` it was rendered from. Wrapped in `<a target="_blank"
  rel="noopener noreferrer">`.

Regression test: `tests/unit/dead-action-buttons.test.ts` (brace-depth-aware JSX
tag extractor, so `onClick={() => ...}` does not truncate the tag).

## Prior-pass work preserved (verified still green)

- AI gateway image-microservice response handling
  (`respondFromImageMicroservice(res, data, true)`).
- Top-level `ErrorBoundary` mounted in `client/App.tsx`.
- Test-harness reconciliation for fail-closed mounts (route-contract,
  client-server-contract, ai-gateway-contract, ai-service-health-coverage).
- `client/pages/AIAssistantChatbot.tsx` evidence-url template-literal fix.

## Session 5 — real admin monitoring (no fake counters)

The admin System and Analytics tabs previously showed nothing: both endpoints
returned a blanket 503. They now serve real data.

- `GET /api/admin/system-metrics` (was `ADMIN_SYSTEM_METRICS_NOT_CONNECTED`):
  measures the real Node process — CPU via a `process.cpuUsage()` delta over a
  120 ms window, RSS as a share of `os.totalmem()`, disk via `fs.statfsSync`,
  event-loop lag via a `setTimeout(0)` scheduling delay, plus uptime, CPU count,
  load/CPU and Node version. `diskUsage` is `null` when the filesystem stats are
  unavailable. Provenance: `node-process` / `verified`.
- `GET /api/admin/usage-analytics` (was `ADMIN_USAGE_ANALYTICS_NOT_CONNECTED`):
  live counts from `public.users` / `public.farms` (total, active, new-30d,
  prior-30d, growth %, per-role breakdown). `retentionRate`, `totalRevenue` and
  `monthlyRecurringRevenue` are **null** — there is no session-analytics or
  billing source, and null is never rendered as 0.
- `GET /api/admin/security-events` (was `ADMIN_SECURITY_EVENTS_NOT_CONNECTED`):
  derived from the append-only `public.admin_audit_logs`; severity is a fixed
  mapping of the recorded action, not an inferred score.
- `client/pages/AdminPanel.tsx`: System tab renders the measured values (with
  `formatUptime`, honest `—` for unavailable disk/lag); Analytics tab shows live
  counts, an explicit "revenue not connected" notice, and a per-role breakdown.

Tests: `tests/integration/admin-monitoring.test.ts` (4) and an added case in
`tests/integration/admin-authorization.test.ts`. The stale assertion that
system-metrics was DB-gated (expecting 503) was corrected — it is process-backed,
not DB-backed.

## Session 6 — AI health check is rate-limit aware

`GET /api/ai/health` now parses `Retry-After` from a 429 health response and
reports `retryAfterMs` per service, so a rate-limited-but-reachable host is
reported honestly (`status: "rate_limited"`, `reachable: true`) and never counted
as available. Regression: `tests/integration/ai-health-rate-limit.test.ts`.

## Session 7 — Python AI service verification (real)

Created `agrogrowth-ai/.venv` from `requirements-test.txt` and ran the real
suite: **245 passed**. Individually imported each of the eight FastAPI apps and
hit `/health`; every one answered HTTP 200 and self-declared its model source:

| Service | `/health` | `model_source` |
|---|---|---|
| soil_analysis | 200 | deterministic-rules |
| crop_recommendation | 200 | synthetic-demo-disabled |
| image_diagnosis | 200 | heuristic-demo |
| market_prediction | 200 | synthetic-demo |
| intelligent_agent | 200 | gemini:gemini-flash-latest |
| weather_yield_intelligence | 200 | synthetic-demo |
| pest_control | 200 | synthetic-demo |
| irrigation_optimization | 200 | synthetic-demo |

This confirms the honesty contract: only `intelligent_agent` self-reports an LLM
provider; the rest are deterministic/synthetic and are labelled as such by the
Node gateway (`isRealModel: false`, `modelTrainedOnSyntheticData: true`). These
are **local** results — not evidence that any hosted deployment is reachable.

## Session 8 — farm-management dashboard: real persistence, no random data

The comprehensive farm dashboard (`/api/farm-management/*`) previously generated
random alerts, crops, weather, market prices, equipment and payroll figures, and
a prior pass had reduced it to a blanket 503. Rebuilt it on real, tenant-scoped
persistence instead:

- `server/routes/comprehensive-farm-management.ts` now reads the caller's own
  rows through `scopedClientFromAuthHeader` (so RLS evaluates `auth.uid()`):
  `farms`, `farm_sections`, `crop_cultivations`, `farm_tasks`, `farm_equipment`,
  `farm_revenues`, `notifications`, public `market_prices`, and stored
  `weather_records`.
- Nothing is invented. Domains with no connected source report `null`/empty
  (`summary.workersPresent = null`, `crops[].soilMoisture = null`,
  `market[].priceChange = null`, `weather = null` when no record) rather than a
  plausible number. `/api/farm-management/labor` fails closed with 503
  `FARM_LABOR_NOT_CONNECTED`.
- The pure mapping `buildFarmOverview` is exported and unit-tested.
- The overview now also returns real `equipment` (from `farm_equipment`) and
  `financial` (from `farm_expenses` + `farm_revenues`) blocks, with
  `profitMargin` null when there is no revenue.
- `client/components/ComprehensiveOverviewCards.tsx` (rendered on the farmer
  overview tab) fell back to hardcoded figures (25.5 ha, 87% soil health,
  245 animals, 156 780 TND revenue) with no disclosure — against the AGENTS.md
  convention. Added the required `SimulatedDataNotice`; the page's own summary
  card now shows `—` instead of `0` for the unavailable worker count.
- `client/pages/ComprehensiveFarmManagement.tsx`: the header weather card and
  the whole Weather tab (current conditions + a fabricated 7-day forecast) and
  the Market tab (six invented crop prices) no longer fall back to invented
  numbers — they render `—` / an honest empty state. Equipment status filters
  were aligned to the real `active` enum value and unpersisted telemetry
  (usage/fuel/next-maintenance) shows `—`.

Tests: `tests/unit/farm-management-overview.test.ts` (7) and
`tests/integration/farm-management-route.test.ts` (3 — anonymous rejected,
verified farmer scoped, labour fails closed). Full suite: **770 passed, 2
skipped**; TSC 0, lint 0, build 0. Built server probed live: `/api/ping` 200;
`/api/farm-management/{overview,labor}` fail closed with 401 for an anonymous
caller (no `.env` here, so authenticated persistence paths remain unverified
locally).


## Session 8 — P0 auth/authorization defects (route guard + role fabrication)

Two real, exploitable frontend authorization defects were found and fixed.

### 1. `ProtectedRoute` failed OPEN when the profile had not loaded — **VERIFIED FIXED**

- `client/components/ProtectedRoute.tsx` guarded with
  `allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)`.
  When `user === null` — an authenticated session whose `public.users` row had
  not loaded (or whose read failed) — the `user &&` term short-circuited the
  entire check, so the guarded element rendered. During that window
  `/admin-panel` was reachable by a non-admin, and every role-gated dashboard
  rendered for the wrong role.
- Fix: the access decision is now a pure, tested function
  `resolveRouteAccess` in `client/lib/routeAccess.ts` that fails closed — a
  role-gated route renders only once the trusted profile has loaded
  (`roleVerified`) and its role is in the allow-list. Anonymous callers still
  go to `/login`; a denied/unknown role goes to the route's `fallbackRoute`
  (no redirect loop: role dashboards fall back to the ungated
  `/farmer-dashboard`, the admin panel to `/`).
- Regression test: `tests/unit/route-access.test.ts` (8 cases), including
  "fails closed when the trusted role has not loaded" and "fails closed when
  the role read failed even if a role is present".

### 2. `AuthContext` fabricated `role: "farmer"` on profile-read failure — **VERIFIED FIXED**

- `client/contexts/AuthContext.tsx` `loadUserData` fell back, when the
  `public.users` read failed, to a minimal user object with a hardcoded
  `role: "farmer"` — the direct cause of the reported "wrong dashboard / wrong
  user state". A real admin whose profile read transiently failed would be
  treated as a farmer (and vice-versa the guard above would leak).
- Fix: the context now exposes `roleVerified`, true only after the trusted row
  is read. The failure fallback keeps the authenticated identity for display but
  sets `roleVerified = false`, so role-gated routes deny instead of guessing.
  All `setUser(null)`/sign-out paths reset `roleVerified` too.
- The sign-up path was already server-authoritative (no client role accepted;
  `public.users` is provisioned by the `handle_new_auth_user` trigger as
  `farmer`, with `prevent_self_role_escalation` blocking self-elevation) —
  audited and left unchanged.

### 3. Stale-deploy chunk-load → generic error page — **VERIFIED FIXED**

- The generic "حدث خطأ غير متوقع" page was most commonly the ErrorBoundary
  catching a Vite chunk-load failure after a redeploy (an open tab references
  old hashed chunk names). Added `client/lib/lazyWithRetry.ts` and applied it to
  all 95 lazy routes: a chunk-load error triggers one guarded full reload
  (session-storage window prevents a loop); other errors still surface honestly.
- Regression test: `tests/unit/lazy-with-retry.test.ts` (9 cases).

### Re-verified this session (live / local)

- Built server (`node build/server/node-build.mjs`) probed live: `/api/ping`
  200; `/api/admin/users` 401; `PATCH /api/admin/users/:id/role` 401
  (`Administrator sign-in is required.`); `/api/farm-management/overview` 401.
  The production build inlines `NODE_ENV=production`, so the demo fallback in
  `requireAdminAccess`/`requireAdminToken` is dead code and every admin route
  fails closed.
- `GET /api/news` live: `total: 66`, `isRealData: true`, `dataSource:
  "rss-feeds"`, attributed + dated articles (real publisher RSS).
- All 8 Python AI services started locally via `scripts/start-ai-services.sh`;
  `/health` 200 on every port 8001–8008, each reporting honest `model_source`
  (`deterministic-rules` / `synthetic-demo` / `heuristic-demo` /
  `synthetic-demo-disabled`); pest `/analyze-pest-problem` honestly refuses
  synthetic diagnosis (`PEST_MODEL_NOT_VALIDATED`). Services stopped afterwards.
- Python suite as CI runs it: `pytest agrogrowth-ai/tests` → **245 passed**.

Gates after the fixes: `tsc --noEmit` 0 · `eslint` 0 · `npm run build` 0 ·
`npx jest` **789 passed, 2 skipped** (791 total, 87/88 suites).


## Session 9 — Database layer verified against a real Postgres

Previously the database/RLS items were **BLOCKED** ("no live DB here"). That is
no longer true: a real PostgreSQL 17 cluster (with PostGIS) was provisioned
locally and the repository's own CI database procedure was executed end-to-end.

### What was run (exactly the CI sequence)

```
initdb + pg_ctl start (PostgreSQL 17.11, PostGIS 3)
psql -f database/local-rls-shim.sql
psql -f database/cloud-setup.sql
psql -f database/supabase-setup.sql
psql -f database/autonomous-farm-agent.sql
psql -f database/rls-hardening.sql
psql -f database/farm-finance-persistence.sql
psql -f database/migrations/20261110_farm_equipment_tasks.sql
psql -f database/migrations/20261111_auth_user_sync.sql      # new this session
# re-apply (idempotency) then:
psql -f tests/db/rls-verification.sql            -> all checks passed
psql -f database/verify-security-hardening.sql   -> passed
```

Every step exited 0. This converts **B-2 (RLS / ownership)** in
`FINAL_BLOCKERS.md` from BLOCKED to **VERIFIED against Postgres** (still to be
re-run against the real Supabase project, but the policy logic is now proven
executable, not just inspected).

### Two real defects found and fixed in the DB layer

1. **`email_verified` / `last_login` never updated after signup.**
   `handle_new_auth_user` fires only on `auth.users` INSERT, so a user who
   confirmed their email later kept `email_verified = false` forever (admins saw
   them as unverified), and `last_login` was never recorded. Fixed by an
   idempotent `AFTER UPDATE` trigger `sync_auth_user_to_profile`
   (`database/migrations/20261111_auth_user_sync.sql`, mirrored into
   `database/rls-hardening.sql`). It only ever sets `email_verified` **true** and
   only fills `last_login`, so it cannot downgrade trust.
2. **`local-rls-shim.sql` `auth.role()`/`auth.uid()` crashed on an empty
   `request.jwt.claims`.** After a `SET LOCAL` + `ROLLBACK` in the same psql
   session, the GUC is left as an empty string, and `''::json` raised
   `invalid input syntax for type json` — which aborted the signup trigger. This
   made the CI RLS suite order-dependent. Fixed with `NULLIF(..., '')` guards.

### New regression coverage

- `tests/db/rls-verification.sql` **SCENARIO 8**: new signup is provisioned as
  `farmer`; a client-supplied `{"role":"admin"}` in metadata is ignored;
  `email_verified` starts false; confirmation flips it true; sign-in records
  `last_login`; the sync trigger cannot downgrade `email_verified`. All pass.
- `tests/db/rls-verification.sql` **SCENARIO 9**: deleting the `auth.users` row
  removes the `public.users` profile and cascades to that user's farms
  (`database/user-lifecycle.sql`). Passes.
- `.github/workflows/ci.yml` now applies `20261111_auth_user_sync.sql` **and**
  `database/user-lifecycle.sql` in both the initial and idempotency steps.
  `user-lifecycle.sql` was previously **never applied in CI** — the
  account-deletion trigger had no automated coverage at all; it now does.

Gates after Session 9: `tsc --noEmit` 0 · `npm run lint` 0 · `npm run build` 0 ·
`npx jest` **793 passed, 2 skipped** (795 total, 88/89 suites) · RLS (9 scenarios)
+ security SQL verification **passed** against real Postgres.


## Session 10 — Livestock: synthetic demo replaced with real tenant-scoped persistence

The livestock module previously served a **hard-coded synthetic herd** (animals,
weights, vaccinations, breeding history, feed stock, production analytics) and
was then disabled outright (503 `LIVESTOCK_DATA_STORE_NOT_CONNECTED`) to stop
presenting that demo data as real farm intelligence. The frontend pages
(`LivestockDashboard`, `AnimalHealthMonitoring`, `BreedingManagement`,
`FeedManagement`, `AdvancedLivestockDashboard`, `IntelligentBreedingManager`,
`LivestockProductionAnalytics`) already fetched real endpoints — the endpoints
were the problem. This session builds the real data store behind them.

### New persistence layer — **VERIFIED against real Postgres**

`database/livestock-persistence.sql` (idempotent) adds six owner-scoped tables:

| Table | Purpose |
|---|---|
| `livestock_herds` | groups / batches |
| `livestock_animals` | individual animals (ear tag, species, sex, breed, weights, status, dam/sire) |
| `livestock_weight_records` | weight history |
| `livestock_health_events` | veterinary history (checkup/vaccination/treatment/illness/…) |
| `livestock_reproduction_events` | heat/insemination/pregnancy/birth/weaning |
| `livestock_feed_inventory` | feed stock with reorder levels |

Every table has RLS enabled and policies that require `user_id = auth.uid()`
**and** (where a farm/herd/animal is referenced) that the parent row belongs to
the caller — so a user cannot attach an animal to a farm they do not own, read
another user's herd, or write a weight against another user's animal. `anon` is
revoked; `authenticated` gets CRUD; indexes cover the hot paths.

### Real API — **VERIFIED**

`server/routes/livestock.ts` implements caller-scoped CRUD through the
JWT-scoped Supabase client (`scopedClientFromAuthHeader`), so PostgREST enforces
RLS as the signed-in user. `server/routes/livestock-management.ts` and
`server/routes/advanced-livestock-management.ts` now delegate to it (the demo
router is gone). `server/index.ts` mounts the router behind `requireAuth`.

- `GET/POST /api/livestock-management/animals`, `GET/PATCH/DELETE .../animals/:id`
- `GET/POST .../animals/:id/weights`
- `GET/POST .../health-events`, `PATCH .../health-events/:id/resolve`, `GET .../health-alerts`
- `GET/POST .../reproduction-events`
- `GET/POST .../herds`
- `GET/POST .../feed-inventory`

Responses carry `X-Data-Provenance` / `X-Is-Real-Data: true` and a `provenance`
body field. Health alerts, dashboard totals and breeding history are **derived
only from the caller's persisted rows** — nothing is invented. Endpoints that
genuinely cannot be computed yet (feed ration optimization, breeding
recommendations) return an explicit `computed: false` / `isRealData: false`
state with a reason code instead of fabricated numbers.

### Frontend — **IMPLEMENTED (build-verified)**

- All livestock pages now use `apiFetch` (attaches the Supabase JWT); previously
  they used bare `fetch` and would have been rejected as unauthenticated.
- `LivestockDashboard` gained a working **"إضافة حيوان جديد"** dialog that POSTs
  and reloads from the DB, plus honest empty/error states (no demo fallback).

### Verification

- `tests/db/rls-verification.sql` **SCENARIO 10** — 9 livestock isolation checks
  (own-row visibility, cross-tenant read denial, foreign-farm attach denial,
  ownership spoof denial, cross-animal weight denial) all pass against real PG17.
- `tests/integration/livestock-api.test.ts` — 14 tests (anonymous/forged-token
  denial, payload validation, `user_id` can never be client-supplied, honest
  not-computed states).
- `tests/integration/livestock-consistency.test.ts` — rewritten to the new
  contract (verified session required; no fabricated dataset in any response).
- CI (`.github/workflows/ci.yml`) applies `livestock-persistence.sql` in both the
  initial and idempotency steps.

Gates after Session 10: `tsc --noEmit` 0 · `npm run lint` 0 · `npm run build` 0 ·
`npx jest` **809 passed, 2 skipped** (811 total, 89/90 suites) · RLS suite
(10 scenarios) **passed** against real Postgres.


## Session 11 — Sensor registry + budget planning persistence (P1)

Both surfaces returned an unconditional 501/503 even though real tables and a
live UI consumer already existed. They now read/write tenant-scoped persisted
rows, fail closed without a database, and carry explicit provenance.

### Sensors — `GET /api/sensors`, `GET /api/real-time-data`
- `sensor_devices` / `sensor_readings` already exist (cloud-setup) with
  owner-scoped RLS. `getSensors` now lists the caller's own devices paired with
  their latest reading per metric; `getRealTimeData` reads the caller's own
  recent readings. Empty registry is reported honestly (no synthetic back-fill).
- Removed a duplicate `getNotificationRules` stub left mid-refactor.

### Budget planning — `POST/GET/PUT/DELETE /api/budget-plans`
- New table `public.farm_budget_plans` (`database/budget-planning-persistence.sql`):
  owner-scoped RLS, `authenticated` grants, season index, status check.
- `budgetPlanPayload` forces `user_id` from the verified identity (never the
  body), validates crop/area/season/revenue/farm-id, and drops malformed lines.
- `buildBudgetPlanRecord` derives `actualAmount`/variance and any revenue
  projection from the caller's **own** `farm_expenses`/`farm_revenues` history,
  labelling each value `user` / `derived:user-history` / `none`. Recommendation
  strings are deterministic arithmetic notes (provenance `recommendationSource:
  rule-based`, `isRealModel: false`) — never presented as model output.
- `client/pages/BudgetPlanning.tsx` migrated from bare `fetch` to `apiFetch`
  (attaches the Supabase JWT), added a load-error state, honest empty/risk/
  recommendation states, and relabelled the "AI budget" button.

### Verification
- `tests/db/rls-verification.sql` SCENARIO 11 (sensors) + SCENARIO 12 (budget
  plans): own-row visibility, cross-tenant read denial, foreign-farm attach
  denial, ownership-spoof denial. RLS suite now **86 checks, all pass** against
  a real PostgreSQL 17 (up from 79).
- `tests/integration/sensors-api.test.ts`, `tests/integration/budget-planning.test.ts`
  (new); `tests/integration/financial-crud.test.ts` updated to the real contract.
- CI applies `budget-planning-persistence.sql` (initial + idempotency re-run).
- Fresh-DB pipeline (local-rls-shim → cloud-setup → supabase-setup →
  autonomous-farm-agent → rls-hardening → user-lifecycle → farm-finance →
  livestock → budget-planning → migrations) applies clean and is idempotent.

Gates after Session 11: `tsc --noEmit` 0 · `npm run lint` 0 · `npm run build` 0 ·
`npx jest` **824 passed, 2 skipped** (826 total, 91/92 suites) · RLS suite
(12 scenarios) **86 checks pass** · `verify-security-hardening.sql` **passes**.

## Session 12 — P0 crash fix: fail-closed APIs no longer crash the UI

The mission reported "opening the application sometimes returns a generic
unexpected-error page". Root cause found: the fail-closed stub routers answer
`503 { success:false, data:null }`. Several routed pages stored the *whole*
parsed body in state (`setModels(data)`), so state became a truthy object; the
next `.map`/`.filter`/`.property` access threw and the generic `ErrorBoundary`
rendered "حدث خطأ غير متوقع" for a page that had simply received a legitimate
"unavailable" response. It is not an auth or routing bug — it is unsafe response
handling.

### Fix
- New `client/lib/apiPayload.ts`: `payloadList` / `payloadObject` return an
  empty/neutral shape for a failed or unavailable call and never fabricate
  content (a successful `{ success, data }` envelope is unwrapped; a failure is
  not).
- Applied in `PredictiveAnalytics`, `MarketDashboard`, `PriceForecasts`,
  `MarketAlerts`, `WaterAnalytics`, `RiskDetection`.
- `IrrigationScheduler` now only commits `forecast`/`schedule`/`summary` when the
  response is OK and the field is the expected shape.
- Regression test `tests/unit/api-payload.test.ts` (8 cases) pins the envelope
  behaviour.

### Verification
- `tsc --noEmit` 0 · `npm run lint` 0 · `npx jest` **836 passed, 2 skipped**
  (838 total, 92/93 suites).

## Session 13 — P0 crash sweep completed + runtime verification + stale artifact cleanup

### Findings
- The Session 12 crash class was not fully swept. Two more routed loaders
  committed a fail-closed envelope straight into state:
  - `CropPlanner` stored the whole planting-calendar body; the weather-irrigation
    stub answers 503 with no calendar, so the render threw on
    `climateInfo`/`generalAdvice`.
  - `AIServicesTest` stored the monitoring body directly, so a degraded
    `/api/ai/health` made `healthData.services.map` throw.
- A full scan of all 95 routed pages (`AppRouter.tsx` lazy imports) for
  `const data = await response.json()` followed by `set*(data)` found no further
  offenders. Every remaining `set*(data.data)` site is gated by `if (data.success)`
  or `if (!response.ok …)`, so a 503 body can no longer reach a render path.
- Five pages that share the same envelope risk (`DigitalTraining`,
  `DigitalTransformation`, `EmergencyResponse`, `EmergingTechAssessment`,
  `PatentManagement`) plus the retired `SmartAdvisor` are **not routed** — they
  are unreachable from the SPA, so they cannot cause the user-visible crash.

### Fix
- `CropPlanner` and `AIServicesTest` now validate the shape before committing
  state and keep their empty state instead of throwing.

### Runtime verification (built server, `PORT=5099`)
- `GET /api/ping` 200; SPA `/` 200; `/server/index.ts` hard-404.
- Fail-closed endpoints return a clean `{success:false,data:null}` envelope with
  503 and a provenance header — exactly the shape that used to crash the pages:
  `/api/risk-detection/alerts` (`RISK_FEEDS_NOT_VERIFIED`),
  `/api/predictive-analytics/models` (`PREDICTIVE_MODELS_NOT_VALIDATED`),
  `/api/market-analysis/alerts` (`MARKET_SOURCE_NOT_CONNECTED`),
  `/api/weather-irrigation/analytics/water-usage`.
- Admin endpoints fail closed with 401 unauthenticated (`/api/admin/overview`,
  `/api/admin/users`, `/api/admin/news-sources`, `/api/admin/security-events`,
  `/api/admin/system-metrics`, `/api/admin/usage-analytics`,
  `/api/admin/activity-logs`, `/api/admin/subscriptions`).
- `POST /api/farms` unauthenticated → 401 (`Sign in to access this resource`).
- `GET /api/ai/health` reports 8 services, 0 available, 8 not configured —
  honest, no fabricated availability.

### Live feature verification
- **Tunisian agricultural news** (`GET /api/news`): 139 real articles from
  publisher RSS feeds, `X-Data-Provenance: rss-feeds`, `X-Is-Real-Data: true`.
  Per-source status is honest (`la-presse` available; `business-news` reports
  `available:false` with the fetch error). Search (`q=olive` → 1), category
  filter (`élevage` → 2), language filter (`ar` → 73, all `ar`), and pagination
  (`page=2&pageSize=5` → 5 items, `totalPages: 28`) all work.
- **Eight AI microservices**: all eight start locally and answer `GET /health`
  200. Each declares its true `model_source` (`deterministic-rules`,
  `synthetic-demo`, `heuristic-demo`, `rule-based-demo`) — no service claims a
  trained model. Python suite `245 passed`.
- **Soil analysis end-to-end** through the Node gateway (services wired via env):
  returns `dataSource:"rule-based"`, `modelSource:"deterministic-rules"`,
  per-measurement `source:"user_supplied_input"`, `measurement_verified:false`,
  and refuses to classify texture or interpret N/P/K without a unit/lab method —
  no fabricated values.
- **Multi-agent orchestration** via `POST /api/ai/assistant/chat`: the planner
  selects specialists and returns a trace
  `soil:insufficient_input, weather:insufficient_input, crop:ok`, with
  `usedSpecialists:["crop"]` and `dataSource:"rule-based"` — missing inputs are
  reported as `insufficient_input`, not invented.
- **Irrigation / pest gateways**: honestly refuse synthetic microservice output
  (`MODEL_PROVENANCE_UNVERIFIED`, 503) instead of presenting it as real.

### Cleanup
- Removed seven stale, git-tracked `*.backup` / `*.before-*` artifacts of the
  deliberately-retired disease-treatment module (the current route is a 6-line
  fail-closed 503). History still preserves them.

### Verification
- `tsc --noEmit` 0 · `npm run lint` 0 · `npx jest` **836 passed, 2 skipped**
  (838 total, 92/93 suites) · `npm run build` OK · `agrogrowth-ai` pytest
  **245 passed**.

---

## Session 11 — P0 signup requested-role + admin SQL integrity (2026-11-12)

### Defect: admin role-change RPC could never be created — **FIXED (VERIFIED)**

`database/admin-role-management.sql` contained a corrupted dollar-quote
(`AS $` … `$;` instead of `AS $$` … `$$;`) on
`prevent_admin_audit_log_mutation()`. The file therefore failed to parse with
`ERROR: syntax error at or near "$"`, so `admin_change_user_role`,
`admin_set_user_active`, and the append-only `admin_audit_logs` table were
**never created** on any database that tried to apply it. The file was also
absent from the CI apply/idempotency sequence, so nothing caught it.

- Fixed the quote; the file now applies cleanly and idempotently.
- Added `database/admin-role-management.sql` to both the CI apply step and the
  CI idempotency re-apply step (before `20261112_requested_role.sql`, which
  re-creates `admin_change_user_role`).
- New `tests/unit/sql-integrity.test.ts` (5 tests) parses every `database/*.sql`
  and `database/migrations/*.sql` and fails on unbalanced dollar-quotes, a bare
  `AS $`/`$;` line, or a missing admin RPC.

### Defect: signup role choice was silently discarded — **FIXED (VERIFIED)**

The signup form lets a user request farmer/agronomist/trader/veterinarian/
inspector, stored as `requested_role` in auth metadata. The trusted
`handle_new_auth_user()` trigger always provisioned `farmer` and dropped the
request, and the admin panel had no visibility — so a would-be agronomist was
silently downgraded with no approval signal.

- `database/migrations/20261112_requested_role.sql`: adds
  `users.requested_role` (nullable, constrained to the five requestable roles);
  `handle_new_auth_user()` copies it from signup metadata; the
  `prevent_self_role_escalation` trigger now also blocks a user rewriting their
  own `requested_role`; `admin_change_user_role` clears it on approval and
  records it in the audit trail.
- `server/routes/admin-panel.ts`: `getAdminUsers` returns
  `requestedRole` / `requestedRoleArabic`, with a graceful fallback to the
  legacy column set until the migration is applied.
- `server/routes/ensure-profile.ts`: the self-provisioning fallback now records
  the requested role (allow-listed) and degrades safely when the column is
  absent.
- `client/pages/AdminPanel.tsx`: the user table and detail dialog show a
  "pending approval" badge for a requested role that differs from the assigned
  one (ar + en).

**Security invariants re-verified against a real Postgres** (full apply of all
13 migrations in CI order, then a live scenario):
- signup with `requested_role: "agronomist"` → assigned `farmer`,
  `requested_role = agronomist`;
- authenticated self-`UPDATE role='admin'` → rejected `42501`;
- authenticated self-`UPDATE requested_role='admin'` → rejected `42501`;
- `admin_change_user_role(admin, user, 'agronomist')` → role becomes
  `agronomist`, `requested_role` becomes NULL, and an append-only audit row is
  written.

### Verification
- `tsc --noEmit` 0 · `npm run lint` 0 · `npm run build` OK ·
  `npx jest` **858 passed, 2 skipped** (860 total, 94/95 suites) ·
  `tests/db/rls-verification.sql` all checks passed ·
  `database/verify-security-hardening.sql` passed ·
  all 13 migrations apply cleanly and re-apply idempotently.

---

## Session 12 — P0 client auth-fetch (silent 401s) + live news/source verification (2026-11-12)

### Defect: 29 authenticated API calls used a bare fetch() — **FIXED (VERIFIED)**

Per-user endpoints resolve identity from the verified Supabase JWT. Any SPA
call to them with a bare `fetch("/api/...")` carries no `Authorization` header
and is rejected, so the screen silently renders an empty/error state while the
endpoint itself is healthy. This is the class of bug behind "buttons do not
persist" and "wrong/empty dashboard".

Fixed 29 call sites to use the authenticated `apiFetch` helper:

- `client/pages/RevenueAnalysis.tsx` (3): revenues list/save/delete were
  entirely dead.
- `client/components/ComprehensiveOverviewCards.tsx` (4).
- `client/pages/FieldInspectorDashboard.tsx` (6).
- `client/pages/VeterinarianDashboard.tsx` (7).
- `client/pages/BudgetPlanning.tsx` (1), `IntelligentBreedingManager.tsx` (1),
  `ProfitabilityReports.tsx` (1), `AdvancedLivestockDashboard.tsx` (1).

New `tests/unit/client-auth-fetch.test.ts` statically extracts every
`/api/...` path the server mounts behind `requireAuth` (direct handlers and
mounted routers), then fails if any client file calls one with a bare `fetch(`
that does not attach an Authorization header. This prevents the whole class
from regressing.

### Tunisian agricultural news — **VERIFIED (LIVE)**

- Ran an opt-in live probe (`tests/live/news-live-probe.test.ts`,
  `NEWS_LIVE_TESTS=1`) against the real publisher feeds. All **6** sources
  returned real articles (**139** total this run): La Presse de Tunisie,
  Business News, African Manager, Mosaïque FM, and two Google News
  aggregator feeds (fr + ar). Every article carried its publisher name,
  original link and publication date.
- Updated three sources from their 301-redirecting URLs to the canonical
  targets (`www.lapresse.tn/feed/`, `businessnews.com.tn/feed/`,
  `africanmanager.com/feed/`); adjusted the one unit assertion that pinned the
  old homepage.

### AI microservices — **VERIFIED (LOCAL)**

- All eight services start and answer `GET /health` 200 via
  `scripts/start-ai-services.sh --check`.
- Real inference exercised on soil analysis (`POST /analyze-soil` with
  `sensor_data`): returns `source:"user_supplied_input"`,
  `measurement_verified:false`, refuses to classify texture without
  sand/silt/clay, and refuses to interpret N/P/K without a unit/lab method —
  no fabricated values. Invalid input is rejected 422.
- Each service self-reports its true `model_source`
  (`deterministic-rules` / `synthetic-demo` / `heuristic-demo` /
  `rule-based-demo`) and `production_ready:false` for the synthetic ones.

### Verification
- `tsc --noEmit` 0 · `npm run lint` 0 · `npx jest` **860 passed, 3 skipped**
  (863 total, 95/97 suites; the 3 skips are the opt-in live probes) ·
  `npm run build` OK.
- Pushed to `origin/feat/soil-analysis-professional-report` (fast-forward, no
  force, **no PR**).

### Independent DB verification (fresh `agro_verify` database)

Applied the exact CI sequence to a brand-new PostgreSQL 17 database
(`local-rls-shim` → `cloud-setup` → `supabase-setup` → `autonomous-farm-agent`
→ `admin-role-management` → `rls-hardening` → `user-lifecycle` →
`farm-finance-persistence` → `livestock-persistence` →
`budget-planning-persistence` → the three migrations). All 13 applied with
`ON_ERROR_STOP=1`.

Then exercised the real flows:

- **Signup** — inserting an `auth.users` row with
  `raw_user_meta_data.requested_role = 'agronomist'` produced a `public.users`
  profile with `role = 'farmer'` and `requested_role = 'agronomist'` (default
  role granted; the request is stored for admin approval, never auto-granted).
- **Escalation blocked** — as the authenticated user, `UPDATE users SET
  role='admin'` and `UPDATE users SET requested_role='admin'` both raised
  `42501` (privilege). Ordinary users cannot self-assign a role.
- **Admin approval** — `admin_change_user_role(actor, target, 'agronomist')`
  as an admin flipped the role, cleared `requested_role`, and wrote one
  `admin_audit_logs` row.
- **Guard rails** — a non-admin caller was rejected (`42501`); demoting the
  last active admin was refused (`23514`); mutating `admin_audit_logs` was
  blocked (append-only).
- `tests/db/rls-verification.sql` — "all checks passed";
  `database/verify-security-hardening.sql` — "security verification passed".
- Python AI suite: `python -m pytest agrogrowth-ai/tests -q` → **245 passed**
  (run the CI way; a bare `pytest` from the repo root mis-collects because each
  service keeps `soil_analyzer.py` beside its tests).

### Hosted HTTP smoke (built server, no provider configured)
`PORT=5000 node build/server/node-build.mjs` then:
- `GET /api/ping` → 200, `GET /api/ai/capabilities` → 200 (reports the true
  engine per capability: `rule-based` where a deterministic engine exists,
  `unavailable` where a microservice is not configured).
- `GET /api/news/sources` → 200 with the real publisher list.
- Auth fail-closed: `/api/revenues`, `/api/financial-summary`,
  `/api/field-inspector/overview`, `/api/health-alerts`, `/api/budget-plans`
  → 401 without a token; `/api/veterinarian-dashboard/overview` → 503
  (fixture-backed module intentionally disabled — see `server/index.ts`).
- **Unauthenticated sweep** of all 129 `app.get("/api/...")` routes with no
  token: only `200` for `/api/health`, `/api/ping`, `/api/ai/health`. The rest
  split **63×401, 3×403, 54×503 (fail-closed fixtures), 4×400 (validation),
  2×404** — i.e. no data-bearing route is anonymously readable. Intended
  public reads (`/api/news`, `/api/news/sources`, `/api/ai/capabilities`,
  `/api/system/ai`) answer 200 by design.
- **News feature (live)**: `GET /api/news` → 139 articles from 6 real sources;
  `?q=` Arabic search matches (URL-encoded), `?language=ar` → 72 /
  `?language=fr` → 67, `?category=<facet>` filters the derived categories
  (`marché & export`, `maraîchage`, `olive & huile`, `céréales`, `irrigation &
  eau`, `élevage`, `climat`, `agriculture`), pagination capped at 50/page. No
  article lacks a publisher name or original `http(s)` link.

---

## Session 14 — AI topology disclosure fix (security)

**Defect (P0, security):** the public, unauthenticated AI probes leaked the
backend's internal service topology.

- `GET /api/ai/health` echoed each service's configured `url`
  (each lost letter was a byte-level decode failure) and,
  on a transport failure, the raw Node message
  `getaddrinfo ENOTFOUND <private-host>`. Two SPA pages rendered that field.
- `GET /api/ai/capabilities/:id` echoed `microserviceUrl` and embedded the
  address in `requiresConfiguration`.

**Fix** (`server/routes/ai-services-gateway.ts`, `server/routes/ai-capabilities.ts`,
`client/pages/AIServicesTest.tsx`, `client/pages/AIIntelligenceDashboard.tsx`):

- `redactServiceTopology()` strips `url` from every health-snapshot service.
- `safeProbeError()` maps transport failures to address-free categories
  (`dns_resolution_failed`, `connection_refused`, `connection_reset`, `timeout`,
  `probe_failed`).
- `capabilityPayload()` always returns `microserviceUrl: null`; the
  `requiresConfiguration` message no longer contains the address.
- The two SPA pages show the stable `key` instead of the address; the dashboard
  classifier keys off the coarse error codes.

Reachability/configuration signals (`microserviceReachable`,
`microserviceConfigured`, `status`, `modelSource`) are preserved, so monitoring
still works without disclosing where the services live.

**Verified live** (server on :5055 with all eight local microservices up):
`/api/ai/health` and `/api/ai/capabilities/soil-analysis` each contain **0**
occurrences of `127.0.0.1`, while `microserviceReachable=true` /
`microserviceConfigured=true` remain accurate.

**Regression test:** `tests/integration/ai-topology-disclosure.test.ts`
(4 checks) — fails on the pre-fix code, passes now.

**Second leak (same class):** the public AI payloads spread `getLLMInfo()`,
which includes `baseUrl` — the LLM provider endpoint (e.g. a private Ollama
host). Added `getPublicLLMInfo()` (omits `baseUrl`) and switched the three
public response builders (`/api/ai/health`, `/api/ai/capabilities`,
`/api/ai/capabilities/:id`) to it. `/api/system/ai` already omitted `baseUrl`.

**Third leak (same class, wider blast radius):** provider transport failures
built messages like `request failed: getaddrinfo ENOTFOUND <private-host>`,
which every AI route returns to clients via `respondServiceError` /
`handleAIServiceError`. Added `sanitizeNetworkMessage()` in `server/lib/errors.ts`
(coarse categories + URL/IPv4/private-host scrubbing) and applied it in
`providers/http.ts` and `providers/microserviceProxy.ts`, so no AI endpoint can
echo an internal address.

**Gates after fix:** `npx tsc --noEmit` 0 · `npm run lint` 0 · `npm run build`
OK · `npx jest` **867 passed / 3 skipped** (96/98 suites).

---

## Open / blocked

| Item | Status | Blocker |
|---|---|---|
| Tunisian agricultural news | **VERIFIED (live)** | Delivered; see Session 2 above |
| Central multi-agent orchestrator (explicit plan + trace) | **VERIFIED** | `agriculturalOrchestrator.ts`, wired into the chat handler |
| Admin system/analytics/security monitoring | **VERIFIED** | Session 5 (metrics) + live DB counts (analytics) |
| Livestock module (herds/animals/health/breeding/feed) | **VERIFIED (schema+RLS+API)** | Session 10; needs a Supabase `.env` to exercise end-to-end in the hosted app |
| AI service `/health` contracts (all eight) | **VERIFIED (local)** | Session 7; hosted reachability still unverified |
| Live AI microservice inference (hosted) | **BLOCKED** | No credentials/network here; hosts 429/unconfigured |
| Farmer CRUD persistence end-to-end | **BLOCKED** | No Supabase `.env` in this environment; **but** schema + RLS + triggers are now VERIFIED against a real Postgres (Session 9/10) |
| Feed-ration optimization / breeding recommendation engines | **NOT IMPLEMENTED** | Require validated nutritional + genetic reference tables; endpoints report this honestly rather than inventing output |

---

## Session 14 — P1 evidence: eight AI services verified locally

Started all eight FastAPI services from `agrogrowth-ai/.venv` (detached
`uvicorn`, ports 8001–8008) and exercised them directly:

- `/health` on all eight → **200**, each declaring its true provenance:
  `soil_analysis: deterministic-rules` (healthy), `intelligent_agent:
  rule-based-demo` (healthy), and `synthetic-demo*` for the rest.
- Inference round-trips:
  - `POST /analyze-soil` (valid) → real analysis, `health_score 80.0`,
    `data_source: user_supplied_input`; invalid `ph=99` → **422** with a precise
    message. **Real, honest.**
  - `POST /recommend-crops` → **503 `CROP_MODEL_NOT_VALIDATED`** (synthetic
    training data, production disabled). **Fails closed, honest.**
  - `POST /forecast-price` → **503 `LIVE_MARKET_FEED_NOT_CONFIGURED`**.
  - `POST /predict-crop-yield` → **503 `YIELD_MODEL_NOT_VALIDATED`**.
  - `POST /analyze-pest-problem` → **503 `PEST_MODEL_NOT_VALIDATED`**.
  - `POST /optimize-irrigation` → **503 `IRRIGATION_MODEL_NOT_VALIDATED`**.
- Python suites: `tests/` **245 passed**; `soil_analysis/tests` **9 passed**.

Conclusion: the eight service *implementations* are VERIFIED locally and refuse
to emit unvalidated output (no synthetic claims). **Hosted** inference remains
**BLOCKED** (no network/credentials here; hosts 429/unconfigured).

---

## Session 15 — security sweep: transport-error disclosure closed

Found and fixed the last class of raw-error disclosure. Public endpoints
returned `error.message` verbatim from Supabase/Postgres and axios:

- `server/routes/notifications.ts` (10 sites) — raw Postgres errors (table/column
  names) → now `dbErr()` logs server-side and returns a fixed message.
- `server/routes/autonomous-farm-agent.ts` (5 sites) — same treatment; per-user
  scan failures now log server-side and report `code: "SCAN_FAILED"`.
- `server/routes/weather.ts` — `ProviderError.message` (embeds the resolved host)
  → `sanitizeNetworkMessage()`.
- `server/routes/ai-services-gateway.ts` — `handleAIServiceError` now passes
  structured JSON refusals through unchanged but replaces HTML error pages and
  transport strings (no host echo).

Regression suite `tests/integration/error-disclosure.test.ts` (4 tests) drives
the real handlers with address-bearing upstream failures and asserts no internal
host leaks.

**Gates:** `npx tsc --noEmit` 0 · `npm run lint` 0 · `npm run build` OK ·
`npx jest` **871 passed / 3 skipped / 874 total** · Python 245 + 9 passed.

---

## Session 16 — disclosure sweep round 2 (proxy body, two-label hosts, sensors)

Extended the transport-error hardening after re-sweeping `server/services`,
`server/lib` and `server/middleware`:

- `server/services/providers/microserviceProxy.ts` — an upstream non-OK body
  (HTML error page or a proxy message) was embedded into the client-visible
  `ProviderError.message`; it is now sanitized, and HTML bodies are dropped
  entirely (status preserved).
- `server/lib/errors.ts` — `sanitizeNetworkMessage()` now also redacts bare
  two-label service hosts (`svc.internal`, `db.local`) and stray `host:port`
  tokens; previously only fully-qualified `*.internal`/`*.local`/`*.onrender.com`
  names matched.
- `server/routes/notifications.ts` — the sensor registry/readings handlers still
  echoed `deviceError.message` / `readingError.message`; now `dbErr()`.

New/updated tests: `tests/unit/microservice-proxy-disclosure.test.ts` (2),
`tests/unit/errors.test.ts` (+1). LIVE news probe re-run and passing.

**Gates:** `npx tsc --noEmit` 0 · `npm run lint` 0 · `npm run build` OK ·
`npx jest` **874 passed / 3 skipped / 877 total**.

### Verified this session

| Area | Result |
|---|---|
| Multi-agent orchestrator | **VERIFIED** — allow-listed registry, bounded concurrency, per-step timeout+retry, dependency gating, structured trace; 18 tests. Wired into the chat handler (`usedSpecialists` + `orchestrationTrace` in the response). |
| Tunisian news (LIVE) | **VERIFIED** — real articles fetched, publisher attribution + original links present. |
| Role→dashboard routing | **VERIFIED** — `dashboardRouteForRole` drives the post-login redirect from the persisted profile role. |
| Admin auth | **VERIFIED** — admin-bootstrap routes gate on `verifyAdminToken` (constant-time, fail-closed); role changes only via a verified JWT + allow-listed `admin_change_user_role` RPC. |

---

## Session 16b — admin dashboard role-alias fix (P0)

**Defect (root cause of "admin does not see the admin dashboard").** The
database and the server middleware treat `administrator` as a synonym of
`admin` (`ADMIN_ROLES = {admin, administrator}` in `server/middleware/auth.ts`),
but the client compared raw strings:

- `client/lib/routeAccess.ts` — `/admin-panel` lists only `admin`, so a profile
  whose stored role is `administrator` was denied and bounced to `/`.
- `client/lib/roleDashboard.ts` — already mapped the alias (unchanged).
- `Layout.tsx` filtered nav items by `allowedRoles.includes(user.role)`, so an
  `administrator` also lost the Admin nav entry.

**Fix.** Added `normalizeRole()` (single canonicalisation point) and applied it:

- `resolveRouteAccess()` normalises both the caller role and the allow-list
  before comparing (never invents a role; unknown roles still fail closed).
- `AuthContext.loadUserData()` stores the normalised role, so the nav, RBAC and
  guards all agree.

**Tests.** `tests/unit/route-access.test.ts` +4 (administrator → allow;
case/whitespace; alias does not widen a farmer-only allow-list; unknown role
still denied). Suite: **878 passed / 3 skipped / 881 total**; `tsc` 0; lint 0.

---

## Session 16c — generic unexpected-error page root cause (P0)

**Defect.** `Login.tsx` and `Signup.tsx` did `catch (error: any)` then
`error.message.includes(...)`. When the rejection is not an `Error` with a
string `message` (a bare string, a PostgrestError-shaped object, `undefined`),
the `.includes` call throws a `TypeError` *inside the catch block*; that
secondary throw is unhandled, unmounts the page, and the ErrorBoundary renders
the generic "حدث خطأ غير متوقع" page. The same unguarded pattern existed in
`client/lib/supabaseHelpers.ts` (schema-cache retry) and `client/lib/supabase.ts`
(API-key probe).

**Fix.** Added `client/lib/errorMessage.ts` (`errorMessageText` /
`errorMessageIncludes`, both throw-proof), used in `Login.tsx` and `Signup.tsx`;
guarded the two library sites with `typeof message === "string"`.

**Tests.** `tests/unit/error-message.test.ts` (12 cases incl. `undefined`, `{}`,
`{message:42}`, bare string). Suite: **890 passed / 3 skipped / 893 total**;
`tsc` 0; lint 0; `npm run build` OK.

---

## Session 16d — farmer lands on the farmer dashboard after sign-in (P0)

**Defect.** `AuthContext.signIn()` chose the post-login destination from a
single `users.role` read. If the signup trigger had not provisioned the profile
row (the documented failure mode on databases missing the trigger), the read
returned nothing, the destination fell back to `/`, and the new farmer never
reached `/farmer-dashboard` — the reported "registration succeeds but the farmer
cannot enter the dashboard".

**Fix.** `signIn()` now reads the role, and on a missing row calls the existing
JWT-scoped `POST /api/auth/ensure-profile` (idempotent, always creates `farmer`,
never elevates) then re-reads before choosing the destination. Navigation only;
`ProtectedRoute` and server middleware remain the authorization boundary.

`tsc` 0; lint 0; targeted suites green. Full gate re-run before push.

---

## Session 17 — AI service deployment correctness (P1)

**Defect.** Four service Dockerfiles hardcoded `--port` in `CMD`, which overrides
Render's injected `$PORT`, and declared the wrong/colliding ports:

| service | Dockerfile EXPOSE was | canonical |
|---|---|---|
| market_prediction | 8003 | 8004 |
| intelligent_agent | 8005 | 8005 |
| weather_yield_intelligence | 8006 | 8006 |
| pest_control | 8005 | 8007 |
| irrigation_optimization | 8004 | 8008 |

`docker-compose.yml` mapped container ports 8004/8006/8007/8008 while these
images listened on 8003/8005/8006/8004, so those four services could never be
reached through the compose network. The other four Dockerfiles ignored
Render's `$PORT` entirely (they only worked because `render.yaml` overrides
`startCommand`).

**Fix.** All eight `Dockerfile`s now `EXPOSE` the canonical port, probe the same
port in `HEALTHCHECK`, and start with
`--port ${PORT:-${SERVICE_PORT:-<default>}}` so Render's `PORT` and compose's
`SERVICE_PORT` both win over the default. `AI_SERVICES_DEPLOYMENT_GUIDE.md`
tables, port list and env blocks were corrected to the canonical names the
gateway actually reads (`MARKET_FORECAST_URL`, `SMART_ASSISTANT_URL`,
`SMART_MARKETPLACE_URL`, `IRRIGATION_OPTIMIZATION_URL`) and ports.

**Verification.**
- Booted all four previously-broken services locally from `agrogrowth-ai` with
  `python -m <service>.main`; each answered `GET /health` 200 and reported an
  honest `status: "degraded"` / `production_ready: false` with its
  `model_source`.
- New regression test in `tests/integration/deployment-manifests.test.ts`
  (8 cases) asserts every Dockerfile's `EXPOSE`, health port and env-var-honouring
  `CMD`.
- `tsc` 0, `eslint` 0, full suite 898 passed / 901 (3 skipped, 2 suites skipped).

---

## Session 18 — residual admin role-alias inconsistencies (P0 follow-up)

**Defect.** Session 16b normalised the `administrator` → `admin` alias in
`AuthContext` and `routeAccess`, but three client call sites still compared the
raw role string, so a profile stored as `administrator` (accepted by the server,
`ADMIN_ROLES = {admin, administrator}`) was treated as a non-admin:

- `client/contexts/RBACContext.tsx` `checkPermission` (`user.role === "admin"`).
- `client/components/NavigationTester.tsx` (`userRole !== 'admin'`).

**Fix.** Both now use the shared `normalizeRole` helper. Reads of `user.role`
elsewhere (`NotFound.tsx`) are already normalised at the source in
`AuthContext`, so no further change was needed.

`tsc` 0, `eslint` 0, full suite 898 passed / 901 (3 skipped, 2 suites skipped).

---

## Session 19 — fixture-backed module disclosure sweep (P2, honesty)

**Audit.** Enumerated every server route that builds records from in-memory
fixtures or `Math.random()` and checked whether it carries a provenance marker.
Every such module is either (a) already fail-closed with a `router.use`
handler, or (b) mounted behind the shared `blockSimulatedData()` guard in
`server/index.ts`. Confirmed by probing each prefix at runtime:

| prefix | status | code |
|---|---|---|
| `/api/collaboration/*` | 503 | `SIMULATED_DATA_DISABLED` |
| `/api/digital-transformation/*` | 503 | `SIMULATED_DATA_DISABLED` |
| `/api/disease-treatment/*` | 503 | `SIMULATED_DATA_DISABLED` |
| `/api/subscription/*` | 503 | `SIMULATED_DATA_DISABLED` |
| `/api/emergency-response/*` | 503 | `SIMULATED_DATA_DISABLED` |
| `/api/ip-management/*` | 503 | `SIMULATED_DATA_DISABLED` |
| `/api/emerging-tech/*` | 503 | `SIMULATED_DATA_DISABLED` |
| `/api/government-dashboard/*` | 503 | `SIMULATED_DATA_DISABLED` |
| `/api/segmentation/*` | 503 | `SIMULATED_DATA_DISABLED` |
| `/api/alerts`, `/api/tasks` | 503 | `SIMULATED_DATA_DISABLED` |

All answer with `X-Is-Real-Data: false`. No synthetic record can be presented
to a user as a live platform record.

**Gap.** Only `/api/saas` and `/api/logistics` had a runtime assertion pinning
this behaviour; the remaining prefixes were covered only by the static
client/server route contract.

**Fix.** Added an 11-case `test.each` table to
`tests/integration/provenance-headers.test.ts` asserting status 503, code
`SIMULATED_DATA_DISABLED`, body `isRealData: false` and header
`X-Is-Real-Data: false` for every blocked prefix.

**Verification.** `tsc` 0, `eslint` 0, full suite **909 passed / 912 (3 skipped,
2 suites skipped)**. Live news probe (`NEWS_LIVE_TESTS=1`) fetched real
attributed articles from publisher RSS feeds.

## Session 20 — P0 persistence proven against a real Postgres + PostgREST stack

The last remaining P0 item (farmer CRUD persistence end-to-end) was recorded as
**BLOCKED — needs live Supabase**. That blocker is now closed without touching
production: a **PostgreSQL 17.11 + PostGIS 3** cluster and **PostgREST 12.2.3**
were stood up locally, the repository's own CI schema sequence was applied, and
the SPA's real REST path was exercised with real HS256 JWTs.

### What was run

```
initdb + pg_ctl start                       # PostgreSQL 17.11 + PostGIS 3
psql -f database/local-rls-shim.sql
psql -f database/cloud-setup.sql
psql -f database/supabase-setup.sql
psql -f database/autonomous-farm-agent.sql
psql -f database/admin-role-management.sql
psql -f database/rls-hardening.sql
psql -f database/user-lifecycle.sql
psql -f database/farm-finance-persistence.sql
psql -f database/livestock-persistence.sql
psql -f database/budget-planning-persistence.sql
psql -f database/migrations/20261110_farm_equipment_tasks.sql
psql -f database/migrations/20261111_auth_user_sync.sql
psql -f database/migrations/20261112_requested_role.sql
# re-applied the hardening set (idempotency) -> all exit 0
psql -f tests/db/rls-verification.sql              # 86 checks pass
psql -f database/verify-security-hardening.sql     # passes
# then PostgREST + scripts/verify-local-persistence.sh -> 13/13 pass
```

All 13 schema files apply cleanly **and are idempotent** on a second run.

### Real end-to-end results (VERIFIED)

| Assertion | Result |
|---|---|
| Farmer A creates a farm over REST (JWT A) | row persisted, returned |
| Farmer A reads own farm | 1 row |
| Farmer B reads farms | 0 rows (RLS denies) |
| Anonymous reads farms | 0 rows |
| Farmer B PATCH/DELETE A's farm | 0 rows affected; name unchanged |
| Farmer B INSERTs a farm owned by A (spoof) | denied `42501` |
| Farmer self-escalates `role` to `admin` | denied; role stays `farmer` |
| Signup trigger on a new `auth.users` row | profile created as `farmer`; `requested_role=admin` ignored |
| Client calls `admin_change_user_role` | refused (not granted to `anon`/`authenticated`) |
| `service_role` RPC with a **non-admin actor** | rejected `42501 Administrator privileges required` |
| `service_role` RPC with an **admin actor** | succeeds; exactly 1 `admin_audit_logs` row written |
| Client reads/updates/deletes `admin_audit_logs` | `42501 permission denied` for both `authenticated` and `anon` |
| Child table (`farm_sections`) isolation | A sees own; B and anon see 0 |

### Artefacts

- `scripts/verify-local-persistence.sh` — reproducible 13-check suite (seeds via
  a privileged connection, drives traffic through PostgREST as `authenticator`).
- `.github/workflows/ci.yml` — new `🌐 End-to-end persistence through PostgREST`
  step in the `database-rls` job, so this stays proven on every push.
- `tests/unit/agricultural-orchestrator.test.ts` — new regression test that runs
  the full soil→weather→crop→irrigation workflow from real-shaped persisted
  records, closing the orchestrator context-shape investigation.

**Gates after Session 20:** `tsc --noEmit` 0 · `npm run lint` 0 · `npm run build`
0 · `npx jest` **910 passed / 913 (3 skipped, 2 suites skipped)** · RLS 86 checks ·
security SQL verification · PostgREST persistence 13/13 — all against real PG17.

## Session 21 — P3: repo-wide Arabic (U+FFFD) encoding repair

The Arabic UI — the platform's primary language — carried **555 corrupted
characters (U+FFFD) across ~97 files**. Each was a byte of an Arabic letter lost
to a bad decode, so real labels rendered as mojibake, e.g. the animal page title
`ح??وانات` for `حيوانات` and `توصيا??` for `توصيات`. The earlier "partial"
encoding cleanup had only covered a handful of pages.

### Fix

A scripted, exact-fragment repair (source trees only; generated `dist/` and
`coverage/` are rebuilt, never hand-edited) restored every fragment from its
surrounding sentence, longest-match first. Two side effects the corruption had
also eaten were repaired: a `>` before Arabic JSX text in
`DiseaseDiagnosis.tsx` and `TreatmentSchedule.tsx`, and a doubled `{{` in
`CropHistory.tsx`.

### Guard

New `tests/unit/no-encoding-corruption.test.ts` fails the build if any tracked
source file contains U+FFFD, and asserts Arabic codepoints are still present as
real UTF-8 in the i18n table — so this cannot silently regress.

### Verification

`npx tsc --noEmit` 0 · `npm run lint` 0 · `npm run build` 0 (rebuilt `dist/`
assets contain **0** U+FFFD) · `npx jest` **912 passed / 915 (3 skipped)** ·
`python -m compileall agrogrowth-ai` 0 · `pytest agrogrowth-ai/tests` **245
passed** · all eight AI services still report `OK` on `--check`. Spot checks
confirm `الإدارة المالية`, `صحة الحيوانات`, `الإنذار المبكر`, `كلوريد بوتاسيوم`
and `مكافحة الآفات` now render correctly, including in the served bundle.

---

## Session — production-grade AI transformation (provenance + lab soil)

### Unified model-provenance classification — **VERIFIED**

A defect was found while auditing: `serviceProbe.HEURISTIC_MARKERS` did **not**
match `deterministic-rules` (the source the soil microservice declares for its
rule analyzer), so `probeService().heuristic` was `false` for a rule engine.
The gateway compensated with a *second* regex (`RULE_BASED_MODEL_SOURCE_RE`),
but `microserviceProxy` did not — so a deterministic-rule service could be
labelled `isRealData: true` on the legacy proxy routes.

- New `server/services/providers/modelProvenance.ts` — single classifier
  (`classifyModelSource`, `isSyntheticModelSource`, `isNonModelSource`,
  `isTrainedModelSource`, `provenanceDataSource`, `ProvenanceKind`).
- `serviceProbe.ts` now exposes the full `kind`/`ruleBased`; the proxy refuses
  synthetic **and** rule-based services before sending user data.
- `ai-services-gateway.ts`, `ai-capabilities.ts` and the three legacy routers
  (pest / irrigation / weather-yield) all use the shared classifier — the
  duplicate regexes are gone.
- `ai-capabilities` now downgrades a microservice that self-reports a rule
  engine to `engine: "rule-based"` instead of advertising it as a model.
- Tests: `tests/unit/model-provenance.test.ts` (9) + existing provenance suites
  (`microservice-proxy`, `ai-health-model-provenance`, `capability-reachability`,
  `vision-gateway`) all pass.

### Laboratory-assisted soil prediction surfaced through the gateway — **VERIFIED**

The soil microservice ships **seven genuinely trained models** (random-forest /
extra-trees / gradient-boosting) fitted on the iSDA wet-chemistry reference
dataset (`synthetic_data_used: false`, 2 134 samples, spatial GroupKFold). They
were never reachable from the Node API.

- `POST /api/ai/soil/predict-lab` (authenticated) validates the 16 known
  analytes (finite numbers only), forwards to `/predict-lab-soil`, tags the
  result `dataSource: "trained-model-inference"` / `isRealData: false` (model
  inference, not a measured result) and optionally persists to `soil_analyses`
  through the caller-scoped RLS client (never a browser-supplied farmId).
- `GET /api/ai/soil/lab-models` returns model metadata without loading artifacts.
- `main.py` `/health` now reports `lab_assisted.metadata_ready` (manifest only,
  no artifact load).
- Tests: `tests/integration/lab-soil-gateway.test.ts` (5) pass. Live-verified:
  the service boots under the venv, `/lab-models/status` → `ready 7/7`, and
  `/predict-lab-soil` returns real predictions (ph 6.68, R² 0.53).

### Verification this session

`npx tsc --noEmit` exit 0 · `npx jest` provenance + lab + related suites pass ·
`pytest agrogrowth-ai/tests` 245 passed · `pytest soil_analysis/tests` 9 passed.

### Image diagnosis: trained ONNX classifier made runnable — **VERIFIED**

`image_diagnosis` ships a **real** MobileNetV3-Large PlantVillage classifier
(38 classes, test accuracy 0.9968, ONNX parity PASS) but `onnxruntime` was
absent from `requirements-test.txt`, so every local run silently fell back to
the heuristic the service explicitly refuses to return as a diagnosis.

- Added `onnxruntime>=1.20,<2` to `agrogrowth-ai/requirements-test.txt`.
- New `agrogrowth-ai/tests/test_onnx_classifier_inference.py` (3 tests) loads
  the *real* artifact, asserts 38 classes and a normalised top-5 distribution.
- Live-verified: the service boots, `/health` reports
  `production_ready: true`, `model_source: "mobilenetv3-plantvillage-v1"`, and
  the detector runs in `onnx` inference mode.

## Session 3 — trained lab soil models inside the orchestrator + ONNX runtime

### Multi-agent orchestrator: trained lab models as a first-class specialist — VERIFIED

The orchestrator was network-free by design. Its specialists only consumed
context already assembled by the gateway, so the seven *genuinely trained* lab
soil models (real iSDA wet-chemistry data) were reachable via
`POST /api/ai/soil/predict-lab` but **never** used inside a multi-agent plan.

- New `server/services/ai/labSoilClient.ts`: the single analyte allow-list (16
  keys), a strict `sanitiseLabAnalytes` guard (finite numbers only), and a
  bounded `predictLabSoil()` that returns a discriminated result rather than
  throwing.
- New allow-listed `lab_soil` specialist (`agriculturalOrchestrator.ts`):
  - `insufficient_input` (no network call) when no analytes are supplied;
  - calls the trained models only when real measurements are present;
  - `trained-model-inference` provenance and per-target out-of-fold R2 in each
    finding, so a caller can see the models are only lightly trained for some
    targets (e.g. extractable P R2 ~0.34);
  - `failed`/`unavailable` — never fabricated — when the service is down;
  - claims `trained-model-inference` only when at least one target was actually
    predicted (a coverage-only response is `insufficient_input`).
- `planSpecialists` selects `lab_soil` whenever analytes are present, even if
  the wording does not mention a lab.
- The chat handler (`chatWithAIAssistant`) accepts `lab_values`, sanitises them,
  and passes them into the orchestrator; the composed answer labels the step as
  a trained model.
- The gateway now reuses the shared sanitiser (no duplicated analyte list).
- Live-verified against the real FastAPI service on 127.0.0.1:8001: 16/16
  analytes -> 7 targets predicted with R2 (ph 0.53, carbon_organic 0.86,
  nitrogen_total 0.83, EC 0.47, P 0.34, K 0.63, Zn 0.45); a sparse 6-analyte
  payload correctly returns `insufficient_input` at the 80% coverage gate.
- Tests: `tests/unit/agricultural-orchestrator.test.ts` 21 pass (4 new),
  `tests/integration/assistant-orchestration.test.ts` 3 pass (1 new),
  `tests/integration/lab-soil-gateway.test.ts` 5 pass.

### Image diagnosis ONNX runtime — VERIFIED

See the dedicated section above (onnxruntime added, real artifact test, health
reports `production_ready: true`).

### Chatbot surfaces the multi-agent trace — VERIFIED

The chat API already returned `usedSpecialists` and `orchestrationTrace`, but
the chatbot UI discarded them, so a user could not see which specialists ran or
that a trained model produced part of the answer.

- `chatWithAIAssistant` now also returns `trainedModelSpecialists`.
- `AIAssistantChatbot.tsx` stores `usedSpecialists` / `trainedModelSpecialists`
  on the message metadata and renders them (localised ar/fr/en) alongside the
  existing provenance line, with trained-model results highlighted.
- Tests: `tests/integration/assistant-orchestration.test.ts` now asserts
  `trainedModelSpecialists` contains `lab_soil`.

### Trained lab soil models are discoverable — VERIFIED

`GET /api/ai/capabilities/lab-soil-models` now reports the seven trained iSDA
regression models honestly:

- `serviceProbe` reads the soil service's `/health` `lab_assisted` block
  (`metadata_ready` / `models_available`) and exposes `labModelsAvailable`.
- `resolveEngine` returns `microservice` + `modelSource: lab-assisted-soil-models`
  only when the service is reachable **and** declares loadable lab models;
  otherwise the capability is `unavailable`. A reachable host alone is never
  enough (mirrors the existing 429/heuristic handling).
- Live-verified against the real `soil_analysis` service on `127.0.0.1:8001`:
  `available: true`, `engine: microservice`, `isRealData: false` (model
  inference is not presented as measured data).
- Tests: `tests/integration/capability-reachability.test.ts` covers both the
  available and not-loaded cases (5 tests).

## Session 22 — Pest-control specialist wired to the real service + operational probes

### Pest-control specialist now consumes the real microservice — VERIFIED

The `pest_control` specialist in `agriculturalOrchestrator.ts` previously
returned an unconditional `insufficient_input` even when the user described
symptoms. It now calls the real `pest_control` service's keyword matcher
(`POST /identify-pest`) through a dedicated, honesty-preserving client.

- New `server/services/ai/pestControlClient.ts`:
  - `sanitiseSymptoms()` keeps only non-empty, trimmed, length-bounded strings
    (max 20 symptoms, 200 chars each) — a caller cannot inject a huge payload
    or non-string values.
  - `deriveSymptomsFromQuestion()` selects the user's own symptom-like clauses
    from free text (leaf/root/fruit/stem or a visible sign: yellowing, wilting,
    spots, holes, rot, honeydew, insects...). It never adds a symptom the user
    did not write, and a unit test asserts every derived clause is a substring
    of the question.
  - `identifyPestFromSymptoms()` returns a discriminated result rather than
    throwing, so an unavailable service is reported honestly, never guessed.
- The specialist is always labelled `dataSource: "rule-based"` /
  `isRealData: false` with `confidence: "low"`, because the service is an
  explicit keyword matcher (`model_source: "symptom-keyword-rules"`,
  `field_validated: false`) — never a trained classifier, and its confidence is
  never presented as calibrated. No product, active ingredient, dose or
  pre-harvest interval is ever produced; that path stays fail-closed until a
  verified Tunisian product registry is connected.
- `OrchestratorContext.symptoms` was added; the chat handler sanitises an
  explicit `symptoms` array and otherwise derives clauses from the question.
- Live-verified against the real `pest_control` service on `127.0.0.1:8007`:
  an Arabic symptom sentence ("أوراق الطماطم صفراء ولزجة وفيها حشرات صغيرة")
  identifies `aphids (المن)` with the service's own honesty note.
- Tests: `tests/unit/agricultural-orchestrator.test.ts` (+3),
  `tests/unit/pest-control-client.test.ts` (new, 6),
  `tests/integration/assistant-orchestration.test.ts` updated to pin the real
  invariant (rule-based provenance, never a product/dose).

### Lightweight operational probes on all eight services — VERIFIED

`ai_common/base_service.py` now exposes `register_service_probes(app, name)`
(`/ready` and `/metrics`), registered in all eight `main.py` files.

- `GET /ready` is a cheap liveness/readiness signal that never loads a model
  artifact (it must not report `model_source`; `/health` keeps the deep check).
- `GET /metrics` reports real process counters: `pid`, `uptime_seconds`,
  `requests_total`, `resident_memory_bytes`, `timestamp` — measured, not
  synthesised.
- `GET /api/ai/health` now probes `/ready` (2s) before the deep `/health` (3s)
  and surfaces a `ready` boolean per service, so a repeated monitoring poll can
  never force model loading.
- `docker-compose.yml` gained a `/ready` healthcheck for each of the eight AI
  services.
- Live-verified: all eight services on ports 8001–8008 answer `/ready` 200.
- Tests: `tests/test_readiness_endpoints.py` (16 checks, 8 services × 2 probes).

**Gates:** `npx tsc --noEmit` 0 · `npx jest` 951 passed / 3 skipped ·
Python `agrogrowth-ai` 266 passed / 1 warning.

### Pest Control screen: honest rule-based path — VERIFIED

The Pest Control screen called `POST /api/pest-control/analyze-problem`, which
the provenance-guarded proxy **correctly refuses** (503): the pest service's
`/health` declares `synthetic-demo` and disables its analysis/treatment models.
So the screen was permanently broken — an honest refusal shown as a dead button.

The service's `POST /identify-pest`, however, is a genuine deterministic keyword
matcher (`model_source: "symptom-keyword-rules"`, `confidence_score: 0`,
`field_validated: false`) — the same endpoint the orchestrator's `pest_control`
specialist already uses. It is honest to call directly.

- Added `POST /api/pest-control/identify-from-symptoms`, which reuses the tested
  `pestControlClient` (no duplicated HTTP logic). It labels the result
  `dataSource: "rule-based"` / `isRealData: false` /
  `modelSource: "symptom-keyword-rules"`, reports `confidence_score: 0` (never a
  fabricated probability), and returns `400 SYMPTOMS_REQUIRED` without symptoms,
  `503` when no service is configured, `502` when it is unreachable — never a
  guessed pest.
- Rewired `client/pages/PestControl.tsx` to that endpoint. Removed the dead
  "affected area" / "plant health" sliders (they were only consumed by the
  disabled endpoint) and the severity/treatment cards, which could only ever be
  empty. The screen now shows the pest candidate, the identification method, and
  an explicit note that this is keyword matching, not a trained model or a
  confirmed field diagnosis. Treatment stays fail-closed with an honest
  "unavailable" message — no product, dose or pre-harvest interval is invented.
- Live-verified against the real service on `127.0.0.1:8007`: explicit Arabic
  symptoms and free-text clauses both resolve to `aphids (المن)` with the
  service's own honesty note; a down service returns `ok:false`.
- Tests: `tests/integration/microservice-proxy.test.ts` (+3).

**Gates:** `npx tsc --noEmit` 0 · `npm run lint` 0 · `npx jest` 954 passed / 3 skipped.

### Orchestrator: `agri_news` specialist wired to the real news service — VERIFIED

The mission brief asks the chatbot to answer questions about Tunisian
agricultural news by *coordinating* real sources rather than only listing them
on a separate page. The orchestrator was deliberately network-free (it composes
only verified context), and the gateway does the network I/O — so the news
fetch belongs in the gateway, exactly like the Open-Meteo weather pull.

- New allow-listed specialist `agri_news` (keywords: أخبار/خبر/جديد/مستجدات/
  news/actualité/presse/jdid/akhbar/…). It reads `AGRI NEWS` records the gateway
  injected and returns `dataSource: "rss-feeds"` / `isRealData: true` /
  `confidence: "high"` — the only specialist besides `weather` that reports real
  provider data. With no record it is `unavailable` with **no findings** (a
  headline is never invented).
- The gateway now fetches `getTunisianAgriNews()` only when the question asks
  for news, bounded by a hard 4.5s `Promise.race` so a slow feed can never stall
  a chat. Each injected record carries publisher, date, a length-capped title and
  the **original link**, and is labelled "published reporting, not AgroGrowth's
  own advice". A failed/timed-out fetch injects nothing.
- Live-verified: the real news service returned 4 articles from the publisher
  feeds (`isRealData: true`, `dataSource: "rss-feeds"`), and the orchestrator's
  `agri_news` step reported `ok` / `isRealData: true` with those headlines.
- Tests: `tests/unit/agricultural-orchestrator.test.ts` (+3) and
  `tests/integration/assistant-orchestration.test.ts` (+1, pins the
  no-invented-headline invariant through the real chat endpoint).

---

## Session 4 — AI microservice integration verification + dashboard honesty fix

### All 8 deployed AI services re-verified — VERIFIED

The mission brief's snapshot (2026-11-11 20:51) reported 0/8 available, 4
reachable-but-rate-limited (HTTP 429), 4 not-configured. Re-probed this session:

| Service | Deployed host | `/health` | declared `model_source` | classification |
|---|---|---|---|---|
| soil_analysis | `ai-soil-analysis.onrender.com` | 200 | `deterministic-rules` | rule-based |
| crop_recommendation | `ai-crop-recommendation-exsj.onrender.com` | 200 | `synthetic-demo-disabled` | synthetic (fails closed) |
| image_diagnosis | `agrogrowth-image-diagnosis.onrender.com` | 200 | `mobilenetv3-plantvillage-v1` | **trained** |
| market_prediction | `ai-market-intelligence-r49d.onrender.com` | 200 | `synthetic-demo` | synthetic (fails closed) |
| intelligent_agent | `agrodev-4.onrender.com` | 200 | `openrouter:…nemotron…:free` | LLM |
| weather_yield | `ai-market-intelligence-8yyo.onrender.com` | 200 | `synthetic-demo` | synthetic (fails closed) |
| pest_control | `ai-pest-control.onrender.com` | 200 | `synthetic-demo` | synthetic (fails closed) |
| irrigation_optimization | `ai-irrigation-optimization.onrender.com` | 200 | `synthetic-demo` | synthetic (fails closed) |

- The prior 429s were Render-side rate limiting of rapid health polling, **not**
  service failures: the same hosts now answer 200 in <0.3 s. The gateway already
  reports `rate_limited` distinctly and never counts a 429 as available.
- `/ready` and `/metrics` return 200 for all 8 **locally** (ports 8001–8008);
  the deployed 404 on `/ready` is deployment lag (the built images predate the
  probe), not a code defect. `register_service_probes` is auto-invoked by
  `BaseAIService.__init__`, so services without an explicit call still expose it.
- Real inference verified locally: image `/detect-disease` → 200 (ONNX
  MobileNetV3); intelligent_agent `/chat` → 200; soil `/analyze-soil` → 200
  (23 s cold-start model load) with honest `insufficient_texture_data`;
  pest `/identify-pest` → 200 rule-based; crop `/recommend-crops` → 503
  `CROP_MODEL_NOT_VALIDATED`; market `/forecast-price` → 503
  `LIVE_MARKET_FEED_NOT_CONFIGURED` (honesty gates hold).
- Gateway end-to-end (local, all 8 routes): synthetic services fail closed with
  503 `MODEL_PROVENANCE_UNVERIFIED`; pest `/identify-from-symptoms` → 200
  `rule-based` / `isRealData:false` / `modelSource: symptom-keyword-rules`;
  market forecast → 503 `MARKET_MODEL_NOT_VALIDATED`. No production `localhost`
  URL is reachable from the gateway (`localServiceFallback` returns `""` when
  `NODE_ENV=production` / `RENDER=true`).

### Cloud Services Status dashboard showed "0 available" — FIXED

Root cause (a genuine client defect, not an ops issue): `CloudServicesStatus.tsx`
probed the microservice hosts **directly from the browser** via `VITE_*` URLs
(`checkAllServicesHealth` → `checkServiceHealth`). Those variables are unset in
production, so every probe failed and the page reported 0/N regardless of real
availability. A second defect: the "Main API Health" card iterated
`Object.entries(aiHealthStatus)` and rendered the rich snapshot's top-level keys
(`overview`, `services`, `llm`, …) as if each were a service.

- `client/pages/CloudServicesStatus.tsx` now consumes the backend's
  provenance-aware `/api/ai/health` snapshot only; the browser never contacts a
  microservice host. Per-service rows show real `status`, `modelSource` and
  `modelKind`; `rate_limited` / `not_configured` are distinct badges and are
  never shown as available. The overview card renders real counts + LLM provider.
- `client/hooks/useAIServices.ts` `checkAIServicesHealth` always reads the
  backend snapshot (the `useCloudServices` direct-probe branch was removed).
- Regression test `tests/unit/cloud-services-status-health.test.ts` (4 tests)
  pins both invariants.

**Gates:** `npx tsc --noEmit` 0 · `npx eslint` (edited files) 0 ·
`npx jest` 963 passed / 3 skipped (106 suites).

### Session 5 — hosted inference verification for all eight services — VERIFIED

Every deployed Render host was probed for **real inference** (not just `/health`):

| Service (deployed) | Endpoint probed | Result |
|---|---|---|
| `ai-soil-analysis` | `POST /predict-lab-soil` (full 15-feature input) | 200 — **7/7 trained targets** with per-target R²/MAE/RMSE (carbon_organic R²=0.86, nitrogen_total R²=0.83); sparse input → honest `insufficient_input` + coverage |
| `agrogrowth-image-diagnosis` | `POST /detect-disease` (224×224 JPEG) | 200 — MobileNetV3 PlantVillage ONNX classifier, top class `Corn_(maize)___healthy` p=0.49 |
| `agrodev-4` | `POST /chat` (Arabic) | 200 — real Arabic LLM answer (not a canned string) |
| `ai-pest-control` | `POST /identify-pest` | 200 — `identification_method: symptom_based`, `aphids`, **`confidence_score: 0.0`** (keyword matcher, never a trained classifier) |
| `ai-crop-recommendation-exsj` | `POST /recommend-crops` | 503 `CROP_MODEL_NOT_VALIDATED` (fails closed) |
| `ai-market-intelligence-r49d` | `POST /forecast-price` | 503 `LIVE_MARKET_FEED_NOT_CONFIGURED` (fails closed) |
| `ai-market-intelligence-8yyo` | `POST /predict-crop-yield` | 503 `YIELD_MODEL_NOT_VALIDATED` (fails closed) |
| `ai-irrigation-optimization` | `POST /optimize-irrigation` | 503 `IRRIGATION_MODEL_NOT_VALIDATED` (fails closed) |

- The five synthetic/rule-based services **honestly refuse on the deployed host**
  — no synthetic output is ever returned as a production prediction.
- Cold-start note: the first request to an idle Render container can take
  20–60 s (a `/health` probe timed out at 60 s before warming). This is Render
  free-tier spin-up, **not** a service defect; the gateway's 30 s per-call
  timeout plus its health cache and `rate_limited` reporting cover it.
- No code change was required for correctness: the platform already fails closed
  correctly and the client dashboard fix (Session 4) now surfaces these real
  statuses.

**Follow-up fix — configurable gateway timeout.** The cold-start measurement
above exposed a config gap: `AI_TIMEOUT_MS` is honoured by the LLM/vision/
orchestrator providers but the gateway's direct microservice calls hardcoded
`30000` in six places. They now use a new `AI_SERVICE_TIMEOUT_MS` (default
`30000`, so behaviour is unchanged) so operators can raise it for cold Render
containers without a code change. Documented in `.env.example`; pinned by
`tests/integration/ai-service-timeout.test.ts` (2 tests).

**Gates:** `npx tsc --noEmit` 0 · `npm run lint` 0 · `npm run build` 0 ·
`npx jest` 965 passed / 3 skipped (107 suites).

### Session 5b — removed the browser→microservice bypass (defect class)

Tracing the Session-4 defect class to its root: `client/lib/cloud-config.ts`
still exposed `checkServiceHealth` / `checkAllServicesHealth` / `robustCloudFetch`
and a set of `VITE_*_URL` hostnames, and `client/hooks/useAIServices.ts`
(`smartApiCall`, `smartFileUploadCall`) used them to call the microservice hosts
**directly from the browser** whenever `VITE_USE_CLOUD_SERVICES=true`. That path
bypasses the backend gateway's provenance gate (a synthetic service would answer
the browser directly and the client would render it as a real result) and it
depends on env vars that are unset in production.

- `cloud-config.ts` now exposes only `apiBaseUrl` + `fallbackToMock` and
  `getDeploymentInfo()`; the direct-probe helpers and host fields are gone.
- `useAIServices.ts` always routes through the backend (`${API_BASE}${endpoint}`);
  the cloud-first branches and `getServiceUrl` were removed.
- `CloudServicesStatus.tsx` dropped the "environment validation" alert, the
  cloud-services badge and the per-service URL grid (replaced by a note that all
  AI traffic goes through the provenance-gated gateway).
- Docs that instructed operators to set the removed client vars were corrected
  (`FREE_DEPLOYMENT.md`, `CLOUD_DEPLOYMENT.md`, `QUICK_DEPLOY.md`).
- New guard test `tests/unit/no-direct-microservice-calls.test.ts` (2 checks):
  no client module reads a microservice `VITE_*_URL`, and `cloud-config` no
  longer exposes the probe helpers.

**Gates:** `npx tsc --noEmit` 0 · `npm run lint` 0 · `npm run build` 0 ·
`npx jest` 967 passed / 3 skipped (108 suites).

---

**Gates:** `npx tsc --noEmit` 0 · `npm run lint` 0 · `npm run build` 0 ·
`npx jest` 958 passed / 3 skipped.

### Session 6 — closed multi-agent registry + dashboard/entry-point gaps

Prior session routed every client AI call through the provenance-gated gateway.
This session closed the remaining roadmap gaps identified by inspecting the
live code, not by re-reading the README.

- **Specialist registry completed (10 → 14).** `agriculturalOrchestrator.ts`
  gained four allow-listed specialists the mission required but the registry
  lacked: `yield_intel`, `livestock`, `marketplace`, `advisor`. Each follows the
  existing contract (declared `dependsOn`, `keywords`, validated inputs, honest
  `insufficient_input`/`unavailable`, provenance `dataSource`, no fabrication):
  - `yield_intel` reports only a *recorded* `estimated_yield` (persisted-records),
    and stays `insufficient_input` otherwise — a yield is never invented.
  - `livestock` reports the caller's own herd/animal/production/health rows and
    explicitly refuses to suggest a treatment or drug dose.
  - `marketplace` reports `unavailable` (never a fabricated listing or buyer)
    until the supply-chain store is connected.
  - `advisor` gives rule-based orientation from saved context only.
- **Real livestock data wired into the gateway context.** New
  `collectLivestockRecords(db, userId)` in `ai-services-gateway.ts` reads the
  caller's `livestock_animals` / `livestock_production_records` /
  `livestock_health_events` (RLS-scoped, `user_id`-filtered) and emits
  provenance-tagged `LIVESTOCK …` context lines. A missing/empty table yields
  `[]` so chat still works and the specialist reports honestly. Used by both the
  linked-farm and no-farm branches.
- **Chatbot labels + tests.** `SPECIALIST_LABELS` in `AIAssistantChatbot.tsx`
  gained the four ids (the existing test fails if a label leaks the raw id).
  `tests/unit/agricultural-orchestrator.test.ts` +9 cases (planner selection and
  per-specialist honesty). New `tests/unit/news-entry-point.test.ts` (4 cases)
  pins the news path: dashboard card → `/news` route → real `/api/news` fetch,
  and asserts every quick-access destination is a declared route.
- **News entry point added to the farmer workspace.** `FarmOverviewPanel.tsx`
  (the overview tab of `UnifiedFarmerDashboard`) had no link to the working
  Agricultural News feature; it now has an AR/FR/EN quick-access grid linking the
  real tools (news, market, weather, irrigation, pest, livestock, AI, finance),
  all pointing at declared routes.

**Gates:** `npx tsc --noEmit` 0 · `npm run lint` 0 · `npm run build` 0 ·
`npx jest` (see below).

### Session 7 — real admin multi-agent + AI monitoring (no fake counters)

The Admin "System" tab previously had no verified metrics. This session added
real monitoring backed by the running code and database, plus regression tests.

- **New admin endpoint `GET /api/admin/agent-monitoring`** (guarded by
  `requireAdminAccess`, fails closed in production). It reports:
  - the *actual* allow-listed specialist registry, imported from
    `agriculturalOrchestrator.SPECIALISTS` — so the admin view can never drift
    from what the orchestrator will really run (14 specialists with `dependsOn`);
  - the process-local `agro-chat` telemetry (last real provider call only);
  - platform-wide `ai_service_logs` volume **only when the table exists**;
    otherwise `usage: null` with an explicit limitation. No call volume is
    invented, and a missing table is never shown as zero.
- **AdminPanel "Agents" tab** renders that endpoint (registry, dependencies,
  per-service call/error counts, honest "no call-log source connected" note).
  A regression test asserts the System tab reads the live `/api/ai/health`
  probe (`aiHealth?.overview`, `aiHealth.services`) and never fabricates a
  healthy state.
- **Tests:** `tests/integration/admin-monitoring.test.ts` +4 cases (registry
  parity, real usage from `ai_service_logs`, absent-table → null, unconfigured
  client → still reports registry). `tests/unit/admin-panel-tabs.test.ts` +1
  guard. `tests/unit/admin-auth.test.ts` unchanged and green.

**Gates:** `npx tsc --noEmit` 0 · `npm run lint` 0 · `npm run build` 0 ·
`npx jest` 979+ passed (see final run below).

### Session 8 — dead-link repair, honest legal page, localized error boundary

Audited every in-app navigation target against the router.

- **Found and fixed two dead links (P0-ish UX).** `Login.tsx` and `Signup.tsx`
  both link to `/terms` and `/privacy`, but neither route was declared, so both
  fell through to the `*` NotFound page — the user saw a "not found" screen
  from a login link. Added a real `client/pages/Legal.tsx` (trilingual ar/fr/en,
  RTL-aware) and registered `/terms` + `/privacy` in `AppRouter.tsx`. The page
  states only verifiable platform data practices (what is collected, where it
  is stored, RLS isolation, cascade delete) and marks the counsel-reviewed legal
  text as **pending** — no invented binding clauses.
- **Localized the top-level `ErrorBoundary`.** It sits above the language
  provider and was Arabic-only, so fr/en users got an Arabic error screen. It
  now reads the persisted language (`agrogrowth.lang`) and renders ar/fr/en with
  the correct direction. Behaviour is unchanged: no silent redirect, retry and
  home actions preserved.
- **New guard test `tests/unit/navigation-targets.test.ts`** asserts every
  static in-app destination (`to=`, `navigate()`, `href=`) resolves to a declared
  route, with an explicit regression check for `/terms` and `/privacy`.
- **Verified (no change needed):** role→dashboard routing (`client/lib/roleDashboard.ts`)
  sends each role to its own dashboard and returns `/` for unknown roles;
  `ProtectedRoute` fails closed on unverified role; registration creates the
  `public.users` profile through the trusted `auth.users` trigger and pins new
  accounts to `farmer` (client role is ignored).

**Gates:** `npx tsc --noEmit` 0 · `npm run lint` 0 · `npm run build` 0.

---

### Session 9 — news source-status honesty, irrigation fail-closed UX, orchestrator re-verify

- **Fixed a provenance inconsistency (P1).** `GET /api/news/sources` returned the
  static source catalogue with `isRealData: true` while `GET /api/news` returned
  real articles from those same feeds. Added `getNewsSourceStatuses()` to
  `server/services/news/tunisianAgriNews.ts`, which measures real per-feed
  availability (`itemCount`, `available`, `error`); rewired the route (now
  async). Regression test added to
  `tests/integration/tunisian-news-api.test.ts` ("reports measured source
  availability", stubs `fetch` to fail). **VERIFIED** — 5/5 news tests pass;
  live check reports all 6 sources with real counts.
- **Honest fail-closed UX on the smart-irrigation page (P2).**
  `client/pages/SmartIrrigationDashboard.tsx` silently rendered an empty state
  when the backend correctly answered 503 `SMART_IRRIGATION_NOT_VALIDATED`,
  making an outage indistinguishable from "no records". It now surfaces the
  server's reason in a status banner. **VERIFIED** — tsc + lint clean.
- **Re-verified the multi-agent orchestrator (P1).** `executePlan` in
  `server/services/ai/agriculturalOrchestrator.ts` performs DAG ordering, bounded
  concurrency (`ORCHESTRATOR_CONCURRENCY`), per-step timeout
  (`ORCHESTRATOR_STEP_TIMEOUT_MS`), bounded retries, hard-dependency blocking,
  and failure isolation; all 14 allow-listed specialists execute real logic
  (rule engine, persisted records, or trained-model inference via a service) and
  never impute missing inputs. **VERIFIED** — 47 orchestrator tests pass.
- **Re-verified P0 auth flow.** Registration creates `public.users` via the
  trusted `auth.users` trigger pinned to `farmer`; the self-escalation trigger
  (`prevent_self_role_escalation`) and RLS insert policy (`role = 'farmer'`)
  block client-supplied roles; `/api/auth/ensure-profile` is JWT-scoped,
  idempotent, and never elevates. Admin routes are gated by `requireAdminAccess`
  (verified JWT + DB role) and fail closed. **VERIFIED** (read + tests).
- **Housekeeping.** Added `.agent_tmp/` (local agent scratch) to `.gitignore`.

**Gates:** `npx tsc --noEmit` 0 · `npm run lint` 0 · `npx jest` → 989 passed,
3 skipped, 992 total · `agrogrowth-ai` pytest → 275 passed.

---

### Session 10 — user-facing dashboard repair: crash, dead buttons, investor nav

Mission focus: eliminate the generic "unexpected error" page on role dashboards
and make every visible action honest. No new features were invented; every change
makes an existing screen behave correctly.

- **Root cause of the generic error page (P0).** The professional dashboards
  (agronomist, trader, veterinarian, inspector, investor) fetched their routers,
  which honestly answer **HTTP 503** with `data: null` while no verified
  tenant-scoped source is connected. The handlers stored that `null` into list
  state and then ran `.filter()` / `.map()` **before** the null guard, throwing
  during render and tripping the top-level `ErrorBoundary` — the reported
  "unexpected error" page. Fixed by routing every list assignment through
  `asArray()` and every availability check through `detectUnavailable()`
  (`client/lib/dashboardData.ts`), then rendering the honest, localized
  `DataUnavailableNotice` instead of a red "failed to load" card.
  **VERIFIED** — `tests/unit/dashboard-unavailable-safety.test.ts` (6/6).
- **Dead action buttons (P0/P1).** 37 `<Button>`s across the role dashboards
  rendered with no handler (create/edit/export/contact/details). They were wired
  to a localized "not available yet — nothing was saved" toast via the new
  `useUnavailableAction()` hook (`client/hooks/useUnavailableAction.ts`), so a
  click never silently does nothing and never fakes success. Contact actions that
  have a real handler (`onContactClient`) call it instead.
  **VERIFIED** — `tests/unit/dashboard-action-buttons.test.ts` (7/7).
- **Investor role had an empty sidebar (P1).** `investor` is a declared role with
  its own dashboard route but appeared in **no** `navigationCategories`, so an
  investor landed on a dashboard with no navigation at all. Added `investor` to
  the Dashboards category and introduced a top-level **News & Info** category
  that exposes `/news` to all eight roles. Also added the missing
  `dataUnavailable` render branch to `InvestorDashboard` (its list state could be
  `null` after a 503).
  **VERIFIED** — `tests/unit/nav-role-coverage.test.ts` (3/3).
- **Added `onRetry` to `DataUnavailableNotice`** so a failed dashboard can be
  retried in place (localized ar/fr/en).

**Gates:** `npx tsc --noEmit` 0 · `npm run lint` 0 · `npm run build` 0 ·
`npx jest` → **1005 passed**, 3 skipped, 1008 total (+16 tests this session).

---

### Session 11 — sidebar dedupe, null-safe livestock lists, real revenue export

Mission focus: continue P0/P2 hardening on the screens a newly registered farmer
actually reaches. Nothing was invented; every change makes an existing screen
behave correctly.

- **Duplicate `/news` sidebar entry (P1).** `Agricultural News` was declared both
  under **Market Intelligence** and under the new top-level **News & Info**
  category, so the sidebar rendered two identical links. Removed the
  Market-Intelligence copy; `/news` now appears exactly once. A new regression
  test asserts no href is declared twice in the navigation catalogue.
  **VERIFIED** — `tests/unit/nav-role-coverage.test.ts` (5/5).
- **Null-safe list state on the livestock screens (P0).** `LivestockDashboard`,
  `AnimalHealthMonitoring` and `TreatmentRecommendations` stored the raw
  `data.data` from the `/api/livestock-management/*` and
  `/api/disease-treatment/*` envelopes. The routes return an array on success,
  but a `null` (partially applied migration, RLS denial) would crash the
  `.filter()` on the next line and trip the global error boundary. Every list
  assignment now goes through `asArray()`, so an unexpected shape degrades to an
  empty list with the honest empty state instead of the generic error page.
  **VERIFIED** — `tests/unit/dashboard-unavailable-safety.test.ts` (9/9).
- **Dead "export" button on Revenue Analysis (P2).** The sales-records export
  control had no handler. Added a shared, client-only CSV helper
  (`client/lib/csv.ts` — RFC-4180 quoting + UTF-8 BOM so Arabic renders in
  Excel) and wired the button to export exactly the rows the user is looking at
  (post-filter). Disabled when there is nothing to export. **VERIFIED** — tsc +
  lint clean; export operates only on already-fetched, RLS-scoped rows.
- **Farmer CRUD contract tests (P0).** The routes a new farmer depends on
  (`GET /api/assistant/farms`, `POST /api/assistant/actions/cultivations`) had no
  test. Added `tests/integration/assistant-farm-actions.test.ts`: anonymous
  callers are refused before any write, the list reads through the caller's own
  scoped client, invalid input is rejected before persistence, and a cultivation
  the caller does not own is refused rather than written.
  **VERIFIED** — 4/4.

**Gates:** `npx tsc --noEmit` 0 · `npm run lint` 0 · `npm run build` 0 ·
`npx jest` → **1015 passed**, 3 skipped, 1018 total (+10 tests this session).

## Session 12 — livestock screens reach the real API (P0/P2)

The Advanced Livestock dashboard was a leftover consumer of the removed
synthetic demo. It gated every fetch on `data.provenance?.verified === true`,
but the livestock routes answer with `provenance: { source, persisted: true }` —
the `verified` field was never emitted. The gate therefore always failed, so a
caller with real persisted records still saw a permanent "data unavailable"
panel. The page also read a synthetic shape (`summary.avgHealthScore`,
`speciesDistribution`, `productionHistory`) the backend never produced, and
carried three buttons with no handler.

- **AdvancedLivestockDashboard rewritten against the real contract (P0).**
  Reads the `{ success, data }` envelope, coerces lists through `asArray()`,
  consumes the real aggregates (`totalAnimals`, `bySpecies`, `byHealthStatus`,
  `totalValue`, `feedItemsLowStock`), and drops the removed synthetic fields.
  The "إضافة حيوان" control now opens a dialog that POSTs to
  `/api/livestock-management/animals` (tenant-scoped, RLS-enforced) and reports
  the duplicate-tag and network failures honestly. Alerts resolve through the
  real `PATCH /health-events/:id/resolve`, and only for alerts backed by a row
  (UUID id); status-derived alerts are shown read-only. Production-trend charts
  are labelled as not connected instead of plotting invented numbers.
  **VERIFIED** — `tests/unit/dashboard-unavailable-safety.test.ts` (13/13).
- **Animal Health Monitoring buttons wired (P0/P2).** "إضافة فحص جديد" and the
  per-vaccination "تطعيم" open a real health-event dialog that POSTs to
  `/api/livestock-management/health-events`; the alert "حل" control calls the
  real resolve endpoint. A disabled control with an honest reason replaces any
  click that would otherwise do nothing.
  **VERIFIED** — dead-button guard.
- **Honest no-op elimination across sidebar-reachable pages (P2).**
  `IntelligentBreedingManager` (جدولة التلقيح / تفاصيل أكثر),
  `CropRotationPlanner` (تطبيق / حفظ الدورة المخصصة) and `EffectivenessReports`
  (تصدير التقرير, now a real CSV export of the filtered rows) no longer render
  handler-less buttons. `LivestockDashboard` "عرض التفاصيل" opens a real detail
  dialog. Every remaining unwired control is `disabled` with a `title`
  explaining the missing data source.
  **VERIFIED** — `tests/unit/dashboard-action-buttons.test.ts` extended with a
  sidebar-reachable-page guard (13/13).
- **AI gateway honesty re-checked.** No client module calls a Python
  microservice or a `localhost`/`onrender.com` URL directly; every AI call goes
  through the provenance-gated backend gateway, and the gateway suppresses the
  localhost fallback under a hosted runtime
  (`NODE_ENV=production` / `RENDER` / `RENDER_SERVICE_ID`).
  **VERIFIED** — grep + gateway unit guard.

**Gates:** `npx tsc --noEmit` 0 · `npx eslint <changed>` 0 · `npm run build` 0 ·
`npx jest` → **1025 passed**, 3 skipped, 1028 total (+10 tests this session).

### Session 13 — honesty audit: fabricated overview/weather/market surfaces removed

A scan for the "non-existent contract field + `||` default" bug class (first
seen in `AdvancedLivestockDashboard`) found three more surfaces that rendered
fabricated numbers or crashed on an unavailable feed. All are now fail-closed
and covered by regression tests.

- **`ComprehensiveOverviewCards` (Farmer Dashboard overview tab) — rewritten.**
  It mapped `/api/farm-management/overview` as a flat
  `{ land, crops, livestock, financial }` shape the endpoint never returns, so
  *every* field fell through to a hard-coded illustrative default
  (`totalArea || 25.5`, `totalYield || 1247`, `totalAnimals || 245`,
  `totalRevenue || 156780`, a 3-crop "top performers" list, a 3-month revenue
  trend, …). The farmer's home overview therefore showed an entirely invented
  farm. It now reads the real `{ summary, farms, crops, market, financial,
  unavailable }` contract, the real Open-Meteo snapshot, the real
  `/api/livestock-dashboard` aggregate, `/api/financial-summary`, and the latest
  `/api/soil-analysis/reports` row; each domain renders only what its endpoint
  returned and shows an explicit empty/unavailable state otherwise.
  **VERIFIED** — `dashboard-unavailable-safety.test.ts`.
- **`MarketAnalyticsWidget` — fail-closed.** `/api/market-analysis/*` answers
  503 (`MARKET_SOURCE_NOT_CONNECTED`); the widget ignored `response.ok` and
  defaulted to `+2.3%`, `الزيتون +15%`, volume `12500`. It now treats a non-OK
  response as unavailable and renders `—` for any missing field.
- **`EnhancedMarketDashboard` — crash fixed.** It stored the raw 503 object
  into `marketPrices` (a list) and then called `.filter`/`.map` on it, which
  threw during render — a direct cause of the generic "unexpected error" page.
  It now guards `response.ok` and only accepts array bodies.
- **`Index` (home) — real contract + no defaults.** Read flat farm fields
  (`soilHealthAvg`, `profitMargin`, `waterEfficiency`) that never exist and
  defaulted weather to `|| 24 / || 65 / || 25` against the wrong Open-Meteo
  keys. Now reads `summary.*` and the real `current.description` /
  `current.windSpeed`, rendering `—` when an observation is absent.
- **`SmartAdvisor` — no invented weather/alerts.** Removed `|| 25`, `|| 65`,
  `|| 5`, `|| 6.8` fallbacks and a hard-coded 3-item alert list shown when the
  (retired) endpoint returned nothing.

**Gates:** `npx tsc --noEmit` 0 · `npx eslint <changed>` 0 · `npm run build` 0 ·
`npx jest` → **1032 passed**, 3 skipped, 1035 total.

### Session 13 (cont.) — remaining fabricated fallbacks removed

- **`SmartAdvisor`** (page whose data route is retired with 410) still rendered
  an invented farm context — Riyadh location, 100 ha size, sandy soil, drip
  irrigation — plus a hard-coded 3-item weather-alert list. All replaced with
  empty placeholders; nothing is invented for an unavailable source.
- **`EnhancedLayout`** account menu fell back to a fabricated email
  `user@agrogrowth.com`; now a neutral `—`.
- Regression tests added for both.

**Gates:** `npx tsc --noEmit` 0 · `npx eslint <changed>` 0 · `npx jest` →
**1040 passed**, 3 skipped, 1043 total.

### Session 13 (cont. 2) — EffectivenessReports + FinancialDashboard honesty

- **`EffectivenessReports`**: the before/after plant-health inputs were
  pre-filled with `50`/`70` and an empty field was coerced back to those values
  (`parseInt(...) || 50`), so a report could carry scores the farmer never
  entered. Both now start `null`, render empty, and the submit button is
  disabled until real values are typed (the backend model is unverified and
  fails closed with 503 anyway).
- **`FinancialDashboard`**: `money(summary?.totalX || 0)` displayed an
  unavailable/erroring summary as a real `0.000 TND` balance. Now renders `—`
  until a real summary loads.
- Regression tests added for both.

**Gates:** `npx tsc --noEmit` 0 · `npx eslint <changed>` 0 · `npm run build` 0 ·
`npx jest` → **1042 passed**, 3 skipped, 1045 total.
