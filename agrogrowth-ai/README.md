# AgroGrowth AI Infrastructure

This directory contains the eight FastAPI services used by the AgroGrowth Node
gateway. The service inventory and current provenance are documented in
[AI_SERVICES_STATUS.md](../AI_SERVICES_STATUS.md).

## Actual service inventory

| Service | Directory | Default port | Current model/data status |
|---|---|---:|---|
| Soil analysis | `soil_analysis` | 8001 | Deterministic sensor rules; seven separate laboratory-assisted ML artifacts |
| Crop recommendation | `crop_recommendation` | 8002 | Synthetic-demo recommender; deterministic profit arithmetic |
| Image diagnosis | `image_diagnosis` | 8003 | Heuristic leaf analysis; optional configured vision provider |
| Market prediction | `market_prediction` | 8004 | Synthetic-demo forecasts; no licensed live price feed |
| Intelligent agent | `intelligent_agent` | 8005 | Configured LLM provider when credentials are present |
| Weather / yield intelligence | `weather_yield_intelligence` | 8006 | Synthetic-demo yield model |
| Pest control | `pest_control` | 8007 | Synthetic-demo numeric model; optional LLM advisory |
| Irrigation optimization | `irrigation_optimization` | 8008 | Synthetic-demo numeric model; optional LLM advisory |

## Run locally

From the repository root:

```bash
bash scripts/start-ai-services.sh
bash scripts/start-ai-services.sh --check
```

Or run the service containers with the repository's root `docker-compose.yml`.
The Node/Express backend should call the Python services through its gateway;
the browser should not call private Render services directly.

## Provenance rules

- `isRealModel: true` means the service declares a configured real model/provider;
  it does not establish agronomic accuracy.
- `modelTrainedOnSyntheticData: true` means the service declares synthetic
  training/demo data.
- `deterministic-rules` and `heuristic-demo` are not trained ML inference.
- Weather from Open-Meteo is a real external observation; synthetic yield
  estimates remain synthetic.
- A reachable `/health` endpoint does not prove that an inference model is trained
  or that its result is validated.

Never remove provenance disclaimers unless the underlying dataset, model
validation, and live inference path have been independently verified.
