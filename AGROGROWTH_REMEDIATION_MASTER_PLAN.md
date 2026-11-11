# AgroGrowth — Master Remediation Register

**Updated:** 2026-11-11  
**Repository:** `Arfaoui859/AgroDev`  
**Working branch:** `fix/agrogrowth-ci-and-production-gaps-2026-11-11`  
**Baseline:** `feat/ai-integration-production-hardening`  
**Purpose:** One source of truth for code fixes, validation, external dependencies, and production blockers. This register deliberately distinguishes code present from live-verified behaviour.

## Status legend

- `DONE-CODE`: code change committed; still subject to CI/live verification where noted.
- `IN-PROGRESS`: implementation or validation has started.
- `BLOCKED-ACCESS`: requires access to an external project/account/secret that is not available in this repository session.
- `BLOCKED-DATA`: requires real licensed or labelled domain data; do not replace with synthetic data and claim real-world validation.
- `NOT-STARTED`: no verified implementation in this remediation pass.
- `KEEP-DISCLOSED`: feature may remain usable as a demo, but its UI/API must continue to identify demo, heuristic, deterministic, or AI-advisory provenance.

## A. CI and engineering baseline

| ID | Work | Status | Acceptance evidence |
|---|---|---|---|
| A1 | Repair malformed imports in AdvancedLivestockDashboard | DONE-CODE | TypeScript build job |
| A2 | Correct EffectivenessReports score input state types | DONE-CODE | `npx tsc --noEmit` |
| A3 | Correct HealthAlert deduplication to use declared `alertType` and `message` fields | DONE-CODE | `npx tsc --noEmit` + livestock tests |
| A4 | Remove invalid empty Pydantic LocationData defaults from Weather/Yield endpoints | DONE-CODE | Python import/pytest collection |
| A5 | Fix crop gateway contract fixture to supply all required fields | DONE-CODE | Node integration test |
| A6 | Ensure no-provider Soil Detailed endpoints return explicit unavailable response | DONE-CODE | Node integration tests |
| A7 | Distinguish LLM-generated advisory from verified soil measurements in provenance | DONE-CODE | Provenance integration test |
| A8 | Remove RLS policy references to non-existent `public.weather_data` | DONE-CODE | PostgreSQL RLS CI job |
| A9 | Run full CI on the exact latest branch HEAD | IN-PROGRESS | All required GitHub Actions jobs green on one SHA |
| A10 | Resolve any remaining TypeScript, lint, Jest, Python, SQL, Docker or build failures | IN-PROGRESS | No failed CI jobs |
| A11 | Run targeted HTTP smoke tests for all eight FastAPI services | NOT-STARTED | Recorded request/response evidence and correct provenance |
| A12 | Pin/upgrade deprecated or vulnerable packages after compatibility review | NOT-STARTED | Lockfile diff, tests, npm audit report |

**CI history note:** the first run on commit `bd272c0` passed Node 20/22 tests, build, database RLS, Docker and security scan, but failed Code Quality and AI Services. The logs identified two further TypeScript issues (EffectivenessReports state values and HealthAlert property names) and one remaining invalid `LocationData()` default in `optimize_planting_schedule`. These were corrected in subsequent commits. The latest commit at the time of this register is `b86c5d9`; its CI was queued and must be checked before declaring the branch green.

## B. Authentication, authorization and database

| ID | Work | Status | Acceptance evidence |
|---|---|---|---|
| B1 | Verify Supabase URL and server service-role key refer to the same project | BLOCKED-ACCESS | Render env review without exposing secret |
| B2 | Apply `database/rls-hardening.sql` to live Supabase | BLOCKED-ACCESS | Migration result and RLS SQL verification |
| B3 | Apply `database/admin-user-management.sql` | BLOCKED-ACCESS | Migration result and admin CRUD verification |
| B4 | Apply `database/effectiveness-reports.sql` | BLOCKED-ACCESS | Migration result and per-user RLS verification |
| B5 | Test login and capture safe explanation for Supabase Auth HTTP 400 | BLOCKED-ACCESS | Redacted response body/status; never log tokens |
| B6 | Verify `/api/auth/me` returns role from trusted DB profile | BLOCKED-ACCESS | Authenticated integration against live Supabase |
| B7 | Verify admin list, pagination, role/status updates, last-admin protection | BLOCKED-ACCESS | Admin account acceptance test |
| B8 | Verify Auth Admin create/delete and audit events | BLOCKED-ACCESS | Service-role enabled test, no browser exposure |
| B9 | Verify tenant isolation for farm, field, sensor, soil, livestock and report records | IN-PROGRESS | Local PostgreSQL CI plus live Supabase test |
| B10 | Check every RLS-enabled table has least-privilege policies and indexes | NOT-STARTED | Schema inventory and policy review |

**Security constraint:** never put `SUPABASE_SERVICE_ROLE_KEY` in a `VITE_*` variable or client bundle. Do not ask the user to paste secrets into chat.

## C. AI service truthfulness and model readiness

| Service | Current declared engine/provenance | Required work | Status |
|---|---|---|---|
| Soil Analysis (8001) | Deterministic rules for ordinary sensor analysis; seven separate lab-assisted ML regressors | Keep lab-only scope; validate against Tunisian field samples; add image classifier only with labelled dataset | BLOCKED-DATA |
| Crop Recommendation (8002) | Synthetic-demo recommender; deterministic financial rules | Acquire real regional crop/soil/weather/yield/cost data; train and spatial/temporal validate | BLOCKED-DATA |
| Image Diagnosis (8003) | Heuristic visual checks; optional multimodal vision advisory | Label local crop/disease images; evaluate per-class precision/recall and calibration; do not present LLM output as validated diagnosis | BLOCKED-DATA |
| Market Prediction (8004) | Synthetic-demo | Obtain licensed daily/weekly Tunisian market prices, supply volumes and seasonality; leakage-safe backtesting | BLOCKED-DATA |
| Intelligent Agent (8005) | LLM provider when configured | Verify deployed provider/model, timeouts, fallback, source citations and action permissions | IN-PROGRESS |
| Weather/Yield (8006) | Synthetic-demo yield/planning model; weather is separate provider data | Configure licensed commercial weather endpoint; train/validate yield model on actual farm outcomes | BLOCKED-ACCESS / BLOCKED-DATA |
| Pest Control (8007) | Synthetic-demo numeric engine; optional LLM advisory | Label pest observations by crop/region/stage; evaluate risk model; preserve vet/agronomist review | BLOCKED-DATA |
| Irrigation (8008) | Synthetic-demo numeric engine; optional LLM advisory | Gather measured soil moisture, irrigation volume, evapotranspiration and yield outcomes; validate water savings | BLOCKED-DATA |

### Soil ML evidence that must remain explicit

- Seven AFSIS wet-chemistry lab-assisted artifacts exist in `agrogrowth-ai/soil_analysis/models/production/`.
- The training report records 2,157 source rows and 2,134 after 0–20 cm filtering, with synthetic data marked false.
- Evaluation uses spatial GroupKFold; reported spatial OOF R² values range approximately 0.337–0.865 depending on target.
- The report explicitly marks the artifacts as **not field-validated and not Tunisia-validated** and scopes inference to **lab-assisted only**.
- The ordinary sensor soil endpoint remains deterministic rules; the seven regressors are not automatically proof that every Soil Analysis screen uses ML.
- No retraining was performed in this remediation pass.

### AI acceptance gate for every service

1. Health response reports service reachability separately from model readiness.
2. Every result includes model/provider name, model version, source dataset, training date, evaluation scope and provenance.
3. Synthetic/demo, deterministic, heuristic, external provider and validated ML outputs remain distinct.
4. Missing input/provider returns a clear validation/unavailable response; never invent coordinates, measurements, prices, weather or yield.
5. Numeric models require held-out temporal/spatial evaluation, baseline comparison, per-region/per-class metrics, calibration/error bounds and drift monitoring.
6. User-facing claims must not exceed demonstrated evaluation scope.

## D. Frontend workflows — code status versus live operational status

The earlier audit grouped these screens as demo-backed. Subsequent repository
work already added simulated-data disclosures to fixture-driven pages, removed
random genetic compatibility output, replaced seeded effectiveness-report
history with authenticated API persistence, and corrected the service/cloud
status response mapping. This table separates those code changes from live
database/provider verification.

| ID | Screen/workflow | Verified code status | Remaining acceptance work |
|---|---|---|---|
| D1 | FieldManagement | Demo fixtures disclosed with shared simulated-data notice | Replace fixture workflows with authenticated farm/field CRUD and verify ownership/RLS |
| D2 | NotificationCenter | Static mock snapshot is visibly labelled; random live-like sensor jitter and fake alert generation removed | Connect persistent per-user notifications and real sensor/event ingestion before enabling live monitoring |
| D3 | MarketIntelligence | Demo data is disclosed; market API provenance distinguishes simulated from database data | Licensed price feed, populated trusted data, timestamps/geography and stale-data handling |
| D4 | RevenueAnalysis | Demo/fixture data must remain labelled | Persisted transactions, trusted price source and verified calculations |
| D5 | SoilAlertSystem | Demo/fixture data must remain labelled | Real soil observations, threshold rules, alert lifecycle and user preferences |
| D6 | CropDetails | Simulated-data notice is present | Authoritative crop catalogue, source citations and localized agronomic references |
| D7 | TreatmentSchedule | Simulated-data notice is present | Persisted plans, crop stage, weather context, reminders and audit history |
| D8 | AIIntelligenceDashboard | Service status now reads actual health/provenance contract | Verify deployed health values, freshness, unavailable states and user-facing claims |
| D9 | LivestockDiseasePredictor | Animal API integration exists; risk data still needs provenance validation | Persisted animal health records, evaluated risk model and veterinarian review |
| D10 | SmartFeedManager | Animal API integration exists; demo nutrition path remains | Verified feed composition/nutrient tables, animal stage and price source |
| D11 | IntelligentBreedingManager | Random compatibility percentage removed; unavailable state is explicit | Pedigree/genomic source and validated breeding logic |
| D12 | LivestockProductionAnalytics | Animal API exists; generated production history remains demo data | Persisted production records and transparent aggregation |
| D13 | EffectivenessReports | Seeded history removed; authenticated GET/POST persistence code and SQL migration exist | Apply migration and verify per-user reads/writes against live Supabase |
| D14 | Admin Panel | Random mock user list replaced with DB-backed user operations and fail-closed unavailable states | Verify CRUD, roles, audit log and authorization against live Supabase |
| D15 | Service Status / Cloud Status | API response mapping corrected to actual aggregate health/provenance shape | Verify deployed services and model provenance on Render |
| D16 | All role dashboards | Shared provenance framework and auth guards exist | Validate farmer, agronomist, trader, vet, inspector, institution and admin permissions against live tenant data |


## E. Product quality, localization and operations

| ID | Work | Status |
|---|---|---|
| E1 | Arabic-first RTL audit across every route and dialog | NOT-STARTED |
| E2 | French and English translation coverage for all workflows | NOT-STARTED |
| E3 | Accessibility: keyboard navigation, labels, contrast, focus and screen-reader semantics | NOT-STARTED |
| E4 | Mobile/tablet responsive audit for farmer field use | NOT-STARTED |
| E5 | Loading, empty, offline, stale-data and provider-unavailable states | IN-PROGRESS |
| E6 | Centralized error tracking with secrets/tokens redacted | NOT-STARTED |
| E7 | Rate limits, retries, circuit breakers and request IDs for all AI proxies | NOT-STARTED |
| E8 | Upload validation, file size/type checks, storage access controls and malware strategy | IN-PROGRESS |
| E9 | Backup/restore and database recovery drill | BLOCKED-ACCESS |
| E10 | Data retention, user export/delete and privacy policy review | NOT-STARTED |
| E11 | Performance budget: bundle size, API latency, Python memory, cold starts | NOT-STARTED |
| E12 | Render deployment verification and rollback procedure | BLOCKED-ACCESS |
| E13 | Verify all eight Render service URLs, health endpoints and environment variables | BLOCKED-ACCESS |
| E14 | Verify commercial Open-Meteo plan/key and historical archive entitlement | BLOCKED-ACCESS |
| E15 | End-to-end tests across signup/login, farm creation, soil analysis, crop recommendation, marketplace and admin | NOT-STARTED |

## F. Explicitly not done in this pass

- No live Supabase migration or production database write.
- No Render environment variable changes or deployment.
- No production branch merge.
- No model retraining and no fabricated dataset.
- No claim that synthetic-demo models are real ML.
- No claim that the latest CI is green until all jobs finish on the exact latest SHA.
- No use of real user/farm data in tests.

## G. Completion definition

AgroGrowth can be called production-ready only when:
- CI is green on the release commit;
- live Supabase migrations and tenant RLS tests pass;
- all eight deployed services are reachable and report truthful model provenance;
- critical workflows persist and read back authenticated records;
- demo-only modules are either integrated or clearly disabled/disclosed;
- AI models pass documented domain-specific validation;
- localization, accessibility, security, backups, monitoring and rollback are verified;
- a production smoke test and owner-approved release checklist are signed off.


## F. Additional security, browser/API and developer-workflow fixes (2026-11-11)

| ID | Finding | Code remediation committed | Remaining verification |
|---|---|---|---|
| F1 | Hardcoded Supabase URL and anon JWT fallback in browser client | Removed; browser requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY and no longer silently connects to a historical project | Confirm correct values are set in each deployment environment |
| F2 | Shared fixed demo credentials and account-provisioning UI/routes | Removed demo credentials from Login; SetupDemo now explains safe signup; retired legacy account-provisioning/debug routes return 410 after token gate; dormant route modules and script deleted | CI and manual staging test |
| F3 | Service-role key accepted as x-admin-token | verifyAdminToken now accepts only ADMIN_API_TOKEN; service-role key remains server-side | CI and rotate any previously exposed service-role key if one was shared |
| F4 | Supabase diagnostic endpoint wrote a probe row to public.users | Retired /api/test/supabase and deleted the old route module | CI and confirm no external automation still calls the retired endpoint |
| F5 | Random market-price seed script could write fabricated values | Removed scripts/seed-database.js; updated database docs to prohibit random market prices | Verify production market_prices contains only trusted sourced records |
| F6 | Browser could call hardcoded public microservice URLs and use local fake soil fallback | useAIServices now routes inference/upload through Node gateway only; removed local mock soil result fallback; CloudServicesStatus reads gateway health once | CI; test provider/service-unavailable UI states in staging |
| F7 | Livestock demo API lacked provenance header at gateway layer | Added /api/livestock-management to simulated provenance middleware | CI provenance-headers test |
| F8 | Local server scripts invoked server/index.ts, which exports an app factory but does not listen; docs confused Vite's integrated Express plugin with standalone server | server/server:dev now start server/node-build.ts; Vite dev remains integrated on 8080, standalone API defaults to 5000; README/AGENTS/quick/free guides and smoke-test default corrected | CI build/type checks and manual local startup |
| F9 | Old AI deployment guide had conflicting service ports and stale Railway instructions | Replaced with verified 8001–8008 inventory and current startup helper commands | CI and review against current Compose/Render manifests |
| F10 | Old cloud/Render/database docs contained unsafe schema snippets, stale project details, and false readiness claims | Replaced with current architecture, secret handling, migration and release gates | Human review before applying any live migration/deployment |
| F11 | NotificationCenter generated random sensor jitter and fake alerts every five seconds | Removed the timer, random telemetry mutation, and random alert generation; replaced the false live-monitoring indicator with a bilingual static-demo disclosure | Connect real sensor ingestion and persistent per-user notifications before enabling live monitoring |
| F12 | Advanced livestock endpoints served static in-memory animal/health/feed records without response headers | Added simulated provenance middleware for /api/animals, /api/animal-health, /api/breeding-recommendations, /api/feed-recommendations, /api/optimize-feed-budget, /api/health-alerts and /api/livestock-dashboard; added integration coverage | CI and connect these routes to authenticated persisted livestock records before presenting them as live |
| F13 | Empty database market responses used zero placeholders and implied real data/forecasts without records | Missing prices/averages/trends now return null/unavailable; no-data flags follow actual row counts; empty forecast is unavailable; simple linear trend is labelled unvalidated; added regression tests | CI and connect a trusted/licensed Tunisian market feed with source lineage before real market claims |
| F14 | Public API key registry was in-memory but accepted a built-in public demo key and issued volatile keys in production | Demo key is loaded only outside production; production key creation fails closed with 503 until persistent, abuse-protected key storage exists; added regression test | CI and implement durable key storage, ownership/consent, revocation and abuse monitoring before enabling production issuance |
| F15 | PublicDataDashboard claimed live market/production/weather data while using a built-in demo key and synthetic endpoints | Restricted auto-refresh and demo key use to development, moved API key from URL query to X-API-Key header, disabled production key creation/refresh and added an explicit bilingual production-unavailable disclosure | CI and replace synthetic public endpoints with licensed feeds plus persistent key management |
| F16 | DB verification helper required the service-role key, called Auth Admin listUsers and pointed to a stale ad-hoc SQL quick fix | Rewrote as read-only anon-scoped schema visibility check; no writes, Auth Admin enumeration, service-role key or auto-SQL guidance | CI/manual development check; live RLS still requires separate two-user tests |
| F17 | Cloud schema stored market_prices.crop_name while API queried crop_id | Added idempotent crop_id compatibility SQL, clean-install schema column/index, legacy crop_name query fallback and CI schema assertion; no guessed backfill | Apply reviewed migration to the target Supabase project and validate crop-name/slug mappings with trusted source records |

**Important verification limitation:** all code edits in this pass were made through the GitHub repository API. No local shell, TypeScript, Jest, pytest, Docker, or live Supabase/Render command was executed in this session. CI must pass on the exact latest PR head before merge. No production secrets were read, no live data was changed, and no hosted deployment or database migration was performed.
