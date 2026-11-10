# AgroGrowth — Remaining Work Register

**Branch:** `feat/soil-analysis-professional-report`  
**Updated:** 2026-11-10  
**Purpose:** Track implementation gaps without presenting planned, mocked, heuristic, or unverified capabilities as production-ready.

## Status definitions

- **Implemented in source:** code change is present in this branch; runtime behavior is not yet proven.
- **Partially implemented:** some paths work, but important integration, persistence, validation, or coverage is missing.
- **Blocked / external proof required:** requires live credentials, provider access, database migration, deployment, or real-world data.
- **Not started / not audited:** no adequate evidence has been collected yet.

## Changes made in this pass

| Area | Change | Evidence / limitation |
|---|---|---|
| Layout actions | Header Add now opens field management; Notifications opens notification center | Source change only; browser interaction not yet run |
| Theme | Dark-mode toggle now applies the `dark` class and persists preference in local storage | Source change only; visual regression not yet run |
| Notifications | Removed the fabricated initial unread count of 3; starts at 0 until API data arrives | API/session behavior still needs live verification |
| Farm management route | `/comprehensive-farm-management` now renders the comprehensive page rather than redirecting to the farmer dashboard | Source route change only; route smoke test pending |
| Field creation honesty | Field Management demo screen no longer silently closes and pretends to save; save is disabled with an explicit database-integration explanation | CRUD implementation remains outstanding |
| Field page controls | Alert shortcut opens alerts; field-view action opens details; unavailable location, report, import, export, and activity-replay controls are disabled | Source change only; browser test pending |
| Role-specific dashboards | Agronomist, trader, veterinarian, and inspector routes now require matching roles (admin allowed); ProtectedRoute no longer stores user IDs/user agents in localStorage or schedules full-page redirects | Client-side guard only; backend authorization still must be verified |
| Investor dashboard | Removed shared demo investor ID; uses authenticated apiFetch; treats unavailable API responses as unavailable data; no longer presents demo financial data as live | Investor endpoints currently fail closed; real investor persistence and authorization remain unimplemented |
| Government dashboard | Checks all seven API responses; when the fail-closed endpoints are unavailable, shows a clear unavailable state instead of empty/zero official metrics | Source change only; live browser/API behavior not yet tested |
| Admin mutations | Disabled add/edit/suspend/activate UI controls that had no secure server mutation endpoint; removed local-only user status update | Admin CRUD/status APIs remain outstanding |
| Crop recommendations UI | Uses authenticated apiFetch; clears results and shows unavailable state on non-success responses; planting action disabled until connected to a persisted cultivation workflow | Recommendation API is currently fail-closed; no trained/validated model is claimed |
| Arabic copy integrity | Repaired visible replacement-character corruption in core, notification, market-alert, weather-alert, and crop-suggestion pages | Needs full UI locale review and automated encoding scan |
| Equipment data | Comprehensive Farm Management shows an empty state when no equipment records exist rather than inventing a sample tractor | Verify API response and rendering in browser |

## Remaining work — prioritized

### P0 — Build, routing, and user-facing correctness
- Run the real client/server production build, TypeScript checks, ESLint, unit tests, integration tests, and Cypress E2E on this exact branch.
- Resolve every compile, lint, test, and runtime failure; do not count source-string checks as tests.
- Smoke-test every route in `AppRouter`, including role-protected routes, unknown routes, redirects, and deep links.
- Audit every visible button, icon button, link, tab, form, dialog, dropdown, search box, and quick action. Remove no-op handlers; connect real actions or disable controls with a clear explanation.
- Audit forms for required fields, units, range validation, server errors, duplicate submissions, loading states, and success/failure feedback.
- Audit responsive layouts (mobile/tablet/desktop), Arabic RTL, French/English translations, keyboard navigation, and accessibility.
- Check all pages for hard-coded demo data. Keep clearly labelled demonstrations separate from real user records; never mix them in dashboards or analytics.
- Verify empty, loading, offline, permission-denied, and partial-data states consistently.

### P1 — Field and farm management persistence
- Replace Field Management's Jordan-based mock farms, fields, crop history, and alerts with authenticated user-scoped records.
- Implement create/read/update/delete for farms, fields, boundaries, crops, and equipment with server-side validation.
- Persist GPS coordinates, area, soil measurements, notes, and attachments; validate coordinate ranges and hectare units.
- Implement alert read/resolve operations against the backend, not component-only state.
- Add ownership checks and audit events for every mutation.
- Add migration(s), indexes, RLS policies, and tests before enabling write controls.

### P1 — AgroGrowth Agent (real operational agent)
- Map all available tools to real backend services and database operations; remove any simulated action paths.
- Add a strict tool registry with schemas, authorization, role/ownership checks, input validation, and per-tool timeouts.
- Require user approval for consequential actions (irrigation schedules, pesticide/fertilizer plans, purchases, messages, record deletion, or external transactions).
- Persist conversation and task state securely; add correlation IDs, action history, idempotency, and audit logs.
- Make the Agent cite the farm/soil/weather/market evidence it actually used and explicitly identify missing or stale data.
- Add safe failure handling, retry policy, rate limits, and tests for prompt injection, cross-tenant access, and unauthorized tool execution.
- Add scheduled/proactive monitoring only where a real data source and user consent exist.

### P1 — Soil Analysis professional report
- Validate input units and provenance (lab, sensor, manual); reject physically impossible values and flag missing/ambiguous units.
- Verify soil texture calculation and USDA classification against authoritative reference cases.
- Expand interpretation for pH, EC/salinity, sodicity (SAR/ESP), carbonate, CEC, organic matter, NPK, moisture, slope, and irrigation-water quality.
- Distinguish measured facts, deterministic calculations, reference thresholds, and LLM-generated explanations.
- Add data-quality/confidence explanations without inventing a model confidence score.
- Improve crop suitability ranking with location, season, cultivar, water availability, soil constraints, and locally relevant reference data.
- Do not announce a single “best crop now” unless the evidence supports it; ask for critical missing inputs.
- Add actionable soil preparation, amendment/fertilizer guidance with units and safety caveats, irrigation guidance, and 30/60/90-day follow-up.
- Include cost/yield/profit estimates only when source data and assumptions are explicit.
- Add printable/PDF report checks, report history, source references, and Agent handoff tests.

### P1 — AI model/data integrity
- Publish a data inventory: dataset name, owner, licence, geography, date range, features, target labels, missingness, and known bias.
- Use only public datasets with compatible licences and documented provenance; do not fabricate rows or labels.
- Build reproducible training scripts, data validation, train/validation/test split strategy, leakage checks, baselines, metrics, calibration, and error analysis.
- Record model artifact hash, code commit, dataset version, training configuration, metrics, limitations, and model card.
- Add inference schema validation, model versioning, monitoring, drift checks, and a rollback path.
- Until trained and evaluated, label the service as deterministic/rule-based or advisory LLM; never label it as a trained ML model.
- Image diagnosis requires a real, licensed, labelled plant-disease dataset, held-out evaluation, class coverage, calibrated confidence, and an explicit “unknown/uncertain” path.

### P2 — Other AI services and live data
- Audit crop recommendation, image diagnosis, market prediction, weather/yield, pest control, irrigation optimization, and intelligent agent individually.
- Remove synthetic-demo outputs from production decisions or mark them visibly as demonstrations.
- Integrate verified Tunisian/regional market price sources; show source, timestamp, unit, market, and freshness.
- Address Open-Meteo 429 limits with caching, backoff, request budgets, and stale-data labels.
- Add service contracts, health/readiness checks, timeouts, circuit breakers, and contract tests.
- Verify that each Render URL, environment variable, health endpoint, and API schema matches the deployed service version.

### P1 — Supabase, security, and data governance
- Apply the pending assistant persistence migration only after reviewing it against the live schema.
- Verify RLS policies for every user-owned table with owner, non-owner, anonymous, and admin test identities.
- Confirm service-role secrets never reach the browser; validate JWT claims and roles server-side.
- Add Zod/schema validation to all mutation endpoints, upload limits/content checks, rate limits, and safe error responses.
- Audit CORS, Helmet, session/token handling, logging of personal data, storage bucket policies, and signed URLs.
- Add backup/restore and data-retention procedures.

### P2 — Product quality and release operations
- Complete Arabic-first RTL coverage and consistent French/English fallback.
- Review navigation labels, duplicate pages, legacy redirects, role-specific dashboards, and discoverability.
- Improve performance with route-level chunks, image optimization, query caching, and bundle analysis.
- Add release checklist, environment parity, migration ordering, health smoke tests, and rollback procedure.
- Confirm actual Render deployment commit and test the deployed app; a pending Vercel status is not proof of deployment success.

## External dependencies / evidence not available from source-only review
- Live Supabase project access and proof that migrations/RLS policies were applied.
- Live Render service logs, environment variables, deploy commit, and endpoint behavior.
- Licensed public datasets and their actual downloads/versions.
- Real lab, sensor, weather, and market observations for evaluation.
- Browser-based user flows and mobile/RTL visual verification.

## Release gate
Do not describe AgroGrowth as production-ready until P0 is closed, all P1 security/data/Agent/soil-report items have evidence, and the exact deployed commit passes smoke and regression tests.
