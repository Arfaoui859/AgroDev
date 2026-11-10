# AgroGrowth AI Services — Evidence-Based Status

**Last code audit:** 2026-11-10  
**Repository:** `Arfaoui859/AgroDev`  
**Branch:** `feat/ai-integration-production-hardening`

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
- **Image diagnosis:** heuristic leaf scanning is not CNN inference. Disease
  diagnosis can use the configured multimodal vision provider, but agronomic
  accuracy still requires a labelled, representative leaf-image evaluation set.
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

## 4. Frontend provenance and reporting

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
  hardcoded chart series. Its score is explicitly described as rule-based and
  session-only; it is not yet persisted to Supabase.
- The livestock breeding screen no longer generates a random genetic compatibility
  percentage when no validated pedigree/genomic engine is connected.

Other demo-backed screens remain visibly labelled as illustrative rather than live
records. They still need real database/API integrations before they can be treated
as operational workflows.

## 5. How to verify a live deployment

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
