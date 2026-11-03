# 🤖 AgroGrowth AI Services Status

## Current Status: **Operational**

Eight FastAPI microservices live under `agrogrowth-ai/`. They are started by the
Express gateway's service supervisor (or manually, see below) and each answers
`GET /health`. Verified live on this machine: all eight returned `200`.

| # | Service | Dir | Port |
|---|---------|-----|------|
| 1 | 🌱 Soil Analysis | `agrogrowth-ai/soil_analysis` | 8001 |
| 2 | 🌾 Crop Recommendation | `agrogrowth-ai/crop_recommendation` | 8002 |
| 3 | 📸 Image Diagnosis | `agrogrowth-ai/image_diagnosis` | 8003 |
| 4 | 📈 Market Prediction | `agrogrowth-ai/market_prediction` | 8004 |
| 5 | 🧠 Intelligent Agent | `agrogrowth-ai/intelligent_agent` | 8005 |
| 6 | 🐛 Pest Control | `agrogrowth-ai/pest_control` | 8006 |
| 7 | 💧 Irrigation Optimization | `agrogrowth-ai/irrigation_optimization` | 8007 |
| 8 | 🌦️ Weather / Yield Intelligence | `agrogrowth-ai/weather_yield_intelligence` | 8008 |

## How to Start

### Docker (recommended)
```bash
cd agrogrowth-ai
docker compose up -d
```

### Local
```bash
pip install -r agrogrowth-ai/requirements.txt
cd agrogrowth-ai/soil_analysis && python main.py   # repeat per service dir
```

## Verifying
- `GET /api/ai/health` — aggregate gateway health.
- `GET http://localhost:800X/health` — per-service health.
- `GET http://localhost:800X/docs` — per-service OpenAPI docs.
- In-app: `/ai-services-test`.

## Honest Provenance — Read This Before Trusting Any Number

A microservice answering `/health` does **not** mean a trained model produced
its output. Each service reports the origin of its own results, and the gateway
propagates that label to the SPA:

- **`model_source: "heuristic-demo"` / `dataSource: "heuristic"` /
  `isRealData: false`** — the result came from deterministic image/feature
  heuristics or a reference table. It is a *plausible* analysis, not a trained
  model's inference. The UI must disclose this (see
  `client/components/SimulatedDataNotice.tsx`,
  `client/components/market/MarketProvenanceNotice.tsx`).
- **Market prices** are synthesised because no licensed feed is configured. The
  gateway stamps `X-Data-Provenance: simulated` and a disclaimer; screens render
  `MarketProvenanceNotice` off that header.
- **Weather** is genuine: fetched from Open-Meteo (no key required), with
  OpenWeatherMap as an optional fallback, labelled `source.isRealData`.

Nothing in the platform may present heuristic or synthetic output as a real
measurement. When a provider is unconfigured, the honest response is a labelled
fallback or an explicit failure — never a fabricated success.

## Production Deployment

For production the AI services should be containerized, health-monitored, load
balanced, and secured with authentication. LLM-backed features additionally
require provider credentials (see the LLM provider env vars in
`server/services/providers/`); without them the platform falls back to labelled
rule-based reasoning rather than pretending inference succeeded.
