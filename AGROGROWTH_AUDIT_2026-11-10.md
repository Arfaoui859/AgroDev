# AgroGrowth — Comprehensive Services & Frontend Audit

**Audit date:** 2026-11-10  
**Repository:** `Arfaoui859/AgroDev`  
**Branch:** `feat/ai-integration-production-hardening`  
**Code baseline reviewed:** `c2c315bd9d1c8a60894606625fe6554f0dc589bc`  
**Audit mode:** Repository/code inspection plus targeted implementation changes. No live Render or Supabase verification was possible in this pass.

## 1. Executive summary

AgroGrowth has eight FastAPI service implementations, a Node/Express gateway, a React frontend, and a real laboratory-assisted soil ML model package. However, the platform is **not yet an all-real-AI production system**:

- The ordinary soil screen is deterministic rules. Seven actual ML artifacts exist, but they are scoped to laboratory-assisted inference and are not field- or Tunisia-validated.
- Crop, market, pest, irrigation, and weather/yield numeric engines still declare synthetic/demo provenance.
- Image leaf screening is heuristic; disease diagnosis can use a configured multimodal vision provider, but accuracy on a labelled agricultural dataset has not been demonstrated.
- Intelligent Agent behaviour depends on an actually configured LLM provider.
- Multiple frontend modules are still illustrative/demo workflows rather than persisted operational workflows.
- The effectiveness report page's seeded history was removed; authenticated persistence endpoints and an RLS migration now exist, pending application to the live Supabase project.
- The Admin Panel was found to be returning 50 randomly generated users and fabricated metrics. This pass replaced those handlers with database-backed user records and honest unavailable states for data sources that do not exist.

The most important rule remains: **HTTP 200 / healthy means reachable, not model-powered, accurate, or production-validated.**

## 2. AI microservices — code-level status

The following ports were cross-checked against `docker-compose.yml`, the service Dockerfiles, and `tests/integration/microservice-inventory.test.ts`.

| Service | Port | Actual engine/provenance | Status / blocker |
|---|---:|---|---|
| Soil Analysis | 8001 | Deterministic rules for normal sensor analysis; 7 separate lab-assisted ML regressors | ML scope is lab-only; complete feature panel required; no Tunisia/field validation |
| Crop Recommendation | 8002 | `synthetic-demo` recommender; deterministic profit estimator | No verified Tunisian field-trained crop model |
| Image Diagnosis | 8003 | Heuristic leaf/health analysis; optional multimodal vision provider | No proof of agronomic accuracy on labelled leaf dataset |
| Market Prediction | 8004 | `synthetic-demo` | No licensed live market-price feed |
| Intelligent Agent | 8005 | Configured LLM provider when available | Provider credentials/model must be verified in the deployed environment |
| Weather / Yield Intelligence | 8006 | `synthetic-demo` numeric yield/planning model | Real Open-Meteo weather is a separate provider; yield estimates remain synthetic |
| Pest Control | 8007 | `synthetic-demo` numeric engine; optional LLM advisory | Not validated against Tunisian pest observations |
| Irrigation Optimization | 8008 | `synthetic-demo` numeric engine; optional LLM advisory | Not validated against measured field water use |

### 2.1 Soil ML — verified artifacts and limitations

Seven committed model artifacts exist in `agrogrowth-ai/soil_analysis/models/production/`:

| Target | Estimator | Spatial OOF R² | MAE | RMSE |
|---|---|---:|---:|---:|
| pH | Random Forest | 0.527 | 0.238 | 0.302 |
| Organic carbon | Random Forest | 0.865 | 1.594 | 4.019 |
| Total nitrogen | Extra Trees | 0.832 | 0.106 | 0.152 |
| Electrical conductivity | Random Forest | 0.469 | 0.134 | 0.172 |
| Extractable phosphorus | Extra Trees | 0.337 | 2.339 | 3.771 |
| Extractable potassium | Extra Trees | 0.627 | 25.425 | 37.044 |
| Extractable zinc | HistGradientBoosting | 0.448 | 0.222 | 0.286 |

Source report: `models/production/training_report.json`.

- Dataset: AFSIS wetchem reference data.
- Original rows: 2,157; after 0–20 cm depth filtering: 2,134.
- Synthetic data used: false.
- Evaluation: five-fold GroupKFold with a 0.25-degree spatial grid.
- No spatial exclusion buffer.
- The report explicitly marks all seven targets `field_validated: false` and `tunisia_validated: false`.
- Prediction scope is `lab_assisted_only`.

**Corrected inference defect:** the previous inference code accepted 80% feature coverage but passed missing values to tree estimators without a validated imputation pipeline. This could fail at prediction time or produce unsupported behaviour. The service now requires 100% feature coverage; partial lab panels return `insufficient_input`. Regression tests were added using mocked regressors so tests do not load the large production artifacts or claim model accuracy.

The ordinary `POST /analyze-soil` endpoint still uses deterministic rules. It does not call these seven regressors. Soil-image diagnosis remains deterministic visual inspection, not a trained soil-image classifier.

### 2.2 Model provenance correction

The gateway now distinguishes:
- non-ML engines (heuristic, deterministic, rule-based);
- synthetic/demo-trained model outputs; and
- a declared configured model/provider.

A deterministic rule engine is not incorrectly counted as a model trained on synthetic data. A model/provider being configured is still not evidence of agronomic validation.

### 2.3 Input integrity hardening

A second pass removed silent example-input substitution from the crop, weather/yield,
irrigation and pest microservice request models:
- Crop recommendations require the farm/soil/weather/market inputs that affect
  the numeric ranking. The Node gateway checks every required field and uses
  its labelled local rule-based fallback when values are missing.
- Weather/yield no longer assumes a default Tunisia coordinate, weather profile,
  soil profile, crop or farm size.
- Irrigation no longer assumes a wheat crop, vegetative stage, one-hectare farm,
  default weather or default soil moisture.
- Pest assessment no longer assumes tomato, 20% affected area, plant age,
  plant-health score or default weather when those values are not supplied.

Regression tests were added to require 422 responses for empty requests and to
exercise complete input payloads. These changes prevent fabricated input values;
they do **not** change the numeric engines' current `synthetic-demo` provenance
or prove agronomic accuracy.

## 3. Gateway and service monitoring

### Defects corrected

1. The health failure fallback previously listed only five services and hardcoded the total as five. It now returns all eight service keys and reports eight unavailable when the health check itself fails.
2. The frontend service monitor previously probed individual capability inference paths with `GET`, even though those paths were not health endpoints. It now reads the authoritative `/api/ai/health` aggregate response and maps capability cards to the corresponding real service keys.
3. Repeated dashboard cards previously triggered duplicate calls to the same gateway health endpoint. The frontend now shares an in-flight health request and a short cache.
4. The status dashboard now carries and displays `modelSource`, `isRealModel`, and `modelTrainedOnSyntheticData`.
5. The cloud status page previously interpreted nested objects from the current health response as status strings. It now renders the actual overview, service list, LLM configuration and provenance.
6. Health status cache duration was reduced from five minutes to 30 seconds.

### Live status limitation

The deployed URLs could not be queried from this audit environment. No claim is made that all eight Render services are currently running. Live status must be confirmed through the deployed `GET /api/ai/health` endpoint after deployment.

## 4. Frontend audit

### 4.1 Changes made in this pass

| Area | Change |
|---|---|
| Admin Panel | Removed 50 randomly generated users and all random/mock admin metrics from server/routes/admin-panel.ts |
| Admin Panel | Dashboard and user list now query public.users with exact counts, pagination and database provenance |
| Admin Panel | Role/status updates now persist through PATCH /api/admin/users/:userId and admin RLS; last-admin/self-lockout protections added |
| Admin Panel | Create/delete actions now use Supabase Auth Admin API and are explicitly disabled when the server-side secret is absent |
| Admin Panel | Added user creation dialog, role editor, suspend/activate, delete confirmation, pagination and visible API errors |
| Admin Panel | Added verified current-user profile endpoint so the frontend hydrates roles from public.users rather than trusting user_metadata.role |
| Admin Panel | Added admin_activity_logs migration and audit events for create/update/delete; security/subscription data stays unavailable unless a real table exists |
| Admin Panel | Removed the generic simulated-data banner; missing CPU, disk, revenue and subscription metrics render as unavailable instead of fabricated zeroes |
| Effectiveness Reports | Removed seeded mock reports and hardcoded chart series |
| Effectiveness Reports | Added validation for product/date/before-after scores |
| Effectiveness Reports | Cost and farm area are optional user-entered values; no invented weather, yield, pest or nutrient values |
| Effectiveness Reports | Displays empty states instead of zero/false averages when no actual reports exist |
| Effectiveness Reports | Added CSV export of actual assessments |
| Effectiveness Reports | Clearly discloses that the score is rule-based; authenticated per-user persistence code and RLS migration are now present |
| AI Intelligence Dashboard | Changed its disclosure from market-price wording to simulated-record wording |
| Service Status | Uses the aggregate gateway health and shows each model's declared provenance |
| Cloud Services Status | Displays the real eight-service response shape and no longer says all services are in mock mode |
| Intelligent Breeding | Removed a random 60–100% genetic compatibility score and replaced it with an explicit unavailable message until a validated pedigree/genomic engine exists |

### 4.2 Demo-backed workflows still not production integrations

These screens still contain hardcoded, simulated, or locally generated records. Several already show provenance banners, but that does not make them live database workflows:

- `FieldManagement`: in-memory farms, fields, crop history and alerts.
- `NotificationCenter`: simulated sensors and random readings/notifications.
- `MarketIntelligence`: fixed demonstration intelligence payload.
- `RevenueAnalysis`: revenue list can call the API, but market-price fallback remains mock data.
- `SoilAlertSystem`: fixed sample alerts and local notification settings; no proven live soil-sensor stream.
- `CropDetails`: hardcoded crop detail catalogue.
- `TreatmentSchedule`: in-memory sample schedule and weather.
- `AIIntelligenceDashboard`: sample recommendations, insights, predictive models and agent cards.
- `LivestockDiseasePredictor`: sample risk assessments and predictions.
- `SmartFeedManager`: demonstration fallback for nutritional requirements and optimization.
- `IntelligentBreedingManager`: pairing recommendations depend on API data; genetic compatibility model is not connected.
- `LivestockProductionAnalytics`: locally generated demonstration production records.

These screens are visibly disclosed as illustrative in the current frontend. They must be connected to authenticated, persisted records and real domain services before being described as completed operational modules.

### 4.3 Effectiveness report persistence

Authenticated GET/POST endpoints load and save reports per verified user. The
migration `database/effectiveness-reports.sql` creates the table and RLS policies.
The page sends the user's access token; the API requires a verified JWT and
checks caller identity before writing.

**Still required:** apply the migration in the live Supabase project, configure
the server-side secret, and verify live reads/writes after deployment.

## 5. Authentication / Admin items still requiring live configuration

The earlier browser/Render logs showed:
- `SUPABASE_SERVICE_ROLE_KEY is not configured` on the server;
- Admin endpoints returning 403/503;
- Supabase password-token requests returning 400;
- Auth user requests returning 403; and
- profile table reads returning 406.

Code changes in the current branch:
- Auth state subscription is established before session initialization.
- Profile reads use `maybeSingle()` where a missing row is a valid state.
- Admin role verification requires the elevated server-side Supabase client and no longer silently substitutes the anon key.
- Login responses containing bearer/refresh tokens are no longer logged.

Still unverified:
- Correct server-side Supabase secret/service-role key is present in Render and belongs to the same project as `SUPABASE_URL`.
- The 400 password-grant response body; invalid credentials, disabled user, or auth configuration still need the actual response reason.
- Live Admin login and protected endpoint access after deployment.

Never put the Supabase secret in a `VITE_` variable or expose it in browser code.

## 5.1 Admin Panel — code-level correction in this pass

The original `server/routes/admin-panel.ts` generated 50 random users on every
request and returned random analytics, security events, subscriptions and system
metrics. This made the admin user list unrelated to Supabase and made CRUD
buttons misleading. Those generators were removed from the active route module.

Current implementation:
- `GET /api/admin/users` returns paginated real `public.users` rows.
- `GET /api/admin/overview` and usage analytics derive counts from database
  queries; revenue, subscriptions, support and security counts are `null` when
  there is no verified source.
- `PATCH /api/admin/users/:userId` persists role/status changes and protects
  the current admin and last administrator from lockout.
- `POST /api/admin/users` and `DELETE /api/admin/users/:userId` use Supabase
  Auth Admin APIs and require a server-side service secret.
- `database/admin-user-management.sql` adds account status fields, admin RLS
  access and an audit table for admin CRUD events.
- `GET /api/auth/me` hydrates the app role from the verified database profile;
  user metadata is not accepted as proof of an admin role.

**Live dependency:** apply `database/admin-user-management.sql` after
`database/rls-hardening.sql`. If the server-side service key is absent, listing
and role/status updates can use the verified JWT + admin RLS policy; account
creation/deletion remain disabled until `SUPABASE_SERVICE_ROLE_KEY` is set.
The migration and CI regression test have been added but not yet confirmed on
the live Supabase project.

## 6. Historical reports and test baseline

The repository contains prior engineering reports dated 2026-11-04 and a soil training report dated 2026-11-07. The older `AI_INTEGRATION_DIAGNOSTIC_REPORT.md` is explicitly historical/superseded. Do not use its February 2025 claims as the current service state.

The latest historical production-readiness report records (on its audit date):
- TypeScript PASS;
- Jest 575 passed, 2 skipped;
- Python pytest 194 passed;
- lint PASS;
- production dependency audit 0 vulnerabilities;
- build PASS;
- eight AI service health checks PASS in that local audit environment.

**Those results predate the changes in this 2026-11-10 audit and were not rerun here.** The new soil regression tests and frontend changes must be validated in CI before production deployment.

## 7. Current blockers / next engineering work

Priority order:

1. Run TypeScript, lint, full Jest, Python pytest, build and targeted service smoke tests on this exact branch.
2. Deploy the branch to Render and verify `/api/ai/health` reports all eight actual service states and correct provenance.
3. Apply `database/admin-user-management.sql` in Supabase and verify Admin login, full user list, role/status updates and admin audit logging.
4. Set and verify the server-side Supabase secret/service-role key to enable account creation/deletion and test both actions.
5. Capture the actual Supabase Auth 400 response reason without sharing secrets or tokens.
6. Apply `database/effectiveness-reports.sql` in Supabase, set the server-side
   secret key, and verify per-user effectiveness report reads/writes.
7. Connect the demo-backed frontend workflows listed in §4.2 to authenticated database/API sources, or keep them clearly marked as demo-only.
8. Obtain a licensed/live Tunisian market-price source and build leakage-safe, time-based market forecasting evaluation.
9. Collect Tunisian field soil samples and labelled crop/leaf/pest datasets; run external validation before promoting any model as field-ready.
10. Review model artifact footprint and Render memory limits; the seven soil artifacts are large and loaded sequentially to limit peak memory.

## 8. Verification status

| Area | Status |
|---|---|
| Repository code review | Completed for eight service entrypoints, gateway, service status, selected frontend reports and provenance files |
| Targeted code fixes | Committed to the audit branch |
| Soil model artifacts/report | Inspected; no retraining performed |
| New soil regression tests | Added; GitHub Actions runs queued at audit time |
| AI input-integrity regression tests | Added for crop, weather/yield, irrigation and pest; CI not yet completed |
| Admin CRUD + RLS regression | Added; GitHub Actions runs queued at audit time |
| TypeScript/Jest/pytest/lint/build after changes | Awaiting GitHub Actions CI; not yet passed |
| Render live service health | Not verified |
| Supabase live schema/RLS/Admin login | Not verified; admin migration must be applied |
| Production deployment | Not performed |

**Conclusion:** the platform has a meaningful working foundation, including real soil lab-assisted ML artifacts and provider integration paths, but it is not honest to call all eight services fully trained or all frontend workflows production-complete. The source-of-truth status file is `AI_SERVICES_STATUS.md`; this report records the code-level audit and the remaining blockers.
