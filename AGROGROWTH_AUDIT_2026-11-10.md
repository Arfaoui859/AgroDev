# AgroGrowth — Comprehensive Services & Frontend Audit

**Audit date:** 2026-11-10  
**Repository:** `Arfaoui859/AgroDev`  
**Branch:** `feat/ai-integration-production-hardening`  
**Code baseline reviewed:** `e58f4feea4d343fafc0a14c5e01f5fa4ec51c4c5`  
**Audit mode:** Repository/code inspection plus targeted implementation changes. No live Render or Supabase verification was possible in this pass.

## 1. Executive summary

AgroGrowth has eight FastAPI service implementations, a Node/Express gateway, a React frontend, and a real laboratory-assisted soil ML model package. However, the platform is **not yet an all-real-AI production system**:

- The ordinary soil screen is deterministic rules. Seven actual ML artifacts exist, but they are scoped to laboratory-assisted inference and are not field- or Tunisia-validated.
- Crop, market, pest, irrigation, and weather/yield numeric engines still declare synthetic/demo provenance.
- Image leaf screening is heuristic; disease diagnosis can use a configured multimodal vision provider, but accuracy on a labelled agricultural dataset has not been demonstrated.
- Intelligent Agent behaviour depends on an actually configured LLM provider.
- Multiple frontend modules are still illustrative/demo workflows rather than persisted operational workflows.
- The effectiveness report page had seeded historical examples and static chart data; these were removed. It currently computes rule-based assessments from user-entered measurements and keeps them only in page memory.

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
| Effectiveness Reports | Removed seeded mock reports and hardcoded chart series |
| Effectiveness Reports | Added validation for product/date/before-after scores |
| Effectiveness Reports | Cost and farm area are optional user-entered values; no invented weather, yield, pest or nutrient values |
| Effectiveness Reports | Displays empty states instead of zero/false averages when no actual reports exist |
| Effectiveness Reports | Added CSV export of actual assessments |
| Effectiveness Reports | Clearly discloses that the score is rule-based and the records are session-only, not persisted to Supabase |
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

Authenticated GET/POST endpoints now load and save reports per verified user using
the server-side Supabase client. The migration `database/effectiveness-reports.sql`
creates the table and RLS policies. The page loads saved reports and sends the
user's access token; the API requires a verified JWT and writes through the
server-side elevated client only after checking the caller identity. CI now
applies this migration and runs a tenant-isolation SQL verification script.

**Still required:** apply that SQL file in the correct Supabase project and ensure
`SUPABASE_SERVICE_ROLE_KEY` is configured server-side. Until both are done, the
API intentionally returns a clear 503 and the page displays the persistence error.

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
3. Set and verify the server-side Supabase secret/service-role key; retest Admin login and role verification.
4. Capture the actual Supabase Auth 400 response reason without sharing secrets or tokens.
5. Apply `database/effectiveness-reports.sql` in Supabase, set the server-side
   secret key, and verify per-user effectiveness report reads/writes.
6. Connect the demo-backed frontend workflows listed in §4.2 to authenticated database/API sources, or keep them clearly marked as demo-only.
7. Obtain a licensed/live Tunisian market-price source and build leakage-safe, time-based market forecasting evaluation.
8. Collect Tunisian field soil samples and labelled crop/leaf/pest datasets; run external validation before promoting any model as field-ready.
9. Review model artifact footprint and Render memory limits; the seven soil artifacts are large and loaded sequentially to limit peak memory.

## 8. Verification status

| Area | Status |
|---|---|
| Repository code review | Completed for eight service entrypoints, gateway, service status, selected frontend reports and provenance files |
| Targeted code fixes | Committed to the audit branch |
| Soil model artifacts/report | Inspected; no retraining performed |
| New soil regression tests | Added; current GitHub Actions CI run is queued |
| TypeScript/Jest/pytest/lint/build after changes | Awaiting GitHub Actions CI; not yet passed |
| Render live service health | Not verified |
| Supabase live schema/RLS/Admin login | Not verified |
| Production deployment | Not performed |

**Conclusion:** the platform has a meaningful working foundation, including real soil lab-assisted ML artifacts and provider integration paths, but it is not honest to call all eight services fully trained or all frontend workflows production-complete. The source-of-truth status file is `AI_SERVICES_STATUS.md`; this report records the code-level audit and the remaining blockers.
