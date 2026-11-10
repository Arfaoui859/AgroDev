# Crop Recommendation Service

FastAPI service for crop suitability ranking, financial calculations, and crop
comparison.

## Current provenance

- The crop recommender declares `model_source: synthetic-demo`. Its model
  outputs are not trained on verified Tunisian field observations.
- Profit estimates use deterministic financial calculations and are not
  measurements of realized farm profit.
- An optional configured LLM can provide advisory narration; narration does not
  change the provenance of the numeric recommender output.
- Do not use the historical README accuracy claims as validated performance
  metrics. No representative Tunisian holdout evaluation is documented here.

## Endpoints

- `POST /recommend` — crop recommendations.
- `POST /estimate-profit` — deterministic financial estimate.
- `POST /compare` — compare supplied crop candidates.
- `POST /quick-recommendation` — compact recommendation.
- `GET /supported-crops` — supported crop reference.
- `GET /crop-details/{crop_name}` — crop reference details.
- `GET /health` — reachability and model provenance.

## Run

```bash
python main.py
```

OpenAPI docs: `/docs`. Default port: 8002.
