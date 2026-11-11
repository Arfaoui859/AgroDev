# AgroGrowth — AI Microservices Deployment Guide

This guide describes the eight FastAPI services that currently exist in the
repository. It does not claim that every service has a validated ML model or
that all eight are currently deployed on Render.

## 1. Service inventory

| Service | Python package | Local port | Current provenance |
|---|---|---:|---|
| Soil Analysis | soil_analysis | 8001 | Deterministic sensor analysis; separate AFSIS lab-assisted ML artifacts, not field/Tunisia validated |
| Crop Recommendation | crop_recommendation | 8002 | Synthetic-demo recommender; deterministic financial rules |
| Image Diagnosis | image_diagnosis | 8003 | Heuristic image analysis; optional configured multimodal vision provider |
| Market Prediction | market_prediction | 8004 | Synthetic-demo forecast; no licensed live Tunisian price feed |
| Intelligent Agent | intelligent_agent | 8005 | LLM only when a provider/model is configured |
| Weather / Yield Intelligence | weather_yield_intelligence | 8006 | Synthetic-demo yield/planning engine; weather observations are a separate provider |
| Pest Control | pest_control | 8007 | Synthetic-demo numeric engine; optional LLM advisory |
| Irrigation Optimization | irrigation_optimization | 8008 | Synthetic-demo numeric engine; optional LLM advisory |

The port assignments are unique and match scripts/start-ai-services.sh,
docker-compose.yml and the Node gateway. Do not reassign ports in an individual
service without updating every manifest, gateway URL and regression test.

## 2. Run locally

### Requirements

- Python 3.11 recommended (the CI workflow uses Python 3.11).
- A virtual environment at agrogrowth-ai/.venv.
- Dependencies from agrogrowth-ai/requirements.txt.
- curl for health checks.

From the repository root:

```bash
python3 -m venv agrogrowth-ai/.venv
agrogrowth-ai/.venv/bin/pip install -r agrogrowth-ai/requirements.txt
bash scripts/start-ai-services.sh
```

Check health:

```bash
bash scripts/start-ai-services.sh --check
```

Stop only the processes started by the helper:

```bash
bash scripts/start-ai-services.sh --stop
```

Logs are written to /tmp/agrogrowth-ai/ by default. Override the directory with
AGRO_AI_LOG_DIR. The script starts all services on 127.0.0.1 and does not require
provider credentials to launch; provider-backed capabilities remain unavailable
until correctly configured.

## 3. Run one service manually

From the repository root, with dependencies installed:

```bash
cd agrogrowth-ai
PORT=8001 python -m uvicorn soil_analysis.main:app --host 127.0.0.1 --port 8001
```

Replace the package and port using the service inventory above. For API schema
inspection, open the local service's /docs endpoint.

## 4. Docker

The root docker-compose.yml contains the current service definitions. Review
resource limits and environment variables before starting all containers:

```bash
docker compose config
docker compose up -d --build
docker compose ps
docker compose logs -f soil-analysis
```

The Compose setup may also start the database/cache containers. Do not assume
that those containers represent the live Supabase project used by production.
Use docker compose down only when you intend to stop the local Compose stack.

## 5. Node gateway integration

The browser must call the Node/Express API gateway only. The Node gateway resolves
private microservice URLs from server-side environment variables:

- SOIL_ANALYSIS_URL
- CROP_RECOMMENDATION_URL
- IMAGE_DIAGNOSIS_URL
- MARKET_FORECAST_URL (alias: MARKET_PREDICTION_URL)
- SMART_ASSISTANT_URL (alias: INTELLIGENT_AGENT_URL)
- WEATHER_YIELD_INTELLIGENCE_URL (alias: SMART_MARKETPLACE_URL)
- PEST_CONTROL_URL
- IRRIGATION_OPTIMIZATION_URL

For local development these normally resolve to localhost ports 8001–8008.
For Render, use the private service host/port references from render.yaml. Do not
put private microservice URLs in VITE_* variables or call private services from
the browser.

## 6. Health and inference verification

Each service exposes /health. A 200 response means the service process is
reachable; it does not establish model training or agronomic accuracy.

After startup:
1. Run the helper's --check command.
2. Call GET /health for each service.
3. Send one valid and one invalid request to each inference API.
4. Check model_source, isRealModel and modelTrainedOnSyntheticData.
5. Confirm the Node gateway returns honest unavailable errors when a service is
   down, and that the frontend does not substitute fabricated results.
6. Keep all synthetic-demo, heuristic and LLM-advisory disclosures visible.

See AI_SERVICES_STATUS.md for the detailed service-by-service evidence and
AGROGROWTH_REMEDIATION_MASTER_PLAN.md for remaining data and validation gates.
