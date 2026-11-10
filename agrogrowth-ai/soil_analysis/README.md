# Soil Analysis Service

FastAPI service for soil screening, climate/crop matching, visual soil inspection,
and a separate laboratory-assisted ML prediction endpoint.

## Endpoints and honest scope

| Endpoint | Engine | What it does |
|---|---|---|
| `POST /analyze-soil` | `deterministic-rules` | Screens farmer/sensor measurements; does not invoke the seven lab ML models |
| `POST /match-crops` | Rule-based climate/soil matching | Scores crop suitability from the built-in reference rules |
| `POST /diagnose-image` | Deterministic visual analysis | Colour/texture observations; not a trained soil-image classifier |
| `POST /predict-lab-soil` | Seven trained regressors | Laboratory-assisted estimates only; complete feature panel required |
| `GET /lab-models/status` | Metadata | Model manifest, scope and readiness |
| `GET /health` | Health/provenance | Service reachability and declared engine sources |

## Laboratory-assisted ML models

The committed production artifacts predict seven laboratory analytes:
pH, organic carbon, total nitrogen, electrical conductivity, extractable
phosphorus, extractable potassium, and extractable zinc.

Training provenance:
- Reference data: AFSIS wetchem.
- Original dataset: 2,157 rows; 2,134 after the 0–20 cm depth filter.
- Evaluation: five-fold GroupKFold with 0.25-degree spatial groups.
- No synthetic data used for these seven model artifacts.
- Not field-validated and not Tunisia-validated.
- Prediction scope: `lab_assisted_only`.

The saved estimators do not include a validated missing-value imputation pipeline.
Therefore the API requires **100% of each model's input features**. A partial
laboratory panel returns `insufficient_input` rather than passing NaN values to a
tree estimator or inventing missing analytes.

The cross-validation scores are not field-trial accuracy. See
`models/production/training_report.json` and
`models/production/manifest.json` for per-target metrics and provenance.

## Example

```bash
curl -X POST http://localhost:8001/predict-lab-soil \
  -H "Content-Type: application/json" \
  -d '{"lab_values":{"aluminium_extractable":1.0,"boron_extractable":0.1,"calcium_extractable":100.0,"carbon_organic":1.2,"copper_extractable":1.0,"electrical_conductivity":0.5,"iron_extractable":10.0,"magnesium_extractable":50.0,"manganese_extractable":5.0,"nitrogen_total":0.8,"ph":6.5,"phosphorus_extractable":5.0,"potassium_extractable":100.0,"sodium_extractable":10.0,"sulphur_extractable":5.0,"zinc_extractable":1.0}}'
```

**Important:** The example values are request-shape placeholders, not a real soil
sample and not expected output. Use actual laboratory measurements with the units
and methods expected by the source dataset.

## Run

```bash
python main.py
```

OpenAPI docs: `/docs`. Health: `/health`.
