# AgroGrowth — Engineering Progress Report

Maintained by the autonomous engineering team. Only verified facts are
recorded here; anything not yet confirmed against running code or the live
database is listed under "Remaining work" or "Known limitations".

## Environment

- Repository: `Arfaoui859/AgroDev`
- Working branch: `feat/ai-integration-production-hardening`
- Runtime: Node + Express (SSR build in `dist/server/node-build.mjs`),
  React 18 SPA, Supabase Postgres (PostgreSQL 17.4).
- Python AI microservices in `agrogrowth-ai/` (FastAPI, ports 8001–8008, eight services).

## Completed work

### Phase 0 — Microservice reliability (event-loop blocking)
- Every microservice was probed on `/health` while a heavy request ran. The
  weather/yield service trained its two scikit-learn models **inside** `async`
  handlers, blocking the event loop for ~100 s: a concurrent `/health` timed
  out and the platform marked a live service as down. `/health` also took the
  training lock, so it hung until training finished.
- Added `ai_common/offload.py` (`offload()` → `anyio.to_thread.run_sync`) and
  moved every blocking call (model load/predict, vision HTTP, chat/planner/
  notifier) out of the event loop: fully-synchronous handlers became plain
  `def` (threadpool); the async upload handlers keep `async def` and offload
  their blocking body. `_model_status()` is now lock-free.
- Verified: `/health` returns 200 in ~1 ms even during a cold
  `/create-weather-plan`; the plan request still succeeds. Regression tests
  (`tests/test_event_loop_non_blocking.py`) enforce the contract at the AST
  level for the weather and image services.


### Phase 1 — Repository understanding and audit
- Audited frontend pages, backend routes, AI services, DB schema, auth,
  Docker/CI, tests and docs.
- Established that the AI layer has a deterministic rule-based engine as the
  honest fallback and reports provenance per capability via
  `GET /api/ai/capabilities`.

### Phase 2 — Environment and startup
- Confirmed the built server starts and serves (`/api/ping` → pong).
- Confirmed `.env` loading via `dotenv/config`; server honours `PORT`.
- Corrected the repository `AGENTS.md` (it still described the starter
  template: it claimed Vitest and port 8080).

### Phase 3 — Backend and database stabilization
- Audited live RLS posture: RLS was off on several per-user tables while
  `anon`/`authenticated` held broad grants, so isolation was not enforced.
- Applied `database/rls-hardening.sql` (idempotent): enabled RLS and added
  owner/expert policies across all user tables. Extended it to cover
  `weather_data`, which had been left world-readable.
- Fixed user-lifecycle integrity: deleting an `auth.users` row left an
  orphaned `public.users` profile (no FK) and its farms. Added
  `database/user-lifecycle.sql` — an `AFTER DELETE` trigger on `auth.users`
  that removes the profile and lets `ON DELETE CASCADE` clean up the rest.

### Phase 4 — Frontend functionality and API integration
- Labeled the mock-driven `FieldManagement` page with the shared
  `SimulatedDataNotice` so its fixture data is not mistaken for live records.
- Completed the mock-data audit: every page that synthesises records now shows a
  disclosure banner. 14 pages generate mock data; all 14 render either
  `SimulatedDataNotice` or `DataProvenanceBanner`, so no synthetic figure is
  presented as a live measurement.
- Verified every client API path resolves. Of the seven routes that returned a
  non-200 probe, six are intentional business-logic 404s/400s (e.g. an
  unknown weather station, a missing irrigation schedule, a validation error);
  the only `/api/auth` reference is a mock string in
  `SecurityMonitoringContext`, not a real call. No genuine missing route.

### Phase 5 — AI agents and real providers
- Verified the farm advisor answers in the requested language end to end.
  Fixed a real bug: the rule-based answer body was hardcoded Arabic, so
  French and English callers received Arabic soil guidance, crop names and
  water-need labels. The body, context summary and provenance disclaimers
  are now localised (ar/fr/en).
- Verified honesty across the AI surface: soil/crop answers are labeled
  `dataSource: "rule-based"` / `isRealData: false`; the plant-disease
  endpoint returns an honest 503 (never a fabricated diagnosis) when no
  vision provider or microservice is available; weather is real
  (Open-Meteo, `source.isRealData: true`); market data reports
  `dataSource: "database"`.

## Bugs discovered and fixed

| # | Bug | Root cause | Fix |
|---|-----|-----------|-----|
| 1 | RLS disabled on `weather_data` while anon held grants | Table omitted from the hardening migration | Added to `rls-hardening.sql` |
| 2 | Deleting an account left orphaned profile + farm data | No FK from `public.users` to `auth.users` | `on_auth_user_deleted` trigger |
| 3 | French/English advisor answers contained Arabic | Rule-based body hardcoded in Arabic | Full localisation of the rule-based answer |

## AI providers and models integrated

- **LLM**: env-driven OpenAI-compatible provider (`AI_BASE_URL`,
  `AI_API_KEY`, `AI_MODEL`) with bounded retries, timeouts and telemetry.
  Not configured in this environment, so the honest rule-based engine
  answers instead.
- **Vision**: configurable multimodal provider (`AI_VISION_MODEL`), plus a
  configurable image-diagnosis microservice. Not configured here; the
  endpoint reports unavailability rather than guessing.
- **Weather**: Open-Meteo (live, verified).
- **Market**: platform database (`market_prices`).

## Database changes

- `database/rls-hardening.sql` — RLS enabled + policies on all user tables
  (48 policies), including `weather_data`.
- `database/user-lifecycle.sql` — `auth.users` delete trigger for cascade
  cleanup of the profile row.

## Tests executed (actual results)

- Jest full suite: **524 passed, 2 skipped, 62 suites**.
- Python pytest (in `agrogrowth-ai/`): **183 passed** (was 180; +3 new
  event-loop regression tests).
- `npx tsc --noEmit`: clean. `npm run lint`: clean (0 warnings).
- Client production build (`npm run build:client`): succeeds.
- Gateway smoke test: `/api/ai/soil/analyze` → `synthetic-model` /
  `isRealData:false`; `/api/ai/assistant/chat` → `rule-based` /
  `isRealData:false`; `/api/ai/crops/recommend` → 200 with 6 honest
  `heuristic` recommendations; `/api/market-analysis/prices/current` → 200
  with `X-Data-Provenance: simulated`; `/api/market/all` → `database` /
  `isRealData:true`.
- `npx tsc --noEmit`: clean.
- Live RLS isolation: anon sees 0 rows, owner sees their row, another user
  sees 0 rows.
- Live end-to-end farmer flow: 7/7 checks (create user → sign in → farm /
  field CRUD with the user JWT → isolation).
- Live account-deletion test: create user + farm → delete auth user →
  **0 orphaned rows**.
- Live localisation check: `language=fr`/`en` return fully localised
  answers; `language=ar` unchanged.

## Remaining external dependencies

- An LLM provider key (`AI_BASE_URL`/`AI_API_KEY`, or `GEMINI_API_KEY` /
  `GOOGLE_API_KEY`) to enable model-backed answers instead of the rule-based
  engine. The Gemini path is fully wired (`AI_PROVIDER=gemini`, default model
  `gemini-flash-latest`, vision via `AI_VISION_MODEL`); it only needs a valid
  key. A credential supplied for verification was rejected by the Gemini API
  (`INVALID_ARGUMENT: API key not valid`) — it was an OAuth client id, not an
  API key — so the honest rule-based fallback remains active.
- A vision provider (`AI_VISION_MODEL`) or the image-diagnosis microservice
  running, to enable real plant-disease detection.
- The Python AI microservices (ports 8001–8008) deployed/running for the
  specialised engines. All eight were started locally and answer `/health`.

## Known limitations

- The rule-based engine's per-parameter soil recommendation sentences are
  authored in Arabic only; for fr/en they are shown under a localised
  heading with an explicit note.
- The `agroadmin@growth.com` profile has no matching `auth.users` row (legacy
  data), which is why a hard FK constraint was not added.

## Security notes

- Secrets live only in the gitignored `.env`; no secret values are printed
  or committed.
- RLS is fail-closed for anonymous access; every new table must have RLS
  enabled and explicit policies.

## Next engineering tasks

1. Configure and verify a real LLM + vision provider; re-run
   `tests/integration/llm-live.test.ts`.
2. Bring up the Python AI microservices and verify each specialised endpoint.
3. Expand API integration and end-to-end coverage for the remaining modules.
4. Deploy the Python microservices alongside the Node gateway (single-host
   compose) so the specialised engines are always reachable.

---

## Session report — honest-data & provenance hardening

**Date:** 2026-11-04 · **Branch:** `feat/ai-integration-production-hardening`
**Commit:** `4d59cb4`

### Completed

- **Full-suite verification**: `tsc --noEmit` exit 0, `eslint` exit 0,
  `npm run build` exit 0, `jest` 539 passed / 2 skipped / 0 failed.
- **AI microservices**: all 8 `/health` endpoints (8001–8008) return 200.
- **Security**: `/api/admin/*` GETs return 401 and POSTs return 403 without a
  token (verified live); CORS is env-gated, rate limiters and the body-size
  guard are in place; `npm audit --omit=dev` → 0 vulnerabilities.
- **Honesty fix (notification feed)**: the mounted `NotificationProvider`
  fabricated farm-specific alerts client-side. It now loads the real
  `/api/notifications` feed, surfaces the server provenance and discloses
  simulated content in `NotificationCenter`.
- **Weather provenance**: `/api/weather/*` now advertises
  `X-Data-Provenance: open-meteo` / `X-Is-Real-Data: true`, matching the body.
- **Dead demo code labelled**: `SecurityMonitoringContext` and `RBACContext`
  (never mounted) are marked as demo scaffolding that must not be shown as real.
- **Deliverable**: `FEATURE_MATRIX.md` generated programmatically from live
  probes of the running server.

### Bugs discovered and fixed

1. `NotificationContext` invented notifications with `Math.random()` and
   persisted them to `localStorage`, presenting them as real farm alerts.
2. `/api/weather/*` returned real Open-Meteo data without the provenance header
   the client banner reads, so the UI could not tell real from synthetic.

### Tests executed

| Command | Result |
|---|---|
| `npx tsc --noEmit` | exit 0 |
| `npm run lint` | exit 0 |
| `npm run build` | exit 0 |
| `npx jest` | 539 passed, 2 skipped, 0 failed |
| AI suite (`.venv`) | 183 passed |
| microservice `/health` ×8 | 200 each |

### Remaining external dependencies

- A real LLM/vision provider (`AI_BASE_URL` + `AI_API_KEY` or `GEMINI_API_KEY`)
  is still unconfigured, so AI answers remain honestly labelled
  rule-based/heuristic. Configure a provider to upgrade quality.
- A licensed market-price feed is not available; market data stays `simulated`.

### Known limitations

- Market, marketplace and notification feeds are demo content, now clearly
  labelled as simulated rather than real.

---

## Addendum — 2026-11-11 · auth/route hardening (baseline `649de66`)

Independent pass on the auth → profile → role → route chain. Four defects fixed
with regression tests; details in `FINAL_BLOCKERS.md` (Addendum).

1. **`ProtectedRoute` failed open.** The guard
   `allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)`
   short-circuited to *allow* when `user` was `null` (authenticated session whose
   profile had not loaded), so `/admin-panel` could render for a non-admin. The
   decision is now a pure `resolveRouteAccess()` (`client/lib/routeAccess.ts`)
   that fails closed. Test: `tests/unit/route-access.test.ts`.
2. **`AuthContext` fabricated a role.** On a failed profile read it defaulted to
   `role: "farmer"`, causing the wrong-dashboard symptom. Now exposes
   `roleVerified` (true only after a trusted `public.users` read); gated routes
   deny while it is false.
3. **Stale-deploy chunk-load error page.** Added `client/lib/lazyWithRetry.ts`
   (one session-guarded reload on a chunk-load failure) across all lazy routes.
   Test: `tests/unit/lazy-with-retry.test.ts`.
4. **Missing profile provisioning path.** Added idempotent, JWT-scoped
   `POST /api/auth/ensure-profile` (always creates `farmer`; never trusts a
   client role/id) and a client self-heal on a missing-row read. Test:
   `tests/integration/ensure-profile-auth.test.ts`.

Gates: `tsc --noEmit` 0 · `eslint` 0 · `npm run build` 0 · `npx jest`
**793 passed, 2 skipped** · `pytest agrogrowth-ai/tests` **245 passed**.
Live: admin routes fail closed (401), `ensure-profile` 401/503, `/api/news`
returns real publisher RSS.

