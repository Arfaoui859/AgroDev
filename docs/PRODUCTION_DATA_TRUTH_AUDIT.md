# AgroGrowth Production Data & AI Truth Audit

**Audit date:** 2026-11-09  
**Branch:** `feat/soil-analysis-professional-report`  
**Policy:** no synthetic, mock, seeded, hard-coded, or unverified values may be presented as live observations, validated predictions, financial facts, or treatment advice.

## Release rule

- A service returning HTTP 200 or passing a health check does not prove its outputs are production-ready.
- Unknown model provenance fails closed.
- Synthetic/demo/fixture-backed API groups return HTTP 503 with a stable error code and `productionReady: false`.
- Deterministic rules may only be exposed when clearly labelled as rules, not trained ML. They do not establish that the underlying measurements are verified.
- Trained model inference is not the same as field validation. Dataset provenance, units, geographic scope, evaluation, and limitations must accompany results.
- Test fixtures remain allowed in tests. They must never be used as production defaults.

## Services and current release gates

| Service / capability | Current evidence | Production decision |
|---|---|---|
| Soil Analysis screening | Deterministic rules over supplied values; not a trained soil-property model | Keep only as transparent screening; measurements remain user-supplied/unverified |
| Soil lab-assisted ML | Seven trained estimators using iSDA/AfSIS wet-chemistry subset, 0–20 cm; 5-fold spatial GroupKFold | Research/lab-assisted only; units/method/depth/date contract and Tunisia validation remain outstanding |
| Soil image analysis | Deterministic visual statistics; no trained soil-image classifier | Do not describe as trained image AI |
| Plant disease image diagnosis | PlantVillage ONNX classifier artifacts exist; heuristic fallback is not a trained diagnosis | Keep trained classifier only when artifact/runtime is verified; fallback must remain explicitly heuristic; Tunisia field validation outstanding |
| Crop recommendation | Existing recommender was trained on generated synthetic samples; quick endpoint injected default farmer/resource values | Endpoints disabled with HTTP 503 |
| Crop profitability / comparison | Embedded prices and cost assumptions have no verified source/date/region evidence | Endpoints disabled with HTTP 503 |
| Market prediction | No licensed timestamped market-price feed; synthetic forecasts, sample production, sample prices and placeholder alerts existed | Forecast, supply/demand, conditions, history and alerts disabled with HTTP 503 |
| Weather / yield intelligence | Weather planner and yield predictor train on synthetic data; climate suitability/planting endpoints used hard-coded simulated climate | Predictions and simulated climate/yield endpoints disabled with HTTP 503; real weather provider remains separate |
| Pest control | Synthetic model output, fabricated confidence, mock treatment and schedule existed; image path is heuristic | Diagnosis/treatment/schedule/severity/image endpoints disabled; symptom keyword match is labelled rules-only and not field validated |
| Irrigation optimization | Synthetic optimizer; fixed weather values and mock context existed | Synthetic schedule, water calculations, soil-moisture assessment and mock tips disabled with HTTP 503 |
| Water-use analytics | No metered irrigation telemetry; figures were fixed illustrative baselines | Endpoint disabled; require real meter/sensor records |
| Fixture-backed business modules | Seeded in-memory records for dashboards, investor/trader, logistics, marketplace, SaaS, supply-chain, alerts/tasks, livestock, gamification, and other modules | Router groups blocked with HTTP 503 until real persistence/data sources are connected |
| Notifications and sensor fleet | Static notification/rule arrays and fixed demo sensor readings | Notifications, rules, stats, send, sensors and real-time telemetry endpoints blocked with HTTP 503 until persistent records or a real device broker exist |
| Public data API | Seeded demo API key and generated market, production, export, weather and statistics values | Public generated datasets and demo key-info endpoint blocked with HTTP 503; real public weather remains separately sourced |
| Adaptive AI dashboards | Static model catalogue, insights, behavior events, personalized recommendations and feedback | Mock-backed model/insight/behavior/recommendation/feedback APIs blocked with HTTP 503; no fake training endpoint is exposed |
| Fertilizer / pesticide catalogue | Hard-coded supplier names, prices, product composition, dosage, and safety claims without verified catalogue provenance | Fertilizer endpoints blocked with HTTP 503; require official product registrations, labels, sources, and dates |
| Financial management | In-memory sample expenses, revenues, and budget records | Expense/revenue/profitability/summary/budget routes blocked with HTTP 503 until user-scoped database persistence exists |
| Smart advisor / treatment history | Mock recommendation generation and in-memory treatment history | Routes blocked with HTTP 503 until evidence-backed data and persistent storage exist |
| Open-Meteo weather | External weather provider is configured in the platform; provider limits/outages can occur | Serve provider-backed data only; return unavailable on provider failure, never substitute generated weather |

## Changes in this audit

- Added a fail-closed middleware for fixture-backed router groups. It stamps the response as simulated-disabled and returns HTTP 503 rather than allowing synthetic records to render.
- Blocked the synthetic market, crop recommendation, weather/yield, pest-treatment, and irrigation outputs at their service endpoints.
- Removed unreachable mock implementations behind the disabled service endpoints.
- Changed health responses for synthetic services to `degraded` and `production_ready: false`.
- Changed the generic AI gateway so unreachable, unknown-provenance, and synthetic services cannot be labelled as real model output.
- Kept symptom keyword matching only as an explicitly labelled rules-based helper; it is not a trained classifier or confirmed diagnosis.
- Removed obsolete Express demo and demo-user provisioning routes, plus scripts that inserted random market prices and created accounts with fixed demo passwords.
- Blocked mock-backed fertilizer, financial, livestock, gamification, smart-advisor, treatment-history, notification, sensor, public-data, and adaptive-AI routes.
- Removed the in-memory notification/sensor implementation, generated public market/production/export/weather datasets, demo API key, ephemeral API-key creation, and static adaptive-AI catalogue/insights/behavior/feedback stores. Their route contracts now fail closed.
- Admin dashboard endpoints now authenticate first and then return an explicit unavailable response; authentication is not bypassed by the simulated-data guard.
- Removed fabricated zeroes and epoch timestamps from missing crop reference metadata; unknown numeric fields are now omitted.
- Replaced tests that expected demo payloads with fail-closed contract tests.

## Remaining work before production release

1. **Audit every API route and frontend fallback** against this policy; this pass covers known fixture-backed groups and the identified AI services, not every line of the entire repository.
2. Connect Supabase-backed persistence for farmer/farm/field records, dashboards, notifications, alerts, marketplace, logistics, and analytics; remove seeded IDs and static records from runtime paths.
3. Connect a licensed Tunisian market data source with currency, unit, region, collection timestamp, and provenance. Do not infer current prices from constants.
4. Train crop recommendation, weather/yield, pest, and irrigation models only on documented real datasets; record dataset hashes, splits, baselines, external tests, model cards, and calibration.
5. Collect Tunisian lab/field observations and perform geographically held-out validation before making Tunisia-specific agronomic claims.
6. Validate every measurement's units, analytical method, sample depth, date, and laboratory source before soil ML inference.
7. Add contract tests for every disabled feature and verify all frontend components display unavailable states rather than zeroes, cached demo values, or silent fallbacks.
8. Run the complete CI suite, service container builds, live Render health checks, and authenticated Supabase/RLS checks. CI alone does not prove live production availability.
9. Only after approval, deploy the validated branch and verify the deployed commit and live endpoints.

## Important scope boundary

This audit does not delete test fixtures or development-only fixtures. It blocks known fixture-backed production API groups and removes obsolete demo provisioning routes. It does not modify production Supabase records, credentials, Render configuration, or deploy services.
