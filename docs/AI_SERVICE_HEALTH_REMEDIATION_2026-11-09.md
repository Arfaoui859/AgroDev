# AgroGrowth AI Service Health — Remediation Notes (2026-11-09)

## Observed production dashboard

The operator dashboard reported 0/8 available services:
- Soil Analysis, Crop Recommendation, Image Diagnosis and Smart Assistant returned HTTP 429 from their configured health URLs.
- Market Forecast, Weather/Yield, Pest Control and Irrigation Optimization had no runtime URL configured.
- Gemini was configured, but that does not prove that the eight microservices are reachable or that their outputs are validated.

An HTTP 429 from `/health` means the target host returned a rate-limit response. It proves a response was received, but it does **not** prove that inference works or reveal the model provenance. Keep these services unavailable for inference until a successful health response and provenance are obtained.

## Code changes on `feat/soil-analysis-professional-report`

- The AI health API now reports `reachableServices` separately from `availableServices`. HTTP 429 is counted as reachable but remains unavailable for inference.
- The service-provenance probe preserves reachability for HTTP 429 but leaves `modelSource` unknown. The gateway continues to fail closed when provenance is unknown.
- Deterministic rule engines are classified as `rule-based`, not as trained ML models. Synthetic/demo engines remain separately identified.
- The AI dashboard now shows reachable hosts separately and labels deterministic rule engines honestly.
- The frontend no longer defaults to retired Railway service URLs. Cloud URLs must be explicitly configured; an empty URL does not trigger a request to the app's own `/health` path.
- Mock fallback is opt-in via `VITE_FALLBACK_TO_MOCK=true`; the default is off.

## Render runtime variables still requiring verification

Set these on the **main AgroGrowth web service** only after confirming the actual deployed service URLs in Render:

| Capability | Environment variable accepted by the gateway |
|---|---|
| Market Forecast | `MARKET_FORECAST_URL` or `MARKET_PREDICTION_URL` |
| Weather & Yield | `WEATHER_YIELD_INTELLIGENCE_URL` or `SMART_MARKETPLACE_URL` |
| Pest Control | `PEST_CONTROL_URL` |
| Irrigation Optimization | `IRRIGATION_OPTIMIZATION_URL` |

Do not substitute guessed hostnames. The repository's `render.yaml` contains Blueprint service references, but the runtime dashboard showed these four values as unconfigured; verify that the referenced Render services actually exist and that the Blueprint environment links were applied. The main web service branch was subsequently changed to `feat/soil-analysis-professional-report`; this config change still requires a Render Blueprint sync and successful deployment.

The four configured endpoints observed in the dashboard on this date were:
- `https://ai-soil-analysis.onrender.com`
- `https://ai-crop-recommendation-exsj.onrender.com`
- `https://agrogrowth-image-diagnosis.onrender.com`
- `https://agrodev-4.onrender.com`

Their HTTP 429 health responses must be investigated in the corresponding Render service logs and rate-limit configuration. Do not classify them as healthy inference services based only on the host response.

## Verification status

- GitHub source changes were committed to this feature branch.
- Automated tests have **not** been executed from this editing session.
- The latest reported Vercel checks failed with a Vercel build-rate-limit status; this is not a passing build and does not establish a source-code failure.
- No Render deployment or runtime environment variables were changed by these GitHub commits.
