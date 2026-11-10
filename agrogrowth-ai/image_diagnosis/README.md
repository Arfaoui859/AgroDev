# Image Diagnosis Service

FastAPI service for plant disease image requests, leaf screening, and combined
plant-health analysis.

## Current provenance

- Leaf scanning and quick health checks use deterministic feature/colour
  heuristics; they are not CNN inference.
- The base disease detector can use a configured multimodal vision provider.
  Without a configured provider, the result must remain labelled heuristic or
  unavailable.
- Combined plant-health scores are deterministic aggregation of heuristic
  components, not an independently trained model.
- A successful image pipeline call does not establish agronomic accuracy.
  Validation requires a labelled, crop-balanced dataset with a held-out test set.

## Endpoints

- `POST /detect-disease` — disease diagnosis request.
- `POST /analyze-leaf` — leaf screening.
- `POST /analyze-plant` — combined plant analysis.
- `POST /quick-health-check` — heuristic health screening.
- `GET /supported-diseases` — supported reference labels.
- `GET /analysis-capabilities` — current engine capabilities.
- `GET /health` — reachability and provenance.

Images are limited to 10 MB. The service must not present heuristic probabilities
as calibrated model confidence. Seek agronomist confirmation before treatment.

Default port: 8003. OpenAPI docs: `/docs`.
