## Admin user-management workflow expansion (2026-11-10)

- Added invitation-based user creation through `POST /api/admin/users`. The endpoint requires a verified admin JWT, rejects existing platform profiles/auth identities, invites through Supabase Auth, creates a non-admin role profile, writes a `user.created` audit event, and attempts rollback if persistence/audit fails.
- Enabled the Admin Panel Add User dialog with full name, email, and supported role selection. No password is generated or exposed in the browser; the user completes setup through the invitation email.
- Added audited full-name editing through `PATCH /api/admin/users/:userId/profile`, synchronizing `public.users.full_name` and Auth user metadata with rollback attempts.
- Added UI support for showing profile-name changes in the activity audit table.
- Added anonymous/demo-session rejection coverage for invitation and profile-edit endpoints.
- Updated `docs/ADMIN_ACCOUNT_SETUP.md` with the invitation SMTP prerequisite, data provenance, and profile-edit behavior.
- Changes are source-committed only. Supabase SMTP delivery, migration application, CI, TypeScript/build, and live end-to-end flows remain unverified. Do not claim production availability until those checks pass.

## Admin user-directory pagination and server-side filters (2026-11-10)

- Connected the Admin users table to the existing server-side search, role filter, and account-status filter parameters.
- Added debounced search/filter refreshes, server pagination controls, total-result counts, and a loading state.
- Removed the client-side 20-row truncation and local filtering that only searched the first API page.
- The API currently returns up to 50 rows per page; the UI now exposes navigation across all result pages.
- Source change committed as `7b9de68790a429491e86dbaa11d5dfed93c28a62`. TypeScript/build, browser behavior, CI, and live Supabase pagination still require verification.

## Admin provisioning validation hardening (2026-11-10)

- Fixed the privileged admin-create endpoint's email validator: the previous escaped regular expression rejected ordinary email addresses.
- Exported the validator for direct unit coverage and added positive/negative cases for valid addresses, missing domains, whitespace, and malformed input.
- Admin maintenance endpoints remain rate-limited; no default admin credentials are embedded.
- Validation is source-level until the current GitHub Actions run completes. The live Render/Supabase provisioning path has not been executed from this environment.

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
| Arabic encoding cleanup | Removed replacement-character corruption from the additional investor, government, field, market-alert, weather-alert, crop-suggestion, history, location, and disease-upload strings reviewed in this pass | Source scan passed for reviewed files only; whole-repository scan remains |
| JSX/source regression check | Verified key route JSX, role guards, disabled/action-bound buttons in audited pages, removal of shared investor demo identity, and unavailable-data states | 10 source assertions passed; this is not a TypeScript build, test suite, or browser E2E run |
| Admin mutations | Disabled add/edit/suspend/activate UI controls that had no secure server mutation endpoint; removed local-only user status update | Admin CRUD/status APIs remain outstanding |
| Crop recommendations UI | Uses authenticated apiFetch; clears results and shows unavailable state on non-success responses; planting action disabled until connected to a persisted cultivation workflow | Recommendation API is currently fail-closed; no trained/validated model is claimed |
| Arabic copy integrity | Repaired visible replacement-character corruption in core, notification, market-alert, weather-alert, and crop-suggestion pages | Needs full UI locale review and automated encoding scan |
| Equipment data | Comprehensive Farm Management shows an empty state when no equipment records exist rather than inventing a sample tractor | Verify API response and rendering in browser |
| Comprehensive farm API authentication | Dashboard overview now uses `apiFetch` so a Supabase access token is attached when available; removed the misleading hard-coded `farm_001` default | Backend overview endpoint intentionally returns HTTP 503 until tenant-scoped persistence is implemented; authenticated request path is source-checked only |
| Comprehensive farm detail actions | Removed unused detail state and disabled crop/task/equipment detail controls that previously changed invisible state; corrected four Arabic replacement-character strings and added provenance banner to unavailable state | Source assertions passed; real detail views and persistence remain outstanding |

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

| API authentication hardening — role dashboards | Added `requireAuth` to farmer, agronomist, trader and government dashboard mounts; added it to veterinarian dashboard endpoints and all field-inspector endpoints | These handlers currently fail closed with 503; role-specific server authorization and tenant-scoped data access still required before enabling real data |
| API authentication hardening — farm and livestock | Added `requireAuth` to every comprehensive farm-management endpoint and all advanced livestock endpoints, including the previously unguarded `GET /api/animals` | Source-level route assertions pass; verify production JWT behavior and RLS against Supabase before claiming tenant isolation |

| API route guard audit — additional role dashboards | Added `requireAuth` to livestock collection and analysis endpoints, veterinarian dashboard endpoints, and farmer/agronomist/trader/government dashboard mounts | Server-side role checks are now implemented for farmer, agronomist/expert, trader, veterinarian and inspector dashboards. Current dashboard handlers intentionally return 503 |

| Server-side role authorization | Added `requireRole()` backed by the trusted `public.users.role` row; protected farmer, agronomist/expert, trader, veterinarian, inspector and comprehensive farm-management dashboards; platform admins are explicitly allowed | Unit tests added for allowed role, admin, wrong role, missing role, and demo identity. The pending RLS hardening SQL explicitly creates new accounts as farmer and blocks self-service role escalation; verify this migration is applied on the live Supabase project and run the tests in CI. Government role remains unresolved because it is absent from the app's declared `UserRole` type; its dashboard remains fail-closed and identity-protected only. |
| Investor API identity guard | Added `requireAuth` to all six `/api/investor/*` routes, including portfolio and investment submission | Investor role is not yet part of the declared account-role contract; handlers remain fail-closed with 503. Define trusted role provisioning and real persistence before enabling any investor operation. |
| Supabase RPC and scheduler hardening | Updated `get_user_farms` and `user_owns_farm` to bind the requested user to `auth.uid()`; revoked anonymous execution from identity-bound RPCs; restricted the AI webhook RPC to `service_role`; enabled RLS and revoked browser access on `scheduled_tasks` | Added `database/verify-security-hardening.sql` to assert RLS, table grants, RPC execution grants and caller-bound identity. SQL has been committed but is NOT confirmed applied to the live Supabase project; run the migration then the verification script. |
| Trusted assistant turn persistence | The public chat endpoint now persists user turns through the caller-scoped JWT client and server-generated assistant replies through the server-only Supabase service-role client, after verifying conversation ownership. The browser cannot submit assistant role/provenance; conversation read/write routes require verified JWTs. | Requires `SUPABASE_SERVICE_ROLE_KEY` and `database/autonomous-farm-agent.sql` on the live Supabase project. The API reports `historyPersisted=false` when the server cannot confirm both records; no browser-side claim is trusted. Action-result messages from separate farm actions still need their own server-side persistence path. |
| Legacy Smart Advisor demo retirement | Removed hard-coded Saudi farm, market, weather, soil and investment data and disabled fake generate/accept/reject/analytics operations. Legacy endpoints now require a verified session and return an explicit 410 replacement notice. | The active UI route already redirects to `/ai-assistant`; this change prevents stale clients from seeing fabricated values. |
| Admin bootstrap reliability | Fixed email validation, applied the supplied password when promoting an existing Supabase Auth identity, and rate-limited the operator-only bootstrap endpoint. | The operator must set Render secrets and execute the documented PowerShell request. No admin account can be created from this GitHub session because Render/Supabase secrets are not accessible here. |
| Assistant conversation provenance boundary | Public conversation endpoint now accepts only `role=user`; client-supplied `modelSource`, `dataSource` and metadata are ignored. The RLS insert policy also requires `role='user'`, so a browser cannot forge assistant answers or claim a model generated them | Added a unit test rejecting forged assistant messages and extended the SQL verification script to assert the RLS policy. Server-side AI response persistence still needs a trusted workflow before assistant messages can be written. |
| Persisted farm, field and finance API authorization | Added trusted `requireVerifiedAuth` middleware; restricted farms, fields, crop history, field performance and crop recommendations plus expense/revenue/profitability APIs to farmer/admin roles; notification CRUD now requires a verified Supabase JWT instead of the development demo identity | Unit tests cover verified JWT acceptance and demo rejection. Tenant ownership still depends on applying and verifying the Supabase RLS migrations in the live project. |
| Evidence-backed crop recommendations | Removed the browser-provided soil measurements from crop recommendation decisions. The endpoint now reads the latest persisted soil analysis for the owned field and returns `409 PERSISTED_SOIL_DATA_REQUIRED` when no persisted analysis exists | Rule-based agronomic scoring remains rule-based, not a trained ML model. Crop suitability must not be described as measured yield or profitability. |
| Financial ledger database grants | Explicitly revoked `PUBLIC` and `anon` access to expense/revenue tables; added SQL verification for RLS state, browser grants, authenticated CRUD grants and owner/farm-bound policies | Migration and verifier are committed; live database execution is still pending. |
| Finance input validation hardening | Expense/revenue dates now require real ISO calendar dates; expense/revenue farm references are UUID-validated; revenue update validates quantity, unit price, harvest date and storage days; accepted currency is normalized to TND. | Added unit coverage for calendar dates, malformed farm IDs and TND/user binding. Run full CI to confirm. Existing historical multi-currency rows still need a deliberate migration/reporting policy. |
| Finance calculation integrity | Expense/revenue CRUD is now guarded by the farmer/admin role; the finance API accepts TND only for the current Tunisia-first launch and no longer accepts a client `netRevenue` as gross sale amount (which would have subtracted sale costs twice) | Existing historical rows in other currencies need a separate migration/reporting treatment before multi-currency support. Financial summaries currently remain simple totals over the stored ledger. |
| Equipment persistence and CRUD | Added `farm_equipment` table migration with farm-owner RLS, creator identity binding, TND validation, indexes, and authenticated CRUD API at `/api/farm-operations/equipment` | API is implemented in source and guarded by verified Supabase JWT + farmer/admin role. Migration must be applied to Supabase; no live database CRUD proof yet. |
| Farm task persistence and CRUD | Added `farm_tasks` migration and list/create/update/delete API at `/api/farm-operations/tasks`; validates dates, task types, priorities, status transitions, creator identity and self-assignment only | Unit tests cover validation and anti-spoofing. No team-membership model exists, so assigning tasks to another account is intentionally blocked. |
| Finance tenant boundary | Tightened expense/revenue RLS so a row with a non-null `farm_id` can only reference a farm owned by the authenticated user; corrected SQL verifier policy names and assertions | Apply the canonical finance migration and run `database/verify-security-hardening.sql` against the live project. |
| Farm operations security verification | Extended SQL verifier to check RLS, anon denial, authenticated CRUD grants, farm ownership and creator identity on equipment/tasks | SQL source reviewed; actual Postgres execution and cross-user tests remain external proof requirements. |
| Equipment/task management UI | Added a bilingual Arabic/English manager inside the comprehensive farm-management unavailable state. It loads the caller's farms, supports creating a first farm, and provides create/edit/delete forms for equipment and tasks through the authenticated APIs | UI source committed; browser flow, mobile/RTL visual checks and live Supabase integration remain pending. It does not claim dashboard analytics are connected. |
| Administrator provisioning and login runbook | Added `docs/ADMIN_ACCOUNT_SETUP.md` with Render secret configuration, PowerShell bootstrap request, normal Supabase login and Admin Panel path, response troubleshooting and secret-handling rules | Existing Auth identities are now explicitly assigned the supplied bootstrap password when promoted, avoiding a mismatch between the submitted password and the account's real password. The bootstrap endpoint is rate-limited. No credentials are committed. |
| Administrator account bootstrap | Confirmed that development-only demo credentials are shown only under `import.meta.env.DEV`; production admin is created through token-guarded `POST /api/setup-admin`, which requires Supabase service-role configuration, an email, and a password of at least 12 characters, then persists `public.users.role = admin`. No production admin email/password is hard-coded or recoverable from repository source. | Route is implemented; production provisioning requires the operator's private `ADMIN_API_TOKEN` and Supabase environment. Never expose the service-role key or admin token to the browser. |
| CI repair follow-up | Fixed RLS fixture profile seeding to be idempotent, corrected the admin maintenance endpoint test status, fixed notification interval typing, and updated admin provisioning semantics. | Latest verified run: Database RLS, Build, Security Scan, AI Services and Docker Build passed. Code Quality failed earlier on the notification interval type (now fixed in source). Node 20/22 test jobs still report legacy integration expectations failing because several tests send no verified JWT or expect simulated/unavailable services to behave as live. Re-run CI and resolve test expectations without weakening production auth or restoring fabricated data. |


| Admin user detail integrity | Replaced placeholder login-count, phone-verification and 2FA indicators with truthful availability states; the dialog now displays only account ID, persisted creation/last-login timestamps and the stored email-verification flag, with invalid/missing timestamps handled safely | Session analytics, phone verification and 2FA remain unconnected and are explicitly disclosed. No production UI test or build has been run in this source-only update. |


| Admin password recovery | Added an admin-only password reset email endpoint and a Send password reset email action in the user details dialog. The endpoint requires a verified administrator JWT, uses Supabase Auth resetPasswordForEmail, and appends user.password_reset.requested to the append-only admin audit log. Added an integration test for anonymous/demo rejection and documented the required Auth Site URL and SMTP configuration. | Not tested against live Supabase/SMTP; no production email delivery claim. CI/build/Jest status remains unverified for this batch. |

| Password recovery abuse control | Added dedicated per-IP limiter to the administrator password reset route (default 5 requests/hour; configurable with ADMIN_PASSWORD_RESET_MAX_REQUESTS) before admin authorization and the recovery handler. | In-memory limiter is per application instance; use a shared rate-limit store if the API is scaled horizontally. Verify actual SMTP delivery and configured Supabase Site URL in production. |
