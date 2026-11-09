# AgroGrowth AI Services — Evidence-Based Status

**Source audit date:** 2026-11-09  
**Scope:** repository implementation and committed artifacts on feat/soil-analysis-professional-report.  
**Important:** this is a source-level audit, not a live Render health check. A running FastAPI process or a configured LLM key does not prove that a trained model or real dataset powers a result.

## Executive summary

AgroGrowth has eight Python AI service codebases. Their maturity is mixed:

- **Soil Analysis:** seven real supervised regression artifacts exist for *laboratory-assisted analyte estimation*. The regular farmer-facing soil screening endpoint is still deterministic rules. The trained models are not Tunisia- or field-validated, and their dedicated endpoint is not yet integrated into the professional report workflow.
- **Plant Disease:** a MobileNetV3-Large ONNX artifact with 38 PlantVillage classes exists. The repository includes claimed test metrics, but no reproducible training/evaluation script or independent field-image validation was found in this service directory. Other leaf-health and nutrition outputs remain heuristic.
- **Crop Recommendation, Market Prediction, Weather/Yield, Pest Control and Irrigation:** current numeric engines are synthetic, deterministic, or rule-based. Optional LLM advisory text does not turn those numeric engines into trained predictive models.
- **Intelligent Agent:** LLM-backed chat is available when a provider is configured; planning and alert components must be treated as rule-based unless a separately validated model is demonstrated.
- **Market data:** no licensed, live Tunisian market-price feed is configured in the current implementation. Synthetic forecast output must not be used as real market quotes.

## Service inventory

| Service | Current numeric engine | Evidence / limitation | Production claim |
|---|---|---|---|
| Soil Analysis (8001) | Deterministic soil screening + 7 lab-assisted regressors | Real AfSIS wet-chemistry training artifacts; no Tunisia/field validation; /predict-lab-soil not wired into the professional report yet | Mixed maturity |
| Crop Recommendation (8002) | Synthetic in-process training / deterministic rules | crop_recommender.py creates synthetic training data; no verified Tunisia field dataset or trained production artifact | Not a field-validated ML model |
| Image Diagnosis (8003) | MobileNetV3-Large ONNX for 38 PlantVillage classes, with heuristic fallback | Model artifacts and metrics exist; training pipeline/split reproducibility and Tunisia field performance are unverified; leaf nutrition/quick checks are heuristic | Real model artifact, limited validation |
| Market Prediction (8004) | Synthetic forecast and supply-demand calculations | Source explicitly labels output synthetic-demo; no licensed live market feed | Demo/placeholder numeric engine |
| Intelligent Agent (8005) | Configurable LLM chat + rule-based planning/alerts | LLM is only active when credentials/provider are configured; numeric agronomic claims need grounded data and source citations | LLM assistant, not a predictive ML model |
| Pest Control (8006) | Deterministic symptom/rule engine | Optional LLM narrative; no trained pest classifier artifact or field evaluation evidenced | Rule-based |
| Irrigation Optimization (8007) | Deterministic water/scheduling calculations | Optional LLM explanation; no measured irrigation/yield dataset or validated optimizer artifact evidenced | Rule-based |
| Weather / Yield Intelligence (8008) | Models trained on generated synthetic data | Service code explicitly documents synthetic runtime training and synthetic-demo provenance | Synthetic model; not field validated |

## Soil Analysis — actual trained model inventory

### Dataset and provenance

The committed training candidate report identifies:

- afsis_wetchem: 2,157 reference samples.
- afsis_spectral: 47,026 spectral-derived samples.
- Production training uses the wet-chemistry reference subset, not the spectral-derived values as independent laboratory ground truth.
- The production training report records 2,134 eligible 0–20 cm topsoil rows and synthetic_data_used: false.
- Validation: 5-fold GroupKFold using 0.25-degree spatial groups. The report explicitly records spatial_buffer: false.
- Geographic extent is across the African dataset; it does not establish Tunisia-specific validation.

The iSDA open soil dataset is published under CC BY 4.0. iSDA states that its African dataset combines wet-chemistry and mid-infrared measurements, with roughly 10% wet chemistry and 90% spectral measurements. AgroGrowth's current training-candidate report correctly keeps the wet-chemistry reference subset separate from spectral-derived observations.

Dataset references:
- https://www.isda-africa.com/isdasoil/open-soil-data/
- https://www.isda-africa.com/posts/2023-03-16-soil-data-release/
- DOI: https://doi.org/10.17605/OSF.IO/A69R5

### Model metrics in the committed manifest

These are repository-reported out-of-fold metrics, not independently reproduced in this audit.

| Target | Estimator | R² | MAE | RMSE | OOF samples |
|---|---|---:|---:|---:|---:|
| pH | Random Forest | 0.527 | 0.238 | 0.302 | 2,133 |
| Organic carbon | Random Forest | 0.865 | 1.594 | 4.019 | 2,134 |
| Total nitrogen | Extra Trees | 0.832 | 0.106 | 0.152 | 2,110 |
| Electrical conductivity | Random Forest | 0.469 | 0.134 | 0.172 | 2,109 |
| Extractable phosphorus | Extra Trees | 0.337 | 2.339 | 3.771 | 2,110 |
| Extractable potassium | Extra Trees | 0.627 | 25.425 | 37.044 | 2,134 |
| Extractable zinc | HistGradientBoosting | 0.448 | 0.222 | 0.286 | 2,110 |

**Interpretation:** organic carbon and total nitrogen are the strongest reported targets. Phosphorus, zinc and electrical conductivity have materially weaker reported R² values. The app must show target-specific metrics and limitations; it must not turn these estimates into fertilizer prescriptions.

### Correct input units

The iSDA analytical metadata/FAQ specifies organic carbon and total nitrogen in g/kg, not mg/kg. Extractable nutrients are generally mg/kg (ppm), electrical conductivity is dS/m, and pH is measured in a 1:1 soil-water suspension. The repository's metadata validation script now applies explicit unit overrides for organic carbon, total carbon and total nitrogen; the original downloaded metadata file is preserved.

Do not map the user-facing organicMatter percentage directly to carbon_organic: organic matter and organic carbon are different quantities.

### Current integration gap

- POST /predict-lab-soil exists in the FastAPI soil service.
- It loads one artifact at a time and requires at least 80% feature coverage for each target.
- GET /lab-models/status exposes artifact availability and metrics without loading all models.
- The Express professional report route currently uses an LLM advisory and explicitly reports mlPrediction: not-available.
- The professional report flow does not yet call /predict-lab-soil; therefore the presence of artifacts does not mean farmers are receiving ML predictions in the report.
- The normal /analyze-soil endpoint remains a deterministic screening engine and must retain that provenance.

### Deployment compatibility

The model manifest records scikit-learn 1.9.1 and joblib 1.6.0. The Soil service in render.yaml now installs soil_analysis/requirements-ml.txt so the deployment dependency versions match the committed model artifacts. Rebuild/redeploy is still required before claiming the deployed service uses those artifacts. Do not apply SQL or deploy automatically as part of this source audit.

## Plant disease model — evidence and gaps

The repository contains:

- MobileNetV3-Large transfer-learning model artifacts in agrogrowth-ai/image_diagnosis/models/plant_disease_v1/.
- ONNX and PyTorch model files.
- A 38-class label map and preprocessing metadata.
- A metrics JSON claiming 10,948 test samples, accuracy 0.9968 and macro-F1 0.9926, plus ONNX parity.

The metrics are repository artifacts, not a reproducible independent evaluation in this audit. The model's named dataset is PlantVillage. Before field deployment, add the exact train/validation/test split manifest, reproducible training/evaluation script, per-class confusion analysis, calibration/abstention tests, and a Tunisia/MENA field-image test set. PlantVillage-style curated images do not prove robustness to field lighting, backgrounds, camera quality or mixed symptoms.

The detector may fall back to feature heuristics if ONNX loading/inference fails. The API must expose the actual engine used per request; service-level health metadata must not label a loaded ONNX engine as heuristic or label an uninitialized engine as a trained model.

## Priority roadmap

1. **Finish Soil Analysis first:** verify unit contracts; add unit/method validation to lab inference; expose model metrics and per-target prediction status; connect lab-assisted inference to the professional report only when sufficient valid lab inputs exist; preserve deterministic screening and LLM advisory as separate provenance layers.
2. **Soil geospatial enrichment:** add iSDAsoil location lookups for African fields with prediction uncertainty, and a global fallback such as SoilGrids where coverage/API conditions permit. Label map-derived estimates separately from lab measurements and local ML inference.
3. **Soil validation in Tunisia:** collect consented, georeferenced Tunisian lab samples; reserve governorates/sites for a true external holdout; report MAE/RMSE/R² and uncertainty by soil type/region; do not claim Tunisia validation before this is done.
4. **Image Diagnosis:** make ONNX loading/inference and health provenance consistent; reproduce training/evaluation; collect a representative Tunisian field validation set; implement confidence calibration and abstention.
5. **Crop Recommendation:** replace synthetic training with documented public/partner data; separate agronomic suitability from yield/profit estimates; require real soil/climate/crop inputs and show evidence per recommendation.
6. **Weather/Yield:** use historical observed weather and verified yield observations; validate temporal and geographic holdouts. Do not use synthetic-trained models for farmer yield forecasts.
7. **Market Prediction:** connect a lawful, timestamped Tunisian market-price source; until then show no real price forecast. Separate actual observed prices from model forecasts.
8. **Pest and Irrigation:** keep rule engines transparent until they have validated labeled pest observations and measured water/soil/crop outcome datasets.
9. **Agent orchestration:** use the services as tools with explicit input provenance, timeout/failure isolation, trace IDs and source-grounded synthesis. A natural-language LLM response must not upgrade the provenance of the numeric tools it summarizes.

## Release gates

A service is not production AI merely because it returns HTTP 200. For every model-backed capability, release evidence must include:

- dataset name, source URL/DOI, license, collection period, geographic scope and hash;
- exact preprocessing and feature units/methods;
- training code, model artifact checksum and dependency versions;
- leakage-aware validation split and baseline comparison;
- target-specific metrics, uncertainty/calibration and known limitations;
- service health metadata and per-request provenance;
- integration tests proving the frontend displays the same provenance;
- external field validation before claiming Tunisia readiness.
