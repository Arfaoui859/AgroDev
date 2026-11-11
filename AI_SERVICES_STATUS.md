# AgroGrowth AI Services — Evidence-Based Status

**Last code audit:** 2026-11-11  
**Repository:** `Arfaoui859/AgroDev`  
**Remediation branch:** `fix/agrogrowth-ci-and-production-gaps-2026-11-11`  
**Base branch:** `feat/ai-integration-production-hardening`

> **Important:** This file describes the implementation found in the repository. It is
> not a live Render health certificate. A service returning HTTP 200 from `/health`
> proves reachability, not that a trained model produced an inference. Use
> `GET /api/ai/health` for the current deployment's reachability and declared
> model provenance.

## 1. Eight deployed service definitions

The repository inventory, Docker Compose, service Dockerfiles, and gateway agree on
these default ports:

| # | Service | Directory | Port | Current inference provenance in code |
|---|---|---|---:|---|
| 1 | Soil Analysis | `soil_analysis` | 8001 | Deterministic rules for ordinary sensor analysis; separate laboratory-assisted ML route |
| 2 | Crop Recommendation | `crop_recommendation` | 8002 | `synthetic-demo` recommender; deterministic financial calculations |
| 3 | Image Diagnosis | `image_diagnosis` | 8003 | Heuristic leaf/health analysis; optional configured multimodal vision provider for disease diagnosis |
| 4 | Market Prediction | `market_prediction` | 8004 | `synthetic-demo`; no licensed live market-price feed is configured in the code |
| 5 | Intelligent Agent | `intelligent_agent` | 8005 | Configured LLM provider when credentials are present; otherwise provider fallback |
| 6 | Weather / Yield Intelligence | `weather_yield_intelligence` | 8006 | Yield/planning output labelled `synthetic-demo` |
| 7 | Pest Control | `pest_control` | 8007 | Numeric pest model labelled `synthetic-demo`; optional LLM advisory |
| 8 | Irrigation Optimization | `irrigation_optimization` | 8008 | Numeric irrigation model labelled `synthetic-demo`; optional LLM advisory |

The Node gateway probes all eight services at `/health`. The gateway's health
response distinguishes reachability, non-ML engines, and synthetic-trained models.
A deterministic/rule-based engine is **not** a trained ML model and is **not** the
same thing as a model trained on synthetic data.

## 2. Soil Analysis — actual model status

### Ordinary farmer/sensor analysis
- `POST /analyze-soil` uses the deterministic `SoilAnalyzerAI` rules engine.
- It labels the measurement source as `user_supplied_input`.
- This endpoint does **not** invoke the seven laboratory-assisted ML models.
- Soil image analysis is deterministic visual inspection; it is not a trained
  soil-image classifier.

### Laboratory-assisted ML
Seven committed model artifacts exist under
`soil_analysis/models/production/`:

| Target | Model | Spatial OOF R² | MAE | RMSE |
|---|---|---:|---:|---:|
| pH | Random Forest | 0.527 | 0.238 | 0.302 |
| Organic carbon | Random Forest | 0.865 | 1.594 | 4.019 |
| Total nitrogen | Extra Trees | 0.832 | 0.106 | 0.152 |
| Electrical conductivity | Random Forest | 0.469 | 0.134 | 0.172 |
| Extractable phosphorus | Extra Trees | 0.337 | 2.339 | 3.771 |
| Extractable potassium | Extra Trees | 0.627 | 25.425 | 37.044 |
| Extractable zinc | HistGradientBoosting | 0.448 | 0.222 | 0.286 |

Training provenance in `models/production/training_report.json`:
- Dataset: `AFSIS wetchem` reference measurements.
- Original rows: 2,157; rows after 0–20 cm depth filter: 2,134.
- Synthetic data used: `false`.
- Evaluation: 5-fold GroupKFold with 0.25-degree spatial groups.
- No spatial exclusion buffer.
- All seven models explicitly report `field_validated: false` and
  `tunisia_validated: false`.
- Prediction scope: `lab_assisted_only`.

**Important limitation:** these models require the full set of laboratory analyte
features. The inference contract now requires 100% feature coverage because the
saved tree models do not include a validated missing-value imputation pipeline.
Partial panels return `insufficient_input`; they must not be silently imputed or
presented as a completed prediction.

The model metrics are spatial cross-validation metrics on the reference dataset,
not field-trial accuracy, not Tunisian validation, and not proof of fertilizer
recommendation effectiveness.

## 3. Other AI service limitations

- **Crop recommendation:** the recommender declares `synthetic-demo`. Profit
  estimates are deterministic financial calculations and must be treated as
  estimates, not verified farm profitability. The service README's old claims of
  model performance should not be used as evidence.
- **Image diagnosis:** a MobileNetV3-Large ONNX classifier and PyTorch checkpoint are committed for PlantVillage (38 classes). The committed test report records 10,948 samples, accuracy 0.9968 and macro-F1 0.9926. These are PlantVillage test metrics, not Tunisian field validation. The service explicitly falls back to heuristic analysis when ONNX Runtime or the model artifact is unavailable. The Render Blueprint now installs the service-specific ONNX Runtime dependency; verify disease_classifier_loaded and disease_classifier_source after deployment.
- **Market prediction:** no licensed live Tunisian price feed is present. Forecasts
  and supply-demand outputs are labelled synthetic. A populated market database
  and a trusted price source are still required.
- **Intelligent agent:** true LLM output depends on provider credentials and the
  configured model. Without them, rule-based/provider fallback is not an LLM
  inference.
- **Weather / yield:** the Python yield model declares synthetic training data.
  The separate Node weather provider can fetch real Open-Meteo weather; this does
  not make synthetic yield estimates real.
- **Pest control / irrigation:** their numeric outputs declare synthetic training
  data. Optional LLM narration does not turn synthetic numeric predictions into
  real measurements.

## 4. Multi-agent orchestration — v1

The Intelligent Agent service (8005) now exposes POST /orchestrate, with the Node
gateway route POST /api/ai/assistant/orchestrate and a frontend hook method.
The allow-listed specialist registry covers soil, crop, image diagnosis, market,
weather, yield, pest and irrigation. A configured LLM selects relevant tools
using JSON mode; the application validates and dispatches only registered tools.

Tool arguments must be supplied explicitly in tool_inputs. The LLM does not
invent sensor readings, lab values, market prices, weather or farm measurements.
Missing required fields are returned to the caller. Calls are bounded to five
concurrent tools, use configured private service URLs and timeouts, and return
per-agent status, duration and provenance. Image uploads use multipart form data
through the Node gateway and are converted for the private Python service.

This is orchestration v1 with explicit dependency references and sequential
execution waves. The caller defines bindings such as a soil result field feeding
the crop request; the LLM does not invent those downstream values. See
Existing AIAssistantChatbot and SmartAdvisor chat screens still use their
legacy chat endpoints; the new hook is exposed for screens that have collected
the required structured inputs. Do not switch a chat UI until it can collect
missing measurements safely. See MULTI_AGENT_ORCHESTRATOR_USAGE.md and
MULTI_AGENT_READINESS_AUDIT_2026-11-11.md for request contracts, boundaries and
remaining production acceptance gates.

## 5. Frontend provenance and reporting

The frontend already contains simulated-data disclosures on several demo-backed
screens. The audit additionally corrected:
- The AI service status page now reads the authoritative `/api/ai/health`
  response, maps capability cards to the actual eight service keys, and displays
  model provenance.
- The cloud status page now renders the actual `overview`, `services`, and
  `llm` response shape rather than treating nested objects as status strings.
- Deterministic rules are classified as non-ML without falsely claiming that they
  were trained on synthetic data.
- The effectiveness report page no longer seeds fake historical farm records or
  hardcoded chart series. Its score is explicitly rule-based; authenticated
  per-user GET/POST persistence and `database/effectiveness-reports.sql` were
  added. Apply the migration and configure the server-side Supabase secret to
  enable durable storage.
- The livestock breeding screen no longer generates a random genetic compatibility
  percentage when no validated pedigree/genomic engine is connected.

Other demo-backed screens remain visibly labelled as illustrative rather than live
records. They still need real database/API integrations before they can be treated
as operational workflows.

## 6. Security and operational guardrails added in the remediation branch

- Browser Supabase configuration no longer contains a project URL or anon JWT fallback. The build requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY; without them the client does not silently connect to an embedded project.
- Legacy demo-account provisioning, fixed demo credentials and auth-debug endpoints are retired. Authenticated requests to those legacy routes receive HTTP 410 after the admin-token gate; unauthenticated requests remain denied.
- The old Supabase diagnostic endpoint that inserted and deleted a probe row in public.users has been retired. Use read-only health/capability probes for deployment monitoring.
- The seed script that generated random market-price rows has been removed. Never populate market_prices with random/example prices and then expose them as market observations.
- The database verification script now requires an explicit SUPABASE_URL and server-side SUPABASE_SERVICE_ROLE_KEY; it no longer defaults to a historical project URL.
- Authentication initialization stops cleanly when the browser Supabase variables are missing and signup/signin return an explicit configuration error.
- AI inference and file uploads in the browser now use the Node API gateway only; old hardcoded Railway/Render browser endpoints were removed. Cloud service health is obtained from the gateway's eight-service health contract.
- Browser mock soil-analysis fallback is removed. The API's explicit deterministic rule-based path may still answer when available; an unavailable API now surfaces an error instead of manufacturing a local result.
- Generic mock UI data can only be enabled by an explicit VITE_FALLBACK_TO_MOCK=true in a development build; it is disabled by default and cannot be enabled in production.
- The Public Data API's deterministic market/production/weather endpoints are demo-only and carry simulated provenance headers. Its built-in demo key is loaded only outside production; production key issuance returns 503 until a durable, abuse-protected key store is implemented.
- PublicDataDashboard does not auto-fetch synthetic data or offer API key issuance in production; the page explicitly discloses its demo-only state.

These changes remove unsafe defaults and accidental demo-data mutation paths. They do not verify the live Supabase project or the currently deployed Render environment.

## 6. How to verify a live deployment

1. Call `GET /api/ai/health` on the deployed AgroGrowth API.
2. Check all eight service entries and their `status` fields.
3. Inspect `modelSource`, `isRealModel`, and
   `modelTrainedOnSyntheticData`; do not infer model status from HTTP 200.
4. Test each inference route with valid and invalid payloads.
5. Confirm the matching UI screen displays the same provenance and handles 503,
   4xx, timeout, and empty-data responses.
6. Run backend/frontend tests and the Python service suite before deploying.

**Live Render verification was not completed during this code audit.** This report
therefore makes no claim that all eight deployed URLs are currently online.

## Input-integrity hardening (2026-11-10)

The following Python services now reject empty requests instead of silently substituting example farm conditions:

- **Crop recommendation:** temperature, annual rainfall, soil pH, soil quality, water availability, current market price, farmer experience, available capital, farm size and risk tolerance are required before the Python microservice is called. The Node gateway validates these fields and uses its separately labelled rule-based fallback when any are missing.
- **Weather / yield:** location coordinates, historical/current weather, soil measurements, crop and farm size are required. Empty seasonal/yield requests now receive FastAPI 422 validation responses rather than a default 35°N/10°E location, default Tunisian weather, assumed soil, or one-hectare farm.
- **Irrigation:** crop, growth stage, farm size, measured weather and soil moisture/field-capacity inputs are required; default weather and soil profiles were removed.
- **Pest control:** crop, symptoms, affected area/count, total plant count, plant age/health, weather, farm size, plant density and irrigation frequency are required; default tomato/plant-health/weather values were removed.

These changes improve input integrity; they do not change the numeric engines' current synthetic-demo provenance or establish agronomic accuracy. The weather/yield, irrigation and pest numeric engines remain synthetic and must not be marketed as field-validated ML.

## Weather provider commercial readiness

Production weather requests now require the licensed Open-Meteo customer endpoint via the server-only `OPEN_METEO_API_KEY`. The free public endpoint is non-commercial only; the historical archive used by Weather & Yield requires the Professional plan or higher. If the key/plan is absent, weather endpoints return an explicit 503 rather than calling the free endpoint or fabricating weather. `WeatherYieldPlanner` now fetches its weather context from the authenticated backend endpoint and reports weather-provider provenance separately from the synthetic yield model.
