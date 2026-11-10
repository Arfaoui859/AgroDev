# Market Prediction Service

FastAPI service for agricultural price forecasting and supply-demand analysis.

## Current provenance and limitations

- The service explicitly labels its forecast and supply-demand outputs
  `synthetic-demo` / `synthetic-model`.
- No licensed, live Tunisian agricultural price feed is configured in this
  repository.
- The service's historical accuracy claims are not backed by a verified
  time-based holdout evaluation in the current repository.
- Results are demonstrations and must not be used as real market quotes,
  investment advice, or farmer price guarantees.
- A live data source, timestamped price history, unit/market normalization,
  leakage-safe backtesting, and uncertainty calibration are required before
  production forecasting.

## Endpoints

- `POST /forecast-price`
- `POST /analyze-supply-demand`
- `GET /market-conditions/{crop_type}`
- `GET /historical/{crop_type}`
- `GET /supported-crops`
- `POST /price-alert`
- `GET /health`

Default port: 8004. OpenAPI docs: `/docs`.
